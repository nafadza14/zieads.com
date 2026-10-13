import './landing/landing-v2.css';
import './landing/visuals.css';
import './landing/collage.css';
import './landing/navbar.css';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './landing/sections/Navbar';
import Hero from './landing/sections/Hero';
import ProductTourSection from './landing/sections/ProductTourSection';
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
  const location = useLocation();

  // Support links like /#pricing coming from other pages
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <ProductTourSection />
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
