/*
  Analytics (spec 7.7): Organic, Paid and Combined tabs over one date range,
  per network rows, per post table, CSV export. Metrics a platform does not
  give us show as "Not available" instead of zero, and nothing is compared
  with a made-up industry average.
*/
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { Button, Card, CardTitle, EmptyState, PageBody, PageHeader, Pill, SegTabs, Skeleton } from '../../components/v3/ui';
import SocialIcon from '../../components/v3/SocialIcon';
import { useDemoMode } from '../../lib/demoStore';
import { api, authHeaders } from '../../lib/api';
import { sampleAnalyticsReport } from '../../data/sample-data';
import { Download, Link2, Lock, Upload } from 'lucide-react';
import './analytics.css';

type Tab = 'organic' | 'paid' | 'combined';
const RANGES = [7, 30, 90, 365];
const NAMES: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn', meta: 'Meta Ads', google: 'Google Ads', tiktok_ads: 'TikTok Ads' };

const fmt = (v: number | null | undefined, opts: Intl.NumberFormatOptions = {}) =>
  v === null || v === undefined ? null : Number(v).toLocaleString(undefined, { maximumFractionDigits: 1, ...opts });
const money = (v: number | null | undefined) => fmt(v, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

function Metric({ label, value, sub, missing = 'Not available' }: { label: string; value: string | null; sub?: string | null; missing?: string }) {
  return (
    <Card className="zax-metric">
      <span className="zd-eyebrow">{label}</span>
      <div className={`zax-metric-value ${value === null ? 'is-missing' : ''}`}>{value ?? missing}</div>
      {sub && <div className="zax-metric-sub">{sub}</div>}
    </Card>
  );
}

const change = (p: number | null | undefined) => (p === null || p === undefined ? null : `${p >= 0 ? '+' : ''}${p}% vs previous period`);

/** One series, one hue: bars per day with a hover tooltip and a hidden table for screen readers */
function DailyBars({ data, field, label, format = (v: number) => v.toLocaleString() }: { data: Array<Record<string, any>>; field: string; label: string; format?: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const vals = data.map((d) => (d[field] === null || d[field] === undefined ? null : Number(d[field])));
  const known = vals.filter((v): v is number => v !== null);
  if (!known.length) return <p className="zax-muted">No {label.toLowerCase()} data for this range yet.</p>;
  const max = Math.max(1, ...known);
  const W = 640;
  const H = 160;
  const gap = data.length > 60 ? 1 : 2;
  const bw = Math.max(1, (W - gap * (data.length - 1)) / data.length);
  const h = hover !== null ? data[hover] : null;
  return (
    <figure className="zax-chart">
      <div className="zax-chart-wrap" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${label} per day`}>
          <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} className="zax-axis" />
          {vals.map((v, i) => {
            const bh = v === null ? 0 : Math.max(v > 0 ? 2 : 0, (v / max) * (H - 8));
            const x = i * (bw + gap);
            return (
              <g key={i} onMouseEnter={() => setHover(i)}>
                {/* Hit target taller than the bar so small days are easy to hover */}
                <rect x={x} y={0} width={bw + gap} height={H} fill="transparent" />
                {v !== null && <rect x={x} y={H - bh} width={bw} height={bh} rx={Math.min(4, bw / 2)} className={`zax-bar ${hover === i ? 'is-hover' : ''}`} />}
              </g>
            );
          })}
        </svg>
        {h && (
          <div className="zax-tip" style={{ left: `${(((hover || 0) + 0.5) / data.length) * 100}%` }}>
            <strong>{h[field] === null || h[field] === undefined ? 'No data' : format(Number(h[field]))}</strong>
            <span>{new Date(h.date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
      <figcaption className="zax-axis-labels">
        <span>{data[0] && new Date(data[0].date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
        <span>{data.length && new Date(data[data.length - 1].date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
      </figcaption>
      <table className="zd-sr-only">
        <caption>{label} per day</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th>{d.date}</th>
              <td>{d[field] ?? 'No data'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [tab, setTab] = useState<Tab>('organic');
  const [days, setDays] = useState(30);
  const [platform, setPlatform] = useState('');
  const [report, setReport] = useState<any>(null);
  const [maxDays, setMaxDays] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'interactions' | 'recent'>('interactions');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      if (demo.isActive) {
        setReport(sampleAnalyticsReport);
        setLoading(false);
        return;
      }
      try {
        const r = await api(`/api/v3/analytics/report?days=${days}${platform ? `&platform=${platform}` : ''}`);
        if (!alive) return;
        setReport(r);
        setMaxDays(r.max_days ?? -1);
      } catch (e: any) {
        if (!alive) return;
        if (e.status === 403 && e.body?.max_days) {
          setMaxDays(e.body.max_days);
          setDays(e.body.max_days);
        } else setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [days, platform, demo.isActive]);

  const exportCsv = async (kind: 'posts' | 'daily') => {
    if (demo.isActive) return;
    setExporting(kind);
    try {
      const res = await fetch(`/api/v3/analytics/export.csv?days=${days}&kind=${kind}${platform ? `&platform=${platform}` : ''}`, { headers: await authHeaders() });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `zieads-${kind}-${platform || 'all'}-${days}d.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(null);
    }
  };

  const o = report?.organic;
  const paid = report?.paid;
  const posts = useMemo(() => {
    const list = [...(o?.posts || [])];
    return sortBy === 'recent' ? list.sort((a, b) => (a.posted_at < b.posted_at ? 1 : -1)) : list;
  }, [o, sortBy]);
  const networks: string[] = (o?.per_network || []).map((n: any) => n.platform);
  const noOrganic = o && !o.per_network.length;

  return (
    <V3Layout>
      <PageHeader
        number="05"
        label="Analytics"
        title="Analytics"
        subtitle="Organic and paid results"
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} loading={exporting === 'posts'} onClick={() => exportCsv('posts')} disabled={demo.isActive || !o?.posts?.length}>
              Export posts CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/agent', { state: { prompt: `Explain what changed in my results over the last ${days} days and what to do next` } })}>
              Ask Zie why
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="zax-controls">
          <SegTabs
            value={tab}
            onChange={(id) => setTab(id as Tab)}
            tabs={[
              { id: 'organic' as const, label: 'Organic' },
              { id: 'paid' as const, label: 'Paid' },
              { id: 'combined' as const, label: 'Combined' },
            ]}
          />
          <div className="zax-filter-row" role="group" aria-label="Date range">
            {RANGES.map((d) => {
              const locked = maxDays !== -1 && d > maxDays;
              return (
                <button
                  key={d}
                  type="button"
                  className={`zd-chip ${days === d ? 'is-active' : ''}`}
                  aria-pressed={days === d}
                  disabled={locked}
                  title={locked ? `Your plan shows the last ${maxDays} days` : undefined}
                  onClick={() => setDays(d)}
                >
                  {locked && <Lock size={11} />} {d === 365 ? '12 months' : `${d} days`}
                </button>
              );
            })}
          </div>
          {tab !== 'paid' && networks.length > 1 && (
            <div className="zax-filter-row" role="group" aria-label="Channel">
              {['', ...networks].map((p) => (
                <button key={p || 'all'} type="button" className={`zd-chip ${platform === p ? 'is-active' : ''}`} aria-pressed={platform === p} onClick={() => setPlatform(p)}>
                  {p ? <SocialIcon platform={p} size={12} /> : null} {p ? NAMES[p] : 'All channels'}
                </button>
              ))}
            </div>
          )}
          {maxDays !== -1 && (
            <p className="zax-muted">
              Your plan keeps {maxDays} days of history. <button type="button" className="zax-link" onClick={() => navigate('/pricing')}>See plans</button>
            </p>
          )}
        </div>

        {error && <p className="zax-error" role="alert">{error}</p>}

        {loading ? (
          <div className="zax-grid-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton height={12} width="50%" />
                <Skeleton height={30} width="70%" />
              </Card>
            ))}
          </div>
        ) : !report ? null : tab === 'organic' ? (
          noOrganic ? (
            <EmptyState
              icon={<Link2 size={22} />}
              title="No connected accounts yet"
              body="Connect Instagram or Facebook and Zie fills this page with your followers, reach and post results."
              action={<Button icon={<Link2 />} onClick={() => navigate('/connections')}>Connect an account</Button>}
            />
          ) : (
            <>
              <div className="zax-grid-4">
                <Metric label="Followers" value={fmt(o.totals.followers)} sub={o.totals.followers_net !== null ? `${o.totals.followers_net >= 0 ? '+' : ''}${fmt(o.totals.followers_net)} in this range` : null} />
                <Metric label="Reach" value={fmt(o.totals.reach)} sub={o.totals.reach === null ? 'This platform does not share reach yet' : null} />
                <Metric label="Interactions" value={fmt(o.totals.interactions)} sub={change(o.totals.interactions_change_pct)} />
                <Metric label="Engagement rate" value={o.totals.engagement_rate !== null ? `${o.totals.engagement_rate}%` : null} sub={o.totals.engagement_rate !== null ? 'Interactions divided by reach' : 'Needs reach data'} />
              </div>

              <div className="zax-grid-2">
                <Card>
                  <CardTitle sub="Likes, comments, shares and saves on posts published that day">Interactions per day</CardTitle>
                  <DailyBars data={o.series} field="interactions" label="Interactions" />
                </Card>
                <Card>
                  <CardTitle sub="Daily reach reported by the platform">Reach per day</CardTitle>
                  <DailyBars data={o.series} field="reach" label="Reach" />
                </Card>
              </div>

              <Card>
                <CardTitle sub="Each connected account for the selected range">By network</CardTitle>
                <div className="zax-table-wrap">
                  <table className="zax-table">
                    <thead>
                      <tr>
                        <th>Network</th>
                        <th>Followers</th>
                        <th>Change</th>
                        <th>Reach</th>
                        <th>Posts</th>
                        <th>Interactions</th>
                        <th>Eng. rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.per_network.map((n: any) => (
                        <tr key={n.platform}>
                          <td>
                            <span className="zax-net">
                              <SocialIcon platform={n.platform} size={16} /> {NAMES[n.platform]} {n.handle && <small>{n.handle}</small>}
                            </span>
                          </td>
                          <td>{fmt(n.followers) ?? <span className="zax-na">n/a</span>}</td>
                          <td>{n.followers_net === null ? <span className="zax-na">n/a</span> : `${n.followers_net >= 0 ? '+' : ''}${fmt(n.followers_net)}`}</td>
                          <td>{fmt(n.reach) ?? <span className="zax-na">n/a</span>}</td>
                          <td>{n.posts}</td>
                          <td>{fmt(n.interactions)}</td>
                          <td>{n.engagement_rate !== null ? `${n.engagement_rate}%` : <span className="zax-na">n/a</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <CardTitle
                  sub={`${posts.length} posts in this range`}
                  action={
                    <SegTabs
                      size="sm"
                      value={sortBy}
                      onChange={(id) => setSortBy(id as any)}
                      tabs={[
                        { id: 'interactions' as const, label: 'Top' },
                        { id: 'recent' as const, label: 'Recent' },
                      ]}
                    />
                  }
                >
                  Posts
                </CardTitle>
                {posts.length === 0 ? (
                  <p className="zax-muted">No posts in this range.</p>
                ) : (
                  <div className="zax-table-wrap">
                    <table className="zax-table">
                      <thead>
                        <tr>
                          <th>Post</th>
                          <th>Date</th>
                          <th>Likes</th>
                          <th>Comments</th>
                          <th>Shares</th>
                          <th>Saves</th>
                          <th>Reach</th>
                          <th>Eng. rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.slice(0, 50).map((p: any) => (
                          <tr key={p.id}>
                            <td className="zax-post">
                              <SocialIcon platform={p.platform} size={14} />
                              {p.url ? (
                                <a href={p.url} target="_blank" rel="noreferrer">{p.caption || `${p.format} post`}</a>
                              ) : (
                                <span>{p.caption || `${p.format} post`}</span>
                              )}
                            </td>
                            <td>{new Date(p.posted_at).toLocaleDateString()}</td>
                            <td>{fmt(p.likes)}</td>
                            <td>{fmt(p.comments)}</td>
                            <td>{fmt(p.shares)}</td>
                            <td>{fmt(p.saves)}</td>
                            <td>{fmt(p.reach) ?? <span className="zax-na">n/a</span>}</td>
                            <td>{p.engagement_rate !== null ? `${p.engagement_rate}%` : <span className="zax-na">n/a</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )
        ) : tab === 'paid' ? (
          !paid?.has_data ? (
            <EmptyState
              icon={<Upload size={22} />}
              title="No ads data for this range"
              body="Ads API access is waiting for approval from each platform. Until then, export a report from Meta, Google or TikTok Ads and import the CSV."
              action={<Button icon={<Upload />} onClick={() => navigate('/connections')}>Import ads CSV</Button>}
            />
          ) : (
            <>
              <div className="zax-grid-4">
                <Metric label="Spend" value={money(paid.totals.spend)} sub={paid.previous.spend ? `${money(paid.previous.spend)} previous period` : null} />
                <Metric label="Clicks" value={fmt(paid.totals.clicks)} sub={`CTR ${(paid.totals.ctr * 100).toFixed(2)}%`} />
                <Metric label="Conversions" value={fmt(paid.totals.conversions)} sub={paid.totals.conversions ? `${money(paid.totals.cpa)} per conversion` : null} />
                <Metric label="ROAS" value={paid.totals.revenue ? `${paid.totals.roas.toFixed(2)}x` : null} sub={paid.totals.revenue ? `${money(paid.totals.revenue)} revenue` : 'Add revenue to your import to see ROAS'} />
              </div>
              <p className="zax-muted">Source: {paid.source === 'api' ? 'platform API' : 'your CSV imports'}. Amounts in USD.</p>
              <div className="zax-grid-2">
                <Card>
                  <CardTitle sub="All ad platforms together">Spend per day</CardTitle>
                  <DailyBars data={paid.daily} field="spend" label="Spend" format={(v) => money(v) || ''} />
                </Card>
                <Card>
                  <CardTitle sub="By spend">Top campaigns</CardTitle>
                  <div className="zax-table-wrap">
                    <table className="zax-table">
                      <thead>
                        <tr>
                          <th>Campaign</th>
                          <th>Spend</th>
                          <th>Clicks</th>
                          <th>Conv.</th>
                          <th>ROAS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paid.top_campaigns.map((c: any) => (
                          <tr key={c.platform + c.campaign}>
                            <td>
                              <span className="zax-net">
                                <SocialIcon platform={c.platform === 'meta' ? 'meta' : c.platform === 'google' ? 'google_ads' : 'tiktok'} size={14} /> {c.campaign}
                              </span>
                            </td>
                            <td>{money(c.spend)}</td>
                            <td>{fmt(c.clicks)}</td>
                            <td>{fmt(c.conversions)}</td>
                            <td>{c.revenue ? `${c.roas.toFixed(2)}x` : <span className="zax-na">n/a</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </>
          )
        ) : (
          <>
            <div className="zax-grid-4">
              <Metric label="Organic reach" value={fmt(report.combined.organic_reach)} />
              <Metric label="Paid impressions" value={fmt(report.combined.paid_impressions)} missing="No ads data" />
              <Metric label="Organic interactions" value={fmt(report.combined.organic_interactions)} sub={`${report.combined.posts} posts`} />
              <Metric label="Paid clicks" value={fmt(report.combined.paid_clicks)} missing="No ads data" sub={report.combined.spend !== null ? `${money(report.combined.spend)} spend` : null} />
            </div>
            <Card>
              <CardTitle sub="Organic and paid use different units, so they sit next to each other and are never added together">How the two sides compare</CardTitle>
              <ul className="zax-compare">
                <li>
                  <span>Posts published</span>
                  <strong>{report.combined.posts}</strong>
                </li>
                <li>
                  <span>Ad spend</span>
                  <strong>{money(report.combined.spend) ?? <span className="zax-na">No ads data</span>}</strong>
                </li>
                <li>
                  <span>Conversions from ads</span>
                  <strong>{fmt(report.combined.conversions) ?? <span className="zax-na">No ads data</span>}</strong>
                </li>
                <li>
                  <span>Return on ad spend</span>
                  <strong>{report.combined.roas !== null ? `${report.combined.roas}x` : <span className="zax-na">n/a</span>}</strong>
                </li>
              </ul>
              <div className="zax-actions">
                <Button variant="secondary" size="sm" icon={<Download size={14} />} loading={exporting === 'daily'} onClick={() => exportCsv('daily')} disabled={demo.isActive}>
                  Export daily CSV
                </Button>
              </div>
            </Card>
          </>
        )}
        {report && !demo.isActive && o?.per_network?.some((n: any) => n.status === 'needs_reconnect') && (
          <p className="zax-muted">
            <Pill tone="bad">Reconnect</Pill> One channel needs reconnecting, so its newest numbers are missing.{' '}
            <button type="button" className="zax-link" onClick={() => navigate('/connections')}>Open Connections</button>
          </p>
        )}
      </PageBody>
    </V3Layout>
  );
}
