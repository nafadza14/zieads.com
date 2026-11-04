/*
  Active workspace (one per brand). The id lives in localStorage and every same-origin /api call
  carries it as X-Workspace-Id (installWorkspaceFetch, called once from main.tsx). The server only
  honours it when the signed in person owns that workspace, so a stale id simply falls back to Main.
  Switching reloads the page, so every view, cache and sidebar count shows the new brand at once.
*/
import { useEffect, useState } from 'react';
import { api } from './api';

const KEY = 'zieads.workspace';

export interface WorkspaceItem {
  id: string;
  name: string;
  color: string;
  is_main: boolean;
  accounts: number;
  platforms: string[];
}

export interface WorkspaceState {
  workspaces: WorkspaceItem[];
  limit: number;
  plan: string;
}

export function activeWorkspaceId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function store(id: string | null) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: stays on Main */
  }
}

/** Switch brand and reload on the same page (or on `to`) */
export function switchWorkspace(id: string, to?: string) {
  store(id);
  if (to) window.location.assign(to);
  else window.location.reload();
}

export function clearWorkspace() {
  store(null);
}

const isApi = (url: string) => url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`);

export function installWorkspaceFetch() {
  if ((window as any).__zieWsFetch) return;
  (window as any).__zieWsFetch = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const ws = activeWorkspaceId();
    if (ws && isApi(url)) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('X-Workspace-Id')) headers.set('X-Workspace-Id', ws);
      return orig(input, { ...init, headers });
    }
    return orig(input, init);
  };
}

let cache: WorkspaceState | null = null;
let inflight: Promise<WorkspaceState | null> | null = null;
const listeners = new Set<(s: WorkspaceState | null) => void>();

export function refreshWorkspaces() {
  inflight = api<WorkspaceState>('/api/workspaces')
    .then((s) => {
      // A stored id that is not ours anymore (deleted, other login) falls back to Main
      const id = activeWorkspaceId();
      if (id && !s.workspaces.some((w) => w.id === id)) store(null);
      cache = s;
      return s;
    })
    .catch(() => null)
    .then((s) => {
      inflight = null;
      listeners.forEach((l) => l(s));
      return s;
    });
  return inflight;
}

export function useWorkspaces() {
  const [state, setState] = useState<WorkspaceState | null>(cache);
  useEffect(() => {
    listeners.add(setState);
    if (!cache && !inflight) refreshWorkspaces();
    else if (cache) setState(cache);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  const id = activeWorkspaceId();
  const active = state?.workspaces.find((w) => w.id === id) || state?.workspaces.find((w) => w.is_main) || null;
  return { state, active };
}

export async function createWorkspace(name: string): Promise<WorkspaceItem> {
  const r = await api<{ workspace: WorkspaceItem }>('/api/workspaces', { method: 'POST', body: { name } });
  return r.workspace;
}
