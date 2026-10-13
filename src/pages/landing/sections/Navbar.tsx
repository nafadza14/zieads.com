import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  
  ChevronDown,
  Inbox,
  PenLine,
  Search,
  
  X, BotMessageSquare } from 'lucide-react';
import ZIcon from '../../../components/icons/ZIcon';
import ZieAvatar from '../../../components/ZieAvatar';
import ZieAdsLogo from '../../../components/ZieAdsLogo';

const FEATURES = [
  { id: 'free-audit-try', icon: <Search size={18} />, title: 'Free website audit', desc: 'Score your ads readiness in 3 minutes' },
  { id: 'ai-analyst', icon: <ZIcon name="ai-analyst" size={18} />, title: 'AI Analyst', desc: 'A marketing briefing every morning' },
  { id: 'product-tour', icon: <BotMessageSquare size={18} />, title: 'AI Agent', desc: 'Ask anything, run 10 analysis modes' },
  { id: 'composer', icon: <PenLine size={18} />, title: 'Composer and Calendar', desc: 'Write once, schedule everywhere' },
  { id: 'analytics', icon: <BarChart3 size={18} />, title: 'Analytics', desc: 'Numbers that explain themselves' },
  { id: 'inbox', icon: <Inbox size={18} />, title: 'Inbox and Competitor Hunt', desc: 'Every comment, every rival, one place' },
];

const LINKS = [
  { id: 'product-tour', label: 'Product tour' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'stories', label: 'Customers' },
  { id: 'faq', label: 'FAQ' },
];

// Sections the scroll spy watches, in page order
const SPY = ['product-tour', 'free-audit-try', 'ai-analyst', 'composer', 'analytics', 'inbox', 'pricing', 'stories', 'faq'];
const FEATURE_IDS = new Set(FEATURES.map((f) => f.id).filter((id) => id !== 'product-tour'));

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>('');
  const closeTimer = useRef<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Jump to a section: smooth scroll on the landing page, or route home first
  const goTo = useCallback(
    (id: string) => {
      setMobileOpen(false);
      setFeaturesOpen(false);
      if (location.pathname !== '/') {
        navigate(`/#${id}`);
        return;
      }
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${id}`);
      }
    },
    [location.pathname, navigate],
  );

  // Solid navbar after scrolling + scroll spy
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const probe = window.innerHeight * 0.35;
      let current = '';
      for (const id of SPY) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on Escape or outside click
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFeaturesOpen(false);
        setMobileOpen(false);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setFeaturesOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, []);

  // Lock page scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const openFeatures = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setFeaturesOpen(true);
  };
  const closeFeaturesSoon = () => {
    closeTimer.current = window.setTimeout(() => setFeaturesOpen(false), 160);
  };

  const featuresActive = FEATURE_IDS.has(active);

  return (
    <>
    <nav className={`navbar zn-nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Main">
      <div className="nav-inner">
        <button className="nav-brand zn-brand" onClick={() => (location.pathname === '/' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/'))} aria-label="ZieAds home">
          <ZieAdsLogo size={28} />
          <span className="brand-name">zieads</span>
        </button>

        {/* Desktop links */}
        <div className="zn-links">
          <div className="zn-drop" ref={dropRef} onMouseEnter={openFeatures} onMouseLeave={closeFeaturesSoon}>
            <button
              className={`zn-link ${featuresActive ? 'is-active' : ''} ${featuresOpen ? 'is-open' : ''}`}
              aria-expanded={featuresOpen}
              aria-haspopup="true"
              onClick={() => setFeaturesOpen((o) => !o)}
            >
              Features <ChevronDown size={14} className="zn-chev" />
            </button>
            <div className={`zn-panel ${featuresOpen ? 'is-open' : ''}`} role="menu">
              <div className="zn-panel-grid">
                {FEATURES.map((f, i) => (
                  <button
                    key={f.title}
                    role="menuitem"
                    className={`zn-item ${active === f.id ? 'is-active' : ''}`}
                    style={{ transitionDelay: featuresOpen ? `${i * 30}ms` : '0ms' }}
                    onClick={() => goTo(f.id)}
                  >
                    <span className="zn-item-ico">{f.icon}</span>
                    <span>
                      <strong>{f.title}</strong>
                      <small>{f.desc}</small>
                    </span>
                  </button>
                ))}
              </div>
              <button className="zn-panel-foot" onClick={() => goTo('product-tour')}>
                <span>
                  <strong>See the real product</strong>
                  <small>Take the interactive tour of every screen</small>
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          {LINKS.map((l) => (
            <button key={l.id} className={`zn-link ${active === l.id ? 'is-active' : ''}`} onClick={() => goTo(l.id)}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="zn-actions">
          <button className="zn-login" onClick={() => navigate('/sign-in')}>
            Log in
          </button>
          <button
            className="group inline-flex items-center gap-1.5 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] font-medium rounded-full pl-4 pr-1.5 py-1.5 transition-colors duration-300 cursor-pointer"
            onClick={() => navigate('/sign-up')}
          >
            <span className="overflow-hidden h-[18px]">
              <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
                <span className="h-[18px] flex items-center">Start free</span>
                <span className="h-[18px] flex items-center" aria-hidden="true">
                  Start free
                </span>
              </span>
            </span>
            <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:rotate-0 -rotate-45">
              <ArrowRight size={12} className="text-[#F26522]" />
            </span>
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="zn-burger" onClick={() => setMobileOpen((o) => !o)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
          <span className={mobileOpen ? 'is-x' : ''} />
          <span className={mobileOpen ? 'is-x' : ''} />
        </button>
      </div>
    </nav>

      {/* Mobile sheet (outside the nav: the nav is transformed, which would trap fixed children) */}
      {mobileOpen && <div className="zn-backdrop" onClick={() => setMobileOpen(false)} />}
      <div className={`zn-sheet ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="zn-sheet-head">
          <span className="zn-sheet-label">Features</span>
          <button className="zn-sheet-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>
        <div className="zn-sheet-grid">
          {FEATURES.map((f) => (
            <button key={f.title} className="zn-item" onClick={() => goTo(f.id)}>
              <span className="zn-item-ico">{f.icon}</span>
              <span>
                <strong>{f.title}</strong>
                <small>{f.desc}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="zn-sheet-links">
          {LINKS.map((l) => (
            <button key={l.id} onClick={() => goTo(l.id)}>
              {l.label}
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
        <div className="zn-sheet-cta">
          <button className="zn-cta-primary" onClick={() => { setMobileOpen(false); navigate('/sign-up'); }}>
            Start free
          </button>
          <button className="zn-cta-ghost" onClick={() => { setMobileOpen(false); navigate('/sign-in'); }}>
            Log in
          </button>
        </div>
      </div>
    </>
  );
}
