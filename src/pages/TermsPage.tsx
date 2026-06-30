import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { Scale, FileText, ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink, Globe } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const [activeSection, setActiveSection] = useState('agreement');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = {
    en: [
      { id: 'agreement', title: '1. Agreement to Terms' },
      { id: 'description', title: '2. Description of Service' },
      { id: 'eligibility', title: '3. Eligibility & Account' },
      { id: 'billing', title: '4. Subscription Plans & Billing' },
      { id: 'acceptable-use', title: '5. Acceptable Use Policy' },
      { id: 'intellectual-property', title: '6. User Content & Intellectual Property' },
      { id: 'compliance', title: '7. Third-Party Platform Compliance' },
      { id: 'ai-disclaimer', title: '8. AI-Generated Content Disclaimer' },
      { id: 'availability', title: '9. Service Availability & Modifications' },
      { id: 'warranties', title: '10. Disclaimers & Warranties' },
      { id: 'liability', title: '11. Limitation of Liability' },
      { id: 'indemnity', title: '12. Indemnification' },
      { id: 'termination', title: '13. Termination' },
      { id: 'dispute-resolution', title: '14. Dispute Resolution & Governing Law' },
      { id: 'changes-to-terms', title: '15. Changes to These Terms' },
      { id: 'contact-terms', title: '16. Contact Information' }
    ],
    id: [
      { id: 'agreement', title: '1. Persetujuan Ketentuan' },
      { id: 'description', title: '2. Deskripsi Layanan' },
      { id: 'eligibility', title: '3. Kelayakan & Akun Pendaftaran' },
      { id: 'billing', title: '4. Paket Berlangganan & Penagihan' },
      { id: 'acceptable-use', title: '5. Kebijakan Penggunaan Wajar' },
      { id: 'intellectual-property', title: '6. Konten Pengguna & Kekayaan Intelektual' },
      { id: 'compliance', title: '7. Kepatuhan Platform Pihak Ketiga' },
      { id: 'ai-disclaimer', title: '8. Sanggahan Konten Buatan AI' },
      { id: 'availability', title: '9. Ketersediaan & Modifikasi Layanan' },
      { id: 'warranties', title: '10. Sanggahan & Jaminan' },
      { id: 'liability', title: '11. Batasan Tanggung Jawab' },
      { id: 'indemnity', title: '12. Ganti Rugi' },
      { id: 'termination', title: '13. Pengakhiran Akun' },
      { id: 'dispute-resolution', title: '14. Penyelesaian Sengketa & Hukum Republik Indonesia' },
      { id: 'changes-to-terms', title: '15. Perubahan Ketentuan Ini' },
      { id: 'contact-terms', title: '16. Informasi Kontak' }
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
        
        {/* Hero Section */}
        <section className="bg-[var(--lp-bg-inset)] border-b border-[var(--lp-border-subtle)] py-12 md:py-16 px-6 relative">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--lp-bg-canvas-alt)] border border-[var(--lp-border-default)] text-[var(--lp-text-secondary)] text-[11px] font-mono font-semibold rounded-full uppercase tracking-wider mb-4">
                <Scale size={12} className="text-[var(--lp-text-primary)]" />
                Terms & Agreements
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-[var(--lp-text-primary)] tracking-tight leading-tight mb-4">
                {lang === 'en' ? 'Terms of Service' : 'Ketentuan Layanan'}
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
                  background: lang === 'en' ? 'var(--primary)' : 'transparent',
                  color: lang === 'en' ? '#fff' : 'var(--text)',
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
                  background: lang === 'id' ? 'var(--primary)' : 'transparent',
                  color: lang === 'id' ? '#fff' : 'var(--text)',
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
                  <section id="agreement" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>1. Agreement to Terms</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">01</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        These Terms of Service constitute a legally binding agreement between you and <strong>PT. Bantu Indonesia Technology</strong>, an Indonesian limited liability company registered in Yogyakarta, Indonesia, operating the ZieAds platform at <strong>zieads.com</strong>.
                      </p>
                      <p>
                        By accessing or registering for ZieAds, you agree to follow these Terms. If you do not accept these provisions, you must stop using the website immediately.
                      </p>
                    </div>
                  </section>

                  <section id="description" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>2. Description of Service</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">02</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>ZieAds is a software-as-a-service (SaaS) platform that provides:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>Social Media Management (v0.3):</strong> Scheduling, visual calendar views, content publishing pipeline (Instagram, TikTok, LinkedIn), unified comment inbox, and competitor monitoring tools.</li>
                        <li><strong>AI Marketing Analyst Layer (v0.3):</strong> Daily AI-generated briefings, anomaly alerts, post timings optimization, and cross-channel paid ads + organic analytics.</li>
                        <li><strong>Paid Advertising Audits (v0.2):</strong> Web audit report scores (0-100), 10 deep diagnosis analysis scopes, 15 terminal slash commands, white-label report exports, and credit-based model execution.</li>
                      </ul>
                    </div>
                  </section>

                  <section id="eligibility" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>3. Eligibility & Account registration</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">03</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        You must be at least 18 years of age to construct a profile on our platform. You commit to supplying true, current, and complete registration details. You are responsible for keeping your login credentials confidential and notify us at <strong>legal@zieads.com</strong> of any security breach.
                      </p>
                    </div>
                  </section>

                  <section id="billing" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>4. Subscription Plans & Billing</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">04</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        We offer tiered plans (Solo: $29/mo, Pro: $89/mo, Studio: $229/mo) and credit packages processed through Stripe. Subscriptions renew automatically until canceled. We provide a 14-day refund window for initial purchases. If payment fails after 3 tries, we downgrade the account to the Free tier. Prices exclude applicable VAT (PPN) in Indonesia.
                      </p>
                    </div>
                  </section>

                  <section id="acceptable-use" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>5. Acceptable Use Policy</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">05</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>You agree not to use ZieAds for any of the following:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li>Posting illegal, defamatory, obscene, or threatening materials.</li>
                        <li>Spamming or sending unapproved promotional pitches.</li>
                        <li>Violating Meta, TikTok, or LinkedIn developer agreements.</li>
                        <li>Bulk scraping database content or reverse-engineering algorithms.</li>
                      </ul>
                      <p>Violators face immediate profile suspension without refunds.</p>
                    </div>
                  </section>

                  <section id="intellectual-property" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>6. User Content & Intellectual Property</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">06</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        You retain full ownership of captions, media assets, and files created or scheduled through ZieAds. You grant us a limited, royalty-free license to store, process, and publish this content solely to deliver our services.
                      </p>
                      <p>
                        All software source code, layout systems, AI prompts, audit scoring metrics, database models, and branding trademarks are the exclusive property of PT. Bantu Indonesia Technology.
                      </p>
                    </div>
                  </section>

                  <section id="compliance" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>7. Third-Party Platform Compliance</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">07</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        You acknowledge that ZieAds is not affiliated with or endorsed by Meta, TikTok, or LinkedIn. You must comply with all third-party developer policies when publishing content via our platform. We are not liable for account suspensions or restrictions applied by these networks.
                      </p>
                    </div>
                  </section>

                  <section id="ai-disclaimer" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>8. AI-Generated Content Disclaimer</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">08</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Writers, audits, briefings, and suggestions are compiled through Anthropic's Claude AI API and are provided "as-is". They represent suggestions rather than binding professional business or legal advice. You maintain full control over verifying and editing suggestions.
                      </p>
                    </div>
                  </section>

                  <section id="availability" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>9. Service Availability & Modifications</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">09</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        We strive for a 99.5% uptime but do not guarantee uninterrupted access. Features may change or get deprecated with reasonable notice. We are not liable for third-party platform API outages.
                      </p>
                    </div>
                  </section>

                  <section id="warranties" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>10. Disclaimers & Warranties</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">10</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        ZIEADS IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING FIT FOR A PARTICULAR ADVERTISING GOAL.
                      </p>
                    </div>
                  </section>

                  <section id="liability" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>11. Limitation of Liability</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">11</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        To the maximum extent permitted by law, PT. Bantu Indonesia Technology and its affiliates will not be liable for indirect, special, or consequential damages, loss of profits, data leaks, or budget losses on connected ad campaigns. Our total liability is capped at the amount paid by you to ZieAds in the 12 months preceding the claim.
                      </p>
                    </div>
                  </section>

                  <section id="indemnity" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>12. Indemnification</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">12</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        You agree to indemnify and hold harmless PT. Bantu Indonesia Technology from any third-party claims, legal fees, or damages arising from your violation of these Terms or third-party platform conditions.
                      </p>
                    </div>
                  </section>

                  <section id="termination" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>13. Termination</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">13</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        You can cancel subscription tiers at any time via your account workspace. We reserve the right to suspend login paths for users violating our acceptable usage policy.
                      </p>
                    </div>
                  </section>

                  <section id="dispute-resolution" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>14. Dispute Resolution & Governing Law</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">14</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        These Terms are governed by the laws of the <strong>Republic of Indonesia</strong>. Any dispute not resolved through negotiation within 30 days will be resolved exclusively through the courts of the Pengadilan Negeri Yogyakarta (Yogyakarta District Court).
                      </p>
                    </div>
                  </section>

                  <section id="changes-to-terms" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>15. Changes to These Terms</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">15</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        We may update these terms. Material adjustments will be notified to your registered email 30 days before taking effect.
                      </p>
                    </div>
                  </section>

                  <section id="contact-terms" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>16. Contact Information</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">16</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>For questions regarding these Terms, contact us at:</p>
                      <div className="border-l-2 border-[var(--lp-border-strong)] pl-4 text-[14.5px] space-y-1 mt-4">
                        <p className="font-bold text-gray-900">PT. Bantu Indonesia Technology (ZieAds)</p>
                        <p>📍 Omah Dongeng, Somodaran, Purwomartani, Kalasan, Sleman, Yogyakarta, Indonesia</p>
                        <p>✉️ Legal inquiries: legal@zieads.com</p>
                        <p>📞 Phone: +62 851 5762 6264</p>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section id="agreement" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>1. Persetujuan Ketentuan</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">01</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Ketentuan Layanan ini merupakan perjanjian yang mengikat secara hukum antara Anda dan <strong>PT. Bantu Indonesia Technology</strong>, sebuah perseroan terbatas Indonesia yang terdaftar di Yogyakarta, Indonesia, yang mengoperasikan platform ZieAds di <strong>zieads.com</strong>.
                      </p>
                      <p>
                        Dengan mengakses atau mendaftar di ZieAds, Anda setuju untuk mematuhi Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, Anda harus segera menghentikan penggunaan situs web kami.
                      </p>
                    </div>
                  </section>

                  <section id="description" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>2. Deskripsi Layanan</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">02</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>ZieAds adalah platform software-as-a-service (SaaS) yang menyediakan:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>Manajemen Media Sosial (v0.3):</strong> Penjadwalan, tampilan kalender visual, publikasi konten (Instagram, TikTok, LinkedIn), kotak masuk komentar terpadu, dan alat pemantauan pesaing.</li>
                        <li><strong>Lapisan Analis Pemasaran AI (v0.3):</strong> Ringkasan kinerja harian yang dihasilkan AI, peringatan anomali, optimalisasi waktu posting, dan analitik lintas saluran iklan berbayar + organik.</li>
                        <li><strong>Audit Iklan Berbayar (v0.2):</strong> Laporan audit kesiapan iklan web (skor 0-100), 10 cakupan analisis diagnosis mendalam, 15 perintah terminal slash, ekspor laporan white-label, dan eksekusi model berbasis kredit.</li>
                      </ul>
                    </div>
                  </section>

                  <section id="eligibility" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>3. Kelayakan & Akun Pendaftaran</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">03</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Anda harus berusia minimal 18 tahun untuk membuat akun di platform kami. Anda berkomitmen untuk memberikan detail pendaftaran yang akurat, mutakhir, dan lengkap. Anda bertanggung jawab untuk menjaga kerahasiaan kredensial login Anda dan memberi tahu kami di <strong>legal@zieads.com</strong> jika ada pelanggaran keamanan.
                      </p>
                    </div>
                  </section>

                  <section id="billing" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>4. Paket Berlangganan & Penagihan</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">04</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Kami menawarkan paket berlangganan berjenjang (Solo: $29/bulan, Pro: $89/bulan, Studio: $229/bulan) dan paket kredit yang diproses melalui Stripe. Langganan diperbarui secara otomatis kecuali dibatalkan. Kami menyediakan jaminan pengembalian dana 14 hari untuk pembelian pertama. Jika pembayaran gagal setelah 3 kali percobaan, kami akan menurunkan status akun ke tingkat Gratis. Harga belum termasuk PPN yang berlaku di Indonesia.
                      </p>
                    </div>
                  </section>

                  <section id="acceptable-use" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>5. Kebijakan Penggunaan Wajar</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">05</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Anda setuju untuk tidak menggunakan ZieAds untuk:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li>Memposting materi yang ilegal, memfitnah, cabul, atau mengancam.</li>
                        <li>Melakukan spamming atau mengirimkan promosi massal tanpa persetujuan.</li>
                        <li>Melanggar kebijakan pengembang Meta, TikTok, atau LinkedIn.</li>
                        <li>Mengikis konten database secara massal atau merekayasa balik algoritma.</li>
                      </ul>
                      <p>Pelanggar akan menghadapi penangguhan akun segera tanpa pengembalian dana.</p>
                    </div>
                  </section>

                  <section id="intellectual-property" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>6. Konten Pengguna & Kekayaan Intelektual</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">06</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Anda memegang kepemilikan penuh atas caption, aset media, dan berkas yang dibuat atau dijadwalkan melalui ZieAds. Anda memberi kami lisensi terbatas dan bebas royalti untuk menyimpan, memproses, dan mempublikasikan konten ini semata-mata untuk menyediakan layanan kami.
                      </p>
                      <p>
                        Semua kode sumber perangkat lunak, sistem tata letak, perintah AI, metrik skor audit, model basis data, dan merek dagang adalah milik eksklusif PT. Bantu Indonesia Technology.
                      </p>
                    </div>
                  </section>

                  <section id="compliance" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>7. Kepatuhan Platform Pihak Ketiga</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">07</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Anda mengakui bahwa ZieAds tidak berafiliasi dengan atau didukung oleh Meta, TikTok, atau LinkedIn. Anda harus mematuhi semua kebijakan pengembang pihak ketiga saat mempublikasikan konten melalui platform kami. Kami tidak bertanggung jawab atas penangguhan atau batasan akun yang diterapkan oleh jejaring sosial ini.
                      </p>
                    </div>
                  </section>

                  <section id="ai-disclaimer" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>8. Sanggahan Konten Buatan AI</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">08</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Caption, audit, ringkasan, dan saran disusun melalui API AI Claude Anthropic dan disediakan "sebagaimana adanya". Hasil tersebut merupakan saran dan bukan saran bisnis atau hukum profesional yang mengikat. Anda memiliki kendali penuh untuk memverifikasi dan menyunting saran tersebut.
                      </p>
                    </div>
                  </section>

                  <section id="availability" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>9. Ketersediaan & Modifikasi Layanan</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">09</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Kami mengusahakan ketersediaan layanan sebesar 99.5% tetapi tidak menjamin akses tanpa gangguan. Fitur dapat berubah atau dihentikan dengan pemberitahuan wajar. Kami tidak bertanggung jawab atas gangguan API platform pihak ketiga.
                      </p>
                    </div>
                  </section>

                  <section id="warranties" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>10. Sanggahan & Jaminan</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">10</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        ZIEADS DISEDIAKAN "SEBAGAIMANA ADANYA" DAN "SEBAGAIMANA TERSEDIA" TANPA JAMINAN APA PUN. KAMI MENOLAK SEMUA JAMINAN, BAIK TERSURAT MAUPUN TERSIRAT, TERMASUK KESESUAIAN UNTUK TUJUAN PEMASARAN SPESIFIK.
                      </p>
                    </div>
                  </section>

                  <section id="liability" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>11. Batasan Tanggung Jawab</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">11</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Sejauh diizinkan oleh hukum, PT. Bantu Indonesia Technology dan afiliasinya tidak akan bertanggung jawab atas kerugian tidak langsung, khusus, atau konsekuensial, hilangnya keuntungan, kebocoran data, atau kerugian anggaran pada kampanye iklan yang terhubung. Total tanggung jawab kami dibatasi sebesar jumlah yang Anda bayarkan ke ZieAds dalam 12 bulan sebelum klaim diajukan.
                      </p>
                    </div>
                  </section>

                  <section id="indemnity" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>12. Ganti Rugi</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">12</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Anda setuju untuk mengganti rugi dan membebaskan PT. Bantu Indonesia Technology dari tuntutan pihak ketiga, biaya hukum, atau kerugian yang timbul dari pelanggaran Anda terhadap Ketentuan ini atau persyaratan platform pihak ketiga.
                      </p>
                    </div>
                  </section>

                  <section id="termination" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>13. Pengakhiran Akun</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">13</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Anda dapat membatalkan langganan Anda kapan saja melalui dasbor kerja Anda. Kami berhak menangguhkan akses login bagi pengguna yang melanggar kebijakan penggunaan wajar kami.
                      </p>
                    </div>
                  </section>

                  <section id="dispute-resolution" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>14. Penyelesaian Sengketa & Hukum Republik Indonesia</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">14</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Ketentuan ini diatur oleh hukum <strong>Republik Indonesia</strong>. Setiap sengketa yang tidak dapat diselesaikan melalui negosiasi dalam waktu 30 hari akan diselesaikan secara eksklusif melalui Pengadilan Negeri Yogyakarta.
                      </p>
                    </div>
                  </section>

                  <section id="changes-to-terms" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>15. Perubahan Ketentuan Ini</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">15</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>
                        Kami dapat memperbarui ketentuan ini. Penyesuaian material akan diberitahukan ke email Anda yang terdaftar 30 hari sebelum diberlakukan.
                      </p>
                    </div>
                  </section>

                  <section id="contact-terms" className="scroll-mt-28">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between">
                      <span>16. Informasi Kontak</span>
                      <span className="text-xs text-[var(--lp-text-muted)] font-mono">16</span>
                    </h2>
                    <div className="text-[15px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                      <p>Untuk pertanyaan mengenai Ketentuan ini, hubungi kami di:</p>
                      <div className="border-l-2 border-[var(--lp-border-strong)] pl-4 text-[14.5px] space-y-1 mt-4">
                        <p className="font-bold text-gray-900">PT. Bantu Indonesia Technology (ZieAds)</p>
                        <p>📍 Omah Dongeng, Somodaran, Purwomartani, Kalasan, Sleman, Yogyakarta, Indonesia</p>
                        <p>✉️ Inquiries Hukum/Legal: legal@zieads.com</p>
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
