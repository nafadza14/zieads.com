import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ZieAdsLogo from '../../../components/ZieAdsLogo';

function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours() % 12 || 12;
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      setTime(`${h}:${m} ${ampm}`);
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="nav-clock text-[12px] text-gray-500 font-medium tracking-wide hidden lg:inline">
      {time}
    </span>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Logo */}
        <div className="nav-brand" onClick={() => navigate('/')}>
          <ZieAdsLogo size={28} />
          <span className="brand-name">zieads</span>
        </div>

        {/* Desktop Links */}
        <div className="nav-links hidden md:flex">
          <a href="#free-audit-try">Platform</a>
          <a href="#features-overview" className="nav-link-dropdown">
            Features
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">Community</a>
          <a href="#contact">Contact</a>
        </div>

        {/* Desktop Actions */}
        <div className="nav-actions hidden md:flex">
          <LiveClock />
          <button
            className="group inline-flex items-center gap-1.5 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] font-medium rounded-full pl-4 pr-1.5 py-1.5 transition-colors duration-300 cursor-pointer"
            onClick={() => navigate('/sign-up')}
          >
            <span className="overflow-hidden h-[18px]">
              <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
                <span className="h-[18px] flex items-center">Start a project</span>
                <span className="h-[18px] flex items-center">Start a project</span>
              </span>
            </span>
            <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:rotate-0 -rotate-45">
              <ArrowRight size={12} className="text-[#F26522]" />
            </span>
          </button>
        </div>

        {/* Mobile Hamburger */}
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

        {/* Mobile Bottom Sheet Overlay */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-[200] md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="mobile-nav-sheet">
              <div className="mobile-nav-links">
                <a href="#free-audit-try" onClick={() => setIsMobileMenuOpen(false)}>Platform</a>
                <a href="#features-overview" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>Community</a>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', margin: '12px 0' }} />
              <button
                className="mobile-nav-cta"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-up'); }}
              >
                Start a project
              </button>
              <button
                className="mobile-nav-btn-outline"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-in'); }}
              >
                Log In
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
