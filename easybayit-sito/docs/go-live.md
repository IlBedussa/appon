# Go-live di Easybayit su Vercel — procedura

> Data di riferimento: 2 ottobre 2026. Obiettivo: messa online domenica.
> Questo documento NON esegue nulla: sono i passi che David (o chi ha gli accessi) deve fare a mano.
> I valori tra parentesi quadre `[DA CONFERMARE]` vanno decisi/compilati. L'elenco completo dei segnaposto del sito è in `docs/da-compilare.md`.

---

## 0. Riepilogo in 10 righe

1. Decidere il dominio principale (es. `www.easybayit.co.il`) e comprarlo su LiveDNS (§1).
2. Creare il progetto su Vercel collegato al repository (§2) e impostare le variabili d'ambiente (§3).
3. **Flag di test SPENTI** in produzione: `SHOW_TEST_LOGOS`, `SHOW_DRAFTS` (e quelli "trust batch") NON impostati (§4).
4. Su LiveDNS: record `A` per il dominio nudo e `CNAME` per `www`, con i valori mostrati da Vercel (§5).
5. Su Resend: verificare il dominio di invio (SPF + DKIM), poi aggiungere DMARC (§6).
6. Compilare i segnaposto prioritari (contatti, privacy, termini) — vedi `docs/da-compilare.md`, sezione "Bloccanti".
7. Deploy di anteprima → controlli (§7) → promozione in produzione.

---

## 1. Acquisto dei domini su LiveDNS

