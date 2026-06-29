import { useState, useEffect } from 'react';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleOrganicPosts, sampleScheduledPosts } from '../../data/sample-data';
import { 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  Linkedin, 
  MessageSquare,
  Calendar as CalendarIcon, 
  Eye, 
  Trash2 
} from 'lucide-react';

const B = 'var(--border)';
const P = 'var(--primary)';
const G = 'var(--text-muted)';

export default function CalendarPage() {
  const demo = useDemoMode();
  const [events, setEvents] = useState<any[]>([]);
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
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/calendar/events', { headers });
      const j = await res.json();
      if (j.success) setEvents(j.data);
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [demo.isActive]);

  const handleDeletePost = async (id: string) => {
    if (demo.isActive) {
      alert("Cannot delete items in Demo Mode.");
      return;
    }
    if (!confirm("Are you sure you want to cancel and delete this scheduled post?")) return;
    setDeletingId(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/scheduler/posts/${id}`, {
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
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Instagram size={10} style={{ color: '#fff' }} />;
    if (p.includes('linkedin')) return <Linkedin size={10} style={{ color: '#fff' }} />;
    return <MessageSquare size={10} style={{ color: '#fff' }} />;
  };

  // Instagram Feed preview list
  const instagramFeedEvents = events
    .filter(e => {
      const isIg = e.platforms?.some((p: any) => p.platform?.toLowerCase().includes('instagram'));
      return isIg && e.media && e.media.length > 0;
    })
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

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
                    style={{ 
                      background: cell.isCurrentMonth ? '#fff' : 'var(--bg-soft)', 
                      border: `1px solid ${B}`, 
                      borderRadius: 8, 
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      boxShadow: 'var(--shadow-sm)',
                      minHeight: 90
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
                          onClick={() => setSelectedEvent(e)}
                          style={{ 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: getPlatformColor(e.platforms?.[0]?.platform || 'instagram'),
                            color: '#fff',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '4px 6px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {getPlatformIcon(e.platforms?.[0]?.platform || 'instagram')}
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
            <h3 style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Instagram size={16} style={{ color: '#E1306C' }} /> Visual Feed Preview
            </h3>
            <p style={{ margin: 0, fontSize: '0.73rem', color: G }}>Visualize how scheduled images and reels arrange on Instagram.</p>
          </div>

          {instagramFeedEvents.length === 0 ? (
            <div style={{ border: `2px dashed ${B}`, padding: 40, borderRadius: 8, textAlign: 'center', color: G, fontSize: '0.78rem' }}>
              No visual Instagram posts scheduled yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {instagramFeedEvents.map(e => {
                const mediaItem = e.media?.[0];
                const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.file_url || '');
                return (
                  <div key={e.id} style={{ width: '100%', aspectRatio: '1/1', background: 'var(--bg-soft)', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedEvent(e)}>
                    {url ? (
                      <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: G, fontSize: '0.6rem' }}>Text</div>
                    )}
                  </div>
                );
              })}
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
                {selectedEvent.type === 'scheduled' ? 'Scheduled Post Details' : 'Published Post History'}
              </h3>
              <span onClick={() => setSelectedEvent(null)} style={{ cursor: 'pointer', color: G, fontSize: '0.9rem' }}>✕</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Timing Metadata */}
              <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: G }}>
                <span>Type: <strong style={{ color: P }}>{selectedEvent.type.toUpperCase()}</strong></span>
                <span>•</span>
                <span>Time: {new Date(selectedEvent.start).toLocaleString()}</span>
              </div>

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
              {selectedEvent.type === 'scheduled' ? (
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
