/*
  ZieAds AI Agent: runtime
  ------------------------
  A real tool-using agent loop:
    1. The model plans and asks for one or more tools.
    2. All requested tools run IN PARALLEL against the user's own data.
    3. Results go back to the model, which can ask for more tools or answer.
  Progress is reported through `emit` so the UI can show each step live.

  Works with both providers the app supports:
    - Anthropic (ANTHROPIC_API_KEY) using native tool use
    - Sumopod / any OpenAI-compatible endpoint (SUMOPOD_API_KEY) using function calling
*/
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, TOOL_MAP, type ToolContext, type AgentArtifact } from "./tools.js";
import { NO_EM_DASH_RULE, stripDashes, stripDashesChunk } from "../utils/noEmDash.js";

export type AgentEvent =
  | { type: "status"; text: string }
  | { type: "thought"; text: string }
  | { type: "round_start"; round: number }
  | { type: "text_delta"; text: string; round: number }
  | { type: "thinking_delta"; text: string; round: number }
  | { type: "round_end"; round: number; tools: number }
  | { type: "step_start"; id: string; tool: string; label: string; args: any; round: number }
  | { type: "step_end"; id: string; tool: string; ok: boolean; summary: string; ms: number }
  | { type: "artifact"; artifact: AgentArtifact; stepId: string }
  | { type: "final"; text: string };

export interface AgentStep {
  id: string;
  tool: string;
  label: string;
  ok: boolean;
  summary: string;
  ms: number;
  round: number;
}

export interface RunAgentOptions {
  userId: string;
  system: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  /** Current user turn: plain text or Anthropic content blocks (text + image) */
  userContent: string | any[];
  emit: (e: AgentEvent) => void;
  signal?: AbortSignal;
  /** Wall-clock budget in ms; the agent wraps up before this */
  budgetMs?: number;
  maxRounds?: number;
  /** Viewer's UTC offset in minutes, for default posting slots */
  tzOffsetMin?: number;
  /** Filled with everything the agent created during the run */
  artifacts?: AgentArtifact[];
}

const MAX_RESULT_CHARS = 9000;
const TOOL_TIMEOUT_MS = 20000;

const stripThink = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^\s*<think>[\s\S]*$/i, "").trim();
const noEmDash = stripDashes;

async function executeTool(name: string, args: any, ctx: ToolContext): Promise<{ ok: boolean; result: any; summary: string; ms: number }> {
  const tool = TOOL_MAP.get(name);
  const t0 = Date.now();
  if (!tool) return { ok: false, result: { error: `Unknown tool ${name}` }, summary: "Unknown tool", ms: 0 };
  try {
    const result = await Promise.race([
      tool.run(args || {}, ctx),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Tool timed out")), TOOL_TIMEOUT_MS)),
    ]);
    let summary = "Done";
    try {
      summary = tool.summarize ? tool.summarize(result) : "Done";
    } catch {}
    return { ok: true, result, summary, ms: Date.now() - t0 };
  } catch (err: any) {
    const msg = err?.message || "Tool failed";
    return { ok: false, result: { error: msg }, summary: msg, ms: Date.now() - t0 };
  }
}

const serialize = (r: any) => {
  const s = JSON.stringify(r);
  return s.length > MAX_RESULT_CHARS ? s.slice(0, MAX_RESULT_CHARS) + '..."[truncated]"' : s;
};

/** Run every requested call at once and stream progress */
async function runBatch(
  calls: Array<{ id: string; name: string; args: any }>,
  round: number,
  opts: RunAgentOptions,
  steps: AgentStep[],
) {
  const ctx = { userId: opts.userId, tzOffsetMin: opts.tzOffsetMin };
  for (const c of calls) {
    const t = TOOL_MAP.get(c.name);
    opts.emit({ type: "step_start", id: c.id, tool: c.name, label: t?.label || c.name, args: c.args, round });
  }
  return Promise.all(
    calls.map(async (c) => {
      const r = await executeTool(c.name, c.args, ctx);
      const label = TOOL_MAP.get(c.name)?.label || c.name;
      steps.push({ id: c.id, tool: c.name, label, ok: r.ok, summary: r.summary, ms: r.ms, round });
      opts.emit({ type: "step_end", id: c.id, tool: c.name, ok: r.ok, summary: r.summary, ms: r.ms });
      // Things the agent made go to the UI as reviewable cards, not to the model
      let forModel = r.result;
      if (r.ok && r.result && Array.isArray(r.result._artifacts)) {
        const { _artifacts, ...rest } = r.result;
        forModel = rest;
        for (const a of _artifacts as AgentArtifact[]) {
          opts.artifacts?.push(a);
          opts.emit({ type: "artifact", artifact: a, stepId: c.id });
        }
      }
      return { ...c, ...r, content: serialize(forModel) };
    }),
  );
}

