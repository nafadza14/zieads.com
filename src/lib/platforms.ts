/*
  The 12 social networks ZieAds supports, the same breadth as Buffer and Vista Social (Publer 13,
  Metricool 10 to 11). Ordered by how easy and realistic each is to bring live:
    1. Facebook, 2. Instagram  one Meta app and one App Review covers both, code is ready
    3. Threads                 same Meta app, adds the Threads API permissions to that review
    4. Bluesky, 5. Mastodon    open APIs, no app review at all
    6. YouTube                 Google OAuth verification, then a quota audit for uploads
    7. LinkedIn                profile posting works; Company Pages need Community Management API approval
    8. TikTok                  works in sandbox; public posting needs the Content Posting API audit
    9. Pinterest               trial access first, then a standard access review
   10. Tumblr                  open API, low demand, so it waits behind the ones above
   11. X                       paid API access
   12. Reddit                  commercial use needs Reddit's approval and strict posting rules
  status 'available' means the connect flow exists in ZieAds today (it still needs each platform's
  review before outside users can connect). 'soon' shows a Soon label until the API is wired up.
*/
export type PlatformStatus = 'available' | 'soon';

export interface Platform {
  id: string;
  name: string;
  what: string;
  status: PlatformStatus;
  tokenDays?: number;
}

export const PLATFORMS: Platform[] = [
  { id: 'facebook', name: 'Facebook', what: 'Pages: posts, insights, comments', status: 'available' },
  { id: 'instagram', name: 'Instagram', what: 'Professional account: posts, Reels, insights, comments', status: 'available', tokenDays: 60 },
  { id: 'threads', name: 'Threads', what: 'Posts, replies and insights', status: 'soon' },
  { id: 'bluesky', name: 'Bluesky', what: 'Posts, threads and replies', status: 'soon' },
  { id: 'mastodon', name: 'Mastodon', what: 'Posts and replies on any server', status: 'soon' },
  { id: 'youtube', name: 'YouTube', what: 'Videos and Shorts, comments and channel stats', status: 'soon' },
  { id: 'linkedin', name: 'LinkedIn', what: 'Your profile: text posts. Company Pages after LinkedIn review', status: 'available', tokenDays: 60 },
  { id: 'tiktok', name: 'TikTok', what: 'Profile stats and videos, upload to your TikTok inbox', status: 'available' },
  { id: 'pinterest', name: 'Pinterest', what: 'Pins, boards and audience stats', status: 'soon' },
  { id: 'tumblr', name: 'Tumblr', what: 'Posts to your blogs', status: 'soon' },
  { id: 'x', name: 'X', what: 'Posts, threads and replies', status: 'soon' },
  { id: 'reddit', name: 'Reddit', what: 'Posts to your profile and communities you moderate', status: 'soon' },
];

export const PLATFORM_COUNT = PLATFORMS.length;
export const platformName = (id: string) => PLATFORMS.find((p) => p.id === id)?.name || id;
