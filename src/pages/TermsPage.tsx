import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { 
  Scale, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Globe,
  Clock,
  Printer,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Building,
  CreditCard,
  ShieldAlert
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Design Lineage (Extracted from Landing Page):
   - Typography: Font 'Geist', Headings 'Bricolage Grotesque' or 'General Sans'
   - Colors: Primary #09090B, Accent Gradient, Border #E4E4E7
   - Borders: Radius 8px (var(--radius)), Radius pill
   - Shadows: var(--shadow-sm), var(--shadow-md), var(--shadow-lg)
   ═══════════════════════════════════════════════════════ */

export default function TermsPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const [activeSection, setActiveSection] = useState('agreement');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTocMobileOpen, setIsTocMobileOpen] = useState(false);

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
      { id: 'dispute-resolution', title: '14. Penyelesaian Sengketa & Hukum RI' },
      { id: 'changes-to-terms', title: '15. Perubahan Ketentuan Ini' },
      { id: 'contact-terms', title: '16. Informasi Kontak' }
    ]
  };

  useEffect(() => {
    const handleScroll = () => {
      // Calculate Scroll Progress
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      // Show/Hide back-to-top button
      setShowScrollTop(window.scrollY > 400);

      // TOC active item tracking
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
      setIsTocMobileOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyLink = (sectionId: string) => {
    const link = `${window.location.origin}${window.location.pathname}#${sectionId}`;
    navigator.clipboard.writeText(link).then(() => {
      triggerToast(lang === 'en' ? 'Section link copied to clipboard!' : 'Tautan bagian berhasil disalin!');
    });
  };

  const handleLangSwitch = (newLang: 'en' | 'id') => {
    setLang(newLang);
    if (activeSection) {
      setTimeout(() => {
        scrollToSection(activeSection);
      }, 80);
    }
  };

  return (
    <div className="landing-page min-h-screen antialiased bg-white text-[#09090B]">
      <style>{`
        @media print {
          nav, aside, footer, .back-to-top, .print-btn, .lang-switcher, .toc-btn, .progress-bar-container, .no-print {
            display: none !important;
          }
          .main-content-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt !important;
            line-height: 1.6 !important;
          }
          h2 {
            page-break-before: always;
            border-bottom: 1.5px solid #000 !important;
            padding-bottom: 8px !important;
          }
        }
      `}</style>

      {/* Progress Bar */}
      <div className="progress-bar-container" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.06)', zIndex: 1010 }}>
        <div style={{ width: `${scrollProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.1s' }} />
      </div>

      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="lp-line-top"></div>
      
      {/* NAVBAR */}
      <nav className="navbar" style={{ top: 3 }}>
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
        
        {/* Page Hero Section */}
        <section className="bg-[var(--lp-bg-inset)] border-b border-[var(--lp-border-subtle)] py-12 md:py-20 px-6 relative">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--lp-bg-canvas-alt)] border border-[var(--lp-border-default)] text-[var(--lp-text-secondary)] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider mb-4">
                  <Scale size={12} className="text-[var(--lp-text-primary)]" />
                  Terms & Agreements
                </div>
                <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-3xl sm:text-4xl md:text-[48px] font-extrabold text-[var(--lp-text-primary)] tracking-tight leading-none mb-3">
                  {lang === 'en' ? 'Terms of Service' : 'Ketentuan Layanan'}
                </h1>
                <p className="text-[var(--lp-text-secondary)] text-sm sm:text-base max-w-xl leading-relaxed">
                  {lang === 'en' 
                    ? 'The agreement governing your use of ZieAds, operated by PT. Bantu Indonesia Technology.'
                    : 'Persetujuan hukum yang mengatur penggunaan ZieAds Anda, dioperasikan oleh PT. Bantu Indonesia Technology.'}
                </p>
              </div>
              
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-full self-start md:self-center shadow-sm lang-switcher">
                <Globe size={13} className="text-zinc-500 ml-2.5 mr-1" />
                <button 
                  onClick={() => handleLangSwitch('en')}
                  style={{
                    border: 'none',
                    background: lang === 'en' ? '#09090B' : 'transparent',
                    color: lang === 'en' ? '#fff' : '#52525B',
                    padding: '6px 14px',
                    borderRadius: 99,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  EN
                </button>
                <button 
                  onClick={() => handleLangSwitch('id')}
                  style={{
                    border: 'none',
                    background: lang === 'id' ? '#09090B' : 'transparent',
                    color: lang === 'id' ? '#fff' : '#52525B',
                    padding: '6px 14px',
                    borderRadius: 99,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  ID
                </button>
              </div>
            </div>

            {/* Metadata strip */}
            <div className="border-t border-zinc-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[var(--lp-text-secondary)]">
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                <span><strong>Effective Date:</strong> June 30, 2026</span>
                <span className="hidden sm:inline text-zinc-300">|</span>
                <span><strong>Last Updated:</strong> June 30, 2026</span>
                <span className="hidden sm:inline text-zinc-300">|</span>
                <span><strong>Version:</strong> 1.0 (Official Agreement)</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 print-btn">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded text-zinc-650 font-mono">
                  <Clock size={12} /> ~15 min read
                </span>
                <button 
                  onClick={() => window.print()}
                  style={{ background: '#fff', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: 4, padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Printer size={12} /> {lang === 'en' ? 'Print / PDF' : 'Cetak / PDF'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <section className="max-w-6xl mx-auto px-6 py-12 md:py-16 relative">
          <div className="flex flex-col lg:flex-row gap-12 items-start relative">
            
            {/* TOC Desktop Sidebar */}
            <aside className="lg:sticky lg:top-28 w-full lg:w-72 shrink-0 pr-4 pb-6 border-b lg:border-b-0 lg:border-r border-[var(--lp-border-subtle)] hidden lg:block self-start max-h-[calc(100vh-140px)] overflow-y-auto">
              <div className="text-[10px] font-bold text-[var(--lp-text-muted)] uppercase tracking-wider mb-4 font-mono">
                {lang === 'en' ? 'Document Sections' : 'Daftar Bagian'}
              </div>
              <ul className="space-y-1">
                {sections[lang].map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left py-2 px-3 text-[13px] transition-all font-medium border-l-2 ${
                        activeSection === sec.id
                          ? 'border-[var(--lp-text-primary)] text-[var(--lp-text-primary)] font-bold pl-4'
                          : 'border-transparent text-[var(--lp-text-secondary)] hover:text-[var(--lp-text-primary)] pl-4'
                      }`}
                      style={{ borderRadius: '0px', background: 'transparent', cursor: 'pointer' }}
                    >
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Mobile TOC accordion */}
            <div className="w-full lg:hidden no-print" style={{ marginBottom: 20 }}>
              <button 
                onClick={() => setIsTocMobileOpen(!isTocMobileOpen)}
                style={{ width: '100%', background: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <span>📖 {lang === 'en' ? 'Table of Contents' : 'Daftar Isi'}</span>
                {isTocMobileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isTocMobileOpen && (
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {sections[lang].map((sec) => (
                    <button 
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      style={{ textAlignment: 'left', border: 'none', background: 'none', padding: '6px 8px', fontSize: '0.8rem', color: activeSection === sec.id ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeSection === sec.id ? 700 : 400, cursor: 'pointer', textAlign: 'left' }}
                    >
                      {sec.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Content Body */}
            <div className="flex-1 max-w-3xl main-content-container" style={{ margin: '0 auto' }}>
              
              {/* Section 1 */}
              <section id="agreement" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>1. {lang === 'en' ? 'Agreement to Terms' : 'Persetujuan Ketentuan'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('agreement')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">01</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-[1.65] space-y-4">
                  {lang === 'en' ? (
                    <>
                      <p>
                        These Terms of Service constitute a legally binding agreement between you and <strong>PT. Bantu Indonesia Technology</strong>, an Indonesian limited liability company registered in Yogyakarta, Indonesia, operating the ZieAds platform at <strong>zieads.com</strong>.
                      </p>
                      <p>
                        By accessing or registering for ZieAds, you agree to follow these Terms. If you do not accept these provisions, you must stop using the website immediately.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Ketentuan Layanan ini merupakan perjanjian yang mengikat secara hukum antara Anda dan <strong>PT. Bantu Indonesia Technology</strong>, sebuah perseroan terbatas Indonesia yang terdaftar di Yogyakarta, Indonesia, yang mengoperasikan platform ZieAds di <strong>zieads.com</strong>.
                      </p>
                      <p>
                        Dengan mengakses atau mendaftar di ZieAds, Anda setuju untuk mematuhi Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, Anda harus segera menghentikan penggunaan situs web kami.
                      </p>
                    </>
                  )}
                </div>
              </section>

              {/* Section 2 */}
              <section id="description" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>2. {lang === 'en' ? 'Description of Service' : 'Deskripsi Layanan'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('description')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">02</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  {lang === 'en' ? (
                    <>
                      <p>ZieAds is a software-as-a-service (SaaS) platform that provides:</p>
                      <ul className="space-y-3.5 pl-1">
                        <li className="flex items-start gap-3">
                          <CheckCircle2 size={16} className="text-zinc-900 shrink-0 mt-1" />
                          <span><strong>Social Media Management (v0.3):</strong> Scheduling, visual calendar views, content publishing pipeline (Instagram, TikTok, LinkedIn), unified comment inbox, and competitor monitoring tools.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle2 size={16} className="text-zinc-900 shrink-0 mt-1" />
                          <span><strong>AI Marketing Analyst Layer (v0.3):</strong> Daily AI-generated briefings, anomaly alerts, post timings optimization, and cross-channel paid ads + organic analytics.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle2 size={16} className="text-zinc-900 shrink-0 mt-1" />
                          <span><strong>Paid Advertising Audits (v0.2):</strong> Web audit report scores (0-100), 10 deep diagnosis analysis scopes, 15 terminal slash commands, white-label report exports, and credit-based model execution.</span>
                        </li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>ZieAds adalah platform software-as-a-service (SaaS) yang menyediakan:</p>
                      <ul className="space-y-3.5 pl-1">
                        <li className="flex items-start gap-3">
                          <CheckCircle2 size={16} className="text-zinc-900 shrink-0 mt-1" />
                          <span><strong>Manajemen Media Sosial (v0.3):</strong> Penjadwalan, tampilan kalender visual, publikasi konten (Instagram, TikTok, LinkedIn), kotak masuk komentar terpadu, dan alat pemantauan pesaing.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle2 size={16} className="text-zinc-900 shrink-0 mt-1" />
                          <span><strong>Lapisan Analis Pemasaran AI (v0.3):</strong> Ringkasan kinerja harian yang dihasilkan AI, peringatan anomali, optimalisasi waktu posting, dan analitik lintas saluran iklan berbayar + organik.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle2 size={16} className="text-zinc-900 shrink-0 mt-1" />
                          <span><strong>Audit Iklan Berbayar (v0.2):</strong> Laporan audit kesiapan iklan web (skor 0-100), 10 cakupan analisis diagnosis mendalam, 15 perintah terminal slash, ekspor laporan white-label, dan eksekusi model berbasis kredit.</span>
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              </section>

              {/* Section 3 */}
              <section id="eligibility" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>3. {lang === 'en' ? 'Eligibility & Account Registration' : 'Kelayakan & Akun Pendaftaran'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('eligibility')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">03</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'You must be at least 18 years of age to construct a profile on our platform. You commit to supplying true, current, and complete registration details. You are responsible for keeping your login credentials confidential and notify us at legal@zieads.com of any security breach.'
                      : 'Anda harus berusia minimal 18 tahun untuk membuat akun di platform kami. Anda berkomitmen untuk memberikan detail pendaftaran yang akurat, mutakhir, dan lengkap. Anda bertanggung jawab untuk menjaga kerahasiaan kredensial login Anda dan memberi tahu kami di legal@zieads.com jika ada pelanggaran keamanan.'}
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="billing" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>4. {lang === 'en' ? 'Subscription Plans & Billing' : 'Paket Berlangganan & Penagihan'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('billing')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">04</span>
                  </div>
                </h2>
                
                {/* Subscription Pricing matrix / details */}
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                  {[
                    { plan: 'Solo', price: '$29/mo', desc: lang === 'en' ? '1 Workspace, Basic scheduling & AI briefings.' : '1 Workspace, Penjadwalan dasar & Ringkasan AI.' },
                    { plan: 'Pro', price: '$89/mo', desc: lang === 'en' ? '5 Workspaces, Ad Audits, anomaly notifications.' : '5 Workspaces, Audit Iklan, Pemberitahuan anomali.' },
                    { plan: 'Studio', price: '$229/mo', desc: lang === 'en' ? 'Unlimited workspaces, Multi-user logins, White-label exports.' : 'Workspace tanpa batas, Login multi-pengguna, Ekspor PDF tanpa watermark.' }
                  ].map((card, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, textAlign: 'center', background: 'var(--bg-soft)' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>{card.plan}</h4>
                      <p style={{ margin: '6px 0', fontSize: '1.25rem', fontWeight: 800, color: P }}>{card.price}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{card.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-xs sm:text-sm text-[var(--lp-text-secondary)] leading-relaxed">
                  <p>
                    {lang === 'en'
                      ? 'Subscriptions renew automatically. You can cancel at any time via your account billing settings. We offer a 14-day money-back guarantee for first-time paid subscriptions.'
                      : 'Langganan diperbarui secara otomatis. Anda dapat membatalkannya kapan saja melalui pengaturan penagihan akun Anda. Kami menyediakan jaminan uang kembali 14 hari untuk langganan pertama Anda.'}
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="acceptable-use" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>5. {lang === 'en' ? 'Acceptable Use Policy' : 'Kebijakan Penggunaan Wajar'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('acceptable-use')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">05</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>{lang === 'en' ? 'You agree not to use ZieAds to:' : 'Anda setuju untuk tidak menggunakan ZieAds untuk:'}</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Posting illegal, defamatory, obscene, or threatening materials.</li>
                    <li>Spamming or sending unapproved promotional pitches.</li>
                    <li>Violating Meta, TikTok, or LinkedIn developer agreements.</li>
                    <li>Bulk scraping database content or reverse-engineering algorithms.</li>
                  </ul>
                  <p>Violators face immediate profile suspension without refunds.</p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="intellectual-property" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>6. {lang === 'en' ? 'User Content & Intellectual Property' : 'Konten Pengguna & Kekayaan Intelektual'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('intellectual-property')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">06</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  {lang === 'en' ? (
                    <>
                      <p>
                        You retain full ownership of captions, media assets, and files created or scheduled through ZieAds. You grant us a limited, royalty-free license to store, process, and publish this content solely to deliver our services.
                      </p>
                      <p>
                        All software source code, layout systems, AI prompts, audit scoring metrics, database models, and branding trademarks are the exclusive property of PT. Bantu Indonesia Technology.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Anda memegang kepemilikan penuh atas caption, aset media, dan berkas yang dibuat atau dijadwalkan melalui ZieAds. Anda memberi kami lisensi terbatas dan bebas royalti untuk menyimpan, memproses, dan mempublikasikan konten ini semata-mata untuk menyediakan layanan kami.
                      </p>
                      <p>
                        Semua kode sumber perangkat lunak, sistem tata letak, perintah AI, metrik skor audit, model basis data, dan merek dagang adalah milik eksklusif PT. Bantu Indonesia Technology.
                      </p>
                    </>
                  )}
                </div>
              </section>

              {/* Section 7 */}
              <section id="compliance" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>7. {lang === 'en' ? 'Third-Party Platform Compliance' : 'Kepatuhan Platform Pihak Ketiga'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('compliance')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">07</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'You acknowledge that ZieAds is not affiliated with or endorsed by Meta, TikTok, or LinkedIn. You must comply with all third-party developer policies when publishing content via our platform. We are not liable for account suspensions or restrictions applied by these networks.'
                      : 'Anda mengakui bahwa ZieAds tidak berafiliasi dengan atau didukung oleh Meta, TikTok, atau LinkedIn. Anda harus mematuhi semua kebijakan pengembang pihak ketiga saat mempublikasikan konten melalui platform kami. Kami tidak bertanggung jawab atas penangguhan atau batasan akun yang diterapkan oleh jejaring sosial ini.'}
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="ai-disclaimer" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>8. {lang === 'en' ? 'AI-Generated Content Disclaimer' : 'Sanggahan Konten Buatan AI'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('ai-disclaimer')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">08</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'Writers, audits, briefings, and suggestions are compiled through Anthropic\'s Claude AI API and are provided "as-is". They represent suggestions rather than binding professional business or legal advice. You maintain full control over verifying and editing suggestions.'
                      : 'Caption, audit, ringkasan, dan saran disusun melalui API AI Claude Anthropic dan disediakan "sebagaimana adanya". Hasil tersebut merupakan saran dan bukan saran bisnis atau hukum profesional yang mengikat. Anda memiliki kendali penuh untuk memverifikasi dan menyunting saran tersebut.'}
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="availability" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>9. {lang === 'en' ? 'Service Availability & Modifications' : 'Ketersediaan & Modifikasi Layanan'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('availability')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">09</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'We strive for a 99.5% uptime but do not guarantee uninterrupted access. Features may change or get deprecated with reasonable notice. We are not liable for third-party platform API outages.'
                      : 'Kami mengusahakan ketersediaan layanan sebesar 99.5% tetapi tidak menjamin akses tanpa gangguan. Fitur dapat berubah atau dihentikan dengan pemberitahuan wajar. Kami tidak bertanggung jawab atas gangguan API platform pihak ketiga.'}
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="warranties" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>10. {lang === 'en' ? 'Disclaimers & Warranties' : 'Sanggahan & Jaminan'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('warranties')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">10</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'ZIEADS IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING FIT FOR A PARTICULAR ADVERTISING GOAL.'
                      : 'ZIEADS DISEDIAKAN "SEBAGAIMANA ADANYA" DAN "SEBAGAIMANA TERSEDIA" TANPA JAMINAN APA PUN. KAMI MENOLAK SEMUA JAMINAN, BAIK TERSURAT MAUPUN TERSIRAT, TERMASUK KESESUAIAN UNTUK TUJUAN PEMASARAN SPESIFIK.'}
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="liability" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>11. {lang === 'en' ? 'Limitation of Liability' : 'Batasan Tanggung Jawab'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('liability')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">11</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'To the maximum extent permitted by law, PT. Bantu Indonesia Technology and its affiliates will not be liable for indirect, special, or consequential damages, loss of profits, data leaks, or budget losses on connected ad campaigns. Our total liability is capped at the amount paid by you to ZieAds in the 12 months preceding the claim.'
                      : 'Sejauh diizinkan oleh hukum, PT. Bantu Indonesia Technology dan afiliasinya tidak akan bertanggung jawab atas kerugian tidak langsung, khusus, atau konsekuensial, hilangnya keuntungan, kebocoran data, atau kerugian anggaran pada kampanye iklan yang terhubung. Total tanggung jawab kami dibatasi sebesar jumlah yang Anda bayarkan ke ZieAds dalam 12 bulan sebelum klaim diajukan.'}
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section id="indemnity" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>12. {lang === 'en' ? 'Indemnification' : 'Ganti Rugi'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('indemnity')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">12</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'You agree to indemnify and hold harmless PT. Bantu Indonesia Technology from any third-party claims, legal fees, or damages arising from your violation of these Terms or third-party platform conditions.'
                      : 'Anda setuju untuk mengganti rugi dan membebaskan PT. Bantu Indonesia Technology dari tuntutan pihak ketiga, biaya hukum, atau kerugian yang timbul dari pelanggaran Anda terhadap Ketentuan ini atau persyaratan platform pihak ketiga.'}
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section id="termination" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>13. {lang === 'en' ? 'Termination' : 'Pengakhiran Akun'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('termination')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">13</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'You can cancel subscription tiers at any time via your account workspace. We reserve the right to suspend login paths for users violating our acceptable usage policy.'
                      : 'Anda dapat membatalkan tingkat langganan Anda kapan saja melalui dasbor kerja Anda. Kami berhak menangguhkan akses masuk bagi pengguna yang melanggar kebijakan penggunaan wajar kami.'}
                  </p>
                </div>
              </section>

              {/* Section 14 */}
              <section id="dispute-resolution" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>14. {lang === 'en' ? 'Dispute Resolution & Governing Law' : 'Penyelesaian Sengketa & Hukum RI'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('dispute-resolution')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">14</span>
                  </div>
                </h2>
                
                {/* Court/Jurisdiction callout banner */}
                <div style={{ background: 'var(--primary-bg)', borderLeft: '4px solid var(--primary)', borderRadius: '0 8px 8px 0', padding: 20, marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 805, color: '#000', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={15} /> Yogyakarta District Court Jurisdiction
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {lang === 'en'
                      ? 'These Terms are governed by the laws of the Republic of Indonesia. Any dispute not resolved through negotiation within 30 days will be resolved exclusively through the courts of the Pengadilan Negeri Yogyakarta (Yogyakarta District Court).'
                      : 'Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang tidak dapat diselesaikan melalui negosiasi dalam waktu 30 hari akan diselesaikan secara eksklusif melalui Pengadilan Negeri Yogyakarta.'}
                  </p>
                </div>
              </section>

              {/* Section 15 */}
              <section id="changes-to-terms" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>15. {lang === 'en' ? 'Changes to These Terms' : 'Perubahan Ketentuan Ini'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('changes-to-terms')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">15</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  <p>
                    {lang === 'en'
                      ? 'We reserve the right to modify these Terms. Material changes will be communicated via email and in-app notice at least 14 days before taking effect. Continued use of ZieAds after the effective date constitutes your acceptance of the revised Terms.'
                      : 'Kami berhak mengubah Ketentuan ini. Perubahan material akan diberitahukan melalui email dan dasbor pemberitahuan 14 hari sebelum diberlakukan. Penggunaan berkelanjutan setelah tanggal tersebut merupakan persetujuan Anda.'}
                  </p>
                </div>
              </section>

              {/* Section 16 */}
              <section id="contact-terms" style={{ scrollMarginTop: 110, marginBottom: 40 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>16. {lang === 'en' ? 'Contact Information' : 'Informasi Kontak'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('contact-terms')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">16</span>
                  </div>
                </h2>
                
                {/* Hero-style Contact Card */}
                <div style={{ background: '#09090B', color: '#fff', borderRadius: 12, padding: '32px 40px', boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <ZieAdsLogo size={28} />
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>zieads</span>
                  </div>
                  
                  <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>PT. Bantu Indonesia Technology</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem', color: '#A1A1AA' }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      📍 <span>Omah Dongeng, Somodaran, Purwomartani, Kalasan, Sleman, Yogyakarta, Indonesia</span>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      ✉️ <span><strong>Legal:</strong> legal@zieads.com</span>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      📞 <span>+62 851 5762 6264</span>
                    </p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </section>

        {/* Floating Back to Top Button */}
        {showScrollTop && (
          <button 
            onClick={scrollToTop}
            className="back-to-top no-print"
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#09090B',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              transition: 'opacity 0.2s'
            }}
          >
            <ArrowUp size={16} />
          </button>
        )}

        {/* Dynamic Toast Alerts */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            background: '#09090B',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1010,
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 size={16} className="text-green-500" />
            {toastMessage}
          </div>
        )}

        {/* FOOTER */}
        <footer className="footer border-t border-[var(--lp-border-subtle)] mt-12">
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
