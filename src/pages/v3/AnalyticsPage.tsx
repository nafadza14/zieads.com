import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
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

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const B = 'var(--border)';
const D = 'var(--text)';

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

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>Monitor performance and growth metrics across all platforms.</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="analytics-container" style={{ padding: '20px 40px', overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: G, marginTop: 40 }}>Analyzing cross-platform performance metrics...</div>
        ) : !summary ? (
          <div style={{ textAlign: 'center', color: G, marginTop: 40 }}>No posts found. Connect a channel and post to start showing analytics.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Top Stat Cards Grid */}
            <div className="analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              
              {/* Followers */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: G, textTransform: 'uppercase' }}>Audience Size</span>
                  <Users size={16} style={{ color: P }} />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary.latestFollowers}</div>
                <div style={{ fontSize: '0.73rem', color: '#10B981', marginTop: 4, fontWeight: 600 }}>
                  +{summary.followerGrowth} this month
                </div>
              </div>

              {/* Impressions */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: G, textTransform: 'uppercase' }}>Total Impressions</span>
                  <TrendingUp size={16} style={{ color: '#10B981' }} />
                </div>
                 <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary.totalImpressions || 0}</div>
                <div style={{ fontSize: '0.73rem', color: G, marginTop: 4 }}>
                  Organic search + feed views
                </div>
              </div>

              {/* Engagement Rate */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: G, textTransform: 'uppercase' }}>Engagement Rate</span>
                  <Heart size={16} style={{ color: '#EF4444' }} />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{(summary.engagementRate * 100).toFixed(2)}%</div>
                <div style={{ fontSize: '0.73rem', color: (summary.engagementRate * 100) >= 3.2 ? '#10B981' : G, marginTop: 4, fontWeight: 600 }}>
                  {(summary.engagementRate * 100) >= 3.2 ? "Above industry average (3.2%)" : "Industry average is 3.2%"}
                </div>
              </div>

              {/* Total Posts */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: G, textTransform: 'uppercase' }}>Posts Sync</span>
                  <Layers size={16} style={{ color: '#2563EB' }} />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary.totalPosts}</div>
                <div style={{ fontSize: '0.73rem', color: G, marginTop: 4 }}>
                  Across all channels
                </div>
              </div>

            </div>

            {/* Split layout: Best Time to Post and Post stats */}
            <div className="analytics-split-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'start' }}>
              
              {/* Top Performing Posts */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={16} style={{ color: P }} /> Top Performing Content
                </h3>
                
                {posts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: G, padding: '20px 0', fontSize: '0.82rem' }}>
                    Publish posts to display performance ranks.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {posts.map((post, idx) => (
                      <div key={post.id || idx} style={{ display: 'flex', gap: 16, borderBottom: `1px solid ${B}`, paddingBottom: 14, justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--bg-soft)', color: G, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: D, lineHeight: 1.4 }}>
                              {post.title}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: G, marginTop: 4, display: 'block' }}>
                              Published on {post.platforms?.[0]?.platform?.toUpperCase()} • {new Date(post.start).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Dummy metrics badges */}
                        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                          <span style={{ fontSize: '0.72rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Heart size={10} /> {post.likes || 0}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: G, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MessageCircle size={10} /> {post.comments || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Best Time to Post Heatmap widget */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} style={{ color: P }} /> Best Posting Windows
                </h3>

                {bestTimes.length === 0 ? (
                  <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: G, lineHeight: 1.5 }}>
                      Best posting windows require at least 30 days of post history to compute. Connect your accounts and start posting to unlock this insight.
                    </p>
                    <button 
                      onClick={() => navigate('/connections')}
                      style={{ 
                        background: P, 
                        color: '#fff', 
                        border: 'none', 
                        padding: '8px 14px', 
                        borderRadius: 6, 
                        fontSize: '0.78rem', 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        alignSelf: 'flex-start'
                      }}
                    >
                      Connect an Account
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bestTimes.map((bt, i) => (
                      <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-soft)', borderRadius: 6, display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{bt.day}</div>
                          <div style={{ fontSize: '0.73rem', color: G, marginTop: 2 }}>{bt.time}</div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: P }}>
                          {Math.round(bt.confidence * 100)}% Confidence
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>
    </V3Layout>
  );
}
