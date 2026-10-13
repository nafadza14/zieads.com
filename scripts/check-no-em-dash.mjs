#!/usr/bin/env node
/*
  ZieAds writing rule guard.
  The em dash (U+2014) and en dash (U+2013) are banned across the whole product:
  UI copy, AI prompts, emails, legal pages, comments, everything.

  Runs automatically before every build (npm "prebuild").
    node scripts/check-no-em-dash.mjs         -> fails if any file contains one
    node scripts/check-no-em-dash.mjs --fix   -> replaces them with plain punctuation
*/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DIRS = ['src', 'server', 'api', 'public', 'scripts', 'extension', 'sql', 'supabase', 'PRD'];
const FILES = ['index.html', 'README.md', 'CLAUDE.md', 'AGENTS.md', 'metadata.json'];
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json', '.md', '.sql', '.txt', '.svg']);
const SKIP = new Set(['node_modules', 'dist', '.git', '.vercel']);
const BANNED = /[\u2014\u2013]/;

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
}

const fix = (text) =>
  text
    .replace(/(['"`>])\s*[\u2014\u2013]\s*(['"`<])/g, '$1-$2') // lone dash used as an empty value
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, '$1-$2') // ranges such as 3-5
    .replace(/[ \t]*[\u2014\u2013][ \t]*/g, ' - '); // everything else

const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);
for (const f of FILES) if (fs.existsSync(path.join(ROOT, f))) files.push(path.join(ROOT, f));

const doFix = process.argv.includes('--fix');
const hits = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!BANNED.test(text)) continue;
  if (doFix) {
    fs.writeFileSync(file, fix(text));
    hits.push(`${path.relative(ROOT, file)} (fixed)`);
    continue;
  }
  text.split('\n').forEach((line, i) => {
    if (BANNED.test(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}  ${line.trim().slice(0, 120)}`);
  });
}

if (!hits.length) {
  console.log('[no-em-dash] OK: no em dash or en dash found.');
  process.exit(0);
}
if (doFix) {
  console.log(`[no-em-dash] Fixed ${hits.length} file(s):\n  ${hits.join('\n  ')}`);
  process.exit(0);
}
console.error(`[no-em-dash] The em dash and en dash are banned in ZieAds. Found ${hits.length}:\n  ${hits.join('\n  ')}`);
console.error('[no-em-dash] Rewrite with a comma, period, colon or hyphen, or run: node scripts/check-no-em-dash.mjs --fix');
process.exit(1);
