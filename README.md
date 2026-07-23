# SPOKEN — festivalwebsite

Spookthema **griezelfestival** (literatuur: spookverhalen, essays, poëzie, spoken word),
één weekend (31 OKT – 01 NOV 2026), twee steden: **Antwerpen** (koud spook, krijtblauw)
& **Kortrijk** (warm spook, gebrand oranje). Split-screen site met een **v3 geïllustreerde
huisstijl** (handgeschilderde artwork, Amatic SC-lettering, geel `#e6d33b`). Statische
website, gebouwd via `node build.mjs`.

## Structuur

```
index.html              ← bronpagina (split-screen, sfeer, interactie; v3-huisstijl)
assets/img, assets/media← geschilderde artwork + openingsvideo (huisstijl, geen CMS)
content/festival.json   ← thema + festivalgegevens/SEO + festivaldagen + alle koppen & knopteksten
content/antwerpen.json  ← Antwerpen: info, praktisch, tickets (programma wordt afgeleid)
content/kortrijk.json   ← Kortrijk: idem
content/artiesten.json  ← artiesten & gasten MET hun optredens (stad, dag, tijd, podium)
                          → dé enige bron voor programma én blokkenschema
content/nieuws.json     ← nieuwsberichten + affiches/posters
assets/render.mjs       ← rendering, gedeeld door de browser én de build
build.mjs               ← bouwt dist/ (pre-rendering + SEO) uit content/*.json
netlify.toml            ← Netlify: build = `node build.mjs`, publiceer dist/
dist/                   ← gegenereerde productieversie (NIET met de hand bewerken)
screenshots/            ← referentiebeelden
```

Aparte bestanden per onderwerp: zo toont de CMS-editor overzichtelijke items
(Festival-instellingen, Antwerpen, Kortrijk, Artiesten & gasten, Nieuws & affiches)
in plaats van één lange lijst. In het programma kies je een artiest uit een
dropdown; foto en bio uit `artiesten.json` verschijnen dan automatisch bij dat
programmaonderdeel (en in de Google-eventdata). Nieuws- en affichesecties
verschijnen pas op de site zodra er inhoud in staat. Vrijwel alle teksten —
inclusief sectiekoppen en knoppen — zijn via het CMS aan te passen; er is
niets hardcoded behalve de structuur.

> Lokaal ontwikkelen: na een wijziging aan `assets/render.mjs` kan de browser
> een oude versie vasthouden — hard verversen met **Ctrl+F5**. In productie
> speelt dit niet: de build stempelt het script met een versienummer per deploy.

- **Inhoud aanpassen** = de juiste `content/*.json` bewerken (of via de CMS op `/admin`).
  De pagina laadt deze bestanden bij het openen.
- **Huisstijl** (kleuren, lettertypes, geschilderde artwork, de "levende oog"-animatie,
  de openingsvideo) is vast in `index.html` + `assets/render.mjs` — dit is het v3-ontwerp,
  geen CMS-instelling. Het oude keuze-uit-10-paletten systeem is met v3 verdwenen; de
  krijtblauwe (Antwerpen) / oranje (Kortrijk) / gele kleuren zijn nu definitief.
- **Artwork** staat in `assets/img/` (`wordmark.png` met het oog, `gezicht.jpg` gezicht-
  achtergrond, `spook1–5` figuren, `eye-*` knipperframes, `poster.jpg` = achtergrond van
  de openingsvideo) en `assets/media/intro.mp4`. De openingsvideo speelt "contain" met de
  poster erachter zodat de zwarte letterbox-balken (vooral op mobiel) gevuld worden.
  Bron: de Claude Design v3-export (`Spokenv3_extracted/`, gitignored).

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

## CMS — Sveltia (opgezet, GitHub-login, Decap-compatibel)

De visuele editor staat klaar op **`/admin`** (`admin/index.html` + `admin/config.yml`).
De editor toont vijf items — **Festival-instellingen**, **Antwerpen**, **Kortrijk**,
**Artiesten & gasten**, **Nieuws & affiches** — met ingeklapte lijsten. Bij opslaan
committeert de CMS naar de bijhorende `content/*.json` op GitHub, Netlify herbouwt,
en de site (incl. SEO) is bijgewerkt.

**SPOKEN-skin (uit Claude Design):** de editor draagt de festivalhuisstijl waar
Sveltia dat toelaat: `app_title` "SPOKEN — Beheer" (login, header, browsertab),
en een on-brand **live-voorbeeldpaneel** — `admin/spoken-preview.css` (donker
thema, festival-fonts) plus `admin/preview-templates.js` (rendert per onderdeel
een 1:1-voorbeeld van de site: stad in teal/amber, artiesten met foto en
optredens, nieuws & affiches). Geverifieerd: de skin-bestanden laden zonder
fouten en de preview-API registreert. **Nog niet verifieerbaar zonder login:**
hoe het voorbeeldpaneel er in de ingelogde editor uitziet — controleer dat na
de eerstvolgende deploy (oog-icoon in de editor). Beperking van Sveltia zelf:
de login-achtergrond/editor-chrome zijn niet themebaar (de app tekent zijn
eigen achtergrond; volgt licht/donker van het besturingssysteem) — volledige
theming is een open Sveltia-feature-request (issue #29). Een vierkant logo kan
later via `logo: { src: … }` in `config.yml`. Ontwerpbron: lokale map `CMS/`
(bewust niet in de repo).

**Werkwijze: een artiest boeken (alles op één plek)**
Open **Artiesten & gasten** → voeg de artiest toe (naam, foto, bio) → voeg onder
**Optredens** één of meer optredens toe: **stad** (Antwerpen/Kortrijk), **dag**,
**start- en eindtijd**, **podium**, genre en omschrijving. Dat is alles: het
programma én het **blokkenschema** van de juiste stad worden hier automatisch
uit opgebouwd, en Google's eventdata ook. Er bestaat bewust géén tweede plek
waar tijden staan — dus niets kan ooit uit sync raken. Eén artiest kan
meerdere optredens hebben, ook in beide steden; de site toont dan vanzelf een
"Ook te zien: …"-kruisverwijzing bij elk optreden.

De **festivaldagen** (VR/ZA + datum) beheer je één keer bij *Festival-instellingen*;
ze gelden voor beide steden. De dag-code (bv. `vr`) niet meer wijzigen zodra er
optredens aan hangen.

> **Waarom Sveltia i.p.v. Decap?** Decap's standaard-UI bleek niet presentabel
> genoeg (kale lege kaarten op de startpagina, en een rechterpaneel dat rauwe
> velddata toonde). Sveltia CMS is de moderne opvolger die exact hetzelfde
> `config.yml`-formaat en dezelfde GitHub/Netlify-OAuth-koppeling gebruikt —
> alleen de editor-UI is anders. Terugdraaien = in `admin/index.html` het
> Sveltia-script weer vervangen door `decap-cms.js`.

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
4. Zij gaan naar `https://www.spokenfestival.be/admin/` en klikken **"Sign In with GitHub"**.

**Lokaal de editor testen** (zonder Netlify of GitHub-login):
```
python -m http.server 8000
```
Ga naar `http://localhost:8000/admin/` en kies **"Work with Local Repository"**
(werkt in Chrome/Edge): selecteer de projectmap, en de editor leest en schrijft
dan rechtstreeks de lokale `content/*.json`-bestanden — geen proxy-server nodig.

**Afbeeldingen** die in de editor geüpload worden, komen in `assets/uploads/`
en worden mee gedeployed.
