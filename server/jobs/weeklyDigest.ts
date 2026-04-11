import { supabaseAdmin } from "../supabaseServer.js";
import { runQuickScan } from "../agents.js";
import { scrapeUrl } from "../scraper.js";

/**
 * Alert email payload builder.
 * Drop in your Mailgun / Sendgrid client here — the payload is pre-structured.
 */
async function sendScoreDropAlert(params: {
  toEmail: string;
  businessName: string;
  url: string;
  previousScore: number;
  newScore: number;
  drop: number;
}) {
  const { toEmail, businessName, url, previousScore, newScore, drop } = params;

  const subject = `⚠️ Ads Score Alert: ${businessName} dropped ${drop} points`;
  const body = `
Your ZieAds readiness score for ${businessName} (${url}) has dropped.

  Previous score : ${previousScore}/100
  Current score  : ${newScore}/100
  Change         : -${drop} points

This may indicate a recent change to your landing page, a missing tracking pixel,
or a new CRO issue. Run a full audit to get the detailed breakdown:
https://zieads.com/audit

— The ZieAds Team
`.trim();

  // ── Mailgun example (uncomment + install mailgun-js to enable) ──────────
  // const mailgun = new Mailgun({ apiKey: process.env.MAILGUN_API_KEY!, domain: process.env.MAILGUN_DOMAIN! });
  // await mailgun.messages.create(process.env.MAILGUN_DOMAIN!, { from: 'ZieAds <alerts@zieads.com>', to: toEmail, subject, text: body });

  // ── Sendgrid example (uncomment + install @sendgrid/mail to enable) ─────
  // await sgMail.send({ to: toEmail, from: 'alerts@zieads.com', subject, text: body });

  // Fallback: structured log so the payload is visible and ready to wire up
  console.log("[Alert Email Payload]", JSON.stringify({ to: toEmail, subject, body }, null, 2));
}

/**
 * MOCK CRON JOB STRUCTURE
 * In production, wire this to BullMQ or Trigger.dev to run every Monday at 9 AM.
 */
export async function runWeeklyDigests() {
  console.log("[Weekly Digest] Starting batch job...");

  // 1. Fetch profiles where weekly_digest = true
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("weekly_digest", true);

  if (error || !profiles) {
    console.error("[Weekly Digest] Failed to fetch opted-in profiles");
    return;
  }

  for (const profile of profiles) {
    if (!profile.primary_url) continue;

    try {
      // 2. Fetch most recent audit to calculate delta
      const { data: lastAudit } = await supabaseAdmin
        .from("audits")
        .select("overall_score")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const previousScore: number = lastAudit?.overall_score ?? 0;

      // 3. Run fresh quick scan
      const scrapedData = await scrapeUrl(profile.primary_url);
      const ctx = {
        url: profile.primary_url,
        businessName: profile.business_name || scrapedData.title,
        businessType: profile.business_type || scrapedData.inferredBusinessType,
        primaryGoal: profile.primary_goal || "Not specified",
        monthlyBudget: profile.monthly_budget || "Not specified",
        platforms: profile.platforms || [],
        scrapedData,
      };
      const result = await runQuickScan(ctx);

      // 4. Score-drop delta alert
      if (previousScore > 0 && result.score < previousScore) {
        const drop = previousScore - result.score;
        console.log(
          `[Alert] Score dropped ${drop} pts for ${profile.primary_url} (${previousScore} → ${result.score})`
        );

        // Fetch user email from Supabase Auth
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        const toEmail = userData?.user?.email;
        if (toEmail) {
          await sendScoreDropAlert({
            toEmail,
            businessName: profile.business_name || profile.primary_url,
            url: profile.primary_url,
            previousScore,
            newScore: result.score,
            drop,
          });
        }
      }

      console.log(
        `[Weekly Digest] Processed ${profile.primary_url}. New Score: ${result.score}`
      );
    } catch (err) {
      console.error(`[Weekly Digest] Failed processing job for ${profile.id}`, err);
    }
  }

  console.log("[Weekly Digest] Batch job complete.");
}
