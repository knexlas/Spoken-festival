/* =========================================================================
   render.mjs — pure (DOM-free) rendering helpers, shared by:
     - the browser (index.html) at runtime
     - the build script (build.mjs) for pre-rendering + SEO at deploy time
   Keeping these in one place means the page a crawler sees and the page a
   visitor sees are generated from the exact same code.

   Everything text-like comes out of the content files: festival name,
   section headings and button labels (data.labels, with the defaults below
   as fallback), artist photos/bios (joined by name from data.artists), and
   the news posts + poster gallery (data.news). Nothing user-facing is
   hardcoded here except structure.
   ========================================================================= */

export const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

export const DEFAULT_LABELS = {
  programma: 'Programma', nieuws: 'Nieuws', info: 'Info', praktisch: 'Praktisch',
  affiches: 'Affiches', tickets: 'Tickets', klikVoorInfo: 'KLIK VOOR INFO',
  verbergInfo: 'VERBERG INFO', ticketsKnop: 'Tickets', koopKnop: 'Koop',
};

export const labelSet = data => ({ ...DEFAULT_LABELS, ...(data && data.labels ? data.labels : {}) });

export const artistIndex = data =>
  Object.fromEntries(((data && data.artists) || [])
    .filter(a => a && a.name)
    .map(a => [String(a.name).trim(), a]));

function slotHtml(s, key, ctx){
  const artist = ctx.byName[String(s.artist || '').trim()];
  const photo = artist && artist.photo
    ? `<div class="slot-photo has-img"><img src="${esc(artist.photo)}" alt="${esc(s.artist)}" loading="lazy"></div>`
    : `<div class="slot-photo">FOTO VOLGT</div>`;
  const bio = artist && artist.bio ? `<p class="slot-bio">${esc(artist.bio)}</p>` : '';
  const link = artist && artist.link
    ? `<a class="slot-artist-link" href="${esc(artist.link)}" target="_blank" rel="noopener">meer over ${esc(s.artist)} →</a>` : '';
  return `
    <div class="slot" data-key="${key}">
      <div class="slot-row" data-toggle="${key}">
        <span class="slot-time">${esc(s.time)}</span>
        <span class="slot-artist">${esc(s.artist)}</span>
        <span class="slot-stage">${esc(s.stage)}</span>
        <span class="slot-chev" data-chev="${key}">+</span>
      </div>
      <div class="slot-body" data-body="${key}">
        <div class="slot-inner">
          ${photo}
          <div>
            <div class="slot-genre">${esc(s.genre)}</div>
            <p class="slot-blurb">${esc(s.blurb)}</p>
            ${bio}
            ${link}
          </div>
        </div>
      </div>
    </div>`;
}

