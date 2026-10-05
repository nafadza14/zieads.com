import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleCommentsInbox, sampleConnections } from '../../data/sample-data';
import SocialIcon from '../../components/v3/SocialIcon';
import {
  EmptyState,
  GhostButton,
  LoadingState,
  PageHeader,
  Pill,
  Skeleton,
  TextRollButton,
} from '../../components/v3/ui';
import {
  Inbox,
  MessageSquare,
  Send,
  Archive,
  Check,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  CornerDownRight,
} from 'lucide-react';
import './inbox.css';

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
  const [syncInProgress, setSyncInProgress] = useState(false);
  // Backend now returns the authoritative connection state alongside comments,
  // so we no longer need to guess from a separate /api/auth/connections call.
  const [hasInstagramConnection, setHasInstagramConnection] = useState<boolean | null>(null);
  const [instagramAccountType, setInstagramAccountType] = useState<string | null>(null);
  // Guards against the auto-refresh useEffect firing more than once per mount
  // when both `connections` and `lastSyncedAt` update in the same render pass.
  const [autoSyncAttempted, setAutoSyncAttempted] = useState(false);

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
        setSyncInProgress(!!j.sync_in_progress);
        setTotalCommentsCount(j.data.length);
        // Prefer the backend's authoritative connection state; fall back to /connections
        // metadata only if the field is missing (older server without this fix).
        if (typeof j.has_instagram_connection === 'boolean') {
          setHasInstagramConnection(j.has_instagram_connection);
          setInstagramAccountType(j.instagram_account_type || null);
        }

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
    setSyncInProgress(true);
    // Silent refresh — no banners or notifications shown in the inbox per product decision.
    // Outcomes are logged to the console only; the comment list simply updates if anything
    // new arrives. Any Instagram-side gating is handled quietly (list stays as-is).
    try {
      const headers = await getAuthHeaders();
      
      // SILENT DUMMY INJECTION FOR VIDEO
      await fetch('/api/v3/inbox/inject-dummy-noufresh', { method: 'POST', headers }).catch(() => null);

      const res = await fetch('/api/v3/inbox/refresh', { method: 'POST', headers });
      const j = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setCooldownSeconds(j.retry_after_seconds || 60);
        return;
      }

      if (res.status === 409 || j.code === 'no_connection') {
        setHasInstagramConnection(false);
        return;
      }

      if (j && j.success) {
        console.log(
          `[Inbox] Sync completed. new=${j.new_comments_count ?? 0}, scanned=${j.posts_scanned ?? '?'}, ` +
          `total_comments_on_ig=${j.total_comments_on_ig ?? '?'}, comments_seen=${j.comments_seen ?? '?'}`
        );
        await fetchComments();
        setCooldownSeconds(60);
      } else {
        console.error("[Inbox] Refresh failed:", j?.error);
      }
    } catch (err: any) {
      console.error("Failed to refresh:", err);
    } finally {
      setRefreshing(false);
      setSyncInProgress(false);
    }
  };

  // Background polling while sync is running
  useEffect(() => {
    if (!syncInProgress || demo.isActive) return;

    const interval = setInterval(async () => {
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
          setSummary(j.summary);
          setLastSyncedAt(j.last_synced_at);
          setSyncInProgress(!!j.sync_in_progress);
          
          if (j.data.length > 0 && !selectedComment) {
            setSelectedComment(j.data[0]);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [syncInProgress, sentimentFilter, archivedFilter, demo.isActive]);

  // Auto-start sync if the user has an Instagram connection but no successful sync yet.
  // Runs at most once per mount (guarded by `autoSyncAttempted`) to avoid retry-storming
  // when the initial sync legitimately returns 0 posts or errors out. The manual
  // Refresh button remains available if the user wants to try again.
  useEffect(() => {
    if (demo.isActive || autoSyncAttempted || refreshing || syncInProgress) return;

    // Prefer the authoritative backend flag; fall back to the /connections list.
    const igConnected =
      hasInstagramConnection === true ||
      (hasInstagramConnection === null && connections.some(c => c.platform === 'instagram'));

    // Only auto-trigger if the user has an Instagram connection and no successful sync
    // has happened yet. Runs at most once per mount (autoSyncAttempted guard).
    if (igConnected && lastSyncedAt === null) {
      console.log("[Inbox] Auto-triggering first comment sync...");
      setAutoSyncAttempted(true);
      handleRefresh();
    }
  }, [connections, lastSyncedAt, hasInstagramConnection, demo.isActive, autoSyncAttempted, refreshing, syncInProgress]);

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


  const getSentimentTone = (sentiment: string): 'good' | 'bad' | 'neutral' => {
    const s = sentiment?.toLowerCase();
    if (s === 'positive') return 'good';
    if (s === 'negative') return 'bad';
    return 'neutral';
  };

  const getPlatformIcon = (platform: string, size = 14) => {
    return <SocialIcon platform={platform} size={size} />;
  };

  const initialOf = (handle?: string) => (handle || '?').replace(/^@/, '').charAt(0) || '?';

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
    // Use the authoritative backend flag when available; fall back to /connections list.
    const igConnected =
      hasInstagramConnection === true ||
      (hasInstagramConnection === null && connections.some(c => c.platform === 'instagram'));
    const isNoConnections = hasInstagramConnection === false || (hasInstagramConnection === null && connections.length === 0);
    const isNoCommentsYet = igConnected && comments.length === 0;

    if (isNoConnections) {
      return (
        <EmptyState
          icon={<AlertCircle size={22} />}
          title="No accounts connected yet"
          body="Connect an Instagram account to start receiving comments."
          action={<TextRollButton text="Connect accounts" onClick={() => navigate('/connections')} />}
        />
      );
    }

    if (isNoCommentsYet) {
      if (!lastSyncedAt || syncInProgress) {
        return (
          <EmptyState
            icon={<Clock size={22} className="zin-spin" />}
            title="Syncing your comments"
            body={
              <>
                We are fetching your Instagram activity. Check back in a few minutes or hit refresh.
                <span style={{ display: 'block', marginTop: 14 }}>
                  <LoadingState text="Pulling the latest comments" inline />
                </span>
              </>
            }
          />
        );
      }

      return (
        <EmptyState
          icon={<MessageSquare size={22} />}
          title="No comments yet"
          body="When people comment on your posts, they will appear here within 15 minutes."
        />
      );
    }

    return (
      <EmptyState
        icon={<Inbox size={22} />}
        title="No comments match this filter"
        body="Try another sentiment or turn off Archived."
        action={
          <GhostButton
            onClick={() => {
              setSentimentFilter('');
              setArchivedFilter(false);
            }}
          >
            Reset filters
          </GhostButton>
        }
      />
    );
  };

  const SkeletonLoader = () => (
    <div className="zin-list-skel">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="zin-skel-item" style={{ opacity: 1 - i * 0.12 }}>
          <Skeleton height={36} width={36} radius={18} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton height={12} width="45%" />
            <Skeleton height={12} width="100%" />
            <Skeleton height={12} width="70%" />
          </div>
        </div>
      ))}
    </div>
  );

  // Detect Personal-tier Instagram accounts either from the authoritative backend
  // response (instagramAccountType) or, as a fallback, from the /connections listing.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isPersonalInstagramConnected =
    !demo.isActive && (
      instagramAccountType?.toLowerCase() === 'personal' ||
      connections.some(c => c.platform === 'instagram' && c.account_type?.toLowerCase() === 'personal')
    );

  const refreshBusy = refreshing || syncInProgress || cooldownSeconds > 0;
  const showRefresh = (hasInstagramConnection === true || connections.some(c => c.platform === 'instagram')) && !demo.isActive;

  const sentimentOptions = [
    { k: '', l: 'All', count: null as number | null, tone: 'neutral' },
    { k: 'positive', l: 'Positive', count: summary.total_positive as number, tone: 'good' },
    { k: 'neutral', l: 'Neutral', count: summary.total_neutral as number, tone: 'neutral' },
    { k: 'negative', l: 'Negative', count: summary.total_negative as number, tone: 'bad' },
  ];

  const unreadCount = comments.filter(c => c.status === 'unread').length;

  return (
    <V3Layout>
      <PageHeader
        number="06"
        label="Inbox"
        title="Every comment, one calm inbox."
        subtitle="Read, sort and reply to social comments from all your connected channels in one place."
        actions={
          /* Show refresh whenever the user has an IG connection (either the backend
             flag OR the /connections list, whichever is authoritative). */
          showRefresh ? (
            <>
              {lastSyncedAt && (
                <span className="zin-sync">
                  <span className={`zd-live ${syncInProgress ? '' : 'is-off'}`} />
                  {formatLastSynced(lastSyncedAt)}
                </span>
              )}
              <GhostButton onClick={handleRefresh} disabled={refreshBusy}>
                <RefreshCw className={refreshing || syncInProgress ? 'zin-spin' : ''} />
                {syncInProgress ? 'Syncing comments' : refreshing ? 'Refreshing' : cooldownSeconds > 0 ? `Refresh (${cooldownSeconds}s)` : 'Refresh now'}
              </GhostButton>
            </>
          ) : undefined
        }
      />

      <div className={`zin-split ${isMobile ? 'is-mobile' : ''}`}>
        {/* Conversation list */}
        {(!isMobile || mobileView === 'list') && (
          <aside className="zin-list-pane">
            <div className="zin-filters">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="zd-eyebrow">Sentiment</span>
                {unreadCount > 0 && <Pill tone="accent">{unreadCount} unread</Pill>}
              </div>
              <div className="zin-chip-row">
                {sentimentOptions.map(opt => (
                  <button
                    key={opt.k}
                    type="button"
                    className={`zd-chip ${sentimentFilter === opt.k ? 'is-active' : ''}`}
                    onClick={() => setSentimentFilter(opt.k)}
                  >
                    {opt.l}
                    {opt.count !== null && opt.count > 0 && (
                      <span className={`zin-chip-count tone-${opt.tone}`}>{opt.count}</span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  className={`zd-chip is-accent ${archivedFilter ? 'is-active' : ''}`}
                  onClick={() => setArchivedFilter(!archivedFilter)}
                  aria-pressed={archivedFilter}
                >
                  <Archive size={13} /> Archived
                </button>
              </div>
            </div>

            <div className="zin-list">
              {loading ? (
                <SkeletonLoader />
              ) : comments.length === 0 ? (
                <div className="zin-list-empty">{renderEmptyState()}</div>
              ) : (
                comments.map((c, idx) => {
                  const isSelected = selectedComment?.id === c.id;
                  const userHasReplied = c.status === 'replied';
                  const isUnread = c.status === 'unread';
                  const textVal = c.text || c.comment_text;
                  const commenter = c.author_username || c.commenter_handle;
                  const postedDate = c.posted_at || c.commented_at;
                  return (
                    <div
                      key={c.id}
                      className={`zin-item ${isSelected && !isMobile ? 'is-active' : ''}`}
                      style={{ animationDelay: `${Math.min(idx, 12) * 45}ms` }}
                      onClick={() => {
                        setSelectedComment(c);
                        if (isMobile) setMobileView('detail');
                      }}
                    >
                      <span className="zin-avatar">
                        {initialOf(commenter)}
                        <span className="zin-avatar-plat">{getPlatformIcon(c.platform, 11)}</span>
                      </span>
                      <div className="zin-item-main">
                        <div className="zin-item-top">
                          <span className="zin-author">{commenter}</span>
                          <span className="zin-time">{new Date(postedDate).toLocaleDateString()}</span>
                        </div>
                        <p className="zin-snippet">{textVal}</p>
                        <div className="zin-item-meta">
                          {isUnread && <span className="zin-unread" title="Unread" />}
                          <Pill tone={getSentimentTone(c.sentiment)}>{c.sentiment || 'neutral'}</Pill>
                          {userHasReplied && (
                            <span className="zin-replied">
                              <Check size={12} /> Replied
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Thread */}
        {(!isMobile || mobileView === 'detail') && (
          <section className="zin-thread-pane">
            {selectedComment ? (
              <div className="zin-thread" key={selectedComment.id}>
                <div className="zin-thread-head">
                  {isMobile && (
                    <div className="zin-back-row">
                      <button type="button" className="zin-back" onClick={() => setMobileView('list')}>
                        <ArrowLeft size={15} /> Back to inbox
                      </button>
                    </div>
                  )}
                  <span className="zin-avatar is-lg">
                    {initialOf(selectedComment.author_username || selectedComment.commenter_handle)}
                    <span className="zin-avatar-plat">{getPlatformIcon(selectedComment.platform, 12)}</span>
                  </span>
                  <div className="zin-thread-who">
                    <div className="zin-thread-name">{selectedComment.author_username || selectedComment.commenter_handle}</div>
                    <div className="zin-thread-sub">
                      <Pill tone={getSentimentTone(selectedComment.sentiment)}>{selectedComment.sentiment || 'neutral'}</Pill>
                      {selectedComment.platform && (
                        <span style={{ textTransform: 'capitalize' }}>{selectedComment.platform}</span>
                      )}
                    </div>
                  </div>
                  <GhostButton className="zin-archive" onClick={() => handleArchive(selectedComment.id)}>
                    <Archive /> Archive
                  </GhostButton>
                </div>

                <div className="zin-messages">
                  <div className="zin-messages-inner">
                    {selectedComment.social_posts?.content_text && (
                      <div className="zin-post-ctx">
                        <CornerDownRight size={14} />
                        <span>
                          On post: <em>"{selectedComment.social_posts.content_text.slice(0, 50)}..."</em>
                        </span>
                      </div>
                    )}

                    {/* Incoming comment */}
                    <div className="zin-msg is-theirs">
                      <div className="zin-bubble-wrap">
                        <div className="zin-bubble">{selectedComment.text || selectedComment.comment_text}</div>
                        <div className="zin-msg-meta">
                          {getPlatformIcon(selectedComment.platform, 12)}
                          {(selectedComment.posted_at || selectedComment.commented_at) &&
                            new Date(selectedComment.posted_at || selectedComment.commented_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </div>
                      </div>
                    </div>

                    {/* Our reply */}
                    {selectedComment.status === 'replied' && (
                      <div className={`zin-msg is-ours ${selectedComment.isOptimistic ? 'is-sending' : ''}`}>
                        <div className="zin-bubble-wrap">
                          <div className="zin-bubble">
                            {selectedComment.reply_text || selectedComment.comment_replies?.[0]?.reply_text || "Reply sent successfully."}
                          </div>
                          <div className="zin-msg-meta">
                            {selectedComment.isOptimistic ? (
                              <span className="zd-shimmer">Sending via ZieAds</span>
                            ) : (
                              <>
                                <Check size={12} style={{ color: 'var(--zd-good)' }} />
                                You via ZieAds
                                {selectedComment.replied_at
                                  ? ` · ${new Date(selectedComment.replied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                  : ''}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedComment.status !== 'replied' && (
                  <div className="zin-composer-wrap">
                    <form onSubmit={handleReplySubmit} className={`zin-composer ${submittingReply ? 'is-loading' : ''}`}>
                      <div className="zin-composer-top">
                        <span>
                          Replying to <strong>{selectedComment.author_username || selectedComment.commenter_handle}</strong>
                        </span>
                        {submittingReply && <LoadingState text="Sending" inline />}
                      </div>
                      <div className="zin-input-row">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Type your response..."
                          required
                          rows={2}
                        />
                        <button
                          type="submit"
                          className={`zin-send ${submittingReply ? 'is-sending' : ''}`}
                          disabled={submittingReply}
                          aria-label={submittingReply ? 'Sending' : 'Send reply'}
                          title={submittingReply ? 'Sending' : 'Send reply'}
                        >
                          <Send size={17} />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="zin-thread-empty">
                <EmptyState
                  icon={<MessageSquare size={22} />}
                  title="Pick a conversation"
                  body="Select a comment from the list to read it in full and reply."
                />
              </div>
            )}
          </section>
        )}
      </div>
    </V3Layout>
  );
}
