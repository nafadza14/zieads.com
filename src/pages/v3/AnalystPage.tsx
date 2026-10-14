/*
  AI Analyst: the home screen of ZieAds.
  Zie monitors every connected account around the clock. This page answers, for
  the last 24 hours, 3 days, 7 days or 30 days:
    1. What needs me right now?           (Needs you now)
    2. What happened?                      (KPIs vs the previous period, What changed)
    3. What are people saying?             (Comment monitor)
    4. What is working?                    (Content performance)
    5. What should I do next?              (Zie's briefing and actions)
  Everything ends in an action: open the item, or hand the task to Zie.
*/
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleDailyBriefing } from '../../data/sample-data';
import { sampleOverview, type Period } from '../../data/sample-overview';
import { Button, Card, CardTitle, CountUp, EmptyState, PageBody, PageHeader, Pill, SegTabs, Skeleton } from '../../components/v3/ui';
import SocialIcon from '../../components/v3/SocialIcon';
import ZieAvatar from '../../components/ZieAvatar';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  Link2,
  MessageCircle,
  MessageSquareWarning,
  Minus,
  RefreshCw,
  ShoppingBag,
  Smile,
  Sparkles,
  Timer,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import './analyst.css';

const PERIODS: { id: Period; label: string; long: string }[] = [
  { id: '24h', label: '24h', long: 'last 24 hours' },
  { id: '3d', label: '3 days', long: 'last 3 days' },
  { id: '7d', label: '7 days', long: 'last 7 days' },
  { id: '30d', label: '30 days', long: 'last 30 days' },
];

