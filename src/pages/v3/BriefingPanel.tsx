/*
  Answer-first briefing (spec 7.2) and the activation checklist (spec 7.1).
  Order on screen: summary, Needs you, wins and concerns, 3 actions with
  Approve / Edit / Dismiss, channel status. Every action is an agent task:
  approving it is recorded in the activity log, then Zie does the work.
*/
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, CheckCircle2, Circle, Pencil, X } from 'lucide-react';
import { Button, Card, CardTitle, Pill } from '../../components/v3/ui';
import SocialIcon from '../../components/v3/SocialIcon';
import ZIcon from '../../components/icons/ZIcon';
import { api } from '../../lib/api';

export interface BriefingV2 {
  version: 2;
  date: string;
  headline: string;
  summary: string[];
  needs_you: Array<{ title: string; detail?: string; link?: string }>;
  wins: Array<{ title: string; detail?: string; delta_pct?: number | null }>;
  concerns: Array<{ title: string; detail?: string; delta_pct?: number | null; link?: string }>;
  actions: Array<{ rank: number; title: string; why: string; kind: string; prompt?: string; link?: string; evidence: Array<{ label: string; value?: string | number }>; task_id?: string; task_status?: string }>;
  channels: Array<{ platform: string; handle?: string; status: string; last_synced_at?: string | null; error?: string | null }>;
  reliability?: { due: number; published: number; on_time: number; failed: number; on_time_rate: number | null };
}

function Change({ pct }: { pct?: number | null }) {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  return (
    <span className={`zbr-delta ${up ? 'is-up' : 'is-down'}`}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(pct)}%
    </span>
  );
}

