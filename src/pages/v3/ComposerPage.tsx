import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextRollButton,
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
  Sparkles,
  PenLine,
  Zap,
} from 'lucide-react';
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

export default function ComposerPage() {
  const navigate = useNavigate();
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
  const hasInstagram = selectedAccounts.some(id => connections.find(c => c.id === id)?.platform === 'instagram');
  const ringR = 9;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - Math.min(100, percentage) / 100);
  const ctaLabel = demo.isActive
    ? 'Demo mode: cannot publish'
    : scheduleType === 'now' ? 'Publish now' : 'Queue post';

  const scheduleOptions: { id: 'now' | 'queue' | 'schedule'; label: string; icon: ReactNode }[] = [
    { id: 'now', label: 'Publish now', icon: <Zap /> },
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
                  <span><Sparkles size={13} /> Inheriting from Default. Start typing to customize for this platform.</span>
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
              <div className="zco-pv-head">
                <span className="zco-pv-avatar" style={{ background: previewConn ? previewMeta.color : 'var(--zd-ink)' }}>
                  {previewConn ? previewMeta.icon : <Send />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="zco-pv-name">{previewConn?.account_handle || 'Your account'}</div>
                  <div className="zco-pv-meta">
                    {previewConn ? previewMeta.name : 'No account selected'}
                    {selectedConns.length > 1 && activeTab === 'universal' && <span>+{selectedConns.length - 1} more</span>}
                  </div>
                </div>
              </div>
              {mediaAttachments.length > 0 && (
                <div className={`zco-pv-media n-${Math.min(4, mediaAttachments.length)}`}>
                  {mediaAttachments.slice(0, 4).map(item => (
                    <img key={item.id} src={item.file_url} alt={item.file_name || ''} />
                  ))}
                </div>
              )}
              <div className={`zco-pv-text ${previewText ? '' : 'is-empty'}`}>
                {previewText ? renderWithTags(previewText) : 'Your caption will appear here.'}
                <span className="zco-caret" aria-hidden="true" />
              </div>
              {hasInstagram && firstComment && (
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
                <TextRollButton
                  text={ctaLabel}
                  variant={demo.isActive ? 'dark' : 'orange'}
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                />
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
