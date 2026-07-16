import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleConnections } from '../../data/sample-data';
import { 
  Send, 
  Calendar as CalendarIcon, 
  Clock, 
  Image as ImageIcon, 
  Layers, 
  Smile, 
  Trash2, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const B = 'var(--border)';
const D = 'var(--text)';

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
  let counterColor = G;
  if (percentage >= 100) {
    counterColor = '#EF4444';
  } else if (percentage >= 80) {
    counterColor = '#F59E0B';
  }

  const handleTextChange = (val: string) => {
    if (activeTab === 'universal') {
      setContentText(val);
    } else {
      setCustomOverrides(prev => ({ ...prev, [activeTab]: val }));
    }
  };

  const isInheriting = activeTab !== 'universal' && customOverrides[activeTab] === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isActive) {
      setComposerError("Demo Mode — Cannot Publish");
      return;
    }

    if (selectedAccounts.length === 0) {
      setComposerError("Please select at least one social media account to post to.");
      return;
    }

    const hasInstagram = selectedAccounts.some(id => connections.find(c => c.id === id)?.platform === 'instagram');
    if (!hasInstagram) {
      setComposerError("ZieAds v0.3 currently supports publishing to connected Instagram Business accounts only.");
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
            platform: 'instagram',
            caption: contentText,
            media_ids,
            hashtags
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
            platform: 'instagram',
            caption: contentText,
            media_ids,
            hashtags,
            scheduled_for
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

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Composer</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>Write once, customize, and queue your social media updates.</p>
        </div>
      </div>

      {/* Responsive Main Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflowY: 'auto' }}>
        
        {/* Editor Area */}
        <div style={{ flex: 1, padding: isMobile ? '20px' : '40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {composerSuccess && (
            <div style={{ background: '#D1FAE5', color: '#065F46', padding: 16, borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} /> Post successfully scheduled! Redirecting to Content Calendar...
            </div>
          )}

          {composerError && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 16, borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {composerError}
            </div>
          )}

          {/* Platform Account Selectors */}
          <div>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: G, marginBottom: 12 }}>Publish to</h3>
            {connections.length === 0 ? (
              <div style={{ padding: '12px 16px', background: '#FEF3C7', color: '#92400E', borderRadius: 8, fontSize: '0.8rem', display: 'flex', gap: 8 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /> No accounts connected. Please go to <span onClick={() => navigate('/connections')} style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Connections</span> first.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {connections.map(c => {
                  const isSelected = selectedAccounts.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => handleAccountToggle(c.id)}
                      style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8, 
                        padding: '8px 14px', 
                        borderRadius: 20, 
                        border: `1px solid ${isSelected ? P : B}`,
                        background: isSelected ? 'var(--primary-bg)' : '#fff',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? 'var(--text)' : 'var(--text-secondary)' }}>
                        {c.platform.toUpperCase()}: {c.account_handle}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Platform Customization Tabs */}
          {selectedAccounts.length > 0 && (
            <div style={{ display: 'flex', borderBottom: `1px solid ${B}`, gap: 16, overflowX: 'auto', paddingBottom: 2 }}>
              <button 
                onClick={() => setActiveTab('universal')} 
                style={{ padding: '8px 4px', border: 'none', background: 'none', borderBottom: activeTab === 'universal' ? `2px solid ${P}` : 'none', fontWeight: activeTab === 'universal' ? 700 : 400, color: activeTab === 'universal' ? D : G, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}
              >
                Default
              </button>
              {selectedAccounts.map(id => {
                const conn = connections.find(c => c.id === id);
                const hasOverride = customOverrides[id] !== undefined;
                return (
                  <button 
                    key={id}
                    onClick={() => setActiveTab(id)} 
                    style={{ padding: '8px 4px', border: 'none', background: 'none', borderBottom: activeTab === id ? `2px solid ${P}` : 'none', fontWeight: activeTab === id ? 700 : 400, color: activeTab === id ? D : G, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {conn?.platform.toUpperCase()}
                    {hasOverride && <span style={{ width: 6, height: 6, borderRadius: '50%', background: P }} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Editor Body */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {isInheriting && (
                <div style={{ padding: '8px 20px', background: '#EFF6FF', borderBottom: `1px solid ${B}`, display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600 }}>
                    ✨ Inheriting from Default. Start typing below to customize for this platform.
                  </span>
                </div>
              )}
              {activeTab !== 'universal' && !isInheriting && (
                <div style={{ padding: '8px 20px', background: '#FEF3C7', borderBottom: `1px solid ${B}`, display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>
                    ⚠️ Custom override active for this platform.
                  </span>
                  <button 
                    onClick={() => {
                      const updated = { ...customOverrides };
                      delete updated[activeTab];
                      setCustomOverrides(updated);
                    }}
                    style={{ border: 'none', background: 'none', color: '#B45309', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Reset to Default
                  </button>
                </div>
              )}
              <textarea 
                value={isInheriting ? contentText : (customOverrides[activeTab] || '')}
                onChange={e => handleTextChange(e.target.value)}
                placeholder="What would you like to share today?"
                style={{ minHeight: 180, border: 'none', outline: 'none', padding: 20, fontSize: '0.9rem', lineHeight: 1.5, resize: 'vertical', borderRadius: '8px 8px 0 0' }}
              />
            </div>

            {/* Editor Footer Tools */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${B}`, background: 'var(--bg-soft)', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 8px 8px' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => setShowMediaModal(true)} 
                  style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <ImageIcon size={14} /> Add Media
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: counterColor, fontWeight: 600 }}>
                {currentLength} / {currentLimit} characters
              </span>
            </div>
          </div>

          {/* Attached Media Previews */}
          {mediaAttachments.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: G, marginBottom: 8 }}>Media Attachments</h4>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {mediaAttachments.map(item => (
                  <div key={item.id} style={{ position: 'relative', width: 80, height: 80, border: `1px solid ${B}`, borderRadius: 6, overflow: 'hidden' }}>
                    <img src={item.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      onClick={() => setMediaAttachments(prev => prev.filter(x => x.id !== item.id))}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239, 68, 68, 0.9)', border: 'none', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* First Comment panel for IG */}
          {selectedAccounts.some(id => connections.find(c => c.id === id)?.platform === 'instagram') && (
            <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 700 }}>Instagram First Comment</h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: G }}>Ideal for placing campaign hashtags to keep the caption clean.</p>
              <textarea 
                value={firstComment}
                onChange={e => setFirstComment(e.target.value)}
                placeholder="e.g. #marketing #strategy #saas"
                style={{ width: '100%', height: 60, border: `1px solid ${B}`, borderRadius: 6, padding: '10px 12px', fontSize: '0.82rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

        {/* Sidebar Controls Area */}
        <div style={{ width: isMobile ? '100%' : '360px', background: '#fff', borderLeft: isMobile ? 'none' : `1px solid ${B}`, borderTop: isMobile ? `1px solid ${B}` : 'none', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Scheduling Configuration */}
          <div>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: G, marginBottom: 12 }}>Schedule settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="scheduleType" 
                  value="now" 
                  checked={scheduleType === 'now'} 
                  onChange={() => setScheduleType('now')}
                  style={{ accentColor: P }}
                />
                Publish Now
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="scheduleType" 
                  value="queue" 
                  checked={scheduleType === 'queue'} 
                  onChange={() => setScheduleType('queue')}
                  style={{ accentColor: P }}
                />
                Add to Queue (Autopilot)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="scheduleType" 
                  value="schedule" 
                  checked={scheduleType === 'schedule'} 
                  onChange={() => setScheduleType('schedule')}
                  style={{ accentColor: P }}
                />
                Schedule Custom Time
              </label>

              {scheduleType === 'schedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, paddingLeft: 20 }}>
                  <input 
                    type="date" 
                    value={scheduleDate} 
                    onChange={e => setScheduleDate(e.target.value)}
                    style={{ padding: '8px 10px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.8rem' }}
                  />
                  <input 
                    type="time" 
                    value={scheduleTime} 
                    onChange={e => setScheduleTime(e.target.value)}
                    style={{ padding: '8px 10px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.8rem' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Publishing Pipeline Method */}
          <div>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: G, marginBottom: 12 }}>Publishing Pipeline</h3>
            <select 
              value={publishMethod} 
              onChange={e => setPublishMethod(e.target.value as any)}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="direct_api">Direct API Auto-publish</option>
              <option value="manual_reminder">Mobile push notification reminder</option>
            </select>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', background: P, color: '#fff', border: 'none', padding: '12px 0', borderRadius: 6, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 'auto' }}
          >
            <Send size={14} /> {submitting ? 'Scheduling...' : demo.isActive ? 'Demo Mode — Cannot Publish' : scheduleType === 'now' ? 'Publish Now' : 'Queue Post'}
          </button>
        </div>

      </div>

      {/* Media Library Picker Modal */}
      {showMediaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 24, width: '90%', maxWidth: 500, maxHeight: 500, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Choose from Media Library</h3>
              <span onClick={() => setShowMediaModal(false)} style={{ cursor: 'pointer', color: G, fontSize: '0.9rem' }}>✕</span>
            </div>

            {/* Library Grid list */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, minHeight: 200 }}>
              {mediaLibrary.map(item => {
                const isSelected = mediaAttachments.some(x => x.id === item.id);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleSelectFromLibrary(item)}
                    style={{ 
                      position: 'relative', 
                      aspectRatio: '1/1', 
                      borderRadius: 6, 
                      overflow: 'hidden', 
                      border: `2px solid ${isSelected ? P : 'transparent'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <img src={item.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                );
              })}
            </div>

            {/* Upload New file directly */}
            <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${B}`, paddingTop: 16 }}>
              <input 
                type="file" 
                id="modalFileUpload" 
                onChange={handleMediaUpload}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => document.getElementById('modalFileUpload')?.click()}
                disabled={uploadingMedia}
                style={{ background: 'none', border: `1px solid ${B}`, padding: '8px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', flex: 1 }}
              >
                {uploadingMedia ? 'Uploading...' : 'Upload New'}
              </button>
              <button 
                onClick={() => setShowMediaModal(false)}
                style={{ background: P, color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </V3Layout>
  );
}
