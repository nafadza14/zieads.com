/*
  Comments: every comment on every connected network, grouped by the post it belongs to.
  Pattern from Buffer Community and Metricool: pick a post on the left, answer its comments inline
  on the right, unanswered first. A List view shows every comment in one feed.
  Keyboard: Up and Down move between comments, R focuses the reply box, Cmd or Ctrl + Enter sends.
*/
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { platformName } from '../../lib/platforms';
import SocialIcon from '../../components/v3/SocialIcon';
import ZIcon from '../../components/icons/ZIcon';
import { Button, EmptyState, PageHeader, Pill, SegTabs, Skeleton } from '../../components/v3/ui';
import { ArrowLeft, Check, ExternalLink, Link2, MessageCircle, RefreshCw, RotateCcw, Rows3, LayoutList } from 'lucide-react';
import './comments.css';

type View = 'unanswered' | 'all' | 'resolved';
type Mode = 'post' | 'list';

interface PostGroup {
  key: string;
  platform: string;
  post_id: string;
  caption: string;
  thumb: string | null;
  permalink: string | null;
  total: number;
  unanswered: number;
  last_comment_at: string | null;
}

const INTENT: Record<string, { label: string; tone: 'good' | 'bad' | 'warn' | 'neutral' | 'accent' }> = {
  buying_signal: { label: 'Buying signal', tone: 'accent' },
  complaint: { label: 'Complaint', tone: 'bad' },
  question: { label: 'Question', tone: 'warn' },
  praise: { label: 'Praise', tone: 'good' },
  spam: { label: 'Likely spam', tone: 'neutral' },
};

const OPEN = ['unread', 'read'];
const isOpen = (c: any) => OPEN.includes(c.status);

export function ago(iso?: string | null) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ── Demo data so the page reads well before anything is connected ── */
const h = (n: number) => new Date(Date.now() - n * 3600000).toISOString();
const DEMO_POSTS: PostGroup[] = [
  { key: 'instagram|p1', platform: 'instagram', post_id: 'p1', caption: 'Our new cold brew blend is here. Smooth, low acid, roasted this week.', thumb: null, permalink: null, total: 3, unanswered: 2, last_comment_at: h(1) },
  { key: 'youtube|v1', platform: 'youtube', post_id: 'v1', caption: 'How we roast 40 kg of beans before 7am', thumb: null, permalink: null, total: 2, unanswered: 1, last_comment_at: h(3) },
  { key: 'threads|t1', platform: 'threads', post_id: 't1', caption: 'Hot take: oat milk is the best milk for lattes. Change my mind.', thumb: null, permalink: null, total: 2, unanswered: 1, last_comment_at: h(5) },
  { key: 'bluesky|b1', platform: 'bluesky', post_id: 'b1', caption: 'We now ship to 12 countries. Full list on our site.', thumb: null, permalink: null, total: 1, unanswered: 1, last_comment_at: h(9) },
];
const DEMO_COMMENTS: any[] = [
  { id: 'd1', platform: 'instagram', platform_media_id: 'p1', author_username: 'sarah.k', text: 'Do you ship to Canada? I want to buy two bags.', intent: 'buying_signal', status: 'unread', posted_at: h(1) },
  { id: 'd2', platform: 'instagram', platform_media_id: 'p1', author_username: 'mike_roast', text: 'My last bag arrived torn. Not happy.', intent: 'complaint', status: 'unread', posted_at: h(2) },
  { id: 'd3', platform: 'instagram', platform_media_id: 'p1', author_username: 'emma.daily', text: 'Best coffee in town, period.', intent: 'praise', status: 'replied', reply_text: 'Thank you Emma, see you Saturday!', posted_at: h(4) },
  { id: 'd4', platform: 'youtube', platform_media_id: 'v1', author_username: 'Leo Brews', text: 'What roaster model is that?', intent: 'question', status: 'unread', posted_at: h(3) },
  { id: 'd5', platform: 'youtube', platform_media_id: 'v1', author_username: 'Nina', text: 'So satisfying to watch.', intent: 'praise', status: 'archived', posted_at: h(20) },
  { id: 'd6', platform: 'threads', platform_media_id: 't1', author_username: 'tim.d', text: 'Is there a decaf version of the oat latte?', intent: 'question', status: 'unread', posted_at: h(5) },
  { id: 'd7', platform: 'threads', platform_media_id: 't1', author_username: 'clara', text: 'Agree 100 percent.', intent: 'praise', status: 'replied', reply_text: 'Team oat!', posted_at: h(8) },
  { id: 'd8', platform: 'bluesky', platform_media_id: 'b1', author_username: 'jo.bsky.social', text: 'Is Japan on the list?', intent: 'question', status: 'unread', posted_at: h(9) },
];
const demoView = (c: any, v: View) => (v === 'unanswered' ? isOpen(c) : v === 'resolved' ? !isOpen(c) : true);

