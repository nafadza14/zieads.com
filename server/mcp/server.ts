/*
  ZieAds MCP server v1 (spec 10). Streamable HTTP transport, stateless:
  every request is one JSON-RPC message (or a batch) answered with JSON.
  Auth: "Authorization: Bearer zk_..." keys made in Settings > API and MCP.
  Keys are stored as SHA-256 hashes, scoped ("read", "draft"), rate limited per
  day by plan (mcpDailyCalls). Every write becomes a pending agent task the user
  approves in ZieAds, unless the key lists that action in auto_approve.
*/
import crypto from "crypto";
import { supabaseAdmin, getEffectivePlan } from "../supabaseServer.js";
import { PLAN_LIMITS } from "../creditConfig.js";
import { logActivity, createAgentTask } from "../activity.js";
import { executeTask } from "../routes/api-tasks.js";
import { computeAnalytics } from "../analytics/report.js";
import { adsSummary } from "../ads/summary.js";
import { submitPosts } from "../publish/submit.js";
import { reliabilityReport } from "../guardian/guardian.js";
import { VIEWS, sortComments } from "../routes/api-inbox.js";
import { backfillIntent } from "../inbox/actions.js";

export const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
export const SERVER_INFO = { name: "zieads", title: "ZieAds", version: "1.0.0" };
export const AUTO_APPROVABLE = ["schedule_post", "send_reply", "add_competitor"] as const;

export interface McpKey {
  id: string;
  user_id: string;
  name: string;
  scopes: string[];
  auto_approve: string[];
}

export const hashKey = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex");

export function newKey(): { raw: string; hash: string; preview: string } {
  const raw = `zk_${crypto.randomBytes(24).toString("base64url")}`;
  return { raw, hash: hashKey(raw), preview: `${raw.slice(0, 6)}...${raw.slice(-4)}` };
}

export async function authenticate(header?: string): Promise<McpKey | null> {
  const raw = String(header || "").replace(/^Bearer\s+/i, "").trim();
  if (!/^zk_[A-Za-z0-9_-]{20,}$/.test(raw)) return null;
  const { data } = await supabaseAdmin.from("mcp_keys").select("id, user_id, name, scopes, auto_approve, revoked_at").eq("key_hash", hashKey(raw)).maybeSingle();
  if (!data || data.revoked_at) return null;
  return data as McpKey;
}

/** Counts the call and says whether it is inside today's plan limit */
export async function countCall(userId: string): Promise<{ ok: boolean; used: number; limit: number }> {
  const plan = await getEffectivePlan(userId);
  const limit = PLAN_LIMITS[plan].mcpDailyCalls;
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin.rpc("increment_mcp_usage", { p_user_id: userId, p_day: day });
  const used = error ? 0 : Number(data) || 0;
  return { ok: limit === -1 || used <= limit, used, limit };
}

type Json = Record<string, any>;
interface Tool {
  name: string;
  title: string;
  description: string;
  scope: "read" | "draft";
  inputSchema: Json;
  annotations: Json;
  run: (key: McpKey, args: Json) => Promise<unknown>;
}

const str = (v: any, max = 2200) => (typeof v === "string" ? v.slice(0, max) : undefined);
const clampDays = (d: any) => ([7, 30, 90, 365].includes(Number(d)) ? Number(d) : 30);

async function writeTask(key: McpKey, kind: (typeof AUTO_APPROVABLE)[number], title: string, payload: Json, detail?: string) {
  const r = await createAgentTask(key.user_id, { kind, title, detail, payload, createdBy: "mcp" });
  const task: any = r.task;
  await logActivity(key.user_id, "mcp", "mcp.task_created", "agent_task", task?.id, { kind, key: key.name });
  if (task && key.auto_approve.includes(kind)) {
    await supabaseAdmin.from("agent_tasks").update({ status: "approved", decided_at: new Date().toISOString() }).eq("id", task.id).eq("status", "pending_approval");
    const out = await executeTask(key.user_id, task);
    await supabaseAdmin.from("agent_tasks").update({ status: out.status, result: out.result, executed_at: new Date().toISOString() }).eq("id", task.id);
    await logActivity(key.user_id, "mcp", `task.${out.status}`, "agent_task", task.id, { kind, auto_approved: true });
    return { task_id: task.id, status: out.status, auto_approved: true, result: out.result };
  }
  return { task_id: task?.id, status: "pending_approval", message: "Waiting for approval in ZieAds (AI Analyst or the approvals list)." };
}

