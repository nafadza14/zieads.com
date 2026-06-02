import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

const P = 'var(--primary)'; // primary black
const PL = 'var(--primary-bg)'; // light background
const D = 'var(--text)'; // dark text
const G = 'var(--text-muted)'; // gray text
const B = 'var(--border)'; // border color

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
  onSelect: () => void;
}

function PricingCard({ name, price, description, features, recommended, onSelect }: PricingCardProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1.5px solid ${recommended ? P : B}`,
      borderRadius: 8,
      padding: 32,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: recommended ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      transform: recommended ? 'scale(1.01)' : 'none',
      transition: 'all 0.2s ease-in-out'
    }}>
      {recommended && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: P, color: '#fff', padding: '4px 16px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Most Popular
        </div>
      )}
      
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: D, marginBottom: 8, marginTop: 0 }}>{name}</h3>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: D, marginBottom: 8, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono, "Geist Mono", monospace)' }}>${price}<span style={{ fontSize: '1.2rem', color: G, fontWeight: 500 }}>/mo</span></div>
      <p style={{ fontSize: '0.875rem', color: G, marginBottom: 24, lineHeight: 1.5 }}>{description}</p>
      
      <button 
        onClick={onSelect}
        style={{ width: '100%', background: recommended ? P : 'transparent', color: recommended ? '#fff' : D, border: `1px solid ${recommended ? P : B}`, padding: '10px 0', borderRadius: 6, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginBottom: 32, transition: 'all 0.2s', fontFamily: 'inherit' }}
        onMouseOver={(e) => { if (!recommended) e.currentTarget.style.borderColor = P; }}
        onMouseOut={(e) => { if (!recommended) e.currentTarget.style.borderColor = B; }}
      >
        Get Started
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: D, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Includes:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.875rem', color: D }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/sign-up');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-soft)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', borderBottom: `1px solid ${B}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <ZieAdsLogo size={24} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: D, letterSpacing: '-0.03em' }}>zieads</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button onClick={() => navigate('/sign-in')} style={{ background: 'transparent', color: G, border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>Login</button>
          <button onClick={() => navigate('/sign-up')} style={{ background: P, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>Start Free Trial</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: D, letterSpacing: '-0.04em', margin: '0 0 16px 0' }}>
            Predictable growth, <span style={{ color: 'var(--text-secondary)' }}>simple pricing</span>.
          </h1>
          <p style={{ fontSize: '1.05rem', color: G, maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
            Run audits, fix funnels, and scale ROAS without hiring an agency. Choose the plan that fits your growth stage.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'stretch' }}>
          <PricingCard 
            name="Starter"
            price="29"
            description="Perfect for solo founders and small operators running their own ads."
            features={[
              '10 full audits per month',
              'All 15 AI skill commands',
              'PDF reports (ZieAds branded)',
              '7-day report history loop',
              'Email support'
            ]}
            onSelect={handleSubscribe}
          />
          <PricingCard 
            name="Pro"
            price="79"
            description="Built for in-house teams scaling ad spend and internal operations."
            recommended={true}
            features={[
              '40 full audits per month',
              'White-label PDF reports',
              'Custom business name on reports',
              'Priority queue in peak hours',
              'API access (10K tokens/mo)',
              'Unlimited report history'
            ]}
            onSelect={handleSubscribe}
          />
          <PricingCard 
            name="Agency"
            price="199"
            description="For marketing agencies managing multiple ad accounts for clients."
            features={[
              'Unlimited full audits',
              'White-label + Custom Agency Logo PDF',
              'Up to 5 team seats included',
              'Client management dashboard',
              'Monthly aggregate client reports',
              'Premium dedicated support'
            ]}
            onSelect={handleSubscribe}
          />
        </div>

        {/* FAQ Teaser */}
        <div style={{ marginTop: 80, textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: G }}>
            Just want to see how bad your current ads are?{' '}
            <span style={{ color: D, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/')}>
              Run a free Quick Scan.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
