import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ZieAdsLogo from '../ZieAdsLogo';
import { 
   
  Calendar, 
  Target, 
  Link2, 
  Home, 
  FileText, 
   
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
  Search, BotMessageSquare, Plus } from 'lucide-react';
import ZIcon from '../icons/ZIcon';
import ZieAvatar from '../ZieAvatar';
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

  // Grouped like Buffer and Metricool: overview, publish, engage, analyze, then setup at the bottom
  const navGroups: Array<{ label?: string; items: Array<{ k: string; l: string; icon: ReactNode }> }> = [
    {
      items: [
        { k: '/analyst', l: 'AI Analyst', icon: <ZIcon name="ai-analyst" size={16} /> },
        { k: '/agent', l: 'AI Agent', icon: <BotMessageSquare size={16} /> },
      ],
    },
    {
      label: 'Publish',
      items: [
        { k: '/composer', l: 'Composer', icon: <PenTool size={16} /> },
        { k: '/calendar', l: 'Calendar', icon: <Calendar size={16} /> },
      ],
    },
    { label: 'Engage', items: [{ k: '/inbox', l: 'Inbox', icon: <Inbox size={16} /> }] },
    {
      label: 'Analyze',
      items: [
        { k: '/analytics', l: 'Analytics', icon: <BarChart3 size={16} /> },
        { k: '/hunt', l: 'Competitor Hunt', icon: <Target size={16} /> },
      ],
    },
  ];
  const setupItems = [
    { k: '/connections', l: 'Connections', icon: <Link2 size={16} /> },
    { k: '/settings', l: 'Settings', icon: <SettingsIcon size={16} /> },
  ];
  const v3Items = [...navGroups.flatMap((g) => g.items), ...setupItems];
  void v3Items;

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

  const isActive = (k: string) => currentPath === k || (k === '/settings' && currentPath.startsWith('/settings/'));
  const navButton = (n: { k: string; l: string; icon: ReactNode }) => (
    <button key={n.k} className={`zd-nav-item ${isActive(n.k) ? 'is-active' : ''}`} onClick={() => handleNavClick(n.k)} aria-current={isActive(n.k) ? 'page' : undefined}>
      {n.icon}
      <span>{n.l}</span>
    </button>
  );

  const renderSidebarContent = () => (
    <>
      <div className="zd-brand" onClick={() => handleNavClick('/analyst')}>
        <ZieAdsLogo size={26} />
        <span className="zd-brand-name">zieads</span>
      </div>

      <div className="zd-side-cta">
        <button type="button" className="zd-create" onClick={() => handleNavClick('/composer')}>
          <Plus size={16} />
          Create post
        </button>
      </div>

      <nav className="zd-nav" aria-label="Main">
        {navGroups.map((g, gi) => (
          <div className="zd-nav-group" key={gi}>
            {g.label && <div className="zd-nav-label">{g.label}</div>}
            {g.items.map(navButton)}
          </div>
        ))}
        <div className="zd-nav-group is-bottom">{setupItems.map(navButton)}</div>
      </nav>

      <div className="zd-side-foot">
        <div className="zd-user">
          <div className="zd-avatar">{initials}</div>
          <div className="zd-user-text">
            <div className="zd-user-email">{userEmail || 'User'}</div>
            <div className="zd-user-plan">
              {creditStore.plan_display_name || 'Free'} plan
            </div>
          </div>
        </div>
        <div className="zd-credits">
          <CreditBadge pool="ai_chat" />
          <CreditBadge pool="skill_run" />
        </div>
        <div className="zd-foot-actions">
          {creditStore.upgrade_available !== false ? (
            <button className="zd-link" onClick={() => navigate('/pricing')}>
              Upgrade <ArrowRight size={12} />
            </button>
          ) : (
            <button className="zd-link" onClick={() => navigate('/settings/billing')}>
              Your plan <ArrowRight size={12} />
            </button>
          )}
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
            <button className="zd-btn is-secondary is-sm" onClick={handleExitDemo}>
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
