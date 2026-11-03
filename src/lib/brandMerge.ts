/* Brand profile merge helpers, shared by Settings and tested in tests/brandMerge.test.ts */
/** Merge a draft into the form without wiping what the user already typed */
export function fillEmpty<T>(current: T, incoming: any): T {
  // null or undefined never overwrite: legacy profile columns are often null
  if (incoming === undefined || incoming === null) return current;
  if (Array.isArray(current)) return (current.length ? current : Array.isArray(incoming) ? incoming : current) as T;
  if (typeof current === 'object' && current) {
    if (typeof incoming !== 'object' || Array.isArray(incoming)) return current;
    const out: any = { ...current };
    for (const k of Object.keys(incoming)) {
      const inc = incoming[k];
      if (inc === undefined || inc === null) continue;
      const cur = (current as any)[k];
      if (cur === undefined || cur === null || cur === '') {
        out[k] = Array.isArray(inc) ? [...inc] : typeof inc === 'object' ? fillEmpty({}, inc) : inc;
      } else {
        out[k] = fillEmpty(cur, inc);
      }
    }
    return out;
  }
  return (current === '' || current === undefined || current === null ? incoming : current) as T;
}

/** Text helper: brand fields can arrive as arrays or numbers from older rows */
export const txt = (v: unknown): string => (Array.isArray(v) ? v.join(', ') : v === undefined || v === null ? '' : typeof v === 'object' ? '' : String(v));

