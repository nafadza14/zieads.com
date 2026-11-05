import { useState, useEffect, ReactNode, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
const QuickScanResult = lazy(() => import('./pages/QuickScanResult'));
import AuthPage from './pages/AuthPage';
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'));
const AuditProgress = lazy(() => import('./pages/AuditProgress'));
const ReportDashboard = lazy(() => import('./pages/ReportDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
import PricingPage from './pages/PricingPage';
const SkillReport = lazy(() => import('./pages/SkillReport'));
const AgentChat = lazy(() => import('./pages/AgentChat'));
const ConnectionsPage = lazy(() => import('./pages/v3/ConnectionsPage'));
const AnalystPage = lazy(() => import('./pages/v3/AnalystPage'));
const ComposerPage = lazy(() => import('./pages/v3/ComposerPage'));
const CalendarPage = lazy(() => import('./pages/v3/CalendarPage'));
const AnalyticsPage = lazy(() => import('./pages/v3/AnalyticsPage'));
const InboxPage = lazy(() => import('./pages/v3/InboxPage'));
const CommentsPage = lazy(() => import('./pages/v3/CommentsPage'));
const HuntPage = lazy(() => import('./pages/v3/HuntPage'));
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
const SuperadminLogin = lazy(() => import('./pages/superadmin/SuperadminLogin'));
const SuperadminDashboard = lazy(() => import('./pages/superadmin/SuperadminDashboard'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
import DataDeletionPage from './pages/DataDeletionPage';
import VsPage from './pages/VsPage';
import DocsPage from './pages/docs/DocsPage';
const OAuthConsent = lazy(() => import('./pages/OAuthConsent'));
import { ApiPage, McpPage } from './pages/dev/DevPages';
import FeaturesPage from './pages/FeaturesPage';
import ErrorBoundary from './components/ErrorBoundary';
import SeoHead from './seo/SeoHead';
import { supabase } from './lib/supabaseClient';
import { CreditProvider } from './lib/creditStore';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!session) return <Navigate to="/sign-in" state={{ from: location.pathname }} />;
  return <CreditProvider>{children}</CreditProvider>;
};

// Short, recognisable tab titles: the ZieAds favicon plus "Page | ZieAds"
const PAGE_TITLES: Record<string, string> = {
  '/sign-in': 'Log in',
  '/sign-up': 'Sign up',
  '/pricing': 'Pricing',
  '/features': 'Features',
  '/agent': 'Zie AI Agent',
  '/analyst': 'AI Analyst',
  '/composer': 'Composer',
  '/calendar': 'Calendar',
  '/analytics': 'Analytics',
  '/comments': 'Comments',
  '/inbox': 'Inbox',
  '/hunt': 'Competitor Hunt',
  '/connections': 'Connections',
  '/settings': 'Settings',
  '/data-deletion': 'Data deletion',
  '/clients': 'Dashboard',
  '/scan-result': 'Website scan',
  '/audit/progress': 'Running audit',
  '/audit/report': 'Audit report',
};
function TabTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = PAGE_TITLES[pathname] || (pathname.startsWith('/settings') ? 'Settings' : undefined);
    if (pathname.startsWith('/vs/') || pathname.startsWith('/docs') || pathname.startsWith('/oauth/') || pathname === '/mcp' || pathname === '/api') return; // these pages set their own title
    document.title = page ? `${page} | ZieAds` : 'ZieAds: The social media tool that tells you what to do next';
  }, [pathname]);
  return null;
}

/** A crash on one page must not stick after the user navigates away */
function RouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary area="routes" key={pathname}>
      {children}
    </ErrorBoundary>
  );
}

export default function App() {
  const [scanData, setScanData] = useState<any>(() => {
    const saved = localStorage.getItem('zieads_scanData');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [businessContext, setBusinessContext] = useState<any>(() => {
    const saved = localStorage.getItem('zieads_businessContext');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist scanData and businessContext to localStorage
  useEffect(() => {
    if (scanData) localStorage.setItem('zieads_scanData', JSON.stringify(scanData));
    else localStorage.removeItem('zieads_scanData');
  }, [scanData]);

  useEffect(() => {
    if (businessContext) localStorage.setItem('zieads_businessContext', JSON.stringify(businessContext));
    else localStorage.removeItem('zieads_businessContext');
  }, [businessContext]);

  return (
    <Router>
      <TabTitle />
      <SeoHead />
      <RouteBoundary>
      {/* App pages load on demand so the public pages stay light */}
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff' }} aria-busy="true" />}>
      <Routes>
        <Route path="/" element={<LandingPage onScanComplete={setScanData} />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/sign-in/*" element={<AuthPage />} />
        <Route path="/sign-up/*" element={<AuthPage />} />
        <Route
          path="/scan-result"
          element={
            <QuickScanResult
              scanData={scanData}
              onStartFullAudit={(ctx: any) => setBusinessContext(ctx)}
            />
          }
        />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
        <Route path="/audit/progress" element={<ProtectedRoute><AuditProgress businessContext={businessContext} /></ProtectedRoute>} />
        <Route path="/audit/report" element={<ProtectedRoute><ReportDashboard /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/skill-report/:skillName" element={<ProtectedRoute><SkillReport /></ProtectedRoute>} />
        <Route path="/agent" element={<ProtectedRoute><AgentChat /></ProtectedRoute>} />
        {/* Business Profile moved into Settings (spec P0-1) */}
        <Route path="/profile" element={<Navigate to="/settings/brand-profile" replace />} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/:section" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/data-deletion" element={<DataDeletionPage />} />
        <Route path="/vs/:slug" element={<VsPage />} />
        <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
        <Route path="/analyst" element={<ProtectedRoute><AnalystPage /></ProtectedRoute>} />
        <Route path="/composer" element={<ProtectedRoute><ComposerPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/comments" element={<ProtectedRoute><CommentsPage /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
        <Route path="/hunt" element={<ProtectedRoute><HuntPage /></ProtectedRoute>} />
        <Route path="/tools" element={<Navigate to="/settings" replace />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/privacy.html" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/*" element={<DocsPage />} />
        <Route path="/oauth/authorize" element={<OAuthConsent />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/mcp" element={<McpPage />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
        <Route path="/tos" element={<Navigate to="/terms" replace />} />
        <Route path="/terms.html" element={<Navigate to="/terms" replace />} />
        <Route path="/superadmin/login" element={<SuperadminLogin />} />
        <Route path="/superadmin" element={<SuperadminDashboard />} />
      </Routes>
      </Suspense>
      </RouteBoundary>
    </Router>
  );
}
