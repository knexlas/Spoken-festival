/* =========================================================================
   render.mjs — pure (DOM-free) rendering helpers, shared by:
     - the browser (index.html) at runtime
     - the build script (build.mjs) for pre-rendering + SEO at deploy time
   Keeping these in one place means the page a crawler sees and the page a
   visitor sees are generated from the exact same code.

   SINGLE SOURCE OF TRUTH for the programme: each artist's `performances`
   list in content/artiesten.json. The per-city programme lists AND the
   blokkenschema are derived from it at render time. Festival days are
   defined once in content/festival.json (`days`), shared by both cities.

   V3 DESIGN (illustrated identity): the hand-painted artwork layers below
   (face backdrop, hero figures, interludes, the SPOKEN wordmark whose "O"
   is a living eye) are design constants, not CMS content — they are the
   festival's visual identity, like the fonts.
   ========================================================================= */

export const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

export const DEFAULT_LABELS = {
  programma: 'Programma', nieuws: 'Nieuws', info: 'Info', praktisch: 'Praktisch',
  affiches: 'Affiches', tickets: 'Tickets', klikVoorInfo: 'KLIK VOOR INFO',
  verbergInfo: 'VERBERG INFO', ticketsKnop: 'Tickets', koopKnop: 'Koop',
  fotoVolgt: 'PORTRET', meerOver: 'meer over',
  hintBeweeg: 'beweeg naar links of rechts', hintKlik: 'klik een stad',
  blokkenschema: 'Blokkenschema', ookTeZien: 'Ook te zien',
  footerTag: 'GRIEZELFESTIVAL', introKnop: 'KLIK OM BINNEN TE GAAN',
  introGeluid: 'TIK VOOR GELUID',
  subprogramma: 'Subprogramma',
};

/* v3 artwork per city (hand-painted illustrations, client-supplied) */
export const ART = {
  wordmark: 'assets/img/wordmark.png',
  eyeFrames: ['assets/img/eye-half.png', 'assets/img/eye-75.png', 'assets/img/eye-closed.png'],
  face: 'assets/img/gezicht.jpg',
  ant: { fig: 'assets/img/spook5.png', fig2: 'assets/img/spook2.png', fig3: 'assets/img/spook3.png', facePos: 'left top' },
  kor: { fig: 'assets/img/spook1.png', fig2: 'assets/img/spook4.png', fig3: null, facePos: 'right top' },
};

export const labelSet = data => ({ ...DEFAULT_LABELS, ...(data && data.labels ? data.labels : {}) });

export const artistIndex = data =>
  Object.fromEntries(((data && data.artists) || [])
    .filter(a => a && a.name)
    .map(a => [String(a.name).trim(), a]));

/* ---- time helpers: "HH:MM" → minutes. Times before 06:00 count as after
   midnight (a 00:30 slot belongs to the same festival night as 23:00). ---- */
export const parseTime = t => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim());
  if (!m) return null;
  let v = (+m[1]) * 60 + (+m[2]);
  if (v < 360) v += 1440;
  return v;
};
const fmtTime = v => {
  const w = ((v % 1440) + 1440) % 1440;
  return String(Math.floor(w / 60)).padStart(2, '0') + ':' + String(w % 60).padStart(2, '0');
};

/* ---- every performance in one city, tagged with its artist's name ---- */
export const cityPerformances = (data, cityId) =>
  ((data && data.artists) || []).flatMap(a =>
    ((a && a.performances) || [])
      .filter(p => p && p.city === cityId)
      .map(p => ({ ...p, artist: a.name })));

/* ---- the per-city programme: one time-sorted list of performances.
   The festival is a single day, so there is no day grouping. ---- */
export const cityProgramme = (data, cityId) =>
  cityPerformances(data, cityId)
    .sort((a, b) => (parseTime(a.time) ?? 9999) - (parseTime(b.time) ?? 9999));