const WRAP_UP = "Time to answer. Using the data you already gathered, write the final answer now. Do not request more tools.";

/** Hides <think>...</think> from streamed text (tags may be split across chunks) */
class ThinkFilter {
  private buf = "";
  private inThink = false;
  push(chunk: string): { text: string; thinking: string } {
    this.buf += chunk;
    let text = "";
    let thinking = "";
    for (;;) {
      const tag = this.inThink ? "</think>" : "<think>";
      const i = this.buf.indexOf(tag);
      if (i >= 0) {
        const part = this.buf.slice(0, i);
        if (this.inThink) thinking += part;
        else text += part;
        this.buf = this.buf.slice(i + tag.length);
        this.inThink = !this.inThink;
        continue;
      }
      // Keep a short tail in case a tag is split across chunks
      const keep = Math.min(this.buf.length, tag.length - 1);
      let safe = this.buf.length - keep;
      const lt = this.buf.lastIndexOf("<");
      if (lt < 0 || lt < this.buf.length - keep) safe = this.buf.length;
      else safe = lt;
      const part = this.buf.slice(0, safe);
      this.buf = this.buf.slice(safe);
      if (this.inThink) thinking += part;
      else text += part;
      return { text, thinking };
    }
  }
  flush() {
    const rest = this.buf;
    this.buf = "";
    return this.inThink ? { text: "", thinking: rest } : { text: rest, thinking: "" };
  }
}

const cleanDelta = stripDashesChunk;

/** Emits streamed text for one round; leading whitespace is dropped */
function makeRoundWriter(opts: RunAgentOptions, round: number) {
  const filter = new ThinkFilter();
  let full = "";
  let started = false;
  const out = (r: { text: string; thinking: string }) => {
    if (r.thinking) opts.emit({ type: "thinking_delta", text: r.thinking, round });
    let t = r.text;
    if (!started) {
      t = t.replace(/^\s+/, "");
      if (t) started = true;
    }
    if (t) {
      t = cleanDelta(t);
      full += t;
      opts.emit({ type: "text_delta", text: t, round });
    }
  };
  return {
    push: (chunk: string) => out(filter.push(chunk)),
    thinking: (chunk: string) => chunk && opts.emit({ type: "thinking_delta", text: chunk, round }),
    end: () => {
      out(filter.flush());
      return full.trim();
    },
  };
}

