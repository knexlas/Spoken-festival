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
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { renderPanels, esc, cityPerformances, imgSrc } from './assets/render.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

/* ---- web-sized copies of every CMS upload ----
   Editors upload straight-off-the-camera photos (3000+ px, 3–5 MB) that the
   page shows at 128×96. Serving those originals is what burned the Netlify
   bandwidth, so every image in assets/uploads gets three WebP variants:
     thumb  400×300 cover  — programme tile
     med    max 900 px     — news images, posters, logos
     full   max 1600 px    — lightbox
   The filename carries a content hash, so a replaced photo gets a new URL and
   /assets/opt/* can be cached by browsers for a year (see netlify.toml).
   The originals are still deployed (and still what the CMS shows), but the
   page no longer links to them. */
const VARIANTS = {
  thumb: p => p.resize({ width: 400, height: 300, fit: 'outside', withoutEnlargement: true }).webp({ quality: 76 }),
  med:   p => p.resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }),
  full:  p => p.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }),
};
const images = {};
const uploadsDir = join(root, 'assets', 'uploads');
const optDir = join(dist, 'assets', 'opt');
mkdirSync(optDir, { recursive: true });
for (const file of existsSync(uploadsDir) ? readdirSync(uploadsDir) : []) {
  if (!/\.(jpe?g|png|webp|gif|tiff?)$/i.test(file)) continue;
  const buf = readFileSync(join(uploadsDir, file));
  const slug = file.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'img';
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const entry = {};
  try {
    for (const [size, encode] of Object.entries(VARIANTS)) {
      const name = `${slug}-${hash}-${size}.webp`;
      await encode(sharp(buf).rotate()).toFile(join(optDir, name));
      entry[size] = `/assets/opt/${name}`;
    }
  } catch (err) {
    // an unreadable upload must never block a deploy: the page falls back to the original
    console.warn(`⚠ could not resize ${file} (${err.message}) — serving the original`);
    continue;
  }
  images[`assets/uploads/${file}`] = entry;
}

const readJson = name => JSON.parse(readFileSync(join(root, 'content', name), 'utf8'));
const { festival, labels, days } = readJson('festival.json');
const data = {
  festival, labels: labels || {}, days: days || [],
  cities: [readJson('antwerpen.json'), readJson('kortrijk.json')],
  artists: readJson('artiesten.json').artists || [],
  news: readJson('nieuws.json'),
  images,
};
const f = data.festival;
const artistByName = Object.fromEntries(data.artists.filter(a => a && a.name).map(a => [String(a.name).trim(), a]));
const base = (f.siteUrl || '').replace(/\/$/, '');

// JSON safe to drop inside a <script> tag (prevents </script> breakout)
const safeJson = obj => JSON.stringify(obj).replace(/</g, '\\u003c');
const priceNum = p => (String(p).match(/[\d.,]+/) || ['0'])[0].replace(',', '.');
const absUrl = u => !u ? base + '/' : (u.startsWith('http') ? u : base + '/' + u.replace(/^\//, ''));

const cityNames = data.cities.map(c => c.name).join(' & ');
// "GRIEZELFESTIVAL" (labels.footerTag) → "Griezelfestival" for the page title
const rawTag = (data.labels.footerTag || 'Festival').trim();
const titleTag = rawTag.charAt(0).toUpperCase() + rawTag.slice(1).toLowerCase();
const pageTitle = `${f.name} · ${titleTag} — ${cityNames} · ${data.cities[0].dates}`;
const pageDesc = f.description;
const shareImg = absUrl(f.shareImage);

/* ---- JSON-LD: one fully-specified LiteraryEvent per city ---- */
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
  // programme is derived from the artists' performances (single source of truth)
  performer: [...new Set(cityPerformances(data, c.id).map(p => p.artist))].map(name => {
    const a = artistByName[String(name || '').trim()];
    return {
      '@type': 'Person', name,
      ...(a && a.photo ? { image: absUrl(imgSrc(data, a.photo, 'full')) } : {}),
      ...(a && a.bio ? { description: a.bio } : {}),
    };
  }),
  offers: c.tickets.map(t => ({
    '@type': 'Offer',
    name: t.tier,
    price: priceNum(t.price),
    priceCurrency: 'EUR',
    url: absUrl(c.ticketUrl),
    availability: 'https://schema.org/InStock',
    category: t.note,
    ...(f.ticketsFrom ? { validFrom: f.ticketsFrom } : {}),
  })),
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
  .replace('<!-- panels injected -->', renderPanels(data))
  // cache-bust the module import per deploy, so browsers holding an old
  // render.mjs never pair it with a newer page (mismatched exports = dead page)
  .replace("./assets/render.mjs", `./assets/render.mjs?v=${Date.now()}`);

/* ---- write dist ---- */
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
