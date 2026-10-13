/*
  ZieAds writing rule: the em dash (U+2014) and en dash (U+2013) are never used
  anywhere in the product. This module is the single source of truth:

  - NO_EM_DASH_RULE is appended to every AI system prompt.
  - stripDashes() cleans any text before it is shown or saved.
  - deepStripDashes() cleans whole API payloads (see the middleware in app.ts).
  - scripts/check-no-em-dash.mjs fails the build if one sneaks into the source.
*/

const EM = /\u2014/;
const EN = /\u2013/;

export const NO_EM_DASH_RULE =
  "ZieAds writing rule (mandatory): never write the em dash character (U+2014) or the en dash (U+2013). Use a comma, a period, a colon or a plain hyphen instead.";

/** Replace em and en dashes with natural punctuation */
export function stripDashes(input: string): string {
  if (!input || (!EM.test(input) && !EN.test(input))) return input;
  let s = input;
  // Lone dash used as an empty value
  if (/^\s*[\u2014\u2013]\s*$/.test(s)) return "-";
  // Number ranges such as 3 to 5 or 2024 to 2025
  s = s.replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1-$2");
  // Line starting with a dash used as a bullet
  s = s.replace(/^([ \t]*)[\u2014\u2013][ \t]+/gm, "$1- ");
  // Dash between words becomes a comma
  s = s.replace(/[ \t]*[\u2014\u2013][ \t]*/g, ", ");
  // Tidy punctuation the swap can create
  s = s.replace(/,\s*([,.!?;:)])/g, "$1").replace(/\(\s*,\s*/g, "(").replace(/^,\s*/gm, "").replace(/,\s*$/gm, "");
  return s;
}

/** Clean every string inside a JSON-like value */
export function deepStripDashes<T>(value: T, depth = 0): T {
  if (depth > 12 || value === null || value === undefined) return value;
  if (typeof value === "string") return stripDashes(value) as any;
  if (Array.isArray(value)) return value.map((v) => deepStripDashes(v, depth + 1)) as any;
  if (typeof value === "object") {
    if (value instanceof Date || (typeof Buffer !== "undefined" && Buffer.isBuffer(value))) return value;
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) out[k] = deepStripDashes(v, depth + 1);
    return out;
  }
  return value;
}

/** Streaming-safe version for small chunks of model output */
export function stripDashesChunk(chunk: string): string {
  if (!EM.test(chunk) && !EN.test(chunk)) return chunk;
  return chunk.replace(/(\d)[\u2013\u2014](\d)/g, "$1-$2").replace(/ ?[\u2014\u2013] ?/g, ", ").replace(/,\s*([,.!?;:])/g, "$1");
}