// ─── Anthropic (streaming) ─────────────────────────────────────────────────
async function runAnthropic(opts: RunAgentOptions, steps: AgentStep[]): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: key });
  const model = process.env.AGENT_MODEL || "claude-opus-4-6";
  const tools = AGENT_TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters as any }));
  const deadline = Date.now() + (opts.budgetMs ?? 50000);
  const maxRounds = opts.maxRounds ?? 5;

  const messages: any[] = [...opts.history.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: opts.userContent }];

  for (let round = 1; round <= maxRounds + 1; round++) {
    const mustFinish = round > maxRounds || Date.now() > deadline - 15000;
    if (mustFinish && round > 1) messages.push({ role: "user", content: WRAP_UP });
    opts.emit({ type: "round_start", round });
    const writer = makeRoundWriter(opts, round);
    const stream: any = await client.messages.create(
      { model, max_tokens: 4096, system: opts.system, tools, tool_choice: mustFinish ? { type: "none" } : { type: "auto" }, messages, stream: true },
      { signal: opts.signal },
    );
    const blocks: any[] = [];
    for await (const ev of stream) {
      if (ev.type === "content_block_start") {
        const b = ev.content_block;
        blocks[ev.index] = b.type === "tool_use" ? { type: "tool_use", id: b.id, name: b.name, json: "" } : { type: b.type, text: "" };
      } else if (ev.type === "content_block_delta") {
        const blk = blocks[ev.index];
        if (!blk) continue;
        if (ev.delta.type === "text_delta") {
          blk.text += ev.delta.text;
          writer.push(ev.delta.text);
        } else if (ev.delta.type === "input_json_delta") {
          blk.json += ev.delta.partial_json;
        } else if (ev.delta.type === "thinking_delta") {
          writer.thinking(ev.delta.thinking);
        }
      }
    }
    const text = writer.end();
    const uses = blocks
      .filter((b) => b?.type === "tool_use")
      .map((b) => {
        let input: any = {};
        try {
          input = b.json ? JSON.parse(b.json) : {};
        } catch {}
        return { type: "tool_use", id: b.id, name: b.name, input };
      });
    opts.emit({ type: "round_end", round, tools: mustFinish ? 0 : uses.length });
    if (!uses.length || mustFinish) return text;

    const assistantContent: any[] = [];
    const rawText = blocks.filter((b) => b?.type === "text").map((b) => b.text).join("");
    if (rawText.trim()) assistantContent.push({ type: "text", text: rawText });
    assistantContent.push(...uses);
    messages.push({ role: "assistant", content: assistantContent });
    const results = await runBatch(uses.map((u) => ({ id: u.id, name: u.name, args: u.input })), round, opts, steps);
    messages.push({ role: "user", content: results.map((r) => ({ type: "tool_result", tool_use_id: r.id, content: r.content, is_error: !r.ok })) });
  }
  return "";
}

// ─── OpenAI compatible (Sumopod), streaming ────────────────────────────────
function toOpenAIContent(content: string | any[]) {
  if (typeof content === "string") return content;
  return content.map((b) =>
    b.type === "image" ? { type: "image_url", image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } } : { type: "text", text: b.text },
  );
}

async function runOpenAICompatible(opts: RunAgentOptions, steps: AgentStep[]): Promise<string> {
  const apiKey = process.env.SUMOPOD_API_KEY;
  if (!apiKey) throw new Error("SUMOPOD_API_KEY not set");
  const endpoint = process.env.AGENT_OPENAI_ENDPOINT || "https://ai.sumopod.com/v1/chat/completions";
  const model = process.env.AGENT_OPENAI_MODEL || "MiniMax-M2.7-highspeed";
  const tools = AGENT_TOOLS.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } }));
  const deadline = Date.now() + (opts.budgetMs ?? 50000);
  const maxRounds = opts.maxRounds ?? 5;

  const messages: any[] = [
    { role: "system", content: opts.system },
    ...opts.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: toOpenAIContent(opts.userContent) },
  ];

  for (let round = 1; round <= maxRounds + 1; round++) {
    const mustFinish = round > maxRounds || Date.now() > deadline - 15000;
    if (mustFinish && round > 1) messages.push({ role: "user", content: WRAP_UP });
    opts.emit({ type: "round_start", round });
    const writer = makeRoundWriter(opts, round);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, tools, tool_choice: mustFinish ? "none" : "auto", parallel_tool_calls: true, max_tokens: 4096, temperature: 0.4, stream: true }),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`AI provider error (${res.status}): ${(await res.text()).slice(0, 300)}`);

    let rawContent = "";
    const calls: Array<{ id: string; name: string; args: string }> = [];
    const onDelta = (d: any) => {
      if (!d) return;
      if (typeof d.reasoning_content === "string") writer.thinking(d.reasoning_content);
      if (typeof d.content === "string" && d.content) {
        rawContent += d.content;
        writer.push(d.content);
      }
      for (const tc of d.tool_calls || []) {
        const i = typeof tc.index === "number" ? tc.index : calls.length;
        const c = (calls[i] ||= { id: "", name: "", args: "" });
        if (tc.id) c.id = tc.id;
        if (tc.function?.name) c.name += tc.function.name;
        if (tc.function?.arguments) c.args += tc.function.arguments;
      }
    };

    const type = res.headers.get("content-type") || "";
    if (!res.body || type.includes("application/json")) {
      // Provider ignored stream:true; the UI still reveals the text gradually
      const data: any = await res.json();
      const m = data.choices?.[0]?.message || {};
      onDelta({ content: m.content, reasoning_content: m.reasoning_content, tool_calls: (m.tool_calls || []).map((t: any, index: number) => ({ ...t, index })) });
    } else {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            onDelta(JSON.parse(payload).choices?.[0]?.delta);
          } catch {}
        }
      }
    }

    const text = writer.end();
    const valid = calls.filter((c) => c && c.name);
    opts.emit({ type: "round_end", round, tools: mustFinish ? 0 : valid.length });
    if (!valid.length || mustFinish) return text;

    const parsed = valid.map((c, i) => {
      let args: any = {};
      try {
        args = c.args ? JSON.parse(c.args) : {};
      } catch {}
      return { id: c.id || `call_${round}_${i}`, name: c.name, args, rawArgs: c.args || "{}" };
    });
    messages.push({
      role: "assistant",
      content: rawContent || "",
      tool_calls: parsed.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: c.rawArgs } })),
    });
    const results = await runBatch(parsed, round, opts, steps);
    for (const r of results) messages.push({ role: "tool", tool_call_id: r.id, content: r.content });
  }
  return "";
}

