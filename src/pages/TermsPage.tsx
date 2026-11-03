/* Terms of Service (spec P0-5). Same shell, footer and links as every public page. */
import { Link } from 'react-router-dom';
import PublicShell from './landing/PublicShell';

export default function TermsPage() {
  return (
    <PublicShell title="Terms of Service | ZieAds" description="The terms for using ZieAds, the AI social media manager by PT. Bantu Indonesia Technology.">
      <h1>Terms of Service</h1>
      <p className="ps-note">Last updated November 3, 2026. Version 3.0.</p>

      <h2>1. Agreement</h2>
      <p>
        These terms are a contract between you and PT. Bantu Indonesia Technology, an Indonesian limited liability company in the Special Region of Yogyakarta, which operates ZieAds at zieads.com. By creating an account or using ZieAds you agree to them. If you
        use ZieAds for a company, you confirm you may bind that company.
      </p>

      <h2>2. The service</h2>
      <p>
        ZieAds is an AI social media manager: scheduling and publishing, a comment inbox, analytics, competitor tracking, read-only ads reporting, a daily briefing, an AI agent and an MCP server. The agent prepares work and recommends actions. Posts, replies and
        other public actions run only after you, or a rule you set up yourself, approve them. ZieAds never spends ad budget or changes campaigns.
      </p>

      <h2>3. Accounts</h2>
      <p>You must be 18 or older and give accurate details. Keep your login safe and tell us at legal@zieads.com if someone else gets access. Team members you invite act within the role you give them, and you are responsible for their actions.</p>

      <h2>4. Plans and billing</h2>
      <ul>
        <li>Plans are priced per brand: Free, Starter $29, Pro $79 and Agency $199 a month, with about 20 percent off yearly. Current limits are on the pricing page.</li>
        <li>Paid plans renew automatically. We email you 7 days before each renewal. You can cancel in one click in Settings, Plan and billing; access continues until the end of the paid period.</li>
        <li>First time purchases can be refunded within 14 days. Prices exclude Indonesian VAT (PPN) where it applies.</li>
        <li>If a payment fails after three retries we may move the account to the Free plan.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>Use ZieAds lawfully. Do not publish illegal, hateful, deceptive or infringing content, spam people, buy or sell engagement, automate actions a platform forbids, or try to break, scrape or reverse engineer ZieAds. We may suspend accounts that do.</p>

      <h2>6. Your content</h2>
      <p>
        You own your posts, media and data. You give us a limited licence to store, process and publish them only to provide the service. ZieAds software, design and trademarks belong to PT. Bantu Indonesia Technology.
      </p>

      <h2>7. Platform terms</h2>
      <p>
        When you connect a platform you also agree to its terms, including the Meta Platform Terms and Community Standards, the TikTok Terms of Service and Music Usage Confirmation, the LinkedIn User Agreement, and, for YouTube, the{' '}
        <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
          YouTube Terms of Service
        </a>
        . Platforms can change or restrict their APIs; we are not responsible for actions a platform takes on your account.
      </p>

      <h2>8. AI output</h2>
      <p>Briefings, analyses and drafts are produced by AI and can be wrong. Review them before you approve. They are not legal, financial or professional advice.</p>

      <h2>9. Availability</h2>
      <p>We aim for 99.5 percent uptime and tell you when a post fails. We may change features with reasonable notice.</p>

      <h2>10. Disclaimers</h2>
      <p>The service is provided as is and as available, without warranties beyond those the law requires.</p>

      <h2>11. Liability</h2>
      <p>To the extent the law allows, we are not liable for indirect or consequential losses, and our total liability is limited to what you paid us in the 12 months before the claim.</p>

      <h2>12. Indemnity</h2>
      <p>You will cover claims that arise from your content or your breach of these terms or a platform's terms.</p>

      <h2>13. Ending the agreement</h2>
      <p>
        You can delete your account at any time in Settings, Data and privacy. We may suspend or end access for serious or repeated breaches. Data is handled as the <Link to="/privacy-policy">Privacy Policy</Link> and the{' '}
        <Link to="/data-deletion">Data Deletion</Link> page describe.
      </p>

      <h2>14. Law and disputes</h2>
      <p>These terms are governed by the laws of the Republic of Indonesia. Disputes not settled within 30 days go to the Yogyakarta District Court (Pengadilan Negeri Yogyakarta).</p>

      <h2>15. Changes</h2>
      <p>We announce material changes by email or in the app 14 days before they apply.</p>

      <h2>16. Contact</h2>
      <p>
        PT. Bantu Indonesia Technology, Omah Dongeng, Somodaran, Purwomartani, Kalasan, Special Region of Yogyakarta, Indonesia. <a href="mailto:legal@zieads.com">legal@zieads.com</a>, +62 851 5762 6264.
      </p>
    </PublicShell>
  );
}
