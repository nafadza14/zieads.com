import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { Shield, Lock, ExternalLink, Mail, FileText, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const [activeSection, setActiveSection] = useState('who-we-are');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = {
    en: [
      { id: 'who-we-are', title: '1. Introduction & Who We Are' },
      { id: 'info-collected', title: '2. Information We Collect' },
      { id: 'how-we-use', title: '3. How We Use Your Information' },
      { id: 'legal-basis', title: '4. Legal Basis for Processing' },
      { id: 'subprocessors', title: '5. Third-Party Services & Sub-processors' },
      { id: 'social-integrations', title: '6. Social Media API Integrations' },
      { id: 'ai-disclosure', title: '7. AI Processing Disclosure' },
      { id: 'retention', title: '8. Data Retention & Deletion' },
      { id: 'your-rights', title: '9. Your Rights & Frameworks' },
      { id: 'transfers', title: '10. International Data Transfers' },
      { id: 'security', title: '11. Data Security Measures' },
      { id: 'cookies', title: '12. Cookies & Tracking' },
      { id: 'children', title: '13. Children\'s Privacy' },
      { id: 'breach-notif', title: '14. Data Breach Notification' },
      { id: 'changes', title: '15. Changes to This Policy' },
      { id: 'contact', title: '16. Contact Information' }
    ],
    id: [
      { id: 'who-we-are', title: '1. Pendahuluan & Siapa Kami' },
      { id: 'info-collected', title: '2. Informasi Yang Kami Kumpulkan' },
      { id: 'how-we-use', title: '3. Bagaimana Kami Menggunakan Informasi' },
      { id: 'legal-basis', title: '4. Dasar Hukum Pemrosesan' },
      { id: 'subprocessors', title: '5. Layanan Pihak Ketiga & Sub-prosesor' },
      { id: 'social-integrations', title: '6. Integrasi API Media Sosial' },
      { id: 'ai-disclosure', title: '7. Pengungkapan Pemrosesan AI' },
      { id: 'retention', title: '8. Retensi & Penghapusan Data' },
      { id: 'your-rights', title: '9. Hak-Hak Anda & Kerangka Hukum' },
      { id: 'transfers', title: '10. Transfer Data Internasional' },
      { id: 'security', title: '11. Tindakan Keamanan Data' },
      { id: 'cookies', title: '12. Cookie & Pelacakan' },
      { id: 'children', title: '13. Privasi Anak-Anak' },
      { id: 'breach-notif', title: '14. Pemberitahuan Kebocoran Data' },
      { id: 'changes', title: '15. Perubahan Kebijakan Ini' },
      { id: 'contact', title: '16. Informasi Kontak' }
    ]
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (const section of sections[lang]) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lang]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.offsetTop - 110;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-page min-h-screen antialiased">
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="lp-line-top"></div>
      
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

          <button
            className="flex md:hidden p-2 text-gray-700 hover:text-gray-950 focus:outline-none transition-colors ml-auto"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {isMobileMenuOpen && (
            <div className="absolute top-[60px] left-0 right-0 w-full bg-white/95 border border-gray-100 rounded-3xl shadow-xl p-6 flex flex-col gap-4 text-left z-50 backdrop-blur-xl md:hidden">
              <div className="flex flex-col gap-3 font-semibold text-gray-750 text-[15px] pl-2">
                <a href="/#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How It Works</a>
                <a href="/#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                <a href="/#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
              </div>
              <hr className="border-gray-100 my-1" />
              <div className="flex flex-col gap-3">
                <button
                  className="w-full py-3.5 border border-gray-200 hover:border-gray-300 rounded-xl font-bold text-[14px] text-gray-750 text-center bg-white hover:bg-gray-50 transition-all"
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-in'); }}
                  style={{ cursor: 'pointer' }}
                >
                  Log in
                </button>
                <button
                  className="w-full py-3.5 btn-lp-primary-gradient text-white rounded-xl font-bold text-[14px] text-center transition-all"
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-up'); }}
                  style={{ cursor: 'pointer' }}
                >
                  Start Free
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Page Layout */}
      <div className="pt-[140px] md:pt-[160px] pb-12">
        
        {/* Hero Section with Language Switcher */}
        <section className="bg-[var(--lp-bg-inset)] border-b border-[var(--lp-border-subtle)] py-12 md:py-16 px-6 relative">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--lp-bg-canvas-alt)] border border-[var(--lp-border-default)] text-[var(--lp-text-secondary)] text-[11px] font-mono font-semibold rounded-full uppercase tracking-wider mb-4">
                <Shield size={12} className="text-[var(--lp-text-primary)]" />
                Legal Documents
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-[var(--lp-text-primary)] tracking-tight leading-tight mb-4">
                {lang === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
              </h1>
              <p className="text-[var(--lp-text-muted)] text-xs sm:text-sm font-mono uppercase tracking-widest mb-2">
                Last updated: June 30, 2026 &bull; PT. Bantu Indonesia Technology
              </p>
            </div>
            
            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-white border border-[var(--lp-border-default)] p-1.5 rounded-xl self-start md:self-center shadow-sm">
              <Globe size={14} className="text-gray-400 ml-2" />
              <button 
                onClick={() => setLang('en')}
                style={{
                  border: 'none',
                  background: lang === 'en' ? P : 'transparent',
                  color: lang === 'en' ? '#fff' : D,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                English
              </button>
              <button 
                onClick={() => setLang('id')}
                style={{
                  border: 'none',
                  background: lang === 'id' ? P : 'transparent',
                  color: lang === 'id' ? '#fff' : D,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Bahasa Indonesia
              </button>
            </div>
          </div>
        </section>

        {/* Content Layout */}
        <section className="max-w-6xl mx-auto px-6 py-12 md:py-16 relative">
          <div className="flex flex-col lg:flex-row gap-12 items-start relative">
            
            {/* Sidebar TOC */}
            <aside className="lg:sticky lg:top-28 w-full lg:w-72 shrink-0 pr-4 pb-6 border-b lg:border-b-0 lg:border-r border-[var(--lp-border-subtle)] hidden md:block self-start max-h-[calc(100vh-140px)] overflow-y-auto">
              <div className="text-[11px] font-bold text-[var(--lp-text-muted)] uppercase tracking-widest mb-4 font-mono">
                Document Sections
              </div>
              <ul className="space-y-1">
                {sections[lang].map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left py-2 px-3 text-[13.5px] transition-all font-medium border-l-2 ${
                        activeSection === sec.id
                          ? 'border-[var(--lp-text-primary)] text-[var(--lp-text-primary)] font-semibold pl-4'
                          : 'border-transparent text-[var(--lp-text-secondary)] hover:text-[var(--lp-text-primary)] pl-4'
                      }`}
                      style={{ borderRadius: '0px', background: 'transparent' }}
                    >
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Main Legal Content */}
            <div className="flex-1 max-w-3xl space-y-16">
              
              {/* EN CONTENT */}
              {lang === 'en' ? (
                <>
                  <section id="who-we-are" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>1. Introduction & Who We Are</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">01</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Welcome to ZieAds. This Privacy Policy explains how <strong>PT. Bantu Indonesia Technology</strong>, operating as <strong>ZieAds</strong> ("we", "us", "our"), collects, processes, stores, and protects your personal data when you use the website and the social media management application accessible at <strong>zieads.com</strong>.
                      </p>
                      <p>
                        PT. Bantu Indonesia Technology acts as the <strong>Data Controller</strong> (<em>Pengendali Data Pribadi</em>) under Law of the Republic of Indonesia No. 27 of 2022 concerning Personal Data Protection (<strong>UU PDP</strong>), and as Data Controller under the General Data Protection Regulation (<strong>GDPR</strong>) for users residing within the EU/EEA.
                      </p>
                      <p>
                        <strong>ZieAds Summary:</strong> ZieAds is a social media management platform that helps solopreneurs and small businesses schedule posts, analyze performance, and receive AI-generated marketing insights across Instagram, TikTok, and LinkedIn, as well as a marketing audit toolkit for paid advertising.
                      </p>
                      <p>
                        By creating an account, connecting social media channels, or using the ZieAds platform, you explicitly consent to the collection and processing of your personal data as outlined in this Privacy Policy.
                      </p>
                    </div>
                  </section>

                  <section id="info-collected" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>2. Information We Collect</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">02</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>We collect only the data necessary to provide our service, divided into the following categories:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>Account Information:</strong> Name, email address, password (hashed via bcrypt), phone number (optional), business name, industry details, and preferred timezone.</li>
                        <li><strong>Organic Social Media Data (v0.3 integrations):</strong> Follower count, account types, publishing logs, profile details, scheduled posts text/media attachments, and comments/replies of followers connected via authorized OAuth channels.</li>
                        <li><strong>Paid Advertising Data (v0.3):</strong> CSV file performance metrics (campaign names, ad set configurations, ad names, impressions, clicks, spend, conversions, CPC, CTR, CPM, revenue, and ROAS metrics) uploaded directly from Meta Ads, Google Ads, or TikTok Ads managers.</li>
                        <li><strong>AI Analyst Data:</strong> Daily AI Briefing reports, wins, anomaly checks, competitor tracking details, and calculated Best Posting Windows.</li>
                        <li><strong>Audit Data (v0.2):</strong> Submitted website URLs, generated readiness scores (0-100), deep analysis outputs, and conversation histories with our AI Agent.</li>
                        <li><strong>Billing & Payment Information:</strong> Payment transactions processed by Stripe, Inc. We do not store credit card details directly; we store only Stripe transaction IDs and subscription level.</li>
                      </ul>
                      <blockquote className="border-l-4 border-amber-500 pl-4 bg-amber-50 p-3 rounded-r-lg text-sm text-amber-900">
                        <strong>Mandate:</strong> We do NOT sell user data to third parties. We do NOT use user data to train AI models that benefit other users.
                      </blockquote>
                    </div>
                  </section>

                  <section id="how-we-use" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>3. How We Use Your Information</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">03</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>We process your data to fulfill our contract with you, specifically to:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li>Authenticate accounts and secure your dashboard workspace.</li>
                        <li>Enable scheduling, publishing, and unified commenting pipelines.</li>
                        <li>Compile daily AI briefings, post timing windows, and competitor benchmarks.</li>
                        <li>Deliver transactional system emails (e.g. system warnings, notifications, receipts).</li>
                        <li>Generate PDF audit files and perform ROAS audits.</li>
                      </ul>
                      <p><strong>Negative Disclosures:</strong> We do not publish your content to platforms you have not explicitly authorized. We do not share your engagement metrics with third-party advertising networks.</p>
                    </div>
                  </section>

                  <section id="legal-basis" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>4. Legal Basis for Processing</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">04</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>We process data based on the following grounds:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>UU PDP Article 20:</strong> Processing is based on explicit consent, contract performance, legitimate interests (security and product improvement), and statutory compliance.</li>
                        <li><strong>GDPR Article 6:</strong> Contractual necessity, user consent, and legitimate operations.</li>
                      </ul>
                      <p>Consent can be withdrawn at any time by disconnecting accounts or requesting deletion of your ZieAds account via email.</p>
                    </div>
                  </section>

                  <section id="subprocessors" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>5. Third-Party Services & Sub-processors</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">05</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>We work with trusted sub-processors to deliver the service. All sub-processors are bound by strict data processing agreements:</p>
                      <div className="space-y-4">
                        <div className="border border-gray-200 p-4 rounded-xl">
                          <p className="font-bold text-gray-900">Anthropic, PBC (United States)</p>
                          <p className="text-sm text-gray-600">AI analysis via Claude API for briefings, competitor audits, and chat responses. Data is processed in real-time and not used for model training.</p>
                        </div>
                        <div className="border border-gray-200 p-4 rounded-xl">
                          <p className="font-bold text-gray-900">Stripe, Inc. (United States)</p>
                          <p className="text-sm text-gray-600">Payment processing and subscription billing. PCI-DSS compliant.</p>
                        </div>
                        <div className="border border-gray-200 p-4 rounded-xl">
                          <p className="font-bold text-gray-900">Supabase & Vercel (Global Hosting)</p>
                          <p className="text-sm text-gray-600">Database and application hosting, encrypted at rest and in transit.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section id="social-integrations" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>6. Social Media API Integrations</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">06</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-6">
                      <p>ZieAds connects with external social media platforms via official OAuth configurations:</p>
                      
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-950">A. Instagram (Meta Platforms, Inc.)</h4>
                        <p>We request permissions for:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                          <li><em>instagram_business_basic</em>: Retrieve username, account type, and profile statistics.</li>
                          <li><em>instagram_business_manage_insights</em>: Fetch post engagement metrics, impressions, and reach.</li>
                          <li><em>instagram_business_content_publish</em>: Publish user-approved scheduled posts.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-950">B. TikTok (TikTok Pte. Ltd.)</h4>
                        <p>We request permissions for:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                          <li><em>user.info.basic & user.info.profile</em>: Fetch handle, display name, and avatar.</li>
                          <li><em>user.info.stats & video.list</em>: Analyze video views, list existing posts, and engagement.</li>
                          <li><em>video.publish</em>: Auto-publish schedules. We display creator credentials, interaction toggles, and commercial content disclosures.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-950">C. LinkedIn (LinkedIn Corporation)</h4>
                        <p>We request permissions for:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                          <li><em>openid, profile, email</em>: Authorize user login.</li>
                          <li><em>w_member_social</em>: Publish scheduled updates to personal feeds.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section id="ai-disclosure" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>7. AI Processing Disclosure</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">07</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        ZieAds utilizes artificial intelligence models powered by Anthropic's Claude API to generate daily briefings and audit summaries. Your metrics and data are processed through safe API channels. Per Anthropic's API policy, your content is not stored permanently or used to train public LLM structures. AI reports are suggestions; you retain full control over editing and publishing.
                      </p>
                    </div>
                  </section>

                  <section id="retention" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>8. Data Retention & Deletion</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">08</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Account details are stored for the lifetime of your active subscription. If you delete your account, data is permanently scrubbed within 90 days. You can request deletion of specific connected channels or all collected metrics by contacting <strong>privacy@zieads.com</strong>.
                      </p>
                    </div>
                  </section>

                  <section id="your-rights" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>9. Your Rights & Frameworks</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">09</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Depending on your residency, you have specific rights under UU PDP, GDPR, and CCPA:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>Right to access:</strong> Request a copy of your personal data.</li>
                        <li><strong>Right to delete (forgotten):</strong> Permanent erasure of your profiles.</li>
                        <li><strong>Right to correct:</strong> Edit inaccurate account entries.</li>
                        <li><strong>Right to object or restrict:</strong> Withdraw permission to process data.</li>
                      </ul>
                      <p>We process verified requests within 30 days. Contact us at <strong>privacy@zieads.com</strong>.</p>
                    </div>
                  </section>

                  <section id="transfers" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>10. International Data Transfers</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">10</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Since PT. Bantu Indonesia Technology is based in Indonesia, your data will be hosted locally and in global server nodes operated by Cloud providers (Vercel/Supabase). Trans-border transfers satisfy safeguards listed under UU PDP Article 56, utilizing strict encryption in transit.
                      </p>
                    </div>
                  </section>

                  <section id="security" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>11. Data Security Measures</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">11</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        We enforce AES-256 standard encryption for OAuth tokens, passwords (hashed), and sensitive campaign metrics. Database systems run Row-Level Security (RLS) policies to prevent cross-account leaks.
                      </p>
                    </div>
                  </section>

                  <section id="cookies" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>12. Cookies & Tracking</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">12</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        We use session cookies for dashboard authentication, timezone preferences, and product statistics (PostHog). We do not share tracking configurations with third-party advertisers.
                      </p>
                    </div>
                  </section>

                  <section id="children" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>13. Children&apos;s Privacy</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">13</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        ZieAds is meant for business professionals. Under UU PDP Article 25, parents hold processing rights. If a minor below 18 is registered, contact us and we will delete the account immediately.
                      </p>
                    </div>
                  </section>

                  <section id="breach-notif" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>14. Data Breach Notification</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">14</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        In the event of a security breach affecting your records, we notify you and current Indonesian telecommunication regulators (Komdigi/Lembaga PDP) within 72 hours under UU PDP Article 46.
                      </p>
                    </div>
                  </section>

                  <section id="changes" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>15. Changes to This Policy</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">15</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        We may update this policy. Material adjustments will be notified to your registered email 30 days before taking effect.
                      </p>
                    </div>
                  </section>

                  <section id="contact" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>16. Contact Information</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">16</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Inquiries or requests can be directed to:</p>
                      <div className="border-l-2 border-[var(--lp-border-strong)] pl-4 text-[14.5px] space-y-1 mt-4">
                        <p className="font-bold text-gray-900">PT. Bantu Indonesia Technology (ZieAds)</p>
                        <p>📍 Omah Dongeng, Somodaran, Purwomartani, Kalasan, Sleman, Yogyakarta, Indonesia</p>
                        <p>✉️ Legal: legal@zieads.com</p>
                        <p>✉️ Privacy inquiries: privacy@zieads.com</p>
                        <p>📞 Phone: +62 851 5762 6264</p>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section id="who-we-are" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>1. Pendahuluan & Siapa Kami</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">01</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Selamat datang di ZieAds. Kebijakan Privasi ini menjelaskan bagaimana <strong>PT. Bantu Indonesia Technology</strong>, yang beroperasi sebagai <strong>ZieAds</strong> ("kami", "kita", "milik kami"), mengumpulkan, memproses, menyimpan, dan melindungi data pribadi Anda saat menggunakan situs web dan aplikasi manajemen media sosial di <strong>zieads.com</strong>.
                      </p>
                      <p>
                        PT. Bantu Indonesia Technology bertindak sebagai <strong>Pengendali Data Pribadi</strong> berdasarkan Undang-Undang Republik Indonesia No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (<strong>UU PDP</strong>), serta sebagai Pengendali Data berdasarkan General Data Protection Regulation (<strong>GDPR</strong>) untuk pengguna di wilayah Uni Eropa.
                      </p>
                      <p>
                        <strong>Ringkasan ZieAds:</strong> ZieAds adalah platform manajemen media sosial yang membantu wirausahawan dan bisnis kecil dalam menjadwalkan konten, menganalisis performa, dan menerima wawasan pemasaran berbasis kecerdasan buatan (AI) di Instagram, TikTok, dan LinkedIn, serta kit audit untuk performa iklan berbayar.
                      </p>
                      <p>
                        Dengan membuat akun, menghubungkan saluran media sosial, atau menggunakan platform ZieAds, Anda memberikan persetujuan eksplisit atas pengumpulan dan pemrosesan data pribadi Anda sesuai dengan Kebijakan Privasi ini.
                      </p>
                    </div>
                  </section>

                  <section id="info-collected" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>2. Informasi Yang Kami Kumpulkan</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">02</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Kami hanya mengumpulkan data yang diperlukan untuk menyediakan layanan kami, yang dibagi menjadi beberapa kategori:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>Informasi Akun:</strong> Nama, alamat email, kata sandi (dienkripsi via bcrypt), nomor telepon (opsional), nama bisnis, detail industri, dan preferensi zona waktu.</li>
                        <li><strong>Data Media Sosial Organik (integrasi v0.3):</strong> Jumlah pengikut, jenis akun, log publikasi, detail profil, postingan terjadwal (teks/lampiran media), dan komentar/balasan dari pengikut yang terhubung melalui saluran OAuth resmi.</li>
                        <li><strong>Data Iklan Berbayar (v0.3):</strong> Metrik kinerja dari unggahan file CSV (nama kampanye, konfigurasi ad set, nama iklan, impresi, klik, pengeluaran, konversi, CPC, CTR, CPM, pendapatan, dan ROAS) yang diunggah langsung dari Meta Ads, Google Ads, atau TikTok Ads Manager.</li>
                        <li><strong>Data AI Analyst:</strong> Laporan Ringkasan AI harian, wawasan kemenangan, pemeriksaan anomali, pelacakan kompetitor, dan perhitungan Best Posting Windows.</li>
                        <li><strong>Data Audit (v0.2):</strong> URL situs web yang diajukan, skor kesiapan iklan (0-100), hasil analisis mendalam, dan riwayat obrolan dengan AI Agent.</li>
                        <li><strong>Informasi Tagihan & Pembayaran:</strong> Transaksi pembayaran diproses oleh Stripe, Inc. Kami tidak menyimpan detail kartu kredit secara langsung; kami hanya menyimpan ID transaksi Stripe dan tingkat langganan.</li>
                      </ul>
                      <blockquote className="border-l-4 border-amber-500 pl-4 bg-amber-50 p-3 rounded-r-lg text-sm text-amber-900">
                        <strong>Mandat:</strong> Kami TIDAK menjual data pengguna kepada pihak ketiga. Kami TIDAK menggunakan data Anda untuk melatih model AI demi keuntungan pengguna lain.
                      </blockquote>
                    </div>
                  </section>

                  <section id="how-we-use" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>3. Bagaimana Kami Menggunakan Informasi</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">03</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Kami memproses data Anda untuk memenuhi kontrak kami dengan Anda, khususnya untuk:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li>Mengautentikasi akun dan mengamankan dasbor kerja Anda.</li>
                        <li>Mengaktifkan penjadwalan, publikasi, dan alur komentar terpadu.</li>
                        <li>Menyusun ringkasan AI harian, waktu posting terbaik, dan tolok ukur pesaing.</li>
                        <li>Mengirimkan email sistem transaksional (seperti peringatan sistem, pemberitahuan, kuitansi).</li>
                        <li>Menghasilkan berkas audit PDF dan melakukan audit ROAS.</li>
                      </ul>
                      <p><strong>Pengungkapan Negatif:</strong> Kami tidak akan mempublikasikan konten Anda ke platform yang tidak Anda setujui secara eksplisit. Kami tidak membagikan metrik keterlibatan Anda dengan jaringan iklan pihak ketiga.</p>
                    </div>
                  </section>

                  <section id="legal-basis" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>4. Dasar Hukum Pemrosesan</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">04</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Kami memproses data berdasarkan dasar hukum berikut:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>UU PDP Pasal 20:</strong> Pemrosesan didasarkan pada persetujuan eksplisit, pelaksanaan kontrak, kepentingan sah (keamanan dan peningkatan produk), dan kepatuhan hukum.</li>
                        <li><strong>GDPR Pasal 6:</strong> Kebutuhan kontraktual, persetujuan pengguna, dan operasi yang sah.</li>
                      </ul>
                      <p>Persetujuan dapat ditarik kapan saja dengan memutuskan hubungan akun atau meminta penghapusan akun ZieAds Anda melalui email.</p>
                    </div>
                  </section>

                  <section id="subprocessors" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>5. Layanan Pihak Ketiga & Sub-prosesor</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">05</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Kami bekerja sama dengan sub-prosesor tepercaya untuk menyediakan layanan. Semua sub-prosesor terikat oleh perjanjian pemrosesan data yang ketat:</p>
                      <div className="space-y-4">
                        <div className="border border-gray-200 p-4 rounded-xl">
                          <p className="font-bold text-gray-900">Anthropic, PBC (Amerika Serikat)</p>
                          <p className="text-sm text-gray-600">Analisis AI via Claude API untuk ringkasan harian, audit pesaing, dan balasan chat. Data diproses secara real-time dan tidak digunakan untuk pelatihan model.</p>
                        </div>
                        <div className="border border-gray-200 p-4 rounded-xl">
                          <p className="font-bold text-gray-900">Stripe, Inc. (Amerika Serikat)</p>
                          <p className="text-sm text-gray-600">Pemrosesan pembayaran dan tagihan langganan. Memenuhi standar PCI-DSS.</p>
                        </div>
                        <div className="border border-gray-200 p-4 rounded-xl">
                          <p className="font-bold text-gray-900">Supabase & Vercel (Hosting Global)</p>
                          <p className="text-sm text-gray-600">Penyimpanan basis data dan aplikasi, dienkripsi saat diam dan dalam transit.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section id="social-integrations" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>6. Integrasi API Media Sosial</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">06</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-6">
                      <p>ZieAds terhubung dengan platform media sosial eksternal melalui konfigurasi OAuth resmi:</p>
                      
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-950">A. Instagram (Meta Platforms, Inc.)</h4>
                        <p>Kami meminta izin untuk:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                          <li><em>instagram_business_basic</em>: Mengambil nama pengguna, jenis akun, dan statistik profil.</li>
                          <li><em>instagram_business_manage_insights</em>: Mengambil metrik keterlibatan postingan, tayangan, dan jangkauan.</li>
                          <li><em>instagram_business_content_publish</em>: Mempublikasikan postingan terjadwal yang disetujui pengguna.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-950">B. TikTok (TikTok Pte. Ltd.)</h4>
                        <p>Kami meminta izin untuk:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                          <li><em>user.info.basic & user.info.profile</em>: Mengambil nama handle, nama tampilan, dan avatar.</li>
                          <li><em>user.info.stats & video.list</em>: Menganalisis penayangan video, membuat daftar postingan yang ada, dan keterlibatan.</li>
                          <li><em>video.publish</em>: Mempublikasikan otomatis postingan terjadwal. Kami menampilkan kredensial pembuat konten, opsi interaksi, dan pengungkapan konten komersial.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-950">C. LinkedIn (LinkedIn Corporation)</h4>
                        <p>Kami meminta izin untuk:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                          <li><em>openid, profile, email</em>: Mengautentikasi login pengguna.</li>
                          <li><em>w_member_social</em>: Mempublikasikan pembaruan terjadwal ke umpan pribadi Anda.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section id="ai-disclosure" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>7. Pengungkapan Pemrosesan AI</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">07</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        ZieAds menggunakan model kecerdasan buatan (AI) yang didukung oleh API Claude Anthropic untuk menghasilkan ringkasan harian dan laporan audit. Metrik dan data Anda diproses melalui saluran API yang aman. Sesuai dengan kebijakan API Anthropic, konten Anda tidak disimpan secara permanen atau digunakan untuk melatih struktur LLM publik. Laporan AI bersifat saran; Anda tetap memiliki kendali penuh atas penyuntingan dan publikasi.
                      </p>
                    </div>
                  </section>

                  <section id="retention" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>8. Retensi & Penghapusan Data</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">08</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Detail akun disimpan selama masa berlangganan aktif Anda. Jika Anda menghapus akun, data akan dihapus secara permanen dalam waktu 90 hari. Anda dapat meminta penghapusan saluran tertentu atau seluruh metrik dengan menghubungi <strong>privacy@zieads.com</strong>.
                      </p>
                    </div>
                  </section>

                  <section id="your-rights" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>9. Hak-Hak Anda & Kerangka Hukum</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">09</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Tergantung pada domisili Anda, Anda memiliki hak-hak tertentu di bawah UU PDP, GDPR, dan CCPA:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>Hak untuk mengakses:</strong> Meminta salinan data pribadi Anda.</li>
                        <li><strong>Hak untuk menghapus (dilupakan):</strong> Penghapusan permanen profil Anda.</li>
                        <li><strong>Hak untuk memperbaiki:</strong> Mengubah entri akun yang tidak akurat.</li>
                        <li><strong>Hak untuk menolak atau membatasi:</strong> Menarik izin pemrosesan data.</li>
                      </ul>
                      <p>Kami memproses permintaan yang terverifikasi dalam waktu 30 hari. Hubungi kami di <strong>privacy@zieads.com</strong>.</p>
                    </div>
                  </section>

                  <section id="transfers" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>10. Transfer Data Internasional</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">10</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Karena PT. Bantu Indonesia Technology berbasis di Indonesia, data Anda akan disimpan secara lokal serta di simpul server global yang dioperasikan oleh penyedia Cloud (Vercel/Supabase). Transfer lintas batas mematuhi ketentuan UU PDP Pasal 56, menggunakan enkripsi transit yang ketat.
                      </p>
                    </div>
                  </section>

                  <section id="security" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>11. Tindakan Keamanan Data</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">11</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Kami menerapkan standar enkripsi AES-256 untuk token OAuth, kata sandi (di-hash), dan metrik kampanye yang sensitif. Sistem basis data menjalankan kebijakan Row-Level Security (RLS) untuk mencegah kebocoran lintas akun.
                      </p>
                    </div>
                  </section>

                  <section id="cookies" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>12. Cookie & Pelacakan</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">12</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Kami menggunakan cookie sesi untuk autentikasi dasbor, preferensi zona waktu, dan statistik produk (PostHog). Kami tidak membagikan konfigurasi pelacakan dengan pengiklan pihak ketiga.
                      </p>
                    </div>
                  </section>

                  <section id="children" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>13. Privasi Anak-Anak</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">13</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        ZieAds ditujukan untuk profesional bisnis. Berdasarkan UU PDP Pasal 25, pemrosesan data anak memerlukan persetujuan orang tua. Jika anak di bawah 18 tahun terdaftar, hubungi kami dan kami akan segera menghapus akun tersebut.
                      </p>
                    </div>
                  </section>

                  <section id="breach-notif" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>14. Pemberitahuan Kebocoran Data</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">14</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Jika terjadi kebocoran keamanan yang memengaruhi catatan Anda, kami akan memberi tahu Anda dan regulator komunikasi Indonesia (Komdigi/Lembaga PDP) dalam waktu 72 jam berdasarkan ketentuan UU PDP Pasal 46.
                      </p>
                    </div>
                  </section>

                  <section id="changes" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>15. Perubahan Kebijakan Ini</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">15</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Penyesuaian material akan diberitahukan ke email Anda yang terdaftar 30 hari sebelum diberlakukan.
                      </p>
                    </div>
                  </section>

                  <section id="contact" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>16. Informasi Kontak</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">16</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Pertanyaan atau permintaan dapat ditujukan ke:</p>
                      <div className="border-l-2 border-[var(--lp-border-strong)] pl-4 text-[14.5px] space-y-1 mt-4">
                        <p className="font-bold text-gray-900">PT. Bantu Indonesia Technology (ZieAds)</p>
                        <p>📍 Omah Dongeng, Somodaran, Purwomartani, Kalasan, Sleman, Yogyakarta, Indonesia</p>
                        <p>✉️ Hukum/Legal: legal@zieads.com</p>
                        <p>✉️ Inquiries Privasi: privacy@zieads.com</p>
                        <p>📞 Telepon: +62 851 5762 6264</p>
                      </div>
                    </div>
                  </section>
                </>
              )}

            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-inner footer-grid-layout">
            <div className="footer-col footer-brand-col">
              <div className="footer-brand" onClick={scrollToTop}>
                <ZieAdsLogo size={32} />
                <span className="brand-name">zieads</span>
              </div>
              <p className="footer-tagline">AI-powered paid ads strategy for marketers and agencies.</p>
              <div className="footer-social-links">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Twitter/X</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> LinkedIn</a>
              </div>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Product</h4>
              <a href="/#how-it-works">How It Works</a>
              <a href="/#pricing">Pricing</a>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Resources</h4>
              <a href="/#faq">FAQ</a>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Legal</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }}>Privacy Policy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms of Service</a>
            </div>
          </div>
          <div className="footer-bottom-bar">
            <p className="footer-copy">© 2026 ZieAds. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
