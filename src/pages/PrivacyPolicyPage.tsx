/*
  Privacy Policy (spec P0-5): a section per platform with what we read, how long
  we keep it, how to revoke and how to delete. YouTube API Services statement and
  Google Privacy Policy link included for the YouTube audit.
*/
import { Link } from 'react-router-dom';
import PublicShell from './landing/PublicShell';

const UPDATED = 'November 3, 2026';

const PLATFORMS: Array<{ name: string; read: string; stored: string; keep: string; revoke: string }> = [
  {
    name: 'Facebook Pages (Meta)',
    read: 'Pages you manage (pages_show_list, business_management), Page posts and their engagement (pages_read_engagement), Page and post insights (read_insights), comments on your Page posts (pages_read_user_content), and permission to publish and reply on the Page you choose (pages_manage_posts, pages_manage_engagement, pages_manage_metadata).',
    stored: 'Page name, id and picture, an encrypted Page access token, your posts, their metrics, comments and the replies you send.',
    keep: 'While the Page is connected. Deleted when you disconnect, when you remove ZieAds in Facebook settings (data deletion callback), or when you delete your account.',
    revoke: 'Facebook Settings, Apps and websites, remove ZieAds. Or Connections in ZieAds, Disconnect.',
  },
  {
    name: 'Instagram (Meta)',
    read: 'Your professional account profile (instagram_business_basic), insights (instagram_business_manage_insights), comments and replies (instagram_business_manage_comments) and publishing (instagram_business_content_publish). For competitor tracking, public profiles of Business and Creator accounts through Business Discovery.',
    stored: 'Profile, an encrypted access token, posts, metrics, comments and replies, and public posts of competitors you track.',
    keep: 'While connected. Deleted on disconnect, on a Meta data deletion request, or when you delete your account.',
    revoke: 'Instagram Settings, Apps and websites, remove ZieAds. Or Connections in ZieAds, Disconnect.',
  },
  {
    name: 'TikTok',
    read: 'Basic profile and stats (user.info.basic, user.info.profile, user.info.stats), your public videos (video.list), and, when granted, upload to your TikTok inbox or direct posting (video.upload, video.publish).',
    stored: 'Display name, avatar, follower counts, video list and metrics, an encrypted access and refresh token.',
    keep: 'While connected. Deleted on disconnect or when you delete your account.',
    revoke: 'TikTok Settings, Security, Manage app permissions. Or Connections in ZieAds, Disconnect.',
  },
  {
    name: 'LinkedIn',
    read: 'Sign in and basic profile (openid, profile, email) and posting to your own profile (w_member_social). Company Page management (w_organization_social, r_organization_social, rw_organization_admin) only after LinkedIn approves it and you connect a Page.',
    stored: 'Name, profile id, an encrypted access token, and the posts you publish from ZieAds.',
    keep: 'While connected. LinkedIn access lasts 60 days and is renewed when you reconnect. Deleted on disconnect or account deletion.',
    revoke: 'LinkedIn Settings, Data privacy, Permitted services. Or Connections in ZieAds, Disconnect.',
  },
  {
    name: 'Google and YouTube',
    read: 'When available: YouTube channel data and uploads (youtube.readonly, youtube.upload, youtube.force-ssl, yt-analytics.readonly) and Google Ads reports (read only).',
    stored: 'Channel or account id and name, encrypted tokens, video and report metrics.',
    keep: 'While connected. Deleted on disconnect or account deletion.',
    revoke: 'myaccount.google.com/permissions, remove ZieAds. Or Connections in ZieAds, Disconnect.',
  },
  {
    name: 'X (when available)',
    read: 'Your profile, your posts and their metrics, and publishing on your behalf.',
    stored: 'Profile, encrypted tokens, your posts and metrics.',
    keep: 'While connected. Deleted on disconnect or account deletion.',
    revoke: 'X Settings, Security and account access, Connected apps. Or Connections in ZieAds, Disconnect.',
  },
  {
    name: 'Meta, Google and TikTok Ads',
    read: 'Read-only reporting (ads_read on Meta, reporting on Google Ads and TikTok) or a CSV you import: campaign, ad set and ad names, dates, spend, impressions, clicks, conversions and revenue.',
    stored: 'Those report rows. Never payment methods, never the people who saw your ads. ZieAds cannot change campaigns or spend budget.',
    keep: 'While connected or until you delete the import.',
    revoke: 'Remove ZieAds in each Ads Manager, or delete the import in ZieAds.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PublicShell title="Privacy Policy | ZieAds" description="How ZieAds collects, uses, stores and deletes data from Instagram, Facebook, TikTok, LinkedIn, Google, YouTube and ads platforms.">
      <h1>Privacy Policy</h1>
      <p className="ps-note">Last updated {UPDATED}. Version 3.0.</p>
      <p className="ps-lede">
        ZieAds is operated by PT. Bantu Indonesia Technology, Indonesia. This policy explains what we collect, why, how long we keep it, and how you remove it. We follow Indonesia's Personal Data Protection Law (UU PDP No. 27 of 2022) and the
        developer policies of every platform we connect to.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> your name, email, password hash or Google sign in, brand profile, settings and team invitations.
        </li>
        <li>
          <strong>Connected platforms:</strong> only the data each platform shares under the permissions you approve, listed per platform in section 3.
        </li>
        <li>
          <strong>Content you create:</strong> posts, drafts, replies, uploaded media and messages to the AI agent.
        </li>
        <li>
          <strong>Usage and security logs:</strong> sign ins, pages used, errors, IP address and browser, and an activity log of actions in your account.
        </li>
        <li>
          <strong>Billing:</strong> plan and invoices. Card details are handled by our payment provider and never reach our servers.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To run the product: schedule and publish posts, show analytics, collect comments into the inbox, track competitors and compile your briefing.</li>
        <li>To let the AI agent analyse your data and prepare drafts. Nothing is published, replied to or spent without your approval.</li>
        <li>To keep the service reliable and secure, and to support you when you ask for help.</li>
        <li>We do not sell personal data, do not use platform data for advertising, and do not use it to train AI models.</li>
      </ul>

      <h2>3. Platform by platform</h2>
      <p>We only use official platform APIs. Access tokens are encrypted (AES-256) and never shown in the app, exported or shared.</p>
      {PLATFORMS.map((p) => (
        <div key={p.name} className="ps-box">
          <h3 style={{ marginTop: 0 }}>{p.name}</h3>
          <p>
            <strong>What we read:</strong> {p.read}
          </p>
          <p>
            <strong>What we store:</strong> {p.stored}
          </p>
          <p>
            <strong>How long:</strong> {p.keep}
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>How to revoke:</strong> {p.revoke}
          </p>
        </div>
      ))}

      <h2>4. YouTube API Services</h2>
      <p>
        ZieAds uses YouTube API Services. By connecting YouTube to ZieAds you agree to the{' '}
        <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
          YouTube Terms of Service
        </a>{' '}
        and acknowledge the{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google Privacy Policy
        </a>
        . You can revoke ZieAds' access at any time at{' '}
        <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer">
          Google security settings
        </a>
        . ZieAds' use and transfer of information received from Google APIs adheres to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>

      <h2>5. AI processing</h2>
      <p>
        Briefings, analysis modes and drafts are produced by AI models from Anthropic (Claude) and Google (Gemini), reached directly or through our AI gateway provider Sumopod. We send only the data needed for the request. These providers process it to return a
        result and do not use it to train their models under our agreements. AI output is a suggestion: you review it before anything goes live, and AI written replies are disclosed where a platform requires it.
      </p>

      <h2>6. Who processes data for us</h2>
      <table className="ps-table">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Database and sign in</td>
          </tr>
          <tr>
            <td>Vercel</td>
            <td>Hosting and media storage</td>
          </tr>
          <tr>
            <td>Anthropic, Google, Sumopod</td>
            <td>AI processing</td>
          </tr>
          <tr>
            <td>Dodo Payments</td>
            <td>Billing</td>
          </tr>
          <tr>
            <td>Mailgun</td>
            <td>Email delivery</td>
          </tr>
        </tbody>
      </table>
      <p>Data can be processed outside Indonesia by these providers under contracts that protect it as this policy describes.</p>

      <h2>7. Retention and deletion</h2>
      <ul>
        <li>Platform data is kept while the platform is connected and deleted when you disconnect it.</li>
        <li>Deleting your account in Settings removes all of your data and your login right away. Encrypted backups roll over within 30 days.</li>
        <li>Invoices are kept for 10 years as Indonesian tax law requires.</li>
        <li>
          Step by step instructions, and the status check for Facebook and Instagram deletion requests, are on the <Link to="/data-deletion">Data Deletion</Link> page.
        </li>
      </ul>

      <h2>8. Your rights</h2>
      <p>
        You can access and export your data (Settings, Data and privacy), correct it, delete it, withdraw consent by disconnecting a platform, and object to processing. Email <a href="mailto:privacy@zieads.com">privacy@zieads.com</a> for anything else; we reply
        within 7 days. You can also complain to the Indonesian data protection authority.
      </p>

      <h2>9. Security</h2>
      <p>
        Tokens are encrypted at rest, every account is isolated with row level security, connections use TLS, and an append only activity log records who did what. If a breach affects you, we tell you and the authority within 72 hours.
      </p>

      <h2>10. Children</h2>
      <p>ZieAds is for businesses and is not meant for anyone under 18.</p>

      <h2>11. Cookies</h2>
      <p>We use only the cookies and local storage needed to keep you signed in and remember your settings. No advertising cookies.</p>

      <h2>12. Changes and contact</h2>
      <p>
        We announce material changes by email and in the app at least 14 days before they apply. Contact: PT. Bantu Indonesia Technology, <a href="mailto:privacy@zieads.com">privacy@zieads.com</a>. See also the{' '}
        <Link to="/terms">Terms of Service</Link>.
      </p>
    </PublicShell>
  );
}
