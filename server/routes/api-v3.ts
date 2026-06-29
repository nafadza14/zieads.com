import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import {
  generateDailyBriefing,
  detectAnomalies,
  analyzeCommentSentiment
} from "../v3-agents.js";
import { runFullAudit, type BusinessContext } from "../agents.js";
import { synthesizeReport } from "../scorer.js";
import { scrapeUrl } from "../scraper.js";

export const apiV3Router = Router();

// Middleware to enforce authentication
async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

// Helper to determine the next scheduled time based on queue slots
async function getNextQueueTime(userId: string, accountId: string): Promise<Date> {
  const { data: slots } = await supabaseAdmin
    .from("queue_slots")
    .select("*")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("time_of_day", { ascending: true });

  if (!slots || slots.length === 0) {
    // Default fallback: 1 hour from now
    return new Date(Date.now() + 3600 * 1000);
  }

  // Find latest scheduled post in queue to schedule after it
  const { data: latestPost } = await supabaseAdmin
    .from("scheduled_posts")
    .select("scheduled_for")
    .eq("user_id", userId)
    .eq("is_part_of_queue", true)
    .eq("status", "queued")
    .order("scheduled_for", { ascending: false })
    .limit(1)
    .maybeSingle();

  let baseDate = new Date();
  if (latestPost && latestPost.scheduled_for) {
    baseDate = new Date(latestPost.scheduled_for);
  }

  // Find the next slot after baseDate
  const baseDay = baseDate.getDay(); // 0 = Sunday
  const baseTimeStr = baseDate.toTimeString().split(" ")[0]; // "HH:MM:SS"

  // Sort slots starting from baseDay
  const sortedSlots = [...slots].sort((a, b) => {
    const diffA = (a.day_of_week - baseDay + 7) % 7;
    const diffB = (b.day_of_week - baseDay + 7) % 7;
    if (diffA !== diffB) return diffA - diffB;
    return a.time_of_day.localeCompare(b.time_of_day);
  });

  // Pick first slot that is in the future
  for (const slot of sortedSlots) {
    const daysOffset = (slot.day_of_week - baseDay + 7) % 7;
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + daysOffset);
    
    const [h, m, s] = slot.time_of_day.split(":");
    targetDate.setHours(parseInt(h), parseInt(m), parseInt(s || "0"), 0);

    if (targetDate.getTime() > baseDate.getTime()) {
      return targetDate;
    }
  }

  // If no slot matches or fits this week, schedule for first slot next week
  const slot = sortedSlots[0];
  const daysOffset = ((slot.day_of_week - baseDay + 7) % 7) || 7;
  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + daysOffset);
  
  const [h, m, s] = slot.time_of_day.split(":");
  targetDate.setHours(parseInt(h), parseInt(m), parseInt(s || "0"), 0);
  return targetDate;
}

