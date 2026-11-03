import './landing/lx/lx.css';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LxNav from './landing/lx/LxNav';
import LxFooter from './landing/lx/LxFooter';
import { LxAudit, LxCompare, LxCta, LxFaq, LxFeatures, LxHero, LxHow, LxImpact, LxIntegrations, LxPricing, LxPromises, LxStrip, LxWhy } from './landing/lx/Sections';

interface Props {
  onScanComplete: (data: any) => void;
}

export default function LandingPage({ onScanComplete }: Props) {
  const location = useLocation();

  // Old anchors (#product-tour, #mcp, #free-audit-try) still land on the right section
  useEffect(() => {
    if (!location.hash) return;
    const alias: Record<string, string> = { 'product-tour': 'features', mcp: 'integrations', 'free-audit-try': 'audit', 'ai-analyst': 'features', composer: 'features', analytics: 'features', inbox: 'features' };
    const raw = location.hash.slice(1);
    const id = alias[raw] || raw;
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  useEffect(() => {
    document.title = 'ZieAds: AI social media manager that briefs you every morning';
  }, []);

  return (
    <div className="lx">
      <LxNav />
      <main>
        <LxHero />
        <LxStrip />
        <LxWhy />
        <LxFeatures />
        <LxHow />
        <LxImpact />
        <LxPromises />
        <LxIntegrations />
        <LxCompare />
        <LxPricing />
        <LxAudit onScanComplete={onScanComplete} />
        <LxFaq />
        <LxCta />
      </main>
      <LxFooter />
    </div>
  );
}
