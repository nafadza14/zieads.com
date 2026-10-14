# Competitor Hunt: live ads and posts

When a user tracks a competitor, ZieAds shows that brand's real content in its original format: ads from the ad libraries and organic posts from its accounts, in one filterable feed.

## The short version

| Source | Free option (recommended) | How it gets the data |
|---|---|---|
| Meta ads (Facebook + Instagram) | ZieAds Collector | Opens the public Meta Ad Library logged out and reads the ads the page loads |
| Instagram posts | Business Discovery API (official) or ZieAds Collector | Meta's official API through your own Instagram Business account, or the public profile page |
| TikTok videos | Official creator embed + ZieAds Collector | The embed shows the 10 latest videos live in the browser; the collector saves them with stats |
| Facebook page posts | Official Page Plugin embed | Facebook's own widget shows the page timeline live |
| LinkedIn ads | ZieAds Collector | Reads the public LinkedIn Ad Library |
| TikTok ads | Not available for Indonesia | TikTok only publishes ads shown in Europe. The UI links to TikTok Creative Center |

Everything above costs nothing. A paid provider (Scrape Creators, `SCRAPECREATORS_API_KEY`) is still supported if you ever want collection to run fully in the cloud.

## Why not scrape from the ZieAds server?

ZieAds runs on Vercel, which runs on AWS. Meta, Instagram and TikTok block cloud IP addresses on the first request, while home and office connections get the normal page. So scraping from the server only works with paid residential proxies. The free answer is to run the scraping part on a normal internet connection: the ZieAds Collector on your own computer.

## 1. Run the database migration

Open Supabase, SQL Editor, New query, paste the contents of `supabase/migrations/20261014_competitor_content.sql` and press Run. It is safe to run more than once.

## 2. Instagram Business Discovery (free, official, runs on the server)

Meta's Instagram Graph API can read any public Business or Creator account through an Instagram Business account you own. While the Meta app stays in development mode, the app's own admins can use it without App Review.

1. Make your own brand's Instagram a Business account and link it to a Facebook Page.
2. In the Meta app ZieAds already uses, add the product "Instagram" (API setup with Facebook login).
3. Open Graph API Explorer, pick the app, add the permissions `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`, and generate a user token. Exchange it for a long-lived token (60 days), or better, create a System User in Business Settings and generate a token that does not expire.
4. Find your Instagram Business account ID: `GET /me/accounts?fields=instagram_business_account` in Graph API Explorer.
5. Add to Vercel: `META_DISCOVERY_TOKEN` and `META_DISCOVERY_IG_ID`.

Limits: about 200 calls per hour for the app user, private and age-restricted accounts are not returned, personal (non business) accounts are not returned.

## 3. ZieAds Collector (free, runs on your computer)

A small script in `collector/zieads-collector.ts`. It opens the public pages in your installed Google Chrome, logged out, reads the data those pages load for any visitor, and saves it to Supabase. It never logs in to any platform.

Setup on Windows:

```
cd C:\Users\USER\Documents\zieads.com
npm install
```

Make sure `.env` in the project folder has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (the same values as in Vercel). Optional: `COLLECTOR_COUNTRY` (default `ID`), `COLLECTOR_HOURS` (default 6), `COLLECTOR_HEADLESS=false` to watch the browser, `CHROME_PATH` if Chrome is installed somewhere unusual.

Run it:

```
npm run collector              one pass over every competitor that is due
npm run collector -- --loop    keep running, one pass every COLLECTOR_HOURS
npm run collector -- --only=<competitor id>
```

To run it automatically, create a Windows Task Scheduler task that runs `npm run collector` in the project folder every 6 hours (Trigger: daily, repeat every 6 hours; Action: `cmd /c cd /d C:\Users\USER\Documents\zieads.com && npm run collector`). The computer must be on and online at those times.

What it collects per competitor, one after another with short random pauses:

- Meta Ad Library: up to about 60 ads (image, video, carousel, text, CTA, start date, active or ended, versions). If the Facebook page ID is unknown it searches by brand name and keeps only ads from the matching page, then saves the page ID.
- Instagram profile: the latest 12 to 24 posts with likes, comments and plays.
- TikTok profile: the latest videos with views, likes, comments, shares and saves.
- LinkedIn Ad Library: ads from the matching advertiser.

The collector reads data by walking the JSON the pages load instead of fixed paths and by following links to ad detail pages instead of CSS class names, so small layout changes on the platforms do not break it. If a platform shows a login wall or captcha, that source is marked as failed for this run and retried next time. Each source shows its status as a dot on its filter chip in Competitor Hunt.

While the collector has reported on a source in the last 48 hours, the server leaves that source to it.

## 4. Official embeds (free, no setup)

Competitor Hunt shows TikTok's creator embed (latest 10 videos) and Facebook's Page Plugin (page timeline) whenever no saved posts exist yet for that platform. These load in the viewer's browser straight from TikTok and Facebook, so they are always current and need no scraping.

## Things to know

- Terms of service: Meta, Instagram, TikTok and LinkedIn forbid automated collection in their terms. In Meta v. Bright Data (2024) a US court found that scraping public data while logged out did not breach Meta's terms, but that is one US case, not a general permission. The official routes (Business Discovery, Meta Ad Library API, embeds) carry no such risk. This is not legal advice.
- Volume: keep it to your tracked competitors and a few runs a day. Heavy use from one IP gets rate limited.
- Media links from the platforms expire after a few days. Cards show "Preview expired" until the next run.
- Ad performance (spend, ROAS) is private on every platform. Competitor Hunt uses public signals: days running, active or ended, number of versions, engagement on organic posts.

## API

- `GET /api/v3/competitors` list, with `content_stats` per competitor
- `POST /api/v3/competitors` add (`name`, `website_url`, optional `instagram_username`, `tiktok_username`, `facebook_url`, `linkedin_url`)
- `PATCH /api/v3/competitors/:id` edit accounts
- `POST /api/v3/competitors/:id/sync` server-side refresh (`{ force: true }` skips the 30 minute freshness check)
- `GET /api/v3/competitors/:id/content?kind=ad|organic&source=&active=1` feed, summary and `setup` (which sources are configured)
- `GET /api/v3/hunt/media?u=&s=` signed image proxy for Instagram and Facebook thumbnails

The AI Agent reads the same data with the `get_competitor_content` tool.

## Code map

- `server/competitors/sources.ts`: mappers that turn each platform's raw data into one `ContentItem` shape, plus server adapters (Business Discovery, Meta Ad Library API, optional paid provider, TikTok Ad Library).
- `server/competitors/sync.ts`: server refresh, `saveContent`, `mergeStatus`, media proxy signing.
- `collector/zieads-collector.ts`: the local collector (uses `playwright-core` with your installed Chrome).
