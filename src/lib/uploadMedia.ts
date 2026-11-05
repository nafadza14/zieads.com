/*
  Uploads one file for a post or the AI Agent.
  Vercel functions refuse request bodies over 4.5 MB, so the file goes from the browser straight to
  Vercel Blob (short lived token from /api/v3/media/blob-token) and only its URL is sent to the server.
  Small files fall back to the old form upload when direct upload is not set up.
*/
import { upload } from '@vercel/blob/client';
import { supabase } from './supabaseClient';
import { activeWorkspaceId } from './workspaceStore';

export interface UploadedMedia {
  id: string;
  url: string;
  file_name: string;
  mime_type: string;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
}

const VERCEL_BODY_LIMIT = 4 * 1024 * 1024;

async function authHeaders(): Promise<Record<string, string>> {
  const token = (await supabase.auth.getSession()).data?.session?.access_token;
  const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const ws = activeWorkspaceId();
  if (ws) h['X-Workspace-Id'] = ws;
  return h;
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 413 || /Request Entity Too Large/i.test(text)) return { error: 'This file is too large to upload.' };
    return { error: text.slice(0, 160) || `Upload failed (${res.status})` };
  }
}

/** Width, height and duration read in the browser, so the server never has to download the file */
function measure(file: File): Promise<{ width?: number; height?: number; duration_seconds?: number }> {
  const url = URL.createObjectURL(file);
  const done = <T,>(v: T) => {
    URL.revokeObjectURL(url);
    return v;
  };
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(done({ width: img.naturalWidth, height: img.naturalHeight }));
      img.onerror = () => resolve(done({}));
      img.src = url;
    });
  }
  if (file.type.startsWith('video/')) {
    return new Promise((resolve) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => resolve(done({ width: v.videoWidth, height: v.videoHeight, duration_seconds: v.duration }));
      v.onerror = () => resolve(done({}));
      v.src = url;
    });
  }
  return Promise.resolve(done({}));
}

async function legacyUpload(file: File, skipLibrary: boolean): Promise<UploadedMedia> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/v3/media/upload${skipLibrary ? '?skipLibrary=true' : ''}`, { method: 'POST', headers: await authHeaders(), body: form });
  const j = await readJson(res);
  if (!res.ok || !j.success) throw new Error(j.error || 'Upload failed');
  return j.data;
}

export async function uploadMedia(file: File, opts: { skipLibrary?: boolean; onProgress?: (pct: number) => void } = {}): Promise<UploadedMedia> {
  const skipLibrary = !!opts.skipLibrary;
  const headers = await authHeaders();
  const pre = await fetch('/api/v3/media/upload-prefix', { headers });
  if (pre.status === 501) {
    if (file.size > VERCEL_BODY_LIMIT) throw new Error('Large files need Vercel Blob storage. Ask the admin to connect it.');
    return legacyUpload(file, skipLibrary);
  }
  const p = await readJson(pre);
  if (!pre.ok) throw new Error(p.error || 'Upload failed');

  const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-120) || 'file';
  const [blob, size] = await Promise.all([
    upload(`${p.prefix}${Date.now()}-${safe}`, file, {
      access: 'public',
      handleUploadUrl: '/api/v3/media/blob-token',
      headers,
      contentType: file.type,
      multipart: file.size > 20 * 1024 * 1024,
      onUploadProgress: opts.onProgress ? (e) => opts.onProgress!(Math.round(e.percentage)) : undefined,
    }),
    measure(file),
  ]);

  const res = await fetch(`/api/v3/media/register${skipLibrary ? '?skipLibrary=true' : ''}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: blob.url, pathname: blob.pathname, file_name: file.name, size: file.size, mime_type: file.type, ...size }),
  });
  const j = await readJson(res);
  if (!res.ok || !j.success) throw new Error(j.error || 'Upload failed');
  return j.data;
}
