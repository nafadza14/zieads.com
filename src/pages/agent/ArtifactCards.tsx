/*
  Review cards for work the AI Agent did inside ZieAds features.
  Every item is a draft: the user edits, approves, sends or deletes it here,
  or opens it in the matching feature (Calendar, Composer, Inbox, Competitor Hunt).
*/
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Check, Crosshair, MessageCircle, PenLine, Send, Trash2, AlertCircle } from 'lucide-react';
import SocialIcon from '../../components/v3/SocialIcon';
import { supabase } from '../../lib/supabaseClient';

export type AgentArtifact =
  | { kind: 'post'; id: string; platform: string; caption: string; hashtags: string[]; scheduled_for: string | null; media_type: string; media_urls: string[]; status: string }
  | { kind: 'reply'; id: string; platform: string; author: string; comment: string; reply: string; sentiment?: string }
  | { kind: 'competitor'; id: string; name: string; website_url: string; instagram_username?: string | null };

async function api(path: string, method: string, body?: any) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.success === false) throw Object.assign(new Error(j.message || j.error || 'Something went wrong'), { code: j.error });
  return j;
}

/** ISO -> value for <input type="datetime-local"> in the viewer's timezone */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const fmtWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No time set';

type Busy = '' | 'save' | 'approve' | 'delete' | 'send';