// ─── Connected Accounts ──────────────────────────────────────────────────────
apiV3Router.get("/connections", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("connected_accounts")
      .select("*")
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/connections", requireAuth, async (req: any, res) => {
  const { platform, accountHandle, connectionMethod, metadata } = req.body;
  if (!platform || !accountHandle) {
    return res.status(400).json({ error: "platform and accountHandle are required" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("connected_accounts")
      .upsert({
        user_id: req.userId,
        platform,
        platform_account_id: `mock_${platform}_${Date.now()}`,
        account_handle: accountHandle,
        connection_method: connectionMethod || "oauth",
        is_active: true,
        connected_at: new Date().toISOString(),
        metadata: metadata || {},
      }, { onConflict: "user_id,platform,platform_account_id" })
      .select();

    if (error) throw error;

    // Trigger initial mock data async
    setTimeout(async () => {
      try {
        const mockPosts = [
          { content: `Loving this new analytics setup on ZieAds! 📊 #socialmedia #business`, likes: 34, comments: 8, reach: 350 },
          { content: `Tip of the day: consistency beats viral spikes every time. Here's why:`, likes: 98, comments: 19, reach: 950 },
          { content: `Checking our scheduled content lineup for this week. Super clean.`, likes: 142, comments: 27, reach: 1800 }
        ];

        for (const post of mockPosts) {
          const { data: insertedPost } = await supabaseAdmin.from("social_posts").insert({
            account_id: data[0].id,
            user_id: req.userId,
            platform,
            platform_post_id: `post_${platform}_${Math.random().toString(36).slice(2, 9)}`,
            content_text: post.content,
            media_type: "text_only",
            posted_at: new Date(Date.now() - Math.random() * 5 * 24 * 3600 * 1000).toISOString(),
            raw_metrics: { likes: post.likes, comments: post.comments },
          }).select().single();

          if (insertedPost) {
            await supabaseAdmin.from("metric_snapshots").insert({
              post_id: insertedPost.id,
              account_id: data[0].id,
              user_id: req.userId,
              likes: post.likes,
              comments: post.comments,
              reach: post.reach,
              engagement_rate: Number(((post.likes + post.comments) / post.reach).toFixed(4)),
              captured_at: new Date().toISOString()
            });
          }
        }

        // Mock 3 user comments in comment_inbox
        const mockComments = [
          { handle: "@alex_digital", text: "This tool looks amazing! Is there X integration?", sentiment: "positive" },
          { handle: "@sarah_k", text: "I have some issues trying to sync my Facebook account. Can you help?", sentiment: "negative" },
          { handle: "@mike_ads", text: "Thanks for the tips, really useful thread.", sentiment: "neutral" }
        ];

        for (const c of mockComments) {
          await supabaseAdmin.from("comment_inbox").insert({
            user_id: req.userId,
            account_id: data[0].id,
            platform,
            platform_comment_id: `comment_${platform}_${Math.random().toString(36).substring(2,9)}`,
            commenter_handle: c.handle,
            commenter_display_name: c.handle.substring(1),
            comment_text: c.text,
            commented_at: new Date(Date.now() - Math.random() * 24 * 3600 * 1000).toISOString(),
            sentiment: c.sentiment,
            is_archived: false,
            user_has_replied: false
          });
        }

      } catch (err) {
        console.error("[V3 Connections Async Mocks] failed:", err);
      }
    }, 500);

    res.json({ success: true, data: data[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.delete("/connections/:id", requireAuth, async (req: any, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("connected_accounts")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Media Library ───────────────────────────────────────────────────────────
apiV3Router.get("/media", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("media_library")
      .select("*")
      .eq("user_id", req.userId)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/media", requireAuth, async (req: any, res) => {
  const { fileType, fileUrl, fileSize, originalFilename } = req.body;
  if (!fileType || !fileUrl) {
    return res.status(400).json({ error: "fileType and fileUrl are required" });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("media_library")
      .insert({
        user_id: req.userId,
        file_type: fileType,
        file_url: fileUrl,
        file_size_bytes: fileSize || 0,
        original_filename: originalFilename || "file.jpg",
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.delete("/media/:id", requireAuth, async (req: any, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("media_library")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Composer & Scheduling ───────────────────────────────────────────────────
apiV3Router.get("/scheduler/posts", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", req.userId)
      .order("scheduled_for", { ascending: true, nullsLast: true });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/scheduler/posts", requireAuth, async (req: any, res) => {
  const { status, scheduledFor, publishMethod, targetPlatforms, contentText, mediaAttachments, firstComment, platformSpecificOverrides, isPartOfQueue } = req.body;
  
  try {
    let finalScheduledTime = scheduledFor ? new Date(scheduledFor).toISOString() : null;
    let finalQueueSlotId = null;

    if (isPartOfQueue && targetPlatforms && targetPlatforms.length > 0) {
      // Calculate next available slot
      const nextTime = await getNextQueueTime(req.userId, targetPlatforms[0].account_id);
      finalScheduledTime = nextTime.toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("scheduled_posts")
      .insert({
        user_id: req.userId,
        status: status || "draft",
        scheduled_for: finalScheduledTime,
        publish_method: publishMethod || "direct_api",
        target_platforms: targetPlatforms || [],
        content_text: contentText || "",
        media_attachments: mediaAttachments || [],
        first_comment: firstComment || "",
        platform_specific_overrides: platformSpecificOverrides || {},
        is_part_of_queue: isPartOfQueue || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.put("/scheduler/posts/:id", requireAuth, async (req: any, res) => {
  const { status, scheduledFor, publishMethod, targetPlatforms, contentText, mediaAttachments, firstComment, platformSpecificOverrides, isPartOfQueue } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from("scheduled_posts")
      .update({
        status,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        publish_method: publishMethod,
        target_platforms: targetPlatforms,
        content_text: contentText,
        media_attachments: mediaAttachments,
        first_comment: firstComment,
        platform_specific_overrides: platformSpecificOverrides,
        is_part_of_queue: isPartOfQueue,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.delete("/scheduler/posts/:id", requireAuth, async (req: any, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("scheduled_posts")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Queue Slots ─────────────────────────────────────────────────────────────
apiV3Router.get("/scheduler/queue-slots", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("queue_slots")
      .select("*")
      .eq("user_id", req.userId)
      .order("day_of_week", { ascending: true })
      .order("time_of_day", { ascending: true });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/scheduler/queue-slots", requireAuth, async (req: any, res) => {
  const { accountId, dayOfWeek, timeOfDay } = req.body;
  if (!accountId || dayOfWeek === undefined || !timeOfDay) {
    return res.status(400).json({ error: "accountId, dayOfWeek, and timeOfDay are required" });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("queue_slots")
      .insert({
        user_id: req.userId,
        account_id: accountId,
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.delete("/scheduler/queue-slots/:id", requireAuth, async (req: any, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("queue_slots")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Calendar View ────────────────────────────────────────────────────────────
apiV3Router.get("/calendar/events", requireAuth, async (req: any, res) => {
  try {
    // 1. Fetch scheduled posts
    const { data: scheduled } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", req.userId);

    // 2. Fetch already published posts (from social_posts)
    const { data: published } = await supabaseAdmin
      .from("social_posts")
      .select("*, connected_accounts(account_handle)")
      .eq("user_id", req.userId);

    const events = [
      ...(scheduled || []).map(p => ({
        id: p.id,
        title: p.content_text ? p.content_text.slice(0, 30) + (p.content_text.length > 30 ? "..." : "") : "Untitled Post",
        start: p.scheduled_for,
        type: "scheduled",
        status: p.status,
        platforms: p.target_platforms || [],
        media: p.media_attachments || []
      })),
      ...(published || []).map(p => ({
        id: p.id,
        title: p.content_text ? p.content_text.slice(0, 30) + (p.content_text.length > 30 ? "..." : "") : "Published Post",
        start: p.posted_at,
        type: "published",
        status: "published",
        platforms: [{ platform: p.platform, account_handle: p.connected_accounts?.account_handle }],
        media: p.media_urls || []
      }))
    ];

    res.json({ success: true, data: events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Analytics Summary ────────────────────────────────────────────────────────
apiV3Router.get("/analytics/summary", requireAuth, async (req: any, res) => {
  try {
    const { data: posts } = await supabaseAdmin
      .from("social_posts")
      .select("*")
      .eq("user_id", req.userId);

    const { data: snapshots } = await supabaseAdmin
      .from("metric_snapshots")
      .select("*")
      .eq("user_id", req.userId)
      .order("captured_at", { ascending: false });

    // Aggregate stats
    const totalPosts = posts?.length || 0;
    const totalLikes = snapshots?.reduce((sum, s) => sum + (s.likes || 0), 0) || 0;
    const totalComments = snapshots?.reduce((sum, s) => sum + (s.comments || 0), 0) || 0;
    const totalImpressions = snapshots?.reduce((sum, s) => sum + (s.impressions || 0), 0) || 0;

    // Follower counts
    const latestFollowers = snapshots?.[0]?.follower_count_at_capture || 1200;
    const baselineFollowers = snapshots?.[snapshots.length - 1]?.follower_count_at_capture || 1100;
    const followerGrowth = latestFollowers - baselineFollowers;

    res.json({
      success: true,
      data: {
        totalPosts,
        totalLikes,
        totalComments,
        totalImpressions,
        latestFollowers,
        followerGrowth,
        engagementRate: totalImpressions > 0 ? Number(((totalLikes + totalComments) / totalImpressions).toFixed(4)) : 0.042
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Unified Inbox ───────────────────────────────────────────────────────────
apiV3Router.get("/inbox/comments", requireAuth, async (req: any, res) => {
  const { sentiment, isArchived } = req.query;
  try {
    let query = supabaseAdmin
      .from("comment_inbox")
      .select("*, social_posts(content_text)")
      .eq("user_id", req.userId);

    if (sentiment) {
      query = query.eq("sentiment", sentiment);
    }
    if (isArchived !== undefined) {
      query = query.eq("is_archived", isArchived === "true");
    } else {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query.order("commented_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/inbox/comments/:id/reply", requireAuth, async (req: any, res) => {
  const { replyText } = req.body;
  if (!replyText) return res.status(400).json({ error: "replyText is required" });

  try {
    // 1. Fetch comment details
    const { data: comment, error: fetchErr } = await supabaseAdmin
      .from("comment_inbox")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .single();

    if (fetchErr || !comment) throw new Error("Comment not found");

    // 2. Insert user reply locally
    const { data: reply, error: replyErr } = await supabaseAdmin
      .from("comment_replies")
      .insert({
        comment_inbox_id: comment.id,
        user_id: req.userId,
        reply_text: replyText,
        send_status: "sent",
        platform_reply_id: `reply_${comment.platform}_${Date.now()}`
      })
      .select()
      .single();

    if (replyErr) throw replyErr;

    // 3. Mark comment as replied
    await supabaseAdmin
      .from("comment_inbox")
      .update({ user_has_replied: true, user_replied_at: new Date().toISOString() })
      .eq("id", comment.id);

    res.json({ success: true, data: reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/inbox/comments/:id/archive", requireAuth, async (req: any, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("comment_inbox")
      .update({ is_archived: true })
      .eq("id", req.params.id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Best Time to Post heatmap ────────────────────────────────────────────────
apiV3Router.get("/analytics/best-times", requireAuth, async (req: any, res) => {
  try {
    // Top deterministic posting times
    const bestTimes = [
      { day: "Tuesday", time: "11:00 AM", confidence: 0.94 },
      { day: "Thursday", time: "02:00 PM", confidence: 0.88 },
      { day: "Wednesday", time: "09:00 AM", confidence: 0.82 }
    ];
    res.json({ success: true, data: bestTimes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Paid Ads CSV Upload ──────────────────────────────────────────────────────
apiV3Router.post("/ads/upload", requireAuth, async (req: any, res) => {
  const { platform, rows } = req.body;
  if (!platform || !rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: "platform and rows (array) are required" });
  }

  try {
    const uploadedAt = new Date().toISOString();
    const insertPayloads = rows.map((row: any) => {
      const spend = parseFloat(row.spend || row.cost || row.spend_usd || row["Amount Spent USD"] || row["Cost"] || "0");
      const revenue = parseFloat(row.revenue || row.revenue_usd || row.value || row["Conv value"] || row["Total Conversion Value"] || "0");
      const impressions = parseInt(row.impressions || row["Impressions"] || "0");
      const clicks = parseInt(row.clicks || row["Clicks"] || "0");
      const conversions = parseInt(row.conversions || row["Conversions"] || "0");
      
      const ctr = impressions > 0 ? clicks / impressions : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        user_id: req.userId,
        platform,
        campaign_id: row.campaign_id || row.id || `csv_${Math.random().toString(36).substring(2, 9)}`,
        campaign_name: row.campaign_name || row.campaign || row["Campaign Name"] || row["Campaign"] || "Unnamed Campaign",
        ad_set_id: row.ad_set_id || row.ad_group_id || null,
        ad_set_name: row.ad_set_name || row.ad_group || row["Ad Set Name"] || row["Ad group"] || null,
        ad_id: row.ad_id || null,
        ad_name: row.ad_name || row["Ad Name"] || null,
        date_range_start: row.date_start || row.day || row.date || new Date().toISOString().slice(0, 10),
        date_range_end: row.date_end || row.day || row.date || new Date().toISOString().slice(0, 10),
        impressions,
        clicks,
        spend_usd: spend,
        conversions,
        revenue_usd: revenue,
        ctr,
        cpc,
        cpm,
        roas,
        data_source: "csv_upload",
        uploaded_at: uploadedAt,
        raw_row: row,
      };
    });

    const { error } = await supabaseAdmin.from("ad_data").insert(insertPayloads);
    if (error) throw error;

    res.json({ success: true, count: insertPayloads.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Daily Briefing ────────────────────────────────────────────────────────
apiV3Router.get("/analyst/briefing", requireAuth, async (req: any, res) => {
  const briefingDate = new Date().toISOString().slice(0, 10);
  try {
    let { data: briefing, error } = await supabaseAdmin
      .from("daily_briefings")
      .select("*")
      .eq("user_id", req.userId)
      .eq("briefing_date", briefingDate)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!briefing) {
      console.log(`[V3 API] No briefing found for date ${briefingDate}. Generating now...`);
      briefing = await generateDailyBriefing(req.userId);
    }

    res.json({ success: true, data: briefing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Competitor Hunt ──────────────────────────────────────────────────────────
apiV3Router.get("/hunt/competitors", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tracked_competitors")
      .select("*")
      .eq("user_id", req.userId)
      .order("added_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/hunt/competitors", requireAuth, async (req: any, res) => {
  const { competitorUrl, competitorName } = req.body;
  if (!competitorUrl || !competitorName) {
    return res.status(400).json({ error: "competitorUrl and competitorName are required" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("tracked_competitors")
      .insert({
        user_id: req.userId,
        competitor_url: competitorUrl,
        competitor_name: competitorName,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/hunt/audit", requireAuth, async (req: any, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id of competitor is required" });

  try {
    const { data: competitor, error: fetchError } = await supabaseAdmin
      .from("tracked_competitors")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.userId)
      .single();

    if (fetchError || !competitor) throw new Error("Competitor not found");

    const scrapedData = await scrapeUrl(competitor.competitor_url);
    const context: BusinessContext = {
      url: competitor.competitor_url,
      businessName: competitor.competitor_name,
      businessType: scrapedData.inferredBusinessType || "E-Commerce",
      primaryGoal: "Generate sales",
      monthlyBudget: "Not specified",
      platforms: [],
      scrapedData,
    };

    const agentResults = await runFullAudit(context);
    const report = synthesizeReport(agentResults);

    const newHistory = [...(competitor.audit_history || []), {
      score: report.overall,
      grade: report.grade,
      audited_at: new Date().toISOString(),
      report: report,
    }];

    const { error: updateError } = await supabaseAdmin
      .from("tracked_competitors")
      .update({
        latest_audit_score: report.overall,
        last_audited_at: new Date().toISOString(),
        audit_history: newHistory,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    res.json({ success: true, score: report.overall, grade: report.grade });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Alerts & Anomaly Management ──────────────────────────────────────────────
apiV3Router.get("/alerts", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("anomaly_alerts")
      .select("*")
      .eq("user_id", req.userId)
      .is("acknowledged_at", null)
      .order("triggered_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/alerts/acknowledge", requireAuth, async (req: any, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id is required" });
  try {
    const { error } = await supabaseAdmin
      .from("anomaly_alerts")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Scheduler Queue Daemon Cron ──────────────────────────────────────────────
apiV3Router.post("/publish/cron", async (req, res) => {
  console.log("[V3 Publisher Cron] Checking for pending scheduled posts...");
  try {
    const now = new Date().toISOString();

    // Fetch posts due to be published
    const { data: posts, error } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (error) throw error;

    let publishedCount = 0;

    for (const post of (posts || [])) {
      try {
        // Mark status as publishing
        await supabaseAdmin
          .from("scheduled_posts")
          .update({ status: "publishing", publish_attempted_at: new Date().toISOString() })
          .eq("id", post.id);

        // Simulate publishing across target platforms
        const targets = post.target_platforms || [];
        for (const target of targets) {
          const mockPostId = `platform_pub_${Math.random().toString(36).substring(2, 9)}`;

          // 1. Insert social post history
          const { data: insertedPost } = await supabaseAdmin
            .from("social_posts")
            .insert({
              account_id: target.account_id,
              user_id: post.user_id,
              platform: target.platform,
              platform_post_id: mockPostId,
              content_text: post.content_text,
              media_type: post.media_attachments?.length > 0 ? "image" : "text_only",
              media_urls: post.media_attachments?.map((m: any) => m.file_url) || [],
              posted_at: new Date().toISOString(),
              scheduled_post_id: post.id
            })
            .select()
            .single();

          // 2. Insert initial metric snapshots
          if (insertedPost) {
            await supabaseAdmin.from("metric_snapshots").insert({
              post_id: insertedPost.id,
              account_id: target.account_id,
              user_id: post.user_id,
              likes: 0,
              comments: 0,
              reach: 10,
              engagement_rate: 0.0,
              captured_at: new Date().toISOString()
            });
          }

          // 3. Log success
          await supabaseAdmin.from("publish_log").insert({
            scheduled_post_id: post.id,
            user_id: post.user_id,
            account_id: target.account_id,
            platform: target.platform,
            attempted_at: new Date().toISOString(),
            outcome: "success",
            platform_post_id: mockPostId
          });
        }

        // Finalize post status
        await supabaseAdmin
          .from("scheduled_posts")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", post.id);

        publishedCount++;
      } catch (err: any) {
        console.error(`[V3 Publisher Cron] Failed publishing post ${post.id}:`, err);
        await supabaseAdmin
          .from("scheduled_posts")
          .update({ status: "failed", publish_error: err.message })
          .eq("id", post.id);
      }
    }

    res.json({ success: true, publishedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vercel Cron Trigger (Background Sync) ────────────────────────────────────
apiV3Router.post("/jobs/run", async (req, res) => {
  const cronSecret = process.env.V3_CRON_SECRET || "local_secret";
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized cron trigger" });
  }

  console.log("[V3 Cron] Starting background sync & publishing jobs...");

  try {
    // 1. Trigger scheduler publish queue check
    const now = new Date().toISOString();
    const { data: posts } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    for (const post of (posts || [])) {
      try {
        await supabaseAdmin.from("scheduled_posts").update({ status: "publishing", publish_attempted_at: new Date().toISOString() }).eq("id", post.id);
        for (const target of (post.target_platforms || [])) {
          const mockPostId = `platform_pub_${Math.random().toString(36).substring(2, 9)}`;
          const { data: insertedPost } = await supabaseAdmin.from("social_posts").insert({
            account_id: target.account_id,
            user_id: post.user_id,
            platform: target.platform,
            platform_post_id: mockPostId,
            content_text: post.content_text,
            media_type: post.media_attachments?.length > 0 ? "image" : "text_only",
            media_urls: post.media_attachments?.map((m: any) => m.file_url) || [],
            posted_at: new Date().toISOString(),
            scheduled_post_id: post.id
          }).select().single();

          if (insertedPost) {
            await supabaseAdmin.from("metric_snapshots").insert({
              post_id: insertedPost.id,
              account_id: target.account_id,
              user_id: post.user_id,
              likes: 0,
              comments: 0,
              reach: 10,
              engagement_rate: 0.0,
              captured_at: new Date().toISOString()
            });
          }

          await supabaseAdmin.from("publish_log").insert({
            scheduled_post_id: post.id,
            user_id: post.user_id,
            account_id: target.account_id,
            platform: target.platform,
            attempted_at: new Date().toISOString(),
            outcome: "success",
            platform_post_id: mockPostId
          });
        }
        await supabaseAdmin.from("scheduled_posts").update({ status: "published", published_at: new Date().toISOString() }).eq("id", post.id);
      } catch (err: any) {
        await supabaseAdmin.from("scheduled_posts").update({ status: "failed", publish_error: err.message }).eq("id", post.id);
      }
    }

    // 2. Fetch active subscription tiers
    const { data: users, error } = await supabaseAdmin
      .from("v3_subscription_tiers")
      .select("user_id")
      .neq("tier_name", "free");

    if (error) throw error;

    let briefingCount = 0;
    let competitorAuditsCount = 0;

    for (const sub of (users || [])) {
      try {
        await generateDailyBriefing(sub.user_id);
        briefingCount++;

        await detectAnomalies(sub.user_id);

        const { data: competitors } = await supabaseAdmin
          .from("tracked_competitors")
          .select("*")
          .eq("user_id", sub.user_id)
          .eq("is_active", true);

        for (const competitor of (competitors || [])) {
          const lastAudit = competitor.last_audited_at ? new Date(competitor.last_audited_at).getTime() : 0;
          const oneWeek = competitor.audit_frequency_days * 24 * 3600 * 1000;
          if (Date.now() - lastAudit >= oneWeek) {
            const scrapedData = await scrapeUrl(competitor.competitor_url);
            const context: BusinessContext = {
              url: competitor.competitor_url,
              businessName: competitor.competitor_name,
              businessType: scrapedData.inferredBusinessType || "E-Commerce",
              primaryGoal: "Generate sales",
              monthlyBudget: "Not specified",
              platforms: [],
              scrapedData,
            };
            const agentResults = await runFullAudit(context);
            const report = synthesizeReport(agentResults);
            
            await supabaseAdmin.from("tracked_competitors").update({
              latest_audit_score: report.overall,
              last_audited_at: new Date().toISOString(),
              audit_history: [...(competitor.audit_history || []), {
                score: report.overall,
                grade: report.grade,
                audited_at: new Date().toISOString(),
                report: report,
              }]
            }).eq("id", competitor.id);
            competitorAuditsCount++;
          }
        }
      } catch (err) {
        console.error(`[V3 Cron] Failed processing user ${sub.user_id}:`, err);
      }
    }

    res.json({ success: true, briefingsGenerated: briefingCount, competitorAuditsRun: competitorAuditsCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
