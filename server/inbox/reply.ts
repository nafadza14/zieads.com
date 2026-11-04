/*
  Send one comment reply on the comment's own platform. Used by the Inbox,
  by approved agent tasks and by the MCP send_reply tool (after approval).
*/
import { supabaseAdmin } from "../supabaseServer.js";
import { getFacebookPage } from "../facebook/connect.js";
import { commentOnPost, explainGraphError } from "../utils/facebookApi.js";
import { getConnectedInstagram, callInstagramAPI } from "../utils/instagramHelpers.js";
import { logActivity, Actor } from "../activity.js";
import { COMMENT_NETWORKS, replyOnNetwork } from "../social/comments.js";

export class ReplyError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function sendCommentReply(userId: string, commentId: string, text: string, actor: Actor = "user") {
  const reply = String(text || "").trim();
  if (!reply) throw new ReplyError("The reply is empty.", 400, "empty");
  if (reply.length > 2200) throw new ReplyError("Replies are limited to 2200 characters.", 400, "too_long");
  const { data: comment } = await supabaseAdmin.from("comments_inbox").select("*").eq("id", commentId).eq("user_id", userId).maybeSingle();
  if (!comment) throw new ReplyError("Comment not found.", 404, "not_found");
  if (comment.status === "replied") throw new ReplyError("This comment already has a reply.", 409, "already_replied");

  let result: { id: string };
  if (comment.platform === "facebook") {
    const page = await getFacebookPage(userId);
    if (!page) throw new ReplyError("Facebook is not connected. Reconnect it in Connections.", 401, "reconnect_needed");
    try {
      result = await commentOnPost(comment.platform_comment_id, page.pageToken, reply);
    } catch (e: any) {
      const x = explainGraphError({ code: e.code, subcode: e.subcode, message: e.message });
      throw new ReplyError(x.reason, x.needsReconnect ? 401 : 502, x.needsReconnect ? "reconnect_needed" : "reply_failed");
    }
  } else if (comment.platform === "instagram") {
    const conn = await getConnectedInstagram(userId);
    if (!conn) throw new ReplyError("Instagram is not connected. Reconnect it in Connections.", 401, "reconnect_needed");
    try {
      result = await callInstagramAPI<{ id: string }>(conn.accessToken, `${comment.platform_comment_id}/replies`, { method: "POST", body: JSON.stringify({ message: reply }) });
    } catch (e: any) {
      throw new ReplyError(`Instagram rejected the reply: ${e.message}`, 502, "reply_failed");
    }
  } else if (COMMENT_NETWORKS.includes(comment.platform)) {
    try {
      result = await replyOnNetwork(userId, comment, reply);
    } catch (e: any) {
      throw new ReplyError(e.message, e.reconnect ? 401 : 502, e.reconnect ? "reconnect_needed" : "reply_failed");
    }
  } else {
    throw new ReplyError(`Replying to ${comment.platform} comments is not available yet.`, 400, "unsupported");
  }

  const now = new Date().toISOString();
  await supabaseAdmin.from("comments_inbox").update({ status: "replied", replied_at: now, reply_text: reply, reply_platform_id: result.id }).eq("id", comment.id);
  await logActivity(userId, actor, "comment.replied", "comment", comment.id, { platform: comment.platform });
  return { reply_id: result.id, replied_at: now };
}
