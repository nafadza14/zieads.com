import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-[20px] font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-[15px] text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#6C47FF] p-1.5 rounded-lg">
              <ZieAdsLogo size={16} className="text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-gray-900">ZieAds</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-[14px] text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            Go back
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <span className="inline-block px-3 py-1 bg-[#6C47FF]/10 text-[#6C47FF] text-[12px] font-semibold rounded-full uppercase tracking-wider mb-4">Legal</span>
          <h1 className="text-[40px] font-bold text-gray-900 tracking-tight leading-tight mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-[15px]">Last updated: May 2025</p>
        </div>

        <div className="h-px bg-gray-100 mb-10" />

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using ZieAds (available at zieads.com), you agree to be bound by these Terms of Service.
            If you do not agree to all terms and conditions, you must not use our platform.
          </p>
          <p>
            These terms apply to all users, visitors, and others who access or use the service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            ZieAds is an AI-powered advertising intelligence platform that provides website audits, ad strategy
            generation, audience targeting recommendations, creative concepts, and competitor analysis. The platform
            uses artificial intelligence to process business information and generate strategic recommendations.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <p>
            To access ZieAds features, you must create an account. You are responsible for:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Maintaining the confidentiality of your login credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete account information</li>
            <li>Promptly notifying us of any unauthorized use of your account</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to use ZieAds to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Generate content for fraudulent, deceptive, or misleading advertising</li>
            <li>Infringe on the intellectual property rights of others</li>
            <li>Attempt to reverse-engineer, scrape, or exploit our AI systems</li>
            <li>Transmit harmful, offensive, or abusive content</li>
            <li>Use the service for any unauthorized commercial resale without written permission</li>
          </ul>
        </Section>

        <Section title="5. AI-Generated Content">
          <p>
            ZieAds uses AI models to generate strategy reports, ad copy, and recommendations. You acknowledge that:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>AI-generated content may not always be accurate, complete, or appropriate for your specific situation</li>
            <li>You are responsible for reviewing and verifying all AI-generated recommendations before use</li>
            <li>ZieAds does not guarantee specific advertising results or outcomes</li>
            <li>You own the output generated for your business inputs, subject to our license to operate the service</li>
          </ul>
        </Section>

        <Section title="6. Subscription and Billing">
          <p>
            Some features of ZieAds require a paid subscription. By subscribing, you agree to pay all applicable
            fees as described on our pricing page. Subscriptions renew automatically unless cancelled before
            the renewal date. Refunds are handled on a case-by-case basis at our discretion.
          </p>
        </Section>

        <Section title="7. Credits System">
          <p>
            ZieAds uses a credit-based system for audit generation. Credits are consumed per audit run and
            do not roll over between billing periods unless otherwise stated. Unused credits from cancelled
            subscriptions are forfeited.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            ZieAds and its original content, features, and functionality are owned by ZieAds and are protected
            by international copyright, trademark, and other intellectual property laws. You may not reproduce,
            distribute, or create derivative works from our platform without written permission.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>
            ZieAds is provided "as is" and "as available" without warranties of any kind, either express or implied.
            We do not warrant that the service will be uninterrupted, error-free, or that the results obtained
            from AI recommendations will meet your specific requirements or expectations.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, ZieAds shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your use of the platform, including but
            not limited to loss of profits, data, or goodwill, even if we have been advised of the possibility
            of such damages.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            We may terminate or suspend your access to ZieAds at our sole discretion, without prior notice,
            for conduct that we believe violates these Terms of Service or is harmful to other users, us,
            or third parties, or for any other reason.
          </p>
        </Section>

        <Section title="12. Changes to Terms">
          <p>
            We reserve the right to modify these terms at any time. We will notify users of material changes
            via email or a prominent notice on our platform. Continued use after changes take effect
            constitutes your acceptance of the revised terms.
          </p>
        </Section>

        <Section title="13. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Indonesia,
            without regard to its conflict of law provisions.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            For questions about these Terms of Service, contact us at:{' '}
            <span className="text-[#6C47FF] font-medium">legal@zieads.com</span>
          </p>
        </Section>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-gray-400">© 2025 ZieAds. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/privacy-policy')} className="text-[13px] text-gray-500 hover:text-[#6C47FF] transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/sign-in')} className="text-[13px] text-[#6C47FF] font-semibold hover:underline">Sign in</button>
          </div>
        </div>
      </main>
    </div>
  );
}
