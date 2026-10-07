# Easybayit – Portale proprietari e inquilini (Fase 1 / MVP)

Portale riservato di Easy Bayit Property Management Ltd: area **proprietari**, area **inquilini** e
**back-office** per staff/amministratori. Applicazione separata dal sito vetrina (`../easybayit`), di cui
riusa il design system (colori, tipografia, componenti dashboard).

> Tutti i dati di esempio sono **fittizi** (nomi "Demo/Prova/Example", email su domini `.test`).

## Cosa fa (MVP)

| Area | Funzionalità |
|---|---|
| Autenticazione | Email + password (min. 10 caratteri, maiuscole/minuscole/cifre), **2FA TOTP** (obbligatoria per staff/admin, facoltativa per proprietari/inquilini), reset password via email, inviti (nessuna registrazione pubblica), logout, "disconnetti le altre sessioni", blocco dopo 5 tentativi/15 min |
| Ruoli e accessi | `admin`, `staff`, `owner`, `tenant` applicati **nel database con RLS**: il proprietario vede solo i propri immobili, l'inquilino solo il proprio contratto/richieste, lo staff tutto ma solo con sessione 2FA (`aal2`). Un utente con 2FA attiva non vede dati finché non verifica il codice |
| Preventivi (priorità 1) | Richieste con **foto e video** (JPG/PNG/WebP fino a 8 MB, MP4/WebM/MOV fino a 50 MB), timeline, preventivo con voci; il proprietario **approva con un clic** o rifiuta con nota; **soglia di approvazione** impostata dal proprietario: sotto soglia, se attivata, l'approvazione è automatica (tracciata nel log) |
| Multi-valuta (priorità 2) | Contabilità in ILS; visualizzazione in **ILS / USD / EUR / GBP** al cambio rappresentativo della **Banca d'Israele** (API ufficiale, cache in DB) |
| Tempi di intervento (priorità 3) | `first_response_at` e `resolved_at` registrati automaticamente per ogni richiesta; **widget SLA** nel cruscotto del proprietario (mediane proprie vs portafoglio); pagina **Metriche** per lo staff; funzione `portfolio_sla_stats()` con soli aggregati mensili (min. 5 richieste, nessun dato personale) pronta per la pubblicazione sul sito |
| Archivio documenti (priorità 4) | Documenti per ruolo (flag visibile a proprietario/inquilino), **scadenze** (assicurazione, controllo gas, caldaia/boiler, fine contratto) con **promemoria** automatici in-app + email; widget "Scadenze in arrivo" |
| Rendiconti | Rendiconto mensile per proprietario con righe (affitto, commissione, riparazioni, va'ad bayit, arnona…), bozza → pubblicazione, **PDF lato server** (anche in ebraico, con codice di integrità HMAC) |
| Pagamenti | Solo storico: inserimento manuale e **import CSV** (tutto-o-niente, protezione da CSV injection). **Nessun incasso online, nessun dato di carta** |
| Notifiche | In-app + email (coda `email_outbox`, provider SMTP/Resend/console), testi nella lingua dell'utente |
| Back-office | CRUD proprietari/inquilini/immobili/contratti, rendiconti, manutenzione e preventivi, documenti, pagamenti, utenti e inviti (ruoli, stato 2FA, disattivazione), **log di audit** |
| Lingue | **EN, HE (RTL), IT, FR**; cookie > profilo > `Accept-Language` |
| Accessibilità | Etichette collegate, `aria-invalid/aria-describedby`, skip link, focus visibile, contrasto AA, tabelle con `caption/scope`, layout responsive |

## Architettura

```
Browser ──HTTPS──▶ Astro SSR (Node locale / Vercel Functions)
                    │  middleware: lingua, CSRF, sessione Supabase, ruoli, 2FA staff, header di sicurezza
                    │  pagine .astro (server-rendered, zero JS client salvo minimi progressivi)
                    ├──▶ Supabase Auth (GoTrue): password, TOTP, inviti, reset
                    ├──▶ Supabase Postgres: tabelle + RLS + funzioni SECURITY DEFINER + trigger audit/notifiche
                    ├──▶ Supabase Storage: bucket privati `documents`, `maintenance-photos` (policy RLS)
                    ├──▶ Banca d'Israele (SDMX) per i cambi
                    └──▶ SMTP (Mailpit in locale) / Resend in produzione
```

Principi:
- **La sicurezza sta nel database**: ogni query dell'utente usa il suo JWT (`createUserClient`) e passa dalla RLS. La chiave `service_role` è usata solo lato server per inviti, coda email, rate limit e job.
- Operazioni sensibili tramite funzioni DB verificate e tracciate: `decide_quote`, `set_approval_settings`, `run_expiry_reminders`, `portfolio_sla_stats`.
- Audit append-only (`audit_log`): trigger su tabelle sensibili + eventi applicativi (login, download, 2FA…).

Struttura:

```
supabase/
  config.toml              stack locale (Auth TOTP, password policy, SMTP Mailpit, bucket, template email)
  migrations/              001 schema · 002 RLS · 003 funzioni/trigger · 004 priorità (video, soglia, GBP, FR, SLA, scadenze)
  templates/               email di invito e reset
src/
  middleware.ts            pipeline di richiesta (vedi sopra)
  lib/                     supabase, csrf, validation (zod), fx, pdf, upload (magic bytes), sla, outbox, email…
  i18n/                    en.ts (modello tipizzato), he.ts, it.ts, fr.ts
  layouts/ components/     UI riusabile (AppLayout con menu per ruolo, grafici SVG, widget SLA/scadenze…)
  pages/owner|tenant|admin pagine per ruolo; pages/api/cron/* job; pages/files/* download privati
scripts/                   seed.mjs, screenshots.mjs, smoke.mjs, totp.mjs, fixtures (immagini/video fittizi)
tests/                     unit, RLS, e2e (vitest + playwright-core)
```

## Avvio in locale

Prerequisiti: Node 22, Docker, [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) ≥ 2.100, Google Chrome (solo per screenshot/e2e).

```bash
npm ci
npm run db:start          # avvia Postgres, Auth, Storage, Mailpit (servizi superflui esclusi per risparmiare RAM)
cp .env.example .env      # poi incollare URL e chiavi da `supabase status` (ANON_KEY, SERVICE_ROLE_KEY)
                          # e generare CRON_SECRET / PDF_INTEGRITY_SECRET (es. `openssl rand -hex 32`)
npm run db:reset          # applica le migrazioni e carica i dati demo (scrive LOCAL-CREDENTIALS.md)
npm run dev               # http://localhost:4322
```

- Email (inviti, reset, notifiche): **Mailpit** su http://127.0.0.1:54324
- Codice 2FA per gli utenti demo con TOTP: `npm run totp -- <segreto>` (segreti in `LOCAL-CREDENTIALS.md`)
- Promemoria scadenze manuali: back-office → Documenti → "Scadenze in arrivo → Invia", oppure
  `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:4322/api/cron/reminders`

Nota per macchine con `iptables-legacy` e policy `FORWARD DROP` (caso riscontrato sulla macchina di sviluppo): i container
Supabase non si vedono tra loro e `supabase start` si blocca su "Initialising schema". Soluzione:
`sudo iptables-legacy -I FORWARD 1 -i br-+ -j ACCEPT && sudo iptables-legacy -I FORWARD 1 -o br-+ -j ACCEPT`.

### Utenti demo

Generati dal seed (password e segreti TOTP in `LOCAL-CREDENTIALS.md`, file non versionato):

| Ruolo | Email | 2FA | Scenario |
|---|---|---|---|
| admin | admin@easybayit.test | sì (obbligatoria) | tutto il back-office |
| staff | staff@easybayit.test | sì (obbligatoria) | UI in ebraico |
| owner | owner1@example.test | no | 3 immobili, preventivo da 2.478 ₪ sopra soglia (1.500 ₪) in attesa, scadenze |
| owner | owner2@example.test | sì | 2 immobili, soglia 800 ₪ con auto-approvazione (preventivo da 400 ₪ approvato automaticamente), UI italiana |
| tenant | tenant1@example.test | no | richiesta urgente con foto **e video** |
| tenant | tenant2@example.test | no | UI francese |
| tenant | tenant3@example.test | no | UI ebraica |

## Test

```bash
npm test            # tutto (richiede db:reset + dev server per gli e2e; senza server gli e2e vengono saltati)
npm run test:unit   # magic bytes foto/video, TOTP RFC 6238, CSV, redirect sicuri, CSRF, password, cambi BOI (GBP), SLA, completezza 4 lingue
npm run test:rls    # isolamento per ruolo, 2FA aal2, bozze, documenti, audit append-only, preventivi/soglia/auto-approvazione, SLA, storage privato
npm run test:e2e    # header di sicurezza, CSRF, 2FA staff, richiesta con foto+video, approvazione con un clic, PDF, FR/HE-RTL, reset password, inviti, rate limit
npx vitest run tests/uploads.test.ts  # upload diretti: tipo/dimensione, negazione tra inquilini e per ruolo, verifica alla finalizzazione, EXIF, pulizia
npm run smoke       # visita tutte le pagine per ogni ruolo
npm run check       # type-check Astro/TypeScript
npm run screenshots # rigenera screenshots/*.png
BOT_E2E=1 npx vitest run tests/bot.test.ts  # bot: 15 unit + 3 e2e webhook (BOT_E2E=1 fallisce se il server non risponde, BOT_E2E=0 li salta)
```

## Bot manutenzione WhatsApp / web chat

- Inquilino: segnalazione guidata (EN/HE/IT/FR/RU) con categoria, descrizione, foto/video, triage urgenza (e rilevamento emergenze gas/allagamento/elettricità), disponibilità, riepilogo e numero di ticket `R-xxxx`. Stessa macchina a stati su WhatsApp e sulla chat del portale (`/tenant/chat`, voce di menu "Assistente chat").
- Webhook `POST /api/whatsapp/webhook`: escluso da sessione e CSRF nel middleware, autenticato solo dalla firma `X-Hub-Signature-256` (HMAC con `WHATSAPP_APP_SECRET`), idempotente per message id; `GET` per la verifica `hub.verify_token`. Il body deve essere `application/json` (come invia Meta).
- Simulatore `/dev/whatsapp-sim`: esiste solo con `astro dev` o `WHATSAPP_SIMULATOR=true`, mai con `WHATSAPP_PROVIDER=cloud` (altrimenti 404); niente login ma CSRF attivo; firma i payload e li manda al webhook reale.
- Quando lo staff cambia lo stato di una richiesta nata in chat, un trigger accoda il messaggio in `chat_outbox`, inviato nella lingua della conversazione (dopo ogni POST del portale, dopo ogni webhook e da `/api/cron/outbox`).
- Badge "via WhatsApp" / "via chat" nelle liste e nei dettagli di staff, proprietario e inquilino.
- Video: `node --env-file=.env scripts/whatsapp-demo-video.mjs` (dopo `npm run db:reset` e con il dev server attivo) → `demo/whatsapp-bot-demo.mp4` + `demo/wa-keyframe-*.png`.

## Upload di foto, video e documenti (diretti su Supabase Storage)

Le funzioni Vercel accettano al massimo 4,5 MB per richiesta, mentre il portale ammette foto fino a 8 MB, video fino a 50 MB
e documenti fino a 10 MB. I file quindi **non passano dal server**:

1. `POST /api/uploads/sign` (`{ kind, targetId, files: [{ name, size, type }] }`): il server controlla sessione/2FA/CSRF, ruolo,
   appartenenza del record (letta con il client dell'utente → RLS: richiesta propria e aperta, ispezione in bozza, ecc.),
   tipo e dimensione dichiarati, rate limit e numero di upload in attesa; crea una riga in `upload_intents` (solo service role)
   e un URL firmato (`createSignedUploadUrl`) verso `pending/<utente>/<uuid>.<ext>` nel bucket del flusso.
2. Il browser carica il file con `PUT` sull'URL firmato (come `uploadToSignedUrl`, ma con `XMLHttpRequest` per la barra di
   progresso), con 3 tentativi e backoff, e nuova firma se l'URL è scaduto (`src/scripts/direct-upload.ts`, componente `UploadField`).
3. Il form della pagina invia solo gli id (`upload_ids`); la finalizzazione (`finalizeUploads`, anche `POST /api/uploads/finalize`
   in JSON) verifica che l'intento sia dell'utente e valido, che l'oggetto esista con la dimensione dichiarata e un tipo reale
   (magic bytes) ammesso e coerente, calcola SHA-256 (salvato su foto, documenti e foto di ispezione) e la data di scatto EXIF
   (ispezioni; l'orario inserito a mano vale solo per le foto senza EXIF), sposta il file nella cartella del record e inserisce la
   riga con il client dell'utente (le policy RLS restano il controllo finale). File rifiutati: rimossi subito.

| Flusso (`kind`) | Bucket | Tipi | Limiti |
|---|---|---|---|
| `maintenance` (richieste e foto/video dei preventivi) | `maintenance-photos` | JPG/PNG/WebP, MP4/WebM/MOV | 8 MB foto, 50 MB video, 5 per invio |
| `inspection` (staff, solo bozze) | `inspection-photos` | JPG/PNG/WebP | 8 MB, 10 per invio |
| `document` (vault, staff) | `documents` | PDF/JPG/PNG/WebP | 10 MB, 1 |
| `webchat` (allegati della chat inquilino → bot) | `maintenance-photos` | JPG/PNG/WebP, MP4/WebM/MOV | 8 / 50 MB, 1 |

- Lo storage non accetta scritture con la sessione dell'utente (nessuna policy INSERT/UPDATE client): solo URL firmati e service role.
- Pulizia: `/api/cron/outbox` (ogni 10 minuti) marca come scaduti gli intenti non finalizzati entro 3 ore e ne rimuove i file,
  poi rimuove gli oggetti in `pending/` senza intento valido (`stale_pending_uploads()`); storico intenti conservato 30 giorni.
- Il middleware rifiuta corpi oltre 4 MB (eccezione: simulatore WhatsApp in sviluppo). WhatsApp Cloud non è coinvolto: i media
  arrivano come id nel webhook JSON e il server li scarica dalla Graph API.
- La CSP (`connect-src`) include l'origine di `SUPABASE_URL` letta **alla build**: su Vercel la build fallisce se manca.

## Deploy (Vercel + Supabase)

1. **Supabase** (progetto in regione UE, es. Francoforte): `supabase link --project-ref <ref>` e `supabase db push` (migrazioni, bucket inclusi).
   Poi in Dashboard (o `supabase config push`) replicare `config.toml`:
   Auth → disattivare le registrazioni pubbliche, abilitare **MFA TOTP**, password min. 10 con requisiti,
   Site URL `https://portal.<dominio>` e Redirect URL `https://portal.<dominio>/auth/confirm`,
   template email di invito/reset da `supabase/templates/` (link a `/auth/confirm?token_hash=…&type=…`),
   SMTP personalizzato (Resend/Postmark) per le email di Auth.
2. **Vercel**: importare il repository, framework Astro. L'adapter Vercel viene scelto automaticamente quando `VERCEL=1`.
   Variabili d'ambiente (Production e Preview):

| Variabile | Scopo |
|---|---|
| `SITE_URL` | URL pubblico del portale (link nelle email, HSTS se https) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | progetto Supabase; query utente con RLS. `SUPABASE_URL` deve essere disponibile anche alla build (CSP degli upload diretti) |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo server**: inviti, coda email, rate limit, job |
| `COOKIE_SECURE` | `true` |
| `EMAIL_PROVIDER` | `resend` (prod) · `smtp` · `console` |
| `EMAIL_FROM` | mittente verificato, es. `Easybayit <no-reply@dominio>` |
| `RESEND_API_KEY` | se `EMAIL_PROVIDER=resend` |
| `SMTP_HOST`, `SMTP_PORT` | se `EMAIL_PROVIDER=smtp` |
| `CRON_SECRET` | protegge `/api/cron/outbox` e `/api/cron/reminders` (Vercel Cron invia `Authorization: Bearer …`) |
| `PDF_INTEGRITY_SECRET` | codice di integrità sui PDF |
| `BOI_API_URL` | opzionale, default API ufficiale Banca d'Israele (USD/EUR/GBP) |
| `LOGIN_MAX_ATTEMPTS` | default 5 per 15 minuti |

3. `vercel.json` pianifica la coda email ogni 10 minuti e i promemoria ogni giorno alle 05:00 UTC
   (il piano Hobby consente solo cron giornalieri: in quel caso la coda viene comunque svuotata dopo ogni azione dell'utente).
4. Dominio `portal.<dominio>` con HTTPS; verificare SPF/DKIM/DMARC del mittente email.

## Sicurezza (riassunto)

- RLS su tutte le tabelle e sullo storage; nessuna chiave privilegiata nel browser; sessioni in cookie HttpOnly, SameSite=Lax, Secure.
- CSRF: token sincronizzatore (double-submit con cookie `__Host-` in produzione) + controllo `Origin` di Astro.
- CSP con hash generata da Astro in build (+ `frame-ancestors 'none'`), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, HSTS in https, `Cache-Control: no-store` per le pagine autenticate.
- Validazione input con zod; upload diretti su storage con URL firmati emessi dopo i controlli di ruolo/appartenenza, verificati alla finalizzazione con **magic bytes** (non il nome/Content-Type), dimensione e SHA-256; download solo via endpoint che applicano RLS.
- Rate limiting su Postgres (login per email e per IP, 2FA, reset password); audit log append-only.
- Nessun dato di carta di pagamento: il portale registra solo lo storico.

## Limiti noti / da completare prima del go-live

- Revisione legale (privacy israeliana/GDPR per proprietari UE, informativa, DPA con Supabase/Vercel/Resend), testi legali e cookie.
- Video: riproduzione via endpoint autenticato senza richieste `Range` (va bene per clip brevi; per video lunghi usare URL firmati a breve scadenza o streaming). Nessuna transcodifica né scansione antivirus dei file.
- I test RLS/e2e girano contro il DB locale con i dati del seed (non in CI): aggiungere una pipeline GitHub Actions con `supabase start`.
- Tempi SLA: la "prima risposta" è il primo cambio di stato o la prima nota dello staff; definire con il business le soglie contrattuali (es. urgente < 4 h) e la pagina pubblica del sito che userà `portfolio_sla_stats()`.
- Promemoria: un solo avviso per scadenza (si riarma se la data cambia); valutare promemoria multipli (60/30/7 giorni).
- Backup/PITR di Supabase, monitoraggio errori (es. Sentry), test di carico, penetration test esterno.
- Bot WhatsApp: nessun numero/app Meta configurato (provider `cloud` mai provato contro la Graph API reale); template di messaggio approvati da Meta necessari per gli aggiornamenti di stato oltre la finestra di 24 h; NLU solo a regole.
- Pagamenti online, firma elettronica dei contratti, app mobile: fuori dallo scope dell'MVP.
