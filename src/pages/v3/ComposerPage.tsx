import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import {
  Card,
  CardTitle,
  DarkButton,
  GhostButton,
  LoadingState,
  PageBody,
  PageHeader,
  Pill,
  Skeleton,
  Button,
} from '../../components/v3/ui';
import { supabase } from '../../lib/supabaseClient';
import { uploadMedia } from '../../lib/uploadMedia';
import { useDemoMode } from '../../lib/demoStore';
import { sampleConnections } from '../../data/sample-data';
import {
  Send,
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Layers,
  Trash2,
  CheckCircle,
  AlertCircle,
  Check,
  X,
  Upload,
  Globe,
  Music2,
  Eye,
  MessageCircle,
  
  PenLine,
  
  Heart,
  Bookmark,
  Repeat2,
  BarChart2,
  ThumbsUp,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Plus,
  Play,
} from 'lucide-react';
import ZIcon from '../../components/icons/ZIcon';
import SocialIcon from '../../components/v3/SocialIcon';
import BulkUploadModal from '../../components/v3/BulkUploadModal';
import { validatePost, hasErrors, Issue, ValidatePlatform, RULES } from '../../lib/postValidation';
import { api } from '../../lib/api';
import {
  PlatformFormat,
  defaultFormatFor,
  formatCaption,
  formatsFor,
  isVideoMime,
  sizeLabel,
} from '../../lib/platformFormats';
import './composer.css';

/* Platform brand marks (brand colors are allowed). */
/** YouTube video categories (snippet.categoryId) */
const YT_CATEGORIES: Array<[string, string]> = [
  ['22', 'People and Blogs'],
  ['26', 'Howto and Style'],
  ['27', 'Education'],
  ['24', 'Entertainment'],
  ['28', 'Science and Technology'],
  ['19', 'Travel and Events'],
  ['17', 'Sports'],
  ['10', 'Music'],
  ['20', 'Gaming'],
  ['23', 'Comedy'],
  ['25', 'News and Politics'],
  ['15', 'Pets and Animals'],
  ['2', 'Autos and Vehicles'],
  ['1', 'Film and Animation'],
];

const PLATFORM_META: Record<string, { icon: ReactNode; color: string; name: string }> = {
  instagram: { icon: <SocialIcon platform="instagram" size={16} />, color: '#ffffff', name: 'Instagram' },
  tiktok: { icon: <SocialIcon platform="tiktok" size={16} />, color: '#ffffff', name: 'TikTok' },
  linkedin: { icon: <SocialIcon platform="linkedin" size={16} />, color: '#ffffff', name: 'LinkedIn' },
  facebook: { icon: <SocialIcon platform="facebook" size={16} />, color: '#ffffff', name: 'Facebook' },
  x: { icon: <SocialIcon platform="x" size={16} />, color: '#ffffff', name: 'X' },
  youtube: { icon: <SocialIcon platform="youtube" size={16} />, color: '#ffffff', name: 'YouTube' },
  threads: { icon: <SocialIcon platform="threads" size={16} />, color: '#ffffff', name: 'Threads' },
  pinterest: { icon: <SocialIcon platform="pinterest" size={16} />, color: '#ffffff', name: 'Pinterest' },
  bluesky: { icon: <SocialIcon platform="bluesky" size={16} />, color: '#ffffff', name: 'Bluesky' },
  mastodon: { icon: <SocialIcon platform="mastodon" size={16} />, color: '#ffffff', name: 'Mastodon' },
  telegram: { icon: <SocialIcon platform="telegram" size={16} />, color: '#ffffff', name: 'Telegram' },
  discord: { icon: <SocialIcon platform="discord" size={16} />, color: '#ffffff', name: 'Discord' },
};
const platformMeta = (p?: string) =>
  (p && PLATFORM_META[p]) || { icon: <Globe />, color: '#505050', name: p ? p.charAt(0).toUpperCase() + p.slice(1) : 'Post' };

