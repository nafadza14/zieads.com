/* SEO comparison pages: /vs/metricool, /vs/vista-social, /vs/hootsuite (spec 12) */
import { Link, Navigate, useParams } from 'react-router-dom';
import PublicShell from './landing/PublicShell';
import { VS_PAGES } from './landing/compare';

export default function VsPage() {
  const { slug } = useParams();
  const page = VS_PAGES.find((p) => p.slug === slug);
  if (!page) return <Navigate to="/#comparison" replace />;
  return (
    <PublicShell title={`${page.title} | ZieAds`} description={page.description}>
      <h1>ZieAds vs {page.name}</h1>
      <p className="ps-lede">{page.intro}</p>

      <h2>What {page.name} does well</h2>
      <ul>
        {page.theyDoWell.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2>Where ZieAds is different</h2>
      <ul>
        {page.whereZieAdsDiffers.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2>Side by side</h2>
      <table className="ps-table">
        <thead>
          <tr>
            <th />
            <th>{page.name}</th>
            <th>ZieAds</th>
          </tr>
        </thead>
        <tbody>
          {page.rows.map((r) => (
            <tr key={r.criteria}>
              <td>{r.criteria}</td>
              <td>{r.them}</td>
              <td>{r.zieads}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ps-note">
        {page.name} facts come from its public pages, checked in November 2026. Plans change, so check the sources:{' '}
        {page.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ', '}
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </span>
        ))}
        .
      </p>

      <div className="ps-box">
        <h3 style={{ marginTop: 0 }}>Try ZieAds free</h3>
        <p style={{ margin: '0 0 12px' }}>One brand, a weekly briefing, 20 scheduled posts a month and the Instagram and Facebook inbox. No credit card.</p>
        <Link to="/sign-up" className="ps-btn" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#fff' }}>
          Start free
        </Link>
      </div>
      <p className="ps-note">
        Other comparisons:{' '}
        {VS_PAGES.filter((p) => p.slug !== page.slug).map((p, i) => (
          <span key={p.slug}>
            {i > 0 && ', '}
            <Link to={`/vs/${p.slug}`}>ZieAds vs {p.name}</Link>
          </span>
        ))}
      </p>
    </PublicShell>
  );
}
