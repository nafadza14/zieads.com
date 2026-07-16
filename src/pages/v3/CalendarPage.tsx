import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleOrganicPosts, sampleScheduledPosts } from '../../data/sample-data';
import SocialIcon from '../../components/v3/SocialIcon';
import { 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  Linkedin, 
  MessageSquare,
  Calendar as CalendarIcon, 
  Eye, 
  Trash2,
  AlertCircle
} from 'lucide-react';

const B = 'var(--border)';
const P = 'var(--primary)';
const G = 'var(--text-muted)';
const D = 'var(--text)';

export default function CalendarPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [events, setEvents] = useState<any[]>([]);
  const [visualFeed, setVisualFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Modal / Detail state
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  // Calendar calculation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  const nextMonthDates = 42 - (firstDayIndex + totalDays);

  const daysGrid: { dayNum: number; dateKey: string; isCurrentMonth: boolean }[] = [];

  // Previous Month Padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    daysGrid.push({
      dayNum: day,
      dateKey: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }

  // Current Month
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({
      dayNum: i,
      dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: true
    });
  }

  // Next Month Padding
  for (let i = 1; i <= nextMonthDates; i++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    daysGrid.push({
      dayNum: i,
      dateKey: `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }

  const fetchEvents = async () => {
    if (demo.isActive) {
      const eventsList = [
        ...sampleScheduledPosts.map(p => ({
          id: p.id,
          title: p.title,
          start: p.start,
          type: "scheduled",
          status: p.status,
          platforms: p.platforms,
          media: p.media
        })),
        ...sampleOrganicPosts.map(p => ({
          id: p.id,
          title: p.title,
          start: p.start,
          type: "published",
          status: "published",
          platforms: p.platforms,
          media: p.media
        }))
      ];
      setEvents(eventsList);
      setLoading(false);
      return;
    }

    try {
      const fromStr = daysGrid[0] ? `${daysGrid[0].dateKey}T00:00:00Z` : new Date(year, month - 1, 20).toISOString();
      const toStr = daysGrid[daysGrid.length - 1] ? `${daysGrid[daysGrid.length - 1].dateKey}T23:59:59Z` : new Date(year, month + 1, 10).toISOString();

      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/posts/scheduled?from=${fromStr}&to=${toStr}`, { headers });
      const j = await res.json();
      if (j.success) {
        const mappedEvents = j.data.map((p: any) => ({
          id: p.id,
          title: p.caption || 'No caption',
          start: p.status === 'published' ? p.published_at : p.scheduled_for,
          type: p.status === 'published' ? 'published' : 'scheduled',
          status: p.status,
          platforms: [{ platform: p.platform, account_handle: p.platform_account_id }],
          media: p.media_urls || [],
          permalink: p.platform_permalink,
          error_message: p.error_message
        }));
        setEvents(mappedEvents);
      }
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisualFeed = async () => {
    if (demo.isActive) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/analytics/instagram-media?limit=6', { headers });
      const j = await res.json();
      if (j.success && j.connected) {
        setVisualFeed(j.data);
      }
    } catch (err) {
      console.error("Failed to fetch visual feed:", err);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchVisualFeed();
  }, [demo.isActive, currentDate]);

  const handleDeletePost = async (id: string) => {
    if (demo.isActive) {
      alert("Cannot delete items in Demo Mode.");
      return;
    }
    if (!confirm("Are you sure you want to cancel and delete this scheduled post?")) return;
    setDeletingId(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/posts/${id}`, {
        method: 'DELETE',
        headers
      });
      const j = await res.json();
      if (j.success) {
        setEvents(prev => prev.filter(e => e.id !== id));
        setSelectedEvent(null);
      }
    } catch (err) {
      alert("Failed to delete post.");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDate = (dateKey: string) => {
    return events.filter(e => e.start && e.start.startsWith(dateKey));
  };

  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return '#ec4899';
    if (p.includes('linkedin')) return '#0077b5';
    if (p.includes('tiktok')) return '#000000';
    return P;
  };

  const getPlatformIcon = (platform: string) => {
    return <SocialIcon platform={platform} size={12} />;
  };

  // Merge scheduled & published for Instagram Preview
  const igScheduled = events.filter(e => 
    e.type === 'scheduled' && 
    e.platforms?.some((p: any) => p.platform?.toLowerCase() === 'instagram')
  );
  const igScheduledSorted = [...igScheduled].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const mergedFeedItems = [
    ...igScheduledSorted.slice(0, 3).map(e => ({
      id: e.id,
      url: e.media?.[0] || '',
      isScheduled: true,
      event: e,
      permalink: null
    })),
    ...visualFeed.slice(0, 6).map((item, idx) => ({
      id: `pub_${idx}`,
      url: item.media_url,
      isScheduled: false,
      event: null,
      permalink: item.permalink
    }))
  ];

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Content Calendar</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>Manage and coordinate scheduled updates visually.</p>
        </div>
      </div>

      {/* Main Grid split with Instagram Feed Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflowY: 'auto' }}>
        
        {/* Calendar Grid Area */}
        <div style={{ flex: 1, padding: isMobile ? 16 : 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Calendar Controller Header */}
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              {monthNames[month]} {year}
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handlePrevMonth}
                style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextMonth}
                style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day Names Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, textAlign: 'center' }}>
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
              <span key={day} style={{ fontSize: '0.72rem', fontWeight: 700, color: G, letterSpacing: '0.02em' }}>{day}</span>
            ))}
          </div>

          {/* Calendar Months Cells Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', color: G, padding: 40 }}>Loading calendar...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, gridAutoRows: 'minmax(90px, auto)' }}>
              {daysGrid.map((cell, idx) => {
                const dayEvents = getEventsForDate(cell.dateKey);
                return (
                  <div 
                    key={idx} 
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        navigate(`/composer?schedule=${cell.dateKey}T12:00`);
                      }
                    }}
                    style={{ 
                      background: cell.isCurrentMonth ? '#fff' : 'var(--bg-soft)', 
                      border: `1px solid ${B}`, 
                      borderRadius: 8, 
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      boxShadow: 'var(--shadow-sm)',
                      minHeight: 90,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cell.isCurrentMonth ? 'var(--text)' : G }}>
                      {cell.dayNum}
                    </span>

                    {/* Events List for cell */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {dayEvents.map(e => (
                        <div 
                          key={e.id}
                          onClick={(evt) => {
                            evt.stopPropagation();
                            setSelectedEvent(e);
                          }}
                          style={{ 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: e.status === 'failed' ? '#EF4444' : getPlatformColor(e.platforms?.[0]?.platform || 'instagram'),
                            color: '#fff',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '4px 6px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={e.error_message ? `Publish Failed: ${e.error_message}` : e.title}
                        >
                          {getPlatformIcon(e.platforms?.[0]?.platform || 'instagram')}
                          {e.status === 'failed' && <span style={{ marginRight: 2 }}>⚠️</span>}
                          {e.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Preview Side Panel: Instagram Feed Mockup */}
        <div style={{ width: isMobile ? '100%' : '340px', background: '#fff', borderLeft: isMobile ? 'none' : `1px solid ${B}`, borderTop: isMobile ? `1px solid ${B}` : 'none', padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 700 }}>
              <SocialIcon platform="instagram" size={16} /> Visual Feed Preview
            </div>
            <p style={{ margin: 0, fontSize: '0.73rem', color: G }}>Visualize how scheduled images and reels arrange on Instagram.</p>
          </div>

          {mergedFeedItems.length === 0 ? (
            <div style={{ border: `2px dashed ${B}`, padding: 40, borderRadius: 8, textAlign: 'center', color: G, fontSize: '0.78rem' }}>
              Your Instagram feed will preview here once you schedule or publish a post.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {mergedFeedItems.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    width: '100%', 
                    aspectRatio: '1/1', 
                    background: 'var(--bg-soft)', 
                    overflow: 'hidden', 
                    cursor: 'pointer',
                    position: 'relative',
                    border: item.isScheduled ? '2px solid #E1306C' : 'none'
                  }} 
                  onClick={() => {
                    if (item.isScheduled) {
                      setSelectedEvent(item.event);
                    } else if (item.permalink) {
                      window.open(item.permalink, '_blank');
                    }
                  }}
                >
                  {item.url ? (
                    <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: G, fontSize: '0.6rem' }}>Text</div>
                  )}
                  {item.isScheduled && (
                    <span style={{ position: 'absolute', bottom: 2, right: 2, background: '#E1306C', color: '#fff', fontSize: '0.55rem', padding: '1px 3px', borderRadius: 2, fontWeight: 700 }}>
                      PLAN
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal - Post Details */}
      {selectedEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 24, width: 440, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                {selectedEvent.status === 'failed' ? 'Failed Publish Details' : selectedEvent.type === 'scheduled' ? 'Scheduled Post Details' : 'Published Post History'}
              </h3>
              <span onClick={() => setSelectedEvent(null)} style={{ cursor: 'pointer', color: G, fontSize: '0.9rem' }}>✕</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Timing Metadata */}
              <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: G }}>
                <span>Status: <strong style={{ color: selectedEvent.status === 'failed' ? '#EF4444' : P }}>{selectedEvent.status.toUpperCase()}</strong></span>
                <span>•</span>
                <span>Time: {new Date(selectedEvent.start).toLocaleString()}</span>
              </div>

              {selectedEvent.error_message && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 12, borderRadius: 6, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <div><strong>Error:</strong> {selectedEvent.error_message}</div>
                </div>
              )}

              {/* Platforms */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedEvent.platforms?.map((p: any, i: number) => (
                  <span key={i} style={{ fontSize: '0.72rem', background: 'var(--bg-soft)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                    {p.platform?.toUpperCase()} {p.account_handle ? `(${p.account_handle})` : ''}
                  </span>
                ))}
              </div>

              {/* Text Body */}
              <div style={{ background: 'var(--bg-soft)', padding: 16, borderRadius: 6, fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                {selectedEvent.title}
              </div>

              {/* Media Previews */}
              {selectedEvent.media?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedEvent.media.map((m: any, i: number) => {
                    const url = typeof m === 'string' ? m : (m.file_url || '');
                    return (
                      <img key={i} src={url} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifySelf: 'stretch', justifyContent: 'space-between', borderTop: `1px solid ${B}`, paddingTop: 16, marginTop: 8 }}>
              {selectedEvent.status === 'published' && selectedEvent.permalink ? (
                <button 
                  onClick={() => window.open(selectedEvent.permalink, '_blank')}
                  style={{ border: `1px solid ${B}`, background: '#fff', color: D, padding: '8px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Eye size={12} /> View on Instagram
                </button>
              ) : selectedEvent.status !== 'publishing' ? (
                <button 
                  onClick={() => handleDeletePost(selectedEvent.id)}
                  disabled={deletingId === selectedEvent.id}
                  style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '8px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Trash2 size={12} /> {deletingId === selectedEvent.id ? 'Deleting...' : 'Cancel & Delete'}
                </button>
              ) : (
                <div />
              )}
              <button 
                onClick={() => setSelectedEvent(null)}
                style={{ background: P, color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </V3Layout>
  );
}
