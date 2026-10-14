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
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  Twitter,
  Music2,
  Globe,
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
const PLATFORM_META: Record<string, { icon: ReactNode; color: string; name: string }> = {
  instagram: { icon: <Instagram />, color: '#E1306C', name: 'Instagram' },
  tiktok: { icon: <Music2 />, color: '#111111', name: 'TikTok' },
  linkedin: { icon: <Linkedin />, color: '#0A66C2', name: 'LinkedIn' },
  x: { icon: <Twitter />, color: '#111111', name: 'X' },
  facebook: { icon: <Facebook />, color: '#1877F2', name: 'Facebook' },
  youtube: { icon: <Youtube />, color: '#FF0000', name: 'YouTube' },
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
  const [scheduleType, setScheduleType] = useState<'now' | 'schedule' | 'queue'>('now');
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
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch('/api/v3/media/upload?skipLibrary=true', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const j = await res.json();
      if (!res.ok) {
        throw new Error(j.error || "Upload failed");
      }

      if (j.success) {
        const newMedia = {
          id: j.data.id,
          file_url: j.data.url,
          file_name: j.data.file_name,
          mime_type: j.data.mime_type
        };
        setMediaAttachments(prev => [...prev, newMedia]);
      }
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (demo.isActive) {
      setComposerError("Demo mode: publishing is disabled.");
      return;
    }

    if (selectedAccounts.length === 0) {
      setComposerError("Please select at least one social media account to post to.");
      return;
    }

    const selectedConn = connections.find(c => selectedAccounts.includes(c.id));
    const hasSupportedPlatform = selectedConn?.platform === 'instagram' || selectedConn?.platform === 'tiktok';
    if (!hasSupportedPlatform) {
      setComposerError("ZieAds v0.3 currently supports publishing to connected Instagram and TikTok accounts only.");
      return;
    }

    if (!contentText.trim() && mediaAttachments.length === 0) {
      setComposerError("Please add some content or attach an image/video.");
      return;
    }

    setSubmitting(true);
    setComposerError(null);

    try {
      const media_ids = mediaAttachments.map(m => m.id);
      const hashtags = contentText.match(/#\w+/g)?.map(h => h.slice(1)) || [];
      const headers = await getAuthHeaders();
      let res;

      if (scheduleType === 'now') {
        res = await fetch('/api/v3/posts/publish-now', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            platform: selectedConn.platform,
            caption: contentText,
            media_ids,
            hashtags,
            media_attachments: mediaAttachments
          })
        });
      } else {
        if (!scheduleDate || !scheduleTime) {
          throw new Error("Please specify date and time for scheduling.");
        }
        const scheduled_for = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        
        res = await fetch('/api/v3/posts/schedule', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            platform: selectedConn.platform,
            caption: contentText,
            media_ids,
            hashtags,
            scheduled_for,
            media_attachments: mediaAttachments
          })
        });
      }

      const j = await res.json();
      if (!res.ok) {
        throw new Error(j.message || j.error || "Failed to submit post.");
      }

      if (j.success) {
        if (editingDraft) {
          // The scheduled or published post replaces the draft it came from
          await fetch(`/api/v3/posts/${editingDraft.id}`, { method: 'DELETE', headers }).catch(() => null);
        }
        setComposerSuccess(true);
        setTimeout(() => {
          navigate('/calendar');
        }, 1500);
      } else {
        throw new Error(j.error || "Failed to submit post.");
      }
    } catch (err: any) {
      setComposerError(err.message || "An unexpected error occurred.");
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
    : scheduleType === 'now' ? 'Publish now' : 'Queue post';

  const scheduleOptions: { id: 'now' | 'queue' | 'schedule'; label: string; icon: ReactNode }[] = [
    { id: 'now', label: 'Publish now', icon: <ZIcon name="publish" /> },
    { id: 'queue', label: 'Add to queue (Autopilot)', icon: <Layers /> },
    { id: 'schedule', label: 'Schedule a custom time', icon: <CalendarIcon /> },
  ];

  return (
    <V3Layout>
      <PageHeader
        number="03"
        label="Composer"
        title="Write once, post everywhere."
        subtitle="Draft a post, tailor it per platform, attach media and publish now or on your schedule."
        actions={<GhostButton onClick={() => navigate('/calendar')}>Open calendar</GhostButton>}
      />

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
              Post successfully scheduled. Redirecting to the content calendar.
              <div className="zco-toast-bar" />
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

            {/* First comment panel for IG */}
            {hasInstagram && (
              <Card className="zd-fade-up">
                <CardTitle icon={<MessageCircle />} sub="Ideal for campaign hashtags so the caption stays clean.">
                  Instagram first comment
                </CardTitle>
                <textarea
                  className="zd-textarea zco-first"
                  value={firstComment}
                  onChange={e => setFirstComment(e.target.value)}
                  placeholder="e.g. #marketing #strategy #saas"
                />
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
                  <option value="direct_api">Direct API auto-publish</option>
                  <option value="manual_reminder">Mobile push notification reminder</option>
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
