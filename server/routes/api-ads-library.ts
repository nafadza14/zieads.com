import express from "express";

export const adsLibraryRouter = express.Router();

// ─── Meta Ads Library API ────────────────────────────────────────────────────
// GET /api/ads-library?domain=example.com&limit=12&platform=FACEBOOK,INSTAGRAM
adsLibraryRouter.get("/", async (req, res) => {
  const { domain = "", limit = "12", platform = "" } = req.query as Record<string, string>;

  const token = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!token) {
    return res.json({ success: true, configured: false, data: [], message: "FACEBOOK_ACCESS_TOKEN not set" });
  }

  try {
    // Extract clean domain for search
    let searchTerm = domain;
    try {
      const parsed = new URL(domain.startsWith("http") ? domain : `https://${domain}`);
      searchTerm = parsed.hostname.replace(/^www\./, "");
    } catch {
      // use as-is
    }

    const fields = [
      "id",
      "ad_creative_bodies",
      "ad_creative_link_titles",
      "ad_creative_link_descriptions",
      "ad_snapshot_url",
      "page_name",
      "page_id",
      "ad_delivery_start_time",
      "ad_delivery_stop_time",
      "impressions",
      "platforms",
      "publisher_platforms",
    ].join(",");

    const params = new URLSearchParams({
      search_terms: searchTerm,
      ad_type: "ALL",
      access_token: token,
      limit,
      fields,
      ad_active_status: "ALL",
      ad_reached_countries: "['ALL']",
    });
    if (platform) params.set("publisher_platforms", `['${platform.toUpperCase()}']`);

    const apiUrl = `https://graph.facebook.com/v19.0/ads_archive?${params.toString()}`;
    const resp = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
    const json = await resp.json();

    if (json.error) {
      console.error("[Ads Library] Meta API error:", json.error);
      return res.json({ success: false, configured: true, error: json.error.message, data: [] });
    }

    // Normalise the results
    const ads = (json.data || []).map((ad: any) => {
      const started = ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time) : null;
      const stopped = ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : null;
      const runningDays = started
        ? Math.floor(((stopped || new Date()).getTime() - started.getTime()) / 86_400_000)
        : null;

      const isActive = !ad.ad_delivery_stop_time;
      const platforms: string[] = ad.publisher_platforms || ad.platforms || [];

      return {
        id: ad.id,
        snapshotUrl: ad.ad_snapshot_url || null,
        pageName: ad.page_name || "",
        pageId: ad.page_id || "",
        // Profile picture as thumbnail stand-in (public graph endpoint)
        pagePicture: ad.page_id
          ? `https://graph.facebook.com/${ad.page_id}/picture?type=normal&access_token=${encodeURIComponent(token)}`
          : null,
        headline: ad.ad_creative_link_titles?.[0] || null,
        body: ad.ad_creative_bodies?.[0] || null,
        description: ad.ad_creative_link_descriptions?.[0] || null,
        platforms,
        runningDays,
        isActive,
        impressions: ad.impressions || null,
        startDate: ad.ad_delivery_start_time || null,
      };
    });

    res.json({ success: true, configured: true, data: ads, total: ads.length });
  } catch (err: any) {
    console.error("[Ads Library] Error:", err.message);
    res.status(500).json({ success: false, configured: true, error: err.message, data: [] });
  }
});