LiveDNS (https://domains.livedns.co.il) è un registrar accreditato dall'ISOC-IL per `.co.il` / `.org.il` e vende anche `.com`. Il pannello permette di gestire i record DNS (A, CNAME, MX, TXT…).

1. Creare l'account su LiveDNS (modulo **in inglese**, dati reali: per una società serve il numero ח״פ **515863884**, per un privato la teudat zehut). L'ISOC-IL verifica a campione i dati del titolare: dati non corretti possono portare al blocco del dominio.
2. Nel campo "intestazione fattura" mettere la società: **Easy Bayit Property Management Ltd** (se il dominio va intestato alla società) `[DA CONFERMARE]`.
3. Domini da registrare `[DA CONFERMARE]` — proposta:
   - `easybayit.co.il` → dominio principale (pubblico israeliano + fiducia locale);
   - `easybayit.com` → per il pubblico all'estero, reindirizzato al principale;
   - facoltativi, contro gli abusi: varianti con trattino o refusi `[DA DECIDERE]`.
4. Verificare la disponibilità prima di comunicarli; impostare il **rinnovo automatico** e scegliere la durata (1–5 anni) `[DA DECIDERE]`.
5. Lasciare i **DNS di LiveDNS** (ns1/ns2/ns3.livedns.co.il): i record si gestiscono dal pannello LiveDNS (§5). In alternativa si possono delegare i nameserver a Vercel, ma in questo caso anche i record email (§6) andrebbero rifatti su Vercel: sconsigliato per semplicità.

## 2. Progetto Vercel

1. Vercel → **Add New → Project** → importare il repository (Git) del sito `[DA CONFERMARE: repository GitHub da creare/collegare]`.
2. Impostazioni di build (già nel file `vercel.json`, non serve cambiarle):
   - Framework: **Astro** · Build command: `npm run build` · Install: `npm ci` · Node: **22.x** (`engines` in `package.json`).
   - Regione delle funzioni: `fra1` (Francoforte, la più vicina a Israele tra quelle standard) `[DA CONFERMARE]`.
3. Durante la build su Vercel la variabile `VERCEL=1` attiva automaticamente l'adattatore `@astrojs/vercel`; `scripts/vercel-headers.mjs` copia intestazioni di sicurezza e reindirizzamenti nella configurazione finale (`.vercel/output/config.json`).
4. Verifica locale identica a Vercel (facoltativa): `npm run check:vercel` (build Vercel + test dei reindirizzamenti e delle intestazioni).

### Cosa è configurato nel repository
- **Adattatore**: `@astrojs/vercel` (funzioni serverless solo per `/api/*`; tutto il resto è statico sulla CDN).
- **Intestazioni di sicurezza** (`vercel.json` → `headers`): HSTS (2 anni, sottodomini inclusi, *senza* `preload` finché il dominio non è stabile), CSP restrittiva (solo risorse del sito stesso), `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP; `noindex` sulle API; cache di 1 giorno sui PDF in `/downloads/`, cache immutabile su `/_astro/`.
- **Reindirizzamenti permanenti** (`vercel.json` → `redirects`): `/en/*` → `/*`, `/contact-us` → `/contact/`, `/insights` → `/blog/`, `/legal` → `/legal-tax/` (con o senza slash finale). Lo slash finale è sempre aggiunto (`/pricing` → `/pricing/`).
- **Dominio nudo → www**: si imposta nella dashboard Vercel (Settings → Domains: aggiungere `easybayit.co.il` e `www.easybayit.co.il`, scegliere `www` come principale con redirect 308). Stessa cosa per `easybayit.com` e `www.easybayit.com` → redirect al dominio principale.
- I deploy di **anteprima** (`*.vercel.app`) ricevono da Vercel `noindex`: non finiscono su Google.

### Lingua automatica all'ingresso (nessun selettore nell'header)
L'header non ha più il selettore lingua: la lingua si sceglie **da sola alla prima visita**. Nel footer resta una riga discreta `EN · עברית · FR · IT` per la scelta manuale.

**Come decide** (logica unica in `src/lib/geo-lang.mjs`):
1. cookie `eb_lang` (scritto per 1 anno quando si clicca una lingua nel footer) → vince sempre;
2. intestazione `Accept-Language` del browser: miglior corrispondenza tra en/he/fr/it rispettando i pesi `q` (`iw` = ebraico; `en-US` → resta in inglese);
3. paese dell'IP fornito da Vercel (`x-vercel-ip-country`): IL → he; IT/SM/VA → it; FR/BE/LU/MC/CH → fr; altrimenti en.

**Quando NON reindirizza** (mai loop): pagine già con prefisso `/he/`, `/fr/`, `/it/` (scelta esplicita); URL con `?lang=…`; navigazione interna (Referer dello stesso sito, es. dopo il click su "EN"); bot/crawler/anteprime link/strumenti (Googlebot, Bing, Lighthouse, facebookexternalhit, curl…; UA vuoto); prefetch del browser; metodi diversi da GET/HEAD; API, file statici e pagine inesistenti. La destinazione è sempre la **stessa pagina** nella lingua scelta (`/pricing/` → `/it/pricing/`, `/cities/jerusalem/` → `/fr/cities/jerusalem/`; query come `utm_*` conservate); se una traduzione non esiste non reindirizza.

**Risposta**: `302` con `Vary: Accept-Language, Cookie` e `Cache-Control: private, no-store` (+ `X-Eb-Lang-Reason` per il debug). Le pagine d'ingresso servite senza redirect ricevono anch'esse `Vary: Accept-Language, Cookie`.

**Implementazione su Vercel**: il sito è statico, quindi il middleware di Astro non vedrebbe le pagine prerenderizzate. `npm run build` esegue `scripts/vercel-geo.mjs`, che crea una **Edge Middleware** con la Build Output API (`.vercel/output/functions/_geo.func`, runtime edge) e la rotta `middlewarePath: "_geo"` subito dopo i reindirizzamenti permanenti e prima dello slash finale (un solo salto: `/pricing` → `/it/pricing/`). La mappa delle pagine è ricavata dagli **hreflang** dell'HTML generato (`scripts/geo-map.mjs`), la stessa fonte di `<head>` e sitemap: hreflang, `x-default` e `sitemap.xml` non cambiano (Google vede sempre tutte le versioni, perché i bot non vengono mai reindirizzati).

**Simulare il paese**: header `x-vercel-ip-country: IT` oppure parametro `?geo=IT`. Il parametro funziona **solo** in locale e nelle anteprime: nella build di produzione (`VERCEL_ENV=production`) è disattivato.

**Test**:
- `npm run check:vercel` (verifica anche che la middleware `_geo` sia presente) e poi `npm run test:geo`: matrice completa (cookie, Accept-Language incl. `he-IL`/`iw`, paesi, bot, pagine profonde, niente loop/404) su logica, Edge Middleware generata e anteprima HTTP.
- Anteprima locale con la stessa logica: `npm run build && npm run preview:geo` → http://localhost:4321 (`PORT`, `DIST` configurabili). Esempi: `curl -sI -A "Mozilla/5.0 Chrome/129" -H "Accept-Language: he-IL" http://localhost:4321/pricing/` → `302 /he/pricing/`; `http://localhost:4321/?geo=IT` in un browser senza cookie → `/it/`. Nota: `npm run dev` e `npm run preview` (astro) NON applicano il redirect.
- Browser end-to-end + screenshot: `BASE_URL=http://localhost:4321 node scripts/screenshots-geo.mjs`.
- Per rifare la prima visita: cancellare il cookie `eb_lang` (o finestra in incognito).

## 3. Variabili d'ambiente (Vercel → Settings → Environment Variables)

| Variabile | Ambiente | Valore | Note |
|---|---|---|---|
| `SITE_URL` | Production (+ Preview) | `https://www.easybayit.co.il` `[DA CONFERMARE]` | Usata **in build** per canonical, hreflang, sitemap, robots.txt e a runtime per il controllo Origin dei moduli. Senza, il sito usa il segnaposto `www.easybayit.example`. |
| `RESEND_API_KEY` | Production | chiave `re_…` da Resend (permesso "Sending access", limitata al dominio) | **Segreta**: mai nel codice. |
| `LEAD_TO_EMAIL` | Production | casella che riceve i lead, es. `info@easybayit.co.il` `[DA CONFERMARE]` | Più indirizzi separati da virgola. |
| `LEAD_FROM_EMAIL` | Production | es. `Easybayit <sito@notify.easybayit.co.il>` `[DA CONFERMARE]` | Deve appartenere al dominio verificato su Resend (§6). |
| `LEAD_MOCK` | Preview | `1` | Nelle anteprime i moduli non inviano email (solo log). In Production lasciarla **vuota**. |
| `RENT_COMPARABLES_PROVIDER` | tutti | `demo` | `yad2` solo con un accordo/licenza ufficiale `[DA VERIFICARE]`. |

Comportamento dell'endpoint `/api/lead/`:
- senza `RESEND_API_KEY` / `LEAD_TO_EMAIL` / `LEAD_FROM_EMAIL` → **modalità mock** (in locale e in anteprima: risponde "ok" e scrive solo nel log);
- **in Production** con configurazione incompleta risponde **503** e il modulo mostra l'errore: nessun lead viene perso in silenzio;
- protezioni: honeypot, tempo minimo di compilazione (2,5 s), limite di 8 invii / 10 minuti per IP (in memoria, per istanza: sufficiente per il lancio; per un limite globale servirebbe un archivio esterno, es. Vercel KV/Upstash — non attivato), validazione e limiti di lunghezza, controllo Origin, corpo max 16 KB.

## 4. Flag da SPEGNERE in produzione

| Flag | Cosa fa | In produzione |
|---|---|---|
| `SHOW_TEST_LOGOS` | Loghi delle istituzioni (Corporations Authority, Tax Authority, Privacy Protection Authority, CBS) con etichetta TEST | **NON impostare** (i loghi non sono autorizzati) |
| `SHOW_DRAFTS` | Articoli del blog in bozza, con badge DRAFT e `noindex` | **NON impostare** |
| `SHOW_SERVICE_METRICS`, `SHOW_TRUST_SECURITY` | Pagine "trust batch" preparate ma disattivate | **NON impostare** finché i dati non sono confermati |
| `DEPLOY_TARGET` | Forza l'adattatore Vercel | non serve su Vercel |

Controllo: `npm run build` locale (senza variabili) → `grep -r "TEST – remove" dist/` deve dare **0 risultati**; nessuna pagina `/blog/<articolo>/` in bozza in `dist/`.
Su Vercel: Settings → Environment Variables non deve contenere nessuna delle variabili `SHOW_*`.

Nota sul blog: oggi **tutti** gli articoli sono `draft: true`, quindi in produzione `/blog/` mostra il messaggio "nuovi articoli in arrivo" con i link a guida e hub legale. Per pubblicare un articolo: risolvere i `[DA VERIFICARE]`, revisione madrelingua (+ avvocato/commercialista per quelli fiscali/legali), poi `draft: false`.

## 5. Record DNS su LiveDNS per Vercel

Prima aggiungere i domini al progetto Vercel (Settings → Domains): Vercel mostra per ogni dominio i valori **esatti** da usare. **Usare sempre i valori della scheda Vercel**: quelli sotto sono i valori generici documentati da Vercel.

| Tipo | Nome (host) | Valore | Per |
|---|---|---|---|
| `A` | `@` (vuoto) | `76.76.21.21` — oppure l'IP mostrato nella scheda (i progetti nuovi possono ricevere un IP diverso, es. `216.198.79.1`) | `easybayit.co.il` |
| `CNAME` | `www` | il target della scheda Vercel (es. `xxxxxxxx.vercel-dns-0xx.com.` oppure `cname.vercel-dns.com.`) | `www.easybayit.co.il` |

- Cancellare eventuali record `A`/`AAAA`/`CNAME` preesistenti sugli stessi nomi (pagine "parcheggio" di LiveDNS): bloccano la verifica.
- Ripetere per `easybayit.com` `[se acquistato]`.
- Se si vuole un record CAA: consentire `letsencrypt.org` (Vercel emette i certificati con Let's Encrypt). Se non ci sono record CAA non serve fare nulla.
- Verifica: `dig A easybayit.co.il +short`, `dig CNAME www.easybayit.co.il +short`. Il certificato HTTPS viene emesso automaticamente da Vercel quando i record sono visibili (di solito minuti; fino a 48 ore).

## 6. Email: SPF, DKIM e DMARC per Resend

Consiglio (best practice di Resend): **inviare da un sottodominio** dedicato, es. `notify.easybayit.co.il` `[DA CONFERMARE]`, così la reputazione dei messaggi del sito resta separata dalla posta normale e non si toccano gli MX del dominio principale.

1. Creare l'account Resend `[DA FARE da David]` → Domains → **Add domain** → `notify.easybayit.co.il`, regione `eu-west-1` (Irlanda) `[DA CONFERMARE]`.
2. Resend mostra i record da copiare (scheda **Records**). Tipicamente:

| Tipo | Nome su LiveDNS | Valore | Scopo |
|---|---|---|---|
| `MX` | `send.notify` | `feedback-smtp.<regione>.amazonses.com` (priorità 10) — copiare da Resend | SPF / ritorni |
| `TXT` | `send.notify` | `v=spf1 include:amazonses.com ~all` — copiare da Resend | SPF |
| `TXT` | `resend._domainkey.notify` | `p=MIGfMA0G…` (chiave lunga) — copiare **per intero** da Resend | DKIM |

   - Su LiveDNS il nome va scritto **senza** il dominio finale (`send.notify`, non `send.notify.easybayit.co.il`).
   - I domini creati di recente su Resend possono mostrare record `CNAME` al posto di TXT/MX: copiare esattamente ciò che compare nella scheda.
   - Non aggiungere virgolette o spazi; non spezzare il valore DKIM.
3. Cliccare **Verify DNS records** su Resend (spesso 15 minuti; fino a 72 ore).
4. **DMARC** (dopo che SPF e DKIM risultano verificati), sul dominio principale:

| Tipo | Nome | Valore |
|---|---|---|
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@easybayit.co.il;` `[DA CONFERMARE la casella per i report]` |

   - Partire con `p=none` (solo monitoraggio); dopo 2–4 settimane di report puliti passare a `p=quarantine`, poi eventualmente `p=reject`.
   - Se il dominio principale ha già un record SPF per la posta normale (es. Google Workspace / Microsoft 365) **non toccarlo**: il sottodominio di invio ha il suo SPF.
5. Mettere in `LEAD_FROM_EMAIL` un indirizzo del sottodominio verificato (es. `sito@notify.easybayit.co.il`) e in `LEAD_TO_EMAIL` la casella reale che riceve i lead. Le risposte ai lead usano `reply_to` = email del visitatore (se l'ha inserita).
6. Casella di ricezione (`info@…`): serve un servizio di posta per il dominio principale (Google Workspace, Microsoft 365, o la posta di LiveDNS) `[DA DECIDERE]`; i suoi record MX/SPF sono separati da quelli di Resend.

## 7. Controlli prima e dopo il lancio

Prima (sul deploy di anteprima):
- [ ] `npm run build` locale senza errori; `npm run check` (0 errori); `npm run check:meta`; `npm run check:vercel`.
- [ ] Nessun loghi TEST, nessuna bozza, nessun badge DRAFT nel deploy.
- [ ] Segnaposto "bloccanti" compilati (contatti, privacy, termini, accessibilità) — `docs/da-compilare.md`.
- [ ] Moduli: contatto, richiesta proposta, guida e popup → in anteprima rispondono "ok" in mock; in produzione arriva l'email.
- [ ] Popup lead: si apre con `?popup=a` / `?popup=b`; `npm run test:popup` passa.
- [ ] Lingua automatica: `npm run test:geo` passa; sull'anteprima `https://<anteprima>/?geo=IT` (senza cookie, browser con lingua non gestita) → `/it/`.

Dopo (in produzione, dominio attivo):
- [ ] `https://easybayit.co.il` → 308 → `https://www.easybayit.co.il/`; `/en/pricing` → `/pricing/`; `/contact-us` → `/contact/`.
- [ ] Intestazioni: `curl -sI https://www.easybayit.co.il/ | grep -i -E "strict-transport|content-security"`.
- [ ] Lingua automatica: `curl -sI -A "Mozilla/5.0 Chrome/129" -H "Accept-Language: he-IL" https://www.easybayit.co.il/pricing/` → `302` verso `/he/pricing/` con `Vary: Accept-Language, Cookie`; con `-A Googlebot` → `200` (nessun redirect); `?geo=IT` ignorato in produzione.
- [ ] Invio di un modulo di prova → email ricevuta (controllare anche lo spam e che DKIM/SPF risultino "PASS" nell'intestazione).
- [ ] `https://www.easybayit.co.il/sitemap.xml` e `/robots.txt` con il dominio giusto → inviare la sitemap a Google Search Console `[DA FARE]`.
- [ ] Lighthouse sulle pagine principali (vedi i punteggi nel report di consegna).

## 8. Dopo il lancio (non bloccante)
- `og:image` 1200×630 per le condivisioni social `[DA FARE]`.
- Logo definitivo (oggi provvisorio, `src/components/Logo.astro`).
- Quando il dominio è stabile da qualche mese: valutare `preload` nell'HSTS.
- Limite di frequenza globale per i moduli (Vercel KV / Upstash) se arrivano abusi.
