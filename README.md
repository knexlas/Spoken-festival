# SPOKEN — festivalwebsite

Spookthema **literatuurfestival** (geen muziekfestival), één nacht, twee steden:
**Antwerpen** (koud spook) & **Kortrijk** (warm spook). Programma bestaat uit lezingen,
interviews, spoken word, poëzie en verhalen-performances — geen "artiesten"/"genres"
in muzikale zin. Statische website, gebouwd via `node build.mjs`.

## Structuur

```
index.html              ← bronpagina (layout, sfeer, interactie, paletten)
content/festival.json   ← thema + festivalgegevens/SEO-velden (bewerkt de organisatie)
content/antwerpen.json  ← alles voor Antwerpen: programma, info, praktisch, tickets
content/kortrijk.json   ← alles voor Kortrijk: idem
assets/render.mjs       ← rendering, gedeeld door de browser én de build
build.mjs               ← bouwt dist/ (pre-rendering + SEO) uit content/*.json
netlify.toml            ← Netlify: build = `node build.mjs`, publiceer dist/
dist/                   ← gegenereerde productieversie (NIET met de hand bewerken)
screenshots/            ← referentiebeelden
```

Drie aparte bestanden i.p.v. één grote: zo toont de CMS-editor drie overzichtelijke
items (Festival-instellingen, Antwerpen, Kortrijk) in plaats van één lange lijst.

- **Inhoud aanpassen** = de juiste `content/*.json` bewerken (of via de CMS op `/admin`).
  De pagina laadt deze bestanden bij het openen.
- **Kleurenthema kiezen** = het veld `"theme"` in `content/festival.json` (bv. `"necropolis"`),
  óf live uitproberen via de paletkiezer rechtsboven op de site. De 10 namen staan in
  `index.html` onder `const PALETTES` (spectraal, necropolis, maanlicht, vagevuur,
  ectoplasma, nevel, nachtschade, wierook, as, sint-elmsvuur).

## SEO — automatisch gegenereerd

Vindbaarheid is ingebouwd en blijft synchroon met de inhoud. `node build.mjs` leest
`content/festival.json`, `content/antwerpen.json` en `content/kortrijk.json`, en
genereert in `dist/`:

- **Pre-rendered HTML** — de lineup/tekst staat in de HTML zelf (niet enkel via JavaScript),
  zodat Google en social-bots de inhoud meteen zien.
- **JSON-LD `MusicEvent`** per stad (datums, locatie, line-up, ticketprijzen) → kans op
  rijke resultaten/evenement-weergave in Google.
- **Open Graph + Twitter-cards** → nette previews bij delen.
- **sitemap.xml** + **robots.txt** + **canonical** (www).

> **Later iets wijzigen?** Ja — pas gewoon de juiste `content/*.json` aan (of via de CMS).
> Bij elke Netlify-deploy draait de build opnieuw en worden titel, beschrijving, JSON-LD,
> OG-tags en sitemap **automatisch** opnieuw gegenereerd. Je hoeft nooit SEO-tags met de
> hand bij te werken. (Voeg later nog een echte `assets/og-image.jpg` van 1200×630 toe
> voor de deelpreview.)

Lokaal de productieversie bouwen + bekijken:

```
node build.mjs
python -m http.server 8000 --directory dist
```

## Lokaal bekijken (bron, snelste voor inhoud bewerken)

De `content/*.json`-bestanden worden via `fetch()` geladen, dus de site moet via een
webserver draaien (niet rechtstreeks `index.html` dubbelklikken). In deze map:

```
python -m http.server
```

Ga dan naar http://localhost:8000

## Mobiel

Onder 860px breed toont de site één stad tegelijk, met een tik-schakelaar onderaan
om tussen Antwerpen en Kortrijk te wisselen. Desktop houdt de split-screen (hover/klik).

---

## Hosting — opties voor www.spokenfestival.be

Doel: zo goedkoop mogelijk, met enkele foto's, en later een CMS. De site is **statisch**,
dus gratis statische hosting is goedkoper én eenvoudiger dan een eigen server.

