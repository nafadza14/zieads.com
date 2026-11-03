/*
  Public Data Deletion page (spec P0-5). Linked from every footer and used as the
  status URL that Meta's data deletion callback returns (?code=...).
*/
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PublicShell from './landing/PublicShell';

export default function DataDeletionPage() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') || params.get('id') || '');
  const [status, setStatus] = useState<null | { status: string; platform: string; completed_at: string | null }>(null);
  const [err, setErr] = useState('');
  const done = params.get('done');

  const lookup = async (c: string) => {
    setErr('');
    setStatus(null);
    if (!c.trim()) return;
    try {
      const r = await fetch(`/api/data-deletion/status?code=${encodeURIComponent(c.trim())}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Request not found');
      setStatus(j);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    if (code) lookup(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PublicShell title="Data deletion | ZieAds" description="How to delete the data ZieAds stores from Instagram, Facebook, TikTok, LinkedIn, Google and YouTube, and how to check a deletion request.">
      <h1>Data deletion</h1>
      <p className="ps-lede">You can remove the data ZieAds stores about you at any time. Deletion is permanent and finishes within 30 days, usually within minutes.</p>

      {done === 'account' && (
        <div className="ps-box" role="status">
          <strong>Your account was deleted.</strong>
          <p style={{ margin: '6px 0 0' }}>Every brand, connection, post, report and conversation was removed together with your login.</p>
        </div>
      )}

      <h2>Delete everything</h2>
      <ol>
        <li>Log in to ZieAds and open Settings, then Data and privacy.</li>
        <li>Type DELETE and press Delete account.</li>
      </ol>
      <p>If you can no longer log in, email <a href="mailto:privacy@zieads.com">privacy@zieads.com</a> from the address on the account. We confirm within 7 days.</p>

      <h2>Delete the data from one platform</h2>
      <p>Open Connections in ZieAds and press Disconnect on the platform. ZieAds revokes its access token and deletes the posts, comments, messages and insights it stored from that platform.</p>
      <p>You can also remove ZieAds from inside the platform:</p>
      <table className="ps-table">
        <thead>
          <tr>
            <th>Platform</th>
            <th>Where to remove ZieAds</th>
            <th>What happens</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Facebook and Instagram</td>
            <td>Facebook Settings, Apps and websites, remove ZieAds. Instagram Settings, Apps and websites.</td>
            <td>Meta sends us a deletion request. We delete the data and give you a confirmation code you can check below.</td>
          </tr>
          <tr>
            <td>TikTok</td>
            <td>TikTok Settings, Security, Manage app permissions.</td>
            <td>Access ends. Disconnect in ZieAds to delete stored data right away.</td>
          </tr>
          <tr>
            <td>LinkedIn</td>
            <td>LinkedIn Settings, Data privacy, Permitted services.</td>
            <td>Access ends. Disconnect in ZieAds to delete stored data right away.</td>
          </tr>
          <tr>
            <td>Google and YouTube</td>
            <td>
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
                myaccount.google.com/permissions
              </a>
            </td>
            <td>Access ends. Disconnect in ZieAds to delete stored data right away.</td>
          </tr>
        </tbody>
      </table>

      <h2>Check a deletion request</h2>
      <p>Enter the confirmation code you received from Facebook or Instagram.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code);
        }}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        <input className="ps-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Confirmation code" aria-label="Confirmation code" />
        <button className="ps-btn" type="submit">
          Check status
        </button>
      </form>
      {status && (
        <div className="ps-box" role="status">
          <strong>{status.status === 'not_found' ? 'No data was stored for this account.' : 'Deletion completed.'}</strong>
          <p style={{ margin: '6px 0 0' }}>
            Platform: {status.platform === 'meta' ? 'Facebook and Instagram' : status.platform}.
            {status.completed_at ? ` Completed on ${new Date(status.completed_at).toLocaleString()}.` : ''}
          </p>
        </div>
      )}
      {err && <p className="ps-note" style={{ color: '#d0443a' }}>{err}</p>}

      <h2>What we keep</h2>
      <p>Invoices are kept for as long as Indonesian tax law requires. They hold your name, email and plan, never social media content.</p>
      <p className="ps-note">
        Read the full <a href="/privacy-policy">Privacy Policy</a>. Questions: <a href="mailto:privacy@zieads.com">privacy@zieads.com</a>.
      </p>
    </PublicShell>
  );
}
