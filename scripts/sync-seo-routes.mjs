/*
  Keeps vercel.json in step with the prerendered public pages (src/seo/seo.ts).
  Run after adding a public page or a docs page:  npm run build && node scripts/sync-seo-routes.mjs
  Every prerendered path gets an explicit rewrite to its HTML file; every other path gets the app shell.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { SEO_ROUTES } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-prerender.js')).href);
const file = path.join(root, 'vercel.json');
const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
const api = cfg.rewrites.filter((r) => r.destination === '/api');
const pages = SEO_ROUTES.filter((r) => r.path !== '/' && r.path !== '/mcp' && r.path !== '/api').map((r) => ({ source: r.path, destination: `${r.path}/index.html` }));
cfg.rewrites = [...api, ...pages, { source: '/(.*)', destination: '/app.html' }];
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
console.log(`[seo] vercel.json: ${pages.length} prerendered pages, app shell for everything else`);
