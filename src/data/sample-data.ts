// Acme Coffee Co Sample Data Fixtures for Onboarding Demo Mode

export interface DemoConnection {
  id: string;
  platform: string;
  account_handle: string;
  platform_account_id: string;
  is_active: boolean;
  follower_count: number;
}

export const sampleConnections: DemoConnection[] = [
  { id: "demo_ig", platform: "instagram", account_handle: "@acme_coffee", platform_account_id: "demo_ig_acct", is_active: true, follower_count: 12400 },
  { id: "demo_tt", platform: "tiktok", account_handle: "@acme_coffee_co", platform_account_id: "demo_tt_acct", is_active: true, follower_count: 8200 },
  { id: "demo_li", platform: "linkedin", account_handle: "Acme Coffee Co", platform_account_id: "demo_li_acct", is_active: true, follower_count: 3100 }
];

export interface DemoPost {
  id: string;
  title: string; // matches format in calendar events
  start: string; // ISO date string matching "posted_at" or "scheduled_for"
  type: "published" | "scheduled" | "queued" | "draft";
  status: string;
  platforms: { platform: string; account_handle: string }[];
  media: string[];
  likes: number;
  comments: number;
  reach: number;
  engagementRate: number;
}

// Helper to generate dynamic dates relative to today
const offsetDate = (daysOffset: number, hoursOffset: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
};

export const sampleOrganicPosts: DemoPost[] = [
  {
    id: "demo_pub_1",
    title: "Start your morning right with our new signature cold brew blend. ☕✨ #coffee #signature",
    start: offsetDate(-1, -4),
    type: "published",
    status: "published",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: ["https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600"],
    likes: 382,
    comments: 29,
    reach: 6500,
    engagementRate: 0.063
  },
  {
    id: "demo_pub_2",
    title: "Behind the scenes: roasting the perfect batch of dark roast beans today.",
    start: offsetDate(-3, -2),
    type: "published",
    status: "published",
    platforms: [{ platform: "tiktok", account_handle: "@acme_coffee_co" }],
    media: ["https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600"],
    likes: 492,
    comments: 38,
    reach: 9200,
    engagementRate: 0.057
  },
  {
    id: "demo_pub_3",
    title: "Acme Coffee Co is proud to support the local neighborhood clean-up initiative this weekend! 🌍🌱",
    start: offsetDate(-5, -6),
    type: "published",
    status: "published",
    platforms: [{ platform: "linkedin", account_handle: "Acme Coffee Co" }],
    media: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600"],
    likes: 184,
    comments: 12,
    reach: 3400,
    engagementRate: 0.058
  },
  {
    id: "demo_pub_4",
    title: "What is your go-to coffee order when you are running late? Comment below!",
    start: offsetDate(-7, -3),
    type: "published",
    status: "published",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: ["https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=600"],
    likes: 215,
    comments: 42,
    reach: 5200,
    engagementRate: 0.049
  },
  {
    id: "demo_pub_5",
    title: "Monday motivation start now: double shot espresso. ☕🚀",
    start: offsetDate(-10, -1),
    type: "published",
    status: "published",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: ["https://images.unsplash.com/photo-1510972527921-ce041ee94df0?w=600"],
    likes: 310,
    comments: 18,
    reach: 5800,
    engagementRate: 0.056
  }
];

// Generate 25 additional realistic historical posts to satisfy the 30-day posting history check
for (let i = 6; i <= 30; i++) {
  const likes = Math.round(50 + Math.random() * 300);
  const comments = Math.round(3 + Math.random() * 25);
  const reach = Math.round(1500 + Math.random() * 4000);
  sampleOrganicPosts.push({
    id: `demo_pub_${i}`,
    title: `Acme Coffee Co post volume #${i} celebrating the art of coffee. ☕`,
    start: offsetDate(-i - 1, -Math.round(Math.random() * 8)),
    type: "published",
    status: "published",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"],
    likes,
    comments,
    reach,
    engagementRate: Number(((likes + comments) / reach).toFixed(3))
  });
}

