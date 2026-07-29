import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleCommentsInbox, sampleConnections } from '../../data/sample-data';
import SocialIcon from '../../components/v3/SocialIcon';
import { 
  Inbox, 
  MessageSquare, 
  Send, 
  Archive, 
  Check, 
  AlertCircle,
  Smile,
  Instagram,
  Linkedin,
  Clock,
  ArrowLeft
} from 'lucide-react';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const B = 'var(--border)';
const D = 'var(--text)';

export default function InboxPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [comments, setComments] = useState<any[]>([]);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [archivedFilter, setArchivedFilter] = useState<boolean>(false);

  // Reply Form State
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Metadata for context-aware empty states
  const [connections, setConnections] = useState<any[]>([]);
  const [totalCommentsCount, setTotalCommentsCount] = useState<number>(0);

  // Sync / Refresh States
  const [summary, setSummary] = useState<any>({
    total_unread: 0,
    total_positive: 0,
    total_negative: 0,
    total_neutral: 0
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const loadMetadata = async () => {
    if (demo.isActive) {
      setConnections(sampleConnections);
      setTotalCommentsCount(sampleCommentsInbox.length);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const connRes = await fetch('/api/auth/connections', { headers });
      const connJ = await connRes.json();
      if (Array.isArray(connJ)) {
        const active = connJ.filter((c: any) => c.connected);
        setConnections(active);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    
    if (demo.isActive) {
      let filtered = [...sampleCommentsInbox];
      if (sentimentFilter) {
        filtered = filtered.filter(c => c.sentiment === sentimentFilter);
      }
      filtered = filtered.filter(c => c.is_archived === archivedFilter);
      setComments(filtered);
      if (filtered.length > 0) {
        const stillMatches = filtered.find(c => c.id === selectedComment?.id);
        setSelectedComment(stillMatches || filtered[0]);
      } else {
        setSelectedComment(null);
      }
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const statusVal = archivedFilter ? 'archived' : 'unread,read,replied';
      let url = `/api/v3/inbox/comments?status=${statusVal}`;
      if (sentimentFilter) {
        url += `&sentiment=${sentimentFilter}`;
      }
      const res = await fetch(url, { headers });
      const j = await res.json();
      if (j.success) {
        setComments(j.data);
        setSummary(j.summary || {
          total_unread: 0,
          total_positive: 0,
          total_negative: 0,
          total_neutral: 0
        });
        setLastSyncedAt(j.last_synced_at);
        setTotalCommentsCount(j.data.length);

        if (j.data.length > 0) {
          const stillMatches = j.data.find((c: any) => c.id === selectedComment?.id);
          setSelectedComment(stillMatches || j.data[0]);
        } else {
          setSelectedComment(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing || cooldownSeconds > 0) return;
    setRefreshing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/inbox/refresh', { method: 'POST', headers });
      const j = await res.json();
      if (res.status === 429) {
        setCooldownSeconds(j.retry_after_seconds || 60);
      } else if (j.success) {
        await fetchComments();
        setCooldownSeconds(60);
      } else {
        alert(j.error || "Failed to refresh inbox.");
      }
    } catch (err: any) {
      console.error("Failed to refresh:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, [demo.isActive]);

  useEffect(() => {
    fetchComments();
  }, [sentimentFilter, archivedFilter, demo.isActive]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedComment) return;

    const originalComment = { ...selectedComment };
    const originalCommentsList = [...comments];
    const textToSend = replyText.trim();

    setReplyText('');
    setSubmittingReply(true);

    if (demo.isActive) {
      const updated = comments.map(c => 
        c.id === selectedComment.id 
          ? { ...c, status: 'replied', replied_at: new Date().toISOString(), reply_text: textToSend } 
          : c
      );
      setComments(updated);
      setSelectedComment({ ...selectedComment, status: 'replied', replied_at: new Date().toISOString(), reply_text: textToSend });
      setSubmittingReply(false);
      return;
    }

    // Optimistic UI Update: immediately show reply as sending
    const optimisticComment = {
      ...selectedComment,
      status: 'replied',
      replied_at: new Date().toISOString(),
      reply_text: textToSend,
      isOptimistic: true
    };

    setComments(prev =>
      prev.map(c => c.id === selectedComment.id ? optimisticComment : c)
    );
    setSelectedComment(optimisticComment);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/inbox/comments/${selectedComment.id}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ replyText: textToSend })
      });
      const j = await res.json();
      if (j.success) {
        const realComment = {
          ...selectedComment,
          status: 'replied',
          replied_at: j.replied_at || new Date().toISOString(),
          reply_text: textToSend,
          reply_platform_id: j.reply_id
        };
        setComments(prev =>
          prev.map(c => c.id === selectedComment.id ? realComment : c)
        );
        setSelectedComment(realComment);
      } else {
        throw new Error(j.error || "Failed to reply");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit comment reply.");
      // Rollback on failure
      setComments(originalCommentsList);
      setSelectedComment(originalComment);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      if (demo.isActive) {
        const updatedComments = comments.filter(c => c.id !== id);
        setComments(updatedComments);
        setSelectedComment(null);
        if (isMobile) setMobileView('list');
        return;
      }

      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/inbox/comments/${id}/archive`, {
        method: 'POST',
        headers
      });
      const j = await res.json();
      if (j.success) {
        setComments(prev => prev.filter(c => c.id !== id));
        setSelectedComment(null);
        if (isMobile) setMobileView('list');
      }
    } catch (err) {
      console.error("Failed to archive comment:", err);
    }
  };

  const getSentimentStyle = (sentiment: string) => {
    const s = sentiment?.toLowerCase();
    if (s === 'positive') return { background: '#D1FAE5', color: '#065F46' };
    if (s === 'negative') return { background: '#FEE2E2', color: '#991B1B' };
    return { background: 'var(--bg-soft)', color: 'var(--text-secondary)' };
  };

  const getPlatformIcon = (platform: string) => {
    return <SocialIcon platform={platform} size={14} />;
  };

  const formatLastSynced = (timestamp: string | null) => {
    if (!timestamp) return "Never synced";
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Synced just now";
    if (diffMins === 1) return "Synced 1 minute ago";
    if (diffMins < 60) return `Synced ${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "Synced 1 hour ago";
    return `Synced ${diffHours} hours ago`;
  };

  const renderEmptyState = () => {
    const isNoConnections = connections.length === 0;
    const isNoCommentsYet = connections.length > 0 && comments.length === 0;

    if (isNoConnections) {
      return (
        <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: 'auto', maxWidth: 360 }}>
          <AlertCircle size={32} style={{ color: P }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>No accounts connected yet</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: G, lineHeight: 1.5 }}>
            Connect an Instagram account to start receiving comments.
          </p>
          <button 
            onClick={() => navigate('/connections')}
            style={{ background: P, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Connect Accounts
          </button>
        </div>
      );
    }

    if (isNoCommentsYet) {
      if (!lastSyncedAt) {
        return (
          <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: 'auto', maxWidth: 360 }}>
            <Clock size={32} style={{ color: P, animation: 'pulse 1.5s infinite' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Syncing your comments...</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: G, lineHeight: 1.5 }}>
              We are fetching your Instagram activity. Check back in a few minutes or click the refresh button.
            </p>
          </div>
        );
      } else {
        return (
          <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: 'auto', maxWidth: 360 }}>
            <MessageSquare size={32} style={{ color: G }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>No comments yet</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: G, lineHeight: 1.5 }}>
              When people comment on your posts, they will appear here within 15 minutes.
            </p>
          </div>
        );
      }
    }

    return (
      <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: 'auto', maxWidth: 360 }}>
        <Inbox size={32} style={{ color: G }} />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>No comments match this filter</h3>
        <p style={{ margin: 0, fontSize: '0.78rem', color: G, lineHeight: 1.5 }}>
          Try adjusting the sentiment filter or unchecking Show Archived.
        </p>
        <button 
          onClick={() => {
            setSentimentFilter('');
            setArchivedFilter(false);
          }}
          style={{ background: 'none', border: `1px solid ${B}`, color: 'var(--text)', padding: '8px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Reset Filters
        </button>
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20, width: '100%', boxSizing: 'border-box' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, border: `1px solid ${B}`, borderRadius: 8, background: '#fff', opacity: 0.6 }}>
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-soft)' }} />
              <div style={{ width: 80, height: 12, borderRadius: 4, background: 'var(--bg-soft)' }} />
            </div>
            <div style={{ width: 50, height: 12, borderRadius: 4, background: 'var(--bg-soft)' }} />
          </div>
          <div style={{ width: '100%', height: 14, borderRadius: 4, background: 'var(--bg-soft)' }} />
          <div style={{ width: '70%', height: 14, borderRadius: 4, background: 'var(--bg-soft)' }} />
        </div>
      ))}
    </div>
  );

  const isPersonalInstagramConnected = !demo.isActive && connections.some(c => c.platform === 'instagram' && c.account_type?.toLowerCase() === 'personal');

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Unified Inbox</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>Manage and reply to all social comments in one dashboard.</p>
        </div>
        {connections.length > 0 && !demo.isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastSyncedAt && (
              <span style={{ fontSize: '0.75rem', color: G }}>
                {formatLastSynced(lastSyncedAt)}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || cooldownSeconds > 0}
              style={{
                background: P,
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: (refreshing || cooldownSeconds > 0) ? 'not-allowed' : 'pointer',
                opacity: (refreshing || cooldownSeconds > 0) ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Clock size={12} />
              {refreshing ? 'Refreshing...' : cooldownSeconds > 0 ? `Refresh (${cooldownSeconds}s)` : 'Refresh Now'}
            </button>
          </div>
        )}
      </div>

      {isPersonalInstagramConnected && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 8, padding: '12px 20px', margin: '20px 40px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} style={{ color: '#E53E3E', flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', color: '#C53030', fontWeight: 500 }}>
            Instagram Personal account connected. Comments syncing and replies are only supported for <strong>Instagram Business or Creator</strong> accounts. Please switch your account type in the Instagram app and reconnect.
          </span>
        </div>
      )}

      {/* Grid Split Panel (Responsive) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        
        {/* Left Filters Sidebar (hidden on Mobile, replaced by select inputs) */}
        {!isMobile && (
          <div style={{ width: '240px', background: '#fff', borderRight: `1px solid ${B}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: '0.68rem', color: G, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 10 }}>Filter Sentiment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { k: '', l: 'All Sentiments', count: null },
                  { k: 'positive', l: 'Positive', count: summary.total_positive },
                  { k: 'neutral', l: 'Neutral', count: summary.total_neutral },
                  { k: 'negative', l: 'Negative', count: summary.total_negative }
                ].map(opt => (
                  <button
                    key={opt.k}
                    onClick={() => setSentimentFilter(opt.k)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      background: sentimentFilter === opt.k ? 'var(--primary-bg)' : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      fontWeight: sentimentFilter === opt.k ? 600 : 400,
                      color: sentimentFilter === opt.k ? 'var(--text)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{opt.l}</span>
                    {opt.count !== null && opt.count > 0 && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 10, background: opt.k === 'positive' ? '#D1FAE5' : opt.k === 'negative' ? '#FEE2E2' : 'var(--bg-soft)', color: opt.k === 'positive' ? '#065F46' : opt.k === 'negative' ? '#991B1B' : 'var(--text-secondary)' }}>
                        {opt.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${B}`, paddingTop: 16 }}>
              <h3 style={{ fontSize: '0.68rem', color: G, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 10 }}>Status</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={archivedFilter} 
                  onChange={e => setArchivedFilter(e.target.checked)} 
                  style={{ accentColor: P }}
                />
                Show Archived
              </label>
            </div>
          </div>
        )}

        {/* List of comments column */}
        {(!isMobile || mobileView === 'list') && (
          <div style={{ flex: 1, background: '#fff', borderRight: isMobile ? 'none' : `1px solid ${B}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Mobile Filter select row */}
            {isMobile && (
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${B}`, display: 'flex', gap: 10 }}>
                <select 
                  value={sentimentFilter} 
                  onChange={e => setSentimentFilter(e.target.value)}
                  style={{ flex: 1, padding: 8, border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.8rem' }}
                >
                  <option value="">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={archivedFilter} 
                    onChange={e => setArchivedFilter(e.target.checked)} 
                    style={{ accentColor: P }}
                  />
                  Archived
                </label>
              </div>
            )}

            {loading ? (
              <SkeletonLoader />
            ) : comments.length === 0 ? (
              renderEmptyState()
            ) : (
              comments.map(c => {
                const isSelected = selectedComment?.id === c.id;
                const sentStyle = getSentimentStyle(c.sentiment);
                const userHasReplied = c.status === 'replied';
                const textVal = c.text || c.comment_text;
                const commenter = c.author_username || c.commenter_handle;
                const postedDate = c.posted_at || c.commented_at;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => {
                      setSelectedComment(c);
                      if (isMobile) setMobileView('detail');
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '16px 20px', 
                      borderBottom: `1px solid ${B}`, 
                      background: isSelected && !isMobile ? 'var(--bg-soft)' : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'background 0.1s'
                    }}
                  >
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getPlatformIcon(c.platform)}
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{commenter}</span>
                      </div>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, ...sentStyle }}>
                        {c.sentiment || 'neutral'}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                      {textVal}
                    </p>

                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: G }}>
                      <span>{new Date(postedDate).toLocaleDateString()}</span>
                      {userHasReplied && <span style={{ color: '#10B981', fontWeight: 600 }}>Replied</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Active Comment Reply column */}
        {(!isMobile || mobileView === 'detail') && (
          <div style={{ flex: 1, background: 'var(--bg-soft)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {selectedComment ? (
              <div style={{ padding: isMobile ? '20px' : '32px', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
                
                {/* Mobile Back Header */}
                {isMobile && (
                  <button 
                    onClick={() => setMobileView('list')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 600, color: P }}
                  >
                    <ArrowLeft size={16} /> Back to Inbox
                  </button>
                )}

                {/* Comment Box */}
                <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>{selectedComment.author_username || selectedComment.commenter_handle}</span>
                      {getPlatformIcon(selectedComment.platform)}
                    </div>
                    <button 
                      onClick={() => handleArchive(selectedComment.id)}
                      style={{ border: 'none', background: 'none', color: G, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                    >
                      <Archive size={14} /> Archive
                    </button>
                  </div>

                  <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    "{selectedComment.text || selectedComment.comment_text}"
                  </p>

                  {selectedComment.social_posts?.content_text && (
                    <div style={{ fontSize: '0.72rem', color: G, borderTop: `1px solid ${B}`, paddingTop: 10 }}>
                      On Post: <span style={{ fontStyle: 'italic' }}>"{selectedComment.social_posts.content_text.slice(0, 50)}..."</span>
                    </div>
                  )}
                </div>

                {/* Thread replies */}
                {selectedComment.status === 'replied' ? (
                  <div style={{ background: '#E1F5FE', border: '1px solid #B3E5FC', borderRadius: 8, padding: 20, alignSelf: 'flex-end', width: '90%', opacity: selectedComment.isOptimistic ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#01579B' }}>
                        You (via ZieAds) {selectedComment.isOptimistic && <span style={{ fontWeight: 400, fontStyle: 'italic', color: G }}> (Sending...)</span>}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: G }}>{selectedComment.replied_at ? new Date(selectedComment.replied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#0288D1' }}>
                      {selectedComment.reply_text || selectedComment.comment_replies?.[0]?.reply_text || "Reply sent successfully."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20 }}>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>Reply to Comment</h4>
                    <textarea 
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your response..."
                      required
                      style={{ width: '100%', height: 80, border: `1px solid ${B}`, borderRadius: 6, padding: '10px 12px', fontSize: '0.82rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                    />
                    <button 
                      type="submit" 
                      disabled={submittingReply}
                      style={{ alignSelf: 'flex-end', background: P, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={12} /> {submittingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </form>
                )}

              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: G, fontSize: '0.82rem', margin: 'auto' }}>
                Select a comment from the list to reply.
              </div>
            )}
          </div>
        )}

      </div>
    </V3Layout>
  );
}
