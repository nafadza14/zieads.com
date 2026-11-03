import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Button,
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
  
  PenLine,
  CheckCircle2,
  Clapperboard,
  Copy,
  Play,
  RotateCcw,
  Send,
  Columns3,
} from 'lucide-react';
import ZIcon from '../../components/icons/ZIcon';
import { PROFILE_GRID, isVideoMime } from '../../lib/platformFormats';
import './calendar.css';

type FeedPlatform = 'instagram' | 'tiktok';
type TileKind = 'image' | 'video' | 'reel' | 'carousel';
type FeedItem = {
  id: string;
  url: string;
  isScheduled: boolean;
  event: any;
  permalink: string | null;
  likes?: number;
  comments?: number;
  views?: number;
  platform: FeedPlatform;
  kind: TileKind;
};

const compactNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

// Every post status the publisher can produce (spec 7.4). The label always names the state.
export const STATUS_META: Record<string, { label: string; tone: 'accent' | 'good' | 'bad' | 'warn' | 'neutral' }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  in_review: { label: 'In review', tone: 'warn' },
  approved: { label: 'Approved', tone: 'accent' },
  scheduled: { label: 'Scheduled', tone: 'accent' },
  publishing: { label: 'Publishing', tone: 'warn' },
  published: { label: 'Published', tone: 'good' },
  needs_action: { label: 'Needs you', tone: 'warn' },
  failed: { label: 'Failed', tone: 'bad' },
};
const statusTone = (status?: string) => STATUS_META[status || '']?.tone || 'neutral';
const statusLabel = (status?: string) => STATUS_META[status || '']?.label || status || '';

const STATUS_FILTERS: Array<{ id: string; label: string; match: (s: string) => boolean }> = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'review', label: 'Drafts and review', match: (s) => ['draft', 'in_review', 'approved'].includes(s) },
  { id: 'scheduled', label: 'Scheduled', match: (s) => ['scheduled', 'publishing'].includes(s) },
  { id: 'attention', label: 'Needs you', match: (s) => ['needs_action', 'failed'].includes(s) },
  { id: 'published', label: 'Published', match: (s) => s === 'published' },
];

