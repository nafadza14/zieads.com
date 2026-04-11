import { useNavigate } from 'react-router-dom';

const P = '#7B2FBE'; // primary purple
const PL = '#F1E9FA'; // light purple
const D = '#1e293b'; // dark text
const G = '#64748b'; // gray text

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
      background: '#fff',
      border: `2px solid ${recommended ? P : '#e2e8f0'}`,
      borderRadius: 16,
      padding: 32,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: recommended ? '0 10px 40px -10px rgba(123,47,190,0.15)' : 'none',
      transform: recommended ? 'scale(1.02)' : 'none'
    }}>
      {recommended && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: P, color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Most Popular
        </div>
      )}
      
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: recommended ? P : D, marginBottom: 8, marginTop: 0 }}>{name}</h3>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: D, marginBottom: 8, letterSpacing: '-0.02em' }}>${price}<span style={{ fontSize: '1.2rem', color: G, fontWeight: 500 }}>/mo</span></div>
      <p style={{ fontSize: '0.9rem', color: G, marginBottom: 24, lineHeight: 1.5 }}>{description}</p>
      
      <button 
        onClick={onSelect}
        style={{ width: '100%', background: recommended ? P : '#fff', color: recommended ? '#fff' : D, border: `1px solid ${recommended ? P : '#cbd5e1'}`, padding: '12px 0', borderRadius: 8, fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginBottom: 32, transition: 'all 0.2s' }}
        onMouseOver={(e) => { if (!recommended) e.currentTarget.style.borderColor = P; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseOut={(e) => { if (!recommended) e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'none' }}
      >
        Get Started
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: D, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Includes:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.9rem', color: D }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
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
    // Navigate to Auth page with context, or to Stripe Checkout (simulated here)
    navigate('/sign-up');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 32, height: 32, background: P, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Z</div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: D, letterSpacing: '-0.03em' }}>ZieAds</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => navigate('/sign-in')} style={{ background: 'transparent', color: G, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Login</button>
          <button onClick={() => navigate('/sign-up')} style={{ background: P, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Start Free Trial</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: D, letterSpacing: '-0.04em', margin: '0 0 16px 0' }}>
            Predictable growth, <span style={{ color: P }}>simple pricing</span>.
          </h1>
          <p style={{ fontSize: '1.2rem', color: G, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Run audits, fix funnels, and scale ROAS without hiring an agency. Choose the plan that fits your growth stage.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'center' }}>
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
          <p style={{ fontSize: '1rem', color: G }}>
            Just want to see how bad your current ads are? <span style={{ color: P, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/')}>Run a free Quick Scan.</span>
          </p>
        </div>
      </main>
    </div>
  );
}
