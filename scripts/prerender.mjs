/*
  Build step 3 of 3 (after the client build and the SSR build of src/entry-prerender.tsx).
  Writes a real HTML page for every public route so search engines and AI crawlers that do not run
  JavaScript still read the full content, plus sitemap.xml, llms.txt and llms-full.txt.
    dist/index.html            the landing page, prerendered
    dist/app.html              the empty app shell (vercel.json serves it for every app route)
    dist/<route>/index.html    every other public page
    dist/_prerender/mcp.html   /mcp and /api are served by the API function, which reads these
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssr = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-prerender.js')).href);
const { render, SEO_ROUTES, jsonLdFor, DOCS, VS_PAGES, faqItems, pricingPlans } = ssr;
const SITE = 'https://www.zieads.com';

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
// The plain shell for app routes: no landing content, not indexable
const shell = template
  .replace(/<meta name="description"[^>]*>/, '<meta name="robots" content="noindex" />\n    $&')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
fs.writeFileSync(path.join(dist, 'app.html'), shell);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const setMeta = (html, attr, key, value) => {
  const re = new RegExp(`<meta ${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" content="[^"]*"\\s*/?>`);
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

function page(route) {
  const url = `${SITE}${route.path === '/' ? '/' : route.path}`;
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`);
  html = setMeta(html, 'name', 'description', route.description);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`);
  html = setMeta(html, 'property', 'og:title', route.title);
  html = setMeta(html, 'property', 'og:description', route.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:type', route.kind === 'docs' ? 'article' : 'website');
  html = setMeta(html, 'name', 'twitter:title', route.title);
  html = setMeta(html, 'name', 'twitter:description', route.description);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
  html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(jsonLdFor(route)).replace(/</g, '\\u003c')}</script>\n  </head>`);
  const body = render(route.path);
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return { html, body };
}

const write = (rel, content) => {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const text = {};
for (const route of SEO_ROUTES) {
  const { html, body } = page(route);
  if (route.path === '/') write('index.html', html);
  else if (route.path === '/mcp' || route.path === '/api') write(`_prerender${route.path}.html`, html);
  else write(`${route.path.slice(1)}/index.html`, html);
  // Readable text for llms-full.txt: main content only, no navigation, no duplicated decorative labels
  const main = (body.match(/<main[\s\S]*<\/main>/) || body.match(/<article[\s\S]*<\/article>/) || [body])[0];
  text[route.path] = main
    .replace(/<(script|style|nav|footer|svg)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<span aria-hidden="true">[^<]*<\/span>/g, ' ')
    .replace(/<\/(p|h[1-6]|li|tr|div|section|blockquote)>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/* ── sitemap.xml ── */
const today = new Date().toISOString().slice(0, 10);
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SEO_ROUTES.map(
    (r) => `  <url><loc>${SITE}${r.path === '/' ? '/' : r.path}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority.toFixed(1)}</priority></url>`
  ).join('\n')}\n</urlset>\n`
);

/* ── llms.txt: the short map for AI assistants (llmstxt.org) ── */
const link = (r) => `- [${r.title.replace(/ \| ZieAds( Docs)?$/, '')}](${SITE}${r.path === '/' ? '/' : r.path}): ${r.description}`;
const by = (k) => SEO_ROUTES.filter((r) => r.kind === k);
const llms = `# ZieAds

> ZieAds is a social media tool that tells you what to do next. It schedules and publishes to Instagram, Facebook, TikTok, LinkedIn, Threads, YouTube, Pinterest, Bluesky, Mastodon, Telegram and Discord, puts comments and messages in one inbox, reports organic and ads results, and tracks competitors. Every morning it turns the numbers into three ranked actions, and Zie, the AI agent, prepares posts and replies that wait for the user's approval. It is free for one brand; paid plans are priced per brand, not per seat. ZieAds also works inside Claude and ChatGPT through its MCP server, and has a REST API.

Key facts:
- Made by PT. Banko Indonesia Technology. Website: ${SITE}
- Plans: ${pricingPlans.map((p) => `${p.tier} ${p.price}${p.period === 'forever' ? '' : ' a month'}`).join(', ')}. Brands per plan: Free 1, Starter 1, Pro 3, Agency 10, each brand in its own workspace.
- Nothing is posted, sent or spent without the user's approval. Ads accounts are read only.
- Official platform APIs only; no password sharing and no scraping of the user's accounts.

## Product
${[...by('home'), ...by('features'), ...by('pricing')].map(link).join('\n')}

## Compare
${by('vs').map(link).join('\n')}

## Developers
${by('dev').map(link).join('\n')}
${by('docs').map(link).join('\n')}

## Optional
${by('legal').map(link).join('\n')}
- [Full text for AI assistants](${SITE}/llms-full.txt): every public page as plain text
`;
write('llms.txt', llms);

/* ── llms-full.txt: the readable text of every public page ── */
const full = [
  '# ZieAds: full text of the public website',
  '',
  llms.split('\n## Product')[0].replace('# ZieAds\n', '').trim(),
  '',
  '## Frequently asked questions',
  ...faqItems.map((f) => `### ${f.q}\n${f.a}\n`),
  ...SEO_ROUTES.filter((r) => r.kind !== 'legal').map((r) => `\n---\n\n## ${r.title}\nURL: ${SITE}${r.path === '/' ? '/' : r.path}\n\n${text[r.path]}\n`),
].join('\n');
write('llms-full.txt', full);

const docsCount = DOCS.length, vsCount = VS_PAGES.length;
console.log(`[prerender] ${SEO_ROUTES.length} pages (${docsCount} docs, ${vsCount} comparisons), sitemap.xml, llms.txt, llms-full.txt`);
