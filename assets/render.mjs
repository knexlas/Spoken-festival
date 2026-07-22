/* =========================================================================
   render.mjs — pure (DOM-free) rendering helpers, shared by:
     - the browser (index.html) at runtime
     - the build script (build.mjs) for pre-rendering + SEO at deploy time
   Keeping these in one place means the page a crawler sees and the page a
   visitor sees are generated from the exact same code.

   SINGLE SOURCE OF TRUTH for the programme: each artist's `performances`
   list in content/artiesten.json (city, day, start/end time, stage, genre,
   blurb). The per-city programme lists AND the blokkenschema (timetable
   grid) are derived from it at render time — there is deliberately no
   second editable copy of any time anywhere, so nothing can drift out of
   sync. Festival days are defined once in content/festival.json (`days`),
   shared by both cities.
   ========================================================================= */

export const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

export const DEFAULT_LABELS = {
  programma: 'Programma', nieuws: 'Nieuws', info: 'Info', praktisch: 'Praktisch',
  affiches: 'Affiches', tickets: 'Tickets', klikVoorInfo: 'KLIK VOOR INFO',
  verbergInfo: 'VERBERG INFO', ticketsKnop: 'Tickets', koopKnop: 'Koop',
  fotoVolgt: 'FOTO VOLGT', meerOver: 'meer over',
  hintBeweeg: 'beweeg naar links of rechts', hintKlik: 'klik een stad',
  blokkenschema: 'Blokkenschema', ookTeZien: 'Ook te zien',
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

/* ---- derive the per-city programme (day list with sorted slots) ---- */
export const deriveDays = (data, cityId) => {
  const perfs = cityPerformances(data, cityId);
  return ((data && data.days) || [])
    .map(d => ({
      id: d.id, day: d.label, date: d.date,
      slots: perfs.filter(p => p.day === d.id)
        .sort((a, b) => (parseTime(a.time) ?? 9999) - (parseTime(b.time) ?? 9999)),
    }))
    .filter(d => d.slots.length);
};

function slotHtml(s, key, ctx, cityId, dayId){
  const artist = ctx.byName[String(s.artist || '').trim()];
  const photo = artist && artist.photo
    ? `<div class="slot-photo has-img"><img src="${esc(artist.photo)}" alt="${esc(s.artist)}" loading="lazy"></div>`
    : `<div class="slot-photo">${esc(ctx.labels.fotoVolgt)}</div>`;
  const bio = artist && artist.bio ? `<p class="slot-bio">${esc(artist.bio)}</p>` : '';
  const link = artist && artist.link
    ? `<a class="slot-artist-link" href="${esc(artist.link)}" target="_blank" rel="noopener">${esc(ctx.labels.meerOver)} ${esc(s.artist)} →</a>` : '';

  // cross-reference: where else does this artist perform (other city/day/time)?
  const others = ((artist && artist.performances) || [])
    .filter(p => !(p.city === cityId && p.day === dayId && p.time === s.time))
    .map(p => `${esc(ctx.cityNames[p.city] || p.city)} · ${esc(ctx.dayLabels[p.day] || p.day)} ${esc(p.time)}`);
  const elsewhere = others.length
    ? `<div class="slot-elsewhere">${esc(ctx.labels.ookTeZien)}: ${others.join(' — ')}</div>` : '';

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
            ${link}
          </div>
        </div>
      </div>
    </div>`;
}

/* ---- blokkenschema: one timetable grid per festival day (stages as
   columns, half-hour rows); blocks span from start to end time ---- */
function schemaSection(city, ctx){
  const dayGrids = ((ctx.data && ctx.data.days) || []).map(d => {
    const perfs = cityPerformances(ctx.data, city.id)
      .filter(p => p.day === d.id)
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
      <div class="schema-day">
        <div class="day-head"><span>${esc(d.label)}</span><span class="date">${esc(d.date)}</span></div>
        <div class="schema-scroll">
          <div class="schema" style="grid-template-columns:48px repeat(${stages.length},minmax(150px,1fr));grid-template-rows:auto repeat(${nRows},24px);">
            ${headers}${times}${blocks}
          </div>
        </div>
      </div>`;
  }).join('');

  if (!dayGrids.trim()) return '';
  return `
        <section>
          <div class="sec-head"><h2>${esc(ctx.labels.blokkenschema)}</h2><span class="line"></span></div>
          ${dayGrids}
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

export function panelHtml(city, ctx){
  const { festival, labels } = ctx;
  const cityDays = deriveDays(ctx.data, city.id);
  const days = cityDays.map((d, di) => `
    <div class="day">
      <div class="day-head"><span>${esc(d.day)}</span><span class="date">${esc(d.date)}</span></div>
      ${d.slots.map((s, si) => slotHtml(s, `${city.id}-${di}-${si}`, ctx, city.id, d.id)).join('')}
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
${schemaSection(city, ctx)}
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
    data,
    festival: data.festival,
    labels: labelSet(data),
    byName: artistIndex(data),
    news: data.news || { posts: [], posters: [] },
    cityNames: Object.fromEntries((data.cities || []).map(c => [c.id, c.name])),
    dayLabels: Object.fromEntries((data.days || []).map(d => [d.id, d.label])),
  };
  return data.cities.map(c => panelHtml(c, ctx)).join('');
}
