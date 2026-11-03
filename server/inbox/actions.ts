/*
  Inbox actions beyond replying (spec 7.6): hide, delete on the platform,
  AI reply drafts in the brand voice, and intent backfill for older rows.
*/
import { supabaseAdmin } from "../supabaseServer.js";
import { getFacebookPage } from "../facebook/connect.js";
import { hideComment, deleteComment, explainGraphError } from "../utils/facebookApi.js";
import { getConnectedInstagram, callInstagramAPI } from "../utils/instagramHelpers.js";
import { classifyIntent } from "./intent.js";
import { ReplyError } from "./reply.js";
import { logActivity, Actor } from "../activity.js";
import { getBrandProfile, brandProfileToPrompt } from "../brandProfile.js";
import { NO_EM_DASH_RULE, stripDashes } from "../utils/noEmDash.js";

async function loadComment(userId: string, id: string) {
  const { data } = await supabaseAdmin.from("comments_inbox").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (!data) throw new ReplyError("Comment not found.", 404, "not_found");
  return data;
}

async function onPlatform(userId: string, comment: any, op: "hide" | "unhide" | "delete") {
  if (comment.platform === "facebook") {
    const page = await getFacebookPage(userId);
    if (!page) throw new ReplyError("Facebook is not connected. Reconnect it in Connections.", 401, "reconnect_needed");
    try {
      if (op === "delete") await deleteComment(comment.platform_comment_id, page.pageToken);
      else await hideComment(comment.platform_comment_id, page.pageToken, op === "hide");
    } catch (e: any) {
      const x = explainGraphError({ code: e.code, subcode: e.subcode, message: e.message });
      throw new ReplyError(x.reason, x.needsReconnect ? 401 : 502, x.needsReconnect ? "reconnect_needed" : "action_failed");
    }
    return;
  }
  if (comment.platform === "instagram") {
    const conn = await getConnectedInstagram(userId);
    if (!conn) throw new ReplyError("Instagram is not connected. Reconnect it in Connections.", 401, "reconnect_needed");
    try {
      if (op === "delete") await callInstagramAPI(conn.accessToken, comment.platform_comment_id, { method: "DELETE" });
      else await callInstagramAPI(conn.accessToken, `${comment.platform_comment_id}?hide=${op === "hide"}`, { method: "POST" });
    } catch (e: any) {
      throw new ReplyError(`Instagram did not accept that: ${e.message}`, 502, "action_failed");
    }
    return;
  }
  throw new ReplyError(`This action is not available for ${comment.platform} comments yet.`, 400, "unsupported");
}

export async function hideOrDeleteComment(userId: string, id: string, op: "hide" | "unhide" | "delete", actor: Actor = "user") {
  const comment = await loadComment(userId, id);
  await onPlatform(userId, comment, op);
  if (op === "delete") {
    await supabaseAdmin.from("comments_inbox").delete().eq("id", comment.id);
  } else {
    await supabaseAdmin.from("comments_inbox").update({ status: op === "hide" ? "hidden" : "read" }).eq("id", comment.id);
  }
  await logActivity(userId, actor, `comment.${op === "unhide" ? "unhidden" : op === "hide" ? "hidden" : "deleted"}`, "comment", comment.id, { platform: comment.platform });
  return { ok: true };
}

/** Plain fallback drafts when no AI key is configured, written per intent */
export function templateDraft(intent: string, author?: string | null, brandName?: string | null, lang = "English"): string {
  const name = author ? `@${String(author).replace(/^@/, "")} ` : "";
  const id = /indonesia/i.test(lang);
  const by = brandName ? (id ? ` dari ${brandName}` : ` from ${brandName}`) : "";
  if (id) {
    switch (intent) {
      case "buying_signal": return `Halo ${name}terima kasih sudah tertarik! Kami kirim detail harga dan cara order lewat DM ya.`;
      case "complaint": return `Halo ${name}mohon maaf atas pengalaman ini. Boleh DM nomor pesanan kamu? Tim kami${by} bantu cek hari ini.`;
      case "question": return `Halo ${name}pertanyaan bagus! Kami balas detailnya lewat DM ya.`;
      case "praise": return `Terima kasih banyak ${name}senang kamu suka!`;
      default: return `Terima kasih ${name}sudah mampir!`;
    }
  }
  switch (intent) {
    case "buying_signal": return `Hi ${name}thanks for asking! We will send you prices and how to order by DM.`;
    case "complaint": return `Hi ${name}we are sorry about this. Could you DM us your order number? Our team${by} will check it today.`;
    case "question": return `Hi ${name}good question! We will send you the details by DM.`;
    case "praise": return `Thank you so much ${name}we are glad you like it!`;
    default: return `Thanks for stopping by ${name}`.trim() + "!";
  }
}

export async function draftReply(userId: string, id: string): Promise<{ text: string; source: "ai" | "template" }> {
  const comment = await loadComment(userId, id);
  if (comment.status === "replied") throw new ReplyError("This comment already has a reply.", 409, "already_replied");
  const brand = await getBrandProfile(userId).catch(() => null);
  const lang = brand?.identity?.languages?.[0] || "English";
  const intent = comment.intent || classifyIntent(comment.text || "", comment.sentiment).intent;
  let text = "";
  let source: "ai" | "template" = "template";

  if (process.env.ANTHROPIC_API_KEY || process.env.SUMOPOD_API_KEY) {
    try {
      const { getClaudeClient } = await import("../utils/instagramHelpers.js");
      const claude: any = getClaudeClient();
      const msg = await claude.messages.create({
        model: process.env.AGENT_MODEL || "claude-sonnet-4-5",
        max_tokens: 300,
        temperature: 0.4,
        system: `You draft one reply to a social media comment for a brand. Match the brand voice, answer in the language the commenter used (default ${lang}), stay under 300 characters, never promise prices, discounts or dates that are not in the brand profile, move order details and complaints to DM. Return the reply text only. ${NO_EM_DASH_RULE}\n\nBrand profile:\n${brandProfileToPrompt(brand)}`,
        messages: [{ role: "user", content: `Platform: ${comment.platform}\nCommenter: ${comment.author_username || "unknown"}\nIntent: ${intent}\nComment: ${comment.text || ""}` }],
      });
      text = stripDashes(String(msg.content?.[0]?.text || "").trim()).replace(/^"|"$/g, "");
      if (text) source = "ai";
    } catch (e: any) {
      console.warn("[inbox] AI draft failed, using a template:", e?.message);
    }
  }
  if (!text) text = templateDraft(intent, comment.author_username, brand?.identity?.name, lang);
  text = text.slice(0, 2200);
  await supabaseAdmin.from("comments_inbox").update({ reply_text: text }).eq("id", comment.id);
  return { text, source };
}

/** Older rows (and Instagram sync) have no intent yet: classify and store them */
export async function backfillIntent(rows: any[]) {
  const missing = rows.filter((r) => !r.intent);
  for (const r of missing) {
    const x = classifyIntent(r.text || "", r.sentiment);
    r.intent = x.intent;
    r.priority = x.priority;
  }
  // Group by intent so this is a handful of updates, not one per row
  const groups = new Map<string, string[]>();
  for (const r of missing) {
    const k = `${r.intent}|${r.priority}`;
    groups.set(k, [...(groups.get(k) || []), r.id]);
  }
  for (const [k, ids] of groups) {
    const [intent, priority] = k.split("|");
    await supabaseAdmin.from("comments_inbox").update({ intent, priority: Number(priority) }).in("id", ids);
  }
  return missing.length;
}
