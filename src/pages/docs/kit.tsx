/* Building blocks for the ZieAds docs (GitBook style): headings with anchors, code with copy and tabs,
   callouts, steps, tables, endpoint headers and parameter lists. */
import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Check, Copy, Info, Lightbulb, Link2 } from 'lucide-react';

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function H2({ children, id }: { children: string; id?: string }) {
  const a = id || slugify(children);
  return (
    <h2 id={a} className="dc-h2">
      {children}
      <a href={`#${a}`} className="dc-anchor" aria-label={`Link to ${children}`}>
        <Link2 size={14} />
      </a>
    </h2>
  );
}

export function H3({ children, id }: { children: ReactNode; id?: string }) {
  const a = id || (typeof children === 'string' ? slugify(children) : undefined);
  return (
    <h3 id={a} className="dc-h3">
      {children}
    </h3>
  );
}

export const P = ({ children }: { children: ReactNode }) => <p className="dc-p">{children}</p>;
export const C = ({ children }: { children: ReactNode }) => <code className="dc-ic">{children}</code>;
export const A = ({ to, children }: { to: string; children: ReactNode }) =>
  /^(https?:|mailto:)/.test(to) ? (
    <a className="dc-a" href={to} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link className="dc-a" to={to}>
      {children}
    </Link>
  );
export const Ul = ({ items }: { items: ReactNode[] }) => (
  <ul className="dc-ul">
    {items.map((x, i) => (
      <li key={i}>{x}</li>
    ))}
  </ul>
);

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="dc-copy"
      aria-label="Copy code"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        } catch {
          setOk(false);
        }
      }}
    >
      {ok ? <Check size={14} /> : <Copy size={14} />}
      <span>{ok ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

/** One code block, or several as tabs: [{ label: 'curl', code }, ...] */
export function Code({ code, lang, title, tabs }: { code?: string; lang?: string; title?: string; tabs?: { label: string; code: string }[] }) {
  const [i, setI] = useState(0);
  const list = tabs || [{ label: title || lang || 'Code', code: code || '' }];
  const cur = list[Math.min(i, list.length - 1)];
  return (
    <div className="dc-code">
      <div className="dc-code-bar">
        <div className="dc-code-tabs" role={list.length > 1 ? 'tablist' : undefined}>
          {list.map((t, n) =>
            list.length > 1 ? (
              <button key={t.label} type="button" role="tab" aria-selected={n === i} className={n === i ? 'is-on' : ''} onClick={() => setI(n)}>
                {t.label}
              </button>
            ) : (
              <span key={t.label}>{t.label}</span>
            )
          )}
        </div>
        <CopyBtn text={cur.code} />
      </div>
      <pre>
        <code>{cur.code}</code>
      </pre>
    </div>
  );
}

const CALLOUT_ICON = { info: Info, tip: Lightbulb, warning: AlertTriangle };
export function Callout({ type = 'info', title, children }: { type?: 'info' | 'tip' | 'warning'; title?: string; children: ReactNode }) {
  const I = CALLOUT_ICON[type];
  return (
    <div className={`dc-callout is-${type}`}>
      <I size={16} aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="dc-steps">
      {items.map((s, n) => (
        <li key={s.title}>
          <span className="dc-step-n" aria-hidden="true">
            {n + 1}
          </span>
          <div>
            <strong>{s.title}</strong>
            <div className="dc-step-body">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="dc-table-wrap">
      <table className="dc-table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Endpoint({ method, path, scope }: { method: 'GET' | 'POST'; path: string; scope: 'read' | 'draft' }) {
  return (
    <div className="dc-endpoint">
      <span className={`dc-method is-${method.toLowerCase()}`}>{method}</span>
      <code>{path}</code>
      <span className="dc-scope">scope: {scope}</span>
    </div>
  );
}

export type Param = { name: string; type: string; required?: boolean; desc: ReactNode };
export function Params({ title = 'Parameters', items }: { title?: string; items: Param[] }) {
  return (
    <div className="dc-params">
      <div className="dc-params-title">{title}</div>
      {items.map((p) => (
        <div key={p.name} className="dc-param">
          <div className="dc-param-head">
            <code>{p.name}</code>
            <span>{p.type}</span>
            {p.required && <em>required</em>}
          </div>
          <div className="dc-param-desc">{p.desc}</div>
        </div>
      ))}
    </div>
  );
}

export function Cards({ items }: { items: { title: string; desc: string; to: string }[] }) {
  return (
    <div className="dc-cards">
      {items.map((c) => (
        <Link key={c.to} to={c.to} className="dc-card">
          <strong>
            {c.title} <ArrowUpRight size={14} />
          </strong>
          <span>{c.desc}</span>
        </Link>
      ))}
    </div>
  );
}
