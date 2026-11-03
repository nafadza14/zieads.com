/* v4 footer, shared by the landing page and every public page. Legal links stay one click away (P0-5). */
import { Link } from 'react-router-dom';
import ZieAdsLogo from '../../../components/ZieAdsLogo';

export default function LxFooter() {
  return (
    <footer className="lx-foot">
      <div className="lx-wrap">
        <div className="lx-foot-top">
          <div className="lx-foot-brand">
            <Link to="/" className="lx-brand" aria-label="ZieAds home">
              <ZieAdsLogo size={28} />
              zieads
            </Link>
            <p>The AI social media manager for founders, freelancers and small agencies. It briefs you every morning and works when you approve.</p>
          </div>
          <div className="lx-foot-col">
            <h4>Product</h4>
            <a href="/#features">Features</a>
            <a href="/#how">How it works</a>
            <a href="/#integrations">Integrations and MCP</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#audit">Free website audit</a>
          </div>
          <div className="lx-foot-col">
            <h4>Compare</h4>
            <Link to="/vs/metricool">ZieAds vs Metricool</Link>
            <Link to="/vs/vista-social">ZieAds vs Vista Social</Link>
            <Link to="/vs/hootsuite">ZieAds vs Hootsuite</Link>
            <a href="/#faq">FAQ</a>
          </div>
          <div className="lx-foot-col">
            <h4>Legal</h4>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/data-deletion">Data Deletion</Link>
            <a href="mailto:privacy@zieads.com">privacy@zieads.com</a>
          </div>
        </div>
        <div className="lx-foot-bottom">
          <span>© 2026 ZieAds, PT. Bantu Indonesia Technology. All rights reserved.</span>
          <p>ZieAds uses official platform APIs, reads ads accounts with read-only access and never changes your campaigns. Nothing is published, replied to or spent without your approval.</p>
        </div>
      </div>
    </footer>
  );
}
