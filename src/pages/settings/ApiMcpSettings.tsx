/*
  Settings > API and MCP (spec 10). Create keys for MCP clients (Claude, ChatGPT,
  Cursor), pick scopes and which actions may skip approval, see today's usage.
  The secret is shown once; ZieAds stores only its hash.
*/
import { useEffect, useState } from 'react';
import { Button, LoadingState, Pill } from '../../components/v3/ui';
import { api } from '../../lib/api';

const ACTION_LABELS: Record<string, string> = {
  schedule_post: 'Schedule drafted posts',
  send_reply: 'Send drafted comment replies',
  add_competitor: 'Add competitors to Hunt',
};

const fmtLimit = (n: number) => (n === -1 ? 'unlimited' : n.toLocaleString());

export default function ApiMcpSettings() {
  const [keys, setKeys] = useState<any[] | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; plan: string } | null>(null);
  const [name, setName] = useState('');
  const [canDraft, setCanDraft] = useState(true);
  const [auto, setAuto] = useState<string[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const endpoint = `${window.location.origin}/api/mcp`;

  const load = async () => {
    try {
      const [k, u] = await Promise.all([api('/api/mcp/keys'), api('/api/mcp/usage')]);
      setKeys(k.keys);
      setUsage(u);
    } catch (e: any) {
      setErr(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api('/api/mcp/keys', { body: { name: name || 'MCP key', scopes: canDraft ? ['read', 'draft'] : ['read'], auto_approve: canDraft ? auto : [] } });
      setSecret(r.secret);
      setName('');
      setAuto([]);
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    setErr('');
    try {
      await api(`/api/mcp/keys/${id}/revoke`, { body: {} });
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  if (!keys) return err ? <p className="st-msg is-error">{err}</p> : <LoadingState text="Loading your keys" />;
  const active = keys.filter((k) => !k.revoked_at);
  const config = JSON.stringify({ mcpServers: { zieads: { type: 'http', url: endpoint, headers: { Authorization: `Bearer ${secret || 'YOUR_KEY'}` } } } }, null, 2);

  return (
    <>
      <div className="st-card">
        <h3>Connect an AI assistant</h3>
        <p>
          Claude, ChatGPT, Cursor and other MCP clients can read your briefing, analytics, calendar and inbox, and draft posts and replies. Drafts wait for your approval in ZieAds unless you let a key skip approval for that action.
        </p>
        <div className="st-kv">
          <span>Server URL</span>
          <span className="st-copy-row">
            <code className="st-code">{endpoint}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(endpoint, 'url')}>
              {copied === 'url' ? 'Copied' : 'Copy'}
            </Button>
          </span>
          <span>Transport</span>
          <span>Streamable HTTP, key sent as a Bearer token</span>
          <span>Today</span>
          <span>{usage ? `${usage.used.toLocaleString()} of ${fmtLimit(usage.limit)} calls on the ${usage.plan} plan` : 'Not available'}</span>
        </div>
      </div>

      {secret && (
        <div className="st-card st-secret" role="status">
          <h3>Your new key</h3>
          <p>Copy it now. ZieAds keeps only a fingerprint, so it cannot be shown again.</p>
          <span className="st-copy-row">
            <code className="st-code">{secret}</code>
            <Button size="sm" variant="secondary" onClick={() => copy(secret, 'secret')}>
              {copied === 'secret' ? 'Copied' : 'Copy key'}
            </Button>
          </span>
          <p style={{ marginTop: 14 }}>Client config:</p>
          <pre className="st-code st-pre">{config}</pre>
          <div className="st-actions">
            <Button size="sm" variant="ghost" onClick={() => copy(config, 'config')}>
              {copied === 'config' ? 'Copied' : 'Copy config'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSecret(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      <div className="st-card">
        <h3>Keys</h3>
        {active.length === 0 ? (
          <p>No keys yet.</p>
        ) : (
          <table className="st-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Access</th>
                <th>Last used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {active.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td>
                    <code>{k.key_preview}</code>
                  </td>
                  <td>
                    <Pill>{k.scopes.includes('draft') ? 'Read and draft' : 'Read only'}</Pill>
                    {k.auto_approve?.length > 0 && <small className="st-note"> Skips approval: {k.auto_approve.map((a: string) => ACTION_LABELS[a] || a).join(', ')}</small>}
                  </td>
                  <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Button size="sm" variant="ghost" onClick={() => revoke(k.id)} aria-label={`Revoke ${k.name}`}>
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 style={{ marginTop: 22 }}>New key</h3>
        <div className="st-actions">
          <input className="st-input" placeholder="Name, for example Claude Desktop" value={name} onChange={(e) => setName(e.target.value)} aria-label="Key name" style={{ flex: 1, minWidth: 200 }} maxLength={60} />
        </div>
        <label className="st-check">
          <input type="checkbox" checked={canDraft} onChange={(e) => setCanDraft(e.target.checked)} /> Allow drafting posts, replies and competitors (otherwise read only)
        </label>
        {canDraft && (
          <fieldset className="st-fieldset">
            <legend>Skip my approval for</legend>
            {Object.entries(ACTION_LABELS).map(([id, label]) => (
              <label key={id} className="st-check">
                <input type="checkbox" checked={auto.includes(id)} onChange={(e) => setAuto((a) => (e.target.checked ? [...a, id] : a.filter((x) => x !== id)))} /> {label}
              </label>
            ))}
            <small className="st-note">Leave these off to approve every action in ZieAds first. Everything is recorded in the activity log either way.</small>
          </fieldset>
        )}
        <div className="st-actions">
          <Button onClick={create} loading={busy}>
            Create key
          </Button>
        </div>
        {err && <p className="st-msg is-error">{err}</p>}
      </div>
    </>
  );
}
