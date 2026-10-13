/*
  Brand profile: everything the user tells ZieAds about their business.
  It is the main knowledge source for Zie (the AI Agent), the AI Analyst and content tools.

  Storage: profiles.brand_profile (JSONB, see supabase/migrations/20261013_brand_profile.sql).
  Until that migration runs, the profile is kept in the user's auth metadata so nothing is lost.
*/
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseServer.js";
import { scrapeUrl } from "./scraper.js";
import { callSumopodAI } from "./utils/sumopodClient.js";
import { NO_EM_DASH_RULE, deepStripDashes } from "./utils/noEmDash.js";

export interface BrandProfile {
  identity?: { name?: string; website?: string; industry?: string; location?: string; markets?: string; languages?: string[]; description?: string };
  offer?: { summary?: string; products?: Array<{ name?: string; price?: string; note?: string }>; price_range?: string; usp?: string };
  audience?: { description?: string; age_range?: string; gender?: string; interests?: string; pain_points?: string };
  voice?: { tones?: string[]; emoji?: "none" | "some" | "lots"; formality?: "casual" | "balanced" | "formal"; words_use?: string; words_avoid?: string; sample_post?: string };
  goals?: { primary_goal?: string; goals?: string[]; monthly_budget?: string; platforms?: string[]; posting_frequency?: string; role?: string; account_volume?: string };
  competitors?: string[];
  rules?: string;
  updated_at?: string;
}

const clip = (v: any, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);
const clipList = (v: any, items: number, n: number) => (Array.isArray(v) ? v.map((x) => clip(String(x), n)).filter(Boolean).slice(0, items) : undefined) as string[] | undefined;

/** Keep only known fields with sane lengths */
export function sanitizeBrandProfile(input: any): BrandProfile {
  const i = input || {};
  const out: BrandProfile = {
    identity: {
      name: clip(i.identity?.name, 120),
      website: clip(i.identity?.website, 300),
      industry: clip(i.identity?.industry, 120),
      location: clip(i.identity?.location, 160),
      markets: clip(i.identity?.markets, 200),
      languages: clipList(i.identity?.languages, 6, 40),
      description: clip(i.identity?.description, 800),
    },
    offer: {
      summary: clip(i.offer?.summary, 800),
      products: Array.isArray(i.offer?.products)
        ? i.offer.products.slice(0, 15).map((p: any) => ({ name: clip(p?.name, 120), price: clip(p?.price, 60), note: clip(p?.note, 240) })).filter((p: any) => p.name)
        : undefined,
      price_range: clip(i.offer?.price_range, 80),
      usp: clip(i.offer?.usp, 600),
    },
    audience: {
      description: clip(i.audience?.description, 800),
      age_range: clip(i.audience?.age_range, 40),
      gender: clip(i.audience?.gender, 40),
      interests: clip(i.audience?.interests, 400),
      pain_points: clip(i.audience?.pain_points, 600),
    },
    voice: {
      tones: clipList(i.voice?.tones, 8, 40),
      emoji: ["none", "some", "lots"].includes(i.voice?.emoji) ? i.voice.emoji : undefined,
      formality: ["casual", "balanced", "formal"].includes(i.voice?.formality) ? i.voice.formality : undefined,
      words_use: clip(i.voice?.words_use, 400),
      words_avoid: clip(i.voice?.words_avoid, 400),
      sample_post: clip(i.voice?.sample_post, 2200),
    },
    goals: {
      primary_goal: clip(i.goals?.primary_goal, 120),
      goals: clipList(i.goals?.goals, 10, 80),
      monthly_budget: clip(i.goals?.monthly_budget, 60),
      platforms: clipList(i.goals?.platforms, 10, 40),
      posting_frequency: clip(i.goals?.posting_frequency, 80),
      role: clip(i.goals?.role, 80),
      account_volume: clip(i.goals?.account_volume, 40),
    },
    competitors: clipList(i.competitors, 10, 160),
    rules: clip(i.rules, 1200),
    updated_at: new Date().toISOString(),
  };
  return deepStripDashes(out);
}

