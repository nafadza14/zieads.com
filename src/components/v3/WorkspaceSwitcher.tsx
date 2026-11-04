/*
  Workspace switcher at the top of the sidebar: one workspace per brand.
  The card shows the active brand; the menu lists every brand with its connected networks,
  then Create workspace (or the upgrade note when the plan is full) and Manage workspaces.
  Layout follows the pattern of Publer and Metricool: brand first, everything below belongs to it.
*/
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Plus, Settings, Lock } from 'lucide-react';
import SocialIcon from './SocialIcon';
import { Button } from './ui';
import { createWorkspace, refreshWorkspaces, switchWorkspace, useWorkspaces, WorkspaceItem } from '../../lib/workspaceStore';

export function WorkspaceAvatar({ ws, size = 32 }: { ws: Pick<WorkspaceItem, 'name' | 'color'>; size?: number }) {
  const letter = (ws.name || '?').trim().charAt(0).toUpperCase();
  return (
    <span className="zd-ws-av" style={{ width: size, height: size, background: ws.color || '#111', fontSize: size * 0.44 }} aria-hidden="true">
      {letter}
    </span>
  );
}

export function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const ws = await createWorkspace(name);
      // Straight to Connections so the new brand gets its accounts
      switchWorkspace(ws.id, '/connections');
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };
  return (
    <div className="zd-ws-modal" role="dialog" aria-modal="true" aria-labelledby="zd-ws-new" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="zd-ws-dialog" onSubmit={submit}>
        <h2 id="zd-ws-new">New workspace</h2>
        <p>One workspace per brand. It gets its own accounts, calendar, inbox, comments, competitors, brand profile and morning plan.</p>
        <label htmlFor="zd-ws-name">Brand name</label>
        <input ref={input} id="zd-ws-name" className="zd-input" value={name} maxLength={40} placeholder="For example Kopi Senja" onChange={(e) => setName(e.target.value)} />
        {err && <p className="zd-ws-err" role="alert">{err}</p>}
        <div className="zd-ws-dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} disabled={!name.trim()}>
            Create workspace
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { state, active } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    refreshWorkspaces();
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!state || !active) return null;
  const full = state.workspaces.length >= state.limit;
  const go = (to: string) => {
    setOpen(false);
    onNavigate?.();
    navigate(to);
  };

  return (
    <div className="zd-ws" ref={root}>
      <button type="button" className={`zd-ws-card ${open ? 'is-open' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <WorkspaceAvatar ws={active} />
        <span className="zd-ws-text">
          <strong>{active.name}</strong>
          <span>{state.workspaces.length > 1 ? `${state.workspaces.length} workspaces` : 'Workspace'}</span>
        </span>
        <ChevronsUpDown size={15} className="zd-ws-chev" />
      </button>

      {open && (
        <div className="zd-ws-menu" role="menu" aria-label="Workspaces">
          <div className="zd-ws-head">Workspaces</div>
          {state.workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              role="menuitemradio"
              aria-checked={w.id === active.id}
              className={`zd-ws-item ${w.id === active.id ? 'is-active' : ''}`}
              onClick={() => (w.id === active.id ? setOpen(false) : switchWorkspace(w.id))}
            >
              <WorkspaceAvatar ws={w} size={28} />
              <span className="zd-ws-item-text">
                <strong>{w.name}</strong>
                <span className="zd-ws-nets">
                  {w.platforms.length ? w.platforms.slice(0, 5).map((p) => <SocialIcon key={p} platform={p} size={13} />) : 'No accounts yet'}
                </span>
              </span>
              {w.id === active.id && <Check size={15} className="zd-ws-check" />}
            </button>
          ))}
          <div className="zd-ws-sep" />
          {full ? (
            <button type="button" role="menuitem" className="zd-ws-action" onClick={() => go('/settings/billing')}>
              <Lock size={15} />
              <span>
                {state.limit <= 1 ? 'Add brands on Pro or Agency' : `All ${state.limit} brands in use. Upgrade for more`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="zd-ws-action"
              onClick={() => {
                setOpen(false);
                setCreating(true);
              }}
            >
              <Plus size={15} /> Create workspace
            </button>
          )}
          <button type="button" role="menuitem" className="zd-ws-action" onClick={() => go('/settings/brands')}>
            <Settings size={15} /> Manage workspaces
          </button>
        </div>
      )}
      {creating && <CreateWorkspaceDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
