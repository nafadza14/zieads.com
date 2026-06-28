import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { Shield, Lock, ExternalLink, Mail, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('who-we-are');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'who-we-are', title: '1. Who We Are' },
    { id: 'information-we-collect', title: '2. Information We Collect' },
    { id: 'how-we-use', title: '3. How We Use Your Information' },
    { id: 'meta-data-usage', title: '4. Meta Platform Data Disclosures' },
    { id: 'data-storage', title: '5. Data Storage & Security' },
    { id: 'data-sharing', title: '6. Data Sharing & Third Parties' },
    { id: 'your-rights', title: '7. Your Rights' },
    { id: 'cookies', title: '8. Cookies & Tracking' },
    { id: 'children', title: '9. Children\'s Privacy' },
    { id: 'international', title: '10. International Transfers' },
    { id: 'changes', title: '11. Changes to This Policy' },
    { id: 'contact', title: '12. Contact Us' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (const section of sections) {
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
  }, []);

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
      {/* GRID LINES BACKGROUND */}
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="lp-line-top"></div>
      
      {/* ══════════════════════════════════ NAVBAR ══════════════════════════════════ */}
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
            <button className="btn-get-started" onClick={() => navigate('/sign-up')}>
              Get Started Free
            </button>
          </div>

          {/* Mobile Hamburger Button */}
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

          {/* Mobile Dropdown Panel */}
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
                  className="w-full py-3.5 border border-gray-200 hover:border-gray-300 rounded-xl font-bold text-[14px] text-gray-750 text-center bg-white hover:bg-gray-50 active:scale-[0.98] transition-all"
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-in'); }}
                  style={{ cursor: 'pointer' }}
                >
                  Log in
                </button>
                <button
                  className="w-full py-3.5 btn-lp-primary-gradient text-white rounded-xl font-bold text-[14px] text-center active:scale-[0.98] transition-all"
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

      {/* Main Page Layout (Spacing for Floating Navbar) */}
      <div className="pt-[140px] md:pt-[160px] pb-12">
        
        {/* Hero Section */}
        <section className="bg-[var(--lp-bg-inset)] border-b border-[var(--lp-border-subtle)] py-12 md:py-16 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--lp-bg-canvas-alt)] border border-[var(--lp-border-default)] text-[var(--lp-text-secondary)] text-[11px] font-mono font-semibold rounded-full uppercase tracking-wider mb-4">
                <Shield size={12} className="text-[var(--lp-text-primary)]" />
                Legal Documents
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-[var(--lp-text-primary)] tracking-tight leading-tight mb-4">
                Privacy Policy
              </h1>
              <p className="text-[var(--lp-text-muted)] text-xs sm:text-sm font-mono uppercase tracking-widest mb-6">
                Last updated: June 23, 2026 &bull; PT. Bantu Indonesia Technology
              </p>
              <p className="text-[var(--lp-text-secondary)] text-base leading-relaxed">
                PT. Bantu Indonesia Technology (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates ZieAds. This document details how we handle, collect, secure, and disclose campaign performance metrics and platform configurations when you connect your advertising accounts.
              </p>
            </div>
          </div>
        </section>

        {/* Content Container (GoMarble-style Two Column Grid) */}
        <section className="max-w-6xl mx-auto px-6 py-12 md:py-16 relative">
          <div className="flex flex-col lg:flex-row gap-12 items-start relative">
            
            {/* Sticky Navigation Sidebar */}
            <aside className="lg:sticky lg:top-28 w-full lg:w-72 shrink-0 pr-4 pb-6 border-b lg:border-b-0 lg:border-r border-[var(--lp-border-subtle)] hidden md:block self-start max-h-[calc(100vh-140px)] overflow-y-auto">
              <div className="text-[11px] font-bold text-[var(--lp-text-muted)] uppercase tracking-widest mb-4 font-mono">
                Document Sections
              </div>
              <ul className="space-y-1">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left py-2 px-3 text-[13.5px] transition-all duration-250 font-medium border-l-2 ${
                        activeSection === sec.id
                          ? 'border-[var(--lp-text-primary)] text-[var(--lp-text-primary)] font-semibold pl-4'
                          : 'border-transparent text-[var(--lp-text-secondary)] hover:text-[var(--lp-text-primary)] pl-4'
                      }`}
                      style={{ borderRadius: '0px' }}
                    >
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Main Content Body */}
            <div className="flex-1 max-w-3xl space-y-16">
              
              {/* Section 1 */}
              <section id="who-we-are" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>1. Who We Are</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">01</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    ZieAds is an AI-powered paid ads optimization platform operated by <strong>PT. Bantu Indonesia Technology</strong>, a technology company registered and based in <strong>Indonesia</strong>. Our platform helps advertisers analyze, inspect, and optimize campaign layouts and ROI using advanced artificial intelligence algorithms.
                  </p>
                  <p>
                    For any privacy inquiries, data deletion requests, or questions, contact us:
                  </p>
                  <div className="border-l-2 border-[var(--lp-border-strong)] pl-4 text-[14px] text-[var(--lp-text-secondary)] space-y-1.5 mt-4 max-w-md">
                    <p className="font-semibold text-[var(--lp-text-primary)]">PT. Bantu Indonesia Technology</p>
                    <p>✉️ Email: <a href="mailto:privacy@zieads.com" className="text-[var(--lp-text-primary)] underline font-medium hover:text-[var(--lp-accent)]">privacy@zieads.com</a></p>
                    <p>🌐 Website: <a href="https://zieads.com" target="_blank" rel="noopener noreferrer" className="text-[var(--lp-text-primary)] underline font-medium hover:text-[var(--lp-accent)]">https://zieads.com</a></p>
                    <p>📍 Office: Jakarta, Indonesia</p>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section id="information-we-collect" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>2. Information We Collect</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">02</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-8">
                  
                  <div className="space-y-2">
                    <h4 className="text-[var(--lp-text-primary)] font-bold text-[16px] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--lp-text-primary)]"></span>
                      2.1 Account Information
                    </h4>
                    <p>
                      When you register, we collect your name, email address, and password. Passwords are fully hashed and encrypted using industry standard protocols (we never store passwords in plaintext).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[var(--lp-text-primary)] font-bold text-[16px] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--lp-text-primary)]"></span>
                      2.2 Advertising Account Data (Meta, Google, TikTok)
                    </h4>
                    <p>
                      When you connect your advertising accounts, we access campaign performance data including: campaign names and IDs, ad set and ad-level metrics (impressions, clicks, spend, ROAS, CTR, CPC, CPM, conversion events), audience targeting configurations, creative metadata (ad names, formats &mdash; not the creative files themselves), and budget and bid settings.
                    </p>
                    <div className="text-[13.5px] text-[var(--lp-text-secondary)] bg-[var(--lp-bg-canvas-alt)] p-4 rounded-xl border border-[var(--lp-border-subtle)] space-y-2 mt-3">
                      <p>&bull; This data is accessed solely to generate AI-powered optimization recommendations for you.</p>
                      <p>&bull; We do <strong>NOT</strong> access personal data of your ad audiences.</p>
                      <p>&bull; We do <strong>NOT</strong> access your personal Facebook profile, messages, friends list, or any non-ads data.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[var(--lp-text-primary)] font-bold text-[16px] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--lp-text-primary)]"></span>
                      2.3 Usage Data
                    </h4>
                    <p>
                      We collect logs of how you interact with ZieAds, including pages visited, features used, analysis modes run, and session timestamps. This is used to improve the product.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[var(--lp-text-primary)] font-bold text-[16px] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--lp-text-primary)]"></span>
                      2.4 Payment Information
                    </h4>
                    <p>
                      Payment is processed by our third-party provider (Stripe). We do not store your full card number. We store basic transaction records (amount, date, billing plan) for billing purposes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[var(--lp-text-primary)] font-bold text-[16px] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--lp-text-primary)]"></span>
                      2.5 Communications
                    </h4>
                    <p>
                      If you contact us via email or support, we store the content of that communication to respond and improve our service.
                    </p>
                  </div>

                </div>
              </section>

              {/* Section 3 */}
              <section id="how-we-use" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>3. How We Use Your Information</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">03</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>We use your information for the following purposes only:</p>
                  <ul className="space-y-3.5 pl-1">
                    {[
                      "To provide the ZieAds service: analyzing your ad account data and generating AI-powered recommendations.",
                      "To display your campaign performance history within ZieAds.",
                      "To send you product updates, alerts (e.g., ROAS drop notifications), and account-related emails.",
                      "To improve our AI models using aggregated, anonymized, and de-identified performance benchmarks. We never use your identifiable campaign data to train models without explicit consent.",
                      "To comply with legal obligations.",
                      "To prevent fraud and abuse of our platform.",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-[var(--lp-text-primary)] shrink-0 mt-1" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-[var(--lp-bg-inset)] border border-[var(--lp-border-subtle)] p-4 rounded-xl text-[var(--lp-text-secondary)] text-sm font-medium mt-6">
                    We do <strong>NOT</strong> sell your data to third parties. We do <strong>NOT</strong> use your data for advertising purposes unrelated to delivering our service to you.
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="meta-data-usage" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>4. Meta Platform Data — Specific Disclosures</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">04</span>
                </h2>
                <div className="bg-[var(--lp-bg-inset)] border border-[var(--lp-border-subtle)] border-l-4 border-l-[var(--lp-text-primary)] p-6 rounded-r-xl text-[15px] text-[var(--lp-text-secondary)] space-y-4">
                  <p className="font-semibold text-[var(--lp-text-primary)]">
                    This section specifically addresses our use of data obtained via Meta&apos;s Marketing API, in compliance with Meta&apos;s Platform Terms and Developer Policies:
                  </p>
                  <ul className="space-y-3.5">
                    {[
                      "We access Meta Ads data only after you explicitly authorize ZieAds via Facebook OAuth.",
                      "We request only the permissions required: ads_read (to read campaign performance data) and ads_management (to apply optimizations you explicitly approve).",
                      "Meta Ads data is used solely to provide the ZieAds optimization service to you — the authenticated user who granted access.",
                      "We do not transfer Meta user data to third parties, including advertising networks, data brokers, or analytics companies.",
                      "We do not use Meta data to target or retarget users on Meta or other platforms.",
                      "We do not use Meta data for surveillance, profiling, or any purpose not disclosed in this policy.",
                      "We do not store Meta access tokens beyond what is necessary for the OAuth session or long-lived token as permitted by Meta's policies.",
                      "You can revoke ZieAds access to your Meta account at any time via Facebook Settings → Apps and Websites.",
                      "We comply with Meta's Platform Terms: https://developers.facebook.com/terms"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="font-mono text-xs text-[var(--lp-text-muted)] mt-1">4.{idx + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section id="data-storage" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>5. Data Storage and Security</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">05</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    Your data is stored on secure cloud servers. We implement the following security measures:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Encryption at rest (AES-256)</li>
                    <li>Encryption in transit (TLS 1.2+)</li>
                    <li>Access controls limited to authorized personnel only</li>
                    <li>Regular security reviews</li>
                  </ul>
                  <p>
                    We retain your advertising account data for as long as your account is active. If you delete your account, we delete your data within 30 days, except where required by law.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="data-sharing" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>6. Data Sharing and Third Parties</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">06</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>We share data only in the following limited circumstances:</p>
                  <ul className="list-disc list-inside space-y-2.5 pl-2">
                    <li>
                      <strong className="text-[var(--lp-text-primary)]">Service providers:</strong> We use trusted third-party providers (e.g., cloud hosting, payment processing, error monitoring) who are contractually bound to protect your data and use it only to provide services to us.
                    </li>
                    <li>
                      <strong className="text-[var(--lp-text-primary)]">Legal requirements:</strong> We may disclose data if required by law, court order, or government authority.
                    </li>
                    <li>
                      <strong className="text-[var(--lp-text-primary)]">Business transfers:</strong> If ZieAds is acquired or merged, your data may be transferred. We will notify you in advance.
                    </li>
                    <li>
                      <strong className="text-[var(--lp-text-primary)]">With your consent:</strong> We will share data with other parties only if you explicitly authorize it.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section id="your-rights" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>7. Your Rights</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">07</span>
                </h2>
                <div className="bg-[var(--lp-bg-canvas-alt)] border border-[var(--lp-border-subtle)] border-l-4 border-l-[var(--lp-text-primary)] p-6 rounded-r-xl text-[15px] text-[var(--lp-text-secondary)] space-y-4">
                  <p className="font-semibold text-[var(--lp-text-primary)]">
                    You have the following rights regarding your personal data:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li><strong>Access:</strong> Request a copy of all personal data we hold about you.</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and all associated data.</li>
                    <li><strong>Portability:</strong> Request your data in a machine-readable format.</li>
                    <li><strong>Opt-out:</strong> Opt out of non-essential communications at any time.</li>
                    <li><strong>Revoke third-party access:</strong> Disconnect your Meta, Google, or TikTok accounts from ZieAds at any time from your account settings.</li>
                  </ul>
                  <p>
                    To exercise any of these rights, email: <a href="mailto:privacy@zieads.com" className="text-[var(--lp-text-primary)] font-semibold underline hover:text-[var(--lp-accent)]">privacy@zieads.com</a>. We will respond within 30 days.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="cookies" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>8. Cookies and Tracking</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">08</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    We use cookies and similar technologies for: authentication (keeping you logged in), session management, and product analytics (aggregate usage patterns). We do not use advertising cookies or cross-site tracking. You can disable cookies in your browser settings, but this may affect your ability to use ZieAds.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="children" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>9. Children&apos;s Privacy</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">09</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    ZieAds is not directed at individuals under the age of 18. We do not knowingly collect personal data from children. If you believe we have collected data from a child, contact us immediately at <a href="mailto:privacy@zieads.com" className="text-[var(--lp-text-primary)] underline hover:text-[var(--lp-accent)]">privacy@zieads.com</a>.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="international" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>10. International Data Transfers</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">10</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    ZieAds operates globally. Your data may be processed in countries outside your own. We ensure that international transfers comply with applicable data protection laws and that appropriate safeguards are in place.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="changes" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>11. Changes to This Policy</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">11</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    We may update this Privacy Policy. If we make material changes, we will notify you by email and display a prominent notice in the app at least 14 days before the changes take effect. Continued use of ZieAds after that date constitutes acceptance of the updated policy.
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section id="contact" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>12. Contact Us</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">12</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    For privacy-related questions, requests, or complaints:
                  </p>
                  <div className="border-l-2 border-[var(--lp-border-strong)] pl-4 text-[14px] text-[var(--lp-text-secondary)] space-y-1.5 mt-4 max-w-md">
                    <p className="font-semibold text-[var(--lp-text-primary)]">PT. Bantu Indonesia Technology</p>
                    <p>✉️ Email: <a href="mailto:privacy@zieads.com" className="text-[var(--lp-text-primary)] underline font-medium hover:text-[var(--lp-accent)]">privacy@zieads.com</a></p>
                    <p>🌐 Website: <a href="https://zieads.com" target="_blank" rel="noopener noreferrer" className="text-[var(--lp-text-primary)] underline font-medium hover:text-[var(--lp-accent)]">https://zieads.com</a></p>
                    <p>📍 Location: Jakarta, Indonesia</p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════ FOOTER ══════════════════════════════════ */}
        <footer className="footer">
          <div className="footer-inner footer-grid-layout">
            <div className="footer-col footer-brand-col">
              <div className="footer-brand" onClick={scrollToTop}>
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
            <p className="footer-copy">© 2026 ZieAds. All rights reserved.</p>
            <p className="footer-trust-note">ZieAds does not access, store, or transmit your ad account credentials. Audits are based on publicly visible page data only.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
