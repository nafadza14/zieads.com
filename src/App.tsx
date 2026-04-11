import { useState, useEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import QuickScanResult from './pages/QuickScanResult';
import AuthPage from './pages/AuthPage';
import OnboardingWizard from './pages/OnboardingWizard';
import AuditProgress from './pages/AuditProgress';
import ReportDashboard from './pages/ReportDashboard';
import ClientDashboard from './pages/ClientDashboard';
import PricingPage from './pages/PricingPage';
import SkillReport from './pages/SkillReport';
import { supabase } from './lib/supabaseClient';

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
  return <>{children}</>;
};

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
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard scanData={scanData} onComplete={(ctx: any) => setBusinessContext(ctx)} /></ProtectedRoute>} />
        <Route path="/audit/progress" element={<ProtectedRoute><AuditProgress businessContext={businessContext} /></ProtectedRoute>} />
        <Route path="/audit/report" element={<ProtectedRoute><ReportDashboard /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/skill-report/:skillName" element={<ProtectedRoute><SkillReport /></ProtectedRoute>} />
        <Route path="/tools" element={<Navigate to="/clients" replace />} />
      </Routes>
    </Router>
  );
}
