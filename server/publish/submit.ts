/*
  Create posts from the Composer (spec 7.4).
  One row per target account, each with its own caption override, first comment
  and platform options. Status follows the approval flow:
    draft -> in_review -> approved -> scheduled -> publishing -> published | failed | needs_action
*/
import { supabaseAdmin, getEffectivePlan } from "../supabaseServer.js";
import { PLAN_LIMITS, withinLimit } from "../creditConfig.js";
import { validatePost, hasErrors, ValidatePlatform, Issue } from "../../src/lib/postValidation.js";
import { publishScheduledPost, idempotencyKeyFor, PublishResult } from "./publisher.js";
import { logActivity } from "../activity.js";
import { zonedToUtc } from "./bulkCsv.js";

/** Default queue slots in the brand time zone, used until 30 days of history give real best times */
export const DEFAULT_QUEUE_SLOTS = ["09:00", "12:30", "19:00"];

/**
 * Next free queue slot (spec 7.4 Autopilot): the first default slot at least
 * 30 minutes from now that is not within 45 minutes of a post already scheduled
 * on the same platform. Pure, exported for tests.
 */
export function nextQueueSlot(taken: Date[], now: Date, timeZone: string, slots = DEFAULT_QUEUE_SLOTS): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  for (let day = 0; day < 60; day++) {
    const d = fmt.format(new Date(now.getTime() + day * 86400000));
    for (const t of slots) {
      const iso = zonedToUtc(d, t, timeZone);
      if (!iso) continue;
      const at = new Date(iso);
      if (at.getTime() < now.getTime() + 30 * 60000) continue;
      if (taken.some((x) => Math.abs(x.getTime() - at.getTime()) < 45 * 60000)) continue;
      return at;
    }
  }
  return new Date(now.getTime() + 3600000);
}

export type SubmitMode = "now" | "schedule" | "queue" | "draft" | "review";

export interface SubmitTarget {
  account_id?: string;
  platform: string;
  caption?: string;
  first_comment?: string;
  platform_options?: Record<string, unknown>;
}

export interface SubmitInput {
  targets: SubmitTarget[];
  caption?: string;
  media_ids?: string[];
  media_attachments?: Array<{ id: string; file_url?: string; url?: string; mime_type?: string }>;
  mode: SubmitMode;
  scheduled_for?: string;
}

const SUPPORTED = new Set(["instagram", "facebook", "tiktok", "linkedin"]);

export async function resolveMedia(userId: string, ids: string[] = [], temp: SubmitInput["media_attachments"] = []) {
  const urls: string[] = [];
  const mimes: string[] = [];
  const real = ids.filter((id) => !id.startsWith("temp_"));
  if (real.length) {
    const { data } = await supabaseAdmin.from("media_library").select("id, blob_url, mime_type").eq("user_id", userId).in("id", real);
    // Keep the order the user picked
    for (const id of real) {
      const r = (data || []).find((x: any) => x.id === id);
      if (r) {
        urls.push(r.blob_url);
        mimes.push(r.mime_type || "");
      }
    }
  }
  for (const id of ids.filter((x) => x.startsWith("temp_"))) {
    const m = (temp || []).find((x) => x.id === id);
    if (m && (m.file_url || m.url)) {
      urls.push((m.file_url || m.url)!);
      mimes.push(m.mime_type || "");
    }
  }
  const mediaType = !urls.length ? "text_only" : mimes[0]?.startsWith("video/") ? "video" : urls.length > 1 ? "carousel" : "image";
  return { urls, mimes, mediaType };
}

export async function postsThisMonth(userId: string): Promise<number> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await supabaseAdmin
    .from("scheduled_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["scheduled", "publishing", "published", "needs_action"])
    .gte("created_at", start.toISOString());
  return count || 0;
}

export interface SubmitOutcome {
  ok: boolean;
  status: number;
  error?: string;
  issues?: Record<string, Issue[]>;
  posts?: Array<{ id: string; platform: string; status: string; result?: PublishResult }>;
}

