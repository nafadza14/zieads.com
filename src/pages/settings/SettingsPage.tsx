/*
  Settings (spec P0-1, 7.11). One route per section so every panel can be linked:
  /settings (account), /settings/brand-profile, /settings/brands, /settings/team,
  /settings/billing, /settings/notifications, /settings/api, /settings/privacy.
  /settings/connections is an alias for /connections.
*/
import { useEffect, useState, ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Bell, Building2, CreditCard, KeyRound, Shield, User, Users, Link2, BookUser, Activity, CalendarClock } from 'lucide-react';
import V3Layout from '../../components/v3/V3Layout';
import { PageBody, PageHeader, Button, Pill, LoadingState } from '../../components/v3/ui';
import ErrorBoundary from '../../components/ErrorBoundary';
import BrandSettings from './BrandSettings';
import ApiMcpSettings from './ApiMcpSettings';
import ScheduledAgentsSettings from './ScheduledAgentsSettings';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import { useCreditStore } from '../../lib/creditStore';
import { clearWorkspace, refreshWorkspaces, switchWorkspace, useWorkspaces } from '../../lib/workspaceStore';
import { CreateWorkspaceDialog, WorkspaceAvatar } from '../../components/v3/WorkspaceSwitcher';
import './settings.css';

export type SettingsSection = 'account' | 'brand-profile' | 'brands' | 'team' | 'billing' | 'notifications' | 'activity' | 'api' | 'automations' | 'privacy';

const NAV: Array<{ id: SettingsSection | 'connections'; label: string; icon: ReactNode; sep?: boolean }> = [
  { id: 'account', label: 'Account', icon: <User size={15} /> },
  { id: 'brand-profile', label: 'Brand profile', icon: <BookUser size={15} /> },
  { id: 'brands', label: 'Workspaces', icon: <Building2 size={15} /> },
  { id: 'team', label: 'Team and roles', icon: <Users size={15} /> },
  { id: 'billing', label: 'Plan and billing', icon: <CreditCard size={15} /> },
  { id: 'notifications', label: 'Briefing and alerts', icon: <Bell size={15} />, sep: true },
  { id: 'connections', label: 'Connections', icon: <Link2 size={15} /> },
  { id: 'automations', label: 'Routines', icon: <CalendarClock size={15} /> },
  { id: 'api', label: 'API and MCP', icon: <KeyRound size={15} /> },
  { id: 'activity', label: 'Activity log', icon: <Activity size={15} /> },
  { id: 'privacy', label: 'Data and privacy', icon: <Shield size={15} /> },
];

const TITLES: Record<SettingsSection, [string, string]> = {
  account: ['Account', 'Your login details'],
  'brand-profile': ['Brand profile', 'What Zie knows about your business'],
  brands: ['Workspaces', 'One workspace per brand'],
  team: ['Team and roles', 'People who help run this brand'],
  billing: ['Plan and billing', 'Your plan and what it includes'],
  notifications: ['Briefing and alerts', 'When Zie briefs you and what it alerts on'],
  activity: ['Activity log', 'Every action by you, Zie or MCP'],
  api: ['API and MCP', 'Connect Claude, ChatGPT or Cursor'],
  automations: ['Routines', 'For example, every Monday, plan my week. Results wait for your approval.'],
  privacy: ['Data and privacy', 'Export your data or delete your account'],
};

const VALID = new Set<string>(['account', 'brand-profile', 'brands', 'team', 'billing', 'notifications', 'activity', 'api', 'automations', 'privacy']);

interface SettingsData {
  settings: any;
  plan: 'free' | 'starter' | 'pro' | 'agency';
  limits: any;
  account: { email: string | null; created_at: string | null; provider: string };
}

const fmtLimit = (n: number, unit = '') => (n === -1 ? 'Unlimited' : `${n}${unit}`);

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="st-toggle" disabled={disabled} onClick={() => onChange(!checked)} />;
}

