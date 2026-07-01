# SPOKEN — festivalwebsite

Eén nacht, twee steden: **Antwerpen** (koud spook) & **Kortrijk** (warm spook).
Statische website, geen build-stap, geen framework. Klaar om later een CMS op te zetten.

## Structuur

```
index.html          ← bronpagina (layout, sfeer, interactie, paletten)
content/site.json   ← ALLE inhoud die de organisatie bewerkt (lineup, tickets, info, SEO-velden…)
assets/render.mjs   ← rendering, gedeeld door de browser én de build
build.mjs           ← bouwt dist/ (pre-rendering + SEO) uit site.json
netlify.toml        ← Netlify: build = `node build.mjs`, publiceer dist/
dist/               ← gegenereerde productieversie (NIET met de hand bewerken)
screenshots/        ← referentiebeelden
```

- **Inhoud aanpassen** = `content/site.json` bewerken. De pagina laadt dit bestand bij het openen.
- **Kleurenthema kiezen** = het veld `"theme"` bovenaan `site.json` (bv. `"necropolis"`),
  óf live uitproberen via de paletkiezer rechtsboven op de site. De 10 namen staan in
  `index.html` onder `const PALETTES` (spectraal, necropolis, maanlicht, vagevuur,
  ectoplasma, nevel, nachtschade, wierook, as, sint-elmsvuur).

## SEO — automatisch gegenereerd

Vindbaarheid is ingebouwd en blijft synchroon met de inhoud. `node build.mjs` leest
`content/site.json` en genereert in `dist/`:

- **Pre-rendered HTML** — de lineup/tekst staat in de HTML zelf (niet enkel via JavaScript),
  zodat Google en social-bots de inhoud meteen zien.
- **JSON-LD `MusicEvent`** per stad (datums, locatie, line-up, ticketprijzen) → kans op
  rijke resultaten/evenement-weergave in Google.
- **Open Graph + Twitter-cards** → nette previews bij delen.
- **sitemap.xml** + **robots.txt** + **canonical** (www).

> **Later iets wijzigen?** Ja — pas gewoon `content/site.json` aan (of straks via het CMS).
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

`site.json` wordt via `fetch()` geladen, dus de site moet via een webserver draaien
(niet rechtstreeks `index.html` dubbelklikken). In deze map:

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
Vonk en Zonen bewerken daar de hele site; bij opslaan committeert Decap naar
`content/site.json` op GitHub, Netlify herbouwt, en de site (incl. SEO) is bijgewerkt.

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
rechtstreeks `content/site.json` bewerken.

**Afbeeldingen** die in de editor geüpload worden, komen in `assets/uploads/`
en worden mee gedeployed.