/** Read the brand profile (DB column first, auth metadata as fallback) */
export async function getBrandProfile(userId: string): Promise<BrandProfile | null> {
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("brand_profile").eq("id", userId).maybeSingle();
    if (!error && data?.brand_profile && Object.keys(data.brand_profile).length) return data.brand_profile as BrandProfile;
  } catch {}
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    const bp = (data?.user?.user_metadata as any)?.brand_profile;
    if (bp && typeof bp === "object") return bp as BrandProfile;
  } catch {}
  return null;
}

/** Save the brand profile and mirror the basics into the classic profile columns */
export async function saveBrandProfile(userId: string, raw: any): Promise<{ profile: BrandProfile; storage: "database" | "account" }> {
  const profile = sanitizeBrandProfile(raw);
  const mirror: Record<string, any> = {
    id: userId,
    business_name: profile.identity?.name || null,
    primary_url: profile.identity?.website || null,
    business_type: profile.identity?.industry || null,
    monthly_budget: profile.goals?.monthly_budget || null,
    primary_goal: profile.goals?.primary_goal || null,
    goals: profile.goals?.goals || [],
    platforms_in_focus: profile.goals?.platforms || [],
    role: profile.goals?.role || null,
    account_volume: profile.goals?.account_volume || null,
    challenge: profile.audience?.pain_points || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from("profiles").upsert({ ...mirror, brand_profile: profile }, { onConflict: "id" });
  if (!error) return { profile, storage: "database" };

  // Column missing (migration not run yet): keep the basics in profiles and the full profile on the account
  console.warn("[BrandProfile] brand_profile column unavailable, using account metadata:", error.message);
  await supabaseAdmin.from("profiles").upsert(mirror, { onConflict: "id" });
  const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
  const meta = { ...((u?.user?.user_metadata as any) || {}), brand_profile: profile };
  const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: meta });
  if (metaErr) throw new Error(metaErr.message);
  return { profile, storage: "account" };
}

/** How complete the profile is, 0 to 100, with the most useful missing pieces */
export function brandCompleteness(p: BrandProfile | null) {
  const checks: Array<[boolean, string]> = [
    [!!p?.identity?.name, "Business name"],
    [!!p?.identity?.website, "Website"],
    [!!p?.identity?.industry, "Industry"],
    [!!(p?.identity?.description || p?.offer?.summary), "What you sell"],
    [!!p?.offer?.products?.length, "Products or services"],
    [!!p?.offer?.usp, "What makes you different"],
    [!!p?.audience?.description, "Ideal customer"],
    [!!p?.audience?.pain_points, "Customer problems"],
    [!!p?.voice?.tones?.length, "Brand tone"],
    [!!p?.voice?.sample_post, "Example post"],
    [!!p?.goals?.primary_goal, "Main goal"],
    [!!p?.goals?.platforms?.length, "Channels"],
  ];
  const done = checks.filter((c) => c[0]).length;
  return { score: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c[0]).map((c) => c[1]) };
}

