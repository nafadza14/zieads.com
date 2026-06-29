import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Calendar, 
  Target, 
  Link2, 
  Home, 
  FileText, 
  Bot, 
  User, 
  Share2, 
  Settings as SettingsIcon, 
  LayoutGrid,
  PenTool,
  BarChart3,
  Inbox,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useCreditStore } from '../../lib/creditStore';
import { useDemoMode } from '../../lib/demoStore';
import CreditBadge from '../CreditBadge';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const D = 'var(--text)';
const B = 'var(--border)';

interface Props {
  children: ReactNode;
}

export default function V3Layout({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const creditStore = useCreditStore();
  const demo = useDemoMode();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email || null);
      }
    });

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check onboarding status
    const checkOnboarding = async () => {
      const localCheck = sessionStorage.getItem('zieads_onboarding_check_done');
      if (localCheck === 'true') return;

      try {
        const tokenData = await supabase.auth.getSession();
        const token = tokenData?.data?.session?.access_token;
        if (!token) return;

        const res = await fetch('/api/v3/profile/onboarding', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const j = await res.json();
        if (j.success && j.hasCompletedOnboarding === false) {
          setShowWelcomeModal(true);
        }
        sessionStorage.setItem('zieads_onboarding_check_done', 'true');
      } catch (e) {
        console.error("Failed to check onboarding flag:", e);
      }
    };

    checkOnboarding();
  }, []);

  const handleStartTour = () => {
    demo.setDemoMode(true);
    setShowWelcomeModal(false);
    navigate('/analyst');
  };

  const handleConnectAccounts = async () => {
    setShowWelcomeModal(false);
    try {
      const tokenData = await supabase.auth.getSession();
      const token = tokenData?.data?.session?.access_token;
      if (token) {
        await fetch('/api/v3/profile/onboarding/complete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error(e);
    }
    navigate('/connections');
  };

  const handleExitDemo = async () => {
    demo.setDemoMode(false);
    try {
      const tokenData = await supabase.auth.getSession();
      const token = tokenData?.data?.session?.access_token;
      if (token) {
        await fetch('/api/v3/profile/onboarding/complete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/sign-in');
  };

  const currentPath = location.pathname;

  const dailyItems = [
    { k: '/analyst', l: 'AI Analyst', icon: <Sparkles size={15} style={{ color: '#8B5CF6' }} /> },
    { k: '/composer', l: 'Composer', icon: <PenTool size={15} style={{ color: '#ec4899' }} /> },
    { k: '/calendar', l: 'Calendar', icon: <Calendar size={15} style={{ color: '#2563eb' }} /> },
    { k: '/analytics', l: 'Analytics', icon: <BarChart3 size={15} style={{ color: '#10b981' }} /> },
    { k: '/inbox', l: 'Inbox', icon: <Inbox size={15} style={{ color: '#eab308' }} /> },
    { k: '/hunt', l: 'Competitor Hunt', icon: <Target size={15} style={{ color: '#ef4444' }} /> },
    { k: '/connections', l: 'Connections', icon: <Link2 size={15} style={{ color: '#6366f1' }} /> },
  ];

  const toolItems = [
    { k: '/clients?tab=home', l: 'Home', icon: <Home size={15} style={{ color: '#6366F1' }} /> },
    { k: '/clients?tab=reports', l: 'Reports', icon: <FileText size={15} style={{ color: '#0D9488' }} /> },
    { k: '/agent', l: 'AI Agent', icon: <Bot size={15} style={{ color: '#8B5CF6' }} /> },
    { k: '/profile', l: 'Business Profile', icon: <User size={15} style={{ color: '#F97316' }} /> },
    { k: '/clients?tab=referrals', l: 'Referrals', icon: <Share2 size={15} style={{ color: '#EC4899' }} /> },
    { k: '/clients?tab=settings', l: 'Settings', icon: <SettingsIcon size={15} style={{ color: '#71717A' }} /> },
    { k: '/clients?tab=skills', l: 'All Skills', icon: <LayoutGrid size={15} style={{ color: '#10B981' }} /> },
  ];

  const handleNavClick = (route: string) => {
    setDrawerOpen(false);
    if (route.startsWith('/clients?tab=')) {
      const tab = route.split('=')[1];
      navigate('/clients', { state: { defaultTab: tab } });
    } else {
      navigate(route);
    }
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U';

  const renderSidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${B}` }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>Z</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: D }}>
            ZieAds <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#F59E0B', color: '#fff', borderRadius: 4, marginLeft: 4 }}>v0.3</span>
          </span>
          <span style={{ fontSize: '11px', color: G, marginTop: 4, letterSpacing: '0.02em', fontWeight: 400 }}>Schedule, analyze, act.</span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
        {/* Daily Operations Group */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.68rem', color: G, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, paddingLeft: 8, marginBottom: 8 }}>Daily Operations</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {dailyItems.map(n => {
              const isActive = currentPath === n.k;
              return (
                <li 
                  key={n.k} 
                  onClick={() => handleNavClick(n.k)} 
                  style={{ 
                    cursor: 'pointer', 
                    padding: '8px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    fontWeight: isActive ? 600 : 400, 
                    background: isActive ? 'var(--primary-bg)' : 'transparent', 
                    color: isActive ? 'var(--text)' : 'var(--text-secondary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10 
                  }}
                >
                  {n.icon}
                  {n.l}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tools and Reports Group */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.68rem', color: G, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, paddingLeft: 8, marginBottom: 8 }}>Tools & Reports</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {toolItems.map(n => {
              return (
                <li 
                  key={n.k} 
                  onClick={() => handleNavClick(n.k)} 
                  style={{ 
                    cursor: 'pointer', 
                    padding: '8px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    color: 'var(--text-secondary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10 
                  }}
                >
                  {n.icon}
                  {n.l}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* User Footer info */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${B}`, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: D }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: D, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail || 'User'}</div>
            <div style={{ fontSize: '0.7rem', color: G }}>{creditStore.plan_display_name || 'Free'} Plan</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <CreditBadge pool="ai_chat" />
          <CreditBadge pool="skill_run" />
        </div>
        <button onClick={() => navigate('/pricing')} style={{ marginTop: 10, width: '100%', background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius-sm)', padding: '6px 0', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>Upgrade Plan</button>
        <button onClick={handleSignOut} style={{ marginTop: 6, width: '100%', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 0', fontSize: '0.78rem', color: G, cursor: 'pointer' }}>Sign out</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: 'var(--bg-soft)', color: 'var(--text)' }}>
      
      {/* Mobile Top Bar */}
      {isMobile && (
        <div style={{ height: 56, background: '#fff', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '0 16px', zIndex: 90 }}>
          <button 
            onClick={() => setDrawerOpen(true)}
            style={{ border: 'none', background: 'none', color: D, cursor: 'pointer', padding: 4 }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
            ZieAds <span style={{ fontSize: '0.55rem', padding: '1px 4px', background: '#F59E0B', color: '#fff', borderRadius: 3 }}>v0.3</span>
          </span>
          <div style={{ width: 28 }} />
        </div>
      )}

      {/* Slide-out mobile drawer overlay */}
      {isMobile && drawerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex' }}>
          <div style={{ width: 260, height: '100vh', background: '#fff', boxShadow: '0 0 15px rgba(0,0,0,0.1)', position: 'relative' }}>
            <button 
              onClick={() => setDrawerOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', color: D, cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            {renderSidebarContent()}
          </div>
          <div style={{ flex: 1 }} onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div style={{ width: 260, borderRight: `1px solid ${B}`, background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {renderSidebarContent()}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Demo Mode Top Banner */}
        {demo.isActive && (
          <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 16px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 600 }}>
              Demo Mode — Exploring with sample data. Connect your real accounts to see your own insights.
            </span>
            <button 
              onClick={handleExitDemo}
              style={{ background: P, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Exit Demo
            </button>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </div>

      {/* Welcome Onboarding Modal */}
      {showWelcomeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 32, width: '90%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>Z</div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Welcome to ZieAds</h2>
            </div>
            
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Want to see how ZieAds works with sample data first, or jump straight to connecting your accounts?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <button 
                onClick={handleStartTour}
                style={{ width: '100%', background: P, color: '#fff', border: 'none', padding: '12px 0', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Start Tour with Sample Data
              </button>
              <button 
                onClick={handleConnectAccounts}
                style={{ width: '100%', background: 'none', border: `1px solid ${B}`, padding: '12px 0', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}
              >
                Connect My Accounts Directly
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
