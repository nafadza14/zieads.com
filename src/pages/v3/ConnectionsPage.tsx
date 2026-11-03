/*
  Connections (spec 7.9, P0-2, P0-4).
  Organic: Instagram, Facebook Pages, TikTok, LinkedIn through each platform's OAuth.
  Paid ads: read-only API access is in review, so the Manual import (CSV) is the path for now.
  Every card shows status, last sync, granted permissions and token expiry, with Reconnect and Disconnect.
*/
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Download, KeyRound, Link2, RefreshCw, Upload } from 'lucide-react';
import V3Layout from '../../components/v3/V3Layout';
import { Button, Card, LoadingState, PageBody, PageHeader, Pill } from '../../components/v3/ui';
import SocialIcon from '../../components/v3/SocialIcon';
import { useDemoMode } from '../../lib/demoStore';
import { sampleConnections } from '../../data/sample-data';
import { api, authHeaders } from '../../lib/api';
import { PLATFORMS, Platform } from '../../lib/platforms';
import { refreshConnections } from '../../lib/connectionsStore';
import './connections.css';

type OrganicId = string;
type AdsId = 'meta_ads' | 'google_ads' | 'tiktok_ads';

// The 12 networks, in the order they come live (src/lib/platforms.ts). Soon ones show a Soon label.
const ORGANIC = PLATFORMS.map((p) => ({ ...p, icon: p.id }));

const ADS: Array<{ id: AdsId; name: string; icon: string }> = [
  { id: 'meta_ads', name: 'Meta Ads', icon: 'meta' },
  { id: 'google_ads', name: 'Google Ads', icon: 'googleads' },
  { id: 'tiktok_ads', name: 'TikTok Ads', icon: 'tiktok' },
];

const COMING_SOON = ['LinkedIn Ads', 'Google Business Profile'];

const ERROR_TEXT: Record<string, string> = {
  denied: 'You cancelled the connection. Nothing was changed.',
  csrf: 'The connection link expired. Try again.',
  no_pages: 'Your Facebook account does not manage any Page. Create a Page or ask for full control of one, then connect again.',
  invalid_callback: 'The platform sent an incomplete response. Try again.',
  exchange_failed: 'the sign in did not finish.',
};

interface Conn {
  platform: string;
  connected: boolean;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  account_type?: string;
  connected_at?: string;
  token_expires_at?: string | null;
  scopes?: string;
  status?: 'live' | 'needs_reconnect' | 'error' | 'revoked';
  last_error?: string | null;
  last_synced_at?: string | null;
  declined_permissions?: string[];
  page_count?: number;
}

const ago = (iso?: string | null) => {
  if (!iso) return 'not synced yet';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
};

export function expiryInfo(iso?: string | null): { days: number; level: 'ok' | 'soon' | 'expired' } | null {
  if (!iso) return null;
  const days = Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
  return { days, level: days < 0 ? 'expired' : days <= 7 ? 'soon' : 'ok' };
}

