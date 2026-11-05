/*
  Superadmin dashboard: watch every account, publishing, AI use, revenue and system health.
  Same kit as the user dashboard (dash.css, cards, pills, compact buttons) so it reads as one product.
  Every number comes from /api/superadmin/v1/insights/* (real tables). Accounts only: hidden brand
  workspace users are rolled up into their owner. Sections are linkable with ?tab=.
*/
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CreditCard,
  FileClock,
  LayoutDashboard,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import ZieAdsLogo, { ZieAdsWordmark } from '../../components/ZieAdsLogo';
import SocialIcon from '../../components/v3/SocialIcon';
import { Button, Card, CardTitle, PageHeader, Pill, SegTabs, StatCard, LoadingState } from '../../components/v3/ui';
import { platformName } from '../../lib/platforms';
import '../../components/v3/dash.css';
import './sa.css';

type Tab = 'overview' | 'users' | 'publishing' | 'usage' | 'revenue' | 'health' | 'audit' | 'admins';
const TOKEN_KEY = 'zieads_superadmin_token';
const PROFILE_KEY = 'zieads_superadmin_profile';
const PRICE: Record<string, number> = { free: 0, starter: 29, pro: 79, agency: 199 };
const PLAN_NAME: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' };

const token = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

class SaError extends Error {
  status: number;
  constructor(m: string, s: number) {
    super(m);
    this.status = s;
  }
}

