/* =========================================================================
   build.mjs — turns the source (index.html + content/*.json) into a
   production /dist that is fast AND findable:
     • pre-renders the city panels into the HTML (crawlers see real content)
     • inlines the data so the page needs no fetch
     • injects canonical + Open Graph/Twitter + JSON-LD LiteraryEvent (per city)
     • writes sitemap.xml + robots.txt
   Content lives in three CMS-friendly files (content/festival.json,
   content/antwerpen.json, content/kortrijk.json) so the Decap editor shows
   three focused entries instead of one giant one. Editing any of them (by
   hand or via the CMS) regenerates the SEO automatically — nothing to hand-tune.

   Run:  node build.mjs      Output:  dist/
   ========================================================================= */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPanels, esc } from './assets/render.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');

const readJson = name => JSON.parse(readFileSync(join(root, 'content', name), 'utf8'));
const { theme, festival } = readJson('festival.json');
const data = { theme, festival, cities: [readJson('antwerpen.json'), readJson('kortrijk.json')] };
const f = data.festival;
const base = (f.siteUrl || '').replace(/\/$/, '');

// JSON safe to drop inside a <script> tag (prevents </script> breakout)
const safeJson = obj => JSON.stringify(obj).replace(/</g, '\\u003c');
const priceNum = p => (String(p).match(/[\d.,]+/) || ['0'])[0].replace(',', '.');
const absUrl = u => !u ? base + '/' : (u.startsWith('http') ? u : base + '/' + u.replace(/^\//, ''));

const cityNames = data.cities.map(c => c.name).join(' & ');
const pageTitle = `${f.name} · Festival — ${cityNames} · ${data.cities[0].dates}`;
const pageDesc = f.description;
const shareImg = absUrl(f.shareImage);

/* ---- JSON-LD: one LiteraryEvent per city, sharing one Festival as superEvent ---- */
const festivalNode = {
  '@type': 'Festival',
  name: `${f.name} Festival ${f.year}`,
  startDate: f.startDate,
  endDate: f.endDate,
  url: base + '/',
};
const events = data.cities.map(c => ({
  '@context': 'https://schema.org',
  '@type': 'LiteraryEvent',
  name: `${f.name} — ${c.name}`,
  startDate: f.startDate,
  endDate: f.endDate,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  description: c.tagline,
  image: [shareImg],
  url: base + '/#' + c.id,
  location: {
    '@type': 'Place',
    name: c.venue,
    address: { '@type': 'PostalAddress', addressLocality: c.addressLocality, addressCountry: c.addressCountry },
  },
  organizer: { '@type': 'Organization', name: f.organizer, url: base + '/' },
  performer: c.days.flatMap(d => d.slots).map(s => ({ '@type': 'Person', name: s.artist })),
  offers: c.tickets.map(t => ({
    '@type': 'Offer',
    name: t.tier,
    price: priceNum(t.price),
    priceCurrency: 'EUR',
    url: absUrl(c.ticketUrl),
    availability: 'https://schema.org/InStock',
    category: t.note,
  })),
  superEvent: festivalNode,
}));

/* ---- head tags ---- */
const seo = `
<link rel="canonical" href="${base}/">
<meta name="robots" content="index,follow">
<meta property="og:site_name" content="${esc(f.name)}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(pageDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${base}/">
<meta property="og:locale" content="${esc(f.locale || 'nl_BE')}">
<meta property="og:image" content="${shareImg}">
<meta property="og:image:alt" content="${esc(f.name)} — ${esc(cityNames)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(pageTitle)}">
<meta name="twitter:description" content="${esc(pageDesc)}">
<meta name="twitter:image" content="${shareImg}">
<script type="application/ld+json">${safeJson(events)}</script>`;

/* ---- assemble index.html ---- */
let html = readFileSync(join(root, 'index.html'), 'utf8');
html = html
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(pageTitle)}</title>`)
  .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(pageDesc)}">`)
  .replace('<!-- BUILD:SEO -->', seo)
  .replace('<!-- BUILD:DATA -->', `<script>window.__SITE__=${safeJson(data)}</script>`)
  .replace('<!-- panels injected -->', renderPanels(data));

/* ---- write dist ---- */
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'index.html'), html);
cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
cpSync(join(root, 'content'), join(dist, 'content'), { recursive: true });
cpSync(join(root, 'admin'), join(dist, 'admin'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) cpSync(join(root, 'screenshots'), join(dist, 'screenshots'), { recursive: true });

writeFileSync(join(dist, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`);

writeFileSync(join(dist, 'robots.txt'),
`User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`);

console.log(`✓ Built dist/ — ${data.cities.length} cities, ${events.reduce((n, e) => n + e.performer.length, 0)} performers in JSON-LD`);
