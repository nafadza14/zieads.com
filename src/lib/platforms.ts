/*
  The 14 social networks ZieAds supports (Buffer and Vista Social list 12, Publer 13).
  Ordered by how easy and realistic each is to bring live for outside users:
    1. Facebook, 2. Instagram   one Meta app and one App Review covers both
    3. Threads                  same Meta app, adds the Threads permissions to that review
    4. Telegram, 5. Discord     no review at all: a bot in the channel, or a channel webhook
    6. Bluesky, 7. Mastodon     open APIs, no review
    8. YouTube                  Google OAuth verification, then a quota audit (until then uploads stay private)
    9. LinkedIn                 profile posting works; Company Pages need Community Management API approval
   10. TikTok                   public posting needs the Content Posting API audit
   11. Pinterest                trial access first, then a standard access review
   12. Tumblr, 13. X, 14. Reddit  not wired up yet (low demand, paid API, commercial approval)
  status 'available': the connect flow and publisher exist. 'soon': shown with a Soon label.
  connect 'oauth' opens the network's sign in screen; 'form' asks for the fields below first
  (Mastodon asks for the server, then signs in there).
*/
export type PlatformStatus = 'available' | 'soon';

export interface ConnectField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'url';
  optional?: boolean;
  help?: string;
}

export interface Platform {
  id: string;
  name: string;
  what: string;
  status: PlatformStatus;
  tokenDays?: number;
  connect?: 'oauth' | 'form' | 'oauth_form';
  fields?: ConnectField[];
  howTo?: string;
}

export const PLATFORMS: Platform[] = [
  { id: 'facebook', name: 'Facebook', what: 'Pages: posts, insights, comments', status: 'available', connect: 'oauth' },
  { id: 'instagram', name: 'Instagram', what: 'Professional account: posts, Reels, insights, comments', status: 'available', tokenDays: 60, connect: 'oauth' },
  { id: 'threads', name: 'Threads', what: 'Text, photo, video and carousel posts', status: 'available', tokenDays: 60, connect: 'oauth' },
  {
    id: 'telegram',
    name: 'Telegram',
    what: 'Posts to a channel or group, with photos and videos',
    status: 'available',
    connect: 'form',
    howTo: 'Add the ZieAds bot (or your own bot from @BotFather) to your channel as an admin that can post messages.',
    fields: [
      { key: 'chat', label: 'Channel or group', placeholder: '@yourchannel or -1001234567890' },
      { key: 'bot_token', label: 'Your bot token', placeholder: '123456789:AA...', type: 'password', optional: true, help: 'Leave empty to use the ZieAds bot.' },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    what: 'Posts to a channel through a webhook, with images',
    status: 'available',
    connect: 'form',
    howTo: 'In Discord open the channel settings, then Integrations, Webhooks, New Webhook, and copy its URL.',
    fields: [{ key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', type: 'url' }],
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    what: 'Posts with up to 4 images, links and hashtags',
    status: 'available',
    connect: 'form',
    howTo: 'Create an app password in Bluesky: Settings, Privacy and security, App passwords. Never use your main password.',
    fields: [
      { key: 'handle', label: 'Handle', placeholder: 'you.bsky.social' },
      { key: 'app_password', label: 'App password', placeholder: 'xxxx-xxxx-xxxx-xxxx', type: 'password' },
    ],
  },
  {
    id: 'mastodon',
    name: 'Mastodon',
    what: 'Posts with up to 4 images or a video, on any server',
    status: 'available',
    connect: 'oauth_form',
    howTo: 'Enter the server your account is on. ZieAds opens its sign in page.',
    fields: [{ key: 'instance', label: 'Your server', placeholder: 'mastodon.social' }],
  },
  { id: 'youtube', name: 'YouTube', what: 'Videos and Shorts with title, description and privacy', status: 'available', connect: 'oauth' },
  { id: 'linkedin', name: 'LinkedIn', what: 'Your profile: text posts. Company Pages after LinkedIn review', status: 'available', tokenDays: 60, connect: 'oauth' },
  { id: 'tiktok', name: 'TikTok', what: 'Profile stats and videos, upload to your TikTok inbox', status: 'available', connect: 'oauth' },
  { id: 'pinterest', name: 'Pinterest', what: 'Image Pins to your boards, with a link', status: 'available', connect: 'oauth' },
  { id: 'tumblr', name: 'Tumblr', what: 'Posts to your blogs', status: 'soon' },
  { id: 'x', name: 'X', what: 'Posts, threads and replies', status: 'soon' },
  { id: 'reddit', name: 'Reddit', what: 'Posts to your profile and communities you moderate', status: 'soon' },
];

export const PLATFORM_COUNT = PLATFORMS.length;
export const platformName = (id: string) => PLATFORMS.find((p) => p.id === id)?.name || id;
