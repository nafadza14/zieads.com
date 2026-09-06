import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../../../components/ZieAdsLogo';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-inner relative w-full h-full flex items-center justify-between">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <ZieAdsLogo size={32} />
          <span className="brand-name">zieads</span>
        </div>
        <div className="nav-links hidden md:flex">
          <a href="#free-audit-try">Try Free Scan</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
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
              <a href="#free-audit-try" onClick={() => setIsMobileMenuOpen(false)}>Try Free Scan</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
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
  );
}
