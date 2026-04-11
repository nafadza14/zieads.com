import * as cheerio from "cheerio";

export interface ScrapedData {
  url: string;
  title: string;
  h1: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  detectedPixels: string[];
  utmParameters: string[];
  scriptTags: string[];
  links: string[];
  headings: { tag: string; text: string }[];
  businessSignals: {
    hasEcommerce: boolean;
    hasPricing: boolean;
    hasLeadForm: boolean;
    hasBlog: boolean;
    hasChatWidget: boolean;
  };
  inferredBusinessType: string;
  heroOffer: string;
  primaryCTA: string;
  pageLoadTime: number;
}

const PIXEL_PATTERNS: Record<string, RegExp[]> = {
  "Meta Pixel": [/fbq\(/, /facebook\.net\/en_US\/fbevents/, /connect\.facebook\.net/],
  "Google Tag Manager": [/googletagmanager\.com/, /gtm\.js/, /GTM-/],
  "Google Analytics": [/google-analytics\.com/, /gtag\(/, /ga\(.*create/],
  "TikTok Pixel": [/analytics\.tiktok\.com/, /tiktok.*pixel/i, /ttq\.load/, /ttq\.js/, /TikTokAnalyticsObject/],
  "LinkedIn Insight Tag": [/snap\.licdn\.com/, /linkedin.*insight/i],
  "Pinterest Tag": [/pintrk\(/, /s\.pinimg\.com/],
  "Hotjar": [/hotjar\.com/, /hj\(/],
  "Microsoft Clarity": [/clarity\.ms/],
};

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  const startTime = Date.now();
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  let html: string;
  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
  } catch (err: any) {
    throw new Error(`Failed to fetch ${url}: ${err.message}`);
  }

  const pageLoadTime = Date.now() - startTime;
  const $ = cheerio.load(html);

  // Extract basic metadata
  const title = $("title").text().trim() || "";
  const h1 = $("h1").first().text().trim() || "";
  const metaDescription =
    $('meta[name="description"]').attr("content") || "";
  const ogTitle =
    $('meta[property="og:title"]').attr("content") || "";
  const ogDescription =
    $('meta[property="og:description"]').attr("content") || "";
  const ogImage =
    $('meta[property="og:image"]').attr("content") || "";

  // Extract all script tag content for pixel detection
  const scriptTags: string[] = [];
  $("script").each((_, el) => {
    const src = $(el).attr("src") || "";
    const inline = $(el).html() || "";
    if (src) scriptTags.push(src);
    if (inline.length > 10 && inline.length < 5000) scriptTags.push(inline);
  });

  // Detect tracking pixels
  const detectedPixels: string[] = [];
  const allScriptContent = scriptTags.join(" ");
  for (const [pixelName, patterns] of Object.entries(PIXEL_PATTERNS)) {
    if (patterns.some((p) => p.test(allScriptContent))) {
      detectedPixels.push(pixelName);
    }
  }

  // Extract links and detect UTM parameters
  const links: string[] = [];
  const utmParameters: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    links.push(href);
    if (href.includes("utm_")) {
      const params = new URL(href, url).searchParams;
      params.forEach((val, key) => {
        if (key.startsWith("utm_")) {
          utmParameters.push(`${key}=${val}`);
        }
      });
    }
  });

  // Extract all headings
  const headings: { tag: string; text: string }[] = [];
  $("h1, h2, h3").each((_, el) => {
    headings.push({
      tag: el.tagName.toLowerCase(),
      text: $(el).text().trim().slice(0, 120),
    });
  });

  // Detect business signals
  const fullText = $("body").text().toLowerCase();
  const fullHtml = html.toLowerCase();
  const businessSignals = {
    hasEcommerce:
      /add.to.cart|shop.now|buy.now|shopify|woocommerce|bigcommerce|cart/i.test(
        fullHtml
      ),
    hasPricing:
      /pricing|plans|\/pricing|per.month|\$\d+/i.test(fullHtml),
    hasLeadForm:
      $("form").length > 0 ||
      /book.a.demo|schedule|contact.us|get.started|sign.up/i.test(fullText),
    hasBlog:
      /\/blog|\/articles|\/resources/i.test(
        links.join(" ")
      ),
    hasChatWidget:
      /intercom|drift|crisp|freshchat|tawk|zendesk|livechat/i.test(
        fullHtml
      ),
  };

  // Infer business type
  let inferredBusinessType = "Other";
  if (businessSignals.hasEcommerce) {
    inferredBusinessType = "E-commerce";
  } else if (
    businessSignals.hasPricing &&
    /saas|software|platform|app|tool|dashboard/i.test(fullText)
  ) {
    inferredBusinessType = "SaaS";
  } else if (
    /local|near.me|location|store.hours|directions/i.test(fullText)
  ) {
    inferredBusinessType = "Local Business";
  } else if (
    /b2b|enterprise|company.size|industry|teams/i.test(fullText)
  ) {
    inferredBusinessType = "B2B Lead Gen";
  } else if (businessSignals.hasLeadForm) {
    inferredBusinessType = "Lead Gen";
  }

  // Extract hero offer
  const heroOffer =
    ogDescription ||
    metaDescription ||
    h1 ||
    title ||
    "Could not determine primary offer";

  // Extract primary CTA
  let primaryCTA = "";
  const ctaSelectors = [
    'a[class*="cta"]',
    'button[class*="cta"]',
    'a[class*="btn"]',
    'button[class*="btn"]',
    ".hero a",
    ".hero button",
    "header a",
  ];
  for (const sel of ctaSelectors) {
    const text = $(sel).first().text().trim();
    if (text && text.length < 50) {
      primaryCTA = text;
      break;
    }
  }
  if (!primaryCTA) {
    $("a, button").each((_, el) => {
      const text = $(el).text().trim();
      if (
        !primaryCTA &&
        text.length < 40 &&
        /get.started|sign.up|buy|shop|learn.more|try|start|book|schedule|contact/i.test(
          text
        )
      ) {
        primaryCTA = text;
      }
    });
  }

  return {
    url,
    title,
    h1,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage,
    detectedPixels,
    utmParameters: [...new Set(utmParameters)],
    scriptTags: scriptTags.filter((s) => s.startsWith("http")).slice(0, 20),
    links: links.filter((l) => l.startsWith("http")).slice(0, 50),
    headings: headings.slice(0, 20),
    businessSignals,
    inferredBusinessType,
    heroOffer: heroOffer.slice(0, 300),
    primaryCTA: primaryCTA || "Not detected",
    pageLoadTime,
  };
}
