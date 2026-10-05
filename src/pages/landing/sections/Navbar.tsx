import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../../../components/ZieAdsLogo';

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
          <button className="btn-signup-nav" onClick={() => navigate('/sign-up')}>Sign Up</button>
          <button className="btn-login-nav" onClick={() => navigate('/sign-in')}>Log In</button>
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

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-dropdown">
            <div className="mobile-nav-links">
              <a href="#free-audit-try" onClick={() => setIsMobileMenuOpen(false)}>Platform</a>
              <a href="#features-overview" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>Community</a>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '8px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="mobile-nav-btn-outline"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-up'); }}
              >
                Sign Up
              </button>
              <button
                className="mobile-nav-btn-solid"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-in'); }}
              >
                Log In
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