/** Local calendar day of an ISO time, so a 06:00 Jakarta post is not filed under yesterday (UTC) */
const localKey = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const PLATFORM_NAMES: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn' };
const canMove = (status?: string) => !['published', 'publishing'].includes(status || '');

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
  const [view, setView] = useState<'month' | 'week' | 'list'>(window.innerWidth < 768 ? 'list' : 'month');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unscheduled, setUnscheduled] = useState<any[]>([]);
  const [bestTimes, setBestTimes] = useState<any>(null);
  const routeNotice = (useLocation().state as any)?.notice as string | undefined;
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad'; text: string } | null>(routeNotice ? { tone: 'good', text: routeNotice } : null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [permalinkInput, setPermalinkInput] = useState('');
  const [navDir, setNavDir] = useState<1 | -1>(1);
  // Which profile grid the feed preview shows when both platforms have posts
  const [feedPlatform, setFeedPlatform] = useState<FeedPlatform>('instagram');

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const toEvent = (p: any) => ({
    id: p.id,
    title: p.caption || 'No caption',
    start: p.status === 'published' ? p.published_at || p.scheduled_for : p.scheduled_for,
    type: p.status === 'published' ? 'published' : 'scheduled',
    status: p.status,
    platform: p.platform,
    platforms: [{ platform: p.platform, account_handle: p.platform_account_id }],
    media: p.media_urls || [],
    permalink: p.platform_permalink,
    error_message: p.error_message,
    first_comment: p.first_comment,
    verified_at: p.verified_at,
    retry_count: p.retry_count,
  });

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
          platform: p.platforms?.[0]?.platform,
          platforms: p.platforms,
          media: p.media
        })),
        ...sampleOrganicPosts.map(p => ({
          id: p.id,
          title: p.title,
          start: p.start,
          type: "published",
          status: "published",
          platform: p.platforms?.[0]?.platform,
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
      const res = await fetch(`/api/v3/posts/calendar?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`, { headers });
      const j = await res.json();
      if (j.success) {
        setEvents(j.data.map(toEvent));
        setUnscheduled((j.unscheduled || []).map(toEvent));
        setBestTimes(j.best_times || null);
      }
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisualFeed = async () => {
    // Profile grid preview reads Instagram media only
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
    if (!selectedEvent) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelectedEvent(null); setDraftError(''); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedEvent]);

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

  // Drafts come from the AI Agent: approve them here or open them in Composer
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState('');
  const handleApproveDraft = async (ev: any) => {
    setApprovingId(ev.id);
    setDraftError('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/posts/${ev.id}/approve`, { method: 'POST', headers, body: JSON.stringify({}) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || j.error || 'Could not approve this draft.');
      patchEvent(ev.id, { status: j.status });
    } catch (err: any) {
      setDraftError(err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const patchEvent = (id: string, patch: any) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setUnscheduled((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setSelectedEvent((cur: any) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
  };

  const postAction = async (ev: any, action: 'duplicate' | 'retry' | 'mark-posted' | 'request-review', body: any = {}) => {
    if (demo.isActive) return setNotice({ tone: 'bad', text: 'Exit demo mode to change posts.' });
    setBusyAction(action);
    setDraftError('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/posts/${ev.id}/${action}`, { method: 'POST', headers, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.success === false) throw new Error(j.error || j.result?.reason || 'That did not work');
      if (action === 'duplicate') {
        setNotice({ tone: 'good', text: 'Copied as a new draft. Drag it onto a day to schedule it.' });
        setSelectedEvent(null);
        fetchEvents();
      } else if (action === 'retry') {
        patchEvent(ev.id, { status: j.result?.status === 'retrying' ? 'scheduled' : j.result?.status || 'scheduled', error_message: null, permalink: j.result?.permalink });
      } else if (action === 'mark-posted') {
        patchEvent(ev.id, { status: 'published', type: 'published', permalink: body.permalink || null });
      } else {
        patchEvent(ev.id, { status: 'in_review' });
      }
    } catch (e: any) {
      setDraftError(e.message);
    } finally {
      setBusyAction(null);
    }
  };

  /** Drag and drop: keep the post's time of day, move it to the new day */
  const moveTo = async (id: string, dateKey: string, time?: string) => {
    const ev = [...events, ...unscheduled].find((e) => e.id === id);
    if (!ev || !canMove(ev.status)) return;
    const old = ev.start ? new Date(ev.start) : null;
    const [y, m, d] = dateKey.split('-').map(Number);
    const hhmm = time || (old ? `${pad2(old.getHours())}:${pad2(old.getMinutes())}` : bestTimes?.slots?.[0]?.time || '12:00');
    const [hh, mm] = hhmm.split(':').map(Number);
    const when = new Date(y, m - 1, d, hh, mm);
    if (old && localKey(ev.start) === dateKey && !time) return;
    if (['scheduled', 'failed'].includes(ev.status) && when.getTime() < Date.now() + 60000) {
      return setNotice({ tone: 'bad', text: 'That time has passed. Drop the post on today or a later day.' });
    }
    const before = { events, unscheduled };
    const moved = { ...ev, start: when.toISOString(), status: ev.status === 'failed' ? 'scheduled' : ev.status };
    setEvents((prev) => [...prev.filter((e) => e.id !== id), moved]);
    setUnscheduled((prev) => prev.filter((e) => e.id !== id));
    if (demo.isActive) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/posts/${id}/reschedule`, { method: 'POST', headers, body: JSON.stringify({ scheduled_for: when.toISOString() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not move the post');
      setNotice({ tone: 'good', text: `Moved to ${when.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.` });
    } catch (e: any) {
      setEvents(before.events);
      setUnscheduled(before.unscheduled);
      setNotice({ tone: 'bad', text: e.message });
    }
  };

  const dropProps = (dateKey: string, time?: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      if (dropKey !== dateKey) setDropKey(dateKey);
    },
    onDragLeave: () => setDropKey((k) => (k === dateKey ? null : k)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain') || dragId;
      setDropKey(null);
      setDragId(null);
      if (id) moveTo(id, dateKey, time);
    },
  });

  const weekStart = new Date(year, month, currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    return { date: d, dateKey: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` };
  });

  const handlePrevMonth = () => {
    setNavDir(-1);
    setCurrentDate(view === 'week' ? new Date(year, month, currentDate.getDate() - 7) : new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDir(1);
    setCurrentDate(view === 'week' ? new Date(year, month, currentDate.getDate() + 7) : new Date(year, month + 1, 1));
  };

  const statusMatch = STATUS_FILTERS.find((f) => f.id === statusFilter) || STATUS_FILTERS[0];
  const visible = (e: any) => (!platformFilter || e.platform === platformFilter) && statusMatch.match(e.status);
  const getEventsForDate = (dateKey: string) =>
    events.filter((e) => localKey(e.start) === dateKey && visible(e)).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const platformsInUse = Array.from(new Set([...events, ...unscheduled].map((e) => e.platform).filter(Boolean)));

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
  // Only Instagram and TikTok have a profile grid to preview
  const igScheduled = events.filter(e =>
    e.type === 'scheduled' && ['scheduled', 'approved', 'in_review', 'draft'].includes(e.status) && ['instagram', 'tiktok'].includes(e.platform || e.platforms?.[0]?.platform)
  );
  const igScheduledSorted = [...igScheduled].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Feed tiles: planned posts first (like a profile grid shows the newest first), then live posts.
  const normPlatform = (p?: string): FeedPlatform => (p && p.toLowerCase().includes('tiktok') ? 'tiktok' : 'instagram');
  const tileKind = (mediaType?: string, url?: string, count = 1): TileKind => {
    const t = (mediaType || '').toUpperCase();
    if (t.includes('REEL')) return 'reel';
    if (t.includes('CAROUSEL') || t.includes('ALBUM') || count > 1) return 'carousel';
    if (t.includes('VIDEO') || isVideoMime(undefined, url)) return 'video';
    return 'image';
  };
  const mediaUrl = (m: any) => (typeof m === 'string' ? m : m?.file_url || m?.url || '');

  const mergedFeedItems: FeedItem[] = [
    ...igScheduledSorted.slice(0, 3).map(e => {
      const first = e.media?.[0];
      const url = mediaUrl(first);
      return {
        id: e.id,
        url,
        isScheduled: true,
        event: e,
        permalink: null,
        likes: undefined,
        comments: undefined,
        views: undefined,
        platform: normPlatform(e.platforms?.[0]?.platform),
        kind: tileKind(typeof first === 'object' ? first?.mime_type : undefined, url, e.media?.length || 0),
      };
    }),
    ...visualFeed.slice(0, 6).map((item, idx) => ({
      id: `pub_${idx}`,
      url: item.thumbnail_url || item.media_url,
      isScheduled: false,
      event: null,
      permalink: item.permalink,
      likes: item.like_count,
      comments: item.comments_count,
      views: item.view_count ?? item.views ?? item.play_count ?? item.plays,
      platform: normPlatform(item.platform),
      kind: tileKind(item.media_type, item.media_url),
    })),
  ];
  const feedPlatforms = Array.from(new Set(mergedFeedItems.map(i => i.platform)));
  const activeFeedPlatform: FeedPlatform = feedPlatforms.includes(feedPlatform)
    ? feedPlatform
    : feedPlatforms.includes('instagram') || feedPlatforms.length === 0 ? 'instagram' : 'tiktok';
  const feedTiles = mergedFeedItems.filter(i => i.platform === activeFeedPlatform);
  const grid = PROFILE_GRID[activeFeedPlatform];

  // Presentation helpers
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const monthKey = `${year}-${pad2(month + 1)}`;
  const monthEvents = events.filter(e => localKey(e.start).startsWith(monthKey));
  const scheduledCount = monthEvents.filter(e => ['scheduled', 'publishing'].includes(e.status)).length;
  const publishedCount = monthEvents.filter(e => e.status === 'published').length;
  const failedCount = monthEvents.filter(e => e.status === 'failed' || e.status === 'needs_action').length;
  const reviewCount = monthEvents.filter(e => ['draft', 'in_review', 'approved'].includes(e.status)).length + unscheduled.length;
  const agendaDays = daysGrid
    .filter(c => c.isCurrentMonth)
    .map(c => ({ ...c, items: getEventsForDate(c.dateKey) }))
    .filter(c => c.items.length > 0);

  const renderChip = (e: any, delayMs: number, compact = false) => {
    const platform = e.platforms?.[0]?.platform || 'instagram';
    const failed = e.status === 'failed';
    const movable = canMove(e.status);
    return (
      <button
        type="button"
        key={e.id}
        className={`zca-chip ${failed ? 'is-failed' : ''} ${e.status === 'draft' ? 'is-draft' : ''} ${compact ? '' : 'is-wide'} ${selectedEvent?.id === e.id ? 'is-selected' : ''} ${dragId === e.id ? 'is-dragging' : ''}`}
        style={{ animationDelay: `${delayMs}ms` }}
        draggable={movable}
        onDragStart={(evt) => {
          evt.dataTransfer.setData('text/plain', e.id);
          evt.dataTransfer.effectAllowed = 'move';
          setDragId(e.id);
        }}
        onDragEnd={() => { setDragId(null); setDropKey(null); }}
        onClick={(evt) => {
          evt.stopPropagation();
          setSelectedEvent(e);
          setPermalinkInput('');
        }}
        title={`${statusLabel(e.status)}${e.error_message ? `: ${e.error_message}` : ''}. ${e.title}${movable ? ' (drag to move)' : ''}`}
        aria-label={`${statusLabel(e.status)} ${platform} post${formatTime(e.start) ? ` at ${formatTime(e.start)}` : ''}: ${e.title}`}
      >
        <span className="zca-chip-dot" style={{ background: failed ? 'var(--zd-bad)' : getPlatformColor(platform) }} />
        <span className="zca-chip-icon">{getPlatformIcon(platform)}</span>
        {failed && <AlertCircle size={11} className="zca-chip-warn" />}
        {formatTime(e.start) && <span className="zca-chip-time">{formatTime(e.start)}</span>}
        <span className="zca-chip-title">{e.title}</span>
        <span className={`zca-chip-status tone-${statusTone(e.status)}`} />
      </button>
    );
  };

  return (
    <V3Layout>
      <PageHeader
        number="04"
        label="Calendar"
        title="Calendar"
        subtitle="Drafts, scheduled and published posts"
        actions={
          <Button icon={<Plus />} onClick={() => navigate('/composer')}>Create post</Button>
        }
      />

      <PageBody wide>
        <div className="zca-layout">
          {/* Calendar */}
          <Card className="zca-cal-card" padding={0}>
            <div className="zca-toolbar">
              <div className="zca-month-nav">
                <button type="button" className="zd-icon-btn" onClick={handlePrevMonth} aria-label={view === 'week' ? 'Previous week' : 'Previous month'}>
                  <ChevronLeft />
                </button>
                <h2 key={view === 'week' ? weekDays[0].dateKey : monthKey} className={`zca-month-title ${navDir === 1 ? 'from-right' : 'from-left'}`}>
                  {view === 'week' ? (
                    <>
                      {weekDays[0].date.toLocaleDateString([], { month: 'short', day: 'numeric' })} to {weekDays[6].date.toLocaleDateString([], { month: 'short', day: 'numeric' })} <span className="zd-muted">{weekDays[6].date.getFullYear()}</span>
                    </>
                  ) : (
                    <>
                      {monthNames[month]} <span className="zd-muted">{year}</span>
                    </>
                  )}
                </h2>
                <button type="button" className="zd-icon-btn" onClick={handleNextMonth} aria-label={view === 'week' ? 'Next week' : 'Next month'}>
                  <ChevronRight />
                </button>
              </div>

              <div className="zca-toolbar-right">
                <div className="zca-legend">
                  <Pill tone="neutral">To review {reviewCount}</Pill>
                  <Pill tone="accent">Scheduled {scheduledCount}</Pill>
                  <Pill tone="good">Published {publishedCount}</Pill>
                  {failedCount > 0 && <Pill tone="bad">Needs you {failedCount}</Pill>}
                </div>
                <SegTabs
                  size="sm"
                  value={view}
                  onChange={(id) => setView(id as 'month' | 'week' | 'list')}
                  tabs={[
                    { id: 'month' as const, label: 'Month', icon: <LayoutGrid size={13} /> },
                    { id: 'week' as const, label: 'Week', icon: <Columns3 size={13} /> },
                    { id: 'list' as const, label: 'Agenda', icon: <ListIcon size={13} /> },
                  ]}
                />
              </div>
            </div>

            <div className="zca-filters">
              <div className="zca-filter-row" role="group" aria-label="Filter by status">
                {STATUS_FILTERS.map((f) => (
                  <button key={f.id} type="button" className={`zd-chip ${statusFilter === f.id ? 'is-active' : ''}`} aria-pressed={statusFilter === f.id} onClick={() => setStatusFilter(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
              {platformsInUse.length > 1 && (
                <div className="zca-filter-row" role="group" aria-label="Filter by channel">
                  {['', ...platformsInUse].map((pl) => (
                    <button key={pl || 'all'} type="button" className={`zd-chip ${platformFilter === pl ? 'is-active' : ''}`} aria-pressed={platformFilter === pl} onClick={() => setPlatformFilter(pl)}>
                      {pl ? <SocialIcon platform={pl} size={12} /> : null} {pl ? PLATFORM_NAMES[pl] || pl : 'All channels'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {notice && (
              <div className={`zca-notice tone-${notice.tone}`} role="status">
                {notice.tone === 'bad' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                <span>{notice.text}</span>
                <button type="button" className="zd-icon-btn" onClick={() => setNotice(null)} aria-label="Dismiss">
                  <X size={14} />
                </button>
              </div>
            )}

            {view === 'week' ? (
              <div className="zca-week" key={`w-${weekDays[0].dateKey}`}>
                {weekDays.map((d) => {
                  const items = getEventsForDate(d.dateKey);
                  const isToday = d.dateKey === todayKey;
                  const past = d.dateKey < todayKey;
                  const best = bestTimes?.by_weekday?.[d.date.getDay()] || bestTimes?.slots?.[0]?.time;
                  return (
                    <div key={d.dateKey} className={`zca-week-col ${isToday ? 'is-today' : ''} ${dropKey === d.dateKey ? 'is-drop' : ''}`} {...dropProps(d.dateKey)}>
                      <div className="zca-week-head">
                        <span>{WEEKDAYS[d.date.getDay()]}</span>
                        <strong>{d.date.getDate()}</strong>
                      </div>
                      <div className="zca-week-items">
                        {loading ? <Skeleton height={40} count={2} radius={10} /> : items.map((e, j) => renderChip(e, j * 40))}
                      </div>
                      {!past && best && (
                        <button
                          type="button"
                          className="zca-best-slot"
                          onClick={() => navigate(`/composer?schedule=${d.dateKey}T${best}`)}
                          title={bestTimes?.note}
                          aria-label={`Create a post on ${d.date.toLocaleDateString()} at ${best}, ${bestTimes?.source === 'your_posts' ? 'your best time' : 'a suggested time'}`}
                        >
                          <Plus size={12} /> {best}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : view === 'month' ? (
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
                          {...dropProps(cell.dateKey)}
                          className={`zca-cell ${cell.isCurrentMonth ? '' : 'is-out'} ${isToday ? 'is-today' : ''} ${dayEvents.length ? 'has-events' : ''} ${dropKey === cell.dateKey ? 'is-drop' : ''}`}
                          title="Click empty space to schedule a post, or drop a post here to move it"
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
                      action={<Button icon={<Plus />} onClick={() => navigate('/composer')}>Create post</Button>}
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

          <div className="zca-side">
          {/* Unscheduled drafts: drag one onto a day to give it a time */}
          {(unscheduled.length > 0 || bestTimes) && (
            <Card className="zca-tray-card">
              {unscheduled.length > 0 && (
                <>
                  <CardTitle sub="Drag a draft onto a day to schedule it.">Not scheduled yet</CardTitle>
                  <div className="zca-tray">{unscheduled.filter(visible).map((e, i) => renderChip(e, i * 40))}</div>
                </>
              )}
              {bestTimes && (
                <div className="zca-best">
                  <div className="zca-best-head">
                    <strong>Best times to post</strong>
                    <small>{bestTimes.note}</small>
                  </div>
                  <div className="zca-best-slots">
                    {bestTimes.slots.map((s: any) => (
                      <span key={s.time} className="zca-best-time">{s.time}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Visual feed preview */}
          <Card className="zca-feed-card">
            <CardTitle
              icon={<LayoutGrid />}
              sub="See how scheduled and published posts line up on your profile grid."
            >
              Visual feed preview
            </CardTitle>

            {feedPlatforms.length > 1 && (
              <div className="zca-feed-toggle">
                <SegTabs
                  size="sm"
                  value={activeFeedPlatform}
                  onChange={(id) => setFeedPlatform(id as FeedPlatform)}
                  tabs={[
                    { id: 'instagram' as const, label: 'Instagram', icon: <SocialIcon platform="instagram" size={12} /> },
                    { id: 'tiktok' as const, label: 'TikTok', icon: <SocialIcon platform="tiktok" size={12} /> },
                  ]}
                />
              </div>
            )}

            {feedTiles.length === 0 ? (
              <EmptyState
                icon={<LayoutGrid size={22} />}
                title="Your feed is empty"
                body="It will preview here once you schedule or publish a post."
              />
            ) : (
              <>
                <div className="zca-feed-cap">{grid.label}</div>
                <div
                  key={activeFeedPlatform}
                  className={`zca-feed is-${activeFeedPlatform}`}
                  style={{ gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))` }}
                >
                  {feedTiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`zca-tile ${item.isScheduled ? 'is-planned' : ''}`}
                      style={{ aspectRatio: `${grid.aspect}`, animationDelay: `${120 + idx * 55}ms` }}
                      onClick={() => {
                        if (item.isScheduled) {
                          setSelectedEvent(item.event);
                        } else if (item.permalink) {
                          window.open(item.permalink, '_blank');
                        }
                      }}
                    >
                      {item.url ? (
                        isVideoMime(undefined, item.url) ? (
                          <video src={item.url} muted playsInline preload="metadata" />
                        ) : (
                          <img src={item.url} alt="" loading="lazy" />
                        )
                      ) : (
                        <div className="zca-tile-text">Text</div>
                      )}
                      {item.kind !== 'image' && (
                        <span className="zca-tile-kind" aria-label={item.kind}>
                          {item.kind === 'carousel' ? (
                            <Copy size={14} />
                          ) : item.kind === 'reel' ? (
                            <Clapperboard size={14} />
                          ) : (
                            <Play size={14} fill="#fff" />
                          )}
                        </span>
                      )}
                      {activeFeedPlatform === 'tiktok' && !item.isScheduled && (
                        <span className="zca-tile-views">
                          <Play size={11} />
                          {item.views !== undefined && item.views !== null ? compactNumber(Number(item.views)) : '0'}
                        </span>
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
        </div>
      </PageBody>

      {/* Modal: post details. Portaled to body so the page's animated stacking context cannot put the sidebar above it */}
      {selectedEvent && createPortal(
        <div className="zca-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setSelectedEvent(null); setDraftError(''); } }}>
          <div className="zca-modal" role="dialog" aria-modal="true">
            <div className="zca-modal-head">
              <div>
                <span className="zd-eyebrow">
                  {statusLabel(selectedEvent.status)} post
                </span>
                <h3>
                  {selectedEvent.status === 'failed'
                    ? 'This post did not go out'
                    : selectedEvent.status === 'needs_action'
                    ? 'Post this one by hand'
                    : ['draft', 'in_review', 'approved'].includes(selectedEvent.status)
                    ? 'Waiting for your review'
                    : selectedEvent.status === 'published'
                    ? 'Published post'
                    : 'Scheduled post'}
                </h3>
              </div>
              <button type="button" className="zd-icon-btn" onClick={() => setSelectedEvent(null)} aria-label="Close">
                <X />
              </button>
            </div>

            <div className="zca-modal-body">
              {/* Timing metadata */}
              <div className="zca-meta">
                <Pill tone={statusTone(selectedEvent.status)}>{statusLabel(selectedEvent.status)}</Pill>
                <span className="zd-muted">{selectedEvent.start ? new Date(selectedEvent.start).toLocaleString() : 'No time set'}</span>
                {selectedEvent.status === 'published' && (
                  <span className="zd-muted">{selectedEvent.verified_at ? 'Checked live by Zie' : 'Zie checks it shortly'}</span>
                )}
              </div>

              {selectedEvent.error_message && selectedEvent.status !== 'needs_action' && (
                <div className="zca-error">
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <div><strong>Error:</strong> {selectedEvent.error_message}</div>
                </div>
              )}

              {['draft', 'in_review', 'approved'].includes(selectedEvent.status) && (
                <div className="zca-draft-note">
                  <ZIcon name="ai-draft" size={14} />
                  <div>
                    <strong>{selectedEvent.status === 'approved' ? 'Approved, no time yet.' : 'Nothing publishes until you approve it.'}</strong>{' '}
                    {selectedEvent.status === 'approved' ? 'Drag it onto a day, or send it now.' : 'Open it in Composer to edit the copy or add media.'}
                  </div>
                </div>
              )}
              {selectedEvent.status === 'needs_action' && (
                <div className="zca-draft-note">
                  <AlertCircle size={14} />
                  <div>
                    <strong>Publish this one yourself.</strong> {selectedEvent.error_message || 'This platform needs you to post it in its app.'} Then paste the link and mark it as posted so reports stay right.
                    <input className="zca-permalink" type="url" placeholder="https://www.tiktok.com/@you/video/..." value={permalinkInput} onChange={(e) => setPermalinkInput(e.target.value)} aria-label="Link to the published post" />
                  </div>
                </div>
              )}
              {selectedEvent.first_comment && (
                <div className="zca-first-comment">
                  <span className="zd-eyebrow">First comment</span>
                  <p>{selectedEvent.first_comment}</p>
                </div>
              )}
              {draftError && (
                <div className="zca-error">
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <div>{draftError}</div>
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
                  <Eye /> View post
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
              <div className="zca-draft-actions">
                <Button size="sm" variant="ghost" icon={<Copy size={13} />} loading={busyAction === 'duplicate'} onClick={() => postAction(selectedEvent, 'duplicate')}>
                  Duplicate
                </Button>
                {canMove(selectedEvent.status) && selectedEvent.status !== 'needs_action' && (
                  <Button size="sm" variant="ghost" icon={<PenLine size={13} />} onClick={() => navigate(`/composer?draft=${selectedEvent.id}`)}>
                    Edit
                  </Button>
                )}
                {selectedEvent.status === 'draft' && (
                  <Button size="sm" variant="secondary" loading={busyAction === 'request-review'} onClick={() => postAction(selectedEvent, 'request-review')}>
                    Send for review
                  </Button>
                )}
                {['draft', 'in_review'].includes(selectedEvent.status) && (
                  <Button size="sm" variant="primary" icon={<CheckCircle2 size={14} />} loading={approvingId === selectedEvent.id} onClick={() => handleApproveDraft(selectedEvent)}>
                    Approve
                  </Button>
                )}
                {['failed', 'approved'].includes(selectedEvent.status) && (
                  <Button size="sm" variant="primary" icon={selectedEvent.status === 'failed' ? <RotateCcw size={13} /> : <Send size={13} />} loading={busyAction === 'retry'} onClick={() => postAction(selectedEvent, 'retry')}>
                    {selectedEvent.status === 'failed' ? 'Retry now' : 'Publish now'}
                  </Button>
                )}
                {selectedEvent.status === 'needs_action' && (
                  <Button size="sm" variant="primary" icon={<CheckCircle2 size={14} />} loading={busyAction === 'mark-posted'} onClick={() => postAction(selectedEvent, 'mark-posted', permalinkInput ? { permalink: permalinkInput } : {})}>
                    Mark as posted
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </V3Layout>
  );
}