| Optie | Kost | Voor | Tegen |
|-------|------|------|-------|
| **Cloudflare Pages** *(aanrader, snelheid)* | **€0** | Onbeperkte bandbreedte (top voor foto's), gratis SSL, snel EU-edge, eigen domein simpel | CMS-login vereist later een kleine OAuth-worker |
| **Netlify** *(aanrader, makkelijkste CMS)* | **€0** | Gratis SSL + domein, **Decap CMS werkt hier het vlotst** (Git Gateway) | 100 GB/mnd bandbreedte (ruim voldoende) |
| **GitHub Pages** | €0 | Simpel, gratis, eigen domein + SSL | Enkel statisch; CMS-login via externe OAuth |
| **Hetzner Webhosting** | ~€2–4/mnd | EU (Duitsland), **inclusief e-mail @spokenfestival.be**, statisch + PHP | Geen git-CMS standaard; bestanden via FTP/manueel |
| **Hetzner VPS (CX22)** | ~€4/mnd | Volledige controle, eigen EU-server | Jij beheert nginx/SSL/updates — overkill voor statisch |

### Aanbeveling
- **Puur de site, gratis & snel:** Cloudflare Pages of Netlify (€0). Kies **Netlify** als
  je het soepelste pad naar het CMS wil; **Cloudflare** voor maximale snelheid/bandbreedte.
- **Hetzner** is vooral interessant als je óók **e-mail op @spokenfestival.be** wil bundelen.
  Je kan ook splitsen: site gratis op Netlify/Cloudflare, e-mail apart.
- **Domein:** bij je huidige registrar de DNS laten wijzen naar de gekozen host
  (A-/CNAME-record of nameservers). `.be` werkt overal.

### Foto's
Optimaliseer naar WebP, < ~300 KB per beeld. Een handvol foto's draait overal vlot;
bij veel beeldmateriaal is Cloudflare's onbeperkte bandbreedte fijn.

### Deployen op Netlify (gekozen host)
De build is al geconfigureerd in `netlify.toml`, dus deployen is plug-and-play:
1. Zet deze map in een **GitHub-repo**.
2. Netlify → *Add new site* → *Import from GitHub* → kies de repo.
   Build command en publish-map worden automatisch uit `netlify.toml` gelezen
   (`node build.mjs` → `dist`).
3. *Domain settings* → voeg **www.spokenfestival.be** toe en wijs de DNS bij je
   registrar naar Netlify. SSL is gratis en automatisch.

Elke push naar GitHub (of straks elke CMS-bewerking) triggert een nieuwe build.

---

## CMS — Decap (opgezet, GitHub-login)

De visuele editor staat klaar op **`/admin`** (`admin/index.html` + `admin/config.yml`).
De editor toont drie items — **Festival-instellingen**, **Antwerpen**, **Kortrijk** —
elk met ingeklapte lijsten voor optredens/tickets/etc. (klik om open te vouwen), zodat
je nooit één lange pagina met alles tegelijk uitgeklapt ziet. Bij opslaan committeert
Decap naar de bijhorende `content/*.json` op GitHub, Netlify herbouwt, en de site
(incl. SEO) is bijgewerkt.

> **Waarom GitHub-login i.p.v. Netlify Identity/Git Gateway?** Netlify heeft Identity
> en Git Gateway in februari 2025 deprecated: bestaande koppelingen blijven werken,
> maar nieuwe zijn niet aanbevolen en functionele bugs worden niet meer opgelost.
> Bij het opzetten liep dit ook effectief vast met "Your Git Gateway backend is not
> returning valid settings" — een bekend, onopgelost probleem bij nieuwe sites.
> GitHub-login is de actief onderhouden weg.

**Activeren (eenmalig):**
1. **GitHub OAuth App aanmaken:** [github.com/settings/developers](https://github.com/settings/developers)
   → *New OAuth App*:
   - Homepage URL: `https://spokenfestival.netlify.app` (of je uiteindelijke domein)
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Bewaar de **Client ID** en genereer een **Client Secret**.
2. **In Netlify:** *Project configuration → Access & security → OAuth* → *Install provider*
   → **GitHub** → plak Client ID + Client Secret.
3. **Collaborators toevoegen:** op github.com/knexlas/Spoken-festival → *Settings →
   Collaborators* → nodig de GitHub-accounts van Vonk en Zonen uit (schrijftoegang).
   Zij hebben dus wel een (gratis) GitHub-account nodig.
4. Zij gaan naar `https://www.spokenfestival.be/admin/` en klikken **"Login with GitHub"**.

**Lokaal de editor testen** (zonder Netlify, met live opslaan naar je bestand):
```
npx decap-server          # in één terminal
python -m http.server 8000 # in een andere
```
Ga naar `http://localhost:8000/admin/` — `local_backend: true` laat je dan
rechtstreeks de `content/*.json`-bestanden bewerken.

**Afbeeldingen** die in de editor geüpload worden, komen in `assets/uploads/`
en worden mee gedeployed.