// 8 sample scheduled posts in next 14 days
export const sampleScheduledPosts: DemoPost[] = [
  {
    id: "demo_sch_1",
    title: "Get 20% off all bags of beans this Friday. Mark your calendars! 🛍️☕",
    start: offsetDate(1, 2),
    type: "scheduled",
    status: "scheduled",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: ["https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600"],
    likes: 0, comments: 0, reach: 0, engagementRate: 0
  },
  {
    id: "demo_sch_2",
    title: "Why cold brew has more caffeine than espresso - and other myths debunked. 🧪",
    start: offsetDate(3, 4),
    type: "scheduled",
    status: "scheduled",
    platforms: [{ platform: "linkedin", account_handle: "Acme Coffee Co" }],
    media: [],
    likes: 0, comments: 0, reach: 0, engagementRate: 0
  },
  {
    id: "demo_sch_3",
    title: "How to froth milk at home without a machine. Simple hack video! 🥛💨",
    start: offsetDate(5, 1),
    type: "scheduled",
    status: "queued",
    platforms: [{ platform: "tiktok", account_handle: "@acme_coffee_co" }],
    media: ["https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=600"],
    likes: 0, comments: 0, reach: 0, engagementRate: 0
  },
  {
    id: "demo_sch_4",
    title: "Meet our head barista, Leo! Sharing his favorite pour-over recipe today.",
    start: offsetDate(7, 3),
    type: "scheduled",
    status: "queued",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: ["https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600"],
    likes: 0, comments: 0, reach: 0, engagementRate: 0
  },
  {
    id: "demo_sch_5",
    title: "Eco-friendly packaging updates: our new 100% compostable bags are here.",
    start: offsetDate(9, 2),
    type: "scheduled",
    status: "draft",
    platforms: [{ platform: "linkedin", account_handle: "Acme Coffee Co" }],
    media: [],
    likes: 0, comments: 0, reach: 0, engagementRate: 0
  },
  {
    id: "demo_sch_6",
    title: "Pour-over technique vs. French press: which one brings out more flavor notes?",
    start: offsetDate(10, 5),
    type: "scheduled",
    status: "scheduled",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"],
    likes: 0, comments: 0, reach: 0, engagementRate: 0
  },
  {
    id: "demo_sch_7",
    title: "Tasting notes: Ethiopia Yirgacheffe. Floral, citrusy, and sweet.",
    start: offsetDate(12, 1),
    type: "scheduled",
    status: "queued",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: [],
    likes: 0, comments: 0, reach: 0, engagementRate: 0
  },
  {
    id: "demo_sch_8",
    title: "Late night study session helper: cold brew on tap. 📚☕",
    start: offsetDate(14, 4),
    type: "scheduled",
    status: "queued",
    platforms: [{ platform: "instagram", account_handle: "@acme_coffee" }],
    media: ["https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=600"],
    likes: 0, comments: 0, reach: 0, engagementRate: 0
  }
];

export const sampleAdData = [
  {
    campaign_name: "Meta Lead Gen - Signature Cold Brew Launch",
    spend_usd: 350,
    impressions: 24500,
    clicks: 680,
    conversions: 18,
    roas: 2.8
  }
];

export const sampleDailyBriefing = {
  headline: "Instagram colder engagement spikes, check Meta CPC spend",
  wins: [
    { title: "Engagement Boost", metric: "Cold Brew Post", value: "6.3%", context: "Highest Cold Brew launch engagement rate this month (+22%)" },
    { title: "Audience Growth", metric: "Followers", value: "+148", context: "1.2% audience increase in last 7 days" },
    { title: "Roas Efficiency", metric: "Meta Campaign", value: "2.8x", context: "Steady return above 2.5x target ROAS threshold" }
  ],
  concerns: [
    { title: "CPC Inflation", metric: "Ad Spend", value: "$0.51", severity: "medium" },
    { title: "LinkedIn Inactivity", metric: "Post Freq", value: "0 posts", severity: "low" }
  ],
  today_actions: [
    { rank: 1, action: "Increase budget of Meta Lead Gen cold brew launch campaign by 15%", reasoning: "ROAS is steady at 2.8x with room to scale.", estimated_impact: "High", effort: "Quick" },
    { rank: 2, action: "Publish scheduled Coffee Myths article on LinkedIn", reasoning: "Maintains posting momentum to preserve organic reach index.", estimated_impact: "Medium", effort: "Quick" },
    { rank: 3, action: "Reply to commenter @sarah_k in Unified Inbox", reasoning: "Customer inquiries left unanswered for >24 hours drops profile engagement rank.", estimated_impact: "Medium", effort: "Quick" }
  ],
  suggested_deep_dives: [
    { v02_mode_name: "Budget Optimization", reasoning_for_suggestion: "Allocate more resources to cold brew segment due to scaling ROAS." },
    { v02_mode_name: "Campaign Health", reasoning_for_suggestion: "Validate if target ad group CPC is inflating due to audience saturation." }
  ]
};

