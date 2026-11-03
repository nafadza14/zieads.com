/*
  Settings > Scheduled agents (spec 7.3). Recurring prompts run by the same agent
  as the chat. Results land in the approvals list; drafts stay drafts.
*/
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, LoadingState, Pill } from '../../components/v3/ui';
import { api } from '../../lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TEMPLATES = [
  { name: 'Monday plan', cadence: 'weekly', run_at: '08:00', weekday: 1, prompt: 'Review last week across my channels, then draft 3 posts for this week based on what worked. Put them on the calendar as drafts.' },
  { name: 'Daily reply sweep', cadence: 'daily', run_at: '17:00', weekday: null, prompt: 'Draft replies for every unanswered buying question and complaint in my Inbox. Do not send them.' },
  { name: 'Friday competitor check', cadence: 'weekly', run_at: '10:00', weekday: 5, prompt: 'Summarize what my tracked competitors posted and advertised this week, and what I could learn from it.' },
];

const when = (a: any) =>
  a.cadence === 'hourly' ? `Every hour at minute ${a.run_at.split(':')[1]}` : a.cadence === 'daily' ? `Every day at ${a.run_at}` : `Every ${DAYS[a.weekday ?? 1]} at ${a.run_at}`;

export default function ScheduledAgentsSettings() {
  const navigate = useNavigate();
  const [state, setState] = useState<{ agents: any[]; limit: number; plan: string } | null>(null);
  const [form, setForm] = useState<any>({ name: '', prompt: '', cadence: 'weekly', run_at: '08:00', weekday: 1 });
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const load = () => api('/api/v3/scheduled-agents').then(setState).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  const act = async (key: string, fn: () => Promise<any>) => {
    setBusy(key);
    setErr('');
    try {
      await fn();
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (!state) return err ? <p className="st-msg is-error">{err}</p> : <LoadingState text="Loading routines" />;
  const { agents, limit, plan } = state;
  const full = limit !== -1 && agents.length >= limit;

  if (limit === 0) {
    return (
      <div className="st-card">
        <h3>Routines start on Starter</h3>
        <p>Let Zie run recurring jobs for you: a Monday plan that drafts the week, a daily reply sweep, a Friday look at competitors. Nothing it makes goes live without your approval.</p>
        <div className="st-actions">
          <Button onClick={() => navigate('/pricing')}>See plans</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="st-card">
        <h3>Your routines</h3>
        <p>
          {agents.length} of {limit === -1 ? 'unlimited' : limit} on the {plan} plan. Times use the time zone in Briefing and alerts.
        </p>
        {agents.length === 0 ? (
          <p>None yet. Start from a template below.</p>
        ) : (
          <ul className="st-agents">
            {agents.map((a) => (
              <li key={a.id}>
                <div className="st-agent-head">
                  <div>
                    <strong>{a.name}</strong>
                    <small>
                      {when(a)}
                      {a.is_active && a.next_run_at ? `. Next run ${new Date(a.next_run_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}
                    </small>
                  </div>
                  <Pill tone={a.is_active ? 'good' : 'neutral'}>{a.is_active ? 'On' : 'Off'}</Pill>
                </div>
                <p className="st-agent-prompt">{a.prompt}</p>
                {a.last_result && (
                  <div className="st-agent-result">
                    <button type="button" className="st-link" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
                      {open === a.id ? 'Hide' : 'Show'} the last result, {new Date(a.last_result.created_at).toLocaleString()}
                    </button>
                    {open === a.id && <pre className="st-agent-text">{a.last_result.text}</pre>}
                  </div>
                )}
                <div className="st-actions">
                  <Button size="sm" variant="secondary" loading={busy === `run:${a.id}`} disabled={!a.is_active} onClick={() => act(`run:${a.id}`, () => api(`/api/v3/scheduled-agents/${a.id}/run`, { body: {} }))}>
                    Run now
                  </Button>
                  <Button size="sm" variant="ghost" loading={busy === `toggle:${a.id}`} onClick={() => act(`toggle:${a.id}`, () => api(`/api/v3/scheduled-agents/${a.id}`, { body: { is_active: !a.is_active } }))}>
                    {a.is_active ? 'Turn off' : 'Turn on'}
                  </Button>
                  <Button size="sm" variant="ghost" loading={busy === `del:${a.id}`} onClick={() => act(`del:${a.id}`, () => api(`/api/v3/scheduled-agents/${a.id}/delete`, { body: {} }))} aria-label={`Delete ${a.name}`}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {err && <p className="st-msg is-error">{err}</p>}
      </div>

      {!full && (
        <div className="st-card">
          <h3>New routine</h3>
          <div className="st-templates">
            {TEMPLATES.map((t) => (
              <button key={t.name} type="button" className="zd-chip" onClick={() => setForm({ ...t })}>
                {t.name}
              </button>
            ))}
          </div>
          <div className="st-form">
            <label>
              <span>Name</span>
              <input className="st-input" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monday plan" />
            </label>
            <label>
              <span>What should Zie do?</span>
              <textarea className="st-input" rows={3} value={form.prompt} maxLength={2000} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="Review last week and draft 3 posts for this week" />
            </label>
            <div className="st-form-row">
              <label>
                <span>How often</span>
                <select className="st-select" value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value })}>
                  <option value="hourly">Every hour</option>
                  <option value="daily">Every day</option>
                  <option value="weekly">Every week</option>
                </select>
              </label>
              {form.cadence === 'weekly' && (
                <label>
                  <span>Day</span>
                  <select className="st-select" value={form.weekday ?? 1} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}>
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <span>{form.cadence === 'hourly' ? 'Minute' : 'Time'}</span>
                <input className="st-input" type="time" value={form.run_at} onChange={(e) => setForm({ ...form, run_at: e.target.value })} />
              </label>
            </div>
          </div>
          <div className="st-actions">
            <Button loading={busy === 'create'} disabled={!form.name || form.prompt.length < 10} onClick={() => act('create', async () => { await api('/api/v3/scheduled-agents', { body: { ...form, weekday: form.cadence === 'weekly' ? form.weekday ?? 1 : null } }); setForm({ name: '', prompt: '', cadence: 'weekly', run_at: '08:00', weekday: 1 }); })}>
              Create routine
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
