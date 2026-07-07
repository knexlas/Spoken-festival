/* =========================================================================
   render.mjs — pure (DOM-free) rendering helpers, shared by:
     - the browser (index.html) at runtime
     - the build script (build.mjs) for pre-rendering + SEO at deploy time
   Keeping these in one place means the page a crawler sees and the page a
   visitor sees are generated from the exact same code.
   ========================================================================= */

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

export function slotHtml(cityId, s, key){
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
          <div class="slot-photo">SPREKERFOTO</div>
          <div>
            <div class="slot-genre">${esc(s.genre)}</div>
            <p class="slot-blurb">${esc(s.blurb)}</p>
          </div>
        </div>
      </div>
    </div>`;
}

export function panelHtml(city, festival){
  const days = city.days.map((d, di) => `
    <div class="day">
      <div class="day-head"><span>${esc(d.day)}</span><span class="date">${esc(d.date)}</span></div>
      ${d.slots.map((s, si) => slotHtml(city.id, s, `${city.id}-${di}-${si}`)).join('')}
      <div class="day-end"></div>
    </div>`).join('');
  const facts = city.facts.map(f => `<div class="fact"><span class="k">${esc(f.k)}</span><span class="v">${esc(f.v)}</span></div>`).join('');
  const practical = city.practical.map(p => `<div class="cell"><span class="k">${esc(p.k)}</span><span class="v">${esc(p.v)}</span></div>`).join('');
  const info = city.info.map(p => `<p>${esc(p)}</p>`).join('');
  const tickets = city.tickets.map(t => `
    <div class="ticket">
      <div style="flex:1;"><div class="tier">${esc(t.tier)}</div><div class="note">${esc(t.note)}</div></div>
      <div class="price">${esc(t.price)}</div>
      <a class="buy" href="${esc(city.ticketUrl)}">Koop</a>
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
          <div class="eyebrow"><span class="mark">SPOKEN</span><span class="line"></span><span class="yr">${esc(festival.year)}</span></div>
          ${festival.subtitle ? `<p class="hero-subtitle">${esc(festival.subtitle)}</p>` : ''}
          <div class="title-wrap">
            <div class="title-echo two" aria-hidden="true">${esc(city.name)}</div>
            <div class="title-echo" aria-hidden="true">${esc(city.name)}</div>
            <h1 class="title">${esc(city.name)}</h1>
          </div>
          <p class="tagline">${esc(city.tagline)}</p>
          <div class="meta-row"><span>${esc(city.dates)}</span><span class="dot"></span><span class="venue">${esc(city.venue)}</span></div>
          <div class="cta-row">
            <a class="btn-tickets" href="${esc(city.ticketUrl)}">Tickets</a>
            <span class="twin">${esc(city.twin)}</span>
          </div>
        </header>

        <section>
          <div class="sec-head"><h2>Programma</h2><span class="line"></span><span class="hint">KLIK VOOR INFO</span></div>
          ${days}
        </section>

        <section>
          <div class="sec-head"><h2>Info</h2><span class="line"></span></div>
          <div class="info-grid">
            <div class="info-text">${info}</div>
            <div class="info-facts">${facts}</div>
          </div>
        </section>

        <section>
          <div class="sec-head"><h2>Praktisch</h2><span class="line"></span></div>
          <div class="practical">${practical}</div>
        </section>

        <section id="tickets">
          <div class="sec-head"><h2>Tickets</h2><span class="line"></span></div>
          <div class="tickets-list">${tickets}</div>
          <div class="foot"><span>SPOKEN · ${esc(city.name)}</span><span>${esc(city.dates)}</span></div>
        </section>
      </div>
    </div>

    <div class="edge"></div>
    <div class="rail">
      <div class="mark">SPOKEN</div>
      <div class="mid"><div class="vname">${esc(city.name)}</div></div>
      <div class="botcue"><span>${esc(city.dates)}</span><span class="cue">${esc(city.railCue)}</span></div>
    </div>
  </section>`;
}

export function renderPanels(data){
  return data.cities.map(c => panelHtml(c, data.festival)).join('');
}