export default function ConnectionsPage() {
  const demo = useDemoMode();
  const navigate = useNavigate();
  const [conns, setConns] = useState<Record<string, Conn>>({});
  const [ads, setAds] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ tone: 'good' | 'bad' | 'warn'; text: string; action?: { label: string; to: string } } | null>(null);
  const fromOnboarding = !!(useLocation().state as any)?.fromOnboarding;
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [pagePicker, setPagePicker] = useState<{ pages: any[]; selected: string | null } | null>(null);
  const [importFor, setImportFor] = useState<AdsId | null>(null);
  const [formFor, setFormFor] = useState<Platform | null>(null);

  const load = async () => {
    if (demo.isActive) {
      const map: Record<string, Conn> = {};
      sampleConnections.forEach((c) => (map[c.platform] = { platform: c.platform, connected: true, username: c.account_handle, status: 'live', last_synced_at: new Date().toISOString() }));
      setConns(map);
      setLoading(false);
      return;
    }
    try {
      const [list, adsStatus] = await Promise.all([api<Conn[]>('/api/auth/connections'), api('/api/v3/ads/status').catch(() => ({ platforms: {} }))]);
      const map: Record<string, Conn> = {};
      (Array.isArray(list) ? list : []).forEach((c) => (map[c.platform] = c));
      setConns(map);
      setAds(adsStatus.platforms || {});
      refreshConnections();
    } catch (e: any) {
      setBanner({ tone: 'bad', text: `Could not load connections: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo.isActive]);

  // Result of an OAuth round trip comes back as query parameters
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const connected = p.get('connected');
    const error = p.get('error');
    if (connected) {
      const name = ORGANIC.find((o) => o.id === connected)?.name || connected;
      const missing = p.get('missing');
      setBanner(
        missing
          ? { tone: 'warn', text: `${name} is connected, but these permissions were switched off: ${missing.replace(/,/g, ', ')}. Publishing needs them. Reconnect and keep every permission on.` }
          : { tone: 'good', text: `${name} is connected. Zie is reading it and building your first briefing.`, action: { label: 'See your briefing', to: '/analyst' } }
      );
      if (connected === 'facebook' && p.get('choose_page')) openPagePicker();
    } else if (error) {
      const [platform, ...rest] = error.split('_');
      const key = rest.join('_');
      const name = ORGANIC.find((o) => o.id === platform)?.name || platform;
      const detail = p.get('detail');
      setBanner({ tone: 'bad', text: `${name}: ${ERROR_TEXT[key] || `the connection failed (${key.replace(/_/g, ' ')}). Try again or contact support.`}${detail ? ` ${detail}` : ''}` });
    }
    if (connected || error) window.history.replaceState({}, document.title, window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async (id: OrganicId) => {
    if (demo.isActive) return setBanner({ tone: 'warn', text: 'Exit demo mode to connect your own accounts.' });
    const def = PLATFORMS.find((p) => p.id === id);
    // Telegram, Discord, Bluesky and Mastodon ask for a channel, webhook, app password or server first
    if (def?.connect === 'form' || def?.connect === 'oauth_form') return setFormFor(def);
    setBusy(id);
    try {
      const j = await api<{ url: string }>(`/api/auth/${id}/connect`, { body: {} });
      window.location.href = j.url;
    } catch (e: any) {
      setBanner({ tone: 'bad', text: e.message });
      setBusy(null);
    }
  };

  const disconnect = async (id: string) => {
    setBusy(id);
    try {
      await api(`/api/auth/${id}/disconnect`, { body: {} });
      setConfirmDisconnect(null);
      setBanner({ tone: 'good', text: `${ORGANIC.find((o) => o.id === id)?.name || id} is disconnected and the data ZieAds stored from it was deleted.` });
      await load();
    } catch (e: any) {
      setBanner({ tone: 'bad', text: e.message });
    } finally {
      setBusy(null);
    }
  };

  async function openPagePicker() {
    try {
      const j = await api('/api/auth/facebook/pages');
      setPagePicker({ pages: j.pages || [], selected: j.selected });
    } catch (e: any) {
      setBanner({ tone: 'bad', text: e.message });
    }
  }

  const choosePage = async (pageId: string) => {
    setBusy('facebook');
    try {
      const j = await api('/api/auth/facebook/pages/select', { body: { page_id: pageId } });
      setPagePicker(null);
      setBanner({ tone: 'good', text: `Zie now manages the Page ${j.page.name}.` });
      await load();
    } catch (e: any) {
      setBanner({ tone: 'bad', text: e.message });
    } finally {
      setBusy(null);
    }
  };

  const syncFacebook = async () => {
    setBusy('facebook-sync');
    try {
      const r = await api('/api/v3/facebook/sync', { body: {} });
      setBanner({ tone: 'good', text: `Facebook synced: ${r.posts} posts and ${r.comments} comments checked.` });
      await load();
    } catch (e: any) {
      setBanner({ tone: 'bad', text: e.message });
    } finally {
      setBusy(null);
    }
  };

  const liveCount = useMemo(() => ORGANIC.filter((o) => conns[o.id]?.connected).length, [conns]);

  const renderOrganic = (o: (typeof ORGANIC)[number]) => {
    if (o.status === 'soon') {
      return (
        <Card key={o.id} className="zcn-card is-soon">
          <div className="zcn-head">
            <span className="zcn-brand">
              <SocialIcon platform={o.icon} size={26} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="zcn-name">{o.name}</div>
              <div className="zcn-type">{o.what}</div>
            </div>
            <span className="zcn-status">
              <Pill tone="neutral">Soon</Pill>
            </span>
          </div>
          <div className="zcn-foot">
            <Button variant="secondary" full disabled>
              Soon
            </Button>
          </div>
        </Card>
      );
    }
    const c = conns[o.id];
    const on = !!c?.connected;
    const status = c?.status || 'live';
    const exp = expiryInfo(c?.token_expires_at);
    const needsReconnect = on && (status === 'needs_reconnect' || status === 'revoked' || exp?.level === 'expired');
    const scopes = (c?.scopes || '').split(/[ ,]+/).filter(Boolean);
    return (
      <Card key={o.id} className={`zcn-card ${on ? 'is-on' : ''}`}>
        <div className="zcn-head">
          <span className="zcn-brand">
            <SocialIcon platform={o.icon} size={26} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="zcn-name">{o.name}</div>
            <div className="zcn-type">{o.what}</div>
          </div>
          <span className="zcn-status">
            <Pill tone={!on ? 'neutral' : needsReconnect ? 'bad' : status === 'error' ? 'warn' : 'good'}>{!on ? 'Not connected' : needsReconnect ? 'Needs reconnect' : status === 'error' ? 'Error' : 'Live'}</Pill>
          </span>
        </div>
        <div className="zcn-foot">
          {on ? (
            <>
              <div className="zcn-acct">
                {c.avatar_url ? <img src={c.avatar_url} alt="" className="zcn-avatar" onError={(e) => ((e.target as HTMLElement).style.display = 'none')} /> : <CheckCircle size={14} className="zcn-check" />}
                <span className="zcn-acct-handle">{c.display_name || c.username}</span>
                {c.account_type && <span className="zcn-meta">{c.account_type.toLowerCase()}</span>}
              </div>
              <dl className="zcn-facts">
                <dt>Last sync</dt>
                <dd>{ago(c.last_synced_at)}</dd>
                <dt>Permissions</dt>
                <dd title={scopes.join(', ')}>{scopes.length ? `${scopes.length} granted` : 'reported by the platform'}</dd>
                {exp && (
                  <>
                    <dt>Access</dt>
                    <dd>{exp.level === 'expired' ? 'expired' : `renews in ${exp.days} days`}</dd>
                  </>
                )}
              </dl>
              {(c.last_error || exp?.level === 'soon' || (c.declined_permissions || []).length > 0 || (o.id === 'instagram' && c.account_type?.toLowerCase() === 'personal')) && (
                <div className="zcn-warn" role="status">
                  <AlertTriangle size={13} />
                  <span>
                    {c.last_error ||
                      (exp?.level === 'soon'
                        ? `Access ends in ${exp.days} days. ZieAds renews it automatically; if that fails you will get a reconnect link.`
                        : (c.declined_permissions || []).length
                          ? `Switched off: ${c.declined_permissions!.join(', ')}. Reconnect to turn them on.`
                          : 'Personal accounts do not share comments or insights. Switch to a Business or Creator account in Instagram, then reconnect.')}
                  </span>
                </div>
              )}
              <div className="zcn-actions-row">
                <Button size="sm" variant={needsReconnect ? 'primary' : 'secondary'} icon={<RefreshCw size={14} />} onClick={() => connect(o.id)} loading={busy === o.id}>
                  Reconnect
                </Button>
                {o.id === 'facebook' && (c.page_count || 0) > 1 && (
                  <Button size="sm" variant="secondary" onClick={openPagePicker}>
                    Switch Page
                  </Button>
                )}
                {o.id === 'facebook' && (
                  <Button size="sm" variant="ghost" onClick={syncFacebook} loading={busy === 'facebook-sync'}>
                    Sync now
                  </Button>
                )}
                {confirmDisconnect === o.id ? (
                  <Button size="sm" variant="danger" onClick={() => disconnect(o.id)} loading={busy === o.id}>
                    Confirm disconnect
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDisconnect(o.id)} disabled={demo.isActive}>
                    Disconnect
                  </Button>
                )}
              </div>
              {confirmDisconnect === o.id && <p className="zcn-note">Disconnecting deletes the posts, comments and insights ZieAds stored from {o.name}.</p>}
            </>
          ) : (
            <Button variant="soft" full icon={<Link2 />} onClick={() => connect(o.id)} loading={busy === o.id}>
              Connect {o.name}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const renderAds = (a: (typeof ADS)[number]) => {
    const s = ads[a.id] || {};
    return (
      <Card key={a.id} className="zcn-card">
        <div className="zcn-head">
          <span className="zcn-brand">
            <SocialIcon platform={a.icon} size={26} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="zcn-name">{a.name}</div>
            <div className="zcn-type">Read only</div>
          </div>
          <span className="zcn-status">
            <Pill tone={s.imported_rows ? 'good' : 'neutral'}>{s.imported_rows ? 'Manual import' : 'Not connected'}</Pill>
          </span>
        </div>
        <div className="zcn-foot">
          <dl className="zcn-facts">
            <dt>API access</dt>
            <dd>In review with {a.name.split(' ')[0]}</dd>
            <dt>Imported</dt>
            <dd>{s.imported_rows ? `${s.imported_rows} rows, ${s.first_date} to ${s.last_date}` : 'nothing yet'}</dd>
          </dl>
          <div className="zcn-actions-row">
            <Button size="sm" variant="soft" icon={<Upload size={14} />} onClick={() => setImportFor(a.id)}>
              Manual import (CSV)
            </Button>
            <a className="zd-btn is-ghost is-sm" href="/api/v3/ads/template" download>
              <Download size={14} />
              <span className="zd-btn-text">Template</span>
            </a>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <V3Layout>
      <PageHeader number="08" label="Connections" title="Connections" subtitle="Official connections only. Disconnecting deletes that data." />
      <PageBody>
        {banner && (
          <div className={`zcn-banner tone-${banner.tone}`} role="status">
            {banner.tone === 'good' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{banner.text}</span>
            {banner.action && (
              <Button size="sm" variant="secondary" onClick={() => navigate(banner.action!.to)}>
                {banner.action.label}
              </Button>
            )}
            <button type="button" className="zd-icon-btn" onClick={() => setBanner(null)} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
        {fromOnboarding && !banner && (
          <div className="zcn-banner tone-good" role="status">
            <CheckCircle size={16} />
            <span>Your brand is saved. Connect Instagram or Facebook and Zie builds your first briefing in about a minute.</span>
            <Button size="sm" variant="ghost" onClick={() => navigate('/analyst')}>
              Skip for now
            </Button>
          </div>
        )}
        {loading ? (
          <LoadingState text="Loading connections" />
        ) : (
          <>
            <section>
              <div className="zcn-group-head">
                <h2>Organic social media</h2>
                <span className="zd-eyebrow">
                  {liveCount} of {ORGANIC.length} connected · {ORGANIC.filter((o) => o.status === 'soon').length} coming soon
                </span>
              </div>
              <div className="zd-grid-2">{ORGANIC.map(renderOrganic)}</div>
            </section>

            <section>
              <div className="zcn-group-head">
                <h2>Paid ads, read only</h2>
                <span className="zd-eyebrow">Read only. ZieAds never changes campaigns or budgets.</span>
              </div>
              <div className="zd-grid-3">{ADS.map(renderAds)}</div>
            </section>

            <section>
              <div className="zcn-group-head">
                <h2>AI assistants</h2>
              </div>
              <Card className="zcn-card zcn-mcp">
                <div className="zcn-head">
                  <span className="zcn-brand">
                    <KeyRound size={22} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="zcn-name">ZieAds MCP server</div>
                    <div className="zcn-type">Use your briefing, calendar, inbox and analytics from Claude, ChatGPT or Cursor. Write actions wait for your approval.</div>
                  </div>
                  <span className="zcn-status">
                    <Button size="sm" variant="secondary" onClick={() => navigate('/settings/api')}>
                      Set up MCP
                    </Button>
                  </span>
                </div>
              </Card>
            </section>

            <section>
              <div className="zcn-group-head">
                <h2>Coming soon</h2>
              </div>
              <div className="zcn-soon">
                {COMING_SOON.map((n) => (
                  <span key={n} className="zcn-soon-item">
                    {n}
                  </span>
                ))}
              </div>
            </section>
          </>
        )}
      </PageBody>

      {formFor && (
        <ConnectFormModal
          platform={formFor}
          onClose={() => setFormFor(null)}
          onDone={(text) => {
            setFormFor(null);
            setBanner({ tone: 'good', text, action: { label: 'Create a post', to: '/composer' } });
            load();
          }}
        />
      )}

      {pagePicker && (
        <div className="zcn-overlay" role="dialog" aria-modal="true" aria-label="Choose a Facebook Page">
          <Card className="zcn-modal" padding={26}>
            <div className="zcn-modal-head">
              <span className="zd-icon-dot">
                <SocialIcon platform="facebook" size={18} />
              </span>
              <div>
                <h3>Which Page should Zie manage?</h3>
                <p>One brand uses one Page. You can switch later.</p>
              </div>
            </div>
            <div className="zcn-pages">
              {pagePicker.pages.map((p) => (
                <button key={p.id} type="button" className={`zcn-page ${p.id === pagePicker.selected ? 'is-selected' : ''}`} onClick={() => choosePage(p.id)} disabled={busy === 'facebook'}>
                  {p.picture ? <img src={p.picture} alt="" /> : <span className="zcn-page-dot" />}
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.category || 'Facebook Page'}</small>
                  </span>
                  {p.id === pagePicker.selected && <CheckCircle size={16} />}
                </button>
              ))}
            </div>
            <div className="zcn-actions">
              <Button variant="ghost" onClick={() => setPagePicker(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {importFor && <AdsImportModal platform={importFor} name={ADS.find((a) => a.id === importFor)!.name} onClose={() => setImportFor(null)} onDone={(n) => { setImportFor(null); setBanner({ tone: 'good', text: `Imported ${n} rows. The Ads Analyst and Analytics now read them.` }); load(); }} />}
    </V3Layout>
  );
}

function AdsImportModal({ platform, name, onClose, onDone }: { platform: AdsId; name: string; onClose: () => void; onDone: (n: number) => void }) {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<any | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const readFile = (f: File) => {
    setFileName(f.name);
    setErr('');
    setPreview(null);
    const r = new FileReader();
    r.onload = async () => {
      const text = String(r.result || '');
      setCsv(text);
      setBusy(true);
      try {
        const res = await fetch('/api/v3/ads/import', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ platform, csv: text, dry_run: true }) });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Could not read the file');
        setPreview(j);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    };
    r.readAsText(f);
  };

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      const j = await api('/api/v3/ads/import', { body: { platform, csv } });
      onDone(j.count);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };

  const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <div className="zcn-overlay" role="dialog" aria-modal="true" aria-label={`Manual import for ${name}`}>
      <Card className="zcn-modal is-wide" padding={26}>
        <div className="zcn-modal-head">
          <span className="zd-icon-dot">
            <Upload size={18} />
          </span>
          <div>
            <h3>Manual import: {name}</h3>
            <p>
              Export a daily report from {name} or fill in the <a href="/api/v3/ads/template" download>ZieAds template</a>. Columns: date, campaign, spend, plus impressions, clicks, conversions and revenue if you have them. Importing the same days again replaces them.
            </p>
          </div>
        </div>
        <label className={`zcn-drop ${fileName ? 'has-file' : ''}`}>
          <span className="zcn-drop-icon">
            <Upload size={20} />
          </span>
          <span>{fileName || 'Choose a CSV file'}</span>
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        </label>
        {busy && !preview && <LoadingState text="Reading the file" inline />}
        {preview && (
          <div className="zcn-preview">
            <p>
              <strong>{preview.count} rows</strong> ready. Spend {money(preview.totals.spend)}, {preview.totals.clicks.toLocaleString()} clicks, {money(preview.totals.conversions)} conversions, revenue {money(preview.totals.revenue)}.
            </p>
            {preview.errors?.length > 0 && (
              <p className="zcn-note">
                {preview.errors.length} row{preview.errors.length === 1 ? '' : 's'} skipped, first: line {preview.errors[0].line}, {preview.errors[0].message}
              </p>
            )}
            <div className="zcn-table-wrap">
              <table className="zcn-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Campaign</th>
                    <th>Spend</th>
                    <th>Clicks</th>
                    <th>Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((r: any) => (
                    <tr key={r.line}>
                      <td>{r.date}</td>
                      <td>{r.campaign}</td>
                      <td>{money(r.spend)}</td>
                      <td>{r.clicks}</td>
                      <td>{r.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {err && <p className="zcn-note is-error">{err}</p>}
        <div className="zcn-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!preview || busy} loading={busy && !!preview}>
            Import {preview ? `${preview.count} rows` : ''}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Connect form for networks that need a value first (Telegram, Discord, Bluesky, Mastodon) */
function ConnectFormModal({ platform, onClose, onDone }: { platform: Platform; onClose: () => void; onDone: (text: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (platform.connect === 'oauth_form') {
        const j = await api<{ url: string }>(`/api/auth/${platform.id}/connect`, { body: values });
        window.location.href = j.url;
        return;
      }
      const j = await api(`/api/auth/${platform.id}/credentials`, { body: values });
      onDone(`${platform.name} is connected${j.display_name ? ` as ${j.display_name}` : ''}. It is ready in the Composer.`);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };
  return (
    <div className="zcn-overlay" role="dialog" aria-modal="true" aria-label={`Connect ${platform.name}`}>
      <Card className="zcn-modal" padding={26}>
        <form onSubmit={submit}>
          <div className="zcn-modal-head">
            <span className="zd-icon-dot">
              <SocialIcon platform={platform.id} size={18} />
            </span>
            <div>
              <h3>Connect {platform.name}</h3>
              {platform.howTo && <p>{platform.howTo}</p>}
            </div>
          </div>
          <div className="zcn-form">
            {(platform.fields || []).map((f, i) => (
              <label key={f.key} className="zcn-field">
                <span>
                  {f.label}
                  {f.optional && <em> optional</em>}
                </span>
                <input
                  className="zd-input"
                  type={f.type === 'password' ? 'password' : f.type === 'url' ? 'url' : 'text'}
                  autoComplete="off"
                  autoFocus={i === 0}
                  placeholder={f.placeholder}
                  required={!f.optional}
                  value={values[f.key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
                {f.help && <small>{f.help}</small>}
              </label>
            ))}
          </div>
          {err && (
            <p className="zcn-form-err" role="alert">
              {err}
            </p>
          )}
          <div className="zcn-actions">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {platform.connect === 'oauth_form' ? 'Continue' : `Connect ${platform.name}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
