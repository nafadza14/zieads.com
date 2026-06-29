import { useState, useEffect } from 'react';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleConnections } from '../../data/sample-data';
import { 
  Instagram, 
  Link2, 
  CheckCircle, 
  Upload, 
  Trash2, 
  Linkedin, 
  Facebook, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const D = 'var(--text)';
const B = 'var(--border)';

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
      const res = await fetch('/api/v3/connections', { headers });
      const j = await res.json();
      if (j.success) setConnections(j.data);
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [demo.isActive]);

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

  const handleDelete = async (id: string) => {
    if (demo.isActive) {
      alert("Cannot disconnect demo accounts.");
      return;
    }
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/connections/${id}`, {
        method: 'DELETE',
        headers
      });
      const j = await res.json();
      if (j.success) {
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

  const renderPlatformCard = (id: string, name: string, type: 'organic' | 'ads', icon: any) => {
    const activeConns = connections.filter(c => c.platform === id);
    const isConnected = activeConns.length > 0;

    return (
      <div key={id} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{name}</div>
            <div style={{ fontSize: '0.75rem', color: G }}>{type === 'organic' ? 'Organic Posts & Reach' : 'Paid Campaigns'}</div>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          {isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeConns.map(conn => (
                <div key={conn.id} style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-soft)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <CheckCircle size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conn.account_handle}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(conn.id)}
                    style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {type === 'ads' && (
                <button 
                  onClick={() => setUploadPlatform(id)}
                  style={{ width: '100%', background: '#fff', border: `1px solid ${B}`, padding: '8px 0', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <Upload size={14} /> Upload Ads CSV
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                onClick={() => setPlatformToConnect(id)}
                style={{ width: '100%', background: P, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Connect {name}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Connections Manager</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>Link your marketing sources to enable daily AI analytics audits.</p>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding: 40, overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: G, marginTop: 40 }}>Loading connections...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Social Networks Group */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Organic Social Media</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {renderPlatformCard('instagram', 'Instagram', 'organic', <Instagram size={20} style={{ color: '#E1306C' }} />)}
                {renderPlatformCard('tiktok', 'TikTok', 'organic', <CheckCircle size={20} style={{ color: '#000000' }} />)}
                {renderPlatformCard('linkedin', 'LinkedIn', 'organic', <Linkedin size={20} style={{ color: '#0077B5' }} />)}
              </div>
            </div>

            {/* Advertising Platforms Group */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Paid Advertising Platforms</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {renderPlatformCard('meta_ads', 'Meta Ads', 'ads', <Facebook size={20} style={{ color: '#1877F2' }} />)}
                {renderPlatformCard('google_ads', 'Google Ads', 'ads', <TrendingUp size={20} style={{ color: '#4285F4' }} />)}
                {renderPlatformCard('tiktok_ads', 'TikTok Ads', 'ads', <CheckCircle size={20} style={{ color: '#EE1D52' }} />)}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Modal - Connect Account */}
      {platformToConnect && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 28, width: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Connect {platformToConnect.toUpperCase()}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: G }}>Enter your profile handle to instantly mock-connect this channel.</p>
            </div>
            
            <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Account Handle</label>
                <input 
                  value={accountHandle}
                  onChange={e => setAccountHandle(e.target.value)}
                  placeholder="@my_brand"
                  required
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button 
                  type="button" 
                  onClick={() => setPlatformToConnect(null)}
                  style={{ background: 'none', border: `1px solid ${B}`, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={connecting}
                  style={{ background: P, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - CSV Upload */}
      {uploadPlatform && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 28, width: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Upload Ads Data: {uploadPlatform.toUpperCase().replace('_', ' ')}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: G }}>Upload a exported report CSV sheet from Ads Manager dashboard.</p>
            </div>

            {uploadSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
                <CheckCircle size={40} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>CSV Uploaded Successfully!</span>
                <span style={{ fontSize: '0.8rem', color: G }}>Metrics are now synchronized and visible in briefs.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ border: `2px dashed ${B}`, padding: 24, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative' }}>
                  <Upload size={24} style={{ color: G }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {csvFile ? csvFile.name : 'Select or drop CSV report file'}
                  </span>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>

                {parsedRows.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8 }}>Parsed File Preview ({parsedRows.length} rows detected)</div>
                    <div style={{ overflowX: 'auto', border: `1px solid ${B}`, borderRadius: 6, maxHeight: 150 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-soft)', borderBottom: `1px solid ${B}` }}>
                            {csvHeaders.slice(0, 5).map(h => <th key={h} style={{ padding: '6px 10px', fontWeight: 600 }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.slice(0, 3).map((row, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${B}` }}>
                              {csvHeaders.slice(0, 5).map(h => <td key={h} style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{row[h]}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button 
                    onClick={() => { setUploadPlatform(null); setCsvFile(null); setParsedRows([]); }}
                    style={{ background: 'none', border: `1px solid ${B}`, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUploadAds}
                    disabled={parsedRows.length === 0 || uploadingAds}
                    style={{ background: P, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: parsedRows.length === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {uploadingAds ? 'Uploading...' : 'Save Campaigns'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </V3Layout>
  );
}
