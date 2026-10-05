import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import {
  Card,
  CardTitle,
  EmptyState,
  GhostButton,
  GrowBar,
  LoadingState,
  PageBody,
  PageHeader,
  Pill,
  Skeleton,
  StatCard,
  TextRollButton,
} from '../../components/v3/ui';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleBestPostingTimes, sampleOrganicPosts } from '../../data/sample-data';
import { 
  TrendingUp, 
  Users, 
  Layers, 
  Heart, 
  MessageCircle, 
  Clock, 
  Award,
  Calendar
} from 'lucide-react';


export default function AnalyticsPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [summary, setSummary] = useState<any>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalImpressions: 0,
    latestFollowers: 0,
    followerGrowth: 0,
    engagementRate: 0
  });
  const [bestTimes, setBestTimes] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const loadData = async () => {
    if (demo.isActive) {
      setSummary({
        totalPosts: 30,
        totalLikes: 1480,
        totalComments: 184,
        totalImpressions: 24500,
        latestFollowers: 23700,
        followerGrowth: 148,
        engagementRate: 0.057
      });
      setBestTimes(sampleBestPostingTimes);
      setPosts(sampleOrganicPosts.slice(0, 10));
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const [sumRes, timesRes, calendarRes] = await Promise.all([
        fetch('/api/v3/analytics/summary', { headers }),
        fetch('/api/v3/analytics/best-times', { headers }),
        fetch('/api/v3/calendar/events', { headers })
      ]);

      const sumJ = await sumRes.json();
      if (sumJ.success) setSummary(sumJ.data);

      const timesJ = await timesRes.json();
      if (timesJ.success) setBestTimes(timesJ.data);

      const calendarJ = await calendarRes.json();
      if (calendarJ.success) {
        const publishedPosts = calendarJ.data
          .filter((e: any) => e.type === 'published')
          .sort((a: any, b: any) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)))
          .slice(0, 10);
        setPosts(publishedPosts);
      }
    } catch (err) {
      console.error("Failed to load analytics dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [demo.isActive]);

  const engagementPct = (summary?.engagementRate || 0) * 100;
  const maxScore = Math.max(1, ...posts.map((p) => (p.likes || 0) + (p.comments || 0)));

  return (
    <V3Layout>
      <PageHeader
        number="05"
        label="Analytics"
        title="Performance across every channel."
        subtitle="Follower growth, reach, engagement and best posting windows for all connected accounts."
        actions={<GhostButton onClick={() => navigate('/agent')}>Ask the agent why</GhostButton>}
      />

      <PageBody>
        {loading ? (
          <>
            <div className="zd-grid-4">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton height={12} width="50%" />
                  <Skeleton height={30} width="70%" />
                </Card>
              ))}
            </div>
            <LoadingState text="Analyzing cross-platform performance" />
          </>
        ) : !summary ? (
          <EmptyState
            title="No posts yet"
            body="Connect a channel and publish a post to start seeing analytics."
            action={<TextRollButton text="Connect an account" onClick={() => navigate('/connections')} />}
          />
        ) : (
          <>
            {/* KPI tiles */}
            <div className="zd-grid-4">
              <StatCard
                label="Audience size"
                value={summary.latestFollowers || 0}
                icon={<Users />}
                hint={`+${(summary.followerGrowth || 0).toLocaleString()} this month`}
                hintTone="good"
              />
              <StatCard
                label="Total impressions"
                value={summary.totalImpressions || 0}
                icon={<TrendingUp />}
                hint="Organic search and feed views"
              />
              <StatCard
                label="Engagement rate"
                value={engagementPct}
                decimals={2}
                suffix="%"
                icon={<Heart />}
                hint={engagementPct >= 3.2 ? 'Above industry average (3.2%)' : 'Industry average is 3.2%'}
                hintTone={engagementPct >= 3.2 ? 'good' : 'muted'}
              />
              <StatCard
                label="Posts synced"
                value={summary.totalPosts || 0}
                icon={<Layers />}
                hint="Across all channels"
              />
            </div>

            <div className="zd-grid-2" style={{ alignItems: 'start' }}>
              {/* Top performing posts */}
              <Card>
                <CardTitle icon={<Award />} sub="Ranked by likes plus comments">
                  Top performing content
                </CardTitle>
                {posts.length === 0 ? (
                  <p className="zd-text-sm zd-muted">Publish posts to see performance ranks.</p>
                ) : (
                  <div>
                    {posts.map((post, idx) => {
                      const score = (post.likes || 0) + (post.comments || 0);
                      return (
                        <div key={post.id || idx} className="zd-row zd-slide-in" style={{ animationDelay: `${idx * 50}ms`, alignItems: 'flex-start' }}>
                          <span className="zd-rank">{idx + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{post.title}</div>
                            <div className="zd-muted" style={{ fontSize: 12, margin: '3px 0 8px' }}>
                              {post.platforms?.[0]?.platform ? `${post.platforms[0].platform.charAt(0).toUpperCase()}${post.platforms[0].platform.slice(1)}` : 'Post'} · {new Date(post.start).toLocaleDateString()}
                            </div>
                            <GrowBar value={(score / maxScore) * 100} delay={idx * 60} />
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexShrink: 0, fontSize: 12.5 }}>
                            <span className="tone-bad" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Heart size={12} /> {post.likes || 0}
                            </span>
                            <span className="zd-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <MessageCircle size={12} /> {post.comments || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Best posting windows */}
              <Card>
                <CardTitle icon={<Clock />} sub="Computed from your own engagement history">
                  Best posting windows
                </CardTitle>
                {bestTimes.length === 0 ? (
                  <EmptyState
                    icon={<Calendar size={20} />}
                    title="Not enough history yet"
                    body="Best posting windows need at least 30 days of post history. Connect your accounts and keep posting to unlock this insight."
                    action={<TextRollButton text="Connect an account" onClick={() => navigate('/connections')} />}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {bestTimes.map((bt, i) => {
                      const conf = Math.round((bt.confidence || 0) * 100);
                      return (
                        <div key={i} className="zd-card zd-card-soft zd-slide-in" style={{ padding: '12px 14px', animationDelay: `${i * 60}ms` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{bt.day}</div>
                              <div className="zd-muted" style={{ fontSize: 12.5 }}>{bt.time}</div>
                            </div>
                            <Pill tone={conf >= 70 ? 'accent' : 'neutral'}>{conf}% confidence</Pill>
                          </div>
                          <GrowBar value={conf} delay={i * 80} tone={conf >= 70 ? 'accent' : 'dark'} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </PageBody>
    </V3Layout>
  );
}
