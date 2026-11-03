/*
  Settings > API and MCP (spec 10). One page for both ways in:
  MCP for AI assistants (Claude and ChatGPT connect with OAuth, Cursor and Claude Code with OAuth or a key)
  and the REST API (keys). Apps connected with OAuth and keys made here share scopes, approvals and the daily limit.
  A key's secret is shown once; ZieAds stores only its hash. Full docs at /docs.
*/
import { useEffect, useState } from 'react';
import { Button, LoadingState, Pill } from '../../components/v3/ui';
import { api } from '../../lib/api';
import { MCP_URL, REST_BASE } from '../../lib/publicUrls';

const ACTION_LABELS: Record<string, string> = {
  schedule_post: 'Schedule drafted posts',
  send_reply: 'Send drafted comment replies',
  add_competitor: 'Add competitors to Hunt',
};

const fmtLimit = (n: number) => (n === -1 ? 'unlimited' : n.toLocaleString());

const CLIENTS: { id: string; label: string; steps: string[]; code?: string; doc: string }[] = [
  {
    id: 'claude',
    label: 'Claude',
    steps: ['In Claude open Settings, then Connectors.', 'Choose Add custom connector and paste the server URL.', 'Click Connect, then Allow access on the ZieAds screen.'],
    doc: '/docs/mcp/claude',
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    steps: ['In ChatGPT open Settings, Apps and Connectors, Advanced, and turn on Developer mode.', 'Create a connector, paste the server URL and pick OAuth.', 'Sign in with ZieAds and choose Allow access.'],
    doc: '/docs/mcp/chatgpt',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    steps: ['Open Cursor Settings, MCP, Add new MCP server, and paste this into mcp.json.', 'Cursor opens the ZieAds sign in screen the first time.'],
    code: JSON.stringify({ mcpServers: { zieads: { url: MCP_URL } } }, null, 2),
    doc: '/docs/mcp/cursor',
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    steps: ['Run this in your terminal, then type /mcp in Claude Code to sign in.'],
    code: `claude mcp add --transport http zieads ${MCP_URL}`,
    doc: '/docs/mcp/claude-code',
  },
  {
    id: 'other',
    label: 'Other',
    steps: ['Any client that supports Streamable HTTP works. Use OAuth, or create a key below and send it as a Bearer token.'],
    code: JSON.stringify({ mcpServers: { zieads: { type: 'http', url: MCP_URL, headers: { Authorization: 'Bearer YOUR_KEY' } } } }, null, 2),
    doc: '/docs/mcp/other-clients',
  },
];

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
  const [client, setClient] = useState('claude');

  const load = async () => {
    try {
      const [k, u] = await Promise.all([api('/api/mcp/keys'), api('/api/mcp/usage')]);
      setKeys(k.keys);
      setUsage(u);
      setErr('');
    } catch (e: any) {
      setErr(e.message);
      setKeys((k) => k || []);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api('/api/mcp/keys', { body: { name: name || 'API key', scopes: canDraft ? ['read', 'draft'] : ['read'], auto_approve: canDraft ? auto : [] } });
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

  if (!keys) return <LoadingState text="Loading API and MCP" />;
  const active = keys.filter((k) => !k.revoked_at);
  const apps = active.filter((k) => k.kind === 'oauth');
  const own = active.filter((k) => k.kind !== 'oauth');
  const c = CLIENTS.find((x) => x.id === client)!;
  const curl = `curl ${REST_BASE}/briefing \\\n  -H "Authorization: Bearer ${secret || 'YOUR_KEY'}"`;

  const CopyRow = ({ text, id }: { text: string; id: string }) => (
    <span className="st-copy-row">
      <code className="st-code">{text}</code>
      <Button size="sm" variant="ghost" onClick={() => copy(text, id)}>
        {copied === id ? 'Copied' : 'Copy'}
      </Button>
    </span>
  );

  return (
    <>
      {err && <p className="st-msg is-error st-banner">{err}</p>}

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <h3>Connect an AI assistant (MCP)</h3>
            <p>Claude, ChatGPT, Cursor and other MCP clients read your briefing, analytics, calendar and inbox, and draft posts and replies that wait for your approval.</p>
          </div>
          <a className="st-doc-link" href="/docs/mcp">
            MCP docs
          </a>
        </div>
        <div className="st-kv">
          <span>Server URL</span>
          <CopyRow text={MCP_URL} id="url" />
          <span>Sign in</span>
          <span>OAuth (Sign in with ZieAds) or a key as a Bearer token</span>
          <span>Today</span>
          <span>{usage ? `${usage.used.toLocaleString()} of ${fmtLimit(usage.limit)} calls on the ${usage.plan} plan, API and MCP combined` : 'Not available'}</span>
        </div>

        <div className="st-seg" role="tablist" aria-label="AI assistant">
          {CLIENTS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={client === x.id} className={client === x.id ? 'is-on' : ''} onClick={() => setClient(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
        <ol className="st-steps">
          {c.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {c.code && (
          <>
            <pre className="st-code st-pre">{c.code}</pre>
            <div className="st-actions">
              <Button size="sm" variant="ghost" onClick={() => copy(c.code!, 'code')}>
                {copied === 'code' ? 'Copied' : 'Copy'}
              </Button>
              <a className="st-doc-link" href={c.doc}>
                Step by step guide
              </a>
            </div>
          </>
        )}
        {!c.code && (
          <div className="st-actions">
            <a className="st-doc-link" href={c.doc}>
              Step by step guide
            </a>
          </div>
        )}
      </div>

      <div className="st-card">
        <h3>Connected apps</h3>
        {apps.length === 0 ? (
          <p>No apps yet. Apps you allow with Sign in with ZieAds show up here.</p>
        ) : (
          <table className="st-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Access</th>
                <th>Last used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {apps.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td>
                    <Pill>{k.scopes.includes('draft') ? 'Read and draft' : 'Read only'}</Pill>
                  </td>
                  <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Button size="sm" variant="ghost" onClick={() => revoke(k.id)} aria-label={`Disconnect ${k.name}`}>
                      Disconnect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <h3>REST API</h3>
            <p>The same data and drafts over plain HTTPS, for Zapier, Make, n8n or your own code. Send a key as a Bearer token.</p>
          </div>
          <a className="st-doc-link" href="/docs/api">
            API reference
          </a>
        </div>
        <div className="st-kv">
          <span>Base URL</span>
          <CopyRow text={REST_BASE} id="rest" />
        </div>
        <pre className="st-code st-pre" style={{ marginTop: 12 }}>{curl}</pre>
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
          <div className="st-actions">
            <Button size="sm" variant="ghost" onClick={() => setSecret(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      <div className="st-card">
        <h3>Keys</h3>
        <p>For the REST API and for MCP clients that take a header instead of OAuth.</p>
        {own.length === 0 ? (
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
              {own.map((k) => (
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
          <input className="st-input" placeholder="Name, for example Zapier" value={name} onChange={(e) => setName(e.target.value)} aria-label="Key name" style={{ flex: 1, minWidth: 200 }} maxLength={60} />
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
