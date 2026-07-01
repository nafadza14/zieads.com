import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { 
  Shield, 
  Lock, 
  ExternalLink, 
  Mail, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Printer,
  User,
  Database,
  CreditCard,
  Sparkles
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Design Lineage (Extracted from Landing Page):
   - Typography: Font 'Geist', Headings 'Bricolage Grotesque' or 'General Sans'
   - Colors: Primary #09090B, Accent Gradient, Border #E4E4E7
   - Layout: Centered column (max-w-[720px]) with equal spacing on left & right
   ═══════════════════════════════════════════════════════ */

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page min-h-screen antialiased bg-white text-[#1A1A1A]" style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="lp-line-top"></div>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, footer, .print-action-bar, .no-print {
            display: none !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
            line-height: 1.6 !important;
          }
          h2 {
            page-break-before: always;
            border-bottom: 1.5px solid #000 !important;
            padding-bottom: 8px !important;
            margin-top: 30px !important;
          }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-inner relative w-full h-full flex items-center justify-between">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <ZieAdsLogo size={32} />
            <span className="brand-name">zieads</span>
          </div>
          <div className="nav-links hidden md:flex">
            <a href="/#how-it-works">How It Works</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#faq">FAQ</a>
          </div>
          <div className="nav-actions hidden md:flex">
            <button className="btn-login" onClick={() => navigate('/sign-in')}>Log in</button>
            <button className="btn-get-started" onClick={() => navigate('/sign-up')}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* CENTERED MAIN CONTENT CONTAINER */}
      <div className="w-full flex flex-col items-center justify-center relative z-10">
        <main className="w-full max-w-[720px] px-6 pt-[140px] pb-24 text-left">
          
          {/* Title Zone */}
          <div className="mb-12 border-b border-zinc-200 pb-8">
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-4xl sm:text-[44px] font-extrabold text-black tracking-tight leading-tight mb-4">
              Privacy Policy
            </h1>
            <div className="text-xs text-zinc-500 space-y-1 font-mono">
              <div>Effective Date: June 30, 2026</div>
              <div>Last Updated: June 30, 2026 &bull; Version 2.0.0</div>
              <div className="italic text-zinc-400 mt-2">
                This policy was published on June 30, 2026 with an effective date of June 30, 2026.
              </div>
            </div>

            {/* Quick Print/PDF Action */}
            <div className="flex items-center gap-3 mt-6 print-action-bar">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-500 font-mono text-[10.5px]">
                <Clock size={11} /> ~15 min read
              </span>
              <button 
                onClick={() => window.print()}
                style={{ background: '#fff', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: 4, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={11} /> Print / Save as PDF
              </button>
            </div>
          </div>

          {/* Prose Content */}
          <div className="text-[15.5px] leading-[1.75] text-[#1A1A1A] space-y-10">
            
            {/* SECTION 1 */}
            <section id="introduction" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                1. Introduction & Who We Are
              </h2>
              <p>
                Welcome to ZieAds. This Privacy Policy explains how <strong>PT. Bantu Indonesia Technology</strong>, an Indonesian limited liability company registered in the Special Region of Yogyakarta, Indonesia, operating under the brand name <strong>ZieAds</strong> ("we", "us", "our"), collects, processes, stores, and protects your personal data when you use the website and the social media management application accessible at <strong>zieads.com</strong>. We build software tools that help solopreneurs, small business owners, and marketing teams analyze their advertising performance and manage their organic social channels through advanced artificial intelligence.
              </p>
              <p>
                PT. Bantu Indonesia Technology acts as the <strong>Data Controller</strong> (<em>Pengendali Data Pribadi</em>) under Law of the Republic of Indonesia No. 27 of 2022 concerning Personal Data Protection (<strong>UU PDP</strong>), and as Data Controller under the General Data Protection Regulation (<strong>GDPR</strong>) for users residing within the EU/EEA. By creating a ZieAds account, connecting social media channels, or using the platform, you confirm that you have read, understood, and explicitly consented to the collection and processing of your personal data as outlined in this Privacy Policy.
              </p>
              <p>
                This Privacy Policy covers all visitors to our public marketing website, registered users on all subscription plans (Free, Solo, Pro, and Studio), and legacy users from earlier versions of the product. It does not cover content that we process on behalf of business customers under separate enterprise contracts, nor does it apply to third-party web domains that may link to or from our service.
              </p>
            </section>

            {/* SECTION 2 */}
            <section id="info-collected" className="space-y-6">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                2. Information We Collect
              </h2>
              <p>
                We collect personal data in three ways: information you provide directly to us, information we receive automatically as you interact with our platform, and information we receive from third-party services you choose to connect. We collect only the data necessary to provide our services, secure our platform, comply with legal obligations, and improve the product. We do not sell personal data to third parties under any circumstances.
              </p>

              <div className="space-y-4 pl-4 border-l border-zinc-200">
                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">2.1 Account Information</h3>
                  <p className="text-zinc-650 text-[14.5px]">
                    When you create a ZieAds account, we collect your full name and email address, which serve as your primary identifiers and the channels through which we send transactional communications. We also collect and securely store your password, which is hashed using bcrypt with a per-user salt before storage. We do not store passwords in plaintext, and our staff cannot access your password. If you sign in using a third-party authentication provider (such as Google or LinkedIn OAuth), we store an account linkage record rather than a password.
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">2.2 Advertising Account Data</h3>
                  <p className="text-zinc-650 text-[14.5px]">
                    When you upload advertising performance data via CSV file from Meta Ads Manager, Google Ads, or TikTok Ads Manager, we parse the file and store the campaign performance information. The data we extract from your uploaded CSV files includes campaign names, ad group configurations, ad names, impressions, clicks, total spend, conversion counts, return on ad spend (ROAS), click-through rate (CTR), cost per click (CPC), and cost per thousand impressions (CPM). We explicitly do not access or collect personal data of the end users who viewed your ads, your custom audience source data, or any ad account credentials.
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">2.3 Organic Social Media Data</h3>
                  <p className="text-zinc-650 text-[14.5px]">
                    When you connect your Instagram Business, TikTok, or LinkedIn profile to ZieAds via OAuth authorization, we receive data from those platforms strictly limited to the permission scopes you grant. From Instagram we receive your profile information (username, account type, follower count), published media posts, and post engagement insights. From TikTok we receive your profile display name, avatar, bio, follower counts, videos, and engagement metrics. From LinkedIn we receive your basic profile headline and posts you choose to publish. When you schedule posts or reply to comments, we store the post content and comment texts.
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">2.4 Technical & Usage Data</h3>
                  <p className="text-zinc-650 text-[14.5px]">
                    When you use ZieAds, our servers automatically log information about your interactions with the platform, including the dates and times of access, the features and pages you use, the audit reports and analysis modes you run, the AI briefings you open, errors you encounter, and your browser, operating system, and IP address. We use this technical data to maintain service reliability, diagnose bugs, prevent abuse, monitor system performance, and protect our infrastructure.
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">2.5 Payment Information</h3>
                  <p className="text-zinc-650 text-[14.5px]">
                    If you subscribe to a paid ZieAds tier, payment is processed by Stripe, Inc., a PCI-DSS compliant payment processor. Stripe collects and handles your full payment card information directly through their secure infrastructure — these details never pass through or get stored on ZieAds servers. We receive from Stripe only the information necessary to manage your subscription: your Stripe customer identifier, billing email, the last four digits of your payment card, and transaction history records.
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">2.6 Communications Data</h3>
                  <p className="text-zinc-650 text-[14.5px]">
                    When you contact us by email (such as legal@zieads.com or privacy@zieads.com) or through support channels, we collect and retain the content of your communications. This includes messages, your name, contact information, timestamps, and any attachments. We use this information to respond to your inquiries and improve our support services.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 3 */}
            <section id="how-we-use" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                3. How We Use Your Information
              </h2>
              <p>
                We use your personal data to fulfill our contract with you and to operate our services. Specifically, we use your account information to authenticate your login, establish your secure dashboard workspace, and maintain your billing plan. Your connected organic social media profiles and ad campaign metrics are processed to compile your daily AI briefings, calculate optimal posting times, and generate visual calendars.
              </p>
              <p>
                We also use usage and technical logs to monitor system stability, protect against malicious activities, and debug errors. If you opt-in to marketing communications, we use your contact details to share feature announcements or tutorials. We process communications logs to assist with technical support. All processing operations are conducted under strict row-level separation security to prevent cross-customer access.
              </p>
            </section>

            {/* SECTION 4 */}
            <section id="legal-basis" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                4. Legal Basis for Processing
              </h2>
              <p>
                Under international privacy laws, including the Indonesian PDP Law (Article 20) and the EU GDPR (Article 6), we must establish a valid legal ground to process your personal data. Most of our processing activities are grounded in <strong>Contractual Necessity</strong> — we process your account configuration, social channel tokens, and metric uploads to deliver the core SaaS features you requested.
              </p>
              <p>
                Where we process data to safeguard our database, detect abuse, or optimize performance, we rely on our <strong>Legitimate Interest</strong> to maintain a secure and functional application. Where processing requires explicit opt-in (such as marketing lists or tracking cookies), we rely on your <strong>Consent</strong>, which can be withdrawn at any time. We also process billing records under <strong>Legal Obligation</strong> to comply with national tax laws.
              </p>
            </section>

            {/* SECTION 5 */}
            <section id="subprocessors" className="space-y-6">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                5. Third-Party Services & Sub-processors
              </h2>
              <p>
                We transfer personal data to external sub-processors only when necessary to perform services. All sub-processors are bound by contract to enforce data security standards matching this policy. Below is the list of our current sub-processors:
              </p>

              <div className="space-y-4 pl-4 border-l border-zinc-200 text-[13.5px]">
                <div>
                  <strong>Anthropic, PBC (United States)</strong>
                  <p className="text-zinc-500">We share campaign statistics and content prompts via Claude API to compile daily AI briefings and ad readiness diagnosis. Anthropic does not use ZieAds data to train public models.</p>
                </div>
                <div>
                  <strong>Meta Platforms, Inc. (United States)</strong>
                  <p className="text-zinc-500">Handles Instagram Business profile syncing, publishing posts, and reading insights via official Graph APIs.</p>
                </div>
                <div>
                  <strong>TikTok Pte. Ltd. (Singapore / United States)</strong>
                  <p className="text-zinc-500">Used to publish video assets and retrieve account metrics via TikTok Creator APIs.</p>
                </div>
                <div>
                  <strong>LinkedIn Corporation (United States)</strong>
                  <p className="text-zinc-500">Enables OAuth authentication and feeds publishing for LinkedIn personal profiles.</p>
                </div>
                <div>
                  <strong>Stripe, Inc. (United States)</strong>
                  <p className="text-zinc-500">Processes billing details, payment card tokens, and subscription invoicing.</p>
                </div>
                <div>
                  <strong>Supabase, Inc. (United States / Global Hosting)</strong>
                  <p className="text-zinc-500">Provides database services, authentication infrastructure, and secure encryption vaults for API tokens.</p>
                </div>
                <div>
                  <strong>Vercel, Inc. (United States / Global Hosting)</strong>
                  <p className="text-zinc-500">Hosts the user interface and serves front-end assets securely.</p>
                </div>
                <div>
                  <strong>Resend, Inc. (United States)</strong>
                  <p className="text-zinc-500">Delivers transactional and verification emails directly to users.</p>
                </div>
              </div>
            </section>

            {/* SECTION 6 */}
            <section id="social-integrations" className="space-y-6">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                6. Social Media API Integrations
              </h2>
              <p>
                ZieAds connects programmatically to third-party social networks through secure OAuth authorization protocols. We do not store your passwords for these platforms. You grant permissions explicitly through the respective network’s authorization screen, and you can revoke access at any time.
              </p>

              <div className="space-y-4 pl-4 border-l border-zinc-200">
                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">6.1 Meta (Instagram Graph API)</h3>
                  <p className="text-zinc-650 text-[14px]">
                    We request access to <code>instagram_business_basic</code> to read your profile info, <code>instagram_business_manage_insights</code> to analyze post engagement rates, and <code>instagram_business_content_publish</code> to post scheduled visual contents. Data is stored until you disconnect the channel or delete your account. You can revoke access through your Instagram account settings under Apps and Websites.
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">6.2 TikTok API Integration</h3>
                  <p className="text-zinc-650 text-[14px]">
                    We use TikTok display scopes to read creator stats (follower count, post list) and publishing scopes (<code>video.publish</code>) to post scheduled videos. We adhere to TikTok's UX flow, allowing you to select privacy settings and commercial designations for each post. Revoke permissions in the TikTok app settings under Security &gt; Manage App Access.
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-[14.5px] font-bold text-black">6.3 LinkedIn API Integration</h3>
                  <p className="text-zinc-650 text-[14px]">
                    We request <code>openid</code>, <code>profile</code>, and <code>w_member_social</code> scopes to share scheduled updates directly to your personal LinkedIn profile feed. We do not access company page administration rights unless explicitly requested. You can revoke access through your LinkedIn account under Permitted Services.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 7 */}
            <section id="ai-disclosure" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                7. AI Processing Disclosure
              </h2>
              <p>
                ZieAds utilizes artificial intelligence models powered by Anthropic's Claude API to compile daily briefings, anomaly alerts, and ad audits. When you upload campaign logs or use chat diagnostics, data points are transmitted securely to Anthropic for real-time analysis.
              </p>
              <p>
                Per Anthropic's developer policy, data transmitted via the Claude API is processed temporarily, is not stored permanently by them, and is explicitly not used to train public LLM models. The generated insights represent suggestions; you retain full control and responsibility over verifying and editing recommendations before taking action.
              </p>
            </section>

            {/* SECTION 8 */}
            <section id="retention" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                8. Data Retention & Deletion
              </h2>
              <p>
                We retain personal data only for the period necessary to deliver services or comply with laws. When you delete your account, we initiate an automated scrub to permanently erase your profile, campaign uploads, and connected OAuth tokens within 90 days.
              </p>
              <p>
                Billing and transaction records are retained for ten years to satisfy Indonesian national tax recordkeeping requirements (<em>Undang-Undang Ketentuan Umum dan Tata Cara Perpajakan</em>). Backup database archives are rotated and overwritten every 30 days.
              </p>
            </section>

            {/* SECTION 9 */}
            <section id="your-rights" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                9. Your Rights & How to Exercise Them
              </h2>
              <p>
                Under UU PDP (Indonesia) and GDPR (Europe), you hold specific rights regarding your personal data. These include the right to access a copy of your records, correct incorrect profile data, request deletion (the right to be forgotten), withdraw your consent for future processing, or obtain your data in a portable JSON format.
              </p>
              <p>
                To exercise any of these rights, contact our privacy desk at <strong>privacy@zieads.com</strong> or <strong>legal@zieads.com</strong>. We require identity verification to prevent unauthorized disclosures and respond to all validated requests within 30 days.
              </p>
            </section>

            {/* SECTION 10 */}
            <section id="legal-bases-table" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                10. Legal Bases for Processing
              </h2>
              <p>
                The following table maps our processing activities, the data types involved, and their legal grounds under UU PDP and GDPR:
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }} className="min-w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E4E4E7', background: '#FAFAFA' }}>
                      <th style={{ padding: '8px 10px' }}>Purpose</th>
                      <th style={{ padding: '8px 10px' }}>Data Type</th>
                      <th style={{ padding: '8px 10px' }}>Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                      <td style={{ padding: '8px 10px' }}>Service Delivery (v0.2/v0.3 features)</td>
                      <td style={{ padding: '8px 10px' }}>Account Info, Metrics, OAuth Tokens</td>
                      <td style={{ padding: '8px 10px' }}>Contract (UU PDP Art. 20.b, GDPR Art. 6(1)(b))</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                      <td style={{ padding: '8px 10px' }}>Payment and Invoicing</td>
                      <td style={{ padding: '8px 10px' }}>Identity details, Stripe ID</td>
                      <td style={{ padding: '8px 10px' }}>Contract</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                      <td style={{ padding: '8px 10px' }}>Security & Abuse Prevention</td>
                      <td style={{ padding: '8px 10px' }}>IP address, Usage log files</td>
                      <td style={{ padding: '8px 10px' }}>Legitimate Interest (UU PDP Art. 20.f, GDPR Art. 6(1)(f))</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                      <td style={{ padding: '8px 10px' }}>Tax compliance</td>
                      <td style={{ padding: '8px 10px' }}>Billing logs</td>
                      <td style={{ padding: '8px 10px' }}>Legal Obligation (UU PDP Art. 20.c, GDPR Art. 6(1)(c))</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 10px' }}>Product Updates Newsletter</td>
                      <td style={{ padding: '8px 10px' }}>Email address</td>
                      <td style={{ padding: '8px 10px' }}>Consent (UU PDP Art. 20.a, GDPR Art. 6(1)(a))</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 11 */}
            <section id="regional-disclosures" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                11. Regional Supplemental Disclosures
              </h2>
              
              <div className="space-y-4 pl-4 border-l border-zinc-200">
                <div className="space-y-1">
                  <strong>11.1 Indonesia (UU PDP)</strong>
                  <p className="text-zinc-500 text-[14px]">
                    Pursuant to Law No. 27 of 2022, all communications regarding your rights can be processed in Bahasa Indonesia upon request. Supervisory authority resides with the Indonesian Data Protection Institution (<em>Lembaga Pelaksana Pelindungan Data Pribadi</em>).
                  </p>
                </div>
                <div className="space-y-1">
                  <strong>11.2 EU/EEA (GDPR) & United Kingdom</strong>
                  <p className="text-zinc-500 text-[14px]">
                    For EU/EEA residents, you have the right to lodge a complaint with your local Data Protection Authority (DPA). In the UK, complains can be directed to the Information Commissioner's Office (ICO).
                  </p>
                </div>
                <div className="space-y-1">
                  <strong>11.3 California, US (CCPA)</strong>
                  <p className="text-zinc-500 text-[14px]">
                    We do not sell your personal information. Under CCPA, you have the right to request access, erasure, and non-discrimination for exercising your rights.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong>11.4 Canada (PIPEDA)</strong>
                  <p className="text-zinc-500 text-[14px]">
                    We store and process data in cloud servers located in the US/Global nodes. Your data may be subject to disclosure under local laws of those jurisdictions.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 12 */}
            <section id="cookies" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                12. Cookies & Tracking
              </h2>
              <p>
                We use cookies for session authentication, keeping you logged in across dashboard navigations, and recalling timezone offsets. We also run anonymized, self-hosted analytics metrics (PostHog) to track dashboard performance without recording individual browser histories. We do not use advertising or profiling tracking cookies.
              </p>
            </section>

            {/* SECTION 13 */}
            <section id="children" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                13. Children's Privacy
              </h2>
              <p>
                ZieAds is designed for business operators, solopreneurs, and marketing professionals. We do not knowingly collect personal data of minors under 18 years of age. If you believe a child has created an account, contact us at <strong>privacy@zieads.com</strong> and we will delete the profile immediately.
              </p>
            </section>

            {/* SECTION 14 */}
            <section id="breach-notif" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                14. Data Breach Notification
              </h2>
              <p>
                We maintain audit logging and security scans. Under UU PDP Article 46, in the event of any security breach compromising your personal records, we will notify you via registered email and inform the Indonesian Ministry of Communications (Kominfo/Lembaga PDP) within 72 hours of verification.
              </p>
            </section>

            {/* SECTION 15 */}
            <section id="changes" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                15. Changes to This Policy
              </h2>
              <p>
                We may adjust this Privacy Policy to reflect changing product features or regulatory updates. We will notify you of material changes by sending an email notification or posting a prominent notice in your account workspace 30 days before the changes take effect.
              </p>
            </section>

            {/* SECTION 16 */}
            <section id="contact" className="space-y-4">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
                16. Contact Information
              </h2>
              <p>
                Inquiries, complaints, or exercises of data subject rights should be sent to:
              </p>
              <div className="font-mono text-xs leading-relaxed text-zinc-550 bg-zinc-50 border border-zinc-200 p-6 rounded-lg">
                <div>PT. Bantu Indonesia Technology</div>
                <div>Registered Office: Omah Dongeng, Somodaran, Purwomartani, Kalasan, Special Region of Yogyakarta, Indonesia</div>
                <div>Primary Email: legal@zieads.com</div>
                <div>Privacy Desk: privacy@zieads.com</div>
                <div>Phone: +62 851 5762 6264</div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner footer-grid-layout">
          <div className="footer-col footer-brand-col">
            <div className="footer-brand" onClick={() => navigate('/')}>
              <ZieAdsLogo size={32} />
              <span className="brand-name">zieads</span>
            </div>
            <p className="footer-tagline">AI-powered paid ads strategy for marketers and agencies.</p>
            <div className="footer-social-links">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X">
                <ExternalLink size={16} /> Twitter/X
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <ExternalLink size={16} /> LinkedIn
              </a>
              <a href="https://producthunt.com" target="_blank" rel="noopener noreferrer" aria-label="Product Hunt">
                <ExternalLink size={16} /> Product Hunt
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <a href="/#how-it-works">How It Works</a>
            <a href="/#sample-report">All 15 Skills</a>
            <a href="/#sample-report">Sample Report</a>
            <a href="/#pricing">Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/clients'); }}>Agency Plan</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <a href="/#pricing">Paid Ads Readiness Guide</a>
            <a href="/#sample-report">Platform Comparison</a>
            <a href="/#faq">FAQ</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Blog</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Legal</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms of Service</a>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <p className="footer-copy">© 2026 PT. Bantu Indonesia Technology. All rights reserved.</p>
          <p className="footer-trust-note">ZieAds does not access, store, or transmit your ad account credentials. Audits are based on publicly visible page data only.</p>
        </div>
      </footer>

    </div>
  );
}