export interface DemoComment {
  id: string;
  commenter_handle: string;
  commenter_display_name: string;
  comment_text: string;
  commented_at: string;
  sentiment: "positive" | "neutral" | "negative";
  platform: string;
  is_archived: boolean;
  user_has_replied: boolean;
  user_replied_at?: string;
  social_posts?: { content_text: string };
}

export const sampleCommentsInbox: DemoComment[] = [
  { id: "c_1", commenter_handle: "@alex_digital", commenter_display_name: "Alex", comment_text: "Wow! I tried this cold brew cold foam setup yesterday, it is pure heaven.", commented_at: offsetDate(0, -1), sentiment: "positive", platform: "instagram", is_archived: false, user_has_replied: false, social_posts: { content_text: "Start your morning right with our new signature cold brew blend." } },
  { id: "c_2", commenter_handle: "@sarah_k", commenter_display_name: "Sarah", comment_text: "Do you ship your beans to Canada? I want to buy a bag.", commented_at: offsetDate(0, -3), sentiment: "neutral", platform: "instagram", is_archived: false, user_has_replied: false, social_posts: { content_text: "Start your morning right with our new signature cold brew blend." } },
  { id: "c_3", commenter_handle: "@mike_roast", commenter_display_name: "Mike", comment_text: "My bag arrived torn and some beans spilled inside the box. Very upset.", commented_at: offsetDate(-1, -2), sentiment: "negative", platform: "instagram", is_archived: false, user_has_replied: false, social_posts: { content_text: "Behind the scenes roasting the perfect batch..." } },
  { id: "c_4", commenter_handle: "@coffeelover9", commenter_display_name: "Emma", comment_text: "Best coffee in town! Period.", commented_at: offsetDate(-1, -5), sentiment: "positive", platform: "instagram", is_archived: false, user_has_replied: false },
  { id: "c_5", commenter_handle: "@brent_m", commenter_display_name: "Brent", comment_text: "Are you opening any new branches in Seattle soon?", commented_at: offsetDate(-2, -1), sentiment: "neutral", platform: "instagram", is_archived: false, user_has_replied: false },
  { id: "c_6", commenter_handle: "@jessica_t", commenter_display_name: "Jessica", comment_text: "Roast profile looks incredibly even. Great job!", commented_at: offsetDate(-2, -4), sentiment: "positive", platform: "tiktok", is_archived: false, user_has_replied: false },
  { id: "c_7", commenter_handle: "@clara_beans", commenter_display_name: "Clara", comment_text: "I loved the organic dark roast! Extremely rich aroma.", commented_at: offsetDate(-3, -2), sentiment: "positive", platform: "instagram", is_archived: false, user_has_replied: false },
  { id: "c_8", commenter_handle: "@tim_d", commenter_display_name: "Tim", comment_text: "Is there a decaf version of the signature blend?", commented_at: offsetDate(-3, -6), sentiment: "neutral", platform: "instagram", is_archived: false, user_has_replied: false },
  { id: "c_9", commenter_handle: "@roast_master", commenter_display_name: "Leo", comment_text: "Very cool behind the scenes tour. Roaster setup is clean.", commented_at: offsetDate(-4, -1), sentiment: "positive", platform: "tiktok", is_archived: false, user_has_replied: false },
  { id: "c_10", commenter_handle: "@diane_w", commenter_display_name: "Diane", comment_text: "Beans are slightly too oily for my superautomatic machine.", commented_at: offsetDate(-4, -5), sentiment: "neutral", platform: "instagram", is_archived: false, user_has_replied: false },
  { id: "c_11", commenter_handle: "@acme_fan", commenter_display_name: "John", comment_text: "Subscribed! Love the brand philosophy.", commented_at: offsetDate(-5, -2), sentiment: "positive", platform: "instagram", is_archived: false, user_has_replied: false },
  { id: "c_12", commenter_handle: "@gourmet_guy", commenter_display_name: "Sam", comment_text: "Awesome to see you guys clean up the neighborhood parks!", commented_at: offsetDate(-5, -6), sentiment: "positive", platform: "linkedin", is_archived: false, user_has_replied: false }
];

export const sampleCompetitor = {
  competitor_name: "Starbucks",
  competitor_url: "https://starbucks.com",
  latest_audit_score: 67,
  last_audited_at: offsetDate(-2, 0),
  audit_history: [
    { score: 67, grade: "B", audited_at: offsetDate(-2, 0) }
  ]
};

export const sampleBestPostingTimes = [
  { day: "Tuesday", time: "11:00 AM", confidence: 0.94 },
  { day: "Thursday", time: "02:00 PM", confidence: 0.88 },
  { day: "Wednesday", time: "09:00 AM", confidence: 0.82 }
];