export function BriefingPanel({ briefing, sample = false, compiling = false, onCompile, liveNeeds }: { briefing: BriefingV2 | null; sample?: boolean; compiling?: boolean; onCompile?: () => void; liveNeeds?: Array<{ title: string; detail?: string; link?: string; prompt?: string; cta?: string }> }) {
  const navigate = useNavigate();
  const [state, setState] = useState<Record<string, 'approved' | 'dismissed' | 'busy' | 'error'>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [err, setErr] = useState('');

  if (!briefing) {
    return (
      <Card className="zbr">
        <CardTitle icon={<ZIcon name="briefing" />} sub="Your daily summary from Zie">
          Today's briefing
        </CardTitle>
        <div className="zbr-empty">
          <p>No briefing yet today. Zie compiles one at your briefing time, or you can get it now.</p>
          {onCompile && (
            <Button variant="soft" size="sm" icon={<ZIcon name="briefing" />} loading={compiling} onClick={onCompile}>
              Compile briefing
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const go = (a: BriefingV2['actions'][number], text?: string) => {
    const prompt = text || a.prompt;
    if (prompt) navigate('/agent', { state: { prompt } });
    else if (a.link) navigate(a.link);
  };

  const approve = async (a: BriefingV2['actions'][number]) => {
    const text = edits[a.rank];
    if (sample || !a.task_id) return go(a, text);
    setState((s) => ({ ...s, [a.rank]: 'busy' }));
    setErr('');
    try {
      const r = await api(`/api/v3/tasks/${a.task_id}/approve`, { body: {} });
      setState((s) => ({ ...s, [a.rank]: 'approved' }));
      if (text || a.prompt) go(a, text);
      else if (r.next) navigate(r.next);
    } catch (e: any) {
      // Already handled elsewhere still means the user can continue
      if (e.status === 409) {
        setState((s) => ({ ...s, [a.rank]: 'approved' }));
        go(a, text);
      } else {
        setState((s) => ({ ...s, [a.rank]: 'error' }));
        setErr(e.message);
      }
    }
  };

  const dismiss = async (a: BriefingV2['actions'][number]) => {
    setState((s) => ({ ...s, [a.rank]: 'dismissed' }));
    if (!sample && a.task_id) await api(`/api/v3/tasks/${a.task_id}/dismiss`, { body: {} }).catch(() => null);
  };

  const r = briefing.reliability;
  // Live items from the monitor replace the morning snapshot, so Needs you is never stale
  const needs = liveNeeds && liveNeeds.length ? liveNeeds : briefing.needs_you;
  return (
    <Card className="zbr">
      <CardTitle
        icon={<ZIcon name="briefing" />}
        sub={sample ? 'Sample data' : `Compiled for ${briefing.date}`}
        action={
          !sample && onCompile ? (
            <Button size="sm" variant="ghost" loading={compiling} onClick={onCompile}>
              Refresh
            </Button>
          ) : undefined
        }
      >
        Today's briefing
      </CardTitle>

      <h2 className="zbr-headline">{briefing.headline}</h2>
      <ul className="zbr-summary">
        {briefing.summary.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      {needs.length > 0 && (
        <section className="zbr-block">
          <h3>Needs you</h3>
          <ul className="zbr-needs">
            {needs.map((n: any) => (
              <li key={n.title}>
                <span className="zbr-dot is-bad" aria-hidden="true" />
                <div>
                  <strong>{n.title}</strong>
                  {n.detail && <small>{n.detail}</small>}
                </div>
                {(n.link || n.prompt) && (
                  <Button size="sm" variant="secondary" iconRight={<ArrowRight size={14} />} onClick={() => (n.prompt ? navigate('/agent', { state: { prompt: n.prompt } }) : navigate(n.link))}>
                    {n.cta || 'Open'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(briefing.wins.length > 0 || briefing.concerns.length > 0) && (
        <div className="zbr-two">
          <section className="zbr-block">
            <h3>Wins</h3>
            {briefing.wins.length ? (
              <ul className="zbr-list">
                {briefing.wins.map((w) => (
                  <li key={w.title}>
                    <span className="zbr-dot is-good" aria-hidden="true" />
                    <div>
                      <strong>
                        {w.title} {!/%/.test(w.title) && <Change pct={w.delta_pct} />}
                      </strong>
                      {w.detail && <small>{w.detail}</small>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="zbr-muted">No big wins this week.</p>
            )}
          </section>
          <section className="zbr-block">
            <h3>Concerns</h3>
            {briefing.concerns.length ? (
              <ul className="zbr-list">
                {briefing.concerns.map((c) => (
                  <li key={c.title}>
                    <span className="zbr-dot is-warn" aria-hidden="true" />
                    <div>
                      <strong>
                        {c.title} {!/%/.test(c.title) && <Change pct={c.delta_pct} />}
                      </strong>
                      {c.detail && <small>{c.detail}</small>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="zbr-muted">Nothing worrying moved.</p>
            )}
          </section>
        </div>
      )}

      <section className="zbr-block">
        <h3>3 actions for today</h3>
        <ol className="zbr-actions">
          {briefing.actions.map((a) => {
            const st = state[a.rank] || (a.task_status === 'executed' || a.task_status === 'approved' ? 'approved' : a.task_status === 'dismissed' ? 'dismissed' : undefined);
            return (
              <li key={a.rank} className={st === 'dismissed' ? 'is-dismissed' : ''}>
                <span className="zbr-n">{a.rank}</span>
                <div className="zbr-action-body">
                  <strong>{a.title}</strong>
                  <small>{a.why}</small>
                  {a.evidence?.length > 0 && (
                    <span className="zbr-evidence">
                      {a.evidence.map((e) => (
                        <span key={e.label}>
                          {e.label}: <b>{e.value}</b>
                        </span>
                      ))}
                    </span>
                  )}
                  {editing === a.rank && (
                    <textarea
                      className="zbr-edit"
                      aria-label="Edit what Zie should do"
                      value={edits[a.rank] ?? a.prompt ?? a.title}
                      onChange={(e) => setEdits((x) => ({ ...x, [a.rank]: e.target.value }))}
                      rows={2}
                    />
                  )}
                </div>
                <div className="zbr-action-btns">
                  {st === 'approved' ? (
                    <Pill tone="good">
                      <Check size={12} /> Approved
                    </Pill>
                  ) : st === 'dismissed' ? (
                    <Pill>Dismissed</Pill>
                  ) : (
                    <>
                      <Button size="sm" variant="soft" onClick={() => approve(a)} loading={st === 'busy'}>
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={() => setEditing(editing === a.rank ? null : a.rank)} aria-label={`Edit action ${a.rank}`}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" icon={<X size={13} />} onClick={() => dismiss(a)} aria-label={`Dismiss action ${a.rank}`}>
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {err && <p className="zbr-err">{err}</p>}
      </section>

      <footer className="zbr-foot">
        <span className="zbr-channels">
          {briefing.channels.map((c) => (
            <span key={c.platform} className={`zbr-chan is-${c.status}`} title={`${c.handle || c.platform}: ${c.status}${c.error ? `, ${c.error}` : ''}`}>
              <SocialIcon platform={c.platform} size={16} />
              <span>{c.status === 'live' ? 'Live' : c.status === 'needs_reconnect' ? 'Reconnect' : 'Error'}</span>
            </span>
          ))}
        </span>
        {r && r.due > 0 && (
          <span className="zbr-rel">
            Reliability: {r.on_time} of {r.due} posts on time{r.failed ? `, ${r.failed} failed` : ''}
          </span>
        )}
      </footer>
    </Card>
  );
}

export function ActivationChecklist({ items, onDismiss }: { items: Array<{ key: string; label: string; link: string; done: boolean }>; onDismiss: () => void }) {
  const navigate = useNavigate();
  const done = items.filter((i) => i.done).length;
  return (
    <Card className="zck">
      <CardTitle sub={`${done} of ${items.length} done. Each step makes the briefing sharper.`} action={<Button size="sm" variant="ghost" onClick={onDismiss}>Hide</Button>}>
        Get set up
      </CardTitle>
      <div className="zck-bar" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length}>
        <span style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="zck-list">
        {items.map((i) => (
          <li key={i.key} className={i.done ? 'is-done' : ''}>
            <button type="button" onClick={() => !i.done && navigate(i.link)} disabled={i.done}>
              {i.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              <span>{i.label}</span>
              {!i.done && <ArrowRight size={14} />}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