export const TOOLS: Tool[] = [
  {
    name: "get_briefing",
    title: "Today's briefing",
    description: "The latest daily briefing: summary, what needs the user, wins, concerns and the 3 recommended actions.",
    scope: "read",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: async (k) => {
      const { data } = await supabaseAdmin.from("ai_briefings").select("briefing_date, raw_data_snapshot").eq("user_id", k.user_id).order("briefing_date", { ascending: false }).limit(1).maybeSingle();
      return data?.raw_data_snapshot?.briefing || { message: "No briefing yet. Connect an account in ZieAds first." };
    },
  },
  {
    name: "get_analytics",
    title: "Organic and paid results",
    description: "Followers, reach, interactions and engagement per network, top posts, and paid totals from imported ads data, for the last N days.",
    scope: "read",
    inputSchema: { type: "object", properties: { days: { type: "integer", enum: [7, 30, 90, 365], default: 30 }, platform: { type: "string", enum: ["instagram", "facebook", "tiktok", "linkedin"] } }, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: async (k, a) => {
      const plan = await getEffectivePlan(k.user_id);
      const max = PLAN_LIMITS[plan].analyticsHistoryDays;
      const days = clampDays(a.days);
      if (max !== -1 && days > max) throw new McpToolError(`This plan includes ${max} days of history.`);
      const r = await computeAnalytics(k.user_id, days, a.platform);
      return { ...r, organic: { ...r.organic, posts: r.organic.posts.slice(0, 20), series: undefined } };
    },
  },
  {
    name: "get_ads_summary",
    title: "Ads summary",
    description: "Spend, clicks, conversions, revenue and ROAS by platform and top campaigns from ads data the user imported.",
    scope: "read",
    inputSchema: { type: "object", properties: { days: { type: "integer", minimum: 1, maximum: 365, default: 30 } }, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: (k, a) => adsSummary(k.user_id, Math.min(365, Math.max(1, Number(a.days) || 30))),
  },
  {
    name: "list_posts",
    title: "Scheduled and published posts",
    description: "Posts on the ZieAds calendar between two dates, with status (draft, in_review, approved, scheduled, publishing, published, needs_action, failed).",
    scope: "read",
    inputSchema: { type: "object", properties: { from: { type: "string", format: "date-time" }, to: { type: "string", format: "date-time" }, status: { type: "string" } }, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: async (k, a) => {
      const from = a.from ? new Date(a.from) : new Date(Date.now() - 7 * 86400000);
      const to = a.to ? new Date(a.to) : new Date(Date.now() + 30 * 86400000);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) throw new McpToolError("from and to must be ISO dates");
      let q = supabaseAdmin.from("scheduled_posts").select("id, platform, caption, status, scheduled_for, published_at, platform_permalink, error_message").eq("user_id", k.user_id).gte("scheduled_for", from.toISOString()).lte("scheduled_for", to.toISOString()).order("scheduled_for", { ascending: true }).limit(100);
      if (a.status) q = q.eq("status", String(a.status));
      const { data } = await q;
      return { posts: data || [] };
    },
  },
  {
    name: "list_comments",
    title: "Inbox comments",
    description: "Comments from Instagram and Facebook, buying signals and complaints first. view: needs_reply, buying, complaints, questions, all.",
    scope: "read",
    inputSchema: { type: "object", properties: { view: { type: "string", enum: ["needs_reply", "buying", "complaints", "questions", "all"], default: "needs_reply" }, limit: { type: "integer", minimum: 1, maximum: 50, default: 20 } }, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: async (k, a) => {
      const view = VIEWS[a.view] ? a.view : "needs_reply";
      const { data } = await supabaseAdmin.from("comments_inbox").select("id, platform, author_username, text, sentiment, intent, priority, status, posted_at, reply_text").eq("user_id", k.user_id).order("posted_at", { ascending: false }).limit(300);
      const rows = data || [];
      await backfillIntent(rows);
      return { comments: sortComments(rows.filter(VIEWS[view]), "priority").slice(0, Math.min(50, Number(a.limit) || 20)) };
    },
  },
  {
    name: "list_competitors",
    title: "Tracked competitors",
    description: "Competitors tracked in Competitor Hunt with public ad and post counts.",
    scope: "read",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: async (k) => {
      const { data } = await supabaseAdmin.from("competitors").select("id, name, website_url, instagram_username, facebook_url, content_stats").eq("user_id", k.user_id).limit(100);
      return { competitors: data || [] };
    },
  },
  {
    name: "get_guardian_status",
    title: "Account health",
    description: "Connection health, posts that failed or need a manual post, and on-time publishing for the last 7 days.",
    scope: "read",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: async (k) => {
      const [conns, problems, reliability] = await Promise.all([
        supabaseAdmin.from("social_connections").select("platform, platform_username, status, last_synced_at, token_expires_at, last_error_message").eq("user_id", k.user_id).eq("is_active", true),
        supabaseAdmin.from("scheduled_posts").select("id, platform, caption, status, error_message").eq("user_id", k.user_id).in("status", ["failed", "needs_action"]).limit(20),
        reliabilityReport(k.user_id, 7),
      ]);
      return { connections: conns.data || [], problem_posts: problems.data || [], reliability };
    },
  },
  {
    name: "list_pending_actions",
    title: "Waiting for approval",
    description: "Actions waiting for the user's approval in ZieAds, including ones this MCP key created.",
    scope: "read",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: async (k) => {
      const { data } = await supabaseAdmin.from("agent_tasks").select("id, kind, title, detail, created_by, created_at").eq("user_id", k.user_id).eq("status", "pending_approval").order("created_at", { ascending: false }).limit(50);
      return { actions: data || [] };
    },
  },
  {
    name: "create_draft_post",
    title: "Draft a post",
    description: "Create a draft post for one connected account. It lands on the ZieAds calendar as a draft and asks the user to approve scheduling it. Nothing publishes without approval unless the key auto-approves schedule_post.",
    scope: "draft",
    inputSchema: {
      type: "object",
      required: ["platform", "caption"],
      properties: {
        platform: { type: "string", enum: ["instagram", "facebook", "tiktok", "linkedin"] },
        caption: { type: "string", maxLength: 2200 },
        scheduled_for: { type: "string", format: "date-time", description: "When it should go out once approved" },
        media_url: { type: "string", format: "uri", description: "Public https URL of an image or video" },
        first_comment: { type: "string", maxLength: 2200 },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    run: async (k, a) => {
      const caption = str(a.caption);
      if (!caption) throw new McpToolError("caption is required");
      if (a.media_url && !/^https:\/\//.test(String(a.media_url))) throw new McpToolError("media_url must be an https URL");
      const when = a.scheduled_for ? new Date(a.scheduled_for) : null;
      if (when && isNaN(when.getTime())) throw new McpToolError("scheduled_for must be an ISO date");
      const { data: acct } = await supabaseAdmin.from("connected_accounts").select("id").eq("user_id", k.user_id).eq("platform", a.platform).eq("is_active", true).limit(1).maybeSingle();
      if (!acct) throw new McpToolError(`${a.platform} is not connected in ZieAds.`);
      const media = a.media_url ? [{ id: "mcp_media", file_url: String(a.media_url), mime_type: /\.(mp4|mov|m4v|webm)(\?|$)/i.test(String(a.media_url)) ? "video/mp4" : "image/jpeg" }] : [];
      const out = await submitPosts(k.user_id, { targets: [{ platform: a.platform, account_id: acct.id, first_comment: str(a.first_comment) }], caption, media_attachments: media, media_ids: media.map((m) => m.id), mode: "draft" });
      if (!out.ok) throw new McpToolError(out.error || "The post could not be created", out.issues);
      const postId = out.posts![0].id;
      if (when) await supabaseAdmin.from("scheduled_posts").update({ scheduled_for: when.toISOString() }).eq("id", postId);
      const t = await writeTask(k, "schedule_post", `Schedule a ${a.platform} post from ${k.name}`, { post_id: postId, scheduled_for: when?.toISOString() }, caption.slice(0, 200));
      return { post_id: postId, ...t };
    },
  },
  {
    name: "draft_comment_reply",
    title: "Draft a comment reply",
    description: "Save a reply to an Inbox comment and ask the user to approve sending it. Use list_comments to get comment ids.",
    scope: "draft",
    inputSchema: { type: "object", required: ["comment_id", "text"], properties: { comment_id: { type: "string" }, text: { type: "string", maxLength: 2200 } }, additionalProperties: false },
    annotations: { readOnlyHint: false, destructiveHint: false },
    run: async (k, a) => {
      const text = str(a.text);
      if (!text?.trim()) throw new McpToolError("text is required");
      const { data: c } = await supabaseAdmin.from("comments_inbox").select("id, status, author_username, platform").eq("id", String(a.comment_id || "")).eq("user_id", k.user_id).maybeSingle();
      if (!c) throw new McpToolError("Comment not found");
      if (c.status === "replied") throw new McpToolError("This comment already has a reply");
      await supabaseAdmin.from("comments_inbox").update({ reply_text: text }).eq("id", c.id);
      return writeTask(k, "send_reply", `Reply to ${c.author_username || "a comment"} on ${c.platform}`, { comment_id: c.id, text }, text.slice(0, 200));
    },
  },
  {
    name: "add_competitor",
    title: "Track a competitor",
    description: "Ask to add a brand to Competitor Hunt. The user approves it, and plan limits apply.",
    scope: "draft",
    inputSchema: { type: "object", required: ["name"], properties: { name: { type: "string", maxLength: 120 }, website_url: { type: "string" }, instagram_username: { type: "string" } }, additionalProperties: false },
    annotations: { readOnlyHint: false, destructiveHint: false },
    run: async (k, a) => {
      const name = str(a.name, 120)?.trim();
      if (!name) throw new McpToolError("name is required");
      const plan = await getEffectivePlan(k.user_id);
      const limit = PLAN_LIMITS[plan].competitorsPerBrand;
      const { count } = await supabaseAdmin.from("competitors").select("id", { count: "exact", head: true }).eq("user_id", k.user_id);
      if (limit !== -1 && (count || 0) >= limit) throw new McpToolError(`This plan tracks up to ${limit} competitors.`);
      return writeTask(k, "add_competitor", `Track ${name} in Competitor Hunt`, { name, website_url: str(a.website_url, 300) || null, instagram_username: str(a.instagram_username, 60)?.replace(/^@/, "") || null });
    },
  },
];

export class McpToolError extends Error {
  data?: unknown;
  constructor(message: string, data?: unknown) {
    super(message);
    this.data = data;
  }
}

const rpcError = (id: any, code: number, message: string, data?: unknown) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data !== undefined ? { data } : {}) } });

/** Handles one JSON-RPC message. Returns null for notifications. */
export async function handleMessage(key: McpKey, msg: any): Promise<any | null> {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return rpcError(msg?.id, -32600, "Invalid Request");
  const isNotification = msg.id === undefined || msg.id === null;
  if (isNotification) return null;
  const { id, method, params = {} } = msg;
  switch (method) {
    case "initialize": {
      const asked = params.protocolVersion;
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: "ZieAds social media data for one brand. Read tools answer from synced data. Write tools never publish on their own: they create actions the user approves in ZieAds.",
        },
      };
    }
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS.filter((t) => key.scopes.includes(t.scope)).map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })) },
      };
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params.name}`);
      if (!key.scopes.includes(tool.scope)) return rpcError(id, -32602, `This key does not have the "${tool.scope}" scope`);
      try {
        const out = await tool.run(key, params.arguments || {});
        await logActivity(key.user_id, "mcp", "mcp.tool_called", "mcp_key", key.id, { tool: tool.name });
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(out) }], structuredContent: out, isError: false } };
      } catch (e: any) {
        // Tool errors go back to the model as a result it can read and fix
        if (e instanceof McpToolError) return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: e.message }], isError: true } };
        console.error(`[mcp] ${tool.name} failed:`, e);
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: "ZieAds could not finish this request. Try again shortly." }], isError: true } };
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
