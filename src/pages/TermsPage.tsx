import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { Scale, FileText, ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('acceptance');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'service-description', title: '2. Description of Service' },
    { id: 'account', title: '3. Account Registration & Security' },
    { id: 'third-party-connections', title: '4. Third-Party Connections' },
    { id: 'acceptable-use', title: '5. Acceptable Use' },
    { id: 'ai-recommendations', title: '6. AI Recommendations' },
    { id: 'credits-payment', title: '7. Credits & Payments' },
    { id: 'ip', title: '8. Intellectual Property' },
    { id: 'disclaimer', title: '9. Disclaimers' },
    { id: 'liability', title: '10. Limitation of Liability' },
    { id: 'termination', title: '11. Termination' },
    { id: 'governing-law', title: '12. Governing Law & Disputes' },
    { id: 'changes', title: '13. Changes to Terms' },
    { id: 'contact', title: '14. Contact' }
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
      <div className="pt-[100px]">
        
        {/* Hero Section */}
        <section className="bg-[var(--lp-bg-inset)] border-b border-[var(--lp-border-subtle)] py-16 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[var(--lp-border-default)] text-[var(--lp-text-secondary)] text-[11px] font-mono font-semibold rounded-full uppercase tracking-wider mb-4 shadow-sm">
                <Scale size={12} className="text-[var(--lp-accent)]" />
                Terms & Agreements
              </div>
              <h1 className="text-4xl sm:text-[48px] font-extrabold text-[var(--lp-text-primary)] tracking-tight leading-tight mb-4">
                Terms of Service
              </h1>
              <p className="text-[var(--lp-text-muted)] text-sm font-mono uppercase tracking-widest mb-6">
                Last updated: June 23, 2026 &bull; PT. Bantu Indonesia Technology
              </p>
              <p className="text-[var(--lp-text-secondary)] text-base sm:text-lg leading-relaxed">
                Please read these Terms of Service carefully before using our software platform. These terms govern your rights and responsibilities when using ZieAds.
              </p>
            </div>
          </div>
        </section>

        {/* Content Container (GoMarble-style Two Column Grid) */}
        <section className="max-w-6xl mx-auto px-6 py-16 relative">
          <div className="flex flex-col lg:flex-row gap-12 items-start relative">
            
            {/* Sticky Navigation Sidebar */}
            <aside className="lg:sticky lg:top-28 w-full lg:w-72 shrink-0 pr-4 pb-6 border-b lg:border-b-0 lg:border-r border-[var(--lp-border-subtle)] hidden md:block self-start max-h-[calc(100vh-140px)] overflow-y-auto">
              <div className="text-[11px] font-bold text-[var(--lp-text-muted)] uppercase tracking-widest mb-4 font-mono">
                Document Sections
              </div>
              <ul className="space-y-1.5">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left py-2 px-3 text-[13.5px] rounded-xl transition-all duration-200 font-medium ${
                        activeSection === sec.id
                          ? 'bg-[var(--lp-text-primary)] text-white font-semibold shadow-sm'
                          : 'text-[var(--lp-text-secondary)] hover:text-[var(--lp-text-primary)] hover:bg-[var(--lp-bg-canvas-alt)]'
                      }`}
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
              <section id="acceptance" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>1. Acceptance of Terms</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">01</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    By accessing or using ZieAds, you confirm that you are at least 18 years old, have the legal authority to enter into this agreement, and agree to comply with these Terms and our Privacy Policy. If you are using ZieAds on behalf of a company or organization, you represent that you have the authority to bind that entity to these Terms.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="service-description" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>2. Description of Service</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">02</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    ZieAds provides an AI-powered platform that connects to your advertising accounts (Meta, Google, TikTok) to analyze campaign performance, identify optimization opportunities, and assist you in executing improvements. The service includes: AI analysis of your ad account data, performance diagnostics (ROAS analysis, creative fatigue detection, budget optimization), AI-generated campaign recommendations, optional execution of approved optimizations via connected ad platform APIs, and a credit-based access system for premium features.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="account" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>3. Account Registration and Security</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">03</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>To use our services, you must register for an account. You agree to the following terms:</p>
                  <ul className="space-y-3.5 pl-1">
                    {[
                      "You must provide accurate and complete information when registering.",
                      "You are responsible for maintaining the confidentiality of your account credentials.",
                      "You are responsible for all activity that occurs under your account.",
                      "You must notify us immediately at support@zieads.com if you suspect unauthorized access.",
                      "We reserve the right to suspend or terminate accounts that violate these Terms."
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-[var(--lp-text-primary)] shrink-0 mt-1" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section id="third-party-connections" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>4. Third-Party Platform Connections (Meta, Google, TikTok)</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">04</span>
                </h2>
                <div className="bg-[var(--lp-bg-inset)] border border-[var(--lp-border-subtle)] border-l-4 border-l-[var(--lp-text-primary)] p-6 rounded-r-2xl text-[15px] text-[var(--lp-text-secondary)] space-y-4 shadow-[var(--lp-shadow-subtle)]">
                  <p className="font-semibold text-[var(--lp-text-primary)]">
                    When you connect your advertising accounts to ZieAds:
                  </p>
                  <ul className="list-disc list-inside space-y-2.5 pl-2">
                    <li>You authorize ZieAds to access your ad account data as described in our Privacy Policy and as permitted by the relevant platform&apos;s terms.</li>
                    <li>You remain solely responsible for your advertising accounts, campaigns, budgets, and compliance with each platform&apos;s advertising policies.</li>
                    <li>ZieAds is a tool to assist your decision-making. All final decisions regarding campaign changes remain yours unless you explicitly authorize automated execution.</li>
                    <li>For Meta: you authorize us to use the ads_read and ads_management permissions as described in our Privacy Policy. We comply with Meta&apos;s Platform Terms (https://developers.facebook.com/terms).</li>
                    <li>ZieAds is not affiliated with, endorsed by, or officially connected to Meta, Google, or TikTok.</li>
                    <li>You can revoke ZieAds access to any connected account at any time from your ZieAds account settings or directly from the third-party platform.</li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section id="acceptable-use" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>5. Acceptable Use</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">05</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>You agree NOT to use ZieAds to:</p>
                  <ul className="list-disc list-inside space-y-2.5 pl-2">
                    <li>Violate any applicable law, regulation, or third-party rights.</li>
                    <li>Run ads that violate Meta&apos;s, Google&apos;s, or TikTok&apos;s advertising policies.</li>
                    <li>Attempt to reverse-engineer, decompile, or extract source code from ZieAds.</li>
                    <li>Resell, sublicense, or transfer access to ZieAds without written permission.</li>
                    <li>Use ZieAds to build a competing product or service.</li>
                    <li>Scrape, crawl, or extract data from ZieAds in bulk.</li>
                    <li>Attempt to gain unauthorized access to ZieAds systems or other users&apos; accounts.</li>
                    <li>Use ZieAds for any fraudulent, deceptive, or misleading advertising.</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section id="ai-recommendations" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>6. AI Recommendations and Execution</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">06</span>
                </h2>
                <div className="bg-[var(--lp-bg-inset)] border border-[var(--lp-border-subtle)] border-l-4 border-l-[var(--lp-text-primary)] p-6 rounded-r-2xl text-[15px] text-[var(--lp-text-secondary)] space-y-4 shadow-[var(--lp-shadow-subtle)]">
                  <p className="font-semibold text-[var(--lp-text-primary)] flex items-center gap-2">
                    <AlertTriangle size={18} className="text-[var(--lp-text-primary)] shrink-0" />
                    ZieAds uses artificial intelligence to generate recommendations. You understand and agree that:
                  </p>
                  <ul className="list-disc list-inside space-y-2.5 pl-2">
                    <li>AI recommendations are based on data patterns and are not guarantees of advertising performance.</li>
                    <li>ZieAds does not guarantee specific ROAS, conversion rates, or business outcomes.</li>
                    <li>When ZieAds executes changes to your ad account (e.g., budget adjustments, campaign pausing) via API, it does so only upon your explicit approval of each action.</li>
                    <li>You are responsible for reviewing AI recommendations before approving their execution.</li>
                    <li>ZieAds is not liable for losses resulting from AI recommendations you choose to implement.</li>
                    <li>AI outputs may contain errors or inaccuracies. Always apply your own judgment.</li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section id="credits-payment" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>7. Credits, Plans, and Payment</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">07</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <ul className="list-disc list-inside space-y-2.5 pl-2">
                    <li>ZieAds operates on a credit-based and/or subscription pricing model. Plan details are described on our pricing page.</li>
                    <li>Credits are non-refundable once consumed unless otherwise stated.</li>
                    <li>Subscription fees are billed in advance and are non-refundable except as required by law.</li>
                    <li>We reserve the right to change pricing with 30 days&apos; notice to active subscribers.</li>
                    <li>Failure to pay may result in suspension of your account.</li>
                    <li>All prices are in USD unless otherwise stated.</li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section id="ip" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>8. Intellectual Property</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">08</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    ZieAds and its original content, features, AI models, and functionality are and will remain the exclusive property of ZieAds and its licensors. You retain all ownership of your advertising data. You grant ZieAds a limited, non-exclusive license to access and process your data solely to provide the service. You may not use ZieAds&apos;s name, logo, or branding without written permission.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="disclaimer" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>9. Disclaimers</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">09</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    ZieAds is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. We do not warrant that: the service will be uninterrupted or error-free, AI recommendations will be accurate or achieve specific results, or the service will meet your specific requirements. Use of ZieAds is at your own risk.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="liability" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>10. Limitation of Liability</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">10</span>
                </h2>
                <div className="text-[15px] text-zinc-650 leading-relaxed space-y-4">
                  <p>
                    To the maximum extent permitted by law, ZieAds and its affiliates, officers, employees, and partners shall not be liable for: indirect, incidental, special, or consequential damages, loss of profits or revenue, loss of advertising spend resulting from AI recommendations, data loss or corruption, or unauthorized access to your ad accounts by third parties. Our total liability to you for any claim shall not exceed the amount you paid to ZieAds in the 3 months preceding the claim.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="termination" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>11. Termination</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">11</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    You may terminate your account at any time by contacting support@zieads.com or via your account settings. We may suspend or terminate your access if you violate these Terms, with or without notice. Upon termination, your right to use ZieAds immediately ceases. We will delete your data in accordance with our Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section id="governing-law" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>12. Governing Law and Disputes</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">12</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    These Terms are governed by the laws of <strong>Indonesia</strong>. Any disputes arising from these Terms will be resolved through good-faith negotiation first. If unresolved, disputes will be submitted to the courts of Indonesia, as permitted by applicable law.
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section id="changes" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>13. Changes to Terms</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">13</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    We reserve the right to modify these Terms. Material changes will be communicated via email and in-app notice at least 14 days before taking effect. Continued use of ZieAds after the effective date constitutes your acceptance of the revised Terms.
                  </p>
                </div>
              </section>

              {/* Section 14 */}
              <section id="contact" className="scroll-mt-28">
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                  <span>14. Contact</span>
                  <span className="text-xs text-[var(--lp-text-muted)] font-mono">14</span>
                </h2>
                <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    For questions about these Terms of Service:
                  </p>
                  <div className="bg-white border border-[var(--lp-border-subtle)] rounded-[var(--lp-radius-card)] p-6 text-[14px] text-[var(--lp-text-secondary)] space-y-2 max-w-md shadow-[var(--lp-shadow-subtle)]">
                    <p className="font-semibold text-[var(--lp-text-primary)]">PT. Bantu Indonesia Technology</p>
                    <p>✉️ Email: <a href="mailto:legal@zieads.com" className="text-[var(--lp-text-primary)] underline font-medium hover:text-[var(--lp-accent)]">legal@zieads.com</a></p>
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