function slotHtml(s, key, ctx, cityId){
  const artist = ctx.byName[String(s.artist || '').trim()];
  const photo = artist && artist.photo
    ? `<div class="slot-photo has-img"><img src="${esc(artist.photo)}" alt="${esc(s.artist)}" loading="lazy"></div>`
    : `<div class="slot-photo">${esc(ctx.labels.fotoVolgt)}</div>`;
  const bio = artist && artist.bio ? `<p class="slot-bio">${esc(artist.bio)}</p>` : '';
  const link = artist && artist.link
    ? `<a class="slot-artist-link" href="${esc(artist.link)}" target="_blank" rel="noopener">${esc(ctx.labels.meerOver)} ${esc(s.artist)} →</a>` : '';

  // cross-reference: where else does this artist perform (other city / time)?
  const others = ((artist && artist.performances) || [])
    .filter(p => !(p.city === cityId && p.time === s.time))
    .map(p => `${esc(ctx.cityNames[p.city] || p.city)} · ${esc(p.time)}`);
  const elsewhere = others.length
    ? `<div class="slot-elsewhere">${esc(ctx.labels.ookTeZien)}: ${others.join(' — ')}</div>` : '';

  // sub-programme: a nested, further-collapsible list of items within a slot
  const sub = Array.isArray(s.subprogram) ? s.subprogram.filter(i => i && (i.title || i.text)) : [];
  const subHtml = sub.length ? `
            <div class="subprog">
              <div class="subprog-head">${esc(ctx.labels.subprogramma)}</div>
              ${sub.map((it, j) => `
              <div class="subitem">
                <button type="button" class="subitem-row" data-subtoggle="${key}-${j}">
                  <span class="subitem-title">${esc(it.title || '')}</span>
                  ${it.time ? `<span class="subitem-time">${esc(it.time)}</span>` : ''}
                  <span class="subitem-chev" data-subchev="${key}-${j}">+</span>
                </button>
                <div class="subitem-body" data-subbody="${key}-${j}">
                  ${String(it.text || '').split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')}
                </div>
              </div>`).join('')}
            </div>` : '';

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
            ${elsewhere}
            ${subHtml}
            ${link}
          </div>
        </div>
      </div>
    </div>`;
}

/* ---- blokkenschema: one timetable grid per city (stages as columns,
   half-hour rows); blocks span from start to end time. Single festival day. ---- */
function schemaSection(city, ctx){
  const perfs = cityPerformances(ctx.data, city.id)
    .map(p => {
      const start = parseTime(p.time);
      if (start == null) return null;
      let end = parseTime(p.end);
      if (end == null || end <= start) end = start + 60;
      return { ...p, start, end };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
  if (!perfs.length) return '';

  const stages = [...new Set(perfs.map(p => p.stage))];
  const rangeStart = Math.floor(Math.min(...perfs.map(p => p.start)) / 30) * 30;
  const rangeEnd = Math.ceil(Math.max(...perfs.map(p => p.end)) / 30) * 30;
  const nRows = Math.max(1, (rangeEnd - rangeStart) / 30);

  const headers = stages.map((st, i) =>
    `<div class="schema-stage" style="grid-column:${i + 2};grid-row:1;">${esc(st)}</div>`).join('');

  let times = '';
  for (let v = Math.ceil(rangeStart / 60) * 60; v < rangeEnd; v += 60) {
    times += `<div class="schema-time" style="grid-column:1;grid-row:${(v - rangeStart) / 30 + 2};">${fmtTime(v)}</div>`;
  }

  const blocks = perfs.map(p => {
    const col = stages.indexOf(p.stage) + 2;
    const row = Math.round((p.start - rangeStart) / 30) + 2;
    const span = Math.max(1, Math.round((p.end - p.start) / 30));
    return `<div class="schema-block" style="grid-column:${col};grid-row:${row} / span ${span};">
        <span class="t">${esc(p.time)}–${fmtTime(p.end)}</span>
        <span class="n">${esc(p.artist)}</span>
      </div>`;
  }).join('');

  return `
        <section>
          <div class="sec-head"><h2>${esc(ctx.labels.blokkenschema)}</h2><span class="line"></span></div>
          <div class="schema-day">
            <div class="schema-scroll">
              <div class="schema" style="grid-template-columns:48px repeat(${stages.length},minmax(150px,1fr));grid-template-rows:auto repeat(${nRows},24px);">
                ${headers}${times}${blocks}
              </div>
            </div>
          </div>
        </section>`;
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

/* ---- figure interlude: painted ghost tucked between two sections ---- */
function interlude(src, align, deg, dur){
  if (!src) return '';
  return `
        <div class="interlude" aria-hidden="true">
          <div class="interlude-fig" style="background-image:url('${esc(src)}');${align === 'right' ? 'right:4%;background-position:right center;' : 'left:4%;background-position:left center;'}transform:rotate(${deg}deg);animation-duration:${dur}s;"></div>
        </div>`;
}

export function panelHtml(city, ctx){
  const { festival, labels } = ctx;
  const art = ART[city.id] || {};
  // single flat, time-sorted programme (no day grouping — one-day festival)
  const slots = cityProgramme(ctx.data, city.id);
  const days = slots.length ? `
    <div class="day">
      ${slots.map((s, si) => slotHtml(s, `${city.id}-${si}`, ctx, city.id)).join('')}
      <div class="day-end"></div>
    </div>` : '';
  const practical = city.practical.map(p => `<div class="cell"><span class="k">${esc(p.k)}</span><span class="v">${esc(p.v)}</span></div>`).join('');
  const info = (city.info || []).map(p => `<p>${esc(p)}</p>`).join('');
  const tickets = city.tickets.map(t => `
    <div class="ticket">
      <div style="flex:1;"><div class="tier">${esc(t.tier)}</div><div class="note">${esc(t.note)}</div></div>
      <div class="price">${esc(t.price)}</div>
      <a class="buy" href="${esc(city.ticketUrl)}">${esc(labels.koopKnop)}</a>
    </div>`).join('');
  const footerLine = [festival.name, labels.footerTag, city.name].filter(Boolean).map(esc).join(' · ');

  return `
  <section class="panel" data-id="${city.id}" data-side="${city.side}">
    <div class="face-bg" style="background-position:${esc(art.facePos || 'center top')};"></div>
    <div class="panel-fig" data-fig style="background-image:url('${esc(art.fig || '')}');"></div>

    <div class="scroll" data-scroll>
      <div class="content">
        <header class="hero">
          <div class="hero-scrim"></div>
          <div class="masthead">
            <span class="masthead-eyebrow">${esc([festival.name, labels.footerTag].filter(Boolean).join(' · '))}</span>
            <span class="line"></span>
            <span class="masthead-date">${esc(festival.shortDate || festival.year)}</span>
          </div>
          ${festival.subtitle ? `<p class="hero-subtitle">${esc(festival.subtitle)}</p>` : ''}
          <div class="title-wrap">
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
${interlude(art.fig2, city.side === 'left' ? 'right' : 'left', city.side === 'left' ? -2 : 2, 11)}
${schemaSection(city, ctx)}
${newsSection(ctx)}
        <section>
          <div class="sec-head"><h2>${esc(labels.info)}</h2><span class="line"></span></div>
          <div class="info-grid">
            <div class="info-text">${info}</div>
          </div>
        </section>

        <section>
          <div class="sec-head"><h2>${esc(labels.praktisch)}</h2><span class="line"></span></div>
          <div class="practical">${practical}</div>
        </section>
${postersSection(ctx)}
${interlude(art.fig3, 'left', 1.5, 13)}
        <section id="tickets">
          <div class="sec-head"><h2>${esc(labels.tickets)}</h2><span class="line"></span></div>
          <div class="tickets-list">${tickets}</div>
          <div class="foot"><span>${footerLine}</span><span>${esc(city.dates)}</span></div>
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
    data,
    festival: data.festival,
    labels: labelSet(data),
    byName: artistIndex(data),
    news: data.news || { posts: [], posters: [] },
    cityNames: Object.fromEntries((data.cities || []).map(c => [c.id, c.name])),
  };
  return data.cities.map(c => panelHtml(c, ctx)).join('');
}
