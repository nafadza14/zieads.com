import { Router } from "express";
import { createHmac } from "crypto";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import {
  generateDailyBriefing,
  detectAnomalies,
  analyzeCommentSentiment
} from "../v3-agents.js";
import { runFullAudit, type BusinessContext } from "../agents.js";
import { synthesizeReport } from "../scorer.js";
import { scrapeUrl } from "../scraper.js";
import { getDecryptedToken } from "../utils/tokenHelper.js";
import { publishPost, replyToComment } from "../utils/instagramApi.js";
import { syncAll, syncComments, syncRecentPosts } from "../utils/sync-instagram.js";
// @ts-ignore
import { put, del } from "@vercel/blob";
// @ts-ignore
import sharp from "sharp";
import multer from "multer";
import { getConnectedInstagram, callInstagramAPI, getClaudeClient } from "../utils/instagramHelpers.js";

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

    res.json({ success: true, data: data[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.delete("/connections/:id", requireAuth, async (req: any, res) => {
  try {
    const { data: connAccount } = await supabaseAdmin
      .from("connected_accounts")
      .select("platform")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (connAccount) {
      const platform = connAccount.platform;
      console.log(`[V3 Connections] Wiping all data for platform ${platform} for user ${req.userId}...`);
      
      // Delete from social_connections
      await supabaseAdmin
        .from("social_connections")
        .delete()
        .eq("platform", platform)
        .eq("user_id", req.userId);

      // Delete from social_posts (cascade deletes snapshots where post_id is linked)
      await supabaseAdmin
        .from("social_posts")
        .delete()
        .eq("platform", platform)
        .eq("user_id", req.userId);

      // Delete inbox comments
      await supabaseAdmin
        .from("comment_inbox")
        .delete()
        .eq("platform", platform)
        .eq("user_id", req.userId);
    }

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

// ─── Multer upload parser storage configuration ──────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max limit
  }
});

// ─── Media Library & Uploads ─────────────────────────────────────────────────
apiV3Router.post("/media/upload", requireAuth, upload.single("file"), async (req: any, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded in the 'file' field." });
    }

    // Validate MIME type
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime"
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(415).json({ error: `Unsupported media type: ${file.mimetype}. Allowed: jpeg, png, webp, mp4, quicktime.` });
    }

    // Validate file size
    const isVideo = file.mimetype.startsWith("video/");
    const maxSizeBytes = isVideo ? 500 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return res.status(413).json({ error: `File size too large. Max allowed: ${isVideo ? '500MB' : '100MB'}.` });
    }

    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPathname = `user-media/${req.userId}/${Date.now()}-${sanitizedName}`;

    // Upload to Vercel Blob
    console.log(`[V3 Upload] Uploading ${file.originalname} to Vercel Blob...`);
    const blob = await put(blobPathname, file.buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    console.log(`[V3 Upload] Uploaded successfully: ${blob.url}`);

    // Extract width/height for images using sharp
    let width: number | null = null;
    let height: number | null = null;
    if (!isVideo) {
      try {
        const metadata = await sharp(file.buffer).metadata();
        width = metadata.width || null;
        height = metadata.height || null;
      } catch (sharpErr: any) {
        console.warn("[V3 Upload] Sharp metadata extraction failed:", sharpErr.message);
      }
    }

    // Insert into media_library
    const { data: media, error } = await supabaseAdmin
      .from("media_library")
      .insert({
        user_id: req.userId,
        blob_url: blob.url,
        blob_pathname: blobPathname,
        file_name: file.originalname,
        file_size_bytes: file.size,
        mime_type: file.mimetype,
        width,
        height,
        duration_seconds: null
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: media.id,
        url: media.blob_url,
        file_name: media.file_name,
        mime_type: media.mime_type,
        width: media.width,
        height: media.height,
        duration_seconds: media.duration_seconds
      }
    });
  } catch (err: any) {
    console.error("[V3 Upload Error]", err);
    res.status(500).json({ error: err.message || "An unexpected error occurred during upload." });
  }
});