export async function submitPosts(userId: string, input: SubmitInput): Promise<SubmitOutcome> {
  const targets = (input.targets || []).filter((t) => t && t.platform);
  if (!targets.length) return { ok: false, status: 400, error: "Pick at least one account." };
  const unsupported = targets.filter((t) => !SUPPORTED.has(t.platform));
  if (unsupported.length) return { ok: false, status: 400, error: `${unsupported.map((t) => t.platform).join(", ")} publishing is not available yet.` };

  let when: Date | null = null;
  if (input.mode === "schedule") {
    if (!input.scheduled_for) return { ok: false, status: 400, error: "Pick a date and time." };
    when = new Date(input.scheduled_for);
    if (isNaN(when.getTime())) return { ok: false, status: 400, error: "That date is not valid." };
    if (when.getTime() < Date.now() + 60 * 1000) return { ok: false, status: 400, error: "Pick a time at least one minute from now." };
  }

  const media = await resolveMedia(userId, input.media_ids || [], input.media_attachments || []);

  // Validate every target before writing anything
  const issues: Record<string, Issue[]> = {};
  for (const t of targets) {
    const caption = t.caption ?? input.caption ?? "";
    const list = validatePost(t.platform as ValidatePlatform, { caption, media: media.urls.map((u, i) => ({ url: u, mime: media.mimes[i] })), firstComment: t.first_comment });
    if (list.length) issues[t.account_id || t.platform] = list;
  }
  const blocking = input.mode !== "draft" && Object.values(issues).some(hasErrors);
  if (blocking) return { ok: false, status: 400, error: "Fix the highlighted problems before posting.", issues };

  if (input.mode === "now" || input.mode === "schedule" || input.mode === "queue") {
    const plan = await getEffectivePlan(userId);
    const limit = PLAN_LIMITS[plan].postsPerMonth;
    const used = await postsThisMonth(userId);
    if (!withinLimit(limit, used + targets.length - 1)) {
      return { ok: false, status: 403, error: `Your ${plan} plan includes ${limit} scheduled posts a month and you have used ${used}. Upgrade for unlimited posts.` };
    }
  }

  const status = input.mode === "draft" ? "draft" : input.mode === "review" ? "in_review" : "scheduled";
  let scheduledFor = input.mode === "now" ? new Date().toISOString() : when ? when.toISOString() : null;
  let tz = "UTC";
  if (input.mode === "queue") {
    const { data: st } = await supabaseAdmin.from("user_settings").select("timezone").eq("user_id", userId).maybeSingle();
    tz = st?.timezone || "Asia/Jakarta";
  }
  const posts: SubmitOutcome["posts"] = [];
  for (const t of targets) {
    const caption = t.caption ?? input.caption ?? "";
    if (input.mode === "queue") {
      const { data: taken } = await supabaseAdmin
        .from("scheduled_posts")
        .select("scheduled_for")
        .eq("user_id", userId)
        .eq("platform", t.platform)
        .in("status", ["scheduled", "approved"])
        .gte("scheduled_for", new Date().toISOString());
      scheduledFor = nextQueueSlot((taken || []).map((r: any) => new Date(r.scheduled_for)), new Date(), tz).toISOString();
    }
    const row: any = {
      user_id: userId,
      platform: t.platform,
      platform_account_id: t.account_id || "",
      caption,
      media_urls: media.urls,
      media_type: media.mediaType,
      hashtags: (caption.match(/#[\p{L}\p{N}_]+/gu) || []).map((h) => h.slice(1)),
      scheduled_for: scheduledFor,
      status,
      first_comment: t.first_comment?.trim() || null,
      platform_options: t.platform_options || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin.from("scheduled_posts").insert(row).select().single();
    if (error) return { ok: false, status: 500, error: error.message, posts };
    await supabaseAdmin.from("scheduled_posts").update({ idempotency_key: idempotencyKeyFor(data) }).eq("id", data.id);
    await logActivity(userId, "user", `post.${status}`, "scheduled_post", data.id, { platform: t.platform });
    posts.push({ id: data.id, platform: t.platform, status });
  }

  if (input.mode === "now") {
    for (const p of posts) {
      p.result = await publishScheduledPost(p.id);
      p.status = p.result.status;
    }
  }
  return { ok: true, status: 200, posts, issues };
}
