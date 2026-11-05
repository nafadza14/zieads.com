/*
  Build-time prerender of the public pages (SEO and AI crawlers that do not run JavaScript).
  scripts/prerender.mjs imports this SSR bundle and writes one HTML file per route.
  The browser still mounts the full app with createRoot, which replaces this markup.
*/
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';
import VsPage from './pages/VsPage';
import DocsPage from './pages/docs/DocsPage';
import { ApiPage, McpPage } from './pages/dev/DevPages';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import DataDeletionPage from './pages/DataDeletionPage';

export { SEO_ROUTES, seoFor, jsonLdFor } from './seo/seo';
export { DOCS } from './pages/docs/pages';
export { VS_PAGES } from './pages/landing/compare';
export { faqItems, pricingPlans } from './pages/landing/data';

export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <Routes>
        <Route path="/" element={<LandingPage onScanComplete={() => undefined} />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/vs/:slug" element={<VsPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/*" element={<DocsPage />} />
        <Route path="/mcp" element={<McpPage />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/data-deletion" element={<DataDeletionPage />} />
      </Routes>
    </StaticRouter>
  );
}
