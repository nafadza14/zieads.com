/*
  Uploads one file for a post or the AI Agent.
  Vercel functions refuse request bodies over 4.5 MB, so the file goes from the browser straight to
  Vercel Blob (short lived token from /api/v3/media/blob-token) and only its URL is sent to the server.
  Without Vercel Blob the browser uploads to Supabase Storage with a one time signed URL instead.
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
  const p = await readJson(pre);
  if (!pre.ok) {
    if (file.size <= VERCEL_BODY_LIMIT) return legacyUpload(file, skipLibrary);
    throw new Error(p.error || 'Upload failed');
  }

  let stored: { url: string; pathname: string };
  const sizeInfo = measure(file);
  if (p.provider === 'supabase') {
    // Supabase Storage: a one time signed URL from the server, then the browser sends the file itself
    const sig = await fetch('/api/v3/media/signed-upload', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: file.name, mime_type: file.type, size: file.size }),
    });
    const s = await readJson(sig);
    if (!sig.ok) throw new Error(s.error || 'Upload failed');
    const { error } = await supabase.storage.from(s.bucket).uploadToSignedUrl(s.path, s.token, file, { contentType: file.type });
    if (error) {
      if (/maximum allowed size|too large|413/i.test(error.message)) throw new Error(`This file is larger than the storage limit (${Math.round(file.size / 1048576)} MB). Use a smaller file or raise the limit in Supabase Storage settings.`);
      throw new Error(error.message);
    }
    stored = { url: supabase.storage.from(s.bucket).getPublicUrl(s.path).data.publicUrl, pathname: s.path };
  } else {
    const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-120) || 'file';
    const blob = await upload(`${p.prefix}${Date.now()}-${safe}`, file, {
      access: 'public',
      handleUploadUrl: '/api/v3/media/blob-token',
      headers,
      contentType: file.type,
      multipart: file.size > 20 * 1024 * 1024,
      onUploadProgress: opts.onProgress ? (e) => opts.onProgress!(Math.round(e.percentage)) : undefined,
    });
    stored = { url: blob.url, pathname: blob.pathname };
  }
  const size = await sizeInfo;

  const res = await fetch(`/api/v3/media/register${skipLibrary ? '?skipLibrary=true' : ''}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: stored.url, pathname: stored.pathname, file_name: file.name, size: file.size, mime_type: file.type, ...size }),
  });
  const j = await readJson(res);
  if (!res.ok || !j.success) throw new Error(j.error || 'Upload failed');
  return j.data;
}
