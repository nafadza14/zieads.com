import { useState, useEffect } from 'react';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { 
  Inbox, 
  MessageSquare, 
  Send, 
  Archive, 
  Check, 
  AlertCircle,
  Smile,
  Instagram,
  Linkedin
} from 'lucide-react';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const B = 'var(--border)';
const D = 'var(--text)';

export default function InboxPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [archivedFilter, setArchivedFilter] = useState<boolean>(false);

  // Reply Form State
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      let url = `/api/v3/inbox/comments?isArchived=${archivedFilter}`;
      if (sentimentFilter) {
        url += `&sentiment=${sentimentFilter}`;
      }
      const res = await fetch(url, { headers });
      const j = await res.json();
      if (j.success) {
        setComments(j.data);
        if (j.data.length > 0 && !selectedComment) {
          setSelectedComment(j.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [sentimentFilter, archivedFilter]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedComment) return;

    setSubmittingReply(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/inbox/comments/${selectedComment.id}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ replyText: replyText.trim() })
      });
      const j = await res.json();
      if (j.success) {
        setReplyText('');
        // Update local comment state to show user has replied
        setComments(prev => 
          prev.map(c => c.id === selectedComment.id ? { ...c, user_has_replied: true, user_replied_at: new Date().toISOString() } : c)
        );
        setSelectedComment(prev => ({ ...prev, user_has_replied: true, user_replied_at: new Date().toISOString() }));
      }
    } catch (err) {
      alert("Failed to submit comment reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/inbox/comments/${id}/archive`, {
        method: 'POST',
        headers
      });
      const j = await res.json();
      if (j.success) {
        setComments(prev => prev.filter(c => c.id !== id));
        setSelectedComment(null);
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
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Instagram size={14} style={{ color: '#E1306C' }} />;
    if (p.includes('linkedin')) return <Linkedin size={14} style={{ color: '#0077B5' }} />;
    return <MessageSquare size={14} style={{ color: P }} />;
  };

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Unified Inbox</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>Manage and reply to all social comments in one dashboard.</p>
        </div>
      </div>

      {/* Grid Split Panel */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr 1fr', overflow: 'hidden' }}>
        
        {/* Left Filters Sidebar */}
        <div style={{ background: '#fff', borderRight: `1px solid ${B}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: '0.68rem', color: G, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 10 }}>Filter Sentiment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { k: '', l: 'All Sentiments' },
                { k: 'positive', l: 'Positive' },
                { k: 'neutral', l: 'Neutral' },
                { k: 'negative', l: 'Negative' }
              ].map(opt => (
                <button
                  key={opt.k}
                  onClick={() => setSentimentFilter(opt.k)}
                  style={{
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
                  {opt.l}
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

        {/* Center Comments Feed List */}
        <div style={{ background: '#fff', borderRight: `1px solid ${B}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: G, fontSize: '0.85rem' }}>Loading comment inbox...</div>
          ) : comments.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: G, fontSize: '0.85rem' }}>No comments matched this filter.</div>
          ) : (
            comments.map(c => {
              const isSelected = selectedComment?.id === c.id;
              const sentStyle = getSentimentStyle(c.sentiment);
              return (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedComment(c)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '16px 20px', 
                    borderBottom: `1px solid ${B}`, 
                    background: isSelected ? 'var(--bg-soft)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'background 0.1s'
                  }}
                >
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getPlatformIcon(c.platform)}
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.commenter_handle}</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, ...sentStyle }}>
                      {c.sentiment || 'neutral'}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                    {c.comment_text}
                  </p>

                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: G }}>
                    <span>{new Date(c.commented_at).toLocaleDateString()}</span>
                    {c.user_has_replied && <span style={{ color: '#10B981', fontWeight: 600 }}>Replied</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Active Detail / Thread reply view */}
        <div style={{ background: 'var(--bg-soft)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {selectedComment ? (
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
              
              {/* Comment Box */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20 }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>{selectedComment.commenter_handle}</span>
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
                  "{selectedComment.comment_text}"
                </p>

                {selectedComment.social_posts?.content_text && (
                  <div style={{ fontSize: '0.72rem', color: G, borderTop: `1px solid ${B}`, paddingTop: 10 }}>
                    On Post: <span style={{ fontStyle: 'italic' }}>"{selectedComment.social_posts.content_text.slice(0, 50)}..."</span>
                  </div>
                )}
              </div>

              {/* Thread replies */}
              {selectedComment.user_has_replied ? (
                <div style={{ background: '#E1F5FE', border: '1px solid #B3E5FC', borderRadius: 8, padding: 20, alignSelf: 'flex-end', width: '90%' }}>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#01579B' }}>You (via ZieAds)</span>
                    <span style={{ fontSize: '0.65rem', color: G }}>{new Date(selectedComment.user_replied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#0288D1' }}>
                    Replied successfully via direct publisher mock integration.
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

      </div>
    </V3Layout>
  );
}
