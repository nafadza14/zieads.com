/* v4 landing navbar: logo, five links, Log in and Start free. Turns solid after scrolling. */
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ZieAdsLogo from '../../../components/ZieAdsLogo';
import { LxButton } from './kit';

export const NAV_LINKS = [
  { id: 'features', label: 'Product' },
  { id: 'how', label: 'How it works' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

export default function LxNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  const go = useCallback(
    (id: string) => {
      setOpen(false);
      if (location.pathname !== '/') return navigate(`/#${id}`);
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    },
    [location.pathname, navigate],
  );

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 16);
      const probe = window.innerHeight * 0.35;
      let cur = '';
      for (const l of NAV_LINKS) {
        const el = document.getElementById(l.id);
        if (el && el.getBoundingClientRect().top <= probe) cur = l.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lx-nav ${solid || open ? 'is-solid' : ''}`}>
      <div className="lx-wrap lx-nav-in">
        <Link to="/" className="lx-brand" aria-label="ZieAds home">
          <ZieAdsLogo size={28} />
          zieads
        </Link>
        <nav className="lx-links" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <button key={l.id} type="button" className={active === l.id ? 'is-active' : ''} onClick={() => go(l.id)}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="lx-nav-cta">
          <LxButton variant="ghost" size="sm" onClick={() => navigate('/sign-in')}>
            Log in
          </LxButton>
          <LxButton variant="orange" size="sm" onClick={() => navigate('/sign-up')}>
            Start free
          </LxButton>
          <button type="button" className="lx-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      <div className={`lx-mobile ${open ? 'is-open' : ''}`}>
        {NAV_LINKS.map((l) => (
          <button key={l.id} type="button" className="lx-mlink" onClick={() => go(l.id)}>
            {l.label}
          </button>
        ))}
        <button type="button" className="lx-mlink" onClick={() => navigate('/sign-in')}>
          Log in
        </button>
        <LxButton variant="dark" block onClick={() => navigate('/sign-up')}>
          Start free
        </LxButton>
      </div>
    </header>
  );
}