const ago = (iso?: string | null) => {
  if (!iso) return 'not yet';
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};
const fmtHours = (h: number | null | undefined) => (h === null || h === undefined ? 'n/a' : h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${h.toFixed(1)} h` : `${Math.round(h / 24)} d`);
const compact = (n: number) => (Math.abs(n) >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString());

function Delta({ pct, invert = false }: { pct: number | null | undefined; invert?: boolean }) {
  if (pct === null || pct === undefined) return <span className="zan-delta is-flat">new</span>;
  if (pct === 0) return <span className="zan-delta is-flat"><Minus size={11} /> 0%</span>;
  const up = pct > 0;
  const good = invert ? !up : up;
  return (
    <span className={`zan-delta ${good ? 'is-good' : 'is-bad'}`}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(pct)}%
    </span>
  );
}

/** Tiny single-series sparkline, drawn from the period series */
function Spark({ values }: { values: number[] }) {
  if (!values.length || values.every((v) => v === 0)) return null;
  const max = Math.max(...values, 1);
  const w = 100;
  const h = 26;
  const step = w / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(' ');
  return (
    <svg className="zan-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Comment volume per time bucket, with a hover tooltip per bar */
function CommentBars({ series }: { series: any[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((s) => s.comments));
  const ticks = [0, Math.ceil(max / 2), max];
  return (
    <div className="zan-bars-wrap">
      <div className="zan-bars-axis" aria-hidden="true">
        {ticks.reverse().map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="zan-bars" role="img" aria-label={`Comments per period: ${series.map((s) => `${s.label} ${s.comments}`).join(', ')}`}>
        {series.map((s, i) => (
          <div key={i} className="zan-bar-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="zan-bar-track">
              <div className="zan-bar" style={{ height: `${(s.comments / max) * 100}%`, animationDelay: `${i * 25}ms` }}>
                {s.negative > 0 && <span className="zan-bar-neg" style={{ height: `${(s.negative / Math.max(1, s.comments)) * 100}%` }} />}
              </div>
            </div>
            {i % Math.ceil(series.length / 6) === 0 && <span className="zan-bar-label">{s.label}</span>}
            {hover === i && (
              <div className="zan-tip" role="tooltip">
                <strong>{s.label}</strong>
                <span>{s.comments} comments</span>
                {s.negative > 0 && <span className="is-bad">{s.negative} negative</span>}
                {s.posts > 0 && <span>{s.posts} post published</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const SEV_ICON: Record<string, ReactNode> = {
  bad: <AlertTriangle size={14} />,
  warn: <MessageSquareWarning size={14} />,
  good: <CheckCircle2 size={14} />,
  info: <Sparkles size={14} />,
};

export default function AnalystPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [period, setPeriod] = useState<Period>(() => {
    try {
      return (localStorage.getItem('zieads_analyst_period') as Period) || '24h';
    } catch {
      return '24h';
    }
  });
  const [data, setData] = useState<any>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [note, setNote] = useState('');
  const autoSynced = useRef(false);

  const headers = async () => {
    const { data: s } = await supabase.auth.getSession();
    const token = s?.session?.access_token;
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const load = useCallback(
    async (p: Period) => {
      if (demo.isActive) {
        setData(sampleOverview(p));
        setBriefing(sampleDailyBriefing);
        setLoading(false);
        return;
      }
      try {
        const h = await headers();
        const [ov, br] = await Promise.all([fetch(`/api/v3/analyst/overview?period=${p}`, { headers: h }), briefing ? null : fetch('/api/v3/analyst/briefing', { headers: h })]);
        const j = await ov.json();
        if (j.success) setData(j.data);
        if (br) {
          const bj = await br.json();
          if (bj.success) setBriefing(bj.data);
        }
      } catch (e) {
        console.error('[Analyst] load failed', e);
      } finally {
        setLoading(false);
      }
    },
    [demo.isActive, briefing],
  );

  const sync = useCallback(
    async (force: boolean) => {
      if (demo.isActive) {
        setNote('Demo mode uses sample data.');
        return;
      }
      setSyncing(true);
      try {
        const res = await fetch('/api/v3/analyst/sync', { method: 'POST', headers: await headers(), body: JSON.stringify({ force }) });
        const j = await res.json();
        if (force) setNote(j.skipped === 'fresh' ? 'Already up to date.' : j.skipped === 'no_connections' ? 'Connect an account first.' : 'Fresh data pulled from your channels.');
        await load(period);
      } catch {
        if (force) setNote('Sync failed. Zie will retry on the next check.');
      } finally {
        setSyncing(false);
      }
    },
    [demo.isActive, load, period],
  );

  useEffect(() => {
    setLoading(true);
    load(period);
    try {
      localStorage.setItem('zieads_analyst_period', period);
    } catch {}
  }, [period, demo.isActive]);

  // Opening the dashboard triggers a quiet refresh if the data is older than 15 minutes
  useEffect(() => {
    if (!autoSynced.current && data && !demo.isActive && data.monitoring?.channels?.length) {
      autoSynced.current = true;
      sync(false);
    }
  }, [data, demo.isActive, sync]);

  // Keep the screen live while it is open
  useEffect(() => {
    const t = window.setInterval(() => load(period), 5 * 60 * 1000);
    return () => window.clearInterval(t);
  }, [load, period]);

  const compile = async () => {
    if (demo.isActive) {
      setNote('The briefing is pre-filled in demo mode.');
      return;
    }
    setCompiling(true);
    try {
      const res = await fetch('/api/v3/analyst/briefing', { method: 'POST', headers: await headers() });
      const j = await res.json();
      if (j.success && j.data) setBriefing(j.data);
      else setNote(j.error || 'The briefing could not be compiled right now.');
    } catch {
      setNote('The briefing could not be compiled right now.');
    } finally {
      setCompiling(false);
    }
  };

  const askZie = (prompt: string) => navigate('/agent', { state: { prompt } });

  const p = PERIODS.find((x) => x.id === period)!;
  const k = data?.kpis;
  const channels: any[] = data?.monitoring?.channels || [];
  const hasChannels = channels.length > 0;
  const series: any[] = data?.series || [];
  const sentiment = data?.comments?.sentiment || { positive: 0, neutral: 0, negative: 0 };
  const sentTotal = sentiment.positive + sentiment.neutral + sentiment.negative;
  const nextCheck = useMemo(() => {
    const last = data?.monitoring?.last_sync_at ? new Date(data.monitoring.last_sync_at).getTime() : 0;
    const mins = Math.max(1, Math.round((last + 30 * 60000 - Date.now()) / 60000));
    return last ? (mins > 30 ? 'soon' : `in about ${mins} min`) : 'soon';
  }, [data]);

  const kpiTiles = k
    ? [
        { key: 'comments', icon: <MessageCircle />, label: 'Comments', value: k.comments.value, delta: k.comments.change_pct, spark: series.map((s) => s.comments), hint: `vs ${k.comments.previous} before` },
        { key: 'unanswered', icon: <Clock />, label: 'Waiting for a reply', value: k.unanswered.value, hint: k.unanswered.overdue_24h ? `${k.unanswered.overdue_24h} over 24h` : 'None overdue', tone: k.unanswered.overdue_24h ? 'bad' : 'good', link: '/inbox' },
        { key: 'buying', icon: <ShoppingBag />, label: 'Buying questions', value: k.buying_questions.value, delta: k.buying_questions.change_pct, hint: 'Price, stock, how to order' },
        { key: 'response', icon: <Timer />, label: 'Response rate', value: k.response_rate.value, suffix: '%', delta: k.response_rate.change_pct, hint: `Median reply ${fmtHours(k.median_reply_hours.value)}` },
        { key: 'followers', icon: <UserPlus />, label: 'Follower change', value: k.followers.net, signed: true, hint: `${compact(k.followers.value)} total` , deltaRaw: k.followers.change_pct },
        { key: 'reach', icon: <Eye />, label: 'Reach', value: k.reach.value, delta: k.reach.change_pct, compact: true },
        { key: 'interactions', icon: <Heart />, label: 'Interactions', value: k.interactions.value, delta: k.interactions.change_pct, spark: series.map((s) => s.interactions), compact: true, hint: k.engagement_rate.value !== null ? `${k.engagement_rate.value}% engagement rate` : undefined },
        { key: 'posts', icon: <CalendarDays />, label: 'Posts published', value: k.posts.value, delta: k.posts.change_pct, hint: data.publishing?.upcoming ? `${data.publishing.upcoming} scheduled ahead` : 'Nothing scheduled ahead' },
      ]
    : [];

  return (
    <V3Layout>
      <PageHeader
        number="01"
        label="AI Analyst"
        title="Here is what Zie saw."
        subtitle={`Every connected account, watched around the clock. Showing the ${p.long} compared with the ${p.long.replace('last ', 'previous ')}.`}
        actions={
          <>
            <SegTabs size="sm" tabs={PERIODS.map((x) => ({ id: x.id, label: x.label }))} value={period} onChange={(v) => setPeriod(v as Period)} />
          </>
        }
      />

      <PageBody>
        {/* Live monitoring strip */}
        <section className={`zan-live ${hasChannels ? '' : 'is-off'}`}>
          <ZieAvatar size={44} active={syncing || hasChannels} />
          <div className="zan-live-text">
            <strong>{hasChannels ? `Zie is watching ${channels.length} ${channels.length === 1 ? 'channel' : 'channels'}` : 'Zie is ready to start watching'}</strong>
            <span>
              {hasChannels ? (
                <>
                  Last check {ago(data?.monitoring?.last_sync_at)} · next check {nextCheck}
                </>
              ) : (
                'Connect an account and Zie monitors comments, growth and posts 24/7.'
              )}
            </span>
          </div>
          <div className="zan-live-channels">
            {channels.map((c) => (
              <span key={c.platform} className={`zan-chan is-${c.status}`} title={`${c.handle || c.platform}: ${c.status}, last sync ${ago(c.last_synced_at)}`}>
                <SocialIcon platform={c.platform} size={18} />
                <i />
              </span>
            ))}
          </div>
          <div className="zan-live-actions">
            {hasChannels ? (
              <>
                <Button variant="secondary" size="sm" icon={<RefreshCw />} loading={syncing} onClick={() => sync(true)}>
                  Sync now
                </Button>
                <Button variant="soft" size="sm" icon={<Sparkles />} loading={compiling} onClick={compile}>
                  Compile briefing
                </Button>
              </>
            ) : (
              <Button icon={<Link2 />} onClick={() => navigate('/connections')}>
                Connect accounts
              </Button>
            )}
          </div>
          {note && (
            <p className="zan-note" onAnimationEnd={() => setTimeout(() => setNote(''), 3000)}>
              {note}
            </p>
          )}
        </section>

        {loading && !data ? (
          <div className="zan-kpis">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton height={12} width="50%" />
                <Skeleton height={28} width="40%" />
              </Card>
            ))}
          </div>
        ) : !hasChannels && !demo.isActive ? (
          <Card>
            <EmptyState
              icon={<BarChart3 size={22} />}
              title="Your analyst starts the moment you connect"
              body="Zie checks your comments, followers, reach and posts every few minutes and tells you what changed in the last 24 hours, 3 days, 7 days and 30 days."
              action={<Button icon={<Link2 />} onClick={() => navigate('/connections')}>Connect accounts</Button>}
            />
          </Card>
        ) : (
          <>
            {/* KPI tiles */}
            <section className="zan-kpis" aria-label={`Key numbers for the ${p.long}`}>
              {kpiTiles.map((t: any, i) => (
                <button
                  key={t.key}
                  type="button"
                  className={`zan-kpi ${t.tone ? `is-${t.tone}` : ''}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => t.link && navigate(t.link)}
                  disabled={!t.link}
                >
                  <span className="zan-kpi-top">
                    <span className="zan-kpi-icon">{t.icon}</span>
                    <span className="zan-kpi-label">{t.label}</span>
                    {t.delta !== undefined && <Delta pct={t.delta} />}
                  </span>
                  <span className="zan-kpi-value">
                    {t.signed && t.value > 0 ? '+' : ''}
                    {t.compact && Math.abs(t.value) >= 10000 ? compact(t.value) : <CountUp value={t.value} format />}
                    {t.suffix}
                  </span>
                  <span className="zan-kpi-foot">
                    {t.hint && <small>{t.hint}</small>}
                    {t.spark && <Spark values={t.spark} />}
                  </span>
                </button>
              ))}
            </section>

            <div className="zan-grid">
              {/* Needs you now */}
              <Card className="zan-todo">
                <CardTitle icon={<AlertTriangle />} sub="Things only you can decide">
                  Needs you now
                </CardTitle>
                {data?.todo?.length ? (
                  <ul className="zan-todo-list">
                    {data.todo.map((t: any, i: number) => (
                      <li key={t.key} className={`is-${t.severity}`} style={{ animationDelay: `${i * 60}ms` }}>
                        <span className="zan-todo-ico">{SEV_ICON[t.severity] || SEV_ICON.info}</span>
                        <div>
                          <strong>{t.title}</strong>
                          <small>{t.detail}</small>
                        </div>
                        <Button size="sm" variant={t.prompt ? 'soft' : 'secondary'} icon={t.prompt ? <Sparkles /> : undefined} onClick={() => (t.prompt ? askZie(t.prompt) : navigate(t.link))}>
                          {t.cta}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="zan-clear">
                    <CheckCircle2 size={16} /> All clear. Nothing is waiting for you right now.
                  </p>
                )}
              </Card>

              {/* What changed */}
              <Card className="zan-feed">
                <CardTitle icon={<TrendingUp />} sub={`Everything Zie noticed in the ${p.long}`}>
                  What changed
                </CardTitle>
                {data?.events?.length ? (
                  <ol className="zan-timeline">
                    {data.events.slice(0, 8).map((e: any, i: number) => (
                      <li key={i} className={`is-${e.severity}`}>
                        <span className="zan-tl-dot">{SEV_ICON[e.severity]}</span>
                        <div className="zan-tl-body">
                          <strong>{e.title}</strong>
                          {e.detail && <small>{e.detail}</small>}
                        </div>
                        <span className="zan-tl-time">{ago(e.at)}</span>
                        {e.link && (
                          <button type="button" className="zan-tl-link" onClick={() => (e.link.startsWith('http') ? window.open(e.link, '_blank') : navigate(e.link))} aria-label="Open">
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="zan-clear">Quiet period. No new comments, posts or changes yet.</p>
                )}
              </Card>
            </div>

            {/* Comment monitor */}
            <Card className="zan-comments">
              <CardTitle
                icon={<MessageCircle />}
                sub={`${k?.comments.value ?? 0} comments in the ${p.long}, ${data?.comments?.questions ?? 0} questions`}
                action={
                  <Button size="sm" variant="soft" icon={<Sparkles />} onClick={() => askZie(`Analyze my comments from the ${p.long}: group them into themes, flag complaints and buying questions, and draft replies for the ones that need an answer`)}>
                    Analyze with Zie
                  </Button>
                }
              >
                Comment monitor
              </CardTitle>
              <div className="zan-comments-grid">
                <div>
                  <span className="zan-eyebrow">Comments over time</span>
                  {series.length ? <CommentBars series={series} /> : <Skeleton height={140} />}
                  <div className="zan-legend">
                    <span><i className="is-all" /> Comments</span>
                    <span><i className="is-neg" /> Negative</span>
                  </div>
                </div>
                <div className="zan-comments-side">
                  <span className="zan-eyebrow">Sentiment</span>
                  <div className="zan-sent" role="img" aria-label={`Positive ${sentiment.positive}, neutral ${sentiment.neutral}, negative ${sentiment.negative}`}>
                    {(['positive', 'neutral', 'negative'] as const).map((s) =>
                      sentiment[s] ? <span key={s} className={`is-${s}`} style={{ flexGrow: sentiment[s] }} /> : null,
                    )}
                  </div>
                  <div className="zan-sent-legend">
                    <span><Smile size={13} /> {sentTotal ? Math.round((sentiment.positive / sentTotal) * 100) : 0}% positive</span>
                    <span>{sentiment.neutral} neutral</span>
                    <span className="is-bad">{sentiment.negative} negative</span>
                  </div>
                  {data?.comments?.themes?.length > 0 && (
                    <>
                      <span className="zan-eyebrow">People keep mentioning</span>
                      <div className="zan-themes">
                        {data.comments.themes.map((t: any) => (
                          <span key={t.word}>
                            {t.word} <b>{t.count}</b>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {data?.comments?.waiting?.length > 0 && (
                <div className="zan-waiting">
                  <span className="zan-eyebrow">Waiting longest</span>
                  {data.comments.waiting.slice(0, 4).map((c: any) => (
                    <button key={c.id} type="button" className="zan-wait" onClick={() => navigate(`/inbox?comment=${c.id}`)}>
                      <SocialIcon platform={c.platform} size={16} />
                      <span className="zan-wait-who">@{c.from}</span>
                      <span className="zan-wait-text">{c.text}</span>
                      {c.intent && <Pill tone="accent">Buying</Pill>}
                      {c.sentiment === 'negative' && <Pill tone="bad">Negative</Pill>}
                      {c.has_ai_draft && <Pill tone="good">Draft ready</Pill>}
                      <span className={`zan-wait-time ${c.waiting_hours >= 24 ? 'is-late' : ''}`}>{fmtHours(c.waiting_hours)}</span>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <div className="zan-grid">
              {/* Content */}
              <Card>
                <CardTitle icon={<BarChart3 />} sub={`Ranked by interactions, ${p.long}`} action={<Button size="sm" variant="ghost" onClick={() => navigate('/analytics')}>Analytics</Button>}>
                  What is working
                </CardTitle>
                {data?.content?.top?.length ? (
                  <ol className="zan-top">
                    {data.content.top.map((post: any, i: number) => (
                      <li key={post.id}>
                        <span className="zan-top-rank">{i + 1}</span>
                        <SocialIcon platform={post.platform} size={18} />
                        <div>
                          <strong>{post.caption || 'Untitled post'}</strong>
                          <small>
                            <span className="zan-fmt">{String(post.format).replace(/_/g, ' ').toLowerCase()}</span> · {ago(post.posted_at)}
                          </small>
                        </div>
                        <span className="zan-top-num">
                          <b>{compact(post.interactions)}</b>
                          <small>interactions</small>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="zan-clear">No posts in this period yet.</p>
                )}
                {data?.content?.by_format?.length > 1 && (
                  <div className="zan-formats">
                    {data.content.by_format.map((f: any) => (
                      <span key={f.format}>
                        <span className="zan-fmt">{String(f.format).replace(/_/g, ' ').toLowerCase()}</span> <b>{f.avg_interactions}</b> avg
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              {/* Briefing */}
              <Card className="zan-brief">
                <CardTitle icon={<Sparkles />} sub={briefing?.briefing_date ? `Compiled for ${briefing.briefing_date}` : 'Your daily summary from Zie'}>
                  Zie's briefing
                </CardTitle>
                {briefing ? (
                  <>
                    <p className="zan-brief-head">{briefing.headline && briefing.headline !== "Today's ZieAds Briefing" ? briefing.headline : briefing.summary}</p>
                    {briefing.headline && briefing.summary && briefing.headline !== briefing.summary && <p className="zan-brief-sum">{briefing.summary}</p>}
                    {briefing.today_actions?.length > 0 && (
                      <ul className="zan-actions">
                        {briefing.today_actions.slice(0, 3).map((a: any, i: number) => (
                          <li key={i}>
                            <span className="zan-action-n">{i + 1}</span>
                            <div>
                              <strong>{a.action}</strong>
                              {a.reasoning && <small>{a.reasoning}</small>}
                            </div>
                            <Button size="sm" variant="ghost" icon={<Sparkles />} onClick={() => askZie(`Help me do this now: ${a.action}`)}>
                              Do it
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <div className="zan-brief-empty">
                    <p>No briefing for today yet. Zie compiles one every morning; you can also compile it now.</p>
                    <Button variant="soft" size="sm" icon={<Sparkles />} loading={compiling} onClick={compile}>
                      Compile briefing
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Ask Zie about this period */}
            <section className="zan-ask">
              <ZieAvatar size={32} />
              <span>Want the story behind these numbers?</span>
              <div className="zan-ask-chips">
                {[
                  `What happened in the ${p.long}?`,
                  `Why did my reach change in the ${p.long}?`,
                  `Which comments should I answer first?`,
                ].map((q) => (
                  <button key={q} type="button" onClick={() => askZie(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </PageBody>
    </V3Layout>
  );
}