export default function CommentsPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [view, setView] = useState<View>('unanswered');
  const [mode, setMode] = useState<Mode>('post');
  const [sort, setSort] = useState('unanswered');
  const [platform, setPlatform] = useState('');
  const [posts, setPosts] = useState<PostGroup[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [networks, setNetworks] = useState<{ supported: any[]; unsupported: any[] }>({ supported: [], unsupported: [] });
  const [activePost, setActivePost] = useState<string>('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [activeId, setActiveId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 860);
  const [mobileDetail, setMobileDetail] = useState(false);
  const boxRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const headers = async () => {
    const { data } = await supabase.auth.getSession();
    const t = data?.session?.access_token;
    return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    if (demo.isActive) {
      const rows = DEMO_COMMENTS.filter((c) => demoView(c, view) && (!platform || c.platform === platform));
      const list = DEMO_POSTS.filter((p) => rows.some((c) => `${c.platform}|${c.platform_media_id}` === p.key)).map((p) => {
        const mine = rows.filter((c) => `${c.platform}|${c.platform_media_id}` === p.key);
        return { ...p, total: mine.length, unanswered: mine.filter(isOpen).length };
      });
      setPosts(list);
      setCounts({ unanswered: DEMO_COMMENTS.filter(isOpen).length, all: DEMO_COMMENTS.length, resolved: DEMO_COMMENTS.filter((c) => !isOpen(c)).length });
      setNetworks({ supported: ['instagram', 'youtube', 'threads', 'bluesky'].map((p) => ({ platform: p })), unsupported: [{ platform: 'tiktok', reason: 'TikTok does not offer comments to this kind of app yet. Reply in the TikTok app.' }] });
      setLoadingPosts(false);
      return;
    }
    try {
      const res = await fetch(`/api/v3/comments/posts?view=${view}${platform ? `&platform=${platform}` : ''}`, { headers: await headers() });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Could not load comments');
      setPosts(j.posts || []);
      setCounts(j.counts || {});
      setNetworks(j.networks || { supported: [], unsupported: [] });
    } catch (e: any) {
      setNotice({ tone: 'bad', text: e.message });
    } finally {
      setLoadingPosts(false);
    }
  }, [view, platform, demo.isActive]);

  const loadComments = useCallback(async () => {
    if (mode === 'post' && !activePost) {
      setComments([]);
      return;
    }
    setLoadingComments(true);
    if (demo.isActive) {
      let rows = DEMO_COMMENTS.filter((c) => demoView(c, view) && (!platform || c.platform === platform) && (mode === 'list' || `${c.platform}|${c.platform_media_id}` === activePost));
      rows = rows.map((c) => ({ ...c, post: DEMO_POSTS.find((p) => p.key === `${c.platform}|${c.platform_media_id}`) }));
      rows.sort((a, b) => (sort === 'oldest' ? +new Date(a.posted_at) - +new Date(b.posted_at) : sort === 'newest' ? +new Date(b.posted_at) - +new Date(a.posted_at) : (isOpen(a) ? 0 : 1) - (isOpen(b) ? 0 : 1)));
      setComments(rows);
      setLoadingComments(false);
      return;
    }
    try {
      const q = new URLSearchParams({ view, sort });
      if (platform) q.set('platform', platform);
      if (mode === 'post') q.set('post', activePost);
      const res = await fetch(`/api/v3/comments?${q}`, { headers: await headers() });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Could not load comments');
      setComments(j.comments || []);
    } catch (e: any) {
      setNotice({ tone: 'bad', text: e.message });
    } finally {
      setLoadingComments(false);
    }
  }, [mode, activePost, view, sort, platform, demo.isActive]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Keep a post selected on wide screens so the right side is never empty
  useEffect(() => {
    if (loadingPosts) return;
    if (!posts.some((p) => p.key === activePost)) setActivePost(isMobile ? '' : posts[0]?.key || '');
  }, [posts, loadingPosts]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!comments.some((c) => c.id === activeId)) setActiveId(comments.find(isOpen)?.id || comments[0]?.id || '');
  }, [comments]); // eslint-disable-line react-hooks/exhaustive-deps

  const sync = async () => {
    if (demo.isActive) {
      setNotice({ tone: 'good', text: 'Demo mode: comments are sample data.' });
      return;
    }
    setSyncing(true);
    setNotice(null);
    try {
      const h = await headers();
      // Meta comments sync through the Inbox refresh, the other networks through comments/sync
      const [meta, rest] = await Promise.all([
        fetch('/api/v3/inbox/refresh', { method: 'POST', headers: h }).then((r) => r.json().catch(() => ({}))).catch(() => ({})),
        fetch('/api/v3/comments/sync', { method: 'POST', headers: h }).then((r) => r.json().catch(() => ({}))).catch(() => ({})),
      ]);
      const failed = Object.entries(rest.results || {}).filter(([, v]: any) => !v.ok).map(([k]) => platformName(k));
      const fresh = (meta.new_comments_count || 0) + Object.values(rest.results || {}).reduce((s: number, v: any) => s + (v.count || 0), 0);
      setNotice(failed.length ? { tone: 'bad', text: `Could not reach ${failed.join(', ')}. Reconnect it in Connections if this keeps happening.` } : { tone: 'good', text: rest.throttled ? 'Synced a moment ago. Showing the latest.' : `Synced. ${fresh} comments checked.` });
      await loadPosts();
      await loadComments();
    } finally {
      setSyncing(false);
    }
  };

  const patchComment = (id: string, patch: any) => setComments((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const afterChange = (id: string, patch: any) => {
    patchComment(id, patch);
    setCounts((c) => ({ ...c, unanswered: Math.max(0, (c.unanswered || 0) - 1), resolved: (c.resolved || 0) + 1 }));
    setPosts((list) => list.map((p) => (comments.find((c) => c.id === id) && p.key === `${comments.find((c) => c.id === id).platform}|${comments.find((c) => c.id === id).platform_media_id}` ? { ...p, unanswered: Math.max(0, p.unanswered - 1) } : p)));
    // Move on to the next comment that still waits, like Buffer's keyboard flow
    const next = comments.find((c) => c.id !== id && isOpen(c));
    if (next) setActiveId(next.id);
  };

  const reply = async (c: any) => {
    const text = (drafts[c.id] ?? c.reply_text ?? '').trim();
    if (!text) return;
    setBusy(`reply:${c.id}`);
    try {
      if (!demo.isActive) {
        const res = await fetch(`/api/v3/inbox/comments/${c.id}/reply`, { method: 'POST', headers: await headers(), body: JSON.stringify({ reply_text: text }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.message || j.error || 'The reply failed');
      }
      afterChange(c.id, { status: 'replied', reply_text: text });
      setNotice({ tone: 'good', text: `Reply sent on ${platformName(c.platform)}.` });
    } catch (e: any) {
      setNotice({ tone: 'bad', text: e.message });
    } finally {
      setBusy('');
    }
  };

  const suggest = async (c: any) => {
    setBusy(`suggest:${c.id}`);
    try {
      if (demo.isActive) {
        setDrafts((d) => ({ ...d, [c.id]: 'Thanks for asking! We will send you the details by DM.' }));
        return;
      }
      const res = await fetch(`/api/v3/inbox/comments/${c.id}/suggest`, { method: 'POST', headers: await headers() });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || j.error || 'Could not draft a reply');
      setDrafts((d) => ({ ...d, [c.id]: j.reply_text || j.reply || j.text || '' }));
      setTimeout(() => boxRefs.current[c.id]?.focus(), 0);
    } catch (e: any) {
      setNotice({ tone: 'bad', text: e.message });
    } finally {
      setBusy('');
    }
  };

  const resolve = async (c: any, resolved = true) => {
    setBusy(`resolve:${c.id}`);
    try {
      let status = resolved ? 'archived' : 'read';
      if (!demo.isActive) {
        const res = await fetch(`/api/v3/comments/${c.id}/resolve`, { method: 'POST', headers: await headers(), body: JSON.stringify({ resolved }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || 'Could not update the comment');
        status = j.status;
      }
      if (resolved) afterChange(c.id, { status });
      else patchComment(c.id, { status });
    } catch (e: any) {
      setNotice({ tone: 'bad', text: e.message });
    } finally {
      setBusy('');
    }
  };

  // Keyboard flow: Up and Down move, R opens the reply box, Cmd or Ctrl + Enter sends (handled in the box)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('textarea, input, select');
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = comments.findIndex((c) => c.id === activeId);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const n = comments[Math.min(comments.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
        if (n) {
          e.preventDefault();
          setActiveId(n.id);
          document.getElementById(`zcm-c-${n.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } else if (e.key === 'r' && activeId) {
        e.preventDefault();
        boxRefs.current[activeId]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [comments, activeId]);

  const post = useMemo(() => posts.find((p) => p.key === activePost), [posts, activePost]);
  const supported = networks.supported.map((n) => n.platform);
  const showList = mode === 'post' && (!isMobile || !mobileDetail);
  const showDetail = mode === 'list' || !isMobile || mobileDetail;
  const nothingConnected = !loadingPosts && !demo.isActive && supported.length === 0;

  // A render function, not a component, so the reply box keeps focus while typing
  const renderComment = (c: any, withPost?: boolean) => {
    const open = isOpen(c);
    const active = c.id === activeId;
    const intent = INTENT[c.intent || ''];
    const value = drafts[c.id] ?? (open ? c.reply_text || '' : '');
    return (
      <article id={`zcm-c-${c.id}`} className={`zcm-comment ${active ? 'is-active' : ''} ${open ? '' : 'is-done'}`} onClick={() => setActiveId(c.id)} aria-current={active || undefined}>
        {withPost && c.post && (
          <button type="button" className="zcm-comment-post" onClick={() => { setMode('post'); setActivePost(c.post.key); }}>
            <SocialIcon platform={c.platform} size={12} />
            <span>{c.post.caption || 'Post'}</span>
          </button>
        )}
        <div className="zcm-comment-head">
          <span className="zcm-avatar" aria-hidden="true">
            {c.author_avatar ? <img src={c.author_avatar} alt="" loading="lazy" /> : String(c.author_username || '?').replace('@', '').slice(0, 1).toUpperCase()}
            <span className="zcm-avatar-badge"><SocialIcon platform={c.platform} size={10} /></span>
          </span>
          <div className="zcm-comment-who">
            <strong>{c.author_username || 'Someone'}</strong>
            <span>{platformName(c.platform)} · {ago(c.posted_at)}</span>
          </div>
          <div className="zcm-comment-tags">
            {intent && <Pill tone={intent.tone}>{intent.label}</Pill>}
            {c.status === 'replied' && <Pill tone="good">Replied</Pill>}
            {c.status === 'archived' && <Pill>Resolved</Pill>}
          </div>
        </div>
        <p className="zcm-comment-text">{c.text}</p>
        {c.status === 'replied' && c.reply_text && (
          <div className="zcm-reply-done">
            <span className="zd-eyebrow">Your reply</span>
            <p>{c.reply_text}</p>
          </div>
        )}
        {open ? (
          <div className="zcm-reply">
            <textarea
              ref={(el) => { boxRefs.current[c.id] = el; }}
              aria-label={`Reply to ${c.author_username || 'comment'}`}
              placeholder={`Reply to ${c.author_username || 'this comment'}...`}
              rows={active ? 2 : 1}
              value={value}
              onFocus={() => setActiveId(c.id)}
              onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  reply(c);
                }
              }}
            />
            <div className="zcm-reply-actions">
              <Button size="sm" variant="ghost" icon={<Check size={13} />} loading={busy === `resolve:${c.id}`} onClick={() => resolve(c)}>Resolve</Button>
              <span className="zcm-spacer" />
              <Button size="sm" variant="soft" icon={<ZIcon name="reply-draft" size={13} />} loading={busy === `suggest:${c.id}`} onClick={() => suggest(c)}>Draft reply</Button>
              <Button size="sm" variant={active ? 'primary' : 'secondary'} loading={busy === `reply:${c.id}`} disabled={!value.trim()} onClick={() => reply(c)}>Reply</Button>
            </div>
          </div>
        ) : (
          c.status === 'archived' && (
            <div className="zcm-reply-actions">
              <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} loading={busy === `resolve:${c.id}`} onClick={() => resolve(c, false)}>Reopen</Button>
            </div>
          )
        )}
      </article>
    );
  };

  return (
    <V3Layout>
      <PageHeader
        title="Comments"
        subtitle="Every comment on every network, grouped by post. Unanswered first."
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} className={syncing ? 'zcm-spin' : ''} />} onClick={sync} disabled={syncing}>
            {syncing ? 'Syncing' : 'Sync now'}
          </Button>
        }
      />

      <div className="zcm-toolbar">
        <div className="zcm-seg">
          <SegTabs<View>
            size="sm"
            value={view}
            onChange={setView}
            tabs={[
              { id: 'unanswered', label: <>Unanswered{counts.unanswered ? <span className="zcm-count">{counts.unanswered}</span> : null}</> },
              { id: 'all', label: 'All' },
              { id: 'resolved', label: 'Resolved' },
            ]}
          />
        </div>
        <div className="zcm-chips" role="group" aria-label="Network">
          {(['', ...supported] as string[]).map((p) => (
            <button key={p || 'all'} type="button" className={`zd-chip ${platform === p ? 'is-active' : ''}`} aria-pressed={platform === p} onClick={() => setPlatform(p)}>
              {p ? <SocialIcon platform={p} size={13} /> : null}
              {p ? platformName(p) : 'All networks'}
            </button>
          ))}
        </div>
        <div className="zcm-toolbar-end">
          <label className="zcm-sort">
            <select className="zd-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort comments">
              <option value="unanswered">Unanswered first</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
          <div className="zcm-mode" role="group" aria-label="Layout">
            <button type="button" className={mode === 'post' ? 'is-active' : ''} aria-pressed={mode === 'post'} onClick={() => setMode('post')} title="By post">
              <Rows3 size={14} /> By post
            </button>
            <button type="button" className={mode === 'list' ? 'is-active' : ''} aria-pressed={mode === 'list'} onClick={() => setMode('list')} title="List">
              <LayoutList size={14} /> List
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className={`zcm-notice tone-${notice.tone}`} role="status">
          <span className="zcm-dot" />
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {nothingConnected ? (
        <div className="zcm-empty-wrap">
          <EmptyState
            icon={<Link2 size={22} />}
            title="Connect a network to see its comments"
            body="Comments come in from Instagram, Facebook, Threads, YouTube, Bluesky, Mastodon and Telegram."
            action={<Button icon={<Link2 size={14} />} onClick={() => navigate('/connections')}>Open Connections</Button>}
          />
        </div>
      ) : (
        <div className={`zcm-split mode-${mode} ${isMobile ? 'is-mobile' : ''}`}>
          {showList && (
            <aside className="zcm-posts" aria-label="Posts with comments">
              {loadingPosts ? (
                <div className="zcm-pad">{[0, 1, 2, 3].map((i) => <div key={i} className="zcm-post-skel"><Skeleton height={48} width={48} radius={8} /><div style={{ flex: 1 }}><Skeleton height={12} width="80%" /><div style={{ height: 8 }} /><Skeleton height={12} width="50%" /></div></div>)}</div>
              ) : posts.length === 0 ? (
                <div className="zcm-pad">
                  <EmptyState
                    icon={<MessageCircle size={22} />}
                    title={view === 'unanswered' ? 'Every comment has an answer' : 'No comments here'}
                    body={view === 'unanswered' ? 'New comments show up here after the next sync.' : 'Try another network or view.'}
                  />
                </div>
              ) : (
                <ul className="zcm-post-list">
                  {posts.map((p) => (
                    <li key={p.key}>
                      <button type="button" className={`zcm-post ${p.key === activePost ? 'is-active' : ''}`} aria-current={p.key === activePost || undefined} onClick={() => { setActivePost(p.key); setMobileDetail(true); }}>
                        <span className="zcm-thumb">
                          {p.thumb ? <img src={p.thumb} alt="" loading="lazy" /> : <MessageCircle size={16} />}
                          <span className="zcm-thumb-badge"><SocialIcon platform={p.platform} size={11} /></span>
                        </span>
                        <span className="zcm-post-body">
                          <span className="zcm-post-caption">{p.caption || `${platformName(p.platform)} post`}</span>
                          <span className="zcm-post-meta">
                            {p.unanswered > 0 ? <Pill tone="accent">{p.unanswered} unanswered</Pill> : <span>{p.total} comments</span>}
                            <span>{ago(p.last_comment_at)}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}

          {showDetail && (
            <section className="zcm-detail" aria-label="Comments">
              {mode === 'post' && post && (
                <header className="zcm-detail-head">
                  {isMobile && (
                    <Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => setMobileDetail(false)} aria-label="Back to posts" />
                  )}
                  <span className="zcm-thumb is-lg">
                    {post.thumb ? <img src={post.thumb} alt="" /> : <SocialIcon platform={post.platform} size={18} />}
                  </span>
                  <div className="zcm-detail-text">
                    <span className="zd-eyebrow">{platformName(post.platform)} post</span>
                    <p>{post.caption || 'No caption'}</p>
                  </div>
                  {post.permalink && (
                    <a className="zcm-open" href={post.permalink} target="_blank" rel="noreferrer">
                      Open on {platformName(post.platform)} <ExternalLink size={12} />
                    </a>
                  )}
                </header>
              )}
              <div className="zcm-thread">
                {loadingComments ? (
                  [0, 1, 2].map((i) => <div key={i} className="zcm-comment"><Skeleton height={14} width="40%" /><div style={{ height: 10 }} /><Skeleton height={12} count={2} /></div>)
                ) : comments.length === 0 ? (
                  !loadingPosts && <EmptyState icon={<MessageCircle size={22} />} title={mode === 'post' && !post ? 'Pick a post' : 'No comments here'} body={mode === 'post' && !post ? 'Choose a post on the left to answer its comments.' : 'Try another network or view.'} />
                ) : (
                  comments.map((c) => <div key={c.id}>{renderComment(c, mode === 'list')}</div>)
                )}
              </div>
              <p className="zcm-keys" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>R</kbd> reply · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> send</p>
            </section>
          )}
        </div>
      )}

      {networks.unsupported.length > 0 && (
        <div className="zcm-unsupported">
          {networks.unsupported.map((n) => (
            <span key={n.platform}>
              <SocialIcon platform={n.platform} size={12} /> {n.reason}
            </span>
          ))}
        </div>
      )}
    </V3Layout>
  );
}