/* ── Account ── */
function AccountPanel({ data }: { data: SettingsData }) {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const resetPassword = async () => {
    setMsg('');
    setErr('');
    if (!data.account.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(data.account.email, { redirectTo: `${window.location.origin}/sign-in` });
    if (error) setErr(error.message);
    else setMsg(`We sent a password reset link to ${data.account.email}.`);
  };
  return (
    <div className="st-card">
      <h3>Login</h3>
      <p>Owner and Admin accounts should use a strong password. Two step verification arrives with team workspaces.</p>
      <dl className="st-kv">
        <dt>Email</dt>
        <dd>{data.account.email || 'Unknown'}</dd>
        <dt>Signed in with</dt>
        <dd style={{ textTransform: 'capitalize' }}>{data.account.provider}</dd>
        <dt>Member since</dt>
        <dd>{data.account.created_at ? new Date(data.account.created_at).toLocaleDateString() : 'Unknown'}</dd>
      </dl>
      <div className="st-actions">
        {data.account.provider === 'email' && (
          <Button variant="secondary" onClick={resetPassword}>
            Change password
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={async () => {
            localStorage.removeItem('zieads_onboarding_completed');
            await supabase.auth.signOut();
            navigate('/sign-in');
          }}
        >
          Sign out
        </Button>
      </div>
      {msg && <p className="st-msg">{msg}</p>}
      {err && <p className="st-msg is-error">{err}</p>}
    </div>
  );
}

/* ── Workspaces: one per brand ── */
function BrandsPanel({ data }: { data: SettingsData }) {
  const navigate = useNavigate();
  const { state, active } = useWorkspaces();
  const [creating, setCreating] = useState(false);
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null);
  const [del, setDel] = useState<{ id: string; name: string; confirm: string } | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  if (!state) return <LoadingState text="Loading workspaces" />;
  const full = state.workspaces.length >= state.limit;
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setErr('');
    setMsg('');
    try {
      await fn();
      await refreshWorkspaces();
      setMsg(ok);
    } catch (e: any) {
      setErr(e.message);
    }
  };
  return (
    <div className="st-card">
      <h3>Workspaces</h3>
      <p>
        One workspace per brand. Each has its own accounts, calendar, inbox, comments, competitors, brand profile and morning plan. Your {data.plan} plan includes {fmtLimit(state.limit)} brand{state.limit === 1 ? '' : 's'}, {state.workspaces.length} in use.
      </p>
      <table className="st-table">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Accounts</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {state.workspaces.map((w) => (
            <tr key={w.id}>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <WorkspaceAvatar ws={w} size={26} />
                  {edit?.id === w.id ? (
                    <input className="zd-input" style={{ height: 32, maxWidth: 220 }} aria-label="Workspace name" value={edit.name} maxLength={40} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                  ) : (
                    <strong>{w.name}</strong>
                  )}
                  {w.id === active?.id && <Pill tone="good">Active</Pill>}
                  {w.is_main && <Pill>Main</Pill>}
                </span>
              </td>
              <td>{w.accounts ? `${w.accounts} connected` : 'None yet'}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                {edit?.id === w.id ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>{' '}
                    <Button size="sm" onClick={() => run(() => api(`/api/workspaces/${w.id}`, { method: 'PATCH', body: { name: edit.name } }), 'Workspace renamed.').then(() => setEdit(null))}>Save</Button>
                  </>
                ) : (
                  <>
                    {w.id !== active?.id && (
                      <Button size="sm" variant="secondary" onClick={() => switchWorkspace(w.id, '/analyst')}>Open</Button>
                    )}{' '}
                    <Button size="sm" variant="ghost" onClick={() => setEdit({ id: w.id, name: w.name })}>Rename</Button>
                    {!w.is_main && (
                      <>
                        {' '}
                        <Button size="sm" variant="ghost" onClick={() => setDel({ id: w.id, name: w.name, confirm: '' })}>Delete</Button>
                      </>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {del && (
        <div className="st-danger" role="alertdialog" aria-labelledby="st-del-ws">
          <p id="st-del-ws">
            Deleting <strong>{del.name}</strong> removes its connected accounts, posts, comments, competitors and briefings for good. Type the name to confirm.
          </p>
          <input className="zd-input" style={{ maxWidth: 260 }} aria-label="Type the workspace name" value={del.confirm} onChange={(e) => setDel({ ...del, confirm: e.target.value })} />
          <div className="st-actions">
            <Button variant="ghost" onClick={() => setDel(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={del.confirm.trim().toLowerCase() !== del.name.toLowerCase()}
              onClick={() =>
                run(async () => {
                  await api(`/api/workspaces/${del.id}`, { method: 'DELETE', body: { confirm: del.confirm } });
                  if (del.id === active?.id) clearWorkspace();
                }, 'Workspace deleted.').then(() => setDel(null))
              }
            >
              Delete workspace
            </Button>
          </div>
        </div>
      )}
      <div className="st-actions">
        {full ? (
          <Button variant="secondary" onClick={() => navigate('/settings/billing')}>
            {state.limit <= 1 ? 'Add brands on Pro or Agency' : 'Upgrade for more brands'}
          </Button>
        ) : (
          <Button onClick={() => setCreating(true)}>Create workspace</Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/settings/brand-profile')}>
          Edit this brand's profile
        </Button>
      </div>
      {msg && <p className="st-msg">{msg}</p>}
      {err && <p className="st-msg is-error">{err}</p>}
      {creating && <CreateWorkspaceDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

/* ── Team ── */
function TeamPanel() {
  const [state, setState] = useState<{ members: any[]; seats: number; plan: string } | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const load = () => api('/api/settings/team').then(setState).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);
  const invite = async () => {
    setBusy(true);
    setErr('');
    try {
      await api('/api/settings/team', { body: { email, role } });
      setEmail('');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!state) return err ? <p className="st-msg is-error">{err}</p> : <LoadingState text="Loading your team" />;
  const used = state.members.length + 1;
  return (
    <div className="st-card">
      <h3>People</h3>
      <p>
        {used} of {fmtLimit(state.seats)} seat{state.seats === 1 ? '' : 's'} used. Roles: Admin manages everything except billing, Editor drafts and schedules, Viewer reads reports, Client approves posts.
      </p>
      <table className="st-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>You</td>
            <td>Owner</td>
            <td>
              <Pill tone="good">Active</Pill>
            </td>
            <td />
          </tr>
          {state.members.map((m) => (
            <tr key={m.id}>
              <td>{m.email}</td>
              <td style={{ textTransform: 'capitalize' }}>{m.role}</td>
              <td>
                <Pill tone={m.status === 'active' ? 'good' : 'warn'}>{m.status === 'active' ? 'Active' : 'Invited'}</Pill>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Button size="sm" variant="ghost" onClick={() => api(`/api/settings/team/${m.id}/revoke`, { body: {} }).then(load)}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="st-actions">
        <input className="st-input" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email to invite" style={{ flex: 1, minWidth: 200 }} />
        <select className="st-select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
          <option value="client">Client</option>
        </select>
        <Button onClick={invite} loading={busy} disabled={!email}>
          Invite
        </Button>
      </div>
      {err && <p className="st-msg is-error">{err}</p>}
    </div>
  );
}

/* ── Billing ── */
function BillingPanel({ data }: { data: SettingsData }) {
  const navigate = useNavigate();
  const credits = useCreditStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const l = data.limits;
  const isTest = /testing/i.test(credits.plan_display_name || '');
  const portal = async () => {
    setBusy(true);
    setErr('');
    try {
      const j = await api<{ url: string }>('/api/v1/credits/billing-portal', { body: {} });
      window.location.href = j.url;
    } catch (e: any) {
      setErr(e.code === 'NO_SUBSCRIPTION' ? 'You are on a plan without a paid subscription, so there is nothing to manage or cancel.' : e.message);
    } finally {
      setBusy(false);
    }
  };
  const rows: Array<[string, string]> = [
    ['Brands', fmtLimit(l.brands)],
    ['Team seats', fmtLimit(l.teamSeats)],
    ['Briefing', l.briefingCadence === 'daily' ? 'Every day' : 'Once a week'],
    ['Scheduled posts', l.postsPerMonth === -1 ? 'Unlimited' : `${l.postsPerMonth} a month`],
    ['Analytics history', l.analyticsHistoryDays === -1 ? 'Unlimited' : l.analyticsHistoryDays >= 365 ? '12 months' : `${l.analyticsHistoryDays} days`],
    ['Competitors per brand', fmtLimit(l.competitorsPerBrand)],
    ['Routines', fmtLimit(l.scheduledAgents)],
    ['Ads Analyst', l.adsAnalyst === 'full' ? 'All modes' : l.adsAnalyst === 'basic' ? 'Basic report' : 'Not included'],
    ['Client portal', l.clientPortal ? 'Included' : 'Not included'],
    ['MCP calls a day', fmtLimit(l.mcpDailyCalls)],
  ];
  return (
    <>
      <div className="st-card">
        <h3>
          {isTest ? 'Agency (test account)' : `${data.plan.charAt(0).toUpperCase()}${data.plan.slice(1)} plan`}
        </h3>
        <p>
          {isTest
            ? 'This is an internal test account with every feature open. Usage limits are not shown.'
            : 'Every AI feature is included in your plan. We email you 7 days before each renewal, and you can cancel in one click.'}
        </p>
        <div className="st-limits">
          {rows.map(([k, v]) => (
            <div key={k} className="st-limit">
              <small>{k}</small>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <div className="st-actions">
          <Button onClick={() => navigate('/pricing')}>{data.plan === 'agency' ? 'See all plans' : 'Upgrade plan'}</Button>
          {!isTest && data.plan !== 'free' && (
            <Button variant="secondary" onClick={portal} loading={busy}>
              Manage billing or cancel
            </Button>
          )}
        </div>
        {err && <p className="st-msg is-error">{err}</p>}
      </div>
    </>
  );
}

/* ── Briefing and alerts ── */
const TIMEZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Asia/Bangkok', 'Asia/Manila', 'Australia/Sydney', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'UTC'];

function NotificationsPanel({ data, onSaved }: { data: SettingsData; onSaved: (s: any) => void }) {
  const [s, setS] = useState(data.settings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const ch = s.briefing_channels || {};
  const save = async () => {
    setBusy(true);
    setMsg('');
    setErr('');
    try {
      const j = await api('/api/settings', {
        body: {
          briefing_time: s.briefing_time,
          timezone: s.timezone,
          briefing_channels: s.briefing_channels,
          alert_threshold_pct: s.alert_threshold_pct,
          unanswered_hours: s.unanswered_hours,
        },
      });
      onSaved(j.settings);
      setMsg('Saved.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="st-card">
      <h3>Daily briefing</h3>
      <p>
        {data.limits.briefingCadence === 'daily'
          ? 'Zie compiles your briefing every morning at this time.'
          : 'On the Free plan the briefing arrives once a week, on Monday at this time. Starter and above get it every day.'}
      </p>
      <div className="st-row">
        <div className="st-row-text">
          <strong>Send time</strong>
          <small>In your brand time zone.</small>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="st-input" type="time" value={s.briefing_time} onChange={(e) => setS({ ...s, briefing_time: e.target.value })} aria-label="Briefing time" />
          <select className="st-select" value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} aria-label="Time zone">
            {(TIMEZONES.includes(s.timezone) ? TIMEZONES : [s.timezone, ...TIMEZONES]).map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      {(
        [
          ['in_app', 'In the app', 'Shown on AI Analyst when you open ZieAds.'],
          ['email', 'Email', 'A short summary with a link to approve actions.'],
          ['push', 'Mobile push', 'Needs the ZieAds mobile app, coming soon.'],
        ] as const
      ).map(([k, title, sub]) => (
        <div className="st-row" key={k}>
          <div className="st-row-text">
            <strong>{title}</strong>
            <small>{sub}</small>
          </div>
          <Toggle label={title} checked={!!ch[k]} disabled={k === 'push' || k === 'in_app'} onChange={(v) => setS({ ...s, briefing_channels: { ...ch, [k]: v } })} />
        </div>
      ))}
      <h3 style={{ marginTop: 22 }}>Alerts</h3>
      <div className="st-row">
        <div className="st-row-text">
          <strong>Metric moves by more than</strong>
          <small>Compared with your 7 day average. Default 25 percent.</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input className="st-input" type="number" min={5} max={100} value={s.alert_threshold_pct} onChange={(e) => setS({ ...s, alert_threshold_pct: Number(e.target.value) })} style={{ width: 80 }} aria-label="Alert threshold percent" />
          <span className="st-msg">%</span>
        </div>
      </div>
      <div className="st-row">
        <div className="st-row-text">
          <strong>Comment waiting longer than</strong>
          <small>Unanswered comments past this time go to Needs you in the briefing.</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input className="st-input" type="number" min={1} max={72} value={s.unanswered_hours} onChange={(e) => setS({ ...s, unanswered_hours: Number(e.target.value) })} style={{ width: 80 }} aria-label="Unanswered hours" />
          <span className="st-msg">hours</span>
        </div>
      </div>
      <div className="st-actions">
        <Button onClick={save} loading={busy}>
          Save
        </Button>
      </div>
      {msg && <p className="st-msg">{msg}</p>}
      {err && <p className="st-msg is-error">{err}</p>}
    </div>
  );
}

/* ── Activity log ── */
const ACTOR_LABEL: Record<string, string> = { user: 'You', agent: 'Zie', mcp: 'MCP', guardian: 'Guardian', system: 'System' };
function ActivityPanel() {
  const [items, setItems] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api('/api/settings/activity?limit=100')
      .then((j) => setItems(j.items))
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="st-msg is-error">{err}</p>;
  if (!items) return <LoadingState text="Loading activity" />;
  return (
    <div className="st-card">
      <h3>Recent activity</h3>
      <p>This log cannot be edited. Approvals, posts, replies and setting changes all land here.</p>
      {items.length === 0 ? (
        <p className="st-msg">Nothing yet. Actions you take and actions Zie runs after your approval show up here.</p>
      ) : (
        <table className="st-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(i.created_at).toLocaleString()}</td>
                <td>{ACTOR_LABEL[i.actor] || i.actor}</td>
                <td>
                  {i.action.replace(/[._]/g, ' ')}
                  {i.detail?.title ? `: ${i.detail.title}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Data and privacy ── */
function PrivacyPanel() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const exportData = async () => {
    setErr('');
    try {
      const j = await api('/api/settings/export');
      const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zieads-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e.message);
    }
  };
  const del = async () => {
    setBusy(true);
    setErr('');
    try {
      await api('/api/settings/delete-account', { body: { confirm } });
      localStorage.clear();
      await supabase.auth.signOut();
      navigate('/data-deletion?done=account');
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };
  return (
    <>
      <div className="st-card">
        <h3>Export your data</h3>
        <p>A JSON file with your profile, settings, posts, inbox, briefings, agent history and activity log. Access tokens are never included.</p>
        <Button variant="secondary" onClick={exportData}>
          Download export
        </Button>
      </div>
      <div className="st-card">
        <h3>Disconnect one platform</h3>
        <p>Disconnecting a platform in Connections deletes the posts, comments and insights ZieAds stored from it.</p>
        <Button variant="secondary" onClick={() => navigate('/connections')}>
          Open Connections
        </Button>
      </div>
      <div className="st-card st-danger">
        <h3>Delete your account</h3>
        <p>This removes every brand, connection, post, report and conversation, then deletes your login. It cannot be undone. Type DELETE to confirm.</p>
        <div className="st-actions" style={{ marginTop: 0 }}>
          <input className="st-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" aria-label="Type DELETE to confirm" />
          <Button variant="danger" onClick={del} loading={busy} disabled={confirm !== 'DELETE'}>
            Delete account
          </Button>
        </div>
        {err && <p className="st-msg is-error">{err}</p>}
        <p className="st-msg" style={{ marginTop: 10 }}>
          Read how we handle data in the <a href="/privacy-policy">Privacy Policy</a> and on the <a href="/data-deletion">Data Deletion</a> page.
        </p>
      </div>
    </>
  );
}

export default function SettingsPage() {
  const { section = 'account' } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SettingsData | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api<SettingsData>('/api/settings')
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (section === 'connections') return <Navigate to="/connections" replace />;
  if (!VALID.has(section)) return <Navigate to="/settings" replace />;
  const s = section as SettingsSection;
  const [title, subtitle] = TITLES[s];

  const body = () => {
    if (s === 'brand-profile') return <BrandSettings />;
    if (s === 'team') return <TeamPanel />;
    if (s === 'activity') return <ActivityPanel />;
    if (s === 'api') return <ApiMcpSettings />;
    if (s === 'automations') return <ScheduledAgentsSettings />;
    if (s === 'privacy') return <PrivacyPanel />;
    if (err) return <p className="st-msg is-error">{err}</p>;
    if (!data) return <LoadingState text="Loading settings" />;
    if (s === 'account') return <AccountPanel data={data} />;
    if (s === 'brands') return <BrandsPanel data={data} />;
    if (s === 'billing') return <BillingPanel data={data} />;
    if (s === 'notifications') return <NotificationsPanel data={data} onSaved={(settings) => setData({ ...data, settings })} />;
    return null;
  };

  return (
    <V3Layout>
      <PageHeader label="Settings" title={title} subtitle={subtitle} />
      <PageBody wide>
        <div className="st">
          <nav className="st-nav" aria-label="Settings sections">
            {NAV.map((n) => (
              <div key={n.id}>
                <button
                  type="button"
                  className={`st-nav-item ${n.id === s ? 'is-active' : ''}`}
                  aria-current={n.id === s ? 'page' : undefined}
                  onClick={() => navigate(n.id === 'account' ? '/settings' : n.id === 'connections' ? '/connections' : `/settings/${n.id}`)}
                >
                  {n.icon}
                  {n.label}
                </button>
                {n.sep && <div className="st-nav-sep" />}
              </div>
            ))}
          </nav>
          <div className="st-panel">
            <ErrorBoundary area={`settings:${s}`} key={s}>
              {body()}
            </ErrorBoundary>
          </div>
        </div>
      </PageBody>
    </V3Layout>
  );
}
