/*
  ZieAds developer docs at /docs, laid out like GitBook: top bar with search, grouped sidebar,
  article with breadcrumb, on this page outline, previous and next links.
*/
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight, Menu, Search, X } from 'lucide-react';
import ZieAdsLogo, { ZieAdsWordmark } from '../../components/ZieAdsLogo';
import { DOCS, GROUPS, DocPage } from './pages';
import './docs.css';

const href = (p: DocPage) => (p.slug ? `/docs/${p.slug}` : '/docs');

function useToc(dep: string) {
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);
  const [active, setActive] = useState('');
  useEffect(() => {
    const hs = Array.from(document.querySelectorAll<HTMLHeadingElement>('.dc-article h2[id]'));
    setItems(hs.map((h) => ({ id: h.id, text: h.childNodes[0]?.textContent || h.textContent || '' })));
    setActive(hs[0]?.id || '');
    // Highlights the section being read in the outline, so the reader knows where they are
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px' }
    );
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [dep]);
  return { items, active };
}

function SearchBox({ onPick }: { onPick: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return DOCS.slice(0, 8);
    const words = t.split(/\s+/);
    return DOCS.map((p) => {
      const hay = `${p.title} ${p.nav || ''} ${p.group} ${p.description} ${p.keywords || ''} ${p.slug}`.toLowerCase();
      const score = words.every((w) => hay.includes(w)) ? (p.title.toLowerCase().includes(t) ? 2 : 1) : 0;
      return { p, score };
    })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.p)
      .slice(0, 8);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 10);
    else {
      setQ('');
      setSel(0);
    }
  }, [open]);

  const go = (p: DocPage) => {
    setOpen(false);
    onPick();
    navigate(href(p));
  };

  return (
    <>
      <button type="button" className="dc-search-btn" onClick={() => setOpen(true)} aria-label="Search the docs">
        <Search size={15} />
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>
      {/* Portal: the sticky top bar uses backdrop-filter, which would trap a fixed overlay inside it */}
      {open &&
        createPortal(
        <div className="dc dc-search-layer" role="dialog" aria-modal="true" aria-label="Search the docs" onClick={() => setOpen(false)}>
          <div className="dc-search-panel" onClick={(e) => e.stopPropagation()}>
            <div className="dc-search-input">
              <Search size={16} />
              <input
                ref={input}
                value={q}
                placeholder="Search the docs"
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSel((s) => Math.min(results.length - 1, s + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSel((s) => Math.max(0, s - 1));
                  } else if (e.key === 'Enter' && results[sel]) go(results[sel]);
                }}
                aria-label="Search"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search">
                <X size={16} />
              </button>
            </div>
            <div className="dc-search-results">
              {results.length === 0 ? (
                <p className="dc-search-empty">No pages match. Try MCP, key or posts.</p>
              ) : (
                results.map((p, i) => (
                  <button key={p.slug} type="button" className={i === sel ? 'is-sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => go(p)}>
                    <small>{p.group}</small>
                    <strong>{p.title}</strong>
                    <span>{p.description}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}

export default function DocsPage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
  const idx = DOCS.findIndex((p) => p.slug === slug);
  const page = DOCS[idx];
  const [menu, setMenu] = useState(false);
  const { items, active } = useToc(slug);

  useEffect(() => {
    document.title = page ? `${page.nav || page.title} | ZieAds Docs` : 'Not found | ZieAds Docs';
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
    }
    m.setAttribute('content', page?.description || 'ZieAds developer docs');
    if (location.hash) {
      setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 50);
    } else window.scrollTo(0, 0);
    setMenu(false);
  }, [slug]);

  const prev = idx > 0 ? DOCS[idx - 1] : null;
  const next = idx >= 0 && idx < DOCS.length - 1 ? DOCS[idx + 1] : null;

  return (
    <div className="dc">
      <header className="dc-top">
        <div className="dc-top-in">
          <button type="button" className="dc-menu" onClick={() => setMenu(true)} aria-label="Open navigation">
            <Menu size={18} />
          </button>
          <Link to="/docs" className="dc-brand">
            <ZieAdsLogo size={24} />
            <span><ZieAdsWordmark /></span>
            <em>Docs</em>
          </Link>
          <SearchBox onPick={() => setMenu(false)} />
          <nav className="dc-top-links">
            <Link to="/">Website</Link>
            <Link to="/settings/api" className="dc-top-cta">
              Get API key
            </Link>
          </nav>
        </div>
      </header>

      <div className="dc-body">
        {menu && <div className="dc-backdrop" onClick={() => setMenu(false)} />}
        <aside className={`dc-side ${menu ? 'is-open' : ''}`} aria-label="Docs navigation">
          <div className="dc-side-head">
            <span>Contents</span>
            <button type="button" onClick={() => setMenu(false)} aria-label="Close navigation">
              <X size={16} />
            </button>
          </div>
          {GROUPS.map((g) => (
            <div key={g} className="dc-side-group">
              <div className="dc-side-title">{g}</div>
              {DOCS.filter((p) => p.group === g).map((p) => (
                <Link key={p.slug} to={href(p)} className={`dc-side-link ${p.slug === slug ? 'is-on' : ''} ${p.slug.includes('/') ? 'is-sub' : ''}`} aria-current={p.slug === slug ? 'page' : undefined}>
                  {p.nav || p.title}
                </Link>
              ))}
            </div>
          ))}
        </aside>

        <main className="dc-main">
          {page ? (
            <article className="dc-article" key={slug}>
              <div className="dc-crumb">
                <span>{page.group}</span>
                {page.nav && page.nav !== page.title && (
                  <>
                    <ChevronRight size={12} />
                    <span>{page.nav}</span>
                  </>
                )}
              </div>
              <h1>{page.title}</h1>
              <p className="dc-lead">{page.description}</p>
              {page.body()}
              <nav className="dc-pn" aria-label="Previous and next page">
                {prev ? (
                  <Link to={href(prev)} className="dc-pn-card">
                    <small>
                      <ArrowLeft size={12} /> Previous
                    </small>
                    <strong>{prev.nav || prev.title}</strong>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link to={href(next)} className="dc-pn-card is-next">
                    <small>
                      Next <ArrowRight size={12} />
                    </small>
                    <strong>{next.nav || next.title}</strong>
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
              <footer className="dc-foot">
                Questions? Email <a href="mailto:founder@zieads.com">founder@zieads.com</a>
              </footer>
            </article>
          ) : (
            <article className="dc-article">
              <h1>Page not found</h1>
              <p className="dc-lead">
                This page moved or never existed. Start at the <Link to="/docs">introduction</Link> or press Ctrl K to search.
              </p>
            </article>
          )}
        </main>

        <aside className="dc-toc" aria-label="On this page">
          {items.length > 0 && (
            <>
              <div className="dc-toc-title">On this page</div>
              {items.map((t) => (
                <a key={t.id} href={`#${t.id}`} className={active === t.id ? 'is-on' : ''}>
                  {t.text}
                </a>
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
