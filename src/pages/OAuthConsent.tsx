/*
  /oauth/authorize: the "Allow access" screen Claude, ChatGPT and other MCP connectors open.
  The app arrives with client_id, redirect_uri, code_challenge (S256) and state. If the visitor is
  not signed in they log in first and come back here. Allow or Cancel posts to /api/oauth/authorize,
  which validates everything and returns the URL to send the browser to.
*/
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import ZieAdsLogo, { ZieAdsWordmark } from '../components/ZieAdsLogo';
import { supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';
import './landing/lx/lx.css';
import { LxButton } from './landing/lx/kit';

type ClientInfo = { client_name: string; redirect_ok: boolean; redirect_host: string };

const READ = ['Your daily briefing and account health', 'Analytics, ads summary and competitors', 'Calendar posts and Inbox comments'];
const DRAFT = ['Draft posts and comment replies', 'Ask to track a competitor', 'Every draft waits for your approval in ZieAds'];

export default function OAuthConsent() {
  const location = useLocation();
  const navigate = useNavigate();
  const q = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [email, setEmail] = useState<string | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'' | 'allow' | 'deny'>('');
  const [draft, setDraft] = useState(!q.get('scope') || /draft/.test(q.get('scope') || ''));

  useEffect(() => {
    document.title = 'Connect an app | ZieAds';
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/sign-in', { replace: true, state: { from: location.pathname + location.search } });
        return;
      }
      setEmail(data.session.user?.email || '');
    });
    const cid = q.get('client_id');
    if (!cid) {
      setErr('This link is missing the app details. Start the connection again from your AI assistant.');
      return;
    }
    fetch(`/api/oauth/client?client_id=${encodeURIComponent(cid)}&redirect_uri=${encodeURIComponent(q.get('redirect_uri') || '')}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Unknown app');
        if (!j.redirect_ok) throw new Error("This app's return address does not match its registration. Start the connection again.");
        setClient(j);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const decide = async (decision: 'allow' | 'deny') => {
    setBusy(decision);
    setErr('');
    try {
      const r = await api('/api/oauth/authorize', {
        body: {
          decision,
          client_id: q.get('client_id'),
          redirect_uri: q.get('redirect_uri'),
          response_type: q.get('response_type') || 'code',
          code_challenge: q.get('code_challenge'),
          code_challenge_method: q.get('code_challenge_method'),
          state: q.get('state'),
          scope: draft ? 'read draft' : 'read',
        },
      });
      window.location.href = r.redirect;
    } catch (e: any) {
      setErr(e.message);
      setBusy('');
    }
  };

  return (
    <div className="lx oc">
      <div className="oc-card">
        <div className="oc-brand">
          <ZieAdsLogo size={28} />
          <span><ZieAdsWordmark /></span>
        </div>

        {err ? (
          <>
            <h1>We could not connect this app</h1>
            <p className="oc-sub">{err}</p>
            <LxButton variant="white" block onClick={() => navigate('/settings/api')}>
              Open API and MCP settings
            </LxButton>
          </>
        ) : !client || email === null ? (
          <p className="oc-sub">Checking the app...</p>
        ) : (
          <>
            <h1>
              Allow <strong>{client.client_name}</strong> to use your ZieAds account?
            </h1>
            <p className="oc-sub">
              Signed in as {email}. After you allow it, you return to {client.redirect_host || 'the app'}.
            </p>

            <div className="oc-scope">
              <div className="oc-scope-head">
                <span className="oc-check is-on" aria-hidden="true">
                  <Check size={12} />
                </span>
                Read your data
              </div>
              <ul>
                {READ.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <label className="oc-scope is-toggle">
              <div className="oc-scope-head">
                <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
                <span className={`oc-check ${draft ? 'is-on' : ''}`} aria-hidden="true">
                  {draft && <Check size={12} />}
                </span>
                Create drafts
              </div>
              <ul>
                {DRAFT.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </label>

            <p className="oc-note">The app can never publish, reply or spend money on its own. You can disconnect it any time in Settings, API and MCP.</p>

            <div className="oc-btns">
              <LxButton variant="white" disabled={!!busy} onClick={() => decide('deny')}>
                {busy === 'deny' ? 'Cancelling...' : 'Cancel'}
              </LxButton>
              <LxButton variant="orange" disabled={!!busy} onClick={() => decide('allow')}>
                {busy === 'allow' ? 'Connecting...' : 'Allow access'}
              </LxButton>
            </div>
          </>
        )}
      </div>

      <style>{`
        .oc { min-height: 100vh; min-height: 100dvh; display: grid; place-items: center; padding: 24px 16px; background: linear-gradient(180deg, #fff 0%, #fff6f0 100%); }
        .oc-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid var(--lx-line); border-radius: 18px; padding: 28px; box-shadow: 0 24px 60px rgba(17, 17, 17, 0.06); }
        .oc-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 22px; }
        .oc-brand span { font-size: 19px; font-weight: 700; letter-spacing: -0.02em; }
        .oc h1 { margin: 0; font-size: 22px; line-height: 1.25; letter-spacing: -0.02em; font-weight: 620; }
        .oc h1 strong { font-weight: 700; }
        .oc-sub { margin: 10px 0 20px; font-size: 13.5px; line-height: 1.5; color: var(--lx-muted); }
        .oc-scope { display: block; border: 1px solid var(--lx-line); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
        .oc-scope.is-toggle { cursor: pointer; }
        .oc-scope input { position: absolute; opacity: 0; width: 0; height: 0; }
        .oc-scope input:focus-visible + .oc-check { outline: 2px solid var(--lx-orange); outline-offset: 2px; }
        .oc-scope-head { position: relative; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; }
        .oc-check { width: 18px; height: 18px; border-radius: 5px; border: 1px solid #cfcfcf; display: inline-flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
        .oc-check.is-on { background: var(--lx-ink); border-color: var(--lx-ink); }
        .oc-scope ul { margin: 8px 0 0 28px; padding: 0; list-style: disc; font-size: 13px; line-height: 1.6; color: var(--lx-ink-2); }
        .oc-note { margin: 14px 0 20px; font-size: 12.5px; line-height: 1.5; color: var(--lx-faint); }
        .oc-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .oc-btns .lx-btn { width: 100%; }
      `}</style>
    </div>
  );
}