function newsSection(ctx){
  const posts = (ctx.news && ctx.news.posts) || [];
  if (!posts.length) return '';
  const items = posts.map(p => `
    <article class="news-item">
      <div class="news-date">${esc(p.date)}</div>
      <h3 class="news-title">${esc(p.title)}</h3>
      ${String(p.body || '').split(/\n+/).filter(Boolean).map(par => `<p class="news-par">${esc(par)}</p>`).join('')}
      ${p.image ? `<img class="news-img" src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">` : ''}
    </article>`).join('');
  return `
        <section>
          <div class="sec-head"><h2>${esc(ctx.labels.nieuws)}</h2><span class="line"></span></div>
          ${items}
          <div class="day-end"></div>
        </section>`;
}

function postersSection(ctx){
  const posters = (ctx.news && ctx.news.posters) || [];
  if (!posters.length) return '';
  const items = posters.map(p => `
    <figure class="poster">
      <img src="${esc(p.image)}" alt="${esc(p.caption || 'affiche')}" loading="lazy">
      ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}
    </figure>`).join('');
  return `
        <section>
          <div class="sec-head"><h2>${esc(ctx.labels.affiches)}</h2><span class="line"></span></div>
          <div class="posters">${items}</div>
        </section>`;
}

export function panelHtml(city, ctx){
  const { festival, labels } = ctx;
  const days = city.days.map((d, di) => `
    <div class="day">
      <div class="day-head"><span>${esc(d.day)}</span><span class="date">${esc(d.date)}</span></div>
      ${d.slots.map((s, si) => slotHtml(s, `${city.id}-${di}-${si}`, ctx)).join('')}
      <div class="day-end"></div>
    </div>`).join('');
  const facts = city.facts.map(f => `<div class="fact"><span class="k">${esc(f.k)}</span><span class="v">${esc(f.v)}</span></div>`).join('');
  const practical = city.practical.map(p => `<div class="cell"><span class="k">${esc(p.k)}</span><span class="v">${esc(p.v)}</span></div>`).join('');
  const info = city.info.map(p => `<p>${esc(p)}</p>`).join('');
  const tickets = city.tickets.map(t => `
    <div class="ticket">
      <div style="flex:1;"><div class="tier">${esc(t.tier)}</div><div class="note">${esc(t.note)}</div></div>
      <div class="price">${esc(t.price)}</div>
      <a class="buy" href="${esc(city.ticketUrl)}">${esc(labels.koopKnop)}</a>
    </div>`).join('');

  return `
  <section class="panel" data-id="${city.id}" data-side="${city.side}">
    <div class="fog-a"></div>
    <div class="fog-b"></div>
    <div class="wisps">
      <span style="left:14%;bottom:8%;width:110px;height:110px;filter:blur(26px);animation:wisp 17s ease-in-out infinite;animation-delay:0s;"></span>
      <span style="left:42%;bottom:4%;width:80px;height:80px;filter:blur(22px);animation:wisp 21s ease-in-out infinite;animation-delay:5s;"></span>
      <span style="left:68%;bottom:12%;width:130px;height:130px;filter:blur(30px);animation:wisp 25s ease-in-out infinite;animation-delay:9s;"></span>
      <span style="left:86%;bottom:2%;width:70px;height:70px;filter:blur(20px);animation:wisp 19s ease-in-out infinite;animation-delay:13s;"></span>
    </div>

    <div class="scroll">
      <div class="content">
        <header class="hero">
          <div class="eyebrow"><span class="mark">${esc(festival.name)}</span><span class="line"></span><span class="yr">${esc(festival.year)}</span></div>
          ${festival.subtitle ? `<p class="hero-subtitle">${esc(festival.subtitle)}</p>` : ''}
          <div class="title-wrap">
            <div class="title-echo two" aria-hidden="true">${esc(city.name)}</div>
            <div class="title-echo" aria-hidden="true">${esc(city.name)}</div>
            <h1 class="title">${esc(city.name)}</h1>
          </div>
          <p class="tagline">${esc(city.tagline)}</p>
          <div class="meta-row"><span>${esc(city.dates)}</span><span class="dot"></span><span class="venue">${esc(city.venue)}</span></div>
          <div class="cta-row">
            <a class="btn-tickets" href="${esc(city.ticketUrl)}">${esc(labels.ticketsKnop)}</a>
            <span class="twin">${esc(city.twin)}</span>
          </div>
        </header>

        <section>
          <div class="sec-head"><h2>${esc(labels.programma)}</h2><span class="line"></span><span class="expand-hint" data-toggle-all="${city.id}">${esc(labels.klikVoorInfo)}</span></div>
          ${days}
        </section>
${newsSection(ctx)}
        <section>
          <div class="sec-head"><h2>${esc(labels.info)}</h2><span class="line"></span></div>
          <div class="info-grid">
            <div class="info-text">${info}</div>
            <div class="info-facts">${facts}</div>
          </div>
        </section>

        <section>
          <div class="sec-head"><h2>${esc(labels.praktisch)}</h2><span class="line"></span></div>
          <div class="practical">${practical}</div>
        </section>
${postersSection(ctx)}
        <section id="tickets">
          <div class="sec-head"><h2>${esc(labels.tickets)}</h2><span class="line"></span></div>
          <div class="tickets-list">${tickets}</div>
          <div class="foot"><span>${esc(festival.name)} · ${esc(city.name)}</span><span>${esc(city.dates)}</span></div>
        </section>
      </div>
    </div>

    <div class="edge"></div>
    <div class="rail">
      <div class="mark">${esc(festival.name)}</div>
      <div class="mid"><div class="vname">${esc(city.name)}</div></div>
      <div class="botcue"><span>${esc(city.dates)}</span><span class="cue">${esc(city.railCue)}</span></div>
    </div>
  </section>`;
}

export function renderPanels(data){
  const ctx = {
    festival: data.festival,
    labels: labelSet(data),
    byName: artistIndex(data),
    news: data.news || { posts: [], posters: [] },
  };
  return data.cities.map(c => panelHtml(c, ctx)).join('');
}
