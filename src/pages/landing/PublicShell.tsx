/* Navbar + footer for public pages outside the landing page (data deletion, comparison pages). */
import { ReactNode, useEffect } from 'react';
import './lx/lx.css';
import LxNav from './lx/LxNav';
import LxFooter from './lx/LxFooter';

export default function PublicShell({ children, title, description }: { children: ReactNode; title: string; description?: string }) {
  useEffect(() => {
    document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'description');
        document.head.appendChild(m);
      }
      m.setAttribute('content', description);
    }
    window.scrollTo(0, 0);
  }, [title, description]);
  return (
    <div className="lx">
      <LxNav />
      <main className="ps-main">{children}</main>
      <LxFooter />
      <style>{`
        .ps-main { max-width: 880px; margin: 0 auto; padding: 120px 20px 72px; color: #111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .ps-main h1 { font-size: clamp(30px, 4vw, 44px); line-height: 1.1; letter-spacing: -0.03em; font-weight: 700; margin: 0 0 14px; }
        .ps-main h2 { font-size: 22px; letter-spacing: -0.02em; font-weight: 650; margin: 36px 0 10px; }
        .ps-main h3 { font-size: 16px; font-weight: 650; margin: 22px 0 6px; }
        .ps-main p, .ps-main li { font-size: 15.5px; line-height: 1.65; color: #404040; }
        .ps-main ul, .ps-main ol { padding-left: 22px; }
        .ps-main a { color: #c2410c; }
        .ps-lede { font-size: 18px !important; color: #505050 !important; max-width: 680px; }
        .ps-box { margin: 22px 0; padding: 20px 22px; border: 1px solid #ececec; border-radius: 16px; background: #fff; }
        .ps-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14.5px; }
        .ps-table th, .ps-table td { text-align: left; padding: 11px 10px; border-bottom: 1px solid #ececec; vertical-align: top; }
        .ps-table th { font-weight: 650; color: #111; background: #fafafa; }
        .ps-table td:first-child { font-weight: 600; color: #111; }
        .ps-input { height: 42px; padding: 0 14px; border: 1px solid #e2e2e2; border-radius: 10px; font: inherit; font-size: 15px; min-width: 240px; }
        .ps-btn { height: 42px; padding: 0 18px; border: none; border-radius: 10px; background: #f26522; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
        .ps-note { font-size: 13.5px !important; color: #717171 !important; }
        @media (max-width: 640px) { .ps-table { font-size: 13px; } .ps-input { min-width: 0; width: 100%; } }
      `}</style>
    </div>
  );
}
