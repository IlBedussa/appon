# Easybayit — sito statico (Astro)

Sito multilingua (inglese predefinito su `/`, ebraico RTL su `/he/`, italiano su `/it/`; x-default = inglese) per Easybayit, gestione immobili in Israele.
Output 100% statico in `dist/`: caricabile su qualsiasi hosting.

## Requisiti
- Node.js >= 22.12 (richiesto da Astro 7). Sul box: `export PATH=~/.local/node22/bin:$PATH`

## Comandi
```bash
npm install
npm run dev          # sviluppo su http://localhost:4321
npm run build        # genera dist/ (PRODUZIONE: loghi di test SPENTI)
npm run build:test   # come build, ma con SHOW_TEST_LOGOS=1 (solo test locale!)
npm run preview      # serve dist/ su http://localhost:4321
npm run preview:test # build:test + preview
npm run check        # type-check Astro/TS
npm run check:meta   # verifica title <= 60, description <= 155, lang/dir, hreflang
npm run screenshots  # screenshot in screenshots/ (server avviato, Chrome in /usr/bin/google-chrome o CHROME_PATH)
```

## Struttura
- `src/i18n/{he,en,it}.ts` — TUTTI i testi (en.ts è il modello di tipo). `config.ts` — lingue, slug, helper URL (usa `astro:i18n`).
- `src/pages/[...path].astro` — unica route che genera tutte le pagine × lingue. `404.astro`, `sitemap.xml.ts`.
- `src/layouts/Base.astro` — head SEO (canonical, hreflang + x-default, Open Graph), header, footer.
- `src/components/` — Header, Footer, LangSwitcher, Icon (SVG inline), mockup UI (StatementCard, MaintenanceTimeline, IncludedMini, QuoteCard, PortalMockup), pagine in `pages/`.
- `src/styles/global.css` — design system (variabili CSS, proprietà logiche per RTL). `src/styles/dashboard.css` — stili della demo.
- Demo dashboard proprietario (`/portal/demo/`, `/he/portal/demo/`, `/it/portal/demo/`): `src/components/pages/Dashboard.astro`,
  testi in `src/i18n/dash.ts`, dati INVENTATI in `src/data/demo.ts` (immobili fittizi, tassi di cambio fissi illustrativi). Nulla viene salvato.
- Pagina Tecnologia e sicurezza (`/technology/` …): `src/components/pages/Technology.astro`, `ArchDiagram.astro`; stati live/soon/tbc nei dizionari.
- `LiveWidgets.astro` (anteprima animata in home), `TrustSection.astro` (dati societari verificabili: ח״פ 515863884, link al registro ufficiale).

