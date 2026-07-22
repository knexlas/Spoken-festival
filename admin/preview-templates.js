/* =========================================================================
   SPOKEN — custom preview TEMPLATES for the CMS editor.
   Renders the preview pane (beside the form) 1:1 like the public festival
   site, so editors see a real, on-brand preview while typing.

   Loaded from admin/index.html AFTER the Sveltia script. Uses the documented
   Sveltia/Decap API: CMS.registerPreviewTemplate(name, component) with the
   non-JSX globals `h` (React.createElement) and `createClass`. See:
   https://sveltiacms.app/en/docs/api/preview-templates

   HANDOFF NOTE (for Claude Code): these were written against the documented
   API but not verified against a live CMS in this environment. Boot /admin on
   a Netlify deploy (or a local server with "Work with Local Repository") and
   verify each collection's preview renders; the field key paths below match
   admin/config.yml. Sveltia warns preview-template compat is partial — if a
   prop misbehaves, check entry.getIn / widgetsFor against the console.
   ========================================================================= */
(function () {
  'use strict';

  var TEAL   = '#8ec8d8';   // Antwerpen — chalk blue (koud spook)
  var AMBER  = '#e0703f';   // Kortrijk — burnt orange (warm spook)
  var YELLOW = '#e6d33b';   // shared scrawl yellow
  var FG     = '#efe9dd';
  var MUT    = '#93897a';
  var LINE   = 'rgba(239,233,221,0.16)';
  var F_DISP = "'Amatic SC', cursive";
  var F_BODY = "'Space Grotesk', system-ui, sans-serif";
  var F_MONO = "'Space Mono', monospace";

  // Immutable -> plain JS (safe on undefined / already-plain values)
  function toJS(v) { return v && typeof v.toJS === 'function' ? v.toJS() : v; }
  function val(entry, key) { var v = entry.getIn(['data', key]); return v && v.toJS ? v.toJS() : v; }

  function boot() {
    if (!(window.CMS && window.h && window.createClass)) { return setTimeout(boot, 60); }
    var h = window.h, createClass = window.createClass;

    var wrap = { padding: '30px 32px', fontFamily: F_BODY, color: FG, lineHeight: 1.6 };
    var eyebrow = function (acc) {
      return { fontFamily: F_MONO, fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: acc };
    };
    var title = function () {
      return { fontFamily: F_DISP, fontWeight: 700, fontSize: '64px', lineHeight: 0.9, letterSpacing: '0.02em', margin: '10px 0 12px', color: '#f6f0e4' };
    };

    /* ISO datetime -> readable "31-10-2026 19:00" */
    function fmtDate(iso) {
      var m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(iso || ''));
      return m ? m[3] + '-' + m[2] + '-' + m[1] + ' ' + m[4] + ':' + m[5] : (iso || '—');
    }

    /* Every editable field must be visible SOMEWHERE in the preview — fields
       that only feed Google/social/site-chrome get a labelled meta-block, so
       editors see their edit landed and know what it is used for. */
    function metaBlock(caption, rows) {
      return h('div', { style: { marginTop: '22px', border: '1px solid ' + LINE, borderRadius: '2px', padding: '14px 16px' } },
        h('div', { style: { fontFamily: F_MONO, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: MUT, marginBottom: '10px' } }, caption),
        rows.map(function (r, i) {
          return h('div', { key: i, style: { display: 'flex', gap: '14px', padding: '5px 0', fontFamily: F_MONO, fontSize: '11.5px', borderTop: i ? '1px solid ' + LINE : 'none' } },
            h('span', { style: { color: MUT, minWidth: '170px', flexShrink: 0 } }, r[0]),
            h('span', { style: { color: FG, overflowWrap: 'anywhere' } }, (r[1] === undefined || r[1] === null || r[1] === '') ? '—' : String(r[1]))
          );
        })
      );
    }

    /* ---------- CITY (Antwerpen / Kortrijk) ---------- */
    function CityPreview(acc) {
      return createClass({
        render: function () {
          var e = this.props.entry;
          var facts = toJS(e.getIn(['data', 'facts'])) || [];
          var tickets = toJS(e.getIn(['data', 'tickets'])) || [];
          var info = toJS(e.getIn(['data', 'info'])) || [];
          var practical = toJS(e.getIn(['data', 'practical'])) || [];
          return h('div', { style: wrap },
            h('div', { style: eyebrow(acc) }, 'SPOKEN · 2026'),
            h('h1', { style: title() }, val(e, 'name') || 'Stad'),
            h('p', { style: { fontStyle: 'italic', fontSize: '17px', color: MUT, maxWidth: '34ch', margin: '0 0 18px' } }, val(e, 'tagline') || ''),
            h('div', { style: { display: 'flex', gap: '18px', fontFamily: F_MONO, fontSize: '11px', letterSpacing: '0.06em', color: MUT, paddingBottom: '18px', borderBottom: '1px solid ' + LINE } },
              h('span', {}, val(e, 'venue') || ''),
              h('span', { style: { color: acc } }, val(e, 'dates') || '')
            ),
            facts.length ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '26px', margin: '20px 0', fontFamily: F_MONO } },
              facts.map(function (f, i) {
                return h('div', { key: i },
                  h('div', { style: { fontSize: '22px', color: acc } }, f.v),
                  h('div', { style: { fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: MUT, marginTop: '3px' } }, f.k)
                );
              })
            ) : null,
            info.map(function (p, i) {
              return h('p', { key: i, style: { fontSize: '15px', lineHeight: 1.65, color: FG, maxWidth: '60ch' } }, p);
            }),
            practical.length ? h('div', { style: { marginTop: '20px' } },
              h('div', { style: eyebrow(acc) }, 'PRAKTISCH'),
              h('div', { style: { marginTop: '8px' } },
                practical.map(function (p, i) {
                  return h('div', { key: i, style: { display: 'flex', gap: '14px', padding: '9px 0', borderTop: '1px solid ' + LINE, fontSize: '13px' } },
                    h('span', { style: { fontFamily: F_MONO, fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: acc, minWidth: '130px', flexShrink: 0, paddingTop: '2px' } }, p.k),
                    h('span', { style: { color: FG } }, p.v)
                  );
                })
              )
            ) : null,
            tickets.length ? h('div', { style: { marginTop: '18px' } },
              tickets.map(function (t, i) {
                return h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', border: '1px solid ' + LINE, borderRadius: '2px', marginBottom: '10px' } },
                  h('span', { style: { fontFamily: F_DISP, fontSize: '20px', flex: 1, color: '#f6f0e4' } }, t.tier),
                  t.note ? h('span', { style: { fontFamily: F_MONO, fontSize: '11px', color: MUT } }, t.note) : null,
                  h('span', { style: { fontFamily: F_MONO, fontSize: '16px', color: acc } }, t.price)
                );
              })
            ) : null,
            metaBlock('Kleine site-onderdelen & technisch', [
              ['Stad (adres, voor Google)', [val(e, 'addressLocality'), val(e, 'addressCountry')].filter(Boolean).join(', ')],
              ['Verwijzing andere stad', val(e, 'twin')],
              ['Zijbalktekst (desktop)', val(e, 'railCue')],
              ['Ticket-link', val(e, 'ticketUrl')]
            ])
          );
        }
      });
    }

    /* ---------- FESTIVAL SETTINGS ---------- */
    var FestivalPreview = createClass({
      render: function () {
        var e = this.props.entry, getAsset = this.props.getAsset;
        var fest = val(e, 'festival') || {};
        var days = toJS(e.getIn(['data', 'days'])) || [];
        var labels = val(e, 'labels') || {};
        var shareAsset = fest.shareImage && getAsset ? getAsset(fest.shareImage) : null;
        var labelRows = Object.keys(labels).map(function (k) { return [k, labels[k]]; });
        return h('div', { style: wrap },
          h('div', { style: eyebrow(TEAL) }, 'FESTIVAL-INSTELLINGEN'),
          h('h1', { style: title() }, fest.name || 'SPOKEN'),
          fest.subtitle ? h('p', { style: { fontStyle: 'italic', fontSize: '18px', color: MUT, maxWidth: '40ch', margin: '0 0 20px' } }, fest.subtitle) : null,
          h('div', { style: { display: 'flex', gap: '10px', margin: '6px 0 22px' } },
            days.map(function (d, i) {
              return h('div', { key: i, style: { border: '1px solid ' + LINE, borderRadius: '2px', padding: '10px 16px', fontFamily: F_MONO } },
                h('div', { style: { fontSize: '15px', color: TEAL } }, d.label),
                h('div', { style: { fontSize: '11px', color: MUT, marginTop: '3px' } }, d.date),
                h('div', { style: { fontSize: '9px', letterSpacing: '0.1em', color: MUT, marginTop: '5px', opacity: 0.7 } }, 'code: ' + (d.id || '—'))
              );
            })
          ),
          fest.shortDate ? h('div', { style: { fontFamily: F_DISP, fontWeight: 700, fontSize: '30px', letterSpacing: '0.08em', color: YELLOW, transform: 'rotate(-2deg)', margin: '2px 0 14px' } }, fest.shortDate) : null,
          fest.description ? h('p', { style: { fontSize: '14px', lineHeight: 1.6, color: MUT, maxWidth: '60ch', marginTop: '10px', paddingTop: '18px', borderTop: '1px solid ' + LINE } }, fest.description) : null,

          metaBlock('Voor Google & delen — niet als gewone tekst op de site', [
            ['Jaar (editie)', fest.year],
            ['Startdatum & -tijd', fmtDate(fest.startDate)],
            ['Einddatum & -tijd', fmtDate(fest.endDate)],
            ['Organisator', fest.organizer],
            ['Website-adres', fest.siteUrl],
            ['Taal/regio', fest.locale]
          ]),
          shareAsset ? h('div', { style: { marginTop: '12px' } },
            h('div', { style: { fontFamily: F_MONO, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: MUT, marginBottom: '8px' } }, 'Deelafbeelding (bij delen op social media)'),
            h('img', { src: shareAsset.url || shareAsset.toString(), style: { maxWidth: '320px', width: '100%', border: '1px solid ' + LINE, borderRadius: '2px' } })
          ) : null,

          labelRows.length ? metaBlock('Teksten & knoppen — koppen en knopteksten zoals ze op de site staan', labelRows) : null
        );
      }
    });

    /* ---------- ARTIESTEN & OPTREDENS ---------- */
    var ArtistsPreview = createClass({
      render: function () {
        var e = this.props.entry, getAsset = this.props.getAsset;
        var artists = toJS(e.getIn(['data', 'artists'])) || [];
        return h('div', { style: wrap },
          h('div', { style: eyebrow(TEAL) }, 'PROGRAMMA · ' + artists.length + ' ARTIESTEN'),
          artists.map(function (a, i) {
            var perfs = a.performances || [];
            var asset = a.photo && getAsset ? getAsset(a.photo) : null;
            return h('div', { key: i, style: { padding: '20px 0', borderTop: '1px solid ' + LINE, display: 'flex', gap: '18px' } },
              h('div', { style: { width: '96px', height: '72px', flexShrink: 0, border: '1px solid ' + LINE, borderRadius: '2px', overflow: 'hidden', backgroundImage: asset ? 'none' : 'repeating-linear-gradient(45deg,' + LINE + ' 0 1px, transparent 1px 9px)' } },
                asset ? h('img', { src: asset.url, style: { width: '100%', height: '100%', objectFit: 'cover' } }) : null
              ),
              h('div', { style: { flex: 1 } },
                h('div', { style: { fontFamily: F_DISP, fontSize: '26px', color: '#f6f0e4' } }, a.name),
                perfs.map(function (p, j) {
                  var acc = p.city === 'kor' ? AMBER : TEAL;
                  return h('div', { key: j, style: { marginTop: '8px' } },
                    h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '12px', fontFamily: F_MONO, fontSize: '12px', flexWrap: 'wrap' } },
                      h('span', { style: { color: acc, letterSpacing: '0.06em' } }, (p.city === 'kor' ? 'KORTRIJK' : 'ANTWERPEN') + ' · ' + String(p.day || '?').toUpperCase()),
                      h('span', { style: { color: MUT } }, (p.time || '') + (p.end ? '–' + p.end : '')),
                      p.stage ? h('span', { style: { color: FG } }, p.stage) : null,
                      p.genre ? h('span', { style: { color: MUT } }, p.genre) : null
                    ),
                    p.blurb ? h('p', { style: { fontSize: '12.5px', lineHeight: 1.5, color: MUT, maxWidth: '52ch', margin: '4px 0 0' } }, p.blurb) : null
                  );
                }),
                a.bio ? h('p', { style: { fontSize: '13px', lineHeight: 1.55, color: MUT, maxWidth: '52ch', marginTop: '8px' } }, a.bio) : null,
                a.link ? h('a', { href: a.link, style: { display: 'inline-block', fontFamily: F_MONO, fontSize: '11px', letterSpacing: '0.08em', color: TEAL, marginTop: '6px' } }, 'meer over ' + (a.name || '') + ' →') : null
              )
            );
          })
        );
      }
    });

    /* ---------- NIEUWS & AFFICHES ---------- */
    var NewsPreview = createClass({
      render: function () {
        var e = this.props.entry, getAsset = this.props.getAsset;
        var posts = toJS(e.getIn(['data', 'posts'])) || [];
        var posters = toJS(e.getIn(['data', 'posters'])) || [];
        return h('div', { style: wrap },
          h('div', { style: eyebrow(TEAL) }, 'NIEUWS'),
          posts.map(function (p, i) {
            var asset = p.image && getAsset ? getAsset(p.image) : null;
            return h('div', { key: i, style: { padding: '20px 0', borderTop: '1px solid ' + LINE } },
              h('div', { style: { fontFamily: F_MONO, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: MUT } }, p.date || ''),
              h('h2', { style: { fontFamily: F_DISP, fontWeight: 700, fontSize: '34px', letterSpacing: '0.02em', margin: '8px 0', color: '#f6f0e4' } }, p.title || ''),
              asset ? h('img', { src: asset.url, style: { maxWidth: '440px', width: '100%', border: '1px solid ' + LINE, borderRadius: '2px', margin: '4px 0 10px' } }) : null,
              (p.body || '').split('\n\n').map(function (par, k) {
                return h('p', { key: k, style: { fontSize: '15px', lineHeight: 1.6, color: FG, maxWidth: '60ch' } }, par);
              })
            );
          }),
          posters.length ? h('div', { style: { marginTop: '24px' } },
            h('div', { style: eyebrow(TEAL) }, 'AFFICHES'),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '16px', marginTop: '12px' } },
              posters.map(function (po, i) {
                var asset = po.image && getAsset ? getAsset(po.image) : null;
                return h('figure', { key: i, style: { margin: 0 } },
                  asset ? h('img', { src: asset.url, style: { width: '100%', border: '1px solid ' + LINE, borderRadius: '2px' } }) : null,
                  po.caption ? h('figcaption', { style: { fontFamily: F_MONO, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: MUT, marginTop: '8px' } }, po.caption) : null
                );
              })
            )
          ) : null
        );
      }
    });

    // Register per collection / collection-file name (must match config.yml)
    window.CMS.registerPreviewTemplate('festival', FestivalPreview);
    window.CMS.registerPreviewTemplate('antwerpen', CityPreview(TEAL));
    window.CMS.registerPreviewTemplate('kortrijk', CityPreview(AMBER));
    window.CMS.registerPreviewTemplate('artiesten', ArtistsPreview);
    window.CMS.registerPreviewTemplate('nieuws', NewsPreview);
  }

  boot();
})();
