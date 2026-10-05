import { useState, useEffect, useRef } from 'react';
import V3Layout from '../../components/v3/V3Layout';
import {
  Card,
  DarkButton,
  GhostButton,
  GrowBar,
  LoadingState,
  PageBody,
  PageHeader,
  Pill,
  Skeleton,
  TextRollButton,
} from '../../components/v3/ui';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleConnections } from '../../data/sample-data';
import SocialIcon from '../../components/v3/SocialIcon';
import { CheckCircle, Upload, Trash2, AlertTriangle, Link2 } from 'lucide-react';
import './connections.css';

const PLATFORMS: { id: string; name: string; type: 'organic' | 'ads'; icon: string }[] = [
  { id: 'instagram', name: 'Instagram', type: 'organic', icon: 'instagram' },
  { id: 'tiktok', name: 'TikTok', type: 'organic', icon: 'tiktok' },
  { id: 'linkedin', name: 'LinkedIn', type: 'organic', icon: 'linkedin' },
  { id: 'meta_ads', name: 'Meta Ads', type: 'ads', icon: 'facebook' },
  { id: 'google_ads', name: 'Google Ads', type: 'ads', icon: 'google' },
  { id: 'tiktok_ads', name: 'TikTok Ads', type: 'ads', icon: 'tiktok' },
];