## ⚠ Loghi delle autorità (SOLO TEST LOCALE)
- Flag unico: `SHOW_TEST_LOGOS` in `src/config/flags.ts` (letto dalla variabile d'ambiente `SHOW_TEST_LOGOS=1`). **Default: spento.**
- File in `test-assets/authority-logos/` (fuori da `public/`, quindi mai copiati in `dist/` se il flag è spento). Fonti in `LEGGIMI.md`.
- I loghi NON possono essere pubblicati senza autorizzazione delle autorità. Con il flag acceso compare l'etichetta "TEST – remove before publishing".
- Spegnere: usare `npm run build` normale (senza la variabile). Rimuovere del tutto: cancellare `test-assets/authority-logos/`,
  `src/components/TestAuthorityLogos.astro` e il suo uso in `src/components/TrustSection.astro`.

## Hook di integrazione (vuoti, commentati in italiano)
- Modulo contatti: `inviaRichiesta()` in `src/components/pages/Contact.astro`.
- Login portale: `accediAlPortale()` in `src/components/pages/Portal.astro`.

## Segnaposto
Cercare `[TO CONFIRM]`, `[DA CONFERMARE]`, `[לאישור]`, `[REAL TESTIMONIAL TO BE ADDED]`, `[TESTIMONIANZA REALE DA INSERIRE]`, `[להוסיף המלצה אמיתית]`
in `src/i18n/*.ts`, e `[DA CONFERMARE]` in `astro.config.mjs`, `public/robots.txt`, `Logo.astro`, `Base.astro`.
Nel sito i segnaposto sono evidenziati in giallo.

## Fase 3 – aggiornamenti (2 ottobre 2026)

### Lingue e deploy
- Quattro lingue: EN su `/`, HE su `/he/`, FR su `/fr/`, IT su `/it/`. hreflang = 4 lingue + x-default, verificati con `npm run check:meta`.
- Output statico con le API `/api/rent-estimate/`, `/api/rates/` (Banca d'Israele) e `/api/streets/` lato server. Adattatore `@astrojs/node`; con `DEPLOY_TARGET=vercel` si usa `@astrojs/vercel`.
- Comparabili per la stima affitto: `RENT_COMPARABLES_PROVIDER` (default `demo`). Lo stub `yad2` richiede un accordo o una licenza ufficiale [DA VERIFICARE].

### Flag (tutti spenti in produzione)
| Flag | Effetto | Acceso da |
|---|---|---|
| `SHOW_TEST_LOGOS=1` | Loghi delle istituzioni (Corporations Authority, Tax Authority, Privacy Protection Authority, CBS) nella striscia trust e nei diagrammi dei flussi, con etichetta "TEST" | `build:test`, `preview:test` |
| `SHOW_DRAFTS=1` | Articoli del blog con `draft: true` visibili con il badge "DRAFT - in revisione" e `noindex`; mai in sitemap | `build:test`, `preview:test`, `astro dev` |

Una `npm run build` normale non produce né le pagine degli articoli in bozza né i loghi istituzionali (verificato: 0 occorrenze in `dist/`).

### Hub Legale & Fiscale (`/legal-tax/`)
- Testi in `src/i18n/legal/{en,he,fr,it}.ts`. Le fonti ufficiali, con data di verifica, sono in `src/data/market.ts`.
- La checklist è stampabile (pulsante oppure `?print=checklist`). I PDF in `public/downloads/` si rigenerano con `node scripts/make-checklists.mjs` mentre la preview è attiva; poi va rifatta la build.
- Prima di pubblicare va fatta la revisione di un avvocato e di un commercialista sui punti [TO VERIFY] e [TO CONFIRM with lawyer].

### Blog (`/blog/`)
- Gli articoli stanno in `src/content/blog/<lang>/` (collection definita in `src/content.config.ts`). Gli URL sono `/blog/<slug>/` e `/<lang>/blog/<slug>/`.
- Ogni pagina articolo ha JSON-LD Article + FAQPage + BreadcrumbList, FAQ, fonti, link interni, articoli correlati e CTA. Gli hreflang coprono solo le traduzioni esistenti (stesso `translationKey`).
- I marcatori `[DA VERIFICARE …]` vengono evidenziati dal plugin `src/lib/rehype-blog.mjs`, che richiede `@astrojs/markdown-remark`.
- Per pubblicare un articolo: risolvere i marcatori, far fare la revisione madrelingua (e del consulente per gli articoli legali o fiscali), poi mettere `draft: false`.

### Bot di manutenzione e diagrammi dei flussi
- `BotShowcase.astro` mostra una chat stile WhatsApp e la scheda del ticket (dati fittizi). `Workflows.astro` contiene i diagrammi Manutenzione e Denaro & dati. Entrambi sono nella home, nella pagina inquilini e in quella tecnologia.
- I loghi dei servizi vengono dal pacchetto `simple-icons` (CC0). Morning, Grow e Banca d'Israele compaiono come badge testuali. La didascalia "integrazioni previste / in sviluppo" esclude qualsiasi partnership.

## Go-live (2 ottobre 2026)
- Procedura completa: `docs/go-live.md` (domini LiveDNS, DNS Vercel, Resend SPF/DKIM/DMARC, variabili d'ambiente, flag). Segnaposto da compilare: `docs/da-compilare.md`.
- `SITE_URL` (variabile d'ambiente) imposta il dominio per canonical, hreflang, sitemap e `robots.txt` (generato da `src/pages/robots.txt.ts`).
- Moduli → `/api/lead/` (Resend; mock senza chiave; 503 in produzione se non configurato). Tipi: contact, lead, capture, popup.
- Popup lead A/B: `src/components/LeadPopup.astro`, testi in `src/i18n/popup.ts`. Test: `?popup=a` / `?popup=b`, `npm run test:popup`, `npm run screenshots:popup`.
- Vercel: `npm run check:vercel` (build Vercel + simulazione di reindirizzamenti e intestazioni).
