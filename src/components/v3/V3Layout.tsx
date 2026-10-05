import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ZieAdsLogo from '../ZieAdsLogo';
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
  AlertCircle,
  Search
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useCreditStore } from '../../lib/creditStore';
import { useDemoMode } from '../../lib/demoStore';
import CreditBadge from '../CreditBadge';
import { ArrowRight } from 'lucide-react';
import './dash.css';

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
  // Welcome modal removed
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
      if (demo.isActive) return;

      // Client-side bypass check
      if (localStorage.getItem('zieads_onboarding_completed') === 'true') {
        return;
      }

      try {
        const tokenData = await supabase.auth.getSession();
        const token = tokenData?.data?.session?.access_token;
        if (!token) return;

        const res = await fetch('/api/v3/profile/onboarding', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const j = await res.json();
        
        if (j.success && j.hasCompletedOnboarding === true) {
          localStorage.setItem('zieads_onboarding_completed', 'true');
        }

        if (j.success && j.hasCompletedOnboarding === false) {
          navigate('/onboarding');
        }
      } catch (e) {
        console.error("Failed to check onboarding flag:", e);
      }
    };

    checkOnboarding();
  }, [demo.isActive, navigate]);

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
        localStorage.setItem('zieads_onboarding_completed', 'true');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('zieads_onboarding_completed');
    await supabase.auth.signOut();
    navigate('/sign-in');
  };

  const currentPath = location.pathname;

  const v3Items = [
    { k: '/analyst', l: 'AI Analyst', icon: <Sparkles size={15} /> },
    { k: '/agent', l: 'AI Agent', icon: <Bot size={15} /> },
    { k: '/composer', l: 'Composer', icon: <PenTool size={15} /> },
    { k: '/calendar', l: 'Calendar', icon: <Calendar size={15} /> },
    { k: '/analytics', l: 'Analytics', icon: <BarChart3 size={15} /> },
    { k: '/inbox', l: 'Inbox', icon: <Inbox size={15} /> },
    { k: '/hunt', l: 'Competitor Hunt', icon: <Target size={15} /> },
    { k: '/connections', l: 'Connections', icon: <Link2 size={15} /> },
    { k: '/clients?tab=settings', l: 'Settings', icon: <SettingsIcon size={15} /> },
  ];

  // V0.2 features hidden for V0.3 release (do not delete)
  const v2HiddenItems = [
    { k: '/clients?tab=home', l: 'Audit', icon: <Search size={15} /> },
    { k: '/clients?tab=reports', l: 'Reports', icon: <FileText size={15} /> },
    { k: '/profile', l: 'Business Profile', icon: <User size={15} /> },
    { k: '/clients?tab=referrals', l: 'Referrals', icon: <Share2 size={15} /> },
    { k: '/clients?tab=skills', l: 'All Skills', icon: <LayoutGrid size={15} /> },
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
    <>
      <div className="zd-brand" onClick={() => handleNavClick('/analyst')}>
        <ZieAdsLogo size={26} />
        <span className="zd-brand-name">zieads</span>
        <span className="zd-brand-pill">v0.3</span>
      </div>
      <div className="zd-tagline">Schedule, analyze, act.</div>

      <nav className="zd-nav">
        <div className="zd-nav-label">Main menu</div>
        {v3Items.map((n, i) => {
          const isActive =
            currentPath === n.k ||
            (currentPath === '/clients' && n.k.includes('tab=') && location.search.includes(n.k.split('=')[1]));
          return (
            <button
              key={n.k}
              className={`zd-nav-item ${isActive ? 'is-active' : ''}`}
              style={{ animationDelay: `${i * 35}ms` }}
              onClick={() => handleNavClick(n.k)}
            >
              {n.icon}
              <span>{n.l}</span>
              {n.k === '/agent' && <span className="zd-nav-new">AI</span>}
            </button>
          );
        })}
      </nav>

      <div className="zd-side-foot">
        <div className="zd-user">
          <div className="zd-avatar">{initials}</div>
          <div className="zd-user-text">
            <div className="zd-user-email">{userEmail || 'User'}</div>
            <div className="zd-user-plan">{creditStore.plan_display_name || 'Free'} plan</div>
          </div>
        </div>
        <div className="zd-credits">
          <CreditBadge pool="ai_chat" />
          <CreditBadge pool="skill_run" />
        </div>
        <div className="zd-foot-actions">
          <button className="zd-link" onClick={() => navigate('/pricing')}>
            Upgrade plan <ArrowRight size={12} />
          </button>
          <button className="zd-link zd-link-muted" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="zd-shell">
      {/* Mobile top bar */}
      <div className="zd-topbar">
        <button className="zd-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
        <span className="zd-brand-name" style={{ fontSize: 17 }}>zieads</span>
        <ZieAdsLogo size={24} />
      </div>

      {drawerOpen && <div className="zd-backdrop" onClick={() => setDrawerOpen(false)} />}

      <aside className={`zd-sidebar ${drawerOpen ? 'is-open' : ''}`}>
        {isMobile && (
          <button
            onClick={() => setDrawerOpen(false)}
            className="zd-icon-btn"
            style={{ position: 'absolute', top: 16, right: 14 }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
        {renderSidebarContent()}
      </aside>

      <main className="zd-main">
        {demo.isActive && (
          <div className="zd-demo-bar">
            <span>
              <strong>Demo mode.</strong> You are exploring sample data. Connect your accounts to see your own insights.
            </span>
            <button className="zd-btn-ghost" onClick={handleExitDemo} style={{ padding: '5px 12px', fontSize: 12 }}>
              Exit demo
            </button>
          </div>
        )}
        <div className="zd-page" key={location.pathname}>
          {children}
        </div>
      </main>
    </div>
  );
}
