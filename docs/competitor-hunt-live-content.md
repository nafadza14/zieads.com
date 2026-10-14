# Competitor Hunt: live ads and posts

When a user tracks a competitor, ZieAds shows that brand's real content in its original format: ads from the ad libraries and organic posts from its accounts, in one filterable feed.

## What is shown and where it comes from

| Feed source | What | Data source | Coverage notes |
|---|---|---|---|
| Meta ads | Ads on Facebook, Instagram, Messenger, Audience Network: image, video, carousel, text, CTA, start date, days running, active or ended, number of versions | Meta Ad Library via Scrape Creators `/v1/facebook/adLibrary/company/ads` (page found with `/search/companies`) | All countries, commercial ads included. Without a provider key the official Meta API is used, which outside the EU mostly returns political and issue ads only |
| TikTok ads | Ad video, cover, first and last shown date | TikTok public Ad Library (library.tiktok.com) | TikTok only publishes ads shown in the EU, EEA, UK and Switzerland. Brands that only advertise in Indonesia return nothing, the UI says so and links to TikTok Creative Center. Beta: it reads an undocumented public endpoint, so it can break if TikTok changes it |
| LinkedIn ads | Ad text, headline, image, video, carousel, CTA, impressions range | LinkedIn Ad Library via Scrape Creators `/v1/linkedin/ads/search` | Global |
| Instagram | Posts, reels, carousels with likes, comments, plays | Scrape Creators `/v2/instagram/user/posts` | Public accounts |
| Facebook | Page posts with reactions, comments, video views | Scrape Creators `/v1/facebook/profile/posts` | Public pages |
| TikTok | Videos with views, likes, comments, shares, saves | Scrape Creators `/v3/tiktok/profile/videos` | Public accounts |
| LinkedIn | Company page posts | Scrape Creators `/v1/linkedin/company` | Public company pages, text and date only |

Why a provider: Meta's official Ad Library API does not return commercial ads outside the EU, TikTok's Commercial Content API is EU only and limited to approved researchers, LinkedIn has no ad library API, and ZieAds connects Instagram with Instagram Login, which does not include Business Discovery. One provider key covers every platform. The adapters live in `server/competitors/sources.ts`, so a provider can be swapped per source.

## Setup

1. Run the migration `supabase/migrations/20261014_competitor_content.sql` in the Supabase SQL editor.
2. Create an API key at https://scrapecreators.com and add it to Vercel as `SCRAPECREATORS_API_KEY`.
3. Optional env vars:
   - `COMPETITOR_REFRESH_HOURS` (default 12): how stale a competitor can get before the monitor tick refreshes it.
   - `TIKTOK_ADLIB_REGIONS` (default `GB,DE,FR`): European regions searched for TikTok ads. `TIKTOK_ADLIB_ENABLED=false` turns the TikTok ads source off.
4. Make sure the monitor tick runs (see `docs/ai-analyst-monitoring.md`). Each tick refreshes the stalest competitors with the time left after account syncs.

## How fresh it is

- Adding a competitor finds its accounts from the website and the Meta Ad Library, then pulls everything right away.
- Opening a competitor whose content is older than 6 hours refreshes it in the background.
- The Refresh button pulls again (at most every 2 minutes).
- The monitor tick refreshes every competitor at least every `COMPETITOR_REFRESH_HOURS`.

## Cost

About 8 provider credits per competitor refresh (one per source, two pages of Meta ads). On the Freelance plan ($47 for 25,000 credits) that is about $0.015 per refresh, so 10 competitors refreshed twice a day cost about $9 a month.

## API

- `GET /api/v3/competitors` list, with `content_stats` per competitor
- `POST /api/v3/competitors` add (`name`, `website_url`, optional `instagram_username`, `tiktok_username`, `facebook_url`, `linkedin_url`)
- `PATCH /api/v3/competitors/:id` edit accounts
- `POST /api/v3/competitors/:id/sync` refresh (`{ force: true }` skips the 30 minute freshness check)
- `GET /api/v3/competitors/:id/content?kind=ad|organic&source=&active=1` feed and summary
- `GET /api/v3/hunt/media?u=&s=` signed image proxy. Instagram and Facebook images refuse to load on other sites, so thumbnails go through it. Only URLs the server signed are proxied, and only from known social CDNs.

The AI Agent reads the same data with the `get_competitor_content` tool.

## Notes

- Media links from the platforms are signed and expire after a few days, so a card shows "Preview expired" until the next refresh.
- Only public content is collected. Check the provider's terms and the platforms' terms for your use.