export default function ConnectionsPage() {
  const demo = useDemoMode();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Connection Form State
  const [platformToConnect, setPlatformToConnect] = useState<string | null>(null);
  const [accountHandle, setAccountHandle] = useState('');
  const [connecting, setConnecting] = useState(false);

  // CSV Upload State
  const [uploadPlatform, setUploadPlatform] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [uploadingAds, setUploadingAds] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const fetchConnections = async () => {
    if (demo.isActive) {
      setConnections(sampleConnections.map(c => ({
        id: c.id,
        platform: c.platform,
        account_handle: c.account_handle,
        is_demo: true,
        connected_at: new Date().toISOString()
      })));
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const [realRes, mockRes] = await Promise.all([
        fetch('/api/auth/connections', { headers }),
        fetch('/api/v3/connections', { headers })
      ]);

      const realJ = await realRes.json();
      const mockJ = await mockRes.json();
      const mergedList: any[] = [];

      // 1. Add active real OAuth connections
      if (Array.isArray(realJ)) {
        realJ.forEach((c: any) => {
          if (c.connected) {
            mergedList.push({
              id: c.platform,
              platform: c.platform,
              account_handle: c.username || c.display_name || `@${c.platform}`,
              connected_at: c.connected_at,
              is_oauth: true,
              avatar_url: c.avatar_url,
              account_type: c.account_type
            });
          }
        });
      }

      // 2. Add other mock/upload connections
      if (mockJ.success && Array.isArray(mockJ.data)) {
        mockJ.data.forEach((c: any) => {
          const isRealConnected = mergedList.some(r => r.platform === c.platform);
          if (!isRealConnected) {
            mergedList.push({
              ...c,
              is_oauth: false
            });
          }
        });
      }

      setConnections(mergedList);
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [demo.isActive]);

  // Hook to capture OAuth callback status parameters in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');

    if (connected) {
      alert(`${connected.toUpperCase()} connected successfully!`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      if (error.includes('denied')) {
        alert(`Connection request was cancelled.`);
      } else {
        alert(`Connection failed: ${error.replace(/_/g, ' ')}`);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isActive) {
      alert("Please exit Demo Mode to connect real accounts.");
      return;
    }
    if (!platformToConnect || !accountHandle.trim()) return;

    setConnecting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/connections', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          platform: platformToConnect,
          accountHandle: accountHandle.trim(),
          connectionMethod: 'oauth'
        })
      });
      const j = await res.json();
      if (j.success) {
        setAccountHandle('');
        setPlatformToConnect(null);
        await fetchConnections();
      }
    } catch (err) {
      alert("Failed to connect account.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDelete = async (conn: any) => {
    if (demo.isActive) {
      alert("Cannot disconnect demo accounts.");
      return;
    }
    if (!confirm(`Are you sure you want to disconnect this ${conn.platform} account?`)) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        conn.is_oauth 
          ? `/api/auth/${conn.platform}/disconnect` 
          : `/api/v3/connections/${conn.id}`,
        {
          method: conn.is_oauth ? 'POST' : 'DELETE',
          headers
        }
      );
      const j = await res.json();
      if (j.success || res.ok) {
        await fetchConnections();
      }
    } catch (err) {
      alert("Failed to disconnect account.");
    }
  };

  // Basic CSV Text Parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length === 0) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      setCsvHeaders(headers);

      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = {};
        headers.forEach((header, index) => {
          rowObj[header] = values[index] || '';
        });
        return rowObj;
      });

      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleUploadAds = async () => {
    if (demo.isActive) {
      alert("CSV Upload is disabled in Demo Mode.");
      return;
    }
    if (!uploadPlatform || parsedRows.length === 0) return;

    setUploadingAds(true);
    try {
      // Map columns automatically to expected server properties
      const mappedRows = parsedRows.map(row => {
        // Find matching keys regardless of casing/spaces
        const findKey = (candidates: string[]) => {
          const key = Object.keys(row).find(k => 
            candidates.some(c => k.toLowerCase().replace(/\s/g, '') === c.toLowerCase().replace(/\s/g, ''))
          );
          return key ? row[key] : null;
        };

        return {
          campaign_id: findKey(['campaignid', 'id', 'campaign_id']),
          campaign_name: findKey(['campaignname', 'campaign', 'campaign_name', 'Campaign']),
          ad_set_name: findKey(['adsetname', 'adgroup', 'adset', 'Ad Set Name', 'Ad group']),
          ad_name: findKey(['adname', 'ad', 'Ad Name']),
          spend: findKey(['spend', 'cost', 'spendusd', 'Amount Spent USD', 'Cost']),
          revenue: findKey(['revenue', 'revenueusd', 'value', 'Conv value', 'Total Conversion Value']),
          impressions: findKey(['impressions', 'Impressions']),
          clicks: findKey(['clicks', 'Clicks']),
          conversions: findKey(['conversions', 'Conversions']),
          date: findKey(['date', 'day', 'Reporting Starts'])
        };
      });

      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/ads/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          platform: uploadPlatform,
          rows: mappedRows
        })
      });

      const j = await res.json();
      if (j.success) {
        setUploadSuccess(true);
        setCsvFile(null);
        setParsedRows([]);
        setTimeout(() => {
          setUploadSuccess(false);
          setUploadPlatform(null);
        }, 3000);
      }
    } catch (err) {
      alert("Failed to upload ads data.");
    } finally {
      setUploadingAds(false);
    }
  };

  // Presentation only: briefly glow a card when its platform becomes connected.
  const [flashIds, setFlashIds] = useState<string[]>([]);
  const prevConnected = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (loading) return;
    const now = new Set(connections.map(c => c.platform));
    const prev = prevConnected.current;
    prevConnected.current = now;
    if (!prev) return;
    const fresh = [...now].filter(id => !prev.has(id));
    if (fresh.length === 0) return;
    setFlashIds(fresh);
    const t = setTimeout(() => setFlashIds([]), 1900);
    return () => clearTimeout(t);
  }, [connections, loading]);

  // Presentation only: show a loading pill while the OAuth redirect is starting.
  const [redirectingId, setRedirectingId] = useState<string | null>(null);

  const connectedCount = PLATFORMS.filter(p => connections.some(c => c.platform === p.id)).length;

  const renderPlatformCard = (id: string, name: string, type: 'organic' | 'ads', icon: any) => {
    const activeConns = connections.filter(c => c.platform === id);
    const isConnected = activeConns.length > 0;

    return (
      <Card
        key={id}
        hover
        glass
        className={`zcn-card ${isConnected ? 'is-on' : ''} ${flashIds.includes(id) ? 'is-flash' : ''}`}
      >
        <div className="zcn-head">
          <span className="zcn-brand">{icon}</span>
          <div style={{ minWidth: 0 }}>
            <div className="zcn-name">{name}</div>
            <div className="zcn-type">{type === 'organic' ? 'Organic posts and reach' : 'Paid campaigns'}</div>
          </div>
          <span className="zcn-status">
            <span className={`zd-live ${isConnected ? '' : 'is-off'}`} />
            {isConnected ? 'Live' : 'Off'}
          </span>
        </div>

        <div className="zcn-foot">
          {isConnected ? (
            <>
              <div>
                <Pill tone="good">
                  <CheckCircle /> Connected
                </Pill>
              </div>
              {activeConns.map(conn => (
                <div key={conn.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="zcn-acct">
                    {conn.avatar_url ? (
                      <img
                        src={conn.avatar_url}
                        alt={conn.account_handle}
                        className="zcn-avatar"
                        onError={(e) => {
                          // Fallback to check icon on load error
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <CheckCircle size={14} className="zcn-check" />
                    )}
                    <span className="zcn-acct-handle">{conn.account_handle}</span>
                    {conn.account_type && (
                      <Pill tone={conn.account_type.toLowerCase() === 'personal' ? 'bad' : 'good'}>
                        {conn.account_type}
                      </Pill>
                    )}
                    <button
                      type="button"
                      className="zd-icon-btn zcn-del"
                      onClick={() => handleDelete(conn)}
                      title="Disconnect"
                      aria-label={`Disconnect ${conn.account_handle}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {conn.platform === 'instagram' && conn.account_type?.toLowerCase() === 'personal' && (
                    <div className="zcn-warn">
                      <AlertTriangle size={13} />
                      <span>
                        Personal accounts do not support comment syncing. Convert to a Business or Creator account in Instagram settings, then reconnect.
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {type === 'ads' && (
                <GhostButton onClick={() => setUploadPlatform(id)}>
                  <Upload /> Upload Ads CSV
                </GhostButton>
              )}
            </>
          ) : redirectingId === id ? (
            <DarkButton loading>Connecting</DarkButton>
          ) : (
            <TextRollButton
              text={`Connect ${name}`}
              onClick={async () => {
                if (demo.isActive) {
                  alert("Please exit Demo Mode to connect real accounts.");
                  return;
                }
                if (id === 'instagram' || id === 'tiktok' || id === 'linkedin') {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    alert("Please sign in first.");
                    return;
                  }
                  setRedirectingId(id);
                  window.location.href = `/api/auth/${id}/connect?token=${session.access_token}`;
                } else {
                  setPlatformToConnect(id);
                }
              }}
            />
          )}
        </div>
      </Card>
    );
  };

  const renderGroup = (type: 'organic' | 'ads', title: string, sub: string) => {
    const list = PLATFORMS.filter(p => p.type === type);
    const on = list.filter(p => connections.some(c => c.platform === p.id)).length;
    return (
      <section>
        <div className="zcn-group-head">
          <h2>{title}</h2>
          <span className="zd-eyebrow">{sub} · {on} of {list.length} live</span>
        </div>
        <div className="zd-grid-3">
          {list.map(p => renderPlatformCard(p.id, p.name, p.type, <SocialIcon platform={p.icon} size={26} />))}
        </div>
      </section>
    );
  };

  return (
    <V3Layout>
      <PageHeader
        number="08"
        label="Connections"
        title="Plug in every channel you run."
        subtitle="Link your marketing sources to enable daily AI analytics audits."
      />

      <PageBody>
        {loading ? (
          <>
            <Card>
              <Skeleton height={12} width="30%" />
              <div style={{ height: 12 }} />
              <Skeleton height={28} width="45%" />
            </Card>
            <div className="zd-grid-3">
              {[0, 1, 2].map(i => (
                <Card key={i}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                    <Skeleton height={48} width={48} radius={24} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Skeleton height={12} width="60%" />
                      <Skeleton height={10} width="40%" />
                    </div>
                  </div>
                  <Skeleton height={40} radius={999} />
                </Card>
              ))}
            </div>
            <LoadingState text="Loading connections" />
          </>
        ) : (
          <>
            {/* Summary strip */}
            <Card glass className="zcn-summary">
              <div className="zcn-summary-main">
                <span className="zd-eyebrow">Sources connected</span>
                <div className="zcn-summary-count">
                  {connectedCount} of {PLATFORMS.length}
                  <small>{connectedCount === PLATFORMS.length ? 'all channels live' : connectedCount === 0 ? 'nothing linked yet' : 'channels live'}</small>
                </div>
                <GrowBar value={(connectedCount / PLATFORMS.length) * 100} tone={connectedCount > 0 ? 'accent' : 'dark'} />
              </div>
              <div className="zcn-summary-icons" aria-hidden="true">
                {PLATFORMS.map(p => (
                  <span key={p.id} className={connections.some(c => c.platform === p.id) ? '' : 'is-off'} title={p.name}>
                    <SocialIcon platform={p.icon} size={16} />
                  </span>
                ))}
              </div>
            </Card>

            {renderGroup('organic', 'Organic social media', 'Posts and reach')}
            {renderGroup('ads', 'Paid advertising platforms', 'Campaign data')}
          </>
        )}
      </PageBody>

      {/* Modal: Connect Account */}
      {platformToConnect && (
        <div className="zcn-overlay">
          <Card glass className="zcn-modal zd-fade-up" padding={26}>
            <div className="zcn-modal-head">
              <span className="zd-icon-dot"><Link2 /></span>
              <div>
                <h3>Connect {platformToConnect.toUpperCase()}</h3>
                <p>Enter your profile handle to instantly mock-connect this channel.</p>
              </div>
            </div>

            <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="zd-label">Account handle</label>
                <input
                  className="zd-input"
                  value={accountHandle}
                  onChange={e => setAccountHandle(e.target.value)}
                  placeholder="@my_brand"
                  required
                />
              </div>

              <div className="zcn-actions">
                <GhostButton onClick={() => { setPlatformToConnect(null); setAccountHandle(''); }}>
                  Cancel
                </GhostButton>
                <DarkButton type="submit" loading={connecting}>
                  Connect
                </DarkButton>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: CSV Upload */}
      {uploadPlatform && (
        <div className="zcn-overlay">
          <Card glass className="zcn-modal is-wide zd-fade-up" padding={26}>
            <div className="zcn-modal-head">
              <span className="zd-icon-dot"><Upload /></span>
              <div>
                <h3>Upload ads data: {uploadPlatform.toUpperCase().replace('_', ' ')}</h3>
                <p>Upload an exported report CSV from your Ads Manager dashboard.</p>
              </div>
            </div>

            {uploadSuccess ? (
              <div className="zcn-success">
                <span className="zcn-success-icon"><CheckCircle size={28} /></span>
                <strong>CSV uploaded successfully</strong>
                <span className="zd-muted" style={{ fontSize: 13 }}>Metrics are now synchronized and visible in briefs.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className={`zcn-drop ${csvFile ? 'has-file' : ''}`}>
                  <span className="zcn-drop-icon"><Upload size={20} /></span>
                  <span>{csvFile ? csvFile.name : 'Select or drop CSV report file'}</span>
                  <input type="file" accept=".csv" onChange={handleFileChange} />
                </div>

                {parsedRows.length > 0 && (
                  <div className="zd-fade-up">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="zd-label" style={{ margin: 0 }}>Parsed file preview</span>
                      <Pill tone="accent">{parsedRows.length} rows detected</Pill>
                    </div>
                    <div className="zcn-table-wrap">
                      <table className="zcn-table">
                        <thead>
                          <tr>
                            {csvHeaders.slice(0, 5).map(h => <th key={h}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.slice(0, 3).map((row, i) => (
                            <tr key={i}>
                              {csvHeaders.slice(0, 5).map(h => <td key={h}>{row[h]}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="zcn-actions">
                  <GhostButton onClick={() => { setUploadPlatform(null); setCsvFile(null); setParsedRows([]); }}>
                    Cancel
                  </GhostButton>
                  <DarkButton
                    onClick={handleUploadAds}
                    disabled={parsedRows.length === 0}
                    loading={uploadingAds}
                  >
                    Save campaigns
                  </DarkButton>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </V3Layout>
  );
}
