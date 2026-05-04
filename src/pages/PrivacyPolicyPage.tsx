import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-[20px] font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-[15px] text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
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
          <h1 className="text-[40px] font-bold text-gray-900 tracking-tight leading-tight mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-[15px]">Last updated: May 2025</p>
        </div>

        <div className="h-px bg-gray-100 mb-10" />

        <Section title="1. Introduction">
          <p>
            Welcome to ZieAds. We respect your privacy and are committed to protecting your personal data.
            This Privacy Policy explains how ZieAds ("we", "us", or "our") collects, uses, and shares
            information about you when you use our platform at zieads.com and related services.
          </p>
          <p>
            By using ZieAds, you agree to the collection and use of information in accordance with this policy.
            If you do not agree, please do not use our services.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p><strong className="text-gray-800">Account information:</strong> When you register, we collect your name, email address, and password (stored securely via Supabase authentication).</p>
          <p><strong className="text-gray-800">Usage data:</strong> We collect information on how you interact with our platform, including pages visited, features used, audit reports generated, and session duration.</p>
          <p><strong className="text-gray-800">Business data:</strong> When you run an audit, we process the website URL and business context you provide to generate AI-powered strategy reports.</p>
          <p><strong className="text-gray-800">Communications:</strong> If you contact us, we may keep records of that correspondence.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Provide, maintain, and improve the ZieAds platform</li>
            <li>Generate AI-powered ad strategy reports and audits</li>
            <li>Send product updates, account alerts, and important notifications</li>
            <li>Respond to your requests and provide customer support</li>
            <li>Monitor and analyze usage patterns to improve our service</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="4. Sharing of Information">
          <p>We do not sell your personal information. We may share your data in the following limited circumstances:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong className="text-gray-800">Service providers:</strong> We use trusted third-party providers (Supabase, Google, Vercel, Anthropic, Google Gemini) to operate our platform.</li>
            <li><strong className="text-gray-800">Legal requirements:</strong> If required by law or to protect rights and safety.</li>
            <li><strong className="text-gray-800">Business transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your personal data for as long as your account is active or as needed to provide you with services.
            You may request deletion of your account and associated data at any time by contacting us at privacy@zieads.com.
          </p>
        </Section>

        <Section title="6. Cookies and Tracking">
          <p>
            We use essential cookies to keep you logged in and remember your preferences. We do not use third-party
            advertising cookies. You can control cookies through your browser settings.
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We implement industry-standard security measures including encrypted data transmission (HTTPS),
            secure authentication via Supabase, and regular security reviews. However, no method of
            transmission over the internet is 100% secure.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability</li>
          </ul>
          <p>To exercise any of these rights, contact us at <span className="text-[#6C47FF] font-medium">privacy@zieads.com</span>.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes
            by posting the new policy on this page and updating the "Last updated" date. Continued use of the
            platform after changes constitutes your acceptance of the revised policy.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>
            If you have questions or concerns about this Privacy Policy, please contact us at:{' '}
            <span className="text-[#6C47FF] font-medium">privacy@zieads.com</span>
          </p>
        </Section>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-gray-400">© 2025 ZieAds. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/terms')} className="text-[13px] text-gray-500 hover:text-[#6C47FF] transition-colors">Terms of Service</button>
            <button onClick={() => navigate('/sign-in')} className="text-[13px] text-[#6C47FF] font-semibold hover:underline">Sign in</button>
          </div>
        </div>
      </main>
    </div>
  );
}
