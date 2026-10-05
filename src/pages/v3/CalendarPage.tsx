import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import {
  Card,
  CardTitle,
  EmptyState,
  GhostButton,
  PageBody,
  PageHeader,
  Pill,
  SegTabs,
  Skeleton,
  TextRollButton,
} from '../../components/v3/ui';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleOrganicPosts, sampleScheduledPosts } from '../../data/sample-data';
import SocialIcon from '../../components/v3/SocialIcon';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Heart,
  MessageCircle,
  Trash2,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';
import './calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const statusTone = (status?: string): 'accent' | 'good' | 'bad' | 'warn' | 'neutral' => {
  if (status === 'failed') return 'bad';
  if (status === 'published') return 'good';
  if (status === 'publishing') return 'warn';
  if (status === 'scheduled') return 'accent';
  return 'neutral';
};

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

  // Presentation only: month grid vs agenda list, and slide direction for month changes
  const [view, setView] = useState<'month' | 'list'>(window.innerWidth < 768 ? 'list' : 'month');
  const [navDir, setNavDir] = useState<1 | -1>(1);

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
    setNavDir(-1);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDir(1);
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
    return 'var(--zd-ink-3)';
  };

  const getPlatformIcon = (platform: string) => {
    return <SocialIcon platform={platform} size={12} />;
  };

  // Filter scheduled posts for visual preview
  const igScheduled = events.filter(e => 
    e.type === 'scheduled'
  );
  const igScheduledSorted = [...igScheduled].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const mergedFeedItems = [
    ...igScheduledSorted.slice(0, 3).map(e => ({
      id: e.id,
      url: e.media?.[0] || '',
      isScheduled: true,
      event: e,
      permalink: null,
      likes: undefined,
      comments: undefined
    })),
    ...visualFeed.slice(0, 6).map((item, idx) => ({
      id: `pub_${idx}`,
      url: item.media_url,
      isScheduled: false,
      event: null,
      permalink: item.permalink,
      likes: item.like_count,
      comments: item.comments_count
    }))
  ];

  // Presentation helpers
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const monthKey = `${year}-${pad2(month + 1)}`;
  const monthEvents = events.filter(e => e.start && e.start.startsWith(monthKey));
  const scheduledCount = monthEvents.filter(e => e.type === 'scheduled' && e.status !== 'failed').length;
  const publishedCount = monthEvents.filter(e => e.type === 'published').length;
  const failedCount = monthEvents.filter(e => e.status === 'failed').length;
  const agendaDays = daysGrid
    .filter(c => c.isCurrentMonth)
    .map(c => ({ ...c, items: getEventsForDate(c.dateKey) }))
    .filter(c => c.items.length > 0);

  const renderChip = (e: any, delayMs: number, compact = false) => {
    const platform = e.platforms?.[0]?.platform || 'instagram';
    const failed = e.status === 'failed';
    return (
      <button
        type="button"
        key={e.id}
        className={`zca-chip ${failed ? 'is-failed' : ''} ${compact ? '' : 'is-wide'} ${selectedEvent?.id === e.id ? 'is-selected' : ''}`}
        style={{ animationDelay: `${delayMs}ms` }}
        onClick={(evt) => {
          evt.stopPropagation();
          setSelectedEvent(e);
        }}
        title={e.error_message ? `Publish failed: ${e.error_message}` : e.title}
      >
        <span className="zca-chip-dot" style={{ background: failed ? 'var(--zd-bad)' : getPlatformColor(platform) }} />
        <span className="zca-chip-icon">{getPlatformIcon(platform)}</span>
        {failed && <AlertCircle size={11} className="zca-chip-warn" />}
        {formatTime(e.start) && <span className="zca-chip-time">{formatTime(e.start)}</span>}
        <span className="zca-chip-title">{e.title}</span>
        <span className={`zca-chip-status tone-${e.type === 'published' ? 'good' : failed ? 'bad' : 'accent'}`} />
      </button>
    );
  };

  return (
    <V3Layout>
      <PageHeader
        number="04"
        label="Calendar"
        title="Content calendar"
        subtitle="Plan, review and coordinate every scheduled and published post in one view."
        actions={
          <TextRollButton text="Create post" onClick={() => navigate('/composer')} />
        }
      />

      <PageBody wide>
        <div className="zca-layout">
          {/* Calendar */}
          <Card className="zca-cal-card" padding={0}>
            <div className="zca-toolbar">
              <div className="zca-month-nav">
                <button type="button" className="zd-icon-btn" onClick={handlePrevMonth} aria-label="Previous month">
                  <ChevronLeft />
                </button>
                <h2 key={monthKey} className={`zca-month-title ${navDir === 1 ? 'from-right' : 'from-left'}`}>
                  {monthNames[month]} <span className="zd-muted">{year}</span>
                </h2>
                <button type="button" className="zd-icon-btn" onClick={handleNextMonth} aria-label="Next month">
                  <ChevronRight />
                </button>
              </div>

              <div className="zca-toolbar-right">
                <div className="zca-legend">
                  <Pill tone="accent"><span className="zca-legend-dot is-accent" />Scheduled {scheduledCount}</Pill>
                  <Pill tone="good"><span className="zca-legend-dot is-good" />Published {publishedCount}</Pill>
                  {failedCount > 0 && <Pill tone="bad"><AlertCircle size={11} />Failed {failedCount}</Pill>}
                </div>
                <SegTabs
                  size="sm"
                  value={view}
                  onChange={setView}
                  tabs={[
                    { id: 'month', label: 'Month', icon: <LayoutGrid size={13} /> },
                    { id: 'list', label: 'Agenda', icon: <ListIcon size={13} /> },
                  ]}
                />
              </div>
            </div>

            {view === 'month' ? (
              <div className="zca-month">
                <div className="zca-weekdays">
                  {WEEKDAYS.map(day => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                {loading ? (
                  <div className="zca-grid is-loading">
                    {daysGrid.map((_, idx) => (
                      <div key={idx} className="zca-cell is-skeleton">
                        <Skeleton height={10} width={18} radius={6} />
                        {idx % 3 === 0 && <Skeleton height={16} radius={6} />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div key={monthKey} className={`zca-grid ${isMobile ? 'is-compact' : ''} ${navDir === 1 ? 'from-right' : 'from-left'}`}>
                    {daysGrid.map((cell, idx) => {
                      const dayEvents = getEventsForDate(cell.dateKey);
                      const isToday = cell.dateKey === todayKey;
                      return (
                        <div
                          key={idx}
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              navigate(`/composer?schedule=${cell.dateKey}T12:00`);
                            }
                          }}
                          className={`zca-cell ${cell.isCurrentMonth ? '' : 'is-out'} ${isToday ? 'is-today' : ''} ${dayEvents.length ? 'has-events' : ''}`}
                          title="Click empty space to schedule a post"
                        >
                          <span className="zca-daynum">{cell.dayNum}</span>

                          {/* Events list for cell */}
                          <div className="zca-cell-events">
                            {dayEvents.map((e, j) => renderChip(e, Math.min(idx * 10, 300) + j * 50, true))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div key={`list-${monthKey}`} className={`zca-agenda ${navDir === 1 ? 'from-right' : 'from-left'}`}>
                {loading ? (
                  <div style={{ padding: 20 }}>
                    <Skeleton height={56} count={4} radius={14} />
                  </div>
                ) : agendaDays.length === 0 ? (
                  <div style={{ padding: 16 }}>
                    <EmptyState
                      icon={<CalendarIcon size={22} />}
                      title="Nothing planned this month"
                      body="Schedule a post and it will show up here."
                      action={<TextRollButton text="Create post" onClick={() => navigate('/composer')} />}
                    />
                  </div>
                ) : (
                  agendaDays.map((day, i) => {
                    const d = new Date(year, month, day.dayNum);
                    const isToday = day.dateKey === todayKey;
                    return (
                      <div key={day.dateKey} className={`zca-agenda-row ${isToday ? 'is-today' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="zca-agenda-date">
                          <span className="zca-agenda-wd">{WEEKDAYS[d.getDay()]}</span>
                          <span className="zca-agenda-num">{day.dayNum}</span>
                        </div>
                        <div className="zca-agenda-events">
                          {day.items.map((e: any, j: number) => renderChip(e, i * 50 + j * 40))}
                        </div>
                        <button
                          type="button"
                          className="zd-icon-btn zca-agenda-add"
                          aria-label="Schedule a post on this day"
                          onClick={() => navigate(`/composer?schedule=${day.dateKey}T12:00`)}
                        >
                          <Plus />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </Card>

          {/* Visual feed preview */}
          <Card className="zca-feed-card">
            <CardTitle
              icon={<LayoutGrid />}
              sub="See how scheduled and published posts line up on your feed."
            >
              Visual feed preview
            </CardTitle>

            {mergedFeedItems.length === 0 ? (
              <EmptyState
                icon={<LayoutGrid size={22} />}
                title="Your feed is empty"
                body="It will preview here once you schedule or publish a post."
              />
            ) : (
              <>
                <div className="zca-feed">
                  {mergedFeedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`zca-tile ${item.isScheduled ? 'is-planned' : ''}`}
                      style={{ animationDelay: `${120 + idx * 55}ms` }}
                      onClick={() => {
                        if (item.isScheduled) {
                          setSelectedEvent(item.event);
                        } else if (item.permalink) {
                          window.open(item.permalink, '_blank');
                        }
                      }}
                    >
                      {item.url ? (
                        <img src={item.url} alt="" loading="lazy" />
                      ) : (
                        <div className="zca-tile-text">Text</div>
                      )}
                      <div className="zca-tile-overlay">
                        {item.isScheduled ? (
                          <span className="zca-tile-stat">{formatTime(item.event?.start) || 'Planned'}</span>
                        ) : (
                          <>
                            {item.likes !== undefined && (
                              <span className="zca-tile-stat"><Heart size={12} /> {Number(item.likes).toLocaleString()}</span>
                            )}
                            {item.comments !== undefined && (
                              <span className="zca-tile-stat"><MessageCircle size={12} /> {Number(item.comments).toLocaleString()}</span>
                            )}
                            {item.likes === undefined && item.comments === undefined && (
                              <span className="zca-tile-stat"><Eye size={12} /> Open</span>
                            )}
                          </>
                        )}
                      </div>
                      {item.isScheduled && <span className="zca-tile-badge">Plan</span>}
                    </div>
                  ))}
                </div>
                <div className="zca-feed-legend">
                  <span><i className="zca-legend-dot is-accent" /> Planned</span>
                  <span><i className="zca-legend-dot is-ink" /> Live on feed</span>
                </div>
              </>
            )}
          </Card>
        </div>
      </PageBody>

      {/* Modal: post details */}
      {selectedEvent && (
        <div className="zca-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSelectedEvent(null); }}>
          <div className="zca-modal" role="dialog" aria-modal="true">
            <div className="zca-modal-head">
              <div>
                <span className="zd-eyebrow">
                  {selectedEvent.status === 'failed' ? 'Failed publish' : selectedEvent.type === 'scheduled' ? 'Scheduled post' : 'Published post'}
                </span>
                <h3>
                  {selectedEvent.status === 'failed' ? 'Failed publish details' : selectedEvent.type === 'scheduled' ? 'Scheduled post details' : 'Published post history'}
                </h3>
              </div>
              <button type="button" className="zd-icon-btn" onClick={() => setSelectedEvent(null)} aria-label="Close">
                <X />
              </button>
            </div>

            <div className="zca-modal-body">
              {/* Timing metadata */}
              <div className="zca-meta">
                <Pill tone={statusTone(selectedEvent.status)}>
                  {selectedEvent.status === 'scheduled' && <span className="zca-legend-dot is-accent zca-pulse" />}
                  {selectedEvent.status.toUpperCase()}
                </Pill>
                <span className="zd-muted">{new Date(selectedEvent.start).toLocaleString()}</span>
              </div>

              {selectedEvent.error_message && (
                <div className="zca-error">
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <div><strong>Error:</strong> {selectedEvent.error_message}</div>
                </div>
              )}

              {/* Platforms */}
              <div className="zca-platforms">
                {selectedEvent.platforms?.map((p: any, i: number) => (
                  <span key={i} className="zca-platform">
                    {p.platform && <SocialIcon platform={p.platform} size={14} />}
                    {p.platform?.toUpperCase()} {p.account_handle ? `(${p.account_handle})` : ''}
                  </span>
                ))}
              </div>

              {/* Text body */}
              <div className="zca-caption">{selectedEvent.title}</div>

              {/* Media previews */}
              {selectedEvent.media?.length > 0 && (
                <div className="zca-media">
                  {selectedEvent.media.map((m: any, i: number) => {
                    const url = typeof m === 'string' ? m : (m.file_url || '');
                    return <img key={i} src={url} alt="" style={{ animationDelay: `${i * 60}ms` }} />;
                  })}
                </div>
              )}
            </div>

            <div className="zca-modal-foot">
              {selectedEvent.status === 'published' && selectedEvent.permalink ? (
                <GhostButton onClick={() => window.open(selectedEvent.permalink, '_blank')}>
                  <Eye /> View on Instagram
                </GhostButton>
              ) : selectedEvent.status !== 'publishing' ? (
                <button
                  type="button"
                  className="zca-btn-danger"
                  onClick={() => handleDeletePost(selectedEvent.id)}
                  disabled={deletingId === selectedEvent.id}
                >
                  <Trash2 size={13} /> {deletingId === selectedEvent.id ? 'Deleting...' : 'Cancel and delete'}
                </button>
              ) : (
                <div />
              )}
              <GhostButton onClick={() => setSelectedEvent(null)}>Close</GhostButton>
            </div>
          </div>
        </div>
      )}
    </V3Layout>
  );
}