async function sa<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/superadmin/v1${path}`, {
    method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
    headers: { 'x-superadmin-session-token': token(), ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new SaError(j.message || j.error || `Request failed (${res.status})`, res.status);
  return j as T;
}

/* ── Formatting ── */
const nf = new Intl.NumberFormat('en-US');
const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '-' : nf.format(n));
const money = (n: number) => `$${nf.format(Math.round(n * 100) / 100)}`;
function ago(iso?: string | null) {
  if (!iso) return 'Never';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const dt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
const planTone = (p: string): 'neutral' | 'accent' | 'good' | 'dark' => (p === 'agency' ? 'dark' : p === 'pro' ? 'accent' : p === 'starter' ? 'good' : 'neutral');

/* ── Charts: one series per chart, hover shows the value ── */
function Bars({ data, label, color, format = fmt }: { data: Array<{ date: string; value: number }>; label: string; color?: string; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const first = data[0]?.date;
  const last = data[data.length - 1]?.date;
  const short = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
  return (
    <div className="sa-chart" style={color ? ({ ['--sa-c' as any]: color } as any) : undefined}>
      <div className="sa-bars" role="img" aria-label={`${label}: ${data.map((d) => `${short(d.date)} ${format(d.value)}`).join(', ')}`} onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <div key={d.date} className={`sa-bar ${d.value ? '' : 'is-zero'}`} onMouseEnter={() => setHover(i)}>
            <i style={{ height: `${d.value ? Math.max(3, (d.value / max) * 100) : 1}%` }} />
          </div>
        ))}
      </div>
      {hover !== null && data[hover] && (
        <div className="sa-tip" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
          {short(data[hover].date)}: {format(data[hover].value)} {label.toLowerCase()}
        </div>
      )}
      <div className="sa-axis">
        <span>{short(first)}</span>
        <span>Peak {format(max)}</span>
        <span>{short(last)}</span>
      </div>
    </div>
  );
}

function HBars({ rows, color }: { rows: Array<{ key: string; label: ReactNode; value: number; sub?: ReactNode }>; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="sa-empty">Nothing yet.</p>;
  return (
    <div className="sa-hbars" style={color ? ({ ['--sa-c' as any]: color } as any) : undefined}>
      {rows.map((r) => (
        <div key={r.key} className="sa-hbar">
          <span className="sa-hbar-label">{r.label}</span>
          <span className="sa-hbar-track" aria-hidden="true">
            <i style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="sa-hbar-val">
            {fmt(r.value)}
            {r.sub && <small>{r.sub}</small>}
          </span>
        </div>
      ))}
    </div>
  );
}

function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev) return <>{now ? 'First in this window' : 'None yet'}</>;
  const d = Math.round(((now - prev) / prev) * 100);
  return <>{d >= 0 ? `+${d}%` : `${d}%`} vs previous window</>;
}

/* ── Overview ── */
function Overview({ openUser, go }: { openUser: (id: string) => void; go: (t: Tab) => void }) {
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setD(null);
    sa(`/insights/overview?days=${days}`)
      .then((r) => setD(r.data))
      .catch((e) => setErr(e.message));
  }, [days]);
  if (err) return <p className="sa-msg is-bad">{err}</p>;
  return (
    <>
      <div className="sa-toolbar">
        <span className="sa-grow sa-muted sa-small">{d ? `Updated ${ago(d.generated_at)}` : 'Loading'}</span>
        <div style={{ width: 240 }}>
          <SegTabs<'7' | '30' | '90'> size="sm" value={days} onChange={setDays} tabs={[{ id: '7', label: '7 days' }, { id: '30', label: '30 days' }, { id: '90', label: '90 days' }]} />
        </div>
      </div>
      {!d ? (
        <LoadingState text="Reading accounts" />
      ) : (
        <>
          <div className="zd-grid-4">
            <StatCard label="Accounts" value={d.users.total} icon={<Users size={15} />} hint={<>{fmt(d.users.new_in_range)} new · <Delta now={d.users.new_in_range} prev={d.users.new_prev_range} /></>} />
            <StatCard label="Active in 7 days" value={d.users.active_7d} icon={<Activity size={15} />} hint={`${fmt(d.users.active_1d)} today · ${fmt(d.users.active_30d)} in 30 days`} />
            <StatCard label="MRR" raw={money(d.users.mrr)} icon={<CreditCard size={15} />} hint={`${fmt(d.users.paid)} paid · ${d.users.conversion_pct}% of accounts`} />
            <StatCard
              label="Publishing success"
              raw={d.publishing.success_pct === null ? '-' : `${d.publishing.success_pct}%`}
              icon={<Send size={15} />}
              hint={`${fmt(d.publishing.published)} published · ${fmt(d.publishing.failed)} failed`}
              hintTone="muted"
            />
          </div>

          <div className="zd-grid-2">
            <Card>
              <CardTitle sub={`New accounts per day, last ${d.days} days`}>Signups</CardTitle>
              <Bars label="Signups" data={d.signups.map((s: any) => ({ date: s.date, value: s.count }))} />
            </Card>
            <Card>
              <CardTitle sub="From sign up to paying, all time">Activation funnel</CardTitle>
              <HBars
                rows={d.funnel.map((f: any, i: number) => ({
                  key: f.key,
                  label: f.label,
                  value: f.count,
                  sub: i ? `${d.funnel[0].count ? Math.round((f.count / d.funnel[0].count) * 100) : 0}%` : undefined,
                }))}
              />
            </Card>
          </div>

          <Card>
            <CardTitle
              icon={<AlertTriangle size={15} />}
              sub="Failed posts, connections to reconnect, paid accounts gone quiet"
              action={d.attention.length ? <Button size="sm" variant="ghost" onClick={() => go('publishing')}>Publishing details</Button> : undefined}
            >
              Needs attention {d.attention.length ? <Pill tone="bad">{d.attention.length}</Pill> : <Pill tone="good">All clear</Pill>}
            </CardTitle>
            {d.attention.length ? (
              <div className="sa-list">
                {d.attention.slice(0, 12).map((a: any, i: number) => (
                  <div key={i} className="sa-row">
                    <span className={`sa-dot tone-${a.severity}`} />
                    <div className="sa-row-main">
                      <strong>{a.email}</strong>
                      <p>{a.detail}</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => openUser(a.user_id)}>
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sa-empty">Nothing needs you right now.</p>
            )}
          </Card>

          <div className="zd-grid-3">
            <Card>
              <CardTitle sub="Accounts per plan">Plans</CardTitle>
              <HBars rows={['free', 'starter', 'pro', 'agency'].map((p) => ({ key: p, label: PLAN_NAME[p], value: d.users.by_plan[p] || 0, sub: p === 'free' ? undefined : money((d.users.by_plan[p] || 0) * PRICE[p]) }))} />
            </Card>
            <Card>
              <CardTitle sub={`Last ${d.days} days`}>Engagement</CardTitle>
              <dl className="sa-kv">
                <dt>AI Agent messages</dt>
                <dd>{fmt(d.engagement.agent_messages)} from {fmt(d.engagement.agent_users)} accounts</dd>
                <dt>Morning briefings</dt>
                <dd>{fmt(d.engagement.briefings)}</dd>
                <dt>Comments synced</dt>
                <dd>{fmt(d.engagement.comments)}</dd>
                <dt>Replies sent</dt>
                <dd>{fmt(d.engagement.replies)}</dd>
                <dt>MCP and API calls</dt>
                <dd>{fmt(d.engagement.mcp_calls)} from {fmt(d.engagement.mcp_users)} accounts</dd>
                <dt>Active API keys</dt>
                <dd>{fmt(d.engagement.mcp_keys)}</dd>
              </dl>
            </Card>
            <Card>
              <CardTitle sub="Connected accounts and posts published">Networks</CardTitle>
              <HBars
                rows={d.platforms.slice(0, 8).map((p: any) => ({
                  key: p.platform,
                  label: (
                    <>
                      <SocialIcon platform={p.platform} size={16} /> {platformName(p.platform)}
                    </>
                  ),
                  value: p.connected,
                  sub: `${fmt(p.published)} posts`,
                }))}
              />
              <p className="sa-muted sa-small" style={{ marginTop: 12 }}>
                {fmt(d.workspaces.extra_brands)} extra brand workspaces across {fmt(d.workspaces.multi_brand_accounts)} accounts
              </p>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

/* ── Users ── */
function UsersTab({ openUser }: { openUser: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState('all');
  const [segment, setSegment] = useState('all');
  const [sort, setSort] = useState('created');
  const [page, setPage] = useState(1);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    // Search waits for a short pause in typing
    const t = window.setTimeout(() => setQuery(q), 300);
    return () => window.clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [query, plan, segment, sort]);
  useEffect(() => {
    const p = new URLSearchParams({ search: query, plan, segment, sort, page: String(page), limit: '25' });
    sa(`/insights/users?${p}`)
      .then(setD)
      .catch((e) => setErr(e.message));
  }, [query, plan, segment, sort, page]);
  const pages = d ? Math.max(1, Math.ceil(d.total / d.limit)) : 1;
  return (
    <>
      <div className="sa-toolbar">
        <input className="sa-search" placeholder="Search email, business or id" aria-label="Search accounts" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="sa-select" aria-label="Segment" value={segment} onChange={(e) => setSegment(e.target.value)}>
          <option value="all">All accounts</option>
          <option value="attention">Needs attention</option>
          <option value="new">New this week</option>
          <option value="active">Active in 7 days</option>
          <option value="inactive">Inactive 30 days</option>
          <option value="paid">Paid</option>
          <option value="no_connection">No account connected</option>
          <option value="banned">Suspended</option>
        </select>
        <select className="sa-select" aria-label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="all">Every plan</option>
          {Object.keys(PLAN_NAME).map((p) => (
            <option key={p} value={p}>
              {PLAN_NAME[p]}
            </option>
          ))}
        </select>
        <select className="sa-select" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="created">Newest first</option>
          <option value="last_seen">Last seen</option>
          <option value="plan">Plan value</option>
          <option value="posts">Most posts</option>
          <option value="connections">Most accounts</option>
          <option value="agent">Most AI use</option>
        </select>
        <span className="sa-grow" />
        <span className="sa-muted sa-small">{d ? `${fmt(d.total)} accounts` : ''}</span>
      </div>
      {err && <p className="sa-msg is-bad">{err}</p>}
      {!d ? (
        <LoadingState text="Loading accounts" />
      ) : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Plan</th>
                <th>Networks</th>
                <th className="sa-num">Brands</th>
                <th className="sa-num">Posts 30d</th>
                <th className="sa-num">AI 30d</th>
                <th>Last seen</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.data.map((u: any) => (
                <tr key={u.id} className="is-click" onClick={() => openUser(u.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openUser(u.id)}>
                  <td>
                    <span className="sa-email">{u.email}</span>
                    <span className="sa-sub">{u.name || 'No business name yet'}</span>
                  </td>
                  <td>
                    <Pill tone={planTone(u.plan)}>{PLAN_NAME[u.plan] || u.plan}</Pill>
                  </td>
                  <td>
                    {u.platforms.length ? (
                      <span className="sa-icons">
                        {u.platforms.slice(0, 6).map((p: string) => (
                          <SocialIcon key={p} platform={p} size={16} />
                        ))}
                      </span>
                    ) : (
                      <span className="sa-muted">None</span>
                    )}
                  </td>
                  <td className="sa-num">{u.brands}</td>
                  <td className="sa-num">
                    {fmt(u.published_30d)}
                    {u.failed_30d ? <span className="sa-sub" style={{ color: 'var(--zd-bad)' }}>{u.failed_30d} failed</span> : null}
                  </td>
                  <td className="sa-num">{fmt(u.agent_30d)}</td>
                  <td>{ago(u.last_seen)}</td>
                  <td>{date(u.created_at)}</td>
                  <td>
                    {u.banned ? <Pill tone="bad">Suspended</Pill> : u.attention.length ? <Pill tone="warn">{u.attention[0]}</Pill> : <Pill tone="good">OK</Pill>}
                  </td>
                </tr>
              ))}
              {!d.data.length && (
                <tr>
                  <td colSpan={9} className="sa-empty">
                    No accounts match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {d && pages > 1 && (
        <div className="sa-pager">
          <span>
            Page {page} of {pages}
          </span>
          <span className="sa-actions">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </span>
        </div>
      )}
    </>
  );
}

/* ── One account ── */
function UserDrawer({ id, role, onClose }: { id: string; role: string; onClose: () => void }) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [plan, setPlan] = useState('');
  const [credits, setCredits] = useState('10');
  const [note, setNote] = useState('');
  const load = useCallback(() => {
    sa(`/insights/users/${id}`)
      .then((r) => {
        setD(r.data);
        setPlan(r.data.account.plan);
      })
      .catch((e) => setErr(e.message));
  }, [id]);
  useEffect(() => {
    load();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [load, onClose]);
  const act = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    setMsg('');
    setErr('');
    try {
      await fn();
      setMsg(ok);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  };
  const a = d?.account;
  return (
    <>
      <div className="sa-drawer-back" onClick={onClose} />
      <aside className="sa-drawer" role="dialog" aria-modal="true" aria-label="Account details">
        <div className="sa-drawer-head">
          <div>
            <h2>{a?.email || 'Loading'}</h2>
            {a && (
              <span className="sa-sub">
                Joined {date(a.created_at)} · last seen {ago(a.last_seen)} · signs in with {a.provider}
              </span>
            )}
          </div>
          <Button size="sm" variant="ghost" icon={<X size={15} />} aria-label="Close" onClick={onClose} />
        </div>
        <div className="sa-drawer-body">
          {err && <p className="sa-msg is-bad">{err}</p>}
          {msg && <p className="sa-msg">{msg}</p>}
          {!d ? (
            <LoadingState text="Loading account" />
          ) : (
            <>
              <div className="sa-actions">
                <Pill tone={planTone(a.plan)}>{PLAN_NAME[a.plan] || a.plan}</Pill>
                {a.banned ? <Pill tone="bad">Suspended</Pill> : <Pill tone="good">Active</Pill>}
                {!a.confirmed && <Pill tone="warn">Unconfirmed</Pill>}
                <span className="sa-muted sa-small">ID {a.id}</span>
              </div>

              <section className="sa-sec">
                <h3>Business</h3>
                <dl className="sa-kv">
                  <dt>Name</dt>
                  <dd>{d.profile?.business_name || '-'}</dd>
                  <dt>Type</dt>
                  <dd>{d.profile?.business_type || '-'}</dd>
                  <dt>Website</dt>
                  <dd>{d.profile?.primary_url || '-'}</dd>
                  <dt>AI Agent, 30 days</dt>
                  <dd>{fmt(d.usage.agent_messages_30d)} messages</dd>
                  <dt>MCP and API, 30 days</dt>
                  <dd>{fmt(d.usage.mcp_calls_30d)} calls</dd>
                  <dt>Credits left</dt>
                  <dd>{d.credits ? `${fmt(d.credits.ai_chat_daily_remaining)} chat today · ${fmt(d.credits.skill_run_monthly_remaining)} skill runs this month` : '-'}</dd>
                </dl>
              </section>

              <section className="sa-sec">
                <h3>Brands and connected accounts</h3>
                {d.brands.map((b: any) => (
                  <div key={b.id || 'main'} className="sa-brand">
                    <div className="sa-brand-head">
                      <strong>
                        {b.name} {b.is_main && <span className="sa-muted">(Main)</span>}
                      </strong>
                      <span className="sa-muted sa-small">
                        {fmt(b.published)} published · {fmt(b.scheduled)} scheduled{b.failed ? ` · ${b.failed} failed` : ''}
                      </span>
                    </div>
                    {b.connections.length ? (
                      b.connections.map((c: any) => (
                        <div key={c.platform} className="sa-conn">
                          <SocialIcon platform={c.platform} size={16} />
                          <span>{c.platform_username || platformName(c.platform)}</span>
                          {c.status === 'live' ? <Pill tone="good">Live</Pill> : <Pill tone="warn">{c.status}</Pill>}
                          <span className="sa-muted">{c.last_synced_at ? `synced ${ago(c.last_synced_at)}` : ''}</span>
                        </div>
                      ))
                    ) : (
                      <p className="sa-empty" style={{ padding: '8px 0 0' }}>
                        No accounts connected.
                      </p>
                    )}
                  </div>
                ))}
              </section>

              <section className="sa-sec">
                <h3>Recent posts</h3>
                {d.recent_posts.length ? (
                  <div className="sa-list">
                    {d.recent_posts.slice(0, 10).map((p: any) => (
                      <div key={p.id} className="sa-row">
                        <SocialIcon platform={p.platform} size={16} />
                        <div className="sa-row-main">
                          <strong>{(p.caption || 'No caption').slice(0, 80)}</strong>
                          <p>
                            {p.brand} · {p.status} · {dt(p.published_at || p.scheduled_for || p.created_at)}
                            {p.error_message ? ` · ${p.error_message.slice(0, 140)}` : ''}
                          </p>
                        </div>
                        <Pill tone={p.status === 'published' ? 'good' : p.status === 'failed' ? 'bad' : p.status === 'needs_action' ? 'warn' : 'neutral'}>{p.status}</Pill>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sa-empty">No posts yet.</p>
                )}
              </section>

              <section className="sa-sec">
                <h3>Recent activity</h3>
                {d.activity.length ? (
                  <div className="sa-list">
                    {d.activity.slice(0, 12).map((l: any, i: number) => (
                      <div key={i} className="sa-row">
                        <span className="sa-dot" />
                        <div className="sa-row-main">
                          <strong>{l.action}</strong>
                          <p>
                            {l.brand} · by {l.actor} · {dt(l.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sa-empty">No activity logged yet.</p>
                )}
              </section>

              {role !== 'support' && (
                <section className="sa-sec">
                  <h3>Manage</h3>
                  <div className="sa-actions">
                    <select className="sa-select" aria-label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
                      {Object.keys(PLAN_NAME).map((p) => (
                        <option key={p} value={p}>
                          {PLAN_NAME[p]}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="secondary" disabled={plan === a.plan} loading={busy === 'plan'} onClick={() => act('plan', () => sa(`/users/${id}/plan`, { method: 'PATCH', body: { planId: plan } }), `Plan changed to ${PLAN_NAME[plan]}.`)}>
                      Change plan
                    </Button>
                  </div>
                  <div className="sa-actions" style={{ marginTop: 10 }}>
                    <input className="sa-search" style={{ minWidth: 0, width: 90 }} type="number" min={1} max={1000} aria-label="Credits to add" value={credits} onChange={(e) => setCredits(e.target.value)} />
                    <Button size="sm" variant="secondary" loading={busy === 'credits'} onClick={() => act('credits', () => sa(`/users/${id}/credits`, { body: { pool: 'skill_run_monthly', amount: Number(credits) } }), `${credits} skill credits added.`)}>
                      Add skill credits
                    </Button>
                    <Button size="sm" variant="secondary" loading={busy === 'chat'} onClick={() => act('chat', () => sa(`/users/${id}/credits`, { body: { pool: 'ai_chat_daily', amount: Number(credits) } }), `${credits} chat credits added for today.`)}>
                      Add chat credits
                    </Button>
                  </div>
                  {role === 'superadmin' && (
                    <div className="sa-actions" style={{ marginTop: 10 }}>
                      <Button
                        size="sm"
                        variant={a.banned ? 'secondary' : 'danger'}
                        loading={busy === 'ban'}
                        onClick={() => {
                          if (!a.banned && !window.confirm(`Suspend ${a.email}? They will not be able to sign in.`)) return;
                          act('ban', () => sa(`/users/${id}/suspend`, { body: { isSuspended: !a.banned, reason: 'Suspended from the admin dashboard' } }), a.banned ? 'Account restored.' : 'Account suspended.');
                        }}
                      >
                        {a.banned ? 'Restore account' : 'Suspend account'}
                      </Button>
                    </div>
                  )}
                </section>
              )}

              <section className="sa-sec">
                <h3>Notes</h3>
                <textarea className="sa-note" placeholder="Context for the team, for example a support conversation" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="sa-actions" style={{ marginTop: 8 }}>
                  <Button
                    size="sm"
                    disabled={!note.trim()}
                    loading={busy === 'note'}
                    onClick={() =>
                      act('note', () => sa(`/users/${id}/notes`, { body: { note: note.trim() } }), 'Note saved.').then(() => setNote(''))
                    }
                  >
                    Save note
                  </Button>
                </div>
                {d.notes.map((n: any) => (
                  <div key={n.id} className="sa-row">
                    <span className="sa-dot" />
                    <div className="sa-row-main">
                      <strong>{n.note}</strong>
                      <p>{dt(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

/* ── Publishing ── */
function Publishing({ openUser }: { openUser: (id: string) => void }) {
  const [o, setO] = useState<any>(null);
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([sa('/insights/overview?days=30'), sa('/insights/publishing')])
      .then(([a, b]) => {
        setO(a.data);
        setP(b.data);
      })
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="sa-msg is-bad">{err}</p>;
  if (!o || !p) return <LoadingState text="Reading posts" />;
  const list = (rows: any[], empty: string, tone: 'bad' | 'warn') =>
    rows.length ? (
      <div className="sa-list">
        {rows.slice(0, 15).map((r) => (
          <div key={r.id} className="sa-row">
            <span className={`sa-dot tone-${tone}`} />
            <SocialIcon platform={r.platform} size={16} />
            <div className="sa-row-main">
              <strong>{r.email || r.account_id}</strong>
              <p>{r.error_message ? r.error_message.slice(0, 180) : `Due ${dt(r.scheduled_for || r.updated_at)}`}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => openUser(r.account_id)}>
              Open
            </Button>
          </div>
        ))}
      </div>
    ) : (
      <p className="sa-empty">{empty}</p>
    );
  return (
    <>
      <div className="zd-grid-4">
        <StatCard label="Published, 30 days" value={o.publishing.published} icon={<Send size={15} />} />
        <StatCard label="Failed, 30 days" value={o.publishing.failed} hintTone="muted" hint={o.publishing.success_pct === null ? 'No posts yet' : `${o.publishing.success_pct}% success`} />
        <StatCard label="Waiting for the user" value={o.publishing.needs_action} hint="TikTok inbox, video Pins and similar" />
        <StatCard label="Scheduled ahead" value={o.publishing.upcoming} hint={p.overdue.length || p.stuck.length ? `${p.overdue.length} overdue, ${p.stuck.length} stuck` : 'Queue on time'} hintTone="muted" />
      </div>
      <div className="zd-grid-2">
        <Card>
          <CardTitle sub="Posts published per day">Published</CardTitle>
          <Bars label="Published" data={o.publishing.series.map((s: any) => ({ date: s.date, value: s.published }))} />
        </Card>
        <Card>
          <CardTitle sub="Posts that failed after every retry">Failed</CardTitle>
          <Bars label="Failed" color="var(--zd-bad)" data={o.publishing.series.map((s: any) => ({ date: s.date, value: s.failed }))} />
        </Card>
      </div>
      <div className="zd-grid-2">
        <Card>
          <CardTitle sub="Last 14 days, grouped">Why posts fail</CardTitle>
          <HBars color="var(--zd-bad)" rows={p.top_reasons.map((r: any) => ({ key: r.reason, label: <span title={r.reason}>{r.reason}</span>, value: r.count }))} />
        </Card>
        <Card>
          <CardTitle sub="Connected accounts, posts and failures per network, 30 days">Per network</CardTitle>
          <div className="sa-table-wrap" style={{ border: 'none' }}>
            <table className="sa-table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Network</th>
                  <th className="sa-num">Connected</th>
                  <th className="sa-num">To reconnect</th>
                  <th className="sa-num">Published</th>
                  <th className="sa-num">Failed</th>
                </tr>
              </thead>
              <tbody>
                {o.platforms.map((x: any) => (
                  <tr key={x.platform}>
                    <td>
                      <span className="sa-icons">
                        <SocialIcon platform={x.platform} size={16} /> {platformName(x.platform)}
                      </span>
                    </td>
                    <td className="sa-num">{fmt(x.connected)}</td>
                    <td className="sa-num">{fmt(x.reconnect)}</td>
                    <td className="sa-num">{fmt(x.published)}</td>
                    <td className="sa-num">{fmt(x.failed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div className="zd-grid-2">
        <Card>
          <CardTitle sub="Last 14 days">Failed posts</CardTitle>
          {list(p.failed, 'No failed posts.', 'bad')}
        </Card>
        <Card>
          <CardTitle sub="Should have gone out 15 minutes ago or more">Overdue and stuck</CardTitle>
          {list([...p.stuck, ...p.overdue], 'The queue is on time.', 'warn')}
        </Card>
      </div>
    </>
  );
}

/* ── AI and API ── */
function Usage({ openUser }: { openUser: (id: string) => void }) {
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setD(null);
    sa(`/insights/usage?days=${days}`)
      .then((r) => setD(r.data))
      .catch((e) => setErr(e.message));
  }, [days]);
  if (err) return <p className="sa-msg is-bad">{err}</p>;
  return (
    <>
      <div className="sa-toolbar">
        <span className="sa-grow" />
        <div style={{ width: 240 }}>
          <SegTabs<'7' | '30' | '90'> size="sm" value={days} onChange={setDays} tabs={[{ id: '7', label: '7 days' }, { id: '30', label: '30 days' }, { id: '90', label: '90 days' }]} />
        </div>
      </div>
      {!d ? (
        <LoadingState text="Reading usage" />
      ) : (
        <>
          <div className="zd-grid-4">
            <StatCard label="AI Agent messages" value={d.totals.agent} icon={<Bot size={15} />} />
            <StatCard label="Morning briefings" value={d.totals.briefings} />
            <StatCard label="MCP and API calls" value={d.totals.mcp} />
            <StatCard label="AI cost logged" raw={d.totals.cost_logged ? money(d.totals.cost) : '-'} hint={d.totals.cost_logged ? undefined : 'No AI cost rows logged yet'} />
          </div>
          <div className="zd-grid-3">
            <Card>
              <CardTitle sub="Messages people sent to Zie">AI Agent per day</CardTitle>
              <Bars label="Messages" data={d.series.map((s: any) => ({ date: s.date, value: s.agent }))} />
            </Card>
            <Card>
              <CardTitle sub="Briefings generated">Briefings per day</CardTitle>
              <Bars label="Briefings" data={d.series.map((s: any) => ({ date: s.date, value: s.briefings }))} />
            </Card>
            <Card>
              <CardTitle sub="Calls from Claude, ChatGPT and the REST API">MCP and API per day</CardTitle>
              <Bars label="Calls" data={d.series.map((s: any) => ({ date: s.date, value: s.mcp }))} />
            </Card>
          </div>
          <div className="zd-grid-2">
            <Card>
              <CardTitle sub="By AI Agent messages and API calls">Heaviest accounts</CardTitle>
              {d.top_accounts.length ? (
                <div className="sa-list">
                  {d.top_accounts.map((t: any) => (
                    <div key={t.id} className="sa-row">
                      <div className="sa-row-main">
                        <strong>{t.email}</strong>
                        <p>
                          {fmt(t.agent)} messages · {fmt(t.mcp)} API calls{t.cost ? ` · ${money(t.cost)}` : ''}
                        </p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => openUser(t.id)}>
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sa-empty">No usage in this window.</p>
              )}
            </Card>
            <Card>
              <CardTitle sub="Credits spent per operation">Credit use</CardTitle>
              <HBars rows={d.credit_ops.map((c: any) => ({ key: c.op, label: c.op, value: c.credits }))} />
            </Card>
          </div>
        </>
      )}
    </>
  );
}

/* ── Revenue ── */
function Revenue({ openUser }: { openUser: (id: string) => void }) {
  const [o, setO] = useState<any>(null);
  const [paid, setPaid] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([sa('/insights/overview?days=30'), sa('/insights/users?segment=paid&sort=plan&limit=100')])
      .then(([a, b]) => {
        setO(a.data);
        setPaid(b);
      })
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="sa-msg is-bad">{err}</p>;
  if (!o || !paid) return <LoadingState text="Reading plans" />;
  const u = o.users;
  return (
    <>
      <div className="zd-grid-4">
        <StatCard label="MRR" raw={money(u.mrr)} icon={<CreditCard size={15} />} hint="From current plans at list price" />
        <StatCard label="ARR run rate" raw={money(u.mrr * 12)} />
        <StatCard label="Paid accounts" value={u.paid} hint={`${u.conversion_pct}% of all accounts`} />
        <StatCard label="Average per paid account" raw={money(u.arpa)} />
      </div>
      <div className="zd-grid-2">
        <Card>
          <CardTitle sub="Monthly revenue per plan">Revenue by plan</CardTitle>
          <HBars rows={['starter', 'pro', 'agency'].map((p) => ({ key: p, label: PLAN_NAME[p], value: (u.by_plan[p] || 0) * PRICE[p], sub: `${u.by_plan[p] || 0} accounts` }))} />
        </Card>
        <Card>
          <CardTitle sub="Paid, but no sign in for 14 days or more">Churn risk</CardTitle>
          {o.attention.filter((x: any) => x.kind === 'inactive_paid').length ? (
            <div className="sa-list">
              {o.attention
                .filter((x: any) => x.kind === 'inactive_paid')
                .map((x: any) => (
                  <div key={x.user_id} className="sa-row">
                    <span className="sa-dot tone-warn" />
                    <div className="sa-row-main">
                      <strong>{x.email}</strong>
                      <p>{x.detail}</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => openUser(x.user_id)}>
                      Open
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="sa-empty">Every paid account signed in recently.</p>
          )}
        </Card>
      </div>
      <Card>
        <CardTitle sub="Highest plan first">Paid accounts</CardTitle>
        {paid.data.length ? (
          <div className="sa-table-wrap" style={{ border: 'none' }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Plan</th>
                  <th className="sa-num">MRR</th>
                  <th className="sa-num">Brands</th>
                  <th>Last seen</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {paid.data.map((x: any) => (
                  <tr key={x.id} className="is-click" onClick={() => openUser(x.id)}>
                    <td>
                      <span className="sa-email">{x.email}</span>
                      <span className="sa-sub">{x.name || ''}</span>
                    </td>
                    <td>
                      <Pill tone={planTone(x.plan)}>{PLAN_NAME[x.plan]}</Pill>
                    </td>
                    <td className="sa-num">{money(PRICE[x.plan] || 0)}</td>
                    <td className="sa-num">{x.brands}</td>
                    <td>{ago(x.last_seen)}</td>
                    <td>{date(x.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sa-empty">No paid accounts yet.</p>
        )}
        <p className="sa-muted sa-small" style={{ marginTop: 10 }}>
          Revenue is calculated from each account's plan at list price. Discounts, refunds and failed payments are not included until billing is connected.
        </p>
      </Card>
    </>
  );
}

/* ── Health and alerts ── */
function Health() {
  const [h, setH] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const load = () => {
    Promise.all([sa('/insights/health'), sa('/alerts').catch(() => ({ data: [] }))])
      .then(([a, b]) => {
        setH(a.data);
        setAlerts(b.data || []);
      })
      .catch((e) => setErr(e.message));
  };
  useEffect(load, []);
  if (err) return <p className="sa-msg is-bad">{err}</p>;
  if (!h) return <LoadingState text="Checking the system" />;
  return (
    <>
      <div className="sa-toolbar">
        <span className="sa-grow sa-muted sa-small">Checked {ago(h.checked_at)}</span>
        <Button size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={load}>
          Check again
        </Button>
      </div>
      <div className="zd-grid-2">
        <Card>
          <CardTitle icon={<ShieldCheck size={15} />} sub="Live checks against the database and the publishing queue">
            System checks
          </CardTitle>
          <div className="sa-list">
            {h.checks.map((c: any) => (
              <div key={c.name} className="sa-row">
                <span className={`sa-dot tone-${c.status}`} />
                <div className="sa-row-main">
                  <strong>{c.name}</strong>
                  <p>{c.detail}</p>
                </div>
                <Pill tone={c.status === 'good' ? 'good' : c.status === 'bad' ? 'bad' : 'warn'}>{c.status === 'good' ? 'OK' : c.status === 'bad' ? 'Problem' : 'Check'}</Pill>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle sub="Environment variables on the server, values never shown">Integrations configured</CardTitle>
          <div className="sa-list">
            {h.keys.map((k: any) => (
              <div key={k.key} className="sa-row">
                <span className={`sa-dot tone-${k.set ? 'good' : 'warn'}`} />
                <div className="sa-row-main">
                  <strong>{k.label}</strong>
                  <p>{k.key}</p>
                </div>
                <Pill tone={k.set ? 'good' : 'warn'}>{k.set ? 'Set' : 'Missing'}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <CardTitle sub="Raised by the system, resolve when handled">Alerts</CardTitle>
        {alerts && alerts.length ? (
          <div className="sa-list">
            {alerts.map((a: any) => (
              <div key={a.id} className="sa-row">
                <span className={`sa-dot tone-${a.severity === 'critical' || a.severity === 'error' ? 'bad' : 'warn'}`} />
                <div className="sa-row-main">
                  <strong>{a.title}</strong>
                  <p>
                    {a.body} · {dt(a.created_at)}
                  </p>
                </div>
                {!a.is_resolved && (
                  <Button size="sm" variant="secondary" onClick={() => sa(`/alerts/${a.id}/resolve`, { body: {} }).then(load)}>
                    Resolve
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="sa-empty">No open alerts.</p>
        )}
      </Card>
    </>
  );
}

/* ── Audit log ── */
function Audit() {
  const [page, setPage] = useState(1);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    sa(`/audit-log?page=${page}&limit=25`)
      .then(setD)
      .catch((e) => setErr(e.message));
  }, [page]);
  if (err) return <p className="sa-msg is-bad">{err}</p>;
  if (!d) return <LoadingState text="Loading the audit log" />;
  const pages = Math.max(1, Math.ceil((d.total || 0) / 25));
  return (
    <>
      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Admin</th>
              <th>Action</th>
              <th>On</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {d.data.map((l: any) => (
              <tr key={l.id}>
                <td>{dt(l.created_at)}</td>
                <td>{l.superadmin_email}</td>
                <td>
                  <strong>{l.action}</strong>
                </td>
                <td className="sa-muted">
                  {l.entity_type}
                  {l.entity_id ? ` ${String(l.entity_id).slice(0, 8)}` : ''}
                </td>
                <td className="sa-muted">{l.ip_address || '-'}</td>
              </tr>
            ))}
            {!d.data.length && (
              <tr>
                <td colSpan={5} className="sa-empty">
                  Nothing logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="sa-pager">
          <span>
            Page {page} of {pages}
          </span>
          <span className="sa-actions">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </span>
        </div>
      )}
    </>
  );
}

/* ── Admins ── */
function Admins({ role }: { role: string }) {
  const [list, setList] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'support', password: '' });
  const [msg, setMsg] = useState('');
  const load = () =>
    sa('/admins')
      .then((r) => setList(r.data))
      .catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);
  if (err) return <p className="sa-msg is-bad">{err}</p>;
  if (!list) return <LoadingState text="Loading admins" />;
  return (
    <>
      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Role</th>
              <th>Last login</th>
              <th>Status</th>
              {role === 'superadmin' && <th />}
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="sa-email">{a.name}</span>
                  <span className="sa-sub">{a.email}</span>
                </td>
                <td>
                  <Pill tone={a.role === 'superadmin' ? 'dark' : 'neutral'}>{a.role}</Pill>
                </td>
                <td>{ago(a.last_login_at)}</td>
                <td>{a.is_active ? <Pill tone="good">Active</Pill> : <Pill>Disabled</Pill>}</td>
                {role === 'superadmin' && (
                  <td style={{ textAlign: 'right' }}>
                    <Button size="sm" variant="ghost" onClick={() => sa(`/admins/${a.id}/status`, { method: 'PATCH', body: { isActive: !a.is_active } }).then(load).catch((e) => setMsg(e.message))}>
                      {a.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {role === 'superadmin' && (
        <Card>
          <CardTitle sub="Support can read accounts, admin can change plans and credits, superadmin can do everything">Add an admin</CardTitle>
          <div className="sa-actions">
            <input className="sa-search" style={{ minWidth: 160 }} placeholder="Name" aria-label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="sa-search" style={{ minWidth: 200 }} placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="sa-search" style={{ minWidth: 180 }} type="password" placeholder="Temporary password" aria-label="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="sa-select" aria-label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <Button
              size="sm"
              disabled={!form.name || !form.email || form.password.length < 12}
              onClick={() =>
                sa('/admins', { body: form })
                  .then(() => {
                    setMsg(`${form.email} added. They set up two step verification at first login.`);
                    setForm({ name: '', email: '', role: 'support', password: '' });
                    load();
                  })
                  .catch((e) => setMsg(e.message))
              }
            >
              Add admin
            </Button>
          </div>
          <p className="sa-muted sa-small" style={{ marginTop: 8 }}>
            Temporary password of 12 characters or more.
          </p>
          {msg && <p className="sa-msg">{msg}</p>}
        </Card>
      )}
    </>
  );
}

/* ── Shell ── */
const NAV: Array<{ label: string; items: Array<{ id: Tab; label: string; icon: ReactNode; sub: string }> }> = [
  {
    label: 'Monitor',
    items: [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} />, sub: 'Accounts, activation, revenue and what needs attention' },
      { id: 'users', label: 'Accounts', icon: <Users size={16} />, sub: 'Every account with its plan, networks, posts and AI use' },
      { id: 'publishing', label: 'Publishing', icon: <Send size={16} />, sub: 'Posts per day, failures and the queue' },
      { id: 'usage', label: 'AI and API', icon: <Bot size={16} />, sub: 'AI Agent, briefings, MCP and credit use' },
    ],
  },
  { label: 'Business', items: [{ id: 'revenue', label: 'Revenue', icon: <BarChart3 size={16} />, sub: 'MRR, plans and accounts at risk' }] },
  {
    label: 'System',
    items: [
      { id: 'health', label: 'Health', icon: <ShieldCheck size={16} />, sub: 'System checks, integrations and alerts' },
      { id: 'audit', label: 'Audit log', icon: <FileClock size={16} />, sub: 'Everything admins changed' },
      { id: 'admins', label: 'Admins', icon: <ShieldCheck size={16} />, sub: 'Who can open this dashboard' },
    ],
  },
];

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [admin, setAdmin] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tab = (params.get('tab') as Tab) || 'overview';
  const userId = params.get('user');
  const all = useMemo(() => NAV.flatMap((g) => g.items), []);
  const current = all.find((i) => i.id === tab) || all[0];

  useEffect(() => {
    if (!token()) {
      navigate('/superadmin/login', { replace: true });
      return;
    }
    sa('/auth/session')
      .then((r) => {
        if (r.admin || r.data) setAdmin(r.admin || r.data);
        setReady(true);
      })
      .catch(() => {
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(PROFILE_KEY);
        } catch {
          /* ignore */
        }
        navigate('/superadmin/login', { replace: true });
      });
  }, [navigate]);

  useEffect(() => {
    document.title = `${current.label} | ZieAds Admin`;
    let m = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'robots';
      document.head.appendChild(m);
    }
    m.content = 'noindex, nofollow';
  }, [current.label]);

  const setTab = (t: Tab) => {
    const p = new URLSearchParams(params);
    p.set('tab', t);
    p.delete('user');
    setParams(p);
    setDrawerOpen(false);
  };
  const openUser = (id: string) => {
    const p = new URLSearchParams(params);
    p.set('user', id);
    setParams(p);
  };
  const closeUser = useCallback(() => {
    const p = new URLSearchParams(window.location.search);
    p.delete('user');
    setParams(p);
  }, [setParams]);

  const logout = async () => {
    await sa('/auth/logout', { body: {} }).catch(() => undefined);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* ignore */
    }
    navigate('/superadmin/login');
  };

  const role = admin?.role || 'support';
  if (!ready) return <LoadingState text="Checking your admin session" />;

  return (
    <div className="zd-shell">
      <div className="zd-topbar">
        <button className="zd-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
        <span className="zd-brand-name" style={{ fontSize: 17 }}>
          <ZieAdsWordmark />
        </span>
        <ZieAdsLogo size={24} />
      </div>
      {drawerOpen && <div className="zd-backdrop" onClick={() => setDrawerOpen(false)} />}
      <aside className={`zd-sidebar ${drawerOpen ? 'is-open' : ''}`}>
        <div className="zd-brand" onClick={() => setTab('overview')}>
          <ZieAdsLogo size={26} />
          <span className="zd-brand-name">
            <ZieAdsWordmark />
          </span>
          <span className="sa-admin-pill">Admin</span>
        </div>
        <nav className="zd-nav" aria-label="Admin">
          {NAV.map((g) => (
            <div key={g.label} className="zd-nav-group">
              <div className="zd-nav-label">{g.label}</div>
              {g.items
                .filter((i) => i.id !== 'admins' || role === 'superadmin')
                .map((i) => (
                  <button key={i.id} className={`zd-nav-item ${tab === i.id ? 'is-active' : ''}`} aria-current={tab === i.id ? 'page' : undefined} onClick={() => setTab(i.id)}>
                    {i.icon}
                    <span>{i.label}</span>
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="sa-who">
          <strong>{admin?.name || 'Admin'}</strong>
          <span>
            {admin?.email} · {role}
          </span>
          <div>
            <Button size="sm" variant="ghost" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </aside>
      <main className="zd-main">
        <div className="zd-page" key={tab}>
          <PageHeader title={current.label} subtitle={current.sub} />
          <div className="zd-body">
            <div className="zd-body-inner is-wide">
              {tab === 'overview' && <Overview openUser={openUser} go={setTab} />}
              {tab === 'users' && <UsersTab openUser={openUser} />}
              {tab === 'publishing' && <Publishing openUser={openUser} />}
              {tab === 'usage' && <Usage openUser={openUser} />}
              {tab === 'revenue' && <Revenue openUser={openUser} />}
              {tab === 'health' && <Health />}
              {tab === 'audit' && <Audit />}
              {tab === 'admins' && <Admins role={role} />}
            </div>
          </div>
        </div>
      </main>
      {userId && <UserDrawer id={userId} role={role} onClose={closeUser} />}
    </div>
  );
}