// ─── Post draft ───────────────────────────────────────────────────────────────
function PostCard({ item, index }: { item: Extract<AgentArtifact, { kind: 'post' }>; index: number }) {
  const navigate = useNavigate();
  const [caption, setCaption] = useState(item.caption);
  const [tags, setTags] = useState(item.hashtags.map((h) => `#${h}`).join(' '));
  const [when, setWhen] = useState(toLocalInput(item.scheduled_for));
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<'draft' | 'saved' | 'scheduled' | 'deleted'>(item.status === 'scheduled' ? 'scheduled' : 'draft');
  const [busy, setBusy] = useState<Busy>('');
  const [error, setError] = useState('');
  const dirty = caption !== item.caption || tags !== item.hashtags.map((h) => `#${h}`).join(' ') || when !== toLocalInput(item.scheduled_for);
  const hashtags = tags.split(/[\s,]+/).map((t) => t.replace(/^#/, '')).filter(Boolean);

  const run = async (kind: Busy, fn: () => Promise<void>) => {
    setBusy(kind);
    setError('');
    try {
      await fn();
    } catch (e: any) {
      setError(e.code === 'needs_media' ? 'Add an image or video in Composer first, then approve.' : e.message);
    } finally {
      setBusy('');
    }
  };

  const save = () =>
    run('save', async () => {
      await api(`/api/v3/posts/${item.id}`, 'PATCH', { caption, hashtags, scheduled_for: fromLocalInput(when) || undefined, keep_draft: true });
      Object.assign(item, { caption, hashtags, scheduled_for: fromLocalInput(when) });
      setState('saved');
      setEditing(false);
    });
  const approve = () =>
    run('approve', async () => {
      await api(`/api/v3/posts/${item.id}`, 'PATCH', { caption, hashtags, scheduled_for: fromLocalInput(when) || undefined, approve: true });
      Object.assign(item, { caption, hashtags, scheduled_for: fromLocalInput(when), status: 'scheduled' });
      setState('scheduled');
      setEditing(false);
    });
  const remove = () =>
    run('delete', async () => {
      await api(`/api/v3/posts/${item.id}`, 'DELETE');
      setState('deleted');
    });

  if (state === 'deleted') {
    return (
      <div className="za-art is-removed">
        <Trash2 size={13} /> Draft deleted
      </div>
    );
  }

  return (
    <div className={`za-art za-art-post is-${state}`} style={{ animationDelay: `${index * 70}ms` }}>
      <div className="za-art-head">
        <SocialIcon platform={item.platform} size={22} />
        <div className="za-art-head-text">
          <strong>{item.platform.charAt(0).toUpperCase() + item.platform.slice(1)} {item.media_type !== 'image' ? item.media_type : 'post'}</strong>
          <small>
            <CalendarDays size={11} /> {fmtWhen(fromLocalInput(when))}
          </small>
        </div>
        <span className={`za-art-pill is-${state}`}>{state === 'scheduled' ? 'Scheduled' : state === 'saved' ? 'Draft saved' : 'Draft'}</span>
      </div>

      {editing ? (
        <div className="za-art-edit">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={Math.min(10, Math.max(4, Math.ceil(caption.length / 60)))} aria-label="Caption" />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#hashtags" aria-label="Hashtags" />
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Planned time" />
        </div>
      ) : (
        <button type="button" className="za-art-body" onClick={() => state !== 'scheduled' && setEditing(true)} title={state !== 'scheduled' ? 'Click to edit' : undefined}>
          <p>{caption}</p>
          {hashtags.length > 0 && <p className="za-art-tags">{hashtags.map((h) => `#${h}`).join(' ')}</p>}
          {item.media_urls?.length === 0 && state !== 'scheduled' && <span className="za-art-hint">No media yet. Add it in Composer.</span>}
        </button>
      )}

      {error && (
        <div className="za-art-error">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="za-art-actions">
        {state !== 'scheduled' ? (
          <>
            {editing ? (
              <button type="button" className="za-art-btn is-dark" onClick={save} disabled={!!busy || !caption.trim()}>
                {busy === 'save' ? 'Saving...' : dirty ? 'Save changes' : 'Done'}
              </button>
            ) : (
              <button type="button" className="za-art-btn" onClick={() => setEditing(true)}>
                <PenLine size={13} /> Edit
              </button>
            )}
            <button type="button" className="za-art-btn is-accent" onClick={approve} disabled={!!busy}>
              <Check size={13} /> {busy === 'approve' ? 'Approving...' : 'Approve and schedule'}
            </button>
            <button type="button" className="za-art-btn is-ghost" onClick={() => navigate(`/composer?draft=${item.id}`)}>
              Open in Composer <ArrowUpRight size={13} />
            </button>
            <button type="button" className="za-art-icon" onClick={remove} disabled={!!busy} aria-label="Delete draft" title="Delete draft">
              <Trash2 size={14} />
            </button>
          </>
        ) : (
          <button type="button" className="za-art-btn is-ghost" onClick={() => navigate('/calendar')}>
            View in Calendar <ArrowUpRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Comment reply draft ──────────────────────────────────────────────────────
function ReplyCard({ item, index }: { item: Extract<AgentArtifact, { kind: 'reply' }>; index: number }) {
  const navigate = useNavigate();
  const [reply, setReply] = useState(item.reply);
  const [state, setState] = useState<'draft' | 'sent'>('draft');
  const [busy, setBusy] = useState<Busy>('');
  const [error, setError] = useState('');

  const send = async () => {
    setBusy('send');
    setError('');
    try {
      await api(`/api/v3/inbox/comments/${item.id}/reply`, 'POST', { replyText: reply.trim() });
      setState('sent');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };
  const persist = () => {
    if (reply !== item.reply && state === 'draft') {
      item.reply = reply;
      api(`/api/v3/inbox/comments/${item.id}/draft`, 'POST', { reply_text: reply }).catch(() => {});
    }
  };

  return (
    <div className={`za-art za-art-reply is-${state}`} style={{ animationDelay: `${index * 70}ms` }}>
      <div className="za-art-comment">
        <span className="za-art-avatar">{(item.author || '?').charAt(0).toUpperCase()}</span>
        <div>
          <strong>
            @{item.author} <SocialIcon platform={item.platform} size={13} variant="mark" />
          </strong>
          <p>{item.comment}</p>
        </div>
        {item.sentiment && <span className={`za-art-sent is-${item.sentiment}`}>{item.sentiment}</span>}
      </div>
      {state === 'sent' ? (
        <div className="za-art-sent-reply">
          <Check size={13} /> Sent: {reply}
        </div>
      ) : (
        <>
          <textarea className="za-art-reply-input" value={reply} onChange={(e) => setReply(e.target.value)} onBlur={persist} rows={2} aria-label="Reply" ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight + 2}px`; } }} onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${el.scrollHeight + 2}px`; }} />
          {error && (
            <div className="za-art-error">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div className="za-art-actions">
            <button type="button" className="za-art-btn is-accent" onClick={send} disabled={!!busy || !reply.trim()}>
              <Send size={13} /> {busy === 'send' ? 'Sending...' : 'Send reply'}
            </button>
            <button type="button" className="za-art-btn is-ghost" onClick={() => { persist(); navigate(`/inbox?comment=${item.id}`); }}>
              Open in Inbox <ArrowUpRight size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Competitor ───────────────────────────────────────────────────────────────
function CompetitorCard({ item, index }: { item: Extract<AgentArtifact, { kind: 'competitor' }>; index: number }) {
  const navigate = useNavigate();
  return (
    <div className="za-art za-art-comp" style={{ animationDelay: `${index * 70}ms` }}>
      <span className="za-art-comp-ico">
        <Crosshair size={16} />
      </span>
      <div className="za-art-head-text">
        <strong>{item.name}</strong>
        <small>
          {item.website_url.replace(/^https?:\/\//, '')}
          {item.instagram_username ? ` · @${item.instagram_username}` : ''}
        </small>
      </div>
      <button type="button" className="za-art-btn is-ghost" onClick={() => navigate('/hunt')}>
        Open Hunt <ArrowUpRight size={13} />
      </button>
    </div>
  );
}

const GROUPS = {
  post: { icon: <CalendarDays size={14} />, one: 'draft post on your calendar', many: 'draft posts on your calendar', link: '/calendar', linkLabel: 'Open Calendar' },
  reply: { icon: <MessageCircle size={14} />, one: 'reply drafted in your Inbox', many: 'replies drafted in your Inbox', link: '/inbox', linkLabel: 'Open Inbox' },
  competitor: { icon: <Crosshair size={14} />, one: 'competitor tracked in Hunt', many: 'competitors tracked in Hunt', link: '/hunt', linkLabel: 'Open Hunt' },
} as const;

/** All the work from one agent run, grouped by feature */
export default function ArtifactDeck({ artifacts }: { artifacts: AgentArtifact[] }) {
  const navigate = useNavigate();
  // Latest version of each item wins (drafts can be updated during the run)
  const unique = [...new Map(artifacts.map((a) => [`${a.kind}:${a.id}`, a])).values()];
  const kinds = (['post', 'reply', 'competitor'] as const).filter((k) => unique.some((a) => a.kind === k));
  if (!kinds.length) return null;

  return (
    <div className="za-deck">
      {kinds.map((k) => {
        const items = unique.filter((a) => a.kind === k);
        const g = GROUPS[k];
        return (
          <section key={k} className="za-deck-group">
            <header className="za-deck-head">
              <span className="za-deck-ico">{g.icon}</span>
              <span className="za-deck-title">
                {items.length} {items.length === 1 ? g.one : g.many}
              </span>
              <span className="za-deck-note">Review before anything goes live</span>
              <button type="button" className="za-deck-link" onClick={() => navigate(g.link)}>
                {g.linkLabel} <ArrowUpRight size={12} />
              </button>
            </header>
            <div className="za-deck-items">
              {items.map((a, i) =>
                a.kind === 'post' ? (
                  <PostCard key={a.id} item={a} index={i} />
                ) : a.kind === 'reply' ? (
                  <ReplyCard key={a.id} item={a} index={i} />
                ) : (
                  <CompetitorCard key={a.id} item={a} index={i} />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
