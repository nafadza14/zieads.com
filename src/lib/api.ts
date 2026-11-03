/* Small authed fetch helpers for the dashboard. */
import { supabase } from './supabaseClient';

export async function authHeaders(json = true): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export class ApiError extends Error {
  status: number;
  code?: string;
  body?: any;
  constructor(message: string, status: number, code?: string, body?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
    headers: await authHeaders(),
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let j: any = {};
  try {
    j = text ? JSON.parse(text) : {};
  } catch {
    j = { error: text.slice(0, 200) };
  }
  // Codes like PLAN_LIMIT come with a readable message next to them
  const isCode = typeof j.error === 'string' && /^[A-Z0-9_]+$/.test(j.error);
  if (!res.ok) throw new ApiError((isCode ? j.message : j.error) || j.message || j.error || `Request failed (${res.status})`, res.status, j.code || (isCode ? j.error : undefined), j);
  return j as T;
}
