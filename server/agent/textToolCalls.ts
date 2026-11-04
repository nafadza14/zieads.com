/*
  Some models behind OpenAI compatible proxies (MiniMax through Sumopod) sometimes write their tool
  calls as text in their own XML format instead of returning tool_calls:
    ]<]minimax[>[<tool_call> <invoke name="create_draft_posts"> <posts><item><platform>linkedin</platform>...
  or  <invoke name="x"><parameter name="posts">[...]</parameter></invoke>
  This file hides that markup from the chat while it streams, and turns it back into real tool calls
  (arguments coerced to each tool's JSON schema) so the agent still does the work.
*/

const DELIM = /\]<\]minimax\[>\[/g;
const MARKERS = ["]<]minimax[>[", "<tool_call", "<invoke", "<minimax:tool_call"];

/** True when text contains tool call markup */
export const hasToolMarkup = (s: string) => MARKERS.some((m) => s.includes(m));

/** Text before the first tool call marker, with the markup removed */
export function stripToolMarkup(s: string): string {
  let cut = s.length;
  for (const m of MARKERS) {
    const i = s.indexOf(m);
    if (i >= 0 && i < cut) cut = i;
  }
  return s.slice(0, cut).replace(DELIM, "").trimEnd();
}

/** Streaming gate: passes text through until a marker starts, then hides the rest of the round */
export class ToolMarkupGate {
  private buf = "";
  private hidden = false;
  push(chunk: string): string {
    if (this.hidden) return "";
    this.buf += chunk;
    for (const m of MARKERS) {
      const i = this.buf.indexOf(m);
      if (i >= 0) {
        this.hidden = true;
        const out = this.buf.slice(0, i);
        this.buf = "";
        return out;
      }
    }
    // Hold back a tail that could be the start of a marker split across chunks
    let keep = 0;
    for (const m of MARKERS) {
      for (let n = Math.min(m.length - 1, this.buf.length); n > keep; n--) {
        if (this.buf.endsWith(m.slice(0, n))) {
          keep = n;
          break;
        }
      }
    }
    const out = this.buf.slice(0, this.buf.length - keep);
    this.buf = this.buf.slice(this.buf.length - keep);
    return out;
  }
  flush(): string {
    const out = this.hidden ? "" : this.buf;
    this.buf = "";
    return out;
  }
}

type Node = { tag: string; attrs: Record<string, string>; children: Node[]; text: string };

const unescape = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

function parseAttrs(s: string) {
  const out: Record<string, string> = {};
  for (const m of s.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"|([\w:-]+)\s*=\s*'([^']*)'/g)) out[m[1] || m[3]] = m[2] ?? m[4];
  return out;
}

/** A forgiving XML reader: unknown or unclosed tags never throw */
function parseTree(xml: string): Node {
  const root: Node = { tag: "#root", attrs: {}, children: [], text: "" };
  const stack: Node[] = [root];
  const re = /<(\/?)([A-Za-z_][\w:.-]*)([^<>]*?)(\/?)>/g;
  let last = 0;
  for (const m of xml.matchAll(re)) {
    const top = stack[stack.length - 1];
    top.text += xml.slice(last, m.index);
    last = (m.index || 0) + m[0].length;
    const [, close, tag, attrs, selfClose] = m;
    if (close) {
      const at = stack.map((n) => n.tag).lastIndexOf(tag);
      if (at > 0) stack.length = at;
      continue;
    }
    const node: Node = { tag, attrs: parseAttrs(attrs), children: [], text: "" };
    top.children.push(node);
    if (!selfClose) stack.push(node);
  }
  stack[stack.length - 1].text += xml.slice(last);
  return root;
}

function scalar(raw: string): any {
  const t = unescape(raw).trim();
  if (/^[[{]/.test(t)) {
    try {
      return JSON.parse(t);
    } catch {}
  }
  return t;
}

function toValue(n: Node): any {
  if (!n.children.length) return scalar(n.text);
  const tags = n.children.map((c) => c.tag);
  if (tags.every((t) => t === "item") || (tags.length > 1 && tags.every((t) => t === tags[0]) && !n.children[0].attrs.name)) return n.children.map(toValue);
  const obj: Record<string, any> = {};
  for (const c of n.children) {
    const key = c.tag === "parameter" || c.tag === "param" || c.tag === "arg" ? c.attrs.name || c.tag : c.tag;
    if (key in obj) obj[key] = [].concat(obj[key], toValue(c));
    else obj[key] = toValue(c);
  }
  return obj;
}

/** Shapes a parsed value to the tool's JSON schema (arrays from strings, numbers from text) */
export function coerce(v: any, schema: any): any {
  if (!schema) return v;
  const type = schema.type;
  if (type === "array") {
    if (Array.isArray(v)) return v.map((x) => coerce(x, schema.items));
    if (v === "" || v == null) return [];
    if (typeof v === "string") {
      if (schema.items?.type === "string") return v.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
      return [v];
    }
    if (typeof v === "object" && schema.items?.type === "object") {
      // <posts><platform>..</platform>..</posts> with a single post
      const k = Object.keys(v);
      if (k.length === 1 && Array.isArray(v[k[0]])) return v[k[0]].map((x: any) => coerce(x, schema.items));
      return [coerce(v, schema.items)];
    }
    return [coerce(v, schema.items)];
  }
  if (type === "object" && v && typeof v === "object" && !Array.isArray(v)) {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) out[k] = coerce(val, schema.properties?.[k]);
    return out;
  }
  if (type === "number" || type === "integer") {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  if (type === "boolean") return v === true || v === "true";
  if (type === "string" && typeof v !== "string") return v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return v;
}

/** Finds tool calls written as text. Only names in `tools` are returned. */
export function parseTextToolCalls(raw: string, tools: Array<{ name: string; parameters: any }>): Array<{ name: string; args: any }> {
  if (!hasToolMarkup(raw)) return [];
  const xml = raw.replace(DELIM, "");
  const byName = new Map(tools.map((t) => [t.name, t]));
  const out: Array<{ name: string; args: any }> = [];
  const visit = (n: Node) => {
    if (n.tag === "invoke" && n.attrs.name && byName.has(n.attrs.name)) {
      const t = byName.get(n.attrs.name)!;
      let args = n.children.length ? toValue(n) : scalar(n.text);
      if (typeof args !== "object" || args === null || Array.isArray(args)) args = {};
      out.push({ name: t.name, args: coerce(args, t.parameters) });
      return;
    }
    n.children.forEach(visit);
  };
  visit(parseTree(xml));
  return out;
}
