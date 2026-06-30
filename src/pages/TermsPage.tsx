import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { 
  Scale, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Clock,
  Printer
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Design Lineage (Extracted from Landing Page):
   - Typography: Font 'Geist', Headings 'Bricolage Grotesque' or 'General Sans'
   - Colors: Primary #09090B, Accent Gradient, Border #E4E4E7
   - Layout: Centered column (max-w-[680px]), matching https://www.anthropic.com/policy
   ═══════════════════════════════════════════════════════ */

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] antialiased selection:bg-zinc-200" style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      
      {/* Print styles */}
      <style>{`
        @media print {
          nav, footer, .print-action-bar, .no-print {
            display: none !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
            line-height: 1.6 !important;
          }
          h2 {
            page-break-before: always;
            border-bottom: 1.5px solid #000 !important;
            padding-bottom: 8px !important;
            margin-top: 30px !important;
          }
        }
      `}</style>

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
        </div>
      </nav>

      {/* CENTERED MAIN CONTENT CONTAINER */}
      <main className="max-w-[680px] mx-auto px-6 pt-[140px] pb-24 text-left">
        
        {/* Title Zone */}
        <div className="mb-12 border-b border-zinc-200 pb-8">
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-4xl sm:text-[44px] font-extrabold text-black tracking-tight leading-tight mb-4">
            Terms of Service
          </h1>
          <div className="text-xs text-zinc-500 space-y-1 font-mono">
            <div>Effective Date: June 30, 2026</div>
            <div>Last Updated: June 30, 2026 &bull; Version 2.0.0</div>
            <div className="italic text-zinc-400 mt-2">
              This agreement was published on June 30, 2026 with an effective date of June 30, 2026.
            </div>
          </div>

          {/* Quick Print/PDF Action */}
          <div className="flex items-center gap-3 mt-6 print-action-bar">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-500 font-mono text-[10.5px]">
              <Clock size={11} /> ~15 min read
            </span>
            <button 
              onClick={() => window.print()}
              style={{ background: '#fff', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: 4, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={11} /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Prose Content */}
        <div className="text-[15.5px] leading-[1.75] text-[#1A1A1A] space-y-10">
          
          {/* SECTION 1 */}
          <section id="agreement" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              1. Agreement to Terms
            </h2>
            <p>
              These Terms of Service constitute a legally binding contract between you (whether personally or on behalf of an entity you represent) and <strong>PT. Bantu Indonesia Technology</strong>, an Indonesian limited liability company registered in the Special Region of Yogyakarta, Indonesia, operating the ZieAds platform at <strong>zieads.com</strong> ("we", "us", "our").
            </p>
            <p>
              By creating an account, registering, accessing the website, or subscribing to our services, you confirm that you have read, understood, and agreed to be bound by all of these Terms of Service. If you do not agree with all of these Terms, you are prohibited from using the service and must stop accessing our web domain immediately.
            </p>
          </section>

          {/* SECTION 2 */}
          <section id="description" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              2. Description of Service
            </h2>
            <p>
              ZieAds is a marketing software-as-a-service (SaaS) platform that provides creators, small businesses, and agencies with social media scheduling and analytics tools. The platform includes our legacy <strong>v0.2 tools</strong> (URL-based advertising readiness audits scored across 6 dimensions, 10 deep diagnosis analysis workflows, 15 terminal slash commands, white-label report exports, and credit-based model runs) and our new <strong>v0.3 tools</strong> (organic social scheduling, visual calendar dashboard feeds, automated publishing pipelines for Instagram/TikTok/LinkedIn, a unified comment inbox, and a daily AI Marketing Analyst layer that generates anomaly reports and timing optimizations).
            </p>
            <p>
              We utilize artificial intelligence models powered by Anthropic's Claude API to process data and construct these recommendations. You acknowledge that AI output represents suggestions and that you remain responsible for auditing and verifying content before it is published to your connected channels.
            </p>
          </section>

          {/* SECTION 3 */}
          <section id="eligibility" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              3. Eligibility & Account Registration
            </h2>
            <p>
              To register an account on ZieAds, you must be at least 18 years of age (or the legal age of majority in your jurisdiction). By registering, you warrant that you possess the legal authority to enter into a binding contract and that all details you supply are accurate, current, and complete.
            </p>
            <p>
              You are responsible for keeping your login credentials confidential and secure. You agree to notify us immediately at <strong>legal@zieads.com</strong> if you detect any unauthorized access to your account workspace. We are not liable for any losses caused by unauthorized use of your credentials.
            </p>
          </section>

          {/* SECTION 4 */}
          <section id="billing" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              4. Subscription Plans & Billing
            </h2>
            <p>
              We offer subscription plans (Solo: $29/mo, Pro: $89/mo, Studio: $229/mo) and credit packs processed securely through Stripe. Paid plans renew automatically on a recurring monthly or annual basis until cancelled. You can cancel your subscription at any time via your account billing panel, and cancellation will take effect at the end of the current billing cycle.
            </p>
            <p>
              We provide a 14-day refund window for first-time paid plan purchases. If recurring payments fail after three automatic retries, we reserve the right to downgrade your account to the Free tier and suspend advanced features. All prices listed exclude applicable sales tax or VAT (PPN) in Indonesia, which is your responsibility.
            </p>
          </section>

          {/* SECTION 5 */}
          <section id="acceptable-use" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              5. Acceptable Use Policy
            </h2>
            <p>
              You agree to use ZieAds strictly for lawful business purposes. You are prohibited from using the platform to publish defamatory, hateful, or illegal content; distribute spam or unsolicited advertising campaigns; violate third-party copyright or intellectual property rights; or bypass, scrape, or extract database schemas or reverse-engineer algorithms.
            </p>
            <p>
              We reserve the right to audit scheduled posts and inputs. Violations of this Acceptable Use Policy will result in immediate suspension or termination of your profile workspace without any refund of unused credits or fees.
            </p>
          </section>

          {/* SECTION 6 */}
          <section id="intellectual-property" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              6. User Content & Intellectual Property
            </h2>
            <p>
              You retain sole ownership of all captions, media attachments, and files created or scheduled through ZieAds. You grant us a limited, worldwide, royalty-free license to store, process, and publish this content solely to deliver the services you requested.
            </p>
            <p>
              All proprietary code, layouts, AI prompt configurations, database structures, trademarks, logos, and audit scoring algorithms on zieads.com are the exclusive property of PT. Bantu Indonesia Technology and are protected by international copyright laws.
            </p>
          </section>

          {/* SECTION 7 */}
          <section id="compliance" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              7. Third-Party Platform Compliance
            </h2>
            <p>
              ZieAds connects to external platforms (Instagram, TikTok, LinkedIn) via official developer APIs. You must comply with their respective terms of service (Meta Terms, TikTok Developer Terms, LinkedIn API Terms). We are not responsible or liable for any account restrictions, suspensions, or modifications applied to your social channels by these platforms.
            </p>
          </section>

          {/* SECTION 8 */}
          <section id="ai-disclaimer" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              8. AI-Generated Content Disclaimer
            </h2>
            <p>
              Suggestions, briefings, and ad diagnoses are generated by artificial intelligence. ZIEADS DOES NOT GUARANTEE THE ACCURACY, EFFECTIVENESS, OR LEGAL COMPLIANCE OF THESE INSIGHTS. All recommendations are provided "as-is" and do not constitute professional advertising, financial, or legal advice.
            </p>
          </section>

          {/* SECTION 9 */}
          <section id="availability" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              9. Service Availability & Modifications
            </h2>
            <p>
              We aim for a 99.5% service uptime but do not warrant that our platform will run uninterrupted or error-free. We may update features, modify layouts, or deprecate analytical options with reasonable notice. We are not liable for outages caused by third-party API changes.
            </p>
          </section>

          {/* SECTION 10 */}
          <section id="warranties" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              10. Disclaimers & Warranties
            </h2>
            <p>
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. PT. BANTU INDONESIA TECHNOLOGY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING FIT FOR A PARTICULAR MARKETING GOAL OR NON-INFRINGEMENT.
            </p>
          </section>

          {/* SECTION 11 */}
          <section id="liability" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              11. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PT. BANTU INDONESIA TECHNOLOGY AND ITS DIRECTORS WILL NOT BE LIABLE FOR INDIRECT, CONSEQUENTIAL, OR SPECIAL DAMAGES, OR FOR LOSS OF PROFITS, DATA LEAKS, OR ADVERTISING BUDGET SPENT ON CAMPAIGNS. OUR TOTAL LIABILITY IS CAPPED AT THE FEES PAID BY YOU TO ZIEADS IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* SECTION 12 */}
          <section id="indemnity" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              12. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless PT. Bantu Indonesia Technology, its officers, and employees from any third-party claims, legal fees, or damages arising out of your violation of these Terms of Service or your connected channel terms.
            </p>
          </section>

          {/* SECTION 13 */}
          <section id="termination" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              13. Termination
            </h2>
            <p>
              You can terminate your account workspace at any time by requesting deletion in your settings. We reserve the right to suspend or block your access immediately if you violate any provision of these Terms or engage in activities that threaten platform security.
            </p>
          </section>

          {/* SECTION 14 */}
          <section id="dispute-resolution" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              14. Dispute Resolution & Governing Law
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the <strong>Republic of Indonesia</strong>. Any dispute arising out of or in connection with these Terms that cannot be resolved through amicable negotiation within 30 days shall be resolved exclusively through the jurisdiction of the courts of <strong>Pengadilan Negeri Yogyakarta</strong> (Yogyakarta District Court).
            </p>
          </section>

          {/* SECTION 15 */}
          <section id="changes-to-terms" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              15. Changes to These Terms
            </h2>
            <p>
              We may adjust these Terms of Service at any time. Material changes will be communicated via email or in-app notice 14 days before taking effect. Continued use of ZieAds after the effective date constitutes your acceptance of the revised terms.
            </p>
          </section>

          {/* SECTION 16 */}
          <section id="contact-terms" className="space-y-4">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-xl font-bold text-black tracking-tight pt-2 border-b border-zinc-200 pb-1.5">
              16. Contact Information
            </h2>
            <p>
              If you have questions or legal notices regarding these Terms, contact us at:
            </p>
            <div className="font-mono text-xs leading-relaxed text-zinc-550 bg-zinc-50 border border-zinc-200 p-6 rounded-lg">
              <div>PT. Bantu Indonesia Technology</div>
              <div>Registered Office: Omah Dongeng, Somodaran, Purwomartani, Kalasan, Special Region of Yogyakarta, Indonesia</div>
              <div>Primary Email: legal@zieads.com</div>
              <div>Phone: +62 851 5762 6264</div>
            </div>
          </section>
        </div>
      </main>

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
          <p className="footer-copy">© 2026 PT. Bantu Indonesia Technology. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
