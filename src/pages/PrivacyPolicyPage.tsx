import { useState, useEffect } from 'react';
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
  Globe,
  Clock,
  Printer,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  User,
  Database,
  CreditCard,
  Sparkles
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Design Lineage (Extracted from Landing Page):
   - Typography: Font 'Geist', Headings 'Bricolage Grotesque' or 'General Sans'
   - Colors: Primary #09090B, Accent Gradient, Border #E4E4E7
   - Borders: Radius 8px (var(--radius)), Radius pill
   - Shadows: var(--shadow-sm), var(--shadow-md), var(--shadow-lg)
   ═══════════════════════════════════════════════════════ */

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'id'>('en');
  const [activeSection, setActiveSection] = useState('who-we-are');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [isTocMobileOpen, setIsTocMobileOpen] = useState(false);

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

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
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
          .print-card {
            border: 1px solid #ccc !important;
            break-inside: avoid !important;
            padding: 12px !important;
            margin-bottom: 10px !important;
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
                  <Shield size={12} className="text-[var(--lp-text-primary)]" />
                  Legal Document
                </div>
                <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-3xl sm:text-4xl md:text-[48px] font-extrabold text-[var(--lp-text-primary)] tracking-tight leading-none mb-3">
                  {lang === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
                </h1>
                <p className="text-[var(--lp-text-secondary)] text-sm sm:text-base max-w-xl leading-relaxed">
                  {lang === 'en' 
                    ? 'How PT. Bantu Indonesia Technology collects, uses, and protects your personal data when you use ZieAds.'
                    : 'Bagaimana PT. Bantu Indonesia Technology mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan ZieAds.'}
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
                <span><strong>Version:</strong> 1.0 (UU PDP & API Audited)</span>
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
                      style={{ textAlignment: 'left', border: 'none', background: 'none', padding: '6px 8px', fontSize: '0.8rem', color: activeSection === sec.id ? P : 'var(--text-secondary)', fontWeight: activeSection === sec.id ? 700 : 400, cursor: 'pointer', textAlign: 'left' }}
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
              <section id="who-we-are" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>1. {lang === 'en' ? 'Introduction & Who We Are' : 'Pendahuluan & Siapa Kami'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('who-we-are')}
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
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </section>

              {/* Section 2 */}
              <section id="info-collected" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>2. {lang === 'en' ? 'Information We Collect' : 'Informasi Yang Kami Kumpulkan'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('info-collected')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">02</span>
                  </div>
                </h2>
                
                {/* Visual Card Grid Treatment (TOC / cards showing categories) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    {
                      id: 'acc',
                      title: lang === 'en' ? 'A. Account Information' : 'A. Informasi Akun',
                      icon: <User size={16} />,
                      summary: lang === 'en' ? 'Basic profile inputs provided at sign up' : 'Profil dasar yang dimasukkan saat pendaftaran',
                      content: lang === 'en' 
                        ? ['First and last name', 'Email address and securely hashed password (bcrypt)', 'Business profile metadata (brand name, primary URL, niche)']
                        : ['Nama depan dan belakang', 'Alamat email dan kata sandi yang di-hash secara aman (bcrypt)', 'Metadata profil bisnis (nama brand, URL utama, kategori)']
                    },
                    {
                      id: 'v02',
                      title: lang === 'en' ? 'B. Marketing Audits Data (v0.2)' : 'B. Data Audit Pemasaran (v0.2)',
                      icon: <FileText size={16} />,
                      summary: lang === 'en' ? 'Analyses generated via AI audit prompts' : 'Analisis kesiapan iklan yang dihasilkan oleh mesin AI',
                      content: lang === 'en'
                        ? ['URLs of websites submitted for advertising audits', 'Generated audit scores (0-100 rating across 6 core dimensions)', 'AI Agent conversation logs and white-label PDF reports generated']
                        : ['URL situs web yang diserahkan untuk audit periklanan', 'Skor kesiapan iklan (skor 0-100 di 6 dimensi utama)', 'Log riwayat obrolan AI Agent dan laporan PDF hasil audit']
                    },
                    {
                      id: 'v03_org',
                      title: lang === 'en' ? 'C. Organic Social Media Channels (v0.3)' : 'C. Data Saluran Media Sosial Organik (v0.3)',
                      icon: <Globe size={16} />,
                      summary: lang === 'en' ? 'Metrics and assets via OAuth connections' : 'Metrik dan berkas yang terhubung via OAuth',
                      content: lang === 'en'
                        ? ['Instagram profile stats, follower counts, and post engagement insights', 'TikTok creator statistics and video list metrics', 'LinkedIn member profile details and updates sent via Composer']
                        : ['Statistik profil Instagram, jumlah pengikut, dan metrik keterlibatan konten', 'Statistik kreator TikTok dan daftar video beserta kinerjanya', 'Detail profil LinkedIn dan postingan yang dikirim melalui Composer']
                    },
                    {
                      id: 'v03_paid',
                      title: lang === 'en' ? 'D. Paid Advertising Statistics (v0.3)' : 'D. Statistik Iklan Berbayar (v0.3)',
                      icon: <TrendingUp size={16} />,
                      summary: lang === 'en' ? 'Performance metrics via CSV spreadsheet uploads' : 'Metrik kinerja dari unggahan berkas CSV',
                      content: lang === 'en'
                        ? ['Campaign performance rows containing spend, impressions, CTR, conversions', 'Anonymized benchmark records used to generate briefings']
                        : ['Baris kinerja kampanye berisi pengeluaran, tayangan, CTR, dan konversi', 'Catatan tolok ukur anonim yang dianalisis untuk ringkasan harian']
                    },
                    {
                      id: 'ai_an',
                      title: lang === 'en' ? 'E. AI Analyst Daily Metrics' : 'E. Data Kinerja AI Analyst',
                      icon: <Sparkles size={16} />,
                      summary: lang === 'en' ? 'Wants and actions compiled by AI models' : 'Rekomendasi taktis yang disusun oleh model AI',
                      content: lang === 'en'
                        ? ['Wins identified, anomaly alerts, and actions history', 'Platform timing indices for calendar posts']
                        : ['Wawasan kemenangan, pemberitahuan anomali, dan riwayat tindakan rekomendasi', 'Indeks waktu publikasi konten terbaik untuk kalender']
                    },
                    {
                      id: 'tech',
                      title: lang === 'en' ? 'F. Technical & Usage Logs' : 'F. Data Teknis & Penggunaan',
                      icon: <Database size={16} />,
                      summary: lang === 'en' ? 'Security diagnostics and system events' : 'Log diagnostik sistem dan peristiwa keamanan',
                      content: lang === 'en'
                        ? ['IP addresses, browser client configurations, OS, and timestamped actions', 'Performance tracking stats and error crash logs']
                        : ['Alamat IP, tipe peramban, OS, dan waktu aksi penggunaan', 'Statistik pelacakan kinerja halaman dan log kesalahan crash']
                    },
                    {
                      id: 'pay',
                      title: lang === 'en' ? 'G. Payment Transaction Data' : 'G. Catatan Pembayaran & Transaksi',
                      icon: <CreditCard size={16} />,
                      summary: lang === 'en' ? 'Subscription levels managed via Stripe' : 'Tingkat langganan yang dikelola oleh Stripe',
                      content: lang === 'en'
                        ? ['Customer ID, subscription statuses, and invoice records', 'Card number last 4 digits (full card info goes direct to Stripe)']
                        : ['ID pelanggan, status langganan, dan catatan transaksi faktur', '4 digit terakhir nomor kartu (detail kartu lengkap langsung dikirim ke Stripe)']
                    }
                  ].map(card => {
                    const isExpanded = expandedCards[card.id];
                    return (
                      <div 
                        key={card.id}
                        className="print-card"
                        style={{ 
                          background: '#fff', 
                          border: '1px solid var(--border)', 
                          borderRadius: 8, 
                          padding: 16,
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onClick={() => toggleCard(card.id)}
                      >
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P }}>
                              {card.icon}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{card.title}</h4>
                              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.summary}</p>
                            </div>
                          </div>
                          <div className="no-print">
                            {isExpanded ? <ChevronUp size={16} style={{ color: G }} /> : <ChevronDown size={16} style={{ color: G }} />}
                          </div>
                        </div>

                        {/* Expandable bullets */}
                        {(isExpanded || window.matchMedia('(max-width: 768px)').matches || window.location.href.includes('print')) && (
                          <div style={{ marginTop: 12, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                            <ul style={{ paddingLeft: 16, margin: 0, listStyleType: 'disc', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {card.content.map((bullet, idx) => (
                                <li key={idx}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-xs sm:text-sm text-[var(--lp-text-secondary)] leading-relaxed">
                  {lang === 'en' ? (
                    <p>
                      <strong>Our Promise:</strong> We collect only the data necessary to provide our optimization services. We do not sell your personal data, nor do we share audit scopes with competitor clients.
                    </p>
                  ) : (
                    <p>
                      <strong>Komitmen Kami:</strong> Kami hanya mengumpulkan data yang mutlak diperlukan untuk menyediakan layanan optimasi kami. Kami tidak menjual data Anda, dan kami tidak membagikan cakupan audit Anda kepada kompetitor.
                    </p>
                  )}
                </div>
              </section>

              {/* Section 3 */}
              <section id="how-we-use" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>3. {lang === 'en' ? 'How We Use Your Information' : 'Bagaimana Kami Menggunakan Informasi'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('how-we-use')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">03</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  {lang === 'en' ? (
                    <>
                      <p>We process your data to fulfill our contract with you, specifically to:</p>
                      <ul className="space-y-3.5 pl-1">
                        {[
                          "Authenticate accounts and secure your dashboard workspace.",
                          "Enable scheduling, publishing, and unified commenting pipelines.",
                          "Compile daily AI briefings, post timing windows, and competitor benchmarks.",
                          "Deliver transactional system emails (e.g. system warnings, notifications, receipts).",
                          "Generate PDF audit files and perform ROAS audits."
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 size={16} className="text-zinc-900 shrink-0 mt-1" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <p><strong>Negative Disclosures:</strong> We do not publish your content to platforms you have not explicitly authorized. We do not share your engagement metrics with third-party advertising networks.</p>
                    </>
                  ) : (
                    <>
                      <p>Kami memproses data Anda untuk memenuhi kontrak kami dengan Anda, khususnya untuk:</p>
                      <ul className="space-y-3.5 pl-1">
                        {[
                          "Mengautentikasi akun dan mengamankan dasbor kerja Anda.",
                          "Mengaktifkan penjadwalan, publikasi, dan alur komentar terpadu.",
                          "Menyusun ringkasan AI harian, waktu posting terbaik, dan tolok ukur pesaing.",
                          "Mengirimkan email sistem transaksional (seperti peringatan sistem, pemberitahuan, kuitansi).",
                          "Menghasilkan berkas audit PDF dan melakukan audit ROAS."
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 size={16} className="text-zinc-900 shrink-0 mt-1" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <p><strong>Pengungkapan Negatif:</strong> Kami tidak akan mempublikasikan konten Anda ke platform yang tidak Anda setujui secara eksplisit. Kami tidak membagikan metrik keterlibatan Anda dengan jaringan iklan pihak ketiga.</p>
                    </>
                  )}
                </div>
              </section>

              {/* Section 4 */}
              <section id="legal-basis" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>4. {lang === 'en' ? 'Legal Basis for Processing' : 'Dasar Hukum Pemrosesan'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('legal-basis')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">04</span>
                  </div>
                </h2>
                <div className="text-[15.5px] text-[var(--lp-text-secondary)] leading-relaxed space-y-4">
                  {lang === 'en' ? (
                    <>
                      <p>We process data based on the following grounds:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>UU PDP Article 20:</strong> Processing is based on explicit consent, contract performance, legitimate interests (security and product improvement), and statutory compliance.</li>
                        <li><strong>GDPR Article 6:</strong> Contractual necessity, user consent, and legitimate operations.</li>
                      </ul>
                      <p>Consent can be withdrawn at any time by disconnecting accounts or requesting deletion of your ZieAds account via email.</p>
                    </>
                  ) : (
                    <>
                      <p>Kami memproses data berdasarkan dasar hukum berikut:</p>
                      <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>UU PDP Pasal 20:</strong> Pemrosesan didasarkan pada persetujuan eksplisit, pelaksanaan kontrak, kepentingan sah (keamanan dan peningkatan produk), dan kepatuhan hukum.</li>
                        <li><strong>GDPR Pasal 6:</strong> Kebutuhan kontraktual, persetujuan pengguna, dan operasi yang sah.</li>
                      </ul>
                      <p>Persetujuan dapat ditarik kapan saja dengan memutuskan hubungan akun atau meminta penghapusan akun ZieAds Anda melalui email.</p>
                    </>
                  )}
                </div>
              </section>

              {/* Section 5 */}
              <section id="subprocessors" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>5. {lang === 'en' ? 'Third-Party Services & Sub-processors' : 'Layanan Pihak Ketiga & Sub-prosesor'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('subprocessors')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">05</span>
                  </div>
                </h2>
                
                {/* Table for sub-processors */}
                <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-soft)' }}>
                        <th style={{ padding: 12 }}>Name</th>
                        <th style={{ padding: 12 }}>Location</th>
                        <th style={{ padding: 12 }}>Purpose</th>
                        <th style={{ padding: 12 }}>Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12 }}><strong>Anthropic, PBC</strong></td>
                        <td style={{ padding: 12 }}>USA</td>
                        <td style={{ padding: 12 }}>AI API for daily briefings, competitor analysis, chat context</td>
                        <td style={{ padding: 12 }}><a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer" className="text-zinc-950 underline flex items-center gap-1">Privacy <ExternalLink size={10} /></a></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12 }}><strong>Stripe, Inc.</strong></td>
                        <td style={{ padding: 12 }}>USA</td>
                        <td style={{ padding: 12 }}>Secure payment billing processes</td>
                        <td style={{ padding: 12 }}><a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" className="text-zinc-950 underline flex items-center gap-1">Privacy <ExternalLink size={10} /></a></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12 }}><strong>Supabase, Inc.</strong></td>
                        <td style={{ padding: 12 }}>USA / Global</td>
                        <td style={{ padding: 12 }}>Database storage, encrypted profiles, OAuth token vaults</td>
                        <td style={{ padding: 12 }}><a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-zinc-950 underline flex items-center gap-1">Privacy <ExternalLink size={10} /></a></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12 }}><strong>Vercel, Inc.</strong></td>
                        <td style={{ padding: 12 }}>USA / Global</td>
                        <td style={{ padding: 12 }}>Cloud hosting deployment platforms</td>
                        <td style={{ padding: 12 }}><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="text-zinc-950 underline flex items-center gap-1">Privacy <ExternalLink size={10} /></a></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 6 */}
              <section id="social-integrations" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>6. {lang === 'en' ? 'Social Media API Integrations' : 'Integrasi API Media Sosial'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('social-integrations')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">06</span>
                  </div>
                </h2>
                
                {/* 3 Platforms Branded Scopes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#E1306C' }}>Instagram (Meta Platforms, Inc.)</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {lang === 'en' 
                        ? 'We request authorized scopes to read credentials, metrics, and manage automated posting scheduling:' 
                        : 'Kami meminta otorisasi scope untuk membaca metrik kinerja dan mengelola penjadwalan postingan otomatis:'}
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
                          <th style={{ padding: 8 }}>Scope</th>
                          <th style={{ padding: 8 }}>Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 8 }}><code>instagram_business_basic</code></td>
                          <td style={{ padding: 8 }}>Retrieve creator handle, follower count, and channel profile ID.</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 8 }}><code>instagram_business_manage_insights</code></td>
                          <td style={{ padding: 8 }}>Retrieve post reach, impressions, likes, and engagement percentages.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 8 }}><code>instagram_business_content_publish</code></td>
                          <td style={{ padding: 8 }}>Auto-publish post contents scheduled by the user in calendar dashboard.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#000000' }}>TikTok (TikTok Pte. Ltd.)</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {lang === 'en'
                        ? 'We integrate with the following authorized scopes to publish calendar updates:'
                        : 'Kami berintegrasi dengan scope terotorisasi berikut untuk mempublikasikan video kalender:'}
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
                          <th style={{ padding: 8 }}>Scope</th>
                          <th style={{ padding: 8 }}>Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 8 }}><code>user.info.basic</code>, <code>user.info.profile</code></td>
                          <td style={{ padding: 8 }}>Retrieve creator handle, profile name, and display avatars.</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 8 }}><code>user.info.stats</code>, <code>video.list</code></td>
                          <td style={{ padding: 8 }}>Track follow counts, post views, likes, and total video metrics.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 8 }}><code>video.publish</code></td>
                          <td style={{ padding: 8 }}>Auto-publish scheduled video contents. Fully displays branded content checks.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#0077B5' }}>LinkedIn (LinkedIn Corporation)</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {lang === 'en'
                        ? 'We fetch profiles and publish personal updates through standard OAuth:'
                        : 'Kami mengambil profil dan menerbitkan pembaruan status personal melalui OAuth standar:'}
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
                          <th style={{ padding: 8 }}>Scope</th>
                          <th style={{ padding: 8 }}>Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 8 }}><code>openid</code>, <code>profile</code>, <code>email</code></td>
                          <td style={{ padding: 8 }}>Allow sign in and basic profile matching.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 8 }}><code>w_member_social</code></td>
                          <td style={{ padding: 8 }}>Publish text/media updates directly to personal LinkedIn member feed.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section id="ai-disclosure" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>7. {lang === 'en' ? 'AI Processing Disclosure' : 'Pengungkapan Pemrosesan AI'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('ai-disclosure')}
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
                      ? "ZieAds utilizes artificial intelligence models powered by Anthropic's Claude API to generate daily briefings and audit summaries. Your metrics and data are processed through safe API channels. Per Anthropic's API policy, your content is not stored permanently or used to train public LLM structures. AI reports are suggestions; you retain full control over editing and publishing."
                      : "ZieAds menggunakan model kecerdasan buatan (AI) yang didukung oleh API Claude Anthropic untuk menghasilkan ringkasan harian dan laporan audit. Metrik dan data Anda diproses melalui saluran API yang aman. Sesuai dengan kebijakan API Anthropic, konten Anda tidak disimpan secara permanen atau digunakan untuk melatih struktur LLM publik. Laporan AI bersifat saran; Anda tetap memiliki kendali penuh atas penyuntingan dan publikasi."}
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="retention" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>8. {lang === 'en' ? 'Data Retention & Deletion' : 'Retensi & Penghapusan Data'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('retention')}
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
                      ? 'We retain your personal data only as long as necessary to provide the services or satisfy legal obligations. Deletion retention periods are mapped as follows:'
                      : 'Kami menyimpan data pribadi Anda hanya selama diperlukan untuk menyediakan layanan kami atau memenuhi kewajiban hukum. Rincian retensi data kami adalah sebagai berikut:'}
                  </p>
                  
                  {/* Retention Table */}
                  <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-soft)' }}>
                          <th style={{ padding: 10 }}>Data Category</th>
                          <th style={{ padding: 10 }}>Retention Duration</th>
                          <th style={{ padding: 10 }}>Deletion Trigger</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 10 }}><strong>Account Details & Profile</strong></td>
                          <td style={{ padding: 10 }}>Life of subscription + 90 days</td>
                          <td style={{ padding: 10 }}>Account deletion request or billing cancellation</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 10 }}><strong>OAuth Tokens (Meta/TikTok/LinkedIn)</strong></td>
                          <td style={{ padding: 10 }}>Immediate deletion</td>
                          <td style={{ padding: 10 }}>Channel disconnected or account deleted</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 10 }}><strong>Paid Ads CSV Files Data</strong></td>
                          <td style={{ padding: 10 }}>Life of subscription + 90 days</td>
                          <td style={{ padding: 10 }}>Account deletion</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 10 }}><strong>Daily Briefings & AI Audits</strong></td>
                          <td style={{ padding: 10 }}>Life of subscription + 90 days</td>
                          <td style={{ padding: 10 }}>Account deletion</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10 }}><strong>Payment invoices / metadata</strong></td>
                          <td style={{ padding: 10 }}>10 years (Indonesian Tax Law)</td>
                          <td style={{ padding: 10 }}>Statutory audit completion</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Section 9 */}
              <section id="your-rights" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>9. {lang === 'en' ? 'Your Rights & Frameworks' : 'Hak-Hak Anda & Kerangka Hukum'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('your-rights')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">09</span>
                  </div>
                </h2>
                
                {/* Rights Grid Callout box */}
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    { t: lang === 'en' ? 'Right to Access' : 'Hak untuk Mengakses', d: lang === 'en' ? 'Obtain a full copy of all stored profile records and metrics.' : 'Mendapatkan salinan lengkap dari seluruh data profil dan metrik Anda.' },
                    { t: lang === 'en' ? 'Right to Delete' : 'Hak untuk Menghapus', d: lang === 'en' ? 'Scrub all account identifiers from databases permanently (within 30 days).' : 'Menghapus identitas akun dari basis data secara permanen (dalam 30 hari).' },
                    { t: lang === 'en' ? 'Right to Correct' : 'Hak untuk Memperbaiki', d: lang === 'en' ? 'Correct any errors in name, email, or company metadata fields.' : 'Memperbaiki kesalahan input nama, email, atau bidang profil bisnis.' },
                    { t: lang === 'en' ? 'Right to Portability' : 'Hak untuk Portabilitas', d: lang === 'en' ? 'Export data rows in standard structured JSON formats.' : 'Mengekspor baris data dalam format terstruktur (JSON).' }
                  ].map((right, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                      <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700 }}>{right.t}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{right.d}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-xs sm:text-sm text-[var(--lp-text-secondary)]">
                  {lang === 'en' ? (
                    <p>
                      <strong>How to exercise:</strong> Email your request directly to <a href="mailto:privacy@zieads.com" className="text-zinc-950 font-bold underline">privacy@zieads.com</a>. We require identity verification to prevent fraudulent requests and resolve all queries within 30 days.
                    </p>
                  ) : (
                    <p>
                      <strong>Cara mengajukan:</strong> Kirimkan permintaan Anda ke <a href="mailto:privacy@zieads.com" className="text-zinc-950 font-bold underline">privacy@zieads.com</a>. Kami memerlukan verifikasi identitas untuk mencegah penipuan dan menyelesaikan semua permohonan dalam waktu 30 hari.
                    </p>
                  )}
                </div>
              </section>

              {/* Section 10 */}
              <section id="transfers" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>10. {lang === 'en' ? 'International Data Transfers' : 'Transfer Data Internasional'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('transfers')}
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
                      ? "Since PT. Bantu Indonesia Technology is based in Indonesia, your data will be hosted locally and in global server nodes operated by Cloud providers (Vercel/Supabase). Trans-border transfers satisfy safeguards listed under UU PDP Article 56, utilizing strict encryption in transit."
                      : "Karena PT. Bantu Indonesia Technology berbasis di Indonesia, data Anda akan disimpan secara lokal serta di simpul server global yang dioperasikan oleh penyedia Cloud (Vercel/Supabase). Transfer lintas batas mematuhi ketentuan UU PDP Pasal 56, menggunakan enkripsi transit yang ketat."}
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="security" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>11. {lang === 'en' ? 'Data Security Measures' : 'Tindakan Keamanan Data'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('security')}
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
                      ? 'We enforce AES-256 standard encryption for OAuth tokens, passwords (hashed), and sensitive campaign metrics. Database systems run Row-Level Security (RLS) policies to prevent cross-account leaks.'
                      : 'Kami menerapkan standar enkripsi AES-256 untuk token OAuth, kata sandi (di-hash), dan metrik kampanye yang sensitif. Sistem basis data menjalankan kebijakan Row-Level Security (RLS) untuk mencegah kebocoran lintas akun.'}
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section id="cookies" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>12. {lang === 'en' ? 'Cookies & Tracking' : 'Cookie & Pelacakan'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('cookies')}
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
                      ? 'We use session cookies for dashboard authentication, timezone preferences, and product statistics (PostHog). We do not share tracking configurations with third-party advertisers.'
                      : 'Kami menggunakan cookie sesi untuk autentikasi dasbor, preferensi zona waktu, dan statistik produk (PostHog). Kami tidak membagikan konfigurasi pelacakan dengan pengiklan pihak ketiga.'}
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section id="children" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>13. {lang === 'en' ? 'Children\'s Privacy' : 'Privasi Anak-Anak'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('children')}
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
                      ? 'ZieAds is meant for business professionals. Under UU PDP Article 25, parents hold processing rights. If a minor below 18 is registered, contact us and we will delete the account immediately.'
                      : 'ZieAds ditujukan untuk profesional bisnis. Berdasarkan UU PDP Pasal 25, pemrosesan data anak memerlukan persetujuan orang tua. Jika anak di bawah 18 tahun terdaftar, hubungi kami dan kami akan segera menghapus akun tersebut.'}
                  </p>
                </div>
              </section>

              {/* Section 14 */}
              <section id="breach-notif" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>14. {lang === 'en' ? 'Data Breach Notification' : 'Pemberitahuan Kebocoran Data'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('breach-notif')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">14</span>
                  </div>
                </h2>
                
                {/* Data Breach Response callout box */}
                <div style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444', borderRadius: '0 8px 8px 0', padding: 20, marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 800, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={15} /> 72-Hour Response Window
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#991B1B', lineHeight: 1.5 }}>
                    {lang === 'en'
                      ? 'In the event of a security breach affecting your records, we notify you and current Indonesian telecommunication regulators (Komdigi/Lembaga PDP) within 72 hours under UU PDP Article 46.'
                      : 'Jika terjadi kebocoran keamanan yang memengaruhi catatan Anda, kami akan memberi tahu Anda dan regulator komunikasi Indonesia (Komdigi/Lembaga PDP) dalam waktu 72 jam berdasarkan ketentuan UU PDP Pasal 46.'}
                  </p>
                </div>
              </section>

              {/* Section 15 */}
              <section id="changes" style={{ scrollMarginTop: 110, marginBottom: 80 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>15. {lang === 'en' ? 'Changes to This Policy' : 'Perubahan Kebijakan Ini'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('changes')}
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
                      ? 'We may update this policy. Material adjustments will be notified to your registered email 30 days before taking effect.'
                      : 'Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Penyesuaian material akan diberitahukan ke email Anda yang terdaftar 30 hari sebelum diberlakukan.'}
                  </p>
                </div>
              </section>

              {/* Section 16 */}
              <section id="contact" style={{ scrollMarginTop: 110, marginBottom: 40 }}>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[var(--lp-text-primary)] mb-5 border-b border-[var(--lp-border-subtle)] pb-3 flex items-center justify-between group">
                  <span>16. {lang === 'en' ? 'Contact Information' : 'Informasi Kontak'}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopyLink('contact')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded no-print"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} className="text-zinc-400 hover:text-zinc-950" />
                    </button>
                    <span className="text-xs text-[var(--lp-text-muted)] font-mono">16</span>
                  </div>
                </h2>
                
                {/* Hero-style Contact Information Card */}
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
                      ✉️ <span><strong>Privacy Inquiries:</strong> privacy@zieads.com</span>
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
