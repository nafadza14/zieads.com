import { Link } from 'react-router-dom';
import ZieAdsLogo, { ZieAdsWordmark } from '../../../components/ZieAdsLogo';

/* Shared footer for every public page: landing, legal, data deletion, comparison pages.
   Privacy, Terms and Data Deletion must be one click away everywhere (spec P0-5). */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner footer-grid-layout">
        <div className="footer-col footer-brand-col">
          <Link to="/" className="footer-brand" aria-label="ZieAds home">
            <ZieAdsLogo size={32} />
            <span className="brand-name"><ZieAdsWordmark /></span>
          </Link>
          <p className="footer-tagline">Your AI social media manager. Briefs you every morning, executes when you approve.</p>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Product</h4>
          <a href="/#product-tour">Product tour</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#mcp">MCP server</a>
          <a href="/#free-audit-try">Free website audit</a>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Compare</h4>
          <Link to="/vs/metricool">ZieAds vs Metricool</Link>
          <Link to="/vs/vista-social">ZieAds vs Vista Social</Link>
          <Link to="/vs/hootsuite">ZieAds vs Hootsuite</Link>
          <a href="/#faq">FAQ</a>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Legal</h4>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/data-deletion">Data Deletion</Link>
          <a href="mailto:privacy@zieads.com">privacy@zieads.com</a>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <p className="footer-copy">© 2026 ZieAds. All rights reserved.</p>
        <p className="footer-trust-note">
          ZieAds connects with read-only access via official platform APIs and never changes your campaigns. Nothing is published, replied to or spent without
          your approval.
        </p>
      </div>
    </footer>
  );
}
