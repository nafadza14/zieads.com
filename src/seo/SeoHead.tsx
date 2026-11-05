/*
  Keeps the head in step with the page when people navigate inside the app:
  title, description, canonical, Open Graph, structured data, and noindex on private app pages.
  The first load of a public page already has all of this from the prerendered HTML.
*/
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE, jsonLdFor, seoFor } from './seo';

function meta(attr: 'name' | 'property', key: string, value: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (value === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

export default function SeoHead() {
  const { pathname } = useLocation();
  useEffect(() => {
    const r = seoFor(pathname);
    if (!r) {
      // Private app pages: titles come from the page, and they stay out of search
      meta('name', 'robots', 'noindex');
      return;
    }
    const url = `${SITE}${r.path === '/' ? '/' : r.path}`;
    document.title = r.title;
    meta('name', 'robots', null);
    meta('name', 'description', r.description);
    meta('property', 'og:title', r.title);
    meta('property', 'og:description', r.description);
    meta('property', 'og:url', url);
    meta('name', 'twitter:title', r.title);
    meta('name', 'twitter:description', r.description);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify(jsonLdFor(r));
    document.head.appendChild(ld);
  }, [pathname]);
  return null;
}
