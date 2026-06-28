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
  LayoutGrid 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useCreditStore } from '../../lib/creditStore';
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
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email || null);
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/sign-in');
  };

  const currentPath = location.pathname;

  const dailyItems = [
    { k: '/analyst', l: 'AI Analyst', icon: <Sparkles size={15} style={{ color: '#8B5CF6' }} /> },
    { k: '/studio', l: 'Content Studio', icon: <Calendar size={15} style={{ color: '#ec4899' }} /> },
    { k: '/hunt', l: 'Competitor Hunt', icon: <Target size={15} style={{ color: '#ef4444' }} /> },
    { k: '/connections', l: 'Connections', icon: <Link2 size={15} style={{ color: '#10b981' }} /> },
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
    if (route.startsWith('/clients?tab=')) {
      const tab = route.split('=')[1];
      navigate('/clients', { state: { defaultTab: tab } });
    } else {
      navigate(route);
    }
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-soft)', color: 'var(--text)' }}>
      {/* Sidebar */}
      <div style={{ width: 260, borderRight: `1px solid ${B}`, background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${B}` }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>Z</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>ZieAds <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#F59E0B', color: '#fff', borderRadius: 4, marginLeft: 4 }}>v0.3</span></span>
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
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: D }}>{initials}</div>
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

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
