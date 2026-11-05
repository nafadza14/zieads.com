/*
  The Vercel Blob read-write token. Connecting a store to a project with a custom prefix names the
  variable <PREFIX>_READ_WRITE_TOKEN instead of BLOB_READ_WRITE_TOKEN, so any variable that holds a
  vercel_blob_rw_ token is accepted.
*/
export function blobToken(): string {
  const direct = process.env.BLOB_READ_WRITE_TOKEN;
  if (direct) return direct;
  for (const [k, v] of Object.entries(process.env)) {
    if (k.endsWith("_READ_WRITE_TOKEN") && typeof v === "string" && v.startsWith("vercel_blob_rw_")) return v;
  }
  return "";
}
