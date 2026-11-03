/* Connected social accounts for the sidebar. Fetched once per session and shared by every page,
   refreshed when the Connections page changes something (call refreshConnections). */
import { useEffect, useState } from 'react';
import { api } from './api';

export interface SidebarConnection {
  platform: string;
  connected: boolean;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  status?: string;
}

let cache: SidebarConnection[] | null = null;
let inflight: Promise<SidebarConnection[]> | null = null;
const listeners = new Set<(c: SidebarConnection[]) => void>();

async function fetchAll(): Promise<SidebarConnection[]> {
  try {
    const list = await api<SidebarConnection[]>('/api/auth/connections');
    return (Array.isArray(list) ? list : []).filter((c) => c.connected);
  } catch {
    return [];
  }
}

export function refreshConnections() {
  inflight = fetchAll().then((c) => {
    cache = c;
    inflight = null;
    listeners.forEach((l) => l(c));
    return c;
  });
  return inflight;
}

export function useConnectedAccounts(): SidebarConnection[] | null {
  const [state, setState] = useState<SidebarConnection[] | null>(cache);
  useEffect(() => {
    listeners.add(setState);
    if (!cache && !inflight) refreshConnections();
    else if (cache) setState(cache);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}