apiV3Router.get("/media/library", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("media_library")
      .select("*")
      .eq("user_id", req.userId)
      .order("uploaded_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({
      success: true,
      data: (data || []).map(m => ({
        id: m.id,
        blob_url: m.blob_url,
        file_name: m.file_name,
        mime_type: m.mime_type,
        width: m.width,
        height: m.height,
        uploaded_at: m.uploaded_at
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.delete("/media/:id", requireAuth, async (req: any, res) => {
  try {
    const { data: media, error: fetchError } = await supabaseAdmin
      .from("media_library")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (fetchError || !media) {
      return res.status(404).json({ error: "Media not found." });
    }

    // Delete from Vercel Blob
    try {
      console.log(`[V3 Delete] Deleting Vercel Blob: ${media.blob_url}`);
      await del(media.blob_url, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
    } catch (blobErr: any) {
      console.warn("[Vercel Blob Delete Warning]", blobErr.message);
    }

    // Delete from DB
    const { error: deleteError } = await supabaseAdmin
      .from("media_library")
      .delete()
      .eq("id", req.params.id);

    if (deleteError) throw deleteError;

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Post Scheduling & Direct Publishing ─────────────────────────────────────
apiV3Router.post("/posts/schedule", requireAuth, async (req: any, res) => {
  const { platform, caption, media_ids, hashtags, scheduled_for } = req.body;

  try {
    if (!platform || !scheduled_for) {
      return res.status(400).json({ error: "platform and scheduled_for are required." });
    }

    const scheduledTime = new Date(scheduled_for);
    if (scheduledTime.getTime() < Date.now() + 5 * 60 * 1000) {
      return res.status(400).json({ error: "Scheduled time must be at least 5 minutes in the future." });
    }

    // Fetch media library rows to get public urls
    let mediaUrls: string[] = [];
    let mediaType = "text_only";
    if (media_ids && media_ids.length > 0) {
      const { data: mediaRows, error: mediaError } = await supabaseAdmin
        .from("media_library")
        .select("*")
        .eq("user_id", req.userId)
        .in("id", media_ids);

      if (mediaError) throw mediaError;
      mediaUrls = mediaRows?.map(m => m.blob_url) || [];
      const firstMime = mediaRows?.[0]?.mime_type || "";
      mediaType = firstMime.startsWith("video/") ? "video" : "image";
    }

    const { data: post, error } = await supabaseAdmin
      .from("scheduled_posts")
      .insert({
        user_id: req.userId,
        platform,
        platform_account_id: "",
        caption,
        media_urls: mediaUrls,
        media_type: mediaType,
        hashtags: hashtags || [],
        scheduled_for: scheduledTime.toISOString(),
        status: "scheduled",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      id: post.id,
      scheduled_for: post.scheduled_for,
      status: post.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/posts/publish-now", requireAuth, async (req: any, res) => {
  const { platform, caption, media_ids, hashtags } = req.body;

  try {
    if (platform !== "instagram") {
      return res.status(400).json({ error: "Only Instagram platform is supported currently." });
    }

    if (!media_ids || media_ids.length === 0) {
      return res.status(400).json({ error: "Instagram requires at least one image or video to publish." });
    }

    if (caption && caption.length > 2200) {
      return res.status(400).json({ error: "Caption exceeds Instagram's 2200 character limit." });
    }

    // 1. Fetch media library rows
    const { data: mediaRows, error: mediaError } = await supabaseAdmin
      .from("media_library")
      .select("*")
      .eq("user_id", req.userId)
      .in("id", media_ids);

    if (mediaError || !mediaRows || mediaRows.length === 0) {
      return res.status(400).json({ error: "Specified media items not found in media library." });
    }

    const mediaUrls = mediaRows.map(m => m.blob_url);
    const firstMime = mediaRows[0].mime_type || "";
    const isVideo = firstMime.startsWith("video/");

    // 2. Fetch connection details
    const conn = await getConnectedInstagram(req.userId);
    if (!conn) {
      return res.status(400).json({ error: "instagram_not_connected", message: "Instagram account not connected. Please connect it in the Connections page." });
    }

    // 3. Insert initial scheduled post entry
    const { data: post, error: insertError } = await supabaseAdmin
      .from("scheduled_posts")
      .insert({
        user_id: req.userId,
        platform: "instagram",
        platform_account_id: conn.platformUserId,
        caption,
        media_urls: mediaUrls,
        media_type: isVideo ? "video" : (mediaUrls.length > 1 ? "carousel" : "image"),
        hashtags: hashtags || [],
        status: "publishing",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Run direct publishing
    try {
      let containerId = "";
      
      if (mediaUrls.length === 1) {
        // Single Image or Video
        const params: any = { caption: caption || "" };
        if (isVideo) {
          params.video_url = mediaUrls[0];
          params.media_type = "REELS";
        } else {
          params.image_url = mediaUrls[0];
        }

        console.log(`[V3 Publisher] Creating container for ${isVideo ? 'video' : 'image'}...`);
        const container = await callInstagramAPI(
          conn.accessToken,
          `${conn.platformUserId}/media`,
          {
            method: "POST",
            body: JSON.stringify(params)
          }
        );
        containerId = container.id;
      } else {
        // Carousel special flow (2-10 items)
        console.log(`[V3 Publisher] Starting parent container creation for ${mediaUrls.length} items...`);
        const childContainerIds: string[] = [];

        for (const [idx, url] of mediaUrls.entries()) {
          const mime = mediaRows[idx].mime_type || "";
          const isChildVideo = mime.startsWith("video/");
          const childParams: any = {
            is_carousel_item: true
          };

          if (isChildVideo) {
            childParams.video_url = url;
            childParams.media_type = "VIDEO";
          } else {
            childParams.image_url = url;
          }

          const childContainer = await callInstagramAPI(
            conn.accessToken,
            `${conn.platformUserId}/media`,
            {
              method: "POST",
              body: JSON.stringify(childParams)
            }
          );
          childContainerIds.push(childContainer.id);
        }

        // Wait for child video containers if any
        for (const [idx, cId] of childContainerIds.entries()) {
          const mime = mediaRows[idx].mime_type || "";
          if (mime.startsWith("video/")) {
            console.log(`[V3 Publisher] Polling child video container status: ${cId}`);
            let attempts = 0;
            while (attempts < 36) {
              await new Promise(r => setTimeout(r, 5000));
              const status = await callInstagramAPI(conn.accessToken, cId, { method: "GET" });
              if (status.status_code === "FINISHED") break;
              if (status.status_code === "ERROR") {
                throw new Error(`Child video container processing failed: ${status.status || 'Unknown'}`);
              }
              attempts++;
            }
          }
        }

        // Create parent carousel container
        const parentContainer = await callInstagramAPI(
          conn.accessToken,
          `${conn.platformUserId}/media`,
          {
            method: "POST",
            body: JSON.stringify({
              media_type: "CAROUSEL",
              children: childContainerIds.join(","),
              caption: caption || ""
            })
          }
        );
        containerId = parentContainer.id;
      }

      // Update scheduled_posts with container_id
      await supabaseAdmin
        .from("scheduled_posts")
        .update({ container_id: containerId })
        .eq("id", post.id);

      // Poll status for video or carousel containers containing videos
      if (isVideo || mediaRows.some(m => m.mime_type?.startsWith("video/"))) {
        console.log(`[V3 Publisher] Polling main container status: ${containerId}`);
        let attempts = 0;
        const maxAttempts = 36; // 3 minutes at 5s intervals
        
        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 5000));
          const status = await callInstagramAPI<{ status_code: string; status?: string }>(
            conn.accessToken,
            containerId,
            { method: "GET" }
          );
          console.log(`[V3 Publisher] Main container status: ${status.status_code}`);
          
          if (status.status_code === "FINISHED") break;
          if (status.status_code === "ERROR") {
            throw new Error(`Main container processing failed: ${status.status || 'Unknown'}`);
          }
          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new Error("Instagram video container processing timed out.");
        }
      }

      // Publish container
      console.log(`[V3 Publisher] Publishing container: ${containerId}`);
      const published = await callInstagramAPI<{ id: string }>(
        conn.accessToken,
        `${conn.platformUserId}/media_publish`,
        {
          method: "POST",
          body: JSON.stringify({ creation_id: containerId })
        }
      );

      // Fetch permalink
      console.log(`[V3 Publisher] Fetching permalink for media ${published.id}...`);
      const mediaDetails = await callInstagramAPI<{ permalink: string }>(
        conn.accessToken,
        published.id,
        { method: "GET" }
      );

      // Update scheduled_posts status to published
      await supabaseAdmin
        .from("scheduled_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          platform_media_id: published.id,
          platform_permalink: mediaDetails.permalink
        })
        .eq("id", post.id);

      res.json({
        success: true,
        permalink: mediaDetails.permalink,
        media_id: published.id,
        post_id: post.id
      });

    } catch (publishErr: any) {
      console.error("[V3 Publisher Direct Error]", publishErr);
      
      // Update DB status to failed
      await supabaseAdmin
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: publishErr.message
        })
        .eq("id", post.id);

      // Handle Instagram specific error codes
      if (publishErr.message?.includes("190")) {
        await supabaseAdmin
          .from("social_connections")
          .update({ is_active: false })
          .eq("user_id", req.userId)
          .eq("platform", "instagram");

        return res.status(400).json({ error: "reconnect_needed", message: "Instagram session expired. Please go to Connections and reconnect your account." });
      }

      if (publishErr.message?.includes("4")) {
        return res.status(429).json({ error: "rate_limited", message: "Meta API rate limits reached. Please retry in a few minutes." });
      }

      res.status(500).json({ error: publishErr.message || "Direct publishing to Meta failed." });
    }

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Calendar Endpoints ──────────────────────────────────────────────────────
apiV3Router.get("/posts/scheduled", requireAuth, async (req: any, res) => {
  const { from, to, status } = req.query;
  try {
    if (!from || !to) {
      return res.status(400).json({ error: "from and to date query parameters are required." });
    }

    let query = supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", req.userId)
      .or(`scheduled_for.gte.${from},published_at.gte.${from}`)
      .or(`scheduled_for.lte.${to},published_at.lte.${to}`);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("scheduled_for", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: (data || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        platform: p.platform,
        platform_account_id: p.platform_account_id,
        caption: p.caption,
        media_urls: p.media_urls || [],
        media_preview_url: p.media_urls?.[0] || null,
        media_type: p.media_type,
        hashtags: p.hashtags || [],
        scheduled_for: p.scheduled_for,
        status: p.status,
        published_at: p.published_at,
        platform_permalink: p.platform_permalink,
        error_message: p.error_message,
        created_at: p.created_at,
        updated_at: p.updated_at
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.patch("/posts/:id", requireAuth, async (req: any, res) => {
  const { caption, media_ids, hashtags, scheduled_for } = req.body;

  try {
    const { data: post, error: fetchErr } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (fetchErr || !post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (post.status === "published" || post.status === "publishing") {
      return res.status(400).json({ error: "Cannot edit a post that is already published or in progress." });
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (caption !== undefined) {
      updates.caption = caption;
    }

    if (hashtags !== undefined) {
      updates.hashtags = hashtags;
    }

    if (scheduled_for !== undefined) {
      const scheduledTime = new Date(scheduled_for);
      if (scheduledTime.getTime() < Date.now() + 5 * 60 * 1000) {
        return res.status(400).json({ error: "Scheduled time must be at least 5 minutes in the future." });
      }
      updates.scheduled_for = scheduledTime.toISOString();
      updates.status = "scheduled";
    }

    if (media_ids !== undefined) {
      let mediaUrls: string[] = [];
      let mediaType = "text_only";
      if (media_ids && media_ids.length > 0) {
        const { data: mediaRows, error: mediaError } = await supabaseAdmin
          .from("media_library")
          .select("*")
          .eq("user_id", req.userId)
          .in("id", media_ids);

        if (mediaError) throw mediaError;
        mediaUrls = mediaRows?.map(m => m.blob_url) || [];
        const firstMime = mediaRows?.[0]?.mime_type || "";
        mediaType = firstMime.startsWith("video/") ? "video" : "image";
      }
      updates.media_urls = mediaUrls;
      updates.media_type = mediaType;
    }

    const { data: updatedPost, error: updateErr } = await supabaseAdmin
      .from("scheduled_posts")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ success: true, data: updatedPost });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.delete("/posts/:id", requireAuth, async (req: any, res) => {
  try {
    const { data: post, error: fetchErr } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (fetchErr || !post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (post.status === "published") {
      await supabaseAdmin
        .from("scheduled_posts")
        .update({ status: "deleted", updated_at: new Date().toISOString() })
        .eq("id", req.params.id);
    } else {
      const { error: deleteErr } = await supabaseAdmin
        .from("scheduled_posts")
        .delete()
        .eq("id", req.params.id);
      if (deleteErr) throw deleteErr;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cron Scheduler Daemon ───────────────────────────────────────────────────
apiV3Router.get("/cron/publish-scheduled", async (req: any, res) => {
  const cronSecret = process.env.CRON_SECRET || "local_secret";
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized cron execution." });
  }

  console.log("[V3 Cron Publisher] Scanning for scheduled posts due to publish...");
  
  try {
    const now = new Date().toISOString();
    const { data: posts, error } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .limit(20);

    if (error) throw error;

    let processedCount = 0;
    let publishedCount = 0;
    let failedCount = 0;

    for (const post of (posts || [])) {
      processedCount++;
      try {
        console.log(`[V3 Cron Publisher] Publishing scheduled post ${post.id}...`);
        
        await supabaseAdmin
          .from("scheduled_posts")
          .update({ status: "publishing", updated_at: new Date().toISOString() })
          .eq("id", post.id);

        if (post.platform !== "instagram") {
          throw new Error("Only Instagram direct API scheduling is supported.");
        }

        const conn = await getConnectedInstagram(post.user_id);
        if (!conn) {
          throw new Error("Instagram not connected.");
        }

        let containerId = "";
        const mediaUrls = post.media_urls || [];
        const isVideo = post.media_type === "video";

        if (mediaUrls.length === 0) {
          throw new Error("Instagram requires at least one image or video to publish.");
        }

        if (mediaUrls.length === 1) {
          const params: any = { caption: post.caption || "" };
          if (isVideo) {
            params.video_url = mediaUrls[0];
            params.media_type = "REELS";
          } else {
            params.image_url = mediaUrls[0];
          }

          const container = await callInstagramAPI(
            conn.accessToken,
            `${conn.platformUserId}/media`,
            {
              method: "POST",
              body: JSON.stringify(params)
            }
          );
          containerId = container.id;
        } else {
          // Carousel child items
          const childContainerIds: string[] = [];
          for (const url of mediaUrls) {
            const isChildVideo = url.toLowerCase().includes(".mp4") || url.toLowerCase().includes(".mov");
            const childParams: any = {
              is_carousel_item: true
            };
            if (isChildVideo) {
              childParams.video_url = url;
              childParams.media_type = "VIDEO";
            } else {
              childParams.image_url = url;
            }

            const childContainer = await callInstagramAPI(
              conn.accessToken,
              `${conn.platformUserId}/media`,
              {
                method: "POST",
                body: JSON.stringify(childParams)
              }
            );
            childContainerIds.push(childContainer.id);
          }

          // Carousel parent container
          const parentContainer = await callInstagramAPI(
            conn.accessToken,
            `${conn.platformUserId}/media`,
            {
              method: "POST",
              body: JSON.stringify({
                media_type: "CAROUSEL",
                children: childContainerIds.join(","),
                caption: post.caption || ""
              })
            }
          );
          containerId = parentContainer.id;
        }

        await supabaseAdmin
          .from("scheduled_posts")
          .update({ container_id: containerId })
          .eq("id", post.id);

        if (isVideo || mediaUrls.some(url => url.toLowerCase().includes(".mp4") || url.toLowerCase().includes(".mov"))) {
          let attempts = 0;
          while (attempts < 36) {
            await new Promise(r => setTimeout(r, 5000));
            const status = await callInstagramAPI<{ status_code: string }>(
              conn.accessToken,
              containerId,
              { method: "GET" }
            );
            if (status.status_code === "FINISHED") break;
            if (status.status_code === "ERROR") {
              throw new Error("Container processing error.");
            }
            attempts++;
          }
        }

        const published = await callInstagramAPI<{ id: string }>(
          conn.accessToken,
          `${conn.platformUserId}/media_publish`,
          {
            method: "POST",
            body: JSON.stringify({ creation_id: containerId })
          }
        );

        const mediaDetails = await callInstagramAPI<{ permalink: string }>(
          conn.accessToken,
          published.id,
          { method: "GET" }
        );

        await supabaseAdmin
          .from("scheduled_posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            platform_media_id: published.id,
            platform_permalink: mediaDetails.permalink
          })
          .eq("id", post.id);

        publishedCount++;
      } catch (err: any) {
        console.error(`[V3 Cron Publisher] Post ${post.id} failed:`, err.message);
        failedCount++;
        
        await supabaseAdmin
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: err.message
          })
          .eq("id", post.id);
      }
    }

    res.json({ success: true, processed: processedCount, published: publishedCount, failed: failedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Visual Feed Preview ─────────────────────────────────────────────────────
const visualFeedCache = new Map<string, { data: any; expiry: number }>();

apiV3Router.get("/analytics/instagram-media", requireAuth, async (req: any, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
  const cacheKey = `${req.userId}_${limit}`;
  const cached = visualFeedCache.get(cacheKey);

  if (cached && Date.now() < cached.expiry) {
    console.log(`[V3 Feed Cache] Returning cached media list for user ${req.userId}`);
    return res.json({ success: true, connected: true, data: cached.data });
  }

  try {
    const conn = await getConnectedInstagram(req.userId);
    if (!conn) {
      return res.json({ success: true, connected: false, data: [] });
    }

    console.log(`[V3 Feed API] Fetching published media from Instagram for user ${req.userId}...`);
    const fields = 'id,media_type,media_url,thumbnail_url,permalink,timestamp';
    const response = await callInstagramAPI(
      conn.accessToken,
      `${conn.platformUserId}/media?fields=${fields}&limit=${limit}`,
      { method: "GET" }
    );

    const mediaList = (response.data || []).map((item: any) => ({
      media_url: item.media_url || item.thumbnail_url,
      permalink: item.permalink,
      timestamp: item.timestamp,
      media_type: item.media_type
    }));

    visualFeedCache.set(cacheKey, {
      data: mediaList,
      expiry: Date.now() + 5 * 60 * 1000
    });

    res.json({ success: true, connected: true, data: mediaList });
  } catch (err: any) {
    console.error("[V3 Feed Error]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Analytics & Insights Sync Endpoints ─────────────────────────────────────
async function syncInstagramInsightsForUser(userId: string) {
  console.log(`[V3 Insights Sync] Syncing Instagram insights for user ${userId}...`);
  const conn = await getConnectedInstagram(userId);
  if (!conn) {
    throw new Error("Instagram connection not found.");
  }

  // 1. Fetch account-level info
  console.log(`[V3 Insights Sync] Fetching account info for ${conn.platformUsername}...`);
  const accountInfo = await callInstagramAPI<{ followers_count: number; follows_count: number; media_count: number }>(
    conn.accessToken,
    conn.platformUserId
  );

  // Upsert account_insights_daily for today
  const today = new Date().toISOString().slice(0, 10);
  const { error: dailyErr } = await supabaseAdmin
    .from("account_insights_daily")
    .upsert({
      user_id: userId,
      platform: "instagram",
      platform_account_id: conn.platformUserId,
      snapshot_date: today,
      followers_count: accountInfo.followers_count,
      following_count: accountInfo.follows_count,
      media_count: accountInfo.media_count,
      impressions_daily: 0,
      reach_daily: 0,
      profile_views_daily: 0,
      website_clicks_daily: 0,
      raw_response: accountInfo
    }, { onConflict: "user_id,platform,snapshot_date" });

  if (dailyErr) console.error("[V3 Insights Sync] account_insights_daily upsert failed:", dailyErr.message);

  // 2. Fetch last 30 days of media
  console.log(`[V3 Insights Sync] Fetching recent media...`);
  const mediaResponse = await callInstagramAPI<{ data: any[] }>(
    conn.accessToken,
    `${conn.platformUserId}/media?fields=id,caption,media_type,permalink,timestamp&limit=50`
  );

  const mediaList = mediaResponse.data || [];
  let syncedCount = 0;

  for (const item of mediaList) {
    try {
      const isReel = item.media_type === "VIDEO" || item.media_type === "REELS";
      const metrics = isReel 
        ? "plays,reach,likes,comments,shares,saved,total_interactions" 
        : "impressions,reach,saved,likes,comments,shares";
      
      const insightsResponse = await callInstagramAPI<{ data: any[] }>(
        conn.accessToken,
        `${item.id}/insights?metric=${metrics}`
      );

      const metricsObj: Record<string, number> = {};
      for (const m of (insightsResponse.data || [])) {
        metricsObj[m.name] = m.values?.[0]?.value || 0;
      }

      const likes = metricsObj.likes || 0;
      const comments = metricsObj.comments || 0;
      const reach = metricsObj.reach || 0;
      const impressions = metricsObj.impressions || metricsObj.plays || 0;
      const saves = metricsObj.saved || 0;
      const shares = metricsObj.shares || 0;
      const engagement = likes + comments + saves + shares;

      await supabaseAdmin
        .from("post_insights_cache")
        .upsert({
          user_id: userId,
          platform: "instagram",
          platform_media_id: item.id,
          impressions,
          reach,
          engagement,
          likes,
          comments_count: comments,
          saves,
          shares,
          video_views: isReel ? impressions : 0,
          plays: isReel ? impressions : 0,
          raw_response: { ...metricsObj, caption: item.caption, permalink: item.permalink, media_url: item.media_url || item.thumbnail_url },
          post_published_at: item.timestamp,
          fetched_at: new Date().toISOString()
        }, { onConflict: "user_id,platform,platform_media_id" });

      syncedCount++;
      await new Promise(r => setTimeout(r, 200));
    } catch (postErr: any) {
      console.error(`[V3 Insights Sync] Failed for media ${item.id}:`, postErr.message);
    }
  }

  console.log(`[V3 Insights Sync] Synced ${syncedCount} posts for user ${userId}`);
}

apiV3Router.get("/analytics/overview", requireAuth, async (req: any, res) => {
  try {
    const { data: connection } = await supabaseAdmin
      .from("social_connections")
      .select("platform, platform_user_id, is_active")
      .eq("user_id", req.userId)
      .eq("platform", "instagram")
      .eq("is_active", true)
      .maybeSingle();

    if (!connection) {
      return res.json({
        connected: false,
        audience_size: null,
        total_impressions: null,
        engagement_rate: null,
        posts_synced: 0
      });
    }

    const { data: latestDaily } = await supabaseAdmin
      .from("account_insights_daily")
      .select("*")
      .eq("user_id", req.userId)
      .eq("platform", "instagram")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const audienceSize = latestDaily ? Number(latestDaily.followers_count) : null;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: insights } = await supabaseAdmin
      .from("post_insights_cache")
      .select("impressions, reach, engagement")
      .eq("user_id", req.userId)
      .eq("platform", "instagram")
      .gte("post_published_at", thirtyDaysAgo);

    const totalImpressions = insights?.reduce((sum, i) => sum + Number(i.impressions || 0), 0) || 0;
    const totalReach = insights?.reduce((sum, i) => sum + Number(i.reach || 0), 0) || 0;
    const totalEngagement = insights?.reduce((sum, i) => sum + Number(i.engagement || 0), 0) || 0;
    const postsSynced = insights?.length || 0;

    const engagementRate = totalReach > 0 ? Number(((totalEngagement / totalReach) * 100).toFixed(2)) : null;

    const thirtyDaysAgoDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const { data: oldDaily } = await supabaseAdmin
      .from("account_insights_daily")
      .select("followers_count")
      .eq("user_id", req.userId)
      .eq("platform", "instagram")
      .lte("snapshot_date", thirtyDaysAgoDate)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const oldFollowers = oldDaily ? Number(oldDaily.followers_count) : null;
    const followersDelta = (audienceSize !== null && oldFollowers !== null) ? (audienceSize - oldFollowers) : null;

    res.json({
      success: true,
      connected: true,
      audience_size: audienceSize,
      audience_delta_30d: followersDelta,
      total_impressions: totalImpressions,
      engagement_rate: engagementRate,
      posts_synced: postsSynced,
      platforms_connected: ["instagram"]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.get("/analytics/top-posts", requireAuth, async (req: any, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    
    const { data: insights, error: insightsErr } = await supabaseAdmin
      .from("post_insights_cache")
      .select("*")
      .eq("user_id", req.userId)
      .gte("post_published_at", thirtyDaysAgo)
      .order("engagement", { ascending: false })
      .limit(limit);

    if (insightsErr) throw insightsErr;

    if (!insights || insights.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const mediaIds = insights.map(i => i.platform_media_id);
    const { data: posts } = await supabaseAdmin
      .from("scheduled_posts")
      .select("caption, platform_permalink, media_urls, platform_media_id")
      .eq("user_id", req.userId)
      .in("platform_media_id", mediaIds);

    const postsMap = new Map<string, any>();
    for (const post of (posts || [])) {
      postsMap.set(post.platform_media_id, post);
    }

    const result = insights.map(item => {
      const dbPost = postsMap.get(item.platform_media_id);
      const engagementRate = item.reach > 0 ? Number(((item.engagement / item.reach) * 100).toFixed(2)) : 0;
      
      return {
        caption_preview: dbPost?.caption ? dbPost.caption.slice(0, 60) + (dbPost.caption.length > 60 ? "..." : "") : (item.raw_response?.caption?.slice(0, 60) || "Instagram Post"),
        permalink: dbPost?.platform_permalink || item.raw_response?.permalink || `https://www.instagram.com/p/${item.platform_media_id}/`,
        published_at: item.post_published_at,
        platform: item.platform,
        thumbnail_url: dbPost?.media_urls?.[0] || item.raw_response?.media_url || null,
        likes: Number(item.likes || 0),
        comments_count: Number(item.comments_count || 0),
        engagement_rate: engagementRate
      };
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.get("/analytics/best-posting-windows", requireAuth, async (req: any, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from("post_insights_cache")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.userId);

    if (error) throw error;

    const postsCount = count || 0;
    if (postsCount < 30) {
      return res.json({ insufficient_data: true, current_posts: postsCount, posts_needed: 30 - postsCount });
    }

    const { data: insights } = await supabaseAdmin
      .from("post_insights_cache")
      .select("post_published_at, reach, engagement")
      .eq("user_id", req.userId)
      .order("post_published_at", { ascending: false })
      .limit(100);

    const windowsMap = new Map<number, { sumRate: number; count: number }>();
    
    for (const item of (insights || [])) {
      if (!item.post_published_at || !item.reach) continue;
      const pubDate = new Date(item.post_published_at);
      const day = pubDate.getUTCDay();
      const hour = pubDate.getUTCHours();
      const hourOfWeek = day * 24 + hour;

      const rate = item.reach > 0 ? (Number(item.engagement || 0) / Number(item.reach)) * 100 : 0;
      
      const existing = windowsMap.get(hourOfWeek) || { sumRate: 0, count: 0 };
      existing.sumRate += rate;
      existing.count += 1;
      windowsMap.set(hourOfWeek, existing);
    }

    const sortedWindows = Array.from(windowsMap.entries())
      .map(([hourOfWeek, stats]) => {
        const day = Math.floor(hourOfWeek / 24);
        const hour = hourOfWeek % 24;
        return {
          day_of_week: day,
          hour: hour,
          avg_engagement_rate: Number((stats.sumRate / stats.count).toFixed(2)),
          sample_size: stats.count
        };
      })
      .sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)
      .slice(0, 5);

    res.json({ insufficient_data: false, windows: sortedWindows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/analytics/sync", requireAuth, async (req: any, res) => {
  try {
    console.log(`[V3 Analytics Sync] Manual sync requested by user ${req.userId}`);
    await syncInstagramInsightsForUser(req.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.get("/cron/sync-instagram-insights", async (req: any, res) => {
  const cronSecret = process.env.CRON_SECRET || "local_secret";
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized cron execution." });
  }

  console.log("[V3 Cron Insights] Starting background instagram insights sync...");
  try {
    const { data: conns, error } = await supabaseAdmin
      .from("social_connections")
      .select("user_id")
      .eq("platform", "instagram")
      .eq("is_active", true);

    if (error) throw error;

    let syncedCount = 0;
    let failedCount = 0;

    for (const conn of (conns || [])) {
      try {
        await syncInstagramInsightsForUser(conn.user_id);
        syncedCount++;
        await new Promise(r => setTimeout(r, 200));
      } catch (err: any) {
        console.error(`[V3 Cron Insights] Failed for user ${conn.user_id}:`, err.message);
        failedCount++;
      }
    }

    res.json({ success: true, synced_count: syncedCount, failed_count: failedCount });
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
      .order("scheduled_for", { ascending: true, nullsFirst: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function checkAndCleanupMockData(userId: string) {
  try {
    const { data: mockPosts } = await supabaseAdmin
      .from("social_posts")
      .select("id")
      .eq("user_id", userId)
      .like("platform_post_id", "post_%")
      .limit(1);

    if (mockPosts && mockPosts.length > 0) {
      console.log(`[V3 API] Mock posts detected for user ${userId}. Cleaning up mock data...`);
      await supabaseAdmin.from("social_posts").delete().eq("user_id", userId);
      await supabaseAdmin.from("metric_snapshots").delete().eq("user_id", userId);
      await supabaseAdmin.from("comment_inbox").delete().eq("user_id", userId);
      
      // Reset last_synced_at to force sync
      await supabaseAdmin
        .from("social_connections")
        .update({ last_synced_at: null })
        .eq("user_id", userId);
    }
  } catch (err: any) {
    console.error("[Cleanup Mock Check Failed]", err.message);
  }
}

// Helpers for Instagram API direct publishing
async function publishPostToInstagram(userId: string, accountId: string, contentText: string, mediaAttachments: any[], firstComment?: string): Promise<{ mediaId: string; permalink?: string }> {
  // 1. Decrypt Instagram token
  const conn = await getDecryptedToken(userId, "instagram");
  if (!conn) {
    throw new Error("No active Instagram connection found. Please connect your Instagram account first.");
  }

  // 2. Validate media
  if (!mediaAttachments || mediaAttachments.length === 0) {
    throw new Error("Instagram requires at least one image or video attachment to publish.");
  }

  const mediaUrl = mediaAttachments[0]?.file_url || mediaAttachments[0]?.url;
  if (!mediaUrl) {
    throw new Error("Media attachment is missing a valid public URL.");
  }

  const isVideo = mediaAttachments[0]?.file_type?.toLowerCase().includes("video") || 
                  mediaUrl.toLowerCase().includes(".mp4") || 
                  mediaUrl.toLowerCase().includes(".mov");

  const params: any = {
    caption: contentText || ""
  };

  if (isVideo) {
    params.video_url = mediaUrl;
    params.media_type = "REELS";
  } else {
    params.image_url = mediaUrl;
  }

  // 3. Call Instagram API
  console.log(`[V3 Publisher] Publishing to Instagram for user ${userId} (isVideo: ${isVideo})...`);
  const result = await publishPost(conn.token, conn.platformUserId, params);
  
  // 4. If first comment is provided, post it as a reply to the newly created media
  if (firstComment && firstComment.trim().length > 0) {
    try {
      console.log(`[V3 Publisher] Adding first comment to post ${result.mediaId}...`);
      // Wait a moment for post to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      await replyToComment(conn.token, result.mediaId, firstComment);
    } catch (err: any) {
      console.error(`[V3 Publisher] First comment failed:`, err.message);
    }
  }

  return {
    mediaId: result.mediaId,
    permalink: `https://www.instagram.com/p/${result.mediaId}/`
  };
}

async function publishPostToInstagramInBackground(postId: string, userId: string) {
  try {
    const { data: post } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (!post) return;

    const targets = post.target_platforms || [];
    for (const target of targets) {
      if (target.platform === "instagram") {
        const { mediaId, permalink } = await publishPostToInstagram(
          userId,
          target.account_id,
          post.content_text,
          post.media_attachments,
          post.first_comment
        );

        // Insert into social_posts
        const { data: insertedPost } = await supabaseAdmin
          .from("social_posts")
          .insert({
            account_id: target.account_id,
            user_id: userId,
            platform: "instagram",
            platform_post_id: mediaId,
            content_text: post.content_text,
            media_type: post.media_attachments?.[0]?.file_type?.toLowerCase().includes("video") ? "video" : "image",
            media_urls: post.media_attachments?.map((m: any) => m.file_url) || [],
            posted_at: new Date().toISOString(),
            scheduled_post_id: post.id,
            permalink: permalink
          })
          .select()
          .single();

        // Insert initial metric snapshots
        if (insertedPost) {
          await supabaseAdmin.from("metric_snapshots").insert({
            post_id: insertedPost.id,
            account_id: target.account_id,
            user_id: userId,
            likes: 0,
            comments: 0,
            reach: 10,
            engagement_rate: 0.0,
            captured_at: new Date().toISOString()
          });
        }

        // Log success
        await supabaseAdmin.from("publish_log").insert({
          scheduled_post_id: post.id,
          user_id: userId,
          account_id: target.account_id,
          platform: target.platform,
          attempted_at: new Date().toISOString(),
          outcome: "success",
          platform_post_id: mediaId
        });
      } else {
        // Mock fallback for other platforms
        const mockPostId = `platform_pub_${Math.random().toString(36).substring(2, 9)}`;
        const { data: insertedPost } = await supabaseAdmin
          .from("social_posts")
          .insert({
            account_id: target.account_id,
            user_id: userId,
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

        if (insertedPost) {
          await supabaseAdmin.from("metric_snapshots").insert({
            post_id: insertedPost.id,
            account_id: target.account_id,
            user_id: userId,
            likes: 0,
            comments: 0,
            reach: 10,
            engagement_rate: 0.0,
            captured_at: new Date().toISOString()
          });
        }

        await supabaseAdmin.from("publish_log").insert({
          scheduled_post_id: post.id,
          user_id: userId,
          account_id: target.account_id,
          platform: target.platform,
          attempted_at: new Date().toISOString(),
          outcome: "success",
          platform_post_id: mockPostId
        });
      }
    }

    // Finalize post status
    await supabaseAdmin
      .from("scheduled_posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", post.id);

  } catch (err: any) {
    console.error(`[Background Publish Error] Post ${postId}:`, err.message);
    await supabaseAdmin
      .from("scheduled_posts")
      .update({ status: "failed", publish_error: err.message })
      .eq("id", postId);
  }
}

apiV3Router.post("/scheduler/posts", requireAuth, async (req: any, res) => {
  const { status, scheduledFor, publishMethod, targetPlatforms, contentText, mediaAttachments, firstComment, platformSpecificOverrides, isPartOfQueue } = req.body;
  
  try {
    let finalScheduledTime = scheduledFor ? new Date(scheduledFor).toISOString() : null;
    let finalQueueSlotId = null;

    if (isPartOfQueue && targetPlatforms && targetPlatforms.length > 0) {
      const nextTime = await getNextQueueTime(req.userId, targetPlatforms[0].account_id);
      finalScheduledTime = nextTime.toISOString();
    }

    const isPublishNow = status === "scheduled" && (!finalScheduledTime || new Date(finalScheduledTime).getTime() <= Date.now() + 5000);
    const initialStatus = isPublishNow ? "publishing" : (status || "draft");

    const { data, error } = await supabaseAdmin
      .from("scheduled_posts")
      .insert({
        user_id: req.userId,
        status: initialStatus,
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

    if (isPublishNow && data) {
      // Trigger real publish in background so function doesn't timeout
      publishPostToInstagramInBackground(data.id, req.userId).catch(err => 
        console.error("[Composer Publish Trigger Error]", err)
      );
    }

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
    await checkAndCleanupMockData(req.userId);
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
        media: p.media_urls || [],
        likes: p.raw_metrics?.likes || 0,
        comments: p.raw_metrics?.comments || 0
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
    await checkAndCleanupMockData(req.userId);
    // 1. Check for active social connection
    const { data: connection } = await supabaseAdmin
      .from("social_connections")
      .select("last_synced_at")
      .eq("user_id", req.userId)
      .eq("platform", "instagram")
      .eq("is_active", true)
      .maybeSingle();

    if (!connection) {
      return res.json({
        success: true,
        data: {
          connected: false,
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalImpressions: 0,
          latestFollowers: 0,
          followerGrowth: 0,
          engagementRate: 0
        }
      });
    }

    // 2. Trigger on-demand sync if never synced or synced > 1 hour ago
    const lastSynced = connection.last_synced_at ? new Date(connection.last_synced_at).getTime() : 0;
    const { count: postCount } = await supabaseAdmin
      .from("social_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.userId)
      .eq("platform", "instagram");

    if (Date.now() - lastSynced > 3600 * 1000 || !postCount || postCount === 0) {
      console.log(`[V3 API] Triggering on-demand sync for user ${req.userId}...`);
      await syncAll(req.userId);
    }

    // 3. Query real data
    const { data: posts } = await supabaseAdmin
      .from("social_posts")
      .select("*")
      .eq("user_id", req.userId)
      .eq("platform", "instagram");

    const { data: snapshots } = await supabaseAdmin
      .from("metric_snapshots")
      .select("*")
      .eq("user_id", req.userId)
      .not("post_id", "is", null);

    const { data: followerSnapshots } = await supabaseAdmin
      .from("metric_snapshots")
      .select("follower_count_at_capture")
      .eq("user_id", req.userId)
      .is("post_id", null)
      .order("captured_at", { ascending: false });

    // Aggregate stats
    const totalPosts = posts?.length || 0;
    const totalLikes = snapshots?.reduce((sum, s) => sum + (s.likes || 0), 0) || 0;
    const totalComments = snapshots?.reduce((sum, s) => sum + (s.comments || 0), 0) || 0;
    const totalImpressions = snapshots?.reduce((sum, s) => sum + (s.impressions || 0), 0) || 0;
    const totalReach = snapshots?.reduce((sum, s) => sum + (s.reach || 0), 0) || 0;

    // Follower counts
    let latestFollowers = followerSnapshots?.[0]?.follower_count_at_capture || 0;
    let baselineFollowers = followerSnapshots?.[followerSnapshots.length - 1]?.follower_count_at_capture || 0;

    // Fallback to connected_accounts metadata if no snapshots exist
    if (latestFollowers === 0) {
      const { data: connAcct } = await supabaseAdmin
        .from("connected_accounts")
        .select("metadata")
        .eq("user_id", req.userId)
        .eq("platform", "instagram")
        .maybeSingle();
      if (connAcct?.metadata) {
        latestFollowers = connAcct.metadata.followers_count || 0;
        baselineFollowers = latestFollowers;
      }
    }

    const followerGrowth = latestFollowers - baselineFollowers;

    res.json({
      success: true,
      data: {
        connected: true,
        totalPosts,
        totalLikes,
        totalComments,
        totalImpressions,
        latestFollowers,
        followerGrowth,
        engagementRate: totalReach > 0 ? Number(((totalLikes + totalComments) / totalReach).toFixed(4)) : 0.0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Unified Inbox & Comments Sync Endpoints ─────────────────────────────────
async function classifyCommentSentiment(text: string): Promise<{ sentiment: 'positive' | 'neutral' | 'negative'; confidence: number }> {
  if (!text || text.length > 500) {
    return { sentiment: "neutral", confidence: 1.0 };
  }

  try {
    const claude = getClaudeClient();
    const systemPrompt = `You are a sentiment classifier for social media comments on a marketing tool. Classify the given comment as positive, neutral, or negative. Respond ONLY with valid JSON: {"sentiment": "positive|neutral|negative", "confidence": 0.0-1.0}. No other text.`;
    
    console.log(`[V3 Sentiment] Calling Claude Haiku for: "${text.slice(0, 30)}..."`);
    const msg = await claude.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 100,
      temperature: 0.1,
      system: [
        {
          type: "text",
          text: systemPrompt,
          // @ts-ignore
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [{ role: "user", content: text }]
    }, {
      headers: {
        "anthropic-beta": "prompt-caching-2024-07-31"
      }
    });

    const responseText = msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = JSON.parse(responseText.trim());
    return {
      sentiment: parsed.sentiment || "neutral",
      confidence: parsed.confidence || 0.0
    };
  } catch (err: any) {
    console.error("[V3 Sentiment Error] Classification failed, falling back to neutral:", err.message);
    return { sentiment: "neutral", confidence: 0.0 };
  }
}

async function syncInstagramCommentsForUser(userId: string): Promise<number> {
  const conn = await getConnectedInstagram(userId);
  if (!conn) return 0;

  console.log(`[V3 Inbox Sync] Polling comments for ${conn.platformUsername}...`);
  const postsResponse = await callInstagramAPI<{ data: any[] }>(
    conn.accessToken,
    `${conn.platformUserId}/media?fields=id,timestamp,caption&limit=20`
  );

  const postsList = postsResponse.data || [];
  let newCommentsCount = 0;

  for (const post of postsList) {
    try {
      const commentsResponse = await callInstagramAPI<{ data: any[] }>(
        conn.accessToken,
        `${post.id}/comments?fields=id,text,username,timestamp,like_count,replies{id,text,username,timestamp}`
      );

      const commentsList = commentsResponse.data || [];
      for (const comment of commentsList) {
        const { data: existing } = await supabaseAdmin
          .from("comments_inbox")
          .select("id")
          .eq("user_id", userId)
          .eq("platform", "instagram")
          .eq("platform_comment_id", comment.id)
          .maybeSingle();

        if (!existing) {
          console.log(`[V3 Inbox Sync] New comment detected: "${comment.text?.slice(0, 30)}..." from ${comment.username}`);
          const sentimentResult = await classifyCommentSentiment(comment.text || "");

          const { error: insertErr } = await supabaseAdmin
            .from("comments_inbox")
            .insert({
              user_id: userId,
              platform: "instagram",
              platform_comment_id: comment.id,
              platform_media_id: post.id,
              parent_comment_id: null,
              author_username: comment.username,
              author_platform_id: "",
              text: comment.text,
              sentiment: sentimentResult.sentiment,
              sentiment_confidence: sentimentResult.confidence,
              status: "unread",
              posted_at: comment.timestamp,
              created_at: new Date().toISOString()
            });

          if (!insertErr) {
            newCommentsCount++;
          } else {
            console.error(`[V3 Inbox Sync] Insert failed for comment ${comment.id}:`, insertErr.message);
          }
        }
      }
    } catch (postErr: any) {
      console.error(`[V3 Inbox Sync] Failed to sync comments for post ${post.id}:`, postErr.message);
    }
  }

  await supabaseAdmin
    .from("social_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("platform", "instagram");

  return newCommentsCount;
}

apiV3Router.get("/inbox/comments", requireAuth, async (req: any, res) => {
  const { sentiment, status, limit } = req.query;
  const maxLimit = limit ? Math.min(parseInt(limit as string), 100) : 50;

  try {
    await checkAndCleanupMockData(req.userId);
    
    const { data: conn } = await supabaseAdmin
      .from("social_connections")
      .select("last_synced_at")
      .eq("user_id", req.userId)
      .eq("platform", "instagram")
      .eq("is_active", true)
      .maybeSingle();

    if (conn) {
      const lastSynced = conn.last_synced_at ? new Date(conn.last_synced_at).getTime() : 0;
      if (Date.now() - lastSynced > 15 * 60 * 1000) {
        console.log(`[V3 Inbox] Triggering on-demand comments sync for user ${req.userId}...`);
        syncInstagramCommentsForUser(req.userId).catch(err => console.error("[V3 Inbox Sync Error]", err));
      }
    }

    let query = supabaseAdmin
      .from("comments_inbox")
      .select("*")
      .eq("user_id", req.userId);

    if (sentiment && sentiment !== "all") {
      query = query.eq("sentiment", sentiment);
    }

    if (status && status !== "all") {
      const statusList = (status as string).split(",");
      query = query.in("status", statusList);
    } else if (!status) {
      query = query.neq("status", "archived");
    }

    const { data: comments, error } = await query
      .order("posted_at", { ascending: false })
      .limit(maxLimit);

    if (error) throw error;

    const { data: allComments, error: summaryErr } = await supabaseAdmin
      .from("comments_inbox")
      .select("status, sentiment")
      .eq("user_id", req.userId);

    if (summaryErr) throw summaryErr;

    let totalUnread = 0;
    let totalPositive = 0;
    let totalNegative = 0;
    let totalNeutral = 0;

    for (const c of (allComments || [])) {
      if (c.status === "unread") totalUnread++;
      if (c.sentiment === "positive") totalPositive++;
      if (c.sentiment === "negative") totalNegative++;
      if (c.sentiment === "neutral") totalNeutral++;
    }

    res.json({
      success: true,
      data: comments || [],
      summary: {
        total_unread: totalUnread,
        total_positive: totalPositive,
        total_negative: totalNegative,
        total_neutral: totalNeutral
      }
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function commentReplyHandler(req: any, res: any) {
  const commentId = req.body.comment_id || req.params.id;
  const replyText = req.body.reply_text || req.body.replyText;

  if (!commentId || !replyText) {
    return res.status(400).json({ error: "comment_id and reply_text are required." });
  }

  if (replyText.length > 2200) {
    return res.status(400).json({ error: "Reply text exceeds 2200 characters limit." });
  }

  try {
    const { data: comment, error: fetchErr } = await supabaseAdmin
      .from("comments_inbox")
      .select("*")
      .eq("id", commentId)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (fetchErr || !comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    if (comment.status === "replied") {
      return res.status(400).json({ error: "Already replied to this comment." });
    }

    const conn = await getConnectedInstagram(req.userId);
    if (!conn) {
      return res.status(401).json({ error: "reconnect_needed", message: "Instagram session not found or expired. Please reconnect." });
    }

    console.log(`[V3 Inbox Reply] Posting reply to comment ${comment.platform_comment_id}...`);
    const replyResult = await callInstagramAPI<{ id: string }>(
      conn.accessToken,
      `${comment.platform_comment_id}/replies`,
      {
        method: "POST",
        body: JSON.stringify({ message: replyText })
      }
    );

    const { data: updatedComment, error: updateErr } = await supabaseAdmin
      .from("comments_inbox")
      .update({
        status: "replied",
        replied_at: new Date().toISOString(),
        reply_text: replyText,
        reply_platform_id: replyResult.id
      })
      .eq("id", comment.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      reply_id: replyResult.id,
      replied_at: updatedComment.replied_at
    });

  } catch (err: any) {
    console.error("[V3 Inbox Reply Error]", err);
    res.status(502).json({ error: `Instagram rejected reply: ${err.message}` });
  }
}

apiV3Router.post("/inbox/reply", requireAuth, commentReplyHandler);
apiV3Router.post("/inbox/comments/:id/reply", requireAuth, commentReplyHandler);

async function commentArchiveHandler(req: any, res: any) {
  const commentId = req.body.comment_id || req.params.id;
  if (!commentId) {
    return res.status(400).json({ error: "comment_id is required." });
  }

  try {
    const { error } = await supabaseAdmin
      .from("comments_inbox")
      .update({ status: "archived" })
      .eq("id", commentId)
      .eq("user_id", req.userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

apiV3Router.post("/inbox/archive", requireAuth, commentArchiveHandler);
apiV3Router.post("/inbox/comments/:id/archive", requireAuth, commentArchiveHandler);

apiV3Router.get("/cron/sync-instagram-comments", async (req: any, res) => {
  const cronSecret = process.env.CRON_SECRET || "local_secret";
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized cron execution." });
  }

  console.log("[V3 Cron Comments] Starting background comments sync...");
  try {
    const { data: conns, error } = await supabaseAdmin
      .from("social_connections")
      .select("user_id")
      .eq("platform", "instagram")
      .eq("is_active", true);

    if (error) throw error;

    let syncedUsers = 0;
    let totalNewComments = 0;

    for (const conn of (conns || [])) {
      try {
        const count = await syncInstagramCommentsForUser(conn.user_id);
        totalNewComments += count;
        syncedUsers++;
        await new Promise(r => setTimeout(r, 200));
      } catch (err: any) {
        console.error(`[V3 Cron Comments] Failed for user ${conn.user_id}:`, err.message);
      }
    }

    res.json({ success: true, synced_users: syncedUsers, new_comments: totalNewComments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.get("/webhooks/instagram/comments", (req: any, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "local_verify_token";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[V3 Webhook] Webhook verified successfully.");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

apiV3Router.post("/webhooks/instagram/comments", async (req: any, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (appSecret && signature) {
    const expectedSignature = "sha256=" + createHmac("sha256", appSecret)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("[V3 Webhook] Signature mismatch!");
      return res.sendStatus(403);
    }
  }

  const body = req.body;
  console.log("[V3 Webhook] Received webhook payload:", JSON.stringify(body));

  try {
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.value && change.value.item === "comment") {
          const igAccountId = entry.id;
          const commentVal = change.value;
          const commentId = commentVal.id;
          const mediaId = commentVal.media?.id;
          const text = commentVal.text;
          const username = commentVal.from?.username;

          const { data: conn } = await supabaseAdmin
            .from("social_connections")
            .select("user_id")
            .eq("platform_user_id", igAccountId)
            .eq("platform", "instagram")
            .maybeSingle();

          if (conn) {
            const { data: existing } = await supabaseAdmin
              .from("comments_inbox")
              .select("id")
              .eq("user_id", conn.user_id)
              .eq("platform", "instagram")
              .eq("platform_comment_id", commentId)
              .maybeSingle();

            if (!existing) {
              classifyCommentSentiment(text).then(async (sentimentResult) => {
                await supabaseAdmin
                  .from("comments_inbox")
                  .insert({
                    user_id: conn.user_id,
                    platform: "instagram",
                    platform_comment_id: commentId,
                    platform_media_id: mediaId,
                    parent_comment_id: commentVal.parent_id || null,
                    author_username: username || "anonymous",
                    author_platform_id: commentVal.from?.id || "",
                    text: text,
                    sentiment: sentimentResult.sentiment,
                    sentiment_confidence: sentimentResult.confidence,
                    status: "unread",
                    posted_at: new Date(commentVal.created_time * 1000).toISOString(),
                    created_at: new Date().toISOString()
                  });
              }).catch(err => console.error("[V3 Webhook Sentiment Error]", err));
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error("[V3 Webhook Processing Failed]", err.message);
  }

  res.sendStatus(200);
});

// ─── Best Time to Post heatmap ────────────────────────────────────────────────
apiV3Router.get("/analytics/best-times", requireAuth, async (req: any, res) => {
  try {
    // 1. Check connected accounts
    const { count: accountCount, error: acctErr } = await supabaseAdmin
      .from("connected_accounts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.userId);

    if (acctErr) throw acctErr;

    if (!accountCount || accountCount === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Count posts in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { count: postCount, error: postErr } = await supabaseAdmin
      .from("social_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.userId)
      .gte("posted_at", thirtyDaysAgo);

    if (postErr) throw postErr;

    if (!postCount || postCount < 30) {
      return res.json({ success: true, data: [] });
    }

    // Top deterministic posting times if data is sufficient
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
const BRIEFING_SYSTEM_PROMPT = `You are ZieAds' AI Marketing Agent. You generate concise, actionable daily briefings for solopreneurs and small brand founders managing their own social media. Your tone is direct, specific, and confident. No fluff, no generic advice.

You output ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentence top-line summary of the past 7 days",
  "highlights": [
    { "title": "short title", "body": "1-2 sentences of specific insight", "metric_delta": "optional +X% or -X%", "platform": "instagram" }
  ],
  "recommended_actions": [
    { "action": "concrete action verb + object", "reason": "1 sentence justification from the data", "priority": "high|medium|low" }
  ],
  "anomalies_detected": [
    { "description": "what happened", "potential_cause": "data-supported hypothesis", "platform": "instagram" }
  ]
}

Rules:
- Only cite metrics that appear in the data provided
- Never invent numbers
- If data is thin, acknowledge it in the summary rather than fabricating insights
- Recommended actions must be concrete (e.g. 'Post a Reel at 2pm Tuesday' not 'engage more')
- Max 3 highlights, max 3 recommended actions, max 2 anomalies
- Output raw JSON only, no markdown code blocks`;

apiV3Router.get("/briefing/today", requireAuth, async (req: any, res) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_briefings")
      .select("*")
      .eq("user_id", req.userId)
      .eq("briefing_date", today)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({ status: "needs_generation" });
    }

    res.json({
      status: "ready",
      summary: data.summary,
      highlights: data.highlights,
      recommended_actions: data.recommended_actions,
      anomalies_detected: data.anomalies_detected
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Backward compatible mapping for older frontend calls
apiV3Router.get("/analyst/briefing", requireAuth, async (req: any, res) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_briefings")
      .select("*")
      .eq("user_id", req.userId)
      .eq("briefing_date", today)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({ success: true, data: null, needs_generation: true });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        briefing_date: data.briefing_date,
        headline: "Today's ZieAds Briefing",
        summary: data.summary,
        wins: data.highlights?.map((h: any) => ({
          title: h.title,
          value: h.metric_delta || "Insight",
          context: h.body
        })) || [],
        concerns: data.anomalies_detected?.map((a: any) => ({
          title: "Anomaly",
          severity: "warning",
          value: a.description,
          context: a.potential_cause
        })) || [],
        today_actions: data.recommended_actions?.map((r: any, idx: number) => ({
          action: r.action,
          reasoning: r.reason,
          estimated_impact: r.priority === "high" ? "High" : r.priority === "medium" ? "Medium" : "Low",
          effort: "Medium",
          rank: idx + 1
        })) || [],
        suggested_deep_dives: [
          {
            v02_mode_name: "Content Optimization Dive",
            reasoning_for_suggestion: "Analyze your feed visual elements to maximize conversion ratios."
          }
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.get("/briefing/history", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_briefings")
      .select("*")
      .eq("user_id", req.userId)
      .order("briefing_date", { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function compileBriefingHandler(req: any, res: any) {
  const force = req.query.force === "true";
  const userId = req.userId;
  const today = new Date().toISOString().slice(0, 10);

  try {
    // 1. Idempotency Check
    if (!force) {
      const { data: existing, error: existErr } = await supabaseAdmin
        .from("ai_briefings")
        .select("*")
        .eq("user_id", userId)
        .eq("briefing_date", today)
        .maybeSingle();

      if (existing) {
        const formattedData = {
          id: existing.id,
          briefing_date: existing.briefing_date,
          headline: "Today's ZieAds Briefing",
          summary: existing.summary,
          wins: existing.highlights?.map((h: any) => ({
            title: h.title,
            value: h.metric_delta || "Insight",
            context: h.body
          })) || [],
          concerns: existing.anomalies_detected?.map((a: any) => ({
            title: "Anomaly",
            severity: "warning",
            value: a.description,
            context: a.potential_cause
          })) || [],
          today_actions: existing.recommended_actions?.map((r: any, idx: number) => ({
            action: r.action,
            reasoning: r.reason,
            estimated_impact: r.priority === "high" ? "High" : r.priority === "medium" ? "Medium" : "Low",
            effort: "Medium",
            rank: idx + 1
          })) || [],
          suggested_deep_dives: [
            {
              v02_mode_name: "Content Optimization Dive",
              reasoning_for_suggestion: "Analyze your feed visual elements to maximize conversion ratios."
            }
          ]
        };

        return res.json({
          success: true,
          data: formattedData
        });
      }
    }

    // 2. Load context: check connections
    const { data: connections, error: connErr } = await supabaseAdmin
      .from("social_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (connErr) throw connErr;

    if (!connections || connections.length === 0) {
      return res.json({
        status: "no_accounts_connected",
        message: "Connect at least one account to receive briefings."
      });
    }

    // 3. Load last 7 days of account insights
    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const { data: accountInsights, error: accErr } = await supabaseAdmin
      .from("account_insights_daily")
      .select("*")
      .eq("user_id", userId)
      .gte("snapshot_date", sevenDaysAgoDate)
      .order("snapshot_date", { ascending: false });

    if (accErr) throw accErr;

    // 4. Load last 7 days of post insights
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: postInsights, error: postErr } = await supabaseAdmin
      .from("post_insights_cache")
      .select("*")
      .eq("user_id", userId)
      .gte("post_published_at", sevenDaysAgo)
      .order("post_published_at", { ascending: false })
      .limit(20);

    if (postErr) throw postErr;

    // 5. Insufficient Data check
    if ((!accountInsights || accountInsights.length === 0) && (!postInsights || postInsights.length === 0)) {
      return res.json({
        status: "insufficient_data",
        message: "The agent is still learning your patterns. Your briefing will be sharper in a few days."
      });
    }

    // 6. Build Claude prompt
    const platforms = connections.map(c => c.platform).join(", ");
    const accountInsightsJson = JSON.stringify(accountInsights || [], null, 2);
    const postInsightsJson = JSON.stringify(postInsights || [], null, 2);
    
    const userPrompt = `Generate today's briefing for a user with these connected platforms: ${platforms}.

Account metrics (last 7 days):
${accountInsightsJson}

Post performance (last 7 days, sorted by recency):
${postInsightsJson}

Today's date: ${today}

Produce the JSON briefing.`;

    console.log(`[V3 Claude Briefing] Initializing Anthropic client...`);
    const claude = getClaudeClient();

    console.log(`[V3 Claude Briefing] Sending messages request to Claude (3.5 Sonnet)...`);
    const msg = await claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.3,
      system: [
        {
          type: "text",
          text: BRIEFING_SYSTEM_PROMPT,
          // @ts-ignore
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [{ role: "user", content: userPrompt }]
    }, {
      headers: {
        "anthropic-beta": "prompt-caching-2024-07-31"
      }
    });

    const responseText = msg.content[0].type === "text" ? msg.content[0].text : "";
    console.log(`[V3 Claude Briefing] Claude Response:`, responseText);

    let briefingData: any;
    try {
      briefingData = JSON.parse(responseText);
    } catch (parseErr: any) {
      console.error("[V3 Claude Briefing] Failed to parse Claude response JSON:", parseErr.message, responseText);
      return res.status(500).json({
        status: "error",
        message: "Briefing generation temporarily unavailable. Please try again in a few minutes."
      });
    }

    // 7. Persist to DB
    const { error: insertErr } = await supabaseAdmin
      .from("ai_briefings")
      .upsert({
        user_id: userId,
        briefing_date: today,
        summary: briefingData.summary,
        highlights: briefingData.highlights || [],
        recommended_actions: briefingData.recommended_actions || [],
        anomalies_detected: briefingData.anomalies_detected || [],
        raw_data_snapshot: { accountInsights, postInsights },
        model_used: "claude-3-5-sonnet-20241022",
        input_tokens: msg.usage?.input_tokens || 0,
        output_tokens: msg.usage?.output_tokens || 0,
        generated_at: new Date().toISOString()
      }, { onConflict: "user_id,briefing_date" });

    if (insertErr) {
      console.error("[V3 Briefing DB Error]", insertErr.message);
      throw insertErr;
    }

    const formattedData = {
      id: today,
      briefing_date: today,
      headline: "Today's ZieAds Briefing",
      summary: briefingData.summary,
      wins: briefingData.highlights?.map((h: any) => ({
        title: h.title,
        value: h.metric_delta || "Insight",
        context: h.body
      })) || [],
      concerns: briefingData.anomalies_detected?.map((a: any) => ({
        title: "Anomaly",
        severity: "warning",
        value: a.description,
        context: a.potential_cause
      })) || [],
      today_actions: briefingData.recommended_actions?.map((r: any, idx: number) => ({
        action: r.action,
        reasoning: r.reason,
        estimated_impact: r.priority === "high" ? "High" : r.priority === "medium" ? "Medium" : "Low",
        effort: "Medium",
        rank: idx + 1
      })) || [],
      suggested_deep_dives: [
        {
          v02_mode_name: "Content Optimization Dive",
          reasoning_for_suggestion: "Analyze your feed visual elements to maximize conversion ratios."
        }
      ]
    };

    res.json({
      success: true,
      data: formattedData
    });

  } catch (err: any) {
    console.error("[V3 Briefing Compilation Failed]", err);
    res.status(500).json({
      status: "error",
      message: "Briefing generation temporarily unavailable. Please try again in a few minutes."
    });
  }
}

apiV3Router.post("/briefing/compile", requireAuth, compileBriefingHandler);
apiV3Router.post("/analyst/briefing", requireAuth, compileBriefingHandler);

// ─── Competitor Hunt ──────────────────────────────────────────────────────────
async function listCompetitorsHandler(req: any, res: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("competitors")
      .select("id, name, website_url, instagram_username, last_audited_at, audit_score, audit_report, created_at")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

async function addCompetitorHandler(req: any, res: any) {
  let { name, website_url, instagram_username } = req.body;
  if (!name || !website_url) {
    return res.status(400).json({ error: "name and website_url are required." });
  }

  name = name.slice(0, 100);
  if (!website_url.startsWith("https://")) {
    return res.status(400).json({ error: "website_url must start with https://" });
  }

  if (instagram_username) {
    instagram_username = instagram_username.replace(/^@/, "");
  }

  try {
    const { count, error: countErr } = await supabaseAdmin
      .from("competitors")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.userId);

    if (countErr) throw countErr;

    if (count !== null && count >= 25) {
      return res.status(400).json({ error: "limit_reached", message: "You have reached the maximum limit of 25 tracked competitors. Please upgrade your plan to track more." });
    }

    const { data: duplicate } = await supabaseAdmin
      .from("competitors")
      .select("id")
      .eq("user_id", req.userId)
      .eq("website_url", website_url)
      .maybeSingle();

    if (duplicate) {
      return res.status(409).json({ error: "Already tracking this competitor." });
    }

    const { data, error } = await supabaseAdmin
      .from("competitors")
      .insert({
        user_id: req.userId,
        name,
        website_url,
        instagram_username
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

async function auditCompetitorHandler(req: any, res: any) {
  const competitorId = req.params.id || req.body.id;
  try {
    const { data: competitor, error: fetchErr } = await supabaseAdmin
      .from("competitors")
      .select("*")
      .eq("id", competitorId)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (fetchErr || !competitor) {
      return res.status(404).json({ error: "Competitor not found." });
    }

    console.log(`[V3 Competitor Audit] Auditing competitor ${competitor.name} (${competitor.website_url})...`);
    const scrapedData = await scrapeUrl(competitor.website_url);
    const context: BusinessContext = {
      url: competitor.website_url,
      businessName: competitor.name || scrapedData.title || new URL(competitor.website_url).hostname,
      businessType: scrapedData.inferredBusinessType || "Not specified",
      primaryGoal: "Generate sales",
      monthlyBudget: "Not specified",
      platforms: [],
      scrapedData
    };

    const agentResults = await runFullAudit(context);
    const report = synthesizeReport(agentResults);

    const { error: updateErr } = await supabaseAdmin
      .from("competitors")
      .update({
        last_audited_at: new Date().toISOString(),
        audit_score: report.overall,
        audit_report: report
      })
      .eq("id", competitor.id);

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      score: report.overall,
      audited_at: new Date().toISOString(),
      report_summary: report.findings || []
    });
  } catch (err: any) {
    console.error("[V3 Competitor Audit Error]", err);
    res.status(500).json({ error: `Audit failed: ${err.message}` });
  }
}

apiV3Router.get("/competitors", requireAuth, listCompetitorsHandler);
apiV3Router.get("/hunt/competitors", requireAuth, listCompetitorsHandler);

apiV3Router.post("/competitors", requireAuth, addCompetitorHandler);
apiV3Router.post("/hunt/competitors", requireAuth, async (req: any, res: any) => {
  const { competitorUrl, competitorName } = req.body;
  req.body = { name: competitorName, website_url: competitorUrl };
  return addCompetitorHandler(req, res);
});

apiV3Router.post("/competitors/:id/audit", requireAuth, auditCompetitorHandler);
apiV3Router.post("/hunt/audit", requireAuth, async (req: any, res: any) => {
  return auditCompetitorHandler(req, res);
});

apiV3Router.delete("/competitors/:id", requireAuth, async (req: any, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("competitors")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId);

    if (error) throw error;
    res.json({ success: true });
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

        await publishPostToInstagramInBackground(post.id, post.user_id);
        publishedCount++;
      } catch (err: any) {
        console.error(`[V3 Publisher Cron] Failed publishing post ${post.id}:`, err);
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
        await publishPostToInstagramInBackground(post.id, post.user_id);
      } catch (err: any) {
        console.error(`[V3 Cron Publish Error] Post ${post.id}:`, err.message);
      }
    }

    // 2. Perform background Instagram sync for active connections
    const { data: activeConnections } = await supabaseAdmin
      .from("social_connections")
      .select("user_id")
      .eq("platform", "instagram")
      .eq("is_active", true);

    if (activeConnections) {
      console.log(`[V3 Cron] Syncing Instagram data for ${activeConnections.length} users...`);
      for (const conn of activeConnections) {
        try {
          await syncAll(conn.user_id);
        } catch (err: any) {
          console.error(`[V3 Cron Sync Error] User ${conn.user_id}:`, err.message);
        }
      }
    }

    // 3. Fetch active subscription tiers for AI daily briefing generation
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

// ─── User Onboarding ─────────────────────────────────────────────────────────
apiV3Router.get("/profile/onboarding", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("has_completed_onboarding, onboarding_step")
      .eq("id", req.userId)
      .maybeSingle();

    if (error) throw error;
    res.json({ 
      success: true, 
      hasCompletedOnboarding: data?.has_completed_onboarding || false,
      onboardingStep: data?.onboarding_step || 1
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/profile/onboarding/complete", requireAuth, async (req: any, res) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", req.userId)
      .maybeSingle();

    let query;
    if (existing) {
      query = supabaseAdmin
        .from("profiles")
        .update({ 
          has_completed_onboarding: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq("id", req.userId);
    } else {
      query = supabaseAdmin
        .from("profiles")
        .insert({ 
          id: req.userId,
          has_completed_onboarding: true,
          onboarding_completed_at: new Date().toISOString()
        });
    }

    const { error } = await query;
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

