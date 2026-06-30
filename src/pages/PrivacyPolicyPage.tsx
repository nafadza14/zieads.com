import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'id'>('en');

  // Maintain scroll position when changing language
  const handleLangSwitch = (newLang: 'en' | 'id') => {
    const scrollPos = window.scrollY;
    setLang(newLang);
    setTimeout(() => {
      window.scrollTo(0, scrollPos);
    }, 10);
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] antialiased selection:bg-zinc-200" style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 h-16 no-print">
        <div className="max-w-[800px] mx-auto h-full px-6 flex items-center justify-between">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-2 font-bold text-lg text-black decoration-none">
            <ZieAdsLogo size={24} />
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>zieads</span>
          </a>
          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500">
            <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="hover:text-black transition-colors decoration-none">Terms of Service</a>
            <span className="text-zinc-300">|</span>
            <button 
              onClick={() => handleLangSwitch(lang === 'en' ? 'id' : 'en')} 
              className="hover:text-black transition-colors"
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 'inherit', fontWeight: 'inherit', padding: 0 }}
            >
              {lang === 'en' ? 'Bahasa Indonesia' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-[800px] mx-auto px-6 pt-32 pb-24">
        
        {/* Title Zone */}
        <div className="mb-16">
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-4xl sm:text-[44px] font-extrabold text-black tracking-tight leading-tight mb-4">
            {lang === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
          </h1>
          <div className="text-sm text-zinc-500 space-y-1 font-mono">
            <div>Effective Date: June 30, 2026</div>
            <div>Last Updated: June 30, 2026 &bull; Version 2.0.0</div>
            <div className="italic text-zinc-400 mt-2">
              {lang === 'en' 
                ? 'This policy was published on June 30, 2026 with an effective date of June 30, 2026.'
                : 'Kebijakan ini diterbitkan pada 30 Juni 2026 dengan tanggal efektif mulai 30 Juni 2026.'}
            </div>
          </div>
        </div>

        {/* Dynamic Prose Column */}
        <div className="text-[16px] leading-[1.75] text-[#1A1A1A] space-y-12">
          
          {lang === 'en' ? (
            <>
              {/* SECTION 1 */}
              <section id="introduction" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
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
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  2. Information We Collect
                </h2>
                <p>
                  We collect personal data in three ways: information you provide directly to us, information we receive automatically as you interact with our platform, and information we receive from third-party services you choose to connect. We collect only the data necessary to provide our services, secure our platform, comply with legal obligations, and improve the product. We do not sell personal data to third parties under any circumstances.
                </p>

                <div className="space-y-4 pl-4 border-l border-zinc-200">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.1 Account Information</h3>
                    <p className="text-zinc-650">
                      When you create a ZieAds account, we collect your full name and email address, which serve as your primary identifiers and the channels through which we send transactional communications. We also collect and securely store your password, which is hashed using bcrypt with a per-user salt before storage. We do not store passwords in plaintext, and our staff cannot access your password. If you sign in using a third-party authentication provider (such as Google or LinkedIn OAuth), we store an account linkage record rather than a password.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.2 Advertising Account Data</h3>
                    <p className="text-zinc-650">
                      When you upload advertising performance data via CSV file from Meta Ads Manager, Google Ads, or TikTok Ads Manager, we parse the file and store the campaign performance information. The data we extract from your uploaded CSV files includes campaign names, ad group configurations, ad names, impressions, clicks, total spend, conversion counts, return on ad spend (ROAS), click-through rate (CTR), cost per click (CPC), and cost per thousand impressions (CPM). We explicitly do not access or collect personal data of the end users who viewed your ads, your custom audience source data, or any individual ad account credentials.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.3 Organic Social Media Data</h3>
                    <p className="text-zinc-650">
                      When you connect your Instagram Business, TikTok, or LinkedIn profile to ZieAds via OAuth authorization, we receive data from those platforms strictly limited to the permission scopes you grant. From Instagram we receive your profile information (username, account type, follower count), published media posts, and post engagement insights. From TikTok we receive your profile display name, avatar, bio, follower counts, videos, and engagement metrics. From LinkedIn we receive your basic profile headline and posts you choose to publish. When you schedule posts or reply to comments, we store the post content and comment texts.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.4 Technical & Usage Data</h3>
                    <p className="text-zinc-650">
                      When you use ZieAds, our servers automatically log information about your interactions with the platform, including the dates and times of access, the features and pages you use, the audit reports and analysis modes you run, the AI briefings you open, errors you encounter, and your browser, operating system, and IP address. We use this technical data to maintain service reliability, diagnose bugs, prevent abuse, monitor system performance, and protect our infrastructure.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.5 Payment Information</h3>
                    <p className="text-zinc-650">
                      If you subscribe to a paid ZieAds tier, payment is processed by Stripe, Inc., a PCI-DSS compliant payment processor. Stripe collects and handles your full payment card information directly through their secure infrastructure — these details never pass through or get stored on ZieAds servers. We receive from Stripe only the information necessary to manage your subscription: your Stripe customer identifier, billing email, the last four digits of your payment card, and transaction history records.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.6 Communications Data</h3>
                    <p className="text-zinc-650">
                      When you contact us by email (such as legal@zieads.com or privacy@zieads.com) or through support channels, we collect and retain the content of your communications. This includes messages, your name, contact information, timestamps, and any attachments. We use this information to respond to your inquiries and improve our support services.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 3 */}
              <section id="how-we-use" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
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
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
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
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  5. Third-Party Services & Sub-processors
                </h2>
                <p>
                  We transfer personal data to external sub-processors only when necessary to perform services. All sub-processors are bound by contract to enforce data security standards matching this policy. Below is the list of our current sub-processors:
                </p>

                <div className="space-y-4 pl-4 border-l border-zinc-200 text-sm">
                  <div>
                    <strong>Anthropic, PBC (United States)</strong>
                    <p className="text-zinc-650">We share campaign statistics and content prompts via Claude API to compile daily AI briefings and ad readiness diagnosis. Anthropic does not use ZieAds data to train public models.</p>
                  </div>
                  <div>
                    <strong>Meta Platforms, Inc. (United States)</strong>
                    <p className="text-zinc-650">Handles Instagram Business profile syncing, publishing posts, and reading insights via official Graph APIs.</p>
                  </div>
                  <div>
                    <strong>TikTok Pte. Ltd. (Singapore / United States)</strong>
                    <p className="text-zinc-650">Used to publish video assets and retrieve account metrics via TikTok Creator APIs.</p>
                  </div>
                  <div>
                    <strong>LinkedIn Corporation (United States)</strong>
                    <p className="text-zinc-650">Enables OAuth authentication and feeds publishing for LinkedIn personal profiles.</p>
                  </div>
                  <div>
                    <strong>Stripe, Inc. (United States)</strong>
                    <p className="text-zinc-650">Processes billing details, payment card tokens, and subscription invoicing.</p>
                  </div>
                  <div>
                    <strong>Supabase, Inc. (United States / Global Hosting)</strong>
                    <p className="text-zinc-650">Provides database services, authentication infrastructure, and secure encryption vaults for API tokens.</p>
                  </div>
                  <div>
                    <strong>Vercel, Inc. (United States / Global Hosting)</strong>
                    <p className="text-zinc-650">Hosts the user interface and serves front-end assets securely.</p>
                  </div>
                  <div>
                    <strong>Resend, Inc. (United States)</strong>
                    <p className="text-zinc-650">Delivers transactional and verification emails directly to users.</p>
                  </div>
                </div>
              </section>

              {/* SECTION 6 */}
              <section id="social-integrations" className="space-y-6">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  6. Social Media API Integrations
                </h2>
                <p>
                  ZieAds connects programmatically to third-party social networks through secure OAuth authorization protocols. We do not store your passwords for these platforms. You grant permissions explicitly through the respective network’s authorization screen, and you can revoke access at any time.
                </p>

                <div className="space-y-4 pl-4 border-l border-zinc-200">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-black">6.1 Meta (Instagram Graph API)</h3>
                    <p className="text-zinc-650">
                      We request access to <code>instagram_business_basic</code> to read your profile info, <code>instagram_business_manage_insights</code> to analyze post engagement rates, and <code>instagram_business_content_publish</code> to post scheduled visual contents. Data is stored until you disconnect the channel or delete your account. REVOCATION: You can revoke access through your Instagram account settings under Apps and Websites.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-black">6.2 TikTok API Integration</h3>
                    <p className="text-zinc-650">
                      We use TikTok display scopes to read creator stats (follower count, post list) and publishing scopes (<code>video.publish</code>) to post scheduled videos. We adhere to TikTok's UX flow, allowing you to select privacy settings and commercial designations for each post. REVOCATION: Revoke permissions in the TikTok app settings under Security &gt; Manage App Access.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-black">6.3 LinkedIn API Integration</h3>
                    <p className="text-zinc-650">
                      We request <code>openid</code>, <code>profile</code>, and <code>w_member_social</code> scopes to share scheduled updates directly to your personal LinkedIn profile feed. We do not access company page administration rights unless explicitly requested. REVOCATION: You can revoke access through your LinkedIn account under Permitted Services.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 7 */}
              <section id="ai-disclosure" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  7. AI Processing Disclosure
                </h2>
                <p>
                  ZieAds utilizes artificial intelligence models powered by Anthropic's Claude API to compile daily briefings, anomaly alerts, and ad audits. When you upload campaign logs or use chat diagnostics, data points are transmitted securely to Anthropic for real-time analysis.
                </p>
                <p>
                  Per Anthropic's developer policy, data transmitted via the Claude API is processed temporarily, is not stored permanently by them, and is explicitly not used to train public LLM models. The generated insights represent suggestions; you retain full control and responsibility over verify and editing recommendations before taking action.
                </p>
              </section>

              {/* SECTION 8 */}
              <section id="retention" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
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
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
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
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  10. Legal Bases for Processing
                </h2>
                <p>
                  The following table maps our processing activities, the data types involved, and their legal grounds under UU PDP and GDPR:
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }} className="min-w-full">
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E4E4E7', background: '#FAFAFA' }}>
                        <th style={{ padding: '10px 12px' }}>Purpose</th>
                        <th style={{ padding: '10px 12px' }}>Data Type</th>
                        <th style={{ padding: '10px 12px' }}>Legal Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                        <td style={{ padding: '10px 12px' }}>Service Delivery (v0.2/v0.3 features)</td>
                        <td style={{ padding: '10px 12px' }}>Account Info, Metrics, OAuth Tokens</td>
                        <td style={{ padding: '10px 12px' }}>Contract (UU PDP Art. 20.b, GDPR Art. 6(1)(b))</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                        <td style={{ padding: '10px 12px' }}>Payment and Invoicing</td>
                        <td style={{ padding: '10px 12px' }}>Identity details, Stripe ID</td>
                        <td style={{ padding: '10px 12px' }}>Contract</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                        <td style={{ padding: '10px 12px' }}>Security & Abuse Prevention</td>
                        <td style={{ padding: '10px 12px' }}>IP address, Usage log files</td>
                        <td style={{ padding: '10px 12px' }}>Legitimate Interest (UU PDP Art. 20.f, GDPR Art. 6(1)(f))</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                        <td style={{ padding: '10px 12px' }}>Tax compliance</td>
                        <td style={{ padding: '10px 12px' }}>Billing logs</td>
                        <td style={{ padding: '10px 12px' }}>Legal Obligation (UU PDP Art. 20.c, GDPR Art. 6(1)(c))</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 12px' }}>Product Updates Newsletter</td>
                        <td style={{ padding: '10px 12px' }}>Email address</td>
                        <td style={{ padding: '10px 12px' }}>Consent (UU PDP Art. 20.a, GDPR Art. 6(1)(a))</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 11 */}
              <section id="regional-disclosures" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  11. Regional Supplemental Disclosures
                </h2>
                
                <div className="space-y-4 pl-4 border-l border-zinc-200">
                  <div className="space-y-1">
                    <strong>11.1 Indonesia (UU PDP)</strong>
                    <p className="text-zinc-650">
                      Pursuant to Law No. 27 of 2022, all communications regarding your rights can be processed in Bahasa Indonesia. Supervisory authority resides with the Indonesian Data Protection Institution (<em>Lembaga Pelaksana Pelindungan Data Pribadi</em>).
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong>11.2 EU/EEA (GDPR) & United Kingdom</strong>
                    <p className="text-zinc-650">
                      For EU/EEA residents, you have the right to lodge a complaint with your local Data Protection Authority (DPA). In the UK, complains can be directed to the Information Commissioner's Office (ICO).
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong>11.3 California, US (CCPA)</strong>
                    <p className="text-zinc-650">
                      We do not sell your personal information. Under CCPA, you have the right to request access, erasure, and non-discrimination for exercising your rights.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong>11.4 Canada (PIPEDA)</strong>
                    <p className="text-zinc-650">
                      We store and process data in cloud servers located in the US/Global nodes. Your data may be subject to disclosure under local laws of those jurisdictions.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 12 */}
              <section id="cookies" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  12. Cookies & Tracking
                </h2>
                <p>
                  We use cookies for session authentication, keeping you logged in across dashboard navigations, and recalling timezone offsets. We also run anonymized, self-hosted analytics metrics (PostHog) to track dashboard performance without recording individual browser histories. We do not use advertising or profiling tracking cookies.
                </p>
              </section>

              {/* SECTION 13 */}
              <section id="children" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  13. Children's Privacy
                </h2>
                <p>
                  ZieAds is designed for business operators, solopreneurs, and marketing professionals. We do not knowingly collect personal data of minors under 18 years of age. If you believe a child has created an account, contact us at <strong>privacy@zieads.com</strong> and we will delete the profile immediately.
                </p>
              </section>

              {/* SECTION 14 */}
              <section id="breach-notif" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  14. Data Breach Notification
                </h2>
                <p>
                  We maintain audit logging and security scans. Under UU PDP Article 46, in the event of any security breach compromising your personal records, we will notify you via registered email and inform the Indonesian Ministry of Communications (Kominfo/Lembaga PDP) within 72 hours of verification.
                </p>
              </section>

              {/* SECTION 15 */}
              <section id="changes" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  15. Changes to This Policy
                </h2>
                <p>
                  We may adjust this Privacy Policy to reflect changing product features or regulatory updates. We will notify you of material changes by sending an email notification or posting a prominent notice in your account workspace 30 days before the changes take effect.
                </p>
              </section>

              {/* SECTION 16 */}
              <section id="contact" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  16. Contact Information
                </h2>
                <p>
                  Inquiries, complaints, or exercises of data subject rights should be sent to:
                </p>
                <div className="font-mono text-sm leading-relaxed text-zinc-600 bg-zinc-50 border border-zinc-200 p-6 rounded-lg">
                  <div>PT. Bantu Indonesia Technology</div>
                  <div>Registered Office: Omah Dongeng, Somodaran, Purwomartani, Kalasan, Special Region of Yogyakarta, Indonesia</div>
                  <div>Primary Email: legal@zieads.com</div>
                  <div>Privacy Desk: privacy@zieads.com</div>
                  <div>Phone: +62 851 5762 6264</div>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* SECTION 1 */}
              <section id="introduction" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  1. Pendahuluan & Siapa Kami
                </h2>
                <p>
                  Selamat datang di ZieAds. Kebijakan Privasi ini menjelaskan bagaimana <strong>PT. Bantu Indonesia Technology</strong>, sebuah perseroan terbatas yang terdaftar di Daerah Istimewa Yogyakarta, Indonesia, yang beroperasi dengan nama merek <strong>ZieAds</strong> ("kami", "kita", "milik kami"), mengumpulkan, memproses, menyimpan, dan melindungi data pribadi Anda saat menggunakan situs web dan aplikasi manajemen media sosial di <strong>zieads.com</strong>. Kami membuat alat perangkat lunak yang membantu wirausahawan, pemilik bisnis kecil, dan tim pemasaran menganalisis kinerja iklan mereka dan mengelola saluran media sosial organik melalui kecerdasan buatan tingkat lanjut.
                </p>
                <p>
                  PT. Bantu Indonesia Technology bertindak sebagai <strong>Pengendali Data Pribadi</strong> berdasarkan Undang-Undang Republik Indonesia No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (<strong>UU PDP</strong>), dan sebagai Pengendali Data berdasarkan General Data Protection Regulation (<strong>GDPR</strong>) untuk pengguna yang tinggal di Uni Eropa. Dengan membuat akun ZieAds, menghubungkan saluran media sosial, atau menggunakan platform, Anda mengonfirmasi bahwa Anda telah membaca, memahami, dan menyetujui pengumpulan dan pemrosesan data pribadi Anda sebagaimana diuraikan dalam Kebijakan Privasi ini.
                </p>
                <p>
                  Kebijakan Privasi ini mencakup semua pengunjung situs web pemasaran publik kami, pengguna terdaftar di semua paket langganan (Free, Solo, Pro, dan Studio), dan pengguna dari versi produk sebelumnya. Kebijakan ini tidak mencakup konten yang kami proses atas nama pelanggan bisnis di bawah kontrak korporasi terpisah, dan tidak berlaku untuk domain web pihak ketiga yang mungkin menautkan ke atau dari layanan kami.
                </p>
              </section>

              {/* SECTION 2 */}
              <section id="info-collected" className="space-y-6">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  2. Informasi Yang Kami Kumpulkan
                </h2>
                <p>
                  Kami mengumpulkan data pribadi dengan tiga cara: informasi yang Anda berikan langsung kepada kami, informasi yang kami terima secara otomatis saat Anda berinteraksi dengan platform kami, dan informasi yang kami terima dari layanan pihak ketiga yang Anda pilih untuk hubungkan. Kami hanya mengumpulkan data yang diperlukan untuk menyediakan layanan kami, mengamankan platform kami, mematuhi kewajiban hukum, dan meningkatkan produk. Kami tidak menjual data pribadi kepada pihak ketiga dalam keadaan apa pun.
                </p>

                <div className="space-y-4 pl-4 border-l border-zinc-200">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.1 Informasi Akun</h3>
                    <p className="text-zinc-650">
                      Saat Anda membuat akun ZieAds, kami mengumpulkan nama lengkap dan alamat email Anda, yang berfungsi sebagai pengenal utama Anda dan saluran tempat kami mengirimkan komunikasi transaksional. Kami juga mengumpulkan dan menyimpan kata sandi Anda dengan aman, yang di-hash menggunakan bcrypt dengan garam per pengguna sebelum disimpan. Kami tidak menyimpan kata sandi dalam teks biasa, dan staf kami tidak dapat mengakses kata sandi Anda. Jika Anda masuk menggunakan penyedia autentikasi pihak ketiga (seperti Google atau LinkedIn OAuth), kami menyimpan catatan tautan akun alih-alih kata sandi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.2 Data Akun Periklanan</h3>
                    <p className="text-zinc-650">
                      Saat Anda mengunggah data kinerja iklan melalui file CSV dari Meta Ads Manager, Google Ads, atau TikTok Ads Manager, kami mengurai file tersebut dan menyimpan informasi kinerja kampanye. Data yang kami ekstrak dari file CSV yang Anda unggah meliputi nama kampanye, konfigurasi grup iklan, nama iklan, tayangan, klik, total pengeluaran, jumlah konversi, laba atas pengeluaran iklan (ROAS), rasio klik-tayang (CTR), biaya per klik (CPC), dan biaya per seribu tayangan (CPM). Kami secara tegas tidak mengakses atau mengumpulkan data pribadi pengguna akhir yang melihat iklan Anda, data sumber audiens khusus Anda, atau kredensial akun iklan individual apa pun.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.3 Data Media Sosial Organik</h3>
                    <p className="text-zinc-650">
                      Saat Anda menghubungkan profil Instagram Business, TikTok, atau LinkedIn Anda ke ZieAds melalui otorisasi OAuth, kami menerima data dari platform tersebut yang sangat terbatas pada cakupan izin yang Anda berikan. Dari Instagram kami menerima informasi profil Anda (nama pengguna, jenis akun, jumlah pengikut), postingan media yang dipublikasikan, dan wawasan keterlibatan postingan. Dari TikTok kami menerima nama tampilan profil, avatar, bio, jumlah pengikut, video, dan metrik keterlibatan. Dari LinkedIn kami menerima tajuk profil dasar dan postingan yang Anda pilih untuk diterbitkan. Saat Anda menjadwalkan postingan atau membalas komentar, kami menyimpan konten postingan dan teks komentar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.4 Data Teknis & Penggunaan</h3>
                    <p className="text-zinc-650">
                      Saat Anda menggunakan ZieAds, server kami secara otomatis mencatat informasi tentang interaksi Anda dengan platform, termasuk tanggal dan waktu akses, fitur dan halaman yang Anda gunakan, laporan audit dan mode analisis yang Anda jalankan, ringkasan AI yang Anda buka, kesalahan yang Anda temui, serta browser, sistem operasi, dan alamat IP Anda. Kami menggunakan data teknis ini untuk menjaga keandalan layanan, mendiagnosis bug, mencegah penyalahgunaan, memantau kinerja sistem, dan melindungi infrastruktur kami.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.5 Informasi Pembayaran</h3>
                    <p className="text-zinc-650">
                      Jika Anda berlangganan paket berbayar ZieAds, pembayaran diproses oleh Stripe, Inc., pemroses pembayaran yang mematuhi PCI-DSS. Stripe mengumpulkan dan menangani informasi kartu pembayaran lengkap Anda secara langsung melalui infrastruktur aman mereka — detail ini tidak pernah melewati atau disimpan di server ZieAds. Kami menerima dari Stripe hanya informasi yang diperlukan untuk mengelola langganan Anda: pengenal pelanggan Stripe Anda, email penagihan, empat digit terakhir kartu pembayaran Anda, dan catatan riwayat transaksi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-black">2.6 Data Komunikasi</h3>
                    <p className="text-zinc-650">
                      Saat Anda menghubungi kami melalui email (seperti legal@zieads.com atau privacy@zieads.com) atau melalui saluran dukungan, kami mengumpulkan dan menyimpan konten komunikasi Anda. Ini mencakup pesan, nama Anda, informasi kontak, stempel waktu, dan lampiran apa pun. Kami menggunakan informasi ini untuk merespons pertanyaan Anda dan meningkatkan layanan dukungan kami.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 3 */}
              <section id="how-we-use" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  3. Bagaimana Kami Menggunakan Informasi Anda
                </h2>
                <p>
                  Kami menggunakan data pribadi Anda untuk memenuhi kontrak kami dengan Anda dan untuk mengoperasikan layanan kami. Secara khusus, kami menggunakan informasi akun Anda untuk mengautentikasi login Anda, menetapkan ruang kerja dasbor Anda yang aman, dan memelihara paket penagihan Anda. Profil media sosial organik yang terhubung dan metrik kampanye iklan Anda diproses untuk menyusun ringkasan AI harian Anda, menghitung waktu posting yang optimal, dan menghasilkan kalender visual.
                </p>
                <p>
                  Kami juga menggunakan log penggunaan dan teknis untuk memantau stabilitas sistem, melindungi dari aktivitas berbahaya, dan mendiagnosis kesalahan. Jika Anda memilih untuk menerima komunikasi pemasaran, kami menggunakan detail kontak Anda untuk membagikan pengumuman fitur atau tutorial. Kami memproses log komunikasi untuk membantu dukungan teknis. Semua operasi pemrosesan dilakukan di bawah keamanan pemisahan tingkat baris yang ketat untuk mencegah akses lintas pelanggan.
                </p>
              </section>

              {/* SECTION 4 */}
              <section id="legal-basis" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  4. Dasar Hukum Pemrosesan
                </h2>
                <p>
                  Berdasarkan undang-undang privasi internasional, termasuk Undang-Undang PDP Indonesia (Pasal 20) dan GDPR Uni Eropa (Pasal 6), kami harus menetapkan dasar hukum yang sah untuk memproses data pribadi Anda. Sebagian besar aktivitas pemrosesan kami didasarkan pada <strong>Kebutuhan Kontraktual</strong> — kami memproses konfigurasi akun Anda, token saluran sosial, dan unggahan metrik untuk memberikan fitur SaaS inti yang Anda minta.
                </p>
                <p>
                  Jika kami memproses data untuk melindungi basis data kami, mendeteksi penyalahgunaan, atau mengoptimalkan kinerja, kami mengandalkan <strong>Kepentingan Sah</strong> kami untuk memelihara aplikasi yang aman dan fungsional. Jika pemrosesan memerlukan persetujuan eksplisit (seperti daftar pemasaran atau cookie pelacakan), kami mengandalkan <strong>Persetujuan</strong> Anda, yang dapat ditarik kapan saja. Kami juga memproses catatan penagihan di bawah <strong>Kewajiban Hukum</strong> untuk mematuhi undang-undang perpajakan nasional.
                </p>
              </section>

              {/* SECTION 5 */}
              <section id="subprocessors" className="space-y-6">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  5. Layanan Pihak Ketiga & Sub-prosesor
                </h2>
                <p>
                  Kami mentransfer data pribadi ke sub-prosesor eksternal hanya jika diperlukan untuk melakukan layanan. Semua sub-prosesor terikat kontrak untuk menegakkan standar keamanan data yang sesuai dengan kebijakan ini. Berikut adalah daftar sub-prosesor kami saat ini:
                </p>

                <div className="space-y-4 pl-4 border-l border-zinc-200 text-sm">
                  <div>
                    <strong>Anthropic, PBC (Amerika Serikat)</strong>
                    <p className="text-zinc-650">Kami membagikan statistik kampanye dan perintah konten melalui Claude API untuk menyusun ringkasan AI harian dan diagnosis kesiapan iklan. Anthropic tidak menggunakan data ZieAds untuk melatih model publik.</p>
                  </div>
                  <div>
                    <strong>Meta Platforms, Inc. (Amerika Serikat)</strong>
                    <p className="text-zinc-650">Menangani sinkronisasi profil Instagram Business, memposting konten, dan membaca wawasan melalui API Graph resmi.</p>
                  </div>
                  <div>
                    <strong>TikTok Pte. Ltd. (Singapura / Amerika Serikat)</strong>
                    <p className="text-zinc-650">Digunakan untuk mempublikasikan aset video dan mengambil metrik akun melalui TikTok Creator API.</p>
                  </div>
                  <div>
                    <strong>LinkedIn Corporation (Amerika Serikat)</strong>
                    <p className="text-zinc-650">Memungkinkan autentikasi OAuth dan penerbitan umpan untuk profil pribadi LinkedIn.</p>
                  </div>
                  <div>
                    <strong>Stripe, Inc. (Amerika Serikat)</strong>
                    <p className="text-zinc-650">Memproses detail penagihan, token kartu pembayaran, dan faktur langganan.</p>
                  </div>
                  <div>
                    <strong>Supabase, Inc. (Amerika Serikat / Hosting Global)</strong>
                    <p className="text-zinc-650">Menyediakan layanan basis data, infrastruktur autentikasi, dan brankas enkripsi aman untuk token API.</p>
                  </div>
                  <div>
                    <strong>Vercel, Inc. (Amerika Serikat / Hosting Global)</strong>
                    <p className="text-zinc-650">Menghosting antarmuka pengguna dan menyajikan aset front-end dengan aman.</p>
                  </div>
                  <div>
                    <strong>Resend, Inc. (Amerika Serikat)</strong>
                    <p className="text-zinc-650">Mengirimkan email transaksional dan verifikasi langsung ke pengguna.</p>
                  </div>
                </div>
              </section>

              {/* SECTION 6 */}
              <section id="social-integrations" className="space-y-6">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  6. Integrasi API Media Sosial
                </h2>
                <p>
                  ZieAds terhubung secara terprogram ke jaringan sosial pihak ketiga melalui protokol otorisasi OAuth yang aman. Kami tidak menyimpan kata sandi Anda untuk platform tersebut. Anda memberikan izin secara eksplisit melalui layar otorisasi jaringan masing-masing, dan Anda dapat mencabut akses kapan saja.
                </p>

                <div className="space-y-4 pl-4 border-l border-zinc-200">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-black">6.1 Meta (API Graph Instagram)</h3>
                    <p className="text-zinc-650">
                      Kami meminta akses ke <code>instagram_business_basic</code> untuk membaca info profil Anda, <code>instagram_business_manage_insights</code> untuk menganalisis tingkat keterlibatan postingan, dan <code>instagram_business_content_publish</code> untuk memposting konten visual terjadwal. Data disimpan hingga Anda memutuskan saluran atau menghapus akun Anda. PENCABUTAN: Anda dapat mencabut akses melalui pengaturan akun Instagram Anda di bawah Aplikasi dan Situs Web.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-black">6.2 Integrasi API TikTok</h3>
                    <p className="text-zinc-650">
                      Kami menggunakan cakupan tampilan TikTok untuk membaca statistik kreator (jumlah pengikut, daftar postingan) dan cakupan penerbitan (<code>video.publish</code>) untuk memposting video terjadwal. Kami mematuhi alur UX TikTok, memungkinkan Anda memilih pengaturan privasi dan penunjukan komersial untuk setiap postingan. PENCABUTAN: Cabut izin di pengaturan aplikasi TikTok di bawah Keamanan &gt; Kelola Akses Aplikasi.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-black">6.3 Integrasi API LinkedIn</h3>
                    <p className="text-zinc-650">
                      Kami meminta cakupan <code>openid</code>, <code>profile</code>, dan <code>w_member_social</code> untuk membagikan pembaruan terjadwal langsung ke umpan profil LinkedIn pribadi Anda. Kami tidak mengakses hak administrasi halaman perusahaan kecuali diminta secara eksplisit. PENCABUTAN: Anda dapat mencabut akses melalui akun LinkedIn Anda di bawah Layanan yang Diizinkan.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 7 */}
              <section id="ai-disclosure" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  7. Pengungkapan Pemrosesan AI
                </h2>
                <p>
                  ZieAds menggunakan model kecerdasan buatan yang didukung oleh API Claude Anthropic untuk menyusun ringkasan harian, peringatan anomali, dan audit iklan. Saat Anda mengunggah log kampanye atau menggunakan obrolan diagnostik, poin data dikirimkan secara aman ke Anthropic untuk analisis real-time.
                </p>
                <p>
                  Sesuai dengan kebijakan pengembang Anthropic, data yang dikirimkan melalui API Claude diproses sementara, tidak disimpan secara permanen oleh mereka, dan secara tegas tidak digunakan untuk melatih model LLM publik. Wawasan yang dihasilkan merupakan saran; Anda mempertahankan kendali dan tanggung jawab penuh atas verifikasi dan penyuntingan rekomendasi sebelum mengambil tindakan.
                </p>
              </section>

              {/* SECTION 8 */}
              <section id="retention" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  8. Retensi & Penghapusan Data
                </h2>
                <p>
                  Kami menyimpan data pribadi hanya selama jangka waktu yang diperlukan untuk menyediakan layanan atau mematuhi hukum. Saat Anda menghapus akun Anda, kami memulai pembersihan otomatis untuk menghapus profil Anda, unggahan kampanye, dan token OAuth yang terhubung secara permanen dalam waktu 90 hari.
                </p>
                <p>
                  Catatan penagihan dan transaksi disimpan selama sepuluh tahun untuk memenuhi persyaratan penyimpanan catatan pajak nasional Indonesia (<em>Undang-Undang Ketentuan Umum dan Tata Cara Perpajakan</em>). Arsip cadangan basis data diputar dan ditimpa setiap 30 hari.
                </p>
              </section>

              {/* SECTION 9 */}
              <section id="your-rights" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  9. Hak-Hak Anda & Cara Menggunakannya
                </h2>
                <p>
                  Berdasarkan UU PDP (Indonesia) dan GDPR (Eropa), Anda memiliki hak khusus terkait data pribadi Anda. Ini termasuk hak untuk mengakses salinan catatan Anda, memperbaiki data profil yang salah, meminta penghapusan (hak untuk dilupakan), menarik persetujuan Anda untuk pemrosesan di masa mendatang, atau mendapatkan data Anda dalam format JSON yang portabel.
                </p>
                <p>
                  Untuk menggunakan hak-hak ini, hubungi meja privasi kami di <strong>privacy@zieads.com</strong> atau <strong>legal@zieads.com</strong>. Kami memerlukan verifikasi identitas untuk mencegah pengungkapan yang tidak sah dan menanggapi semua permintaan yang sah dalam waktu 30 hari.
                </p>
              </section>

              {/* SECTION 10 */}
              <section id="legal-bases-table" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  10. Dasar Hukum Pemrosesan
                </h2>
                <p>
                  Tabel berikut memetakan aktivitas pemrosesan kami, jenis data yang terlibat, dan dasar hukumnya berdasarkan UU PDP dan GDPR:
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }} className="min-w-full">
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E4E4E7', background: '#FAFAFA' }}>
                        <th style={{ padding: '10px 12px' }}>Tujuan Pemrosesan</th>
                        <th style={{ padding: '10px 12px' }}>Jenis Data</th>
                        <th style={{ padding: '10px 12px' }}>Dasar Hukum</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                        <td style={{ padding: '10px 12px' }}>Penyediaan Layanan (fitur v0.2/v0.3)</td>
                        <td style={{ padding: '10px 12px' }}>Info Akun, Metrik, Token OAuth</td>
                        <td style={{ padding: '10px 12px' }}>Kontrak (UU PDP Pasal 20.b, GDPR Pasal 6(1)(b))</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                        <td style={{ padding: '10px 12px' }}>Pembayaran dan Faktur</td>
                        <td style={{ padding: '10px 12px' }}>Detail identitas, ID Stripe</td>
                        <td style={{ padding: '10px 12px' }}>Kontrak</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                        <td style={{ padding: '10px 12px' }}>Keamanan & Pencegahan Penyalahgunaan</td>
                        <td style={{ padding: '10px 12px' }}>Alamat IP, Log penggunaan</td>
                        <td style={{ padding: '10px 12px' }}>Kepentingan Sah (UU PDP Pasal 20.f, GDPR Pasal 6(1)(f))</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                        <td style={{ padding: '10px 12px' }}>Kepatuhan Pajak</td>
                        <td style={{ padding: '10px 12px' }}>Log penagihan</td>
                        <td style={{ padding: '10px 12px' }}>Kewajiban Hukum (UU PDP Pasal 20.c, GDPR Pasal 6(1)(c))</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 12px' }}>Buletin Pembaruan Produk</td>
                        <td style={{ padding: '10px 12px' }}>Alamat email</td>
                        <td style={{ padding: '10px 12px' }}>Persetujuan (UU PDP Pasal 20.a, GDPR Pasal 6(1)(a))</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 11 */}
              <section id="regional-disclosures" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  11. Pengungkapan Tambahan Regional
                </h2>
                
                <div className="space-y-4 pl-4 border-l border-zinc-200">
                  <div className="space-y-1">
                    <strong>11.1 Indonesia (UU PDP)</strong>
                    <p className="text-zinc-650">
                      Sesuai dengan Undang-Undang No. 27 Tahun 2022, semua komunikasi mengenai hak-hak Anda dapat diproses dalam Bahasa Indonesia. Otoritas pengawas berada pada Lembaga Pelaksana Pelindungan Data Pribadi (Lembaga PDP).
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong>11.2 Uni Eropa & Inggris</strong>
                    <p className="text-zinc-650">
                      Bagi penduduk Uni Eropa, Anda berhak mengajukan pengaduan ke Otoritas Perlindungan Data (DPA) setempat. Di Inggris, pengaduan dapat ditujukan ke Information Commissioner's Office (ICO).
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong>11.3 California, AS (CCPA)</strong>
                    <p className="text-zinc-650">
                      Kami tidak menjual informasi pribadi Anda. Di bawah CCPA, Anda berhak meminta akses, penghapusan, dan non-diskriminasi karena menggunakan hak-hak Anda.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong>11.4 Kanada (PIPEDA)</strong>
                    <p className="text-zinc-650">
                      Kami menyimpan dan memproses data di server cloud yang berlokasi di simpul AS/Global. Data Anda mungkin tunduk pada pengungkapan di bawah hukum setempat dari yurisdiksi tersebut.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 12 */}
              <section id="cookies" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  12. Cookie & Pelacakan
                </h2>
                <p>
                  Kami menggunakan cookie untuk autentikasi sesi, membuat Anda tetap masuk di seluruh navigasi dasbor, dan mengingat zona waktu. Kami juga menjalankan metrik analitik yang dihosting sendiri secara anonim (PostHog) untuk melacak kinerja dasbor tanpa mencatat riwayat browser individu. Kami tidak menggunakan cookie pelacakan iklan.
                </p>
              </section>

              {/* SECTION 13 */}
              <section id="children" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  13. Privasi Anak-Anak
                </h2>
                <p>
                  ZieAds dirancang untuk operator bisnis, wirausahawan, dan profesional pemasaran. Kami tidak dengan sengaja mengumpulkan data pribadi anak di bawah usia 18 tahun. Jika Anda yakin seorang anak telah membuat akun, hubungi kami di <strong>privacy@zieads.com</strong> dan kami akan segera menghapus profil tersebut.
                </p>
              </section>

              {/* SECTION 14 */}
              <section id="breach-notif" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  14. Pemberitahuan Kebocoran Data
                </h2>
                <p>
                  Kami memelihara log audit dan pemindaian keamanan. Di bawah UU PDP Pasal 46, jika terjadi kebocoran keamanan yang mengompromikan catatan pribadi Anda, kami akan memberi tahu Anda melalui email terdaftar dan menginformasikan Kementerian Komunikasi dan Informatika (Kominfo/Lembaga PDP) dalam waktu 72 jam setelah verifikasi.
                </p>
              </section>

              {/* SECTION 15 */}
              <section id="changes" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  15. Perubahan Kebijakan Ini
                </h2>
                <p>
                  Kami dapat menyesuaikan Kebijakan Privasi ini untuk mencerminkan perubahan fitur produk atau pembaruan peraturan. Kami akan memberi tahu Anda tentang perubahan material dengan mengirimkan pemberitahuan email atau memposting pemberitahuan menonjol di dasbor kerja akun Anda 30 hari sebelum perubahan berlaku.
                </p>
              </section>

              {/* SECTION 16 */}
              <section id="contact" className="space-y-4">
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-bold text-black tracking-tight border-b border-zinc-200 pb-2">
                  16. Informasi Kontak
                </h2>
                <p>
                  Pertanyaan, keluhan, atau pelaksanaan hak data subjek harus dikirim ke:
                </p>
                <div className="font-mono text-sm leading-relaxed text-zinc-650 bg-zinc-50 border border-zinc-200 p-6 rounded-lg">
                  <div>PT. Bantu Indonesia Technology</div>
                  <div>Kantor Terdaftar: Omah Dongeng, Somodaran, Purwomartani, Kalasan, Daerah Istimewa Yogyakarta, Indonesia</div>
                  <div>Email Utama: legal@zieads.com</div>
                  <div>Meja Privasi: privacy@zieads.com</div>
                  <div>Telepon: +62 851 5762 6264</div>
                </div>
              </section>
            </>
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-16 px-6 no-print">
        <div className="max-w-[800px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-black" onClick={scrollToTop} style={{ cursor: 'pointer' }}>
              <ZieAdsLogo size={24} />
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-lg">zieads</span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-xs">
              PT. Bantu Indonesia Technology. AI-powered social media management and ad audit layers for creators and agencies.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-black mb-3">Links</h4>
            <ul className="space-y-2 text-zinc-500 text-xs pl-0 list-none">
              <li><a href="/#how-it-works" className="hover:text-black transition-colors decoration-none">How It Works</a></li>
              <li><a href="/#pricing" className="hover:text-black transition-colors decoration-none">Pricing</a></li>
              <li><a href="/#faq" className="hover:text-black transition-colors decoration-none">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-3">Legal</h4>
            <ul className="space-y-2 text-zinc-500 text-xs pl-0 list-none">
              <li><a href="/privacy-policy" className="font-semibold text-black decoration-none">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-black transition-colors decoration-none">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[800px] mx-auto border-t border-zinc-200 mt-12 pt-6 text-center text-xs text-zinc-400 font-mono">
          © 2026 PT. Bantu Indonesia Technology. All rights reserved. Registered Office: Somodaran, Purwomartani, Kalasan, Yogyakarta, Indonesia.
        </div>
      </footer>

    </div>
  );
}