/** Turn the profile into a compact brief for AI prompts */
export function brandProfileToPrompt(p: BrandProfile | null): string {
  if (!p) return "";
  const L: string[] = [];
  const add = (label: string, v: any) => {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return;
    L.push(`- ${label}: ${Array.isArray(v) ? v.join(", ") : v}`);
  };
  add("Business", p.identity?.name);
  add("Website", p.identity?.website);
  add("Industry", p.identity?.industry);
  add("Based in", p.identity?.location);
  add("Markets served", p.identity?.markets);
  add("Content languages", p.identity?.languages);
  add("About", p.identity?.description);
  add("What they sell", p.offer?.summary);
  if (p.offer?.products?.length) add("Products", p.offer.products.map((x) => [x.name, x.price && `(${x.price})`, x.note && `: ${x.note}`].filter(Boolean).join(" ")));
  add("Price range", p.offer?.price_range);
  add("Unique selling point", p.offer?.usp);
  add("Ideal customer", p.audience?.description);
  add("Customer age", p.audience?.age_range);
  add("Customer gender", p.audience?.gender);
  add("Customer interests", p.audience?.interests);
  add("Customer problems", p.audience?.pain_points);
  add("Brand tone", p.voice?.tones);
  add("Formality", p.voice?.formality);
  add("Emoji use", p.voice?.emoji);
  add("Words and phrases to use", p.voice?.words_use);
  add("Words to avoid", p.voice?.words_avoid);
  if (p.voice?.sample_post) L.push(`- Example of a post in their voice:\n"""${p.voice.sample_post}"""`);
  add("Main goal", p.goals?.primary_goal);
  add("Other goals", p.goals?.goals);
  add("Monthly ads budget", p.goals?.monthly_budget);
  add("Channels in focus", p.goals?.platforms);
  add("Posting frequency", p.goals?.posting_frequency);
  add("User role", p.goals?.role);
  add("Accounts managed", p.goals?.account_volume);
  add("Competitors", p.competitors);
  if (p.rules) L.push(`- Brand rules Zie must always follow: ${p.rules}`);
  if (!L.length) return "";
  return `\n\n## BRAND PROFILE (written by the user, treat as ground truth; match this voice in every piece of content)\n${L.join("\n")}`;
}

/** Draft a brand profile from a website so the user only has to review it */
export async function autofillBrandProfile(url: string): Promise<BrandProfile> {
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;
  const host = new URL(target).hostname;
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) throw new Error("Private addresses cannot be scanned");
  const site = await scrapeUrl(target);

  const system = `You extract a brand profile for a marketing tool from website data. Respond ONLY with JSON matching this TypeScript type, leave unknown fields out, never invent prices:
{"identity":{"name":string,"website":string,"industry":string,"location":string,"markets":string,"languages":string[],"description":string},"offer":{"summary":string,"products":[{"name":string,"price":string,"note":string}],"price_range":string,"usp":string},"audience":{"description":string,"age_range":string,"interests":string,"pain_points":string},"voice":{"tones":string[],"emoji":"none"|"some"|"lots","formality":"casual"|"balanced"|"formal","words_use":string},"goals":{"primary_goal":string,"platforms":string[]}}
Tones come from: Friendly, Professional, Playful, Bold, Luxurious, Educational, Inspiring, Witty, Caring, Minimalist. ${NO_EM_DASH_RULE}`;
  const user = `Website: ${target}
Title: ${site.title}
Headline: ${site.h1}
Description: ${site.metaDescription || site.ogDescription}
Hero offer: ${site.heroOffer}
Primary call to action: ${site.primaryCTA}
Headings: ${site.headings.slice(0, 12).map((h) => h.text).join(" | ")}
Signals: ecommerce=${site.businessSignals.hasEcommerce}, pricing=${site.businessSignals.hasPricing}, lead form=${site.businessSignals.hasLeadForm}
Inferred type: ${site.inferredBusinessType}`;

  let text = "";
  try {
    if (process.env.SUMOPOD_API_KEY) text = await callSumopodAI(system, user);
    else if (process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const r: any = await client.messages.create({ model: process.env.AGENT_MODEL || "claude-opus-4-6", max_tokens: 1500, system, messages: [{ role: "user", content: user }] });
      text = r.content?.[0]?.text || "";
    }
  } catch (e: any) {
    console.warn("[BrandProfile] AI autofill failed, using page data only:", e.message);
  }

  let parsed: any = {};
  const json = text.replace(/<think>[\s\S]*?<\/think>/gi, "").match(/\{[\s\S]*\}/);
  if (json) {
    try {
      parsed = JSON.parse(json[0]);
    } catch {}
  }
  // Always have the basics from the page itself
  parsed.identity = { name: site.title?.split(/[|\-:]/)[0]?.trim(), website: target, industry: site.inferredBusinessType, description: site.metaDescription || site.ogDescription, ...(parsed.identity || {}) };
  parsed.offer = { summary: site.heroOffer || undefined, ...(parsed.offer || {}) };
  return sanitizeBrandProfile(parsed);
}