/** Run the agent and return the final answer plus every step it took */
export async function runAgent(opts: RunAgentOptions): Promise<{ text: string; steps: AgentStep[]; artifacts: AgentArtifact[] }> {
  const steps: AgentStep[] = [];
  opts.artifacts = opts.artifacts || [];
  opts.emit({ type: "status", text: "Planning" });
  const useAnthropic = !process.env.SUMOPOD_API_KEY && !!process.env.ANTHROPIC_API_KEY;
  const raw = useAnthropic ? await runAnthropic(opts, steps) : await runOpenAICompatible(opts, steps);
  const text = noEmDash(stripThink(raw)) || "I gathered the data but could not write an answer. Please try again.";
  opts.emit({ type: "final", text });
  return { text, steps, artifacts: opts.artifacts };
}

/** Agent behaviour rules appended to the strategist system prompt */
export const AGENT_INSTRUCTIONS = `
## How you work: you are an agent that DOES the work, not a chatbot
You can read the user's real ZieAds data and act inside every ZieAds feature. Everything you create is a draft the user reviews and edits, so act confidently.

Read tools: list_connected_accounts, get_account_metrics, get_post_performance, get_live_instagram, get_inbox_summary, list_comments, get_content_calendar, list_media_library, get_competitors, get_latest_briefing, get_audit_and_profile, scan_website.
Action tools (all reviewable, nothing goes live on its own):
- create_draft_posts: write posts and place them on the calendar as drafts on concrete dates and times (Calendar and Composer).
- update_draft_post: change a draft's caption, hashtags or time.
- draft_comment_replies: save suggested replies on Inbox comments (the user sends them).
- add_competitor: start tracking a competitor in Competitor Hunt.

Rules
1. Facts first: before answering anything about their accounts, content, audience, comments, results, competitors or plans, CALL TOOLS. Never invent numbers. If data is missing, say so and how to fix it (connect an account, wait for sync).
2. Parallel by default: request every independent tool in the SAME turn so they run at once.
3. Do the task, do not describe it. "Make posts" means call create_draft_posts. "Reply to comments" means list_comments then draft_comment_replies. "Track X" means add_competitor. For a content plan, base formats, topics and posting times on get_post_performance, and fill empty calendar days from get_content_calendar.
4. Scheduling: use the user's local timezone offset given below, real future dates, and spread posts across days. Write complete, ready-to-post captions in the brand voice and the user's language, with relevant hashtags in the hashtags field.
5. Comment analysis: group comments into themes (questions, complaints, praise, purchase intent), quantify each, quote 1 or 2 short examples, then draft replies for the ones that need one.
6. After acting, tell the user what you made and that the cards below the answer let them edit, approve or send each item, or open it in Calendar, Composer, Inbox or Competitor Hunt. Never claim something was published or sent.
7. For general strategy questions that need no data, answer directly without tools.
8. Final answer: lead with the key finding using real numbers, then a short ranked action list. Use markdown tables when comparing. Reply in the user's language.
9. ${NO_EM_DASH_RULE}`;