/* Echo text with hashtags highlighted in the preview. */
const renderWithTags = (text: string) =>
  text.split(/(#\w+)/g).map((part, i) =>
    /^#\w+$/.test(part) ? (
      <span key={i} className="zco-tag">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

/* ── Platform accurate preview ── */

type PreviewMedia = { id: string; file_url: string; file_name?: string; mime_type?: string };

/* One media item, image or video, cropped to fill its frame like the platform does. */
function PvMedia({ item }: { item: PreviewMedia }) {
  if (isVideoMime(item.mime_type, item.file_url)) {
    return <video src={item.file_url} muted loop autoPlay playsInline preload="metadata" />;
  }
  return <img src={item.file_url} alt={item.file_name || ''} />;
}

/* Media frame in the exact aspect ratio. Gray placeholder with the size label when empty. */
function PvFrame({
  fmt,
  media,
  index = 0,
  grid = false,
  className = '',
  children,
}: {
  fmt: PlatformFormat;
  media: PreviewMedia[];
  index?: number;
  grid?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const shown = grid ? media.slice(0, 4) : media.slice(index, index + 1);
  const extra = grid ? media.length - 4 : 0;
  return (
    <div className={`zco-fmt-frame ${className}`} style={{ aspectRatio: `${fmt.width} / ${fmt.height}` }}>
      {shown.length === 0 ? (
        <div className="zco-fmt-ph">
          <ImageIcon />
          <span>{sizeLabel(fmt)}</span>
        </div>
      ) : (
        <div className={`zco-fmt-media n-${shown.length}`}>
          {shown.map((m, i) => (
            <div key={m.id} className="zco-fmt-cell">
              <PvMedia item={m} />
              {extra > 0 && i === shown.length - 1 && <span className="zco-fmt-more">+{extra}</span>}
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

/* Caption that collapses after a limit and shows the platform's "more" link. */
function PvCaption({
  text,
  limit,
  moreLabel,
  lead,
  className = '',
  clampLines,
}: {
  text: string;
  limit: number;
  moreLabel: string;
  lead?: ReactNode;
  className?: string;
  clampLines?: number;
}) {
  const [open, setOpen] = useState(false);
  const lines = text.split('\n');
  const tooLong = text.length > limit || (clampLines ? lines.length > clampLines : false);
  let shown = text;
  if (!open && tooLong) {
    shown = clampLines ? lines.slice(0, clampLines).join('\n') : text;
    if (shown.length > limit) shown = shown.slice(0, limit).replace(/\s+\S*$/, '');
  }
  return (
    <div className={`zco-fmt-cap ${className}`}>
      {lead}
      {text ? renderWithTags(shown) : <span className="zco-fmt-empty">Your caption will appear here.</span>}
      {!open && tooLong ? (
        <>
          {'... '}
          <button type="button" className="zco-fmt-morebtn" onClick={() => setOpen(true)}>
            {moreLabel}
          </button>
        </>
      ) : (
        <span className="zco-caret" aria-hidden="true" />
      )}
    </div>
  );
}

const Avatar = ({ meta, size = 32, square = false }: { meta: { icon: ReactNode; color: string }; size?: number; square?: boolean }) => (
  <span
    className={`zco-fmt-avatar ${square ? 'is-square' : ''}`}
    style={{ width: size, height: size, background: meta.color }}
  >
    {meta.icon}
  </span>
);

function PlatformPreview({
  fmt,
  platform,
  handle,
  meta,
  text,
  media,
  firstComment,
}: {
  fmt: PlatformFormat;
  platform: string;
  handle: string;
  meta: { icon: ReactNode; color: string; name: string };
  text: string;
  media: PreviewMedia[];
  firstComment?: string;
}) {
  const [slide, setSlide] = useState(0);
  const idx = Math.min(slide, Math.max(0, media.length - 1));
  const bare = handle.replace(/^@/, '');
  const at = `@${bare}`;
  const hasMulti = media.length > 1;
  const dots = hasMulti && (
    <div className="zco-fmt-dots" role="tablist" aria-label="Carousel">
      {media.slice(0, 10).map((m, i) => (
        <button
          type="button"
          key={m.id}
          aria-label={`Slide ${i + 1}`}
          aria-selected={i === idx}
          className={i === idx ? 'is-on' : ''}
          onClick={() => setSlide(i)}
        />
      ))}
    </div>
  );

  switch (fmt.layout) {
    case 'ig-feed':
      return (
        <div className="zco-fmt zco-fmt-ig" data-platform={platform}>
          <div className="zco-fmt-row zco-fmt-head">
            <span className="zco-fmt-ring"><Avatar meta={meta} size={28} /></span>
            <strong className="zco-fmt-handle">{bare}</strong>
            <MoreHorizontal className="zco-fmt-push" size={18} />
          </div>
          <PvFrame fmt={fmt} media={media} index={idx}>
            {hasMulti && <span className="zco-fmt-count">{idx + 1}/{media.length}</span>}
          </PvFrame>
          <div className="zco-fmt-row zco-fmt-actions">
            <Heart size={22} />
            <MessageCircle size={22} />
            <Send size={21} />
            {dots ? <div className="zco-fmt-dots-mid">{dots}</div> : null}
            <Bookmark size={22} className="zco-fmt-push" />
          </div>
          <div className="zco-fmt-body">
            <div className="zco-fmt-likes">Be the first to like this</div>
            <PvCaption text={text} limit={125} moreLabel="more" lead={<strong className="zco-fmt-lead">{bare} </strong>} />
            {firstComment && (
              <div className="zco-fmt-cap zco-fmt-comment">
                <strong className="zco-fmt-lead">{bare} </strong>
                {renderWithTags(firstComment)}
              </div>
            )}
            <div className="zco-fmt-time">Just now</div>
          </div>
        </div>
      );

    case 'ig-reel':
    case 'tiktok': {
      const isTT = fmt.layout === 'tiktok';
      return (
        <div className={`zco-fmt zco-fmt-full ${isTT ? 'zco-fmt-tt' : 'zco-fmt-reel'}`} data-platform={platform}>
          <PvFrame fmt={fmt} media={media} index={idx} className="is-full">
            <div className="zco-fmt-shade" />
            {isTT && <div className="zco-fmt-tt-top"><span>Following</span><strong>For You</strong></div>}
            {!isTT && <div className="zco-fmt-reel-top">Reels</div>}
            <div className="zco-fmt-rail">
              {isTT && (
                <span className="zco-fmt-rail-avatar">
                  <Avatar meta={meta} size={38} />
                  <span className="zco-fmt-follow"><Plus size={10} strokeWidth={3} /></span>
                </span>
              )}
              <span><Heart size={isTT ? 26 : 24} fill={isTT ? '#fff' : 'none'} /><small>0</small></span>
              <span>{isTT ? <MessageSquare size={24} fill="#fff" /> : <MessageCircle size={24} />}<small>0</small></span>
              {isTT && <span><Bookmark size={24} fill="#fff" /><small>0</small></span>}
              <span>{isTT ? <Share2 size={24} /> : <Send size={23} />}<small>{isTT ? 'Share' : ''}</small></span>
              {!isTT && <span><MoreHorizontal size={22} /></span>}
              <span className={`zco-fmt-disc ${isTT ? 'is-tt' : ''}`}><Music2 size={12} /></span>
            </div>
            <div className="zco-fmt-overlay">
              {isTT ? (
                <strong className="zco-fmt-ovname">{at}</strong>
              ) : (
                <div className="zco-fmt-ovuser">
                  <Avatar meta={meta} size={26} />
                  <strong>{bare}</strong>
                  <span className="zco-fmt-follow-pill">Follow</span>
                </div>
              )}
              <PvCaption text={text} limit={isTT ? 90 : 70} moreLabel="more" clampLines={2} className="is-overlay" />
              <div className="zco-fmt-sound">
                <Music2 size={11} />
                <span className="zco-fmt-marquee">original sound - {bare}</span>
              </div>
            </div>
            {hasMulti && <div className="zco-fmt-full-dots">{dots}</div>}
          </PvFrame>
        </div>
      );
    }

    case 'linkedin':
      return (
        <div className="zco-fmt zco-fmt-li" data-platform={platform}>
          <div className="zco-fmt-row zco-fmt-head is-tall">
            <Avatar meta={meta} size={40} />
            <div className="zco-fmt-who">
              <strong>{bare}</strong>
              <span>1,248 followers</span>
              <span>Now <Globe size={10} /></span>
            </div>
            <MoreHorizontal className="zco-fmt-push" size={18} />
          </div>
          <div className="zco-fmt-body is-top">
            <PvCaption text={text} limit={210} clampLines={3} moreLabel="see more" />
          </div>
          <PvFrame fmt={fmt} media={media} grid />
          <div className="zco-fmt-row zco-fmt-stats">
            <span className="zco-fmt-reacts">
              <i className="r-like"><ThumbsUp size={9} /></i>
              <i className="r-love"><Heart size={9} /></i>
              <i className="r-clap"><ZIcon name="celebrate" size={9} /></i>
            </span>
            <span>24</span>
            <span className="zco-fmt-push">3 comments · 2 reposts</span>
          </div>
          <div className="zco-fmt-row zco-fmt-bar">
            <span><ThumbsUp size={16} /> Like</span>
            <span><MessageSquare size={16} /> Comment</span>
            <span><Repeat2 size={16} /> Repost</span>
            <span><Send size={15} /> Send</span>
          </div>
        </div>
      );

    case 'facebook':
      return (
        <div className="zco-fmt zco-fmt-fb" data-platform={platform}>
          <div className="zco-fmt-row zco-fmt-head is-tall">
            <Avatar meta={meta} size={40} />
            <div className="zco-fmt-who">
              <strong>{bare}</strong>
              <span>Just now · <Globe size={10} /></span>
            </div>
            <MoreHorizontal className="zco-fmt-push" size={18} />
          </div>
          <div className="zco-fmt-body is-top">
            <PvCaption text={text} limit={250} clampLines={5} moreLabel="See more" />
          </div>
          <PvFrame fmt={fmt} media={media} grid />
          <div className="zco-fmt-row zco-fmt-stats">
            <span className="zco-fmt-reacts">
              <i className="r-fb"><ThumbsUp size={9} /></i>
              <i className="r-love"><Heart size={9} /></i>
            </span>
            <span>18</span>
            <span className="zco-fmt-push">4 comments</span>
          </div>
          <div className="zco-fmt-row zco-fmt-bar">
            <span><ThumbsUp size={16} /> Like</span>
            <span><MessageCircle size={16} /> Comment</span>
            <span><Share2 size={16} /> Share</span>
          </div>
        </div>
      );

    case 'x': {
      const over = text.length > 280;
      return (
        <div className="zco-fmt zco-fmt-x" data-platform={platform}>
          <div className="zco-fmt-xgrid">
            <Avatar meta={meta} size={38} />
            <div className="zco-fmt-xmain">
              <div className="zco-fmt-xname">
                <strong>{bare}</strong>
                <span>{at} · now</span>
                <MoreHorizontal className="zco-fmt-push" size={16} />
              </div>
              <div className="zco-fmt-cap is-x">
                {text ? renderWithTags(over ? text.slice(0, 280) : text) : <span className="zco-fmt-empty">Your post will appear here.</span>}
                {over && <mark className="zco-fmt-over">{text.slice(280)}</mark>}
                <span className="zco-caret" aria-hidden="true" />
              </div>
              <PvFrame fmt={fmt} media={media} grid className="is-rounded" />
              <div className="zco-fmt-row zco-fmt-xbar">
                <span><MessageCircle size={15} /> 0</span>
                <span><Repeat2 size={16} /> 0</span>
                <span><Heart size={15} /> 0</span>
                <span><BarChart2 size={15} /> 0</span>
                <span className="zco-fmt-xend"><Bookmark size={15} /><Share2 size={15} /></span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'youtube': {
      const title = text.split('\n').find((l) => l.trim()) || '';
      const hasVideo = media.some((m) => isVideoMime(m.mime_type, m.file_url));
      return (
        <div className="zco-fmt zco-fmt-yt" data-platform={platform}>
          <PvFrame fmt={fmt} media={media} className="is-yt">
            {media.length > 0 && (
              <>
                {!hasVideo && <span className="zco-fmt-play"><Play size={18} fill="#fff" /></span>}
                <span className="zco-fmt-dur">0:30</span>
              </>
            )}
          </PvFrame>
          <div className="zco-fmt-ytmeta">
            <Avatar meta={meta} size={34} />
            <div className="zco-fmt-ytinfo">
              <div className={`zco-fmt-yttitle ${title ? '' : 'is-empty'}`}>{title || 'Your video title will appear here.'}</div>
              <span>{bare} · 0 views · Just now</span>
            </div>
            <MoreHorizontal size={16} className="zco-fmt-push" />
          </div>
        </div>
      );
    }
  }
  return null;
}

export default function ComposerPage() {
  const navigate = useNavigate();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  // A draft made by the AI Agent (or saved earlier) that the user is reviewing here
  const [editingDraft, setEditingDraft] = useState<{ id: string; platform: string } | null>(null);
  const [draftBusy, setDraftBusy] = useState<'' | 'save' | 'delete'>('');
  const [draftNote, setDraftNote] = useState('');
  const demo = useDemoMode();
  const [connections, setConnections] = useState<any[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]); // connected_accounts IDs
  const [contentText, setContentText] = useState('');
  const [mediaAttachments, setMediaAttachments] = useState<any[]>([]); // items selected from library
  const [firstComment, setFirstComment] = useState('');
  const [publishMethod, setPublishMethod] = useState<'direct_api' | 'manual_reminder'>('direct_api');
  const [scheduleType, setScheduleType] = useState<'now' | 'schedule' | 'queue' | 'review' | 'draft'>('now');
  const [submitResults, setSubmitResults] = useState<Array<{ platform: string; status: string; reason?: string; permalink?: string }> | null>(null);
  // TikTok posting screen (spec 9.2 audit rules): no default privacy, interactions off by default
  const [tiktokOpts, setTiktokOpts] = useState<{ privacy: string; comment: boolean; duet: boolean; stitch: boolean; commercial: boolean; yourBrand: boolean; branded: boolean; musicConsent: boolean }>({ privacy: '', comment: false, duet: false, stitch: false, commercial: false, yourBrand: false, branded: false, musicConsent: false });
  const [tiktokCreator, setTiktokCreator] = useState<{ nickname?: string; privacy_options?: string[]; comment_disabled?: boolean; duet_disabled?: boolean; stitch_disabled?: boolean; max_video_post_duration_sec?: number; source?: string } | null>(null);
  // YouTube and Pinterest options: title and privacy for a video, board and link for a Pin
  const [ytOpts, setYtOpts] = useState<{ title: string; privacy: string; madeForKids: '' | 'yes' | 'no'; category: string; tags: string; thumbnail: { url: string; name: string } | null }>({ title: '', privacy: 'public', madeForKids: '', category: '22', tags: '', thumbnail: null });
  const [thumbBusy, setThumbBusy] = useState(false);
  const [pinOpts, setPinOpts] = useState<{ board_id: string; link: string }>({ board_id: '', link: '' });
  const [pinBoards, setPinBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [customOverrides, setCustomOverrides] = useState<Record<string, string>>({}); // accountId -> customized content

  // UI state
  const [activeTab, setActiveTab] = useState<string>('universal');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerSuccess, setComposerSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // Preview format the user picked per platform (falls back to the platform default)
  const [formatChoice, setFormatChoice] = useState<Record<string, string>>({});

  const characterLimits: Record<string, number> = {
    universal: 2200,
    instagram: 2200,
    tiktok: 2200,
    linkedin: 3000,
    x: 280,
    facebook: 63206,
    youtube: 5000
  };

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const loadData = async () => {
    if (demo.isActive) {
      setConnections(sampleConnections);
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const [connRes, mediaRes] = await Promise.all([
        fetch('/api/v3/connections', { headers }),
        fetch('/api/v3/media/library', { headers })
      ]);

      const connJ = await connRes.json();
      if (connJ.success) setConnections(connJ.data.filter((c: any) => c.platform !== 'meta_ads' && c.platform !== 'google_ads' && c.platform !== 'tiktok_ads'));

      const mediaJ = await mediaRes.json();
      if (mediaJ.success) {
        setMediaLibrary(mediaJ.data.map((m: any) => ({
          id: m.id,
          file_url: m.blob_url,
          file_name: m.file_name,
          mime_type: m.mime_type
        })));
      }
    } catch (err) {
      console.error("Failed to load Composer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [demo.isActive]);

  // Load the draft once accounts and media are in
  useEffect(() => {
    if (!draftId || loading || demo.isActive || editingDraft?.id === draftId) return;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/v3/posts/${draftId}`, { headers });
        const j = await res.json();
        if (!j.success) throw new Error(j.error || 'Draft not found');
        const p = j.data;
        const tags = (p.hashtags || []).map((h: string) => `#${h}`).join(' ');
        setContentText(tags ? `${p.caption || ''}\n\n${tags}` : p.caption || '');
        const acct = connections.find((c: any) => c.platform === p.platform);
        if (acct) setSelectedAccounts([acct.id]);
        const urls: string[] = p.media_urls || [];
        if (urls.length) setMediaAttachments(mediaLibrary.filter((m: any) => urls.includes(m.file_url)));
        if (p.scheduled_for) {
          const d = new Date(p.scheduled_for);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
          setScheduleType('schedule');
          setScheduleDate(local.slice(0, 10));
          setScheduleTime(local.slice(11, 16));
        }
        setEditingDraft({ id: p.id, platform: p.platform });
      } catch (err: any) {
        setComposerError(err.message || 'Could not load the draft.');
      }
    })();
  }, [draftId, loading, demo.isActive]);

  const saveDraftEdits = async () => {
    if (!editingDraft) return;
    setDraftBusy('save');
    setDraftNote('');
    try {
      const headers = await getAuthHeaders();
      const hashtags = contentText.match(/#\w+/g)?.map((h) => h.slice(1)) || [];
      const caption = contentText.replace(/(^|\s)#\w+/g, '').trim();
      const scheduled_for = scheduleDate && scheduleTime ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : undefined;
      const res = await fetch(`/api/v3/posts/${editingDraft.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ caption, hashtags, scheduled_for, media_ids: mediaAttachments.map((m) => m.id), keep_draft: true }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || j.error || 'Could not save the draft.');
      setDraftNote('Draft saved. It stays on your calendar until you schedule it.');
    } catch (err: any) {
      setComposerError(err.message);
    } finally {
      setDraftBusy('');
    }
  };

  const deleteDraft = async () => {
    if (!editingDraft) return;
    setDraftBusy('delete');
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/v3/posts/${editingDraft.id}`, { method: 'DELETE', headers });
      navigate('/calendar');
    } finally {
      setDraftBusy('');
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAccountToggle = (id: string) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      // Saved to the Media Library too, so the file can be reused and scheduled posts keep a stable copy
      const m = await uploadMedia(file);
      setMediaAttachments(prev => [...prev, { id: m.id, file_url: m.url, file_name: m.file_name, mime_type: m.mime_type }]);
    } catch (err: any) {
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSelectFromLibrary = (item: any) => {
    if (mediaAttachments.some(x => x.id === item.id)) {
      setMediaAttachments(prev => prev.filter(x => x.id !== item.id));
    } else {
      setMediaAttachments(prev => [...prev, item]);
    }
  };

  const getActiveLimit = () => {
    if (activeTab === 'universal') {
      if (selectedAccounts.length === 0) return 2200;
      const limits = selectedAccounts.map(id => {
        const conn = connections.find(c => c.id === id);
        return characterLimits[conn?.platform || 'instagram'] || 2200;
      });
      return Math.min(...limits);
    }
    const activeConn = connections.find(c => c.id === activeTab);
    return characterLimits[activeConn?.platform || 'instagram'] || 2200;
  };

  const getActiveText = () => {
    if (activeTab === 'universal') return contentText;
    return customOverrides[activeTab] !== undefined ? customOverrides[activeTab] : contentText;
  };

  const currentLength = getActiveText().length;
  const currentLimit = getActiveLimit();
  const percentage = (currentLength / currentLimit) * 100;
  let counterTone = 'muted';
  if (percentage >= 100) {
    counterTone = 'bad';
  } else if (percentage >= 80) {
    counterTone = 'warn';
  }

  const handleTextChange = (val: string) => {
    if (activeTab === 'universal') {
      setContentText(val);
    } else {
      setCustomOverrides(prev => ({ ...prev, [activeTab]: val }));
    }
  };

  const isInheriting = activeTab !== 'universal' && customOverrides[activeTab] === undefined;

  /* Pre-publish checks per selected account (spec 7.4) */
  const textFor = (id: string) => (customOverrides[id] !== undefined ? customOverrides[id] : contentText);
  const issuesByAccount: Record<string, Issue[]> = {};
  for (const id of selectedAccounts) {
    const conn = connections.find((c) => c.id === id);
    const platform = conn?.platform as ValidatePlatform;
    if (!platform || !RULES[platform]) continue;
    const list = validatePost(platform, {
      caption: textFor(id),
      media: mediaAttachments.map((m) => ({ url: m.file_url, mime: m.mime_type })),
      firstComment: RULES[platform].firstComment ? firstComment : undefined,
    }, { creatorMaxVideoSec: platform === 'tiktok' ? tiktokCreator?.max_video_post_duration_sec : undefined });
    if (platform === 'tiktok' && scheduleType !== 'draft') {
      if (!tiktokOpts.privacy) list.push({ level: 'error', code: 'tiktok_privacy', message: 'Choose who can view the TikTok video.' });
      if (tiktokOpts.commercial && !tiktokOpts.yourBrand && !tiktokOpts.branded) list.push({ level: 'error', code: 'tiktok_disclosure', message: 'Pick Your brand, Branded content or both, or switch off commercial content.' });
      if (!tiktokOpts.musicConsent) list.push({ level: 'error', code: 'tiktok_music', message: "Confirm TikTok's Music Usage Confirmation." });
    }
    if (list.length) issuesByAccount[id] = list;
  }
  const blockingIssues = scheduleType !== 'draft' && Object.values(issuesByAccount).some(hasErrors);
  const hasTikTok = selectedAccounts.some((id) => connections.find((c) => c.id === id)?.platform === 'tiktok');
  const hasYouTube = selectedAccounts.some((id) => connections.find((c) => c.id === id)?.platform === 'youtube');
  const hasPinterest = selectedAccounts.some((id) => connections.find((c) => c.id === id)?.platform === 'pinterest');
  useEffect(() => {
    if (!hasPinterest || pinBoards.length) return;
    api('/api/auth/pinterest/boards')
      .then((j) => {
        setPinBoards(j.boards || []);
        setPinOpts((o) => ({ ...o, board_id: o.board_id || j.default_board_id || j.boards?.[0]?.id || '' }));
      })
      .catch(() => undefined);
  }, [hasPinterest]);

  // TikTok creator info: nickname, allowed privacy levels and interaction settings
  useEffect(() => {
    if (!hasTikTok || tiktokCreator || demo.isActive) return;
    api('/api/v3/tiktok/creator-info')
      .then((j) => setTiktokCreator(j.creator || {}))
      .catch(() => setTiktokCreator({}));
  }, [hasTikTok, tiktokCreator, demo.isActive]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (demo.isActive) {
      setComposerError("Demo mode: publishing is disabled.");
      return;
    }
    if (selectedAccounts.length === 0) {
      setComposerError("Select at least one account to post to.");
      return;
    }
    if (blockingIssues) {
      setComposerError("Fix the problems listed under Checks before posting.");
      return;
    }
    if (hasYouTube && !ytOpts.madeForKids && scheduleType !== 'draft') {
      setComposerError("YouTube: choose the audience (made for kids or not) in YouTube settings.");
      return;
    }
    if (scheduleType === 'schedule' && (!scheduleDate || !scheduleTime)) {
      setComposerError("Pick a date and time.");
      return;
    }

    setSubmitting(true);
    setComposerError(null);
    setSubmitResults(null);
    try {
      const targets = selectedAccounts.map((id) => {
        const conn = connections.find((c) => c.id === id);
        const platform = conn?.platform;
        const opts: Record<string, unknown> = {};
        if (publishMethod === 'manual_reminder') opts.manual = true;
        if (platform === 'tiktok') Object.assign(opts, { tiktok: tiktokOpts });
        if (platform === 'youtube') {
          const tags = ytOpts.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 30);
          Object.assign(opts, {
            privacy: ytOpts.privacy,
            made_for_kids: ytOpts.madeForKids === 'yes',
            category_id: ytOpts.category,
            ...(ytOpts.title.trim() ? { title: ytOpts.title.trim() } : {}),
            ...(tags.length ? { tags } : {}),
            ...(ytOpts.thumbnail ? { thumbnail_url: ytOpts.thumbnail.url } : {}),
          });
        }
        if (platform === 'pinterest') Object.assign(opts, { ...(pinOpts.board_id ? { board_id: pinOpts.board_id } : {}), ...(pinOpts.link.trim() ? { link: pinOpts.link.trim() } : {}) });
        return {
          account_id: id,
          platform,
          caption: textFor(id),
          first_comment: platform && RULES[platform as ValidatePlatform]?.firstComment ? firstComment : undefined,
          platform_options: opts,
        };
      });
      const j = await api('/api/v3/posts/submit', {
        body: {
          targets,
          caption: contentText,
          media_ids: mediaAttachments.map((m) => m.id),
          media_attachments: mediaAttachments,
          mode: scheduleType,
          scheduled_for: scheduleType === 'schedule' ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : undefined,
        },
      });
      if (editingDraft) {
        // The new post replaces the draft it came from
        await api(`/api/v3/posts/${editingDraft.id}`, { method: 'DELETE' }).catch(() => null);
      }
      const results = (j.posts || []).map((p: any) => ({ platform: p.platform, status: p.status, reason: p.result?.reason, permalink: p.result?.permalink }));
      setSubmitResults(results);
      const failed = results.filter((r: any) => r.status === 'failed');
      const retrying = results.filter((r: any) => r.status === 'retrying');
      if (failed.length || retrying.length) {
        setComposerError(
          [
            ...failed.map((f: any) => `${platformMeta(f.platform).name}: ${f.reason}`),
            ...retrying.map((f: any) => `${platformMeta(f.platform).name} did not go out yet: ${f.reason} It is saved on the calendar and ZieAds tries again in a few minutes.`),
          ].join(' ')
        );
      } else {
        setComposerSuccess(true);
        if (!results.some((r: any) => r.status === 'needs_action')) setTimeout(() => navigate('/calendar'), 1800);
      }
    } catch (err: any) {
      setComposerError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedConns = selectedAccounts
    .map(id => connections.find(c => c.id === id))
    .filter(Boolean) as any[];
  const previewConn = activeTab !== 'universal'
    ? connections.find(c => c.id === activeTab)
    : selectedConns[0];
  const previewMeta = platformMeta(previewConn?.platform);
  const previewText = getActiveText();
  const previewPlatform = previewConn?.platform && formatsFor(previewConn.platform).length
    ? previewConn.platform
    : 'instagram';
  const previewFormats = formatsFor(previewPlatform);
  const previewHasVideo = mediaAttachments.some(m => isVideoMime(m.mime_type, m.file_url));
  const previewFormat =
    previewFormats.find(fm => fm.id === formatChoice[previewPlatform]) ||
    defaultFormatFor(previewPlatform, previewHasVideo);
  const hasInstagram = selectedAccounts.some(id => connections.find(c => c.id === id)?.platform === 'instagram');
  const ringR = 9;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - Math.min(100, percentage) / 100);
  const ctaLabel = demo.isActive
    ? 'Demo mode: cannot publish'
    : { now: 'Publish now', queue: 'Add to queue', schedule: 'Schedule post', review: 'Send for review', draft: 'Save draft' }[scheduleType];

  const scheduleOptions: { id: 'now' | 'queue' | 'schedule' | 'review' | 'draft'; label: string; icon: ReactNode }[] = [
    { id: 'now', label: 'Publish now', icon: <ZIcon name="publish" /> },
    { id: 'queue', label: 'Add to queue (Autopilot)', icon: <Layers /> },
    { id: 'schedule', label: 'Schedule a custom time', icon: <CalendarIcon /> },
    { id: 'review', label: 'Send for review (approval)', icon: <Eye /> },
    { id: 'draft', label: 'Save as draft', icon: <PenLine /> },
  ];

  return (
    <V3Layout>
      <PageHeader
        number="03"
        label="Composer"
        title="Composer"
        subtitle="Write once, tailor per network, publish or schedule"
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => setBulkOpen(true)}>
              Bulk upload
            </Button>
            <GhostButton onClick={() => navigate('/calendar')}>Open calendar</GhostButton>
          </>
        }
      />

      {bulkOpen && (
        <BulkUploadModal
          onClose={() => setBulkOpen(false)}
          onDone={(n) => {
            setBulkOpen(false);
            navigate('/calendar', { state: { notice: `${n} drafts added. Review and approve them on the calendar.` } });
          }}
        />
      )}
      <PageBody>
        {editingDraft && (
          <div className="zco-draft-banner" role="status">
            <span className="zco-draft-ico">
              <ZIcon name="ai-draft" size={15} />
            </span>
            <div className="zco-draft-text">
              <strong>Reviewing a draft from your AI Agent</strong>
              <span>{draftNote || 'Edit the copy, add media, then schedule or publish. Nothing goes live until you do.'}</span>
            </div>
            <div className="zco-draft-actions">
              <GhostButton onClick={saveDraftEdits} disabled={!!draftBusy}>
                {draftBusy === 'save' ? 'Saving...' : 'Save draft'}
              </GhostButton>
              <button type="button" className="zco-draft-delete" onClick={deleteDraft} disabled={!!draftBusy}>
                <Trash2 size={14} /> {draftBusy === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
        {composerSuccess && (
          <div className="zco-toast tone-good" role="status">
            <CheckCircle size={16} />
            <div style={{ flex: 1 }}>
              {submitResults && submitResults.some((r) => r.status === 'needs_action')
                ? submitResults.filter((r) => r.status === 'needs_action').map((r) => `${platformMeta(r.platform).name}: ${r.reason}`).join(' ')
                : scheduleType === 'now'
                  ? 'Published. Opening your calendar.'
                  : scheduleType === 'draft'
                    ? 'Draft saved to your calendar.'
                    : scheduleType === 'review'
                      ? 'Sent for review. Approve it on the calendar when it is ready.'
                      : 'Scheduled. Opening your calendar.'}
              {!submitResults?.some((r) => r.status === 'needs_action') && <div className="zco-toast-bar" />}
            </div>
          </div>
        )}

        {composerError && (
          <div key={composerError} className="zco-toast tone-bad" role="alert">
            <AlertCircle size={16} />
            <span>{composerError}</span>
          </div>
        )}

        <div className={`zco-layout ${isMobile ? 'is-mobile' : ''}`}>
          {/* ── Editor column ── */}
          <div className="zco-col">
            {/* Platform account selectors */}
            <Card glass>
              <CardTitle
                icon={<Send />}
                sub="Pick the connected accounts this post goes to"
                action={selectedAccounts.length > 0 ? <Pill tone="accent">{selectedAccounts.length} selected</Pill> : undefined}
              >
                Publish to
              </CardTitle>
              {loading ? (
                <div className="zco-platforms">
                  {[0, 1, 2].map(i => (
                    <Skeleton key={i} height={36} width={150} radius={999} />
                  ))}
                </div>
              ) : connections.length === 0 ? (
                <div className="zco-toast tone-warn">
                  <AlertCircle size={16} />
                  <span>
                    No accounts connected. Go to{' '}
                    <span className="zco-link" onClick={() => navigate('/connections')}>Connections</span> first.
                  </span>
                </div>
              ) : (
                <div className="zco-platforms">
                  {connections.map((c, idx) => {
                    const isSelected = selectedAccounts.includes(c.id);
                    const meta = platformMeta(c.platform);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => handleAccountToggle(c.id)}
                        aria-pressed={isSelected}
                        className={`zd-chip is-accent zco-pchip ${isSelected ? 'is-active' : ''}`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <span className="zco-picon" style={{ background: meta.color }}>{meta.icon}</span>
                        <span className="zco-handle">{c.account_handle}</span>
                        <span className="zco-check"><Check size={14} /></span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Glass composer */}
            <div className={`zco-composer ${submitting ? 'is-loading' : ''}`}>
              <div className="zco-top">
                {selectedAccounts.length > 0 ? (
                  <div className="zco-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'universal'}
                      onClick={() => setActiveTab('universal')}
                      className={`zd-chip ${activeTab === 'universal' ? 'is-active' : ''}`}
                    >
                      Default
                    </button>
                    {selectedAccounts.map(id => {
                      const conn = connections.find(c => c.id === id);
                      const hasOverride = customOverrides[id] !== undefined;
                      return (
                        <button
                          type="button"
                          role="tab"
                          key={id}
                          aria-selected={activeTab === id}
                          onClick={() => setActiveTab(id)}
                          className={`zd-chip ${activeTab === id ? 'is-active' : ''}`}
                        >
                          {conn?.platform.toUpperCase()}
                          {hasOverride && <span className="zco-dot" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <PenLine size={13} color="var(--zd-accent)" /> Default caption
                  </span>
                )}
              </div>

              {isInheriting && (
                <div className="zco-banner is-inherit">
                  <span><ZIcon name="inherit" size={13} /> Inheriting from Default. Start typing to customize for this platform.</span>
                </div>
              )}
              {activeTab !== 'universal' && !isInheriting && (
                <div className="zco-banner is-custom">
                  <span><PenLine size={13} /> Custom override active for this platform.</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...customOverrides };
                      delete updated[activeTab];
                      setCustomOverrides(updated);
                    }}
                  >
                    Reset to Default
                  </button>
                </div>
              )}

              <textarea
                className="zco-textarea"
                value={getActiveText()}
                onChange={e => handleTextChange(e.target.value)}
                placeholder="What would you like to share today?"
              />

              {mediaAttachments.length > 0 && (
                <div className="zco-attach">
                  {mediaAttachments.map((item, idx) => (
                    <div key={item.id} className="zco-thumb" style={{ animationDelay: `${idx * 40}ms` }}>
                      <img src={item.file_url} alt={item.file_name || ''} />
                      <button
                        type="button"
                        aria-label="Remove attachment"
                        onClick={() => setMediaAttachments(prev => prev.filter(x => x.id !== item.id))}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="zco-bottom">
                <div className="zco-chips">
                  <button type="button" className="zd-chip" onClick={() => setShowMediaModal(true)}>
                    <ImageIcon /> Add media
                  </button>
                  {mediaAttachments.length > 0 && (
                    <Pill tone="accent">{mediaAttachments.length} attached</Pill>
                  )}
                </div>
                <span className={`zco-counter tone-${counterTone}`}>
                  <svg className="zco-ring" viewBox="0 0 22 22" key={counterTone}>
                    <circle className="zco-ring-bg" cx="11" cy="11" r={ringR} />
                    <circle
                      className="zco-ring-fg"
                      cx="11"
                      cy="11"
                      r={ringR}
                      strokeDasharray={ringC}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <span className="zd-num">{currentLength} / {currentLimit}</span>
                </span>
              </div>
            </div>

            {/* First comment: Instagram, Facebook and LinkedIn support it */}
            {selectedAccounts.some((id) => ['instagram', 'facebook', 'linkedin'].includes(connections.find((c) => c.id === id)?.platform)) && (
              <Card className="zd-fade-up">
                <CardTitle icon={<MessageCircle />} sub="Posted as the first comment on Instagram, Facebook and LinkedIn. Good for hashtags or a link.">
                  First comment
                </CardTitle>
                <textarea
                  className="zd-textarea zco-first"
                  value={firstComment}
                  onChange={e => setFirstComment(e.target.value)}
                  placeholder="e.g. #marketing #strategy #saas"
                />
              </Card>
            )}
            {/* Checks before posting (spec 7.4) */}
            {selectedAccounts.length > 0 && (
              <Card className="zco-checks">
                <CardTitle icon={<CheckCircle />} sub="Every selected account is checked against its platform rules.">
                  Checks
                </CardTitle>
                {Object.keys(issuesByAccount).length === 0 ? (
                  <p className="zco-check-ok">All good for {selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''}.</p>
                ) : (
                  <ul className="zco-issues">
                    {Object.entries(issuesByAccount).flatMap(([id, list]) =>
                      list.map((i) => (
                        <li key={id + i.code} className={`is-${i.level}`}>
                          <span className="zco-issue-dot" aria-hidden="true" />
                          <strong>{platformMeta(connections.find((c) => c.id === id)?.platform).name}</strong> {i.message}
                          <span className="zco-issue-level">{i.level === 'error' ? 'Must fix' : 'Note'}</span>
                        </li>
                      )),
                    )}
                  </ul>
                )}
              </Card>
            )}

            {hasYouTube && (
              <Card className="zco-tiktok">
                <CardTitle icon={<SocialIcon platform="youtube" size={16} />} sub="The description is your caption">
                  YouTube settings
                </CardTitle>
                <label className="zd-label" htmlFor="zco-yt-title">Title</label>
                <input id="zco-yt-title" className="zd-input zco-field" maxLength={100} placeholder="Empty uses the first line of the caption" value={ytOpts.title} onChange={(e) => setYtOpts({ ...ytOpts, title: e.target.value })} />
                <label className="zd-label" htmlFor="zco-yt-privacy">Visibility</label>
                <select id="zco-yt-privacy" className="zd-select zco-field" value={ytOpts.privacy} onChange={(e) => setYtOpts({ ...ytOpts, privacy: e.target.value })}>
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
                <label className="zd-label" htmlFor="zco-yt-kids">Audience</label>
                <select id="zco-yt-kids" className="zd-select zco-field" value={ytOpts.madeForKids} onChange={(e) => setYtOpts({ ...ytOpts, madeForKids: e.target.value as '' | 'yes' | 'no' })}>
                  <option value="">Choose one (YouTube requires it)</option>
                  <option value="no">No, it is not made for kids</option>
                  <option value="yes">Yes, it is made for kids</option>
                </select>
                <label className="zd-label" htmlFor="zco-yt-cat">Category</label>
                <select id="zco-yt-cat" className="zd-select zco-field" value={ytOpts.category} onChange={(e) => setYtOpts({ ...ytOpts, category: e.target.value })}>
                  {YT_CATEGORIES.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <label className="zd-label" htmlFor="zco-yt-tags">Tags</label>
                <input id="zco-yt-tags" className="zd-input zco-field" placeholder="skincare, serum, review" value={ytOpts.tags} onChange={(e) => setYtOpts({ ...ytOpts, tags: e.target.value })} />
                <span className="zd-label">Thumbnail</span>
                <div className="zco-yt-thumb">
                  {ytOpts.thumbnail ? (
                    <>
                      <img src={ytOpts.thumbnail.url} alt="Video thumbnail" />
                      <Button size="sm" variant="ghost" onClick={() => setYtOpts({ ...ytOpts, thumbnail: null })}>
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        id="zco-yt-thumb-file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          e.target.value = '';
                          if (!f) return;
                          setThumbBusy(true);
                          try {
                            const m = await uploadMedia(f, { skipLibrary: true });
                            setYtOpts((o) => ({ ...o, thumbnail: { url: m.url, name: f.name } }));
                          } catch (err: any) {
                            alert('Thumbnail upload failed: ' + (err.message || 'Unknown error'));
                          } finally {
                            setThumbBusy(false);
                          }
                        }}
                      />
                      <Button size="sm" variant="secondary" loading={thumbBusy} onClick={() => document.getElementById('zco-yt-thumb-file')?.click()}>
                        Choose image
                      </Button>
                    </>
                  )}
                </div>
                <p className="zco-tt-note">
                  Optional. 1280 x 720 works best; ZieAds crops and compresses it for YouTube. Custom thumbnails need a verified channel (youtube.com/verify). Without one, YouTube picks a frame once the video finishes processing.
                </p>
              </Card>
            )}

            {hasPinterest && (
              <Card className="zco-tiktok">
                <CardTitle icon={<SocialIcon platform="pinterest" size={16} />} sub="The title is the first line of the caption">
                  Pinterest settings
                </CardTitle>
                <label className="zd-label" htmlFor="zco-pin-board">Board</label>
                <select id="zco-pin-board" className="zd-select zco-field" value={pinOpts.board_id} onChange={(e) => setPinOpts({ ...pinOpts, board_id: e.target.value })}>
                  {pinBoards.length === 0 && <option value="">No boards found</option>}
                  {pinBoards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <label className="zd-label" htmlFor="zco-pin-link">Link</label>
                <input id="zco-pin-link" className="zd-input zco-field" type="url" placeholder="https://yourstore.com/product" value={pinOpts.link} onChange={(e) => setPinOpts({ ...pinOpts, link: e.target.value })} />
              </Card>
            )}

            {/* TikTok posting screen, built to TikTok's Direct Post audit rules */}
            {hasTikTok && (
              <Card className="zco-tiktok">
                <CardTitle icon={<SocialIcon platform="tiktok" size={16} />} sub={tiktokCreator?.nickname ? `Posting as ${tiktokCreator.nickname}` : 'Posting to your TikTok account'}>
                  TikTok settings
                </CardTitle>
                <label className="zd-label" htmlFor="zco-tt-privacy">Who can view this video</label>
                <select id="zco-tt-privacy" className="zd-select zco-field" value={tiktokOpts.privacy} onChange={(e) => setTiktokOpts({ ...tiktokOpts, privacy: e.target.value })}>
                  <option value="" disabled>Choose a privacy level</option>
                  {(tiktokCreator?.privacy_options?.length ? tiktokCreator.privacy_options : ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY']).map((p) => (
                    <option key={p} value={p}>
                      {{ PUBLIC_TO_EVERYONE: 'Everyone', MUTUAL_FOLLOW_FRIENDS: 'Friends', FOLLOWER_OF_CREATOR: 'Followers', SELF_ONLY: 'Only me' }[p] || p}
                    </option>
                  ))}
                </select>
                <div className="zco-tt-toggles">
                  {(['comment', 'duet', 'stitch'] as const).map((k) => {
                    const disabled = !!(tiktokCreator as any)?.[`${k}_disabled`];
                    return (
                      <label key={k} className={`zco-tt-toggle ${disabled ? 'is-disabled' : ''}`}>
                        <input type="checkbox" checked={!disabled && tiktokOpts[k]} disabled={disabled} onChange={(e) => setTiktokOpts({ ...tiktokOpts, [k]: e.target.checked })} />
                        Allow {k === 'comment' ? 'comments' : k === 'duet' ? 'Duet' : 'Stitch'}
                        {disabled && <small> (off in your TikTok settings)</small>}
                      </label>
                    );
                  })}
                </div>
                <label className="zco-tt-toggle">
                  <input type="checkbox" checked={tiktokOpts.commercial} onChange={(e) => setTiktokOpts({ ...tiktokOpts, commercial: e.target.checked, yourBrand: false, branded: false })} />
                  This video promotes a brand, product or service
                </label>
                {tiktokOpts.commercial && (
                  <div className="zco-tt-sub">
                    <label className="zco-tt-toggle">
                      <input type="checkbox" checked={tiktokOpts.yourBrand} onChange={(e) => setTiktokOpts({ ...tiktokOpts, yourBrand: e.target.checked })} />
                      Your brand: you are promoting yourself or your own business. Labelled Promotional content.
                    </label>
                    <label className="zco-tt-toggle">
                      <input type="checkbox" checked={tiktokOpts.branded} onChange={(e) => setTiktokOpts({ ...tiktokOpts, branded: e.target.checked, privacy: e.target.checked && tiktokOpts.privacy === 'SELF_ONLY' ? '' : tiktokOpts.privacy })} />
                      Branded content: you are paid or rewarded by a third party. Labelled Paid partnership.
                    </label>
                  </div>
                )}
                <label className="zco-tt-toggle">
                  <input type="checkbox" checked={tiktokOpts.musicConsent} onChange={(e) => setTiktokOpts({ ...tiktokOpts, musicConsent: e.target.checked })} />
                  <span>
                    By posting, you agree to TikTok's{' '}
                    <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener noreferrer">
                      Music Usage Confirmation
                    </a>
                    {tiktokOpts.branded && (
                      <>
                        {' '}and{' '}
                        <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noopener noreferrer">
                          Branded Content Policy
                        </a>
                      </>
                    )}
                    .
                  </span>
                </label>
                {tiktokCreator?.max_video_post_duration_sec && <p className="zco-tt-note">Your account can post videos up to {tiktokCreator.max_video_post_duration_sec} seconds.</p>}
                <p className="zco-tt-note">Until TikTok approves direct posting, ZieAds sends the video to your TikTok inbox and you finish the post in the TikTok app.</p>
              </Card>
            )}
          </div>

          {/* ── Side column ── */}
          <div className="zco-col zco-side">
            {/* Live preview */}
            <Card className="zco-preview">
              <CardTitle
                icon={<Eye />}
                sub="Updates as you type"
                action={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--zd-ink-3)' }}><span className="zd-live" /> Live</span>}
              >
                Preview
              </CardTitle>
              {previewFormats.length > 1 && (
                <div className="zco-fmt-switch" role="tablist" aria-label="Preview format">
                  {previewFormats.map(fm => (
                    <button
                      type="button"
                      role="tab"
                      key={fm.id}
                      aria-selected={fm.id === previewFormat.id}
                      className={fm.id === previewFormat.id ? 'is-active' : ''}
                      onClick={() => setFormatChoice(prev => ({ ...prev, [previewPlatform]: fm.id }))}
                    >
                      <span
                        className="zco-fmt-shape"
                        style={{ aspectRatio: `${fm.width} / ${fm.height}` }}
                        aria-hidden="true"
                      />
                      {fm.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="zco-fmt-caption">
                Previewing: <strong>{formatCaption(previewFormat)}</strong>
                {!previewConn && <span> (no account selected yet)</span>}
                {selectedConns.length > 1 && activeTab === 'universal' && (
                  <span> · +{selectedConns.length - 1} more, open a platform tab to preview it</span>
                )}
              </div>
              <div className="zco-fmt-stage" key={`${previewPlatform}-${previewFormat.id}`}>
                <PlatformPreview
                  fmt={previewFormat}
                  platform={previewPlatform}
                  handle={previewConn?.account_handle || 'youraccount'}
                  meta={previewConn ? previewMeta : platformMeta('instagram')}
                  text={previewText}
                  media={mediaAttachments}
                  firstComment={previewPlatform === 'instagram' && previewFormat.layout === 'ig-feed' && hasInstagram ? firstComment : ''}
                />
              </div>
              {previewPlatform === 'instagram' && previewFormat.layout !== 'ig-feed' && hasInstagram && firstComment && (
                <div className="zco-pv-comment">
                  <strong>First comment</strong>
                  {renderWithTags(firstComment)}
                </div>
              )}
            </Card>

            {/* Scheduling */}
            <Card>
              <CardTitle icon={<Clock />} sub="When should this go out?">
                Schedule
              </CardTitle>
              <div className="zco-options" role="radiogroup">
                {scheduleOptions.map(opt => (
                  <label key={opt.id} className={`zco-option ${scheduleType === opt.id ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="scheduleType"
                      value={opt.id}
                      checked={scheduleType === opt.id}
                      onChange={() => setScheduleType(opt.id)}
                    />
                    <span className="zco-option-icon">{opt.icon}</span>
                    {opt.label}
                    <span className="zco-radio" />
                  </label>
                ))}
                {scheduleType === 'schedule' && (
                  <div className="zco-when zd-slide-in">
                    <input
                      type="date"
                      className="zd-input"
                      aria-label="Date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                    />
                    <input
                      type="time"
                      className="zd-input"
                      aria-label="Time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginTop: 18 }}>
                <label className="zd-label" htmlFor="zco-pipeline">Publishing pipeline</label>
                <select
                  id="zco-pipeline"
                  className="zd-select zco-field"
                  value={publishMethod}
                  onChange={e => setPublishMethod(e.target.value as any)}
                >
                  <option value="direct_api">Publish automatically (official API)</option>
                  <option value="manual_reminder">Send me a reminder in ZieAds to post it</option>
                </select>
              </div>
            </Card>

            {/* Primary action */}
            <div className="zco-cta">
              {submitting ? (
                <DarkButton loading>Scheduling</DarkButton>
              ) : (
                <Button size="lg" icon={<Send />}
                  onClick={() => handleSubmit()}
                  disabled={submitting}>{ctaLabel}</Button>
              )}
              {submitting ? (
                <LoadingState text="Sending to your channels" inline />
              ) : (
                <span className="zco-cta-note">
                  <span className={`zd-live ${selectedAccounts.length ? '' : 'is-off'}`} />
                  {selectedAccounts.length
                    ? `${selectedAccounts.length} account${selectedAccounts.length > 1 ? 's' : ''} ready`
                    : 'Select an account to publish'}
                </span>
              )}
            </div>
          </div>
        </div>
      </PageBody>

      {/* Media library picker modal */}
      {showMediaModal && (
        <div className="zco-overlay" onClick={e => { if (e.target === e.currentTarget) setShowMediaModal(false); }}>
          <div className="zco-modal" role="dialog" aria-modal="true" aria-label="Choose from media library">
            <div className="zco-modal-head">
              <div>
                <h3>Media library</h3>
                <p>Tap to attach or detach. {mediaAttachments.length} selected.</p>
              </div>
              <button type="button" className="zd-icon-btn" aria-label="Close" onClick={() => setShowMediaModal(false)}>
                <X />
              </button>
            </div>

            <div className="zco-lib">
              {mediaLibrary.length === 0 ? (
                <div className="zco-lib-empty">
                  <ImageIcon size={20} />
                  Your library is empty. Upload a file to attach it.
                </div>
              ) : (
                mediaLibrary.map((item, idx) => {
                  const isSelected = mediaAttachments.some(x => x.id === item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleSelectFromLibrary(item)}
                      aria-pressed={isSelected}
                      className={`zco-lib-item ${isSelected ? 'is-selected' : ''}`}
                      style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                    >
                      <img src={item.file_url} alt={item.file_name || ''} />
                      {isSelected && (
                        <span className="zco-lib-check"><Check size={13} /></span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="zco-modal-foot">
              <input
                type="file"
                id="modalFileUpload"
                onChange={handleMediaUpload}
                style={{ display: 'none' }}
              />
              <GhostButton
                onClick={() => document.getElementById('modalFileUpload')?.click()}
                disabled={uploadingMedia}
              >
                {uploadingMedia ? (
                  <LoadingState text="Uploading" inline />
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={14} /> Upload new
                  </span>
                )}
              </GhostButton>
              <DarkButton onClick={() => setShowMediaModal(false)}>Done</DarkButton>
            </div>
          </div>
        </div>
      )}
    </V3Layout>
  );
}
