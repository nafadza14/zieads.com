import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import ZieAdsLogo from '../../../components/ZieAdsLogo';

export default function Footer() {
  const navigate = useNavigate();
  const scrollToHero = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="footer">
      <div className="footer-inner footer-grid-layout">
        <div className="footer-col footer-brand-col">
          <div className="footer-brand" onClick={scrollToHero}>
            <ZieAdsLogo size={32} />
            <span className="brand-name">zieads</span>
          </div>
          <p className="footer-tagline">The AI marketing agent that runs your social media.</p>
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
          <a href="#free-audit-try">Free Scan Audit</a>
          <a href="#pricing">Pricing</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/clients'); }}>Agency Plan</a>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Resources</h4>
          <a href="#pricing">Paid Ads Readiness Guide</a>
          <a href="#free-audit-try">Platform Comparison</a>
          <a href="#faq">FAQ</a>
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
        <p className="footer-trust-note">
          ZieAds does not access, store, or transmit your ad account credentials. Audits are based on publicly visible
          page data only.
        </p>
      </div>
    </footer>
  );
}
