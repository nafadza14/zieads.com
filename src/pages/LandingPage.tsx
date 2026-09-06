import Navbar from './landing/sections/Navbar';
import Hero from './landing/sections/Hero';
import FreeAuditSection from './landing/sections/FreeAuditSection';
import DailyBriefingSection from './landing/sections/DailyBriefingSection';
import SchedulingSection from './landing/sections/SchedulingSection';
import AnalyticsSection from './landing/sections/AnalyticsSection';
import InboxWatchSection from './landing/sections/InboxWatchSection';
import ConsolidationSection from './landing/sections/ConsolidationSection';
import ComparisonSection from './landing/sections/ComparisonSection';
import TestimonialsSection from './landing/sections/TestimonialsSection';
import WhoForSection from './landing/sections/WhoForSection';
import PricingSection from './landing/sections/PricingSection';
import FaqSection from './landing/sections/FaqSection';
import FinalCtaSection from './landing/sections/FinalCtaSection';
import Footer from './landing/sections/Footer';

interface Props {
  onScanComplete: (data: any) => void;
}

export default function LandingPage({ onScanComplete }: Props) {
  return (
    <div className="landing-page">
      {/* Grid line background */}
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="lp-line-top"></div>

      <Navbar />
      <Hero />
      <FreeAuditSection onScanComplete={onScanComplete} />
      <DailyBriefingSection />
      <SchedulingSection />
      <AnalyticsSection />
      <InboxWatchSection />
      <ConsolidationSection />
      <ComparisonSection />
      <TestimonialsSection />
      <WhoForSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <Footer />
    </div>
  );
}
