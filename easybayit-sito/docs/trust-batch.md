# Trust batch: pagine di fiducia (sito) e ispezioni e report (portale)

Data: 2 ottobre 2026. Tutti i testi esistono in EN, HE (RTL), FR e IT. I punti marcati `[TO CONFIRM]` sono elencati in `docs/da-compilare.md` (§16).

## Pagine del sito

| Pagina | Percorso EN | Stato |
|---|---|---|
| Transparency Pledge con il "Drive di gestione" interattivo | `/transparency-pledge/` | attiva |
| Report mensile sullo stato dell'immobile (PDF di esempio) | `/monthly-health-report/` | attiva |
| Ispezioni fotografiche (PDF di esempio) | `/photo-inspections/` | attiva |
| Prenotazione di una videochiamata di 15 minuti | `/book-a-call/` | attiva, **ma l'invio è simulato** (vedi sotto) |
| Cambio gestore: calcolatore e checklist | `/switching-manager/` | attiva |
| Metriche di servizio | `/service-metrics/` | dietro `SHOW_SERVICE_METRICS` (spenta) |
| Fiducia e sicurezza | `/trust-security/` | dietro `SHOW_TRUST_SECURITY` (spenta) |

Le altre lingue usano lo stesso slug con il prefisso (`/he/…`, `/fr/…`, `/it/…`). Il sito porta a queste pagine da:
- la striscia "fiducia" in home (`TrustStrip`);
- il riquadro nella pagina Prezzi (`PricingTrust`);
- il footer (Azienda) e il menu Servizi.

### File principali
- Testi: `src/i18n/trust/{en,he,fr,it}.ts`. `index.ts` contiene le pagine e gli slug ed esclude le pagine con la flag spenta.
- Pagine: `src/components/pages/trust/*.astro`, smistate da `TrustPage.astro` (collegato in `src/pages/[...path].astro`).
- Componenti: `src/components/trust/`.
  - `DriveBrowser.astro`: il Drive.
  - `BookingForm.astro`, `SwitchCalc.astro`, `SwitchChecklist.astro`, `SampleDownloads.astro`, `TrustCta.astro`, `TrustStrip.astro`, `PricingTrust.astro`, `TIcon.astro`.
- Logica:
  - `src/lib/trust/drive-model.ts`: il modello riutilizzabile del Drive;
  - `src/lib/trust/booking.ts`: calcolo degli slot in ora israeliana e file .ics;
  - `src/pages/api/book-call.ts`: endpoint simulato.
- Dati di esempio, tutti fittizi: `src/data/trust/drive-example.ts` e `src/data/trust/switching.ts`.

## Il "Drive di gestione" (pagina Transparency Pledge)
Riproduce l'archivio di **un** immobile fittizio ("Rehov HaDugma 12, Apt. 4, Jerusalem"). Contiene:
- **8 cartelle:** Contratti, Preventivi, Fatture e ricevute, Rendiconti, Ispezioni e foto, Assicurazioni e certificati, Arnona e utenze, Tasse.
- **Preventivi:** 2 lavori con 3 preventivi ciascuno. Quello scelto è evidenziato con il motivo; per lo scaldabagno si è scelto un preventivo che non è il più economico.
- **Anteprima di ogni file:** pagine, dettagli, download e registro attività (caricato, visto, approvato…) con data e ora israeliana.
- **Interazione:**
  - ricerca, vista elenco/griglia, navigazione con ← → ed Esc;
  - link diretti, es. `/transparency-pledge/#drive=quotes-heater&file=quote-heater-a`;
  - funziona anche senza JavaScript (elenco statico e link ai PDF).
- **Filigrana:** tutti i file sono marcati `EXAMPLE · ESEMPIO` (più "דוגמה" / "EXEMPLE" nelle versioni localizzate). Nomi di persone e aziende sono inventati ("Example Heating Ltd", "Sample Solar Services"…).

**Riutilizzo nel portale:** `easybayit-portal/src/lib/vault-structure.ts` è la copia della struttura: stesse cartelle, stesso ordine, stesse icone e stesse azioni. Contiene anche:
- la mappatura `doc_category` → cartella;
- la mappatura `audit_log.action` → riga del registro attività.

Se si modifica una delle due copie, va aggiornata anche l'altra.

### Rigenerare i file di esempio
```bash
export PATH=~/.local/node22/bin:$PATH
node scripts/trust/make-samples.mjs     # Playwright + /usr/bin/google-chrome, circa 10 secondi
```
- **Output:**
  - `public/samples/drive/**`: PDF, anteprime JPG e foto illustrate;
  - `public/downloads/health-report-example-{lang}.pdf` e `inspection-report-example-{lang}.pdf`.
- **Testi:** in `scripts/trust/sample-i18n.mjs`.
- **Dati:** in `src/data/trust/drive-example.ts`.

## Videochiamata: cosa manca per andare online
Oggi `POST /api/book-call/` valida i dati (honeypot e limite di frequenza) e tiene gli slot occupati **solo in memoria**. Risponde sempre `mock: true`, la pagina lo dice chiaramente e non registra dati personali. In produzione (`VERCEL_ENV=production`) risponde **503**, a meno che non sia impostato `BOOKING_MOCK=1`.

Per renderla reale:
1. **Calendario vero:** Google Calendar o Cal.com, con gli slot occupati letti dal calendario e l'evento creato con il link video.
2. **Email:**
   - conferma al cliente con il file .ics (Resend, come per i lead);
   - notifica al team;
   - promemoria il giorno prima.
3. **CRM:** salvare la richiesta come lead (`kind=call`) nello stesso flusso dei moduli.
4. **Regole:** giorni e orari reali, festività israeliane, pausa tra una chiamata e l'altra, piattaforme (Meet/Zoom/WhatsApp). Si trovano in `src/lib/trust/booking.ts` → `BOOKING_RULES`.
5. **Privacy:** informativa aggiornata (finalità "organizzare la chiamata", conservazione) e consenso già presente nel modulo.
6. **Endpoint:** rimuovere il 503 e la modalità simulata; tenere validazione e limite di frequenza.

Test della logica degli slot (7 test):
```bash
node --experimental-strip-types --test src/lib/trust/booking.test.ts
```

## Le due flag (spente di default)
In `src/config/trust-flags.ts`, impostate da variabili d'ambiente al momento della build:
- **`SHOW_SERVICE_METRICS=1`:**
  - pubblica `/service-metrics/`;
  - legge `PORTAL_METRICS_URL` (es. `https://portal…/api/public/sla`) alla build;
  - senza dati mostra "dati non ancora disponibili", mai numeri inventati;
  - nel portale va acceso anche `PUBLIC_METRICS_ENABLED=true`.
- **`SHOW_TRUST_SECURITY=1`:** pubblica `/trust-security/` (2FA, cifratura, regione dati, privacy, dati societari).

Con la flag spenta la pagina non viene generata, non compare in sitemap né nei link, e il suo URL dà 404.

## Portale (easybayit-portal)
- **Ispezioni fotografiche** (migrazione `20261002000006_inspections.sql`):
  - tipi: ingresso, uscita, annuale;
  - voci stanza per stanza con stato buono / discreto / scadente / n.a.;
  - foto con data di scatto, ora di caricamento e impronta SHA-256.
- **Accessi (RLS):**
  - lo staff compila le bozze;
  - proprietario e inquilino vedono solo le ispezioni **completate** dei propri immobili / del proprio contratto.
- **Presa visione:** solo tramite la funzione `acknowledge_inspection`. È idempotente e viene registrata nell'audit; lo staff riceve una notifica.
- **Immutabilità:** dopo il completamento voci e foto non si possono modificare, nemmeno dal service role. Il service role può solo cancellare un'ispezione intera.
- **Bucket privato** `inspection-photos`.
- **Notifiche** al proprietario e all'inquilino quando un'ispezione viene completata.
- **Pagine:**
  - staff: `/admin/inspections` (elenco e nuova) e `/admin/inspections/[id]` (compilazione e completamento);
  - proprietario e inquilino: `/owner/inspections` e `/tenant/inspections`, con il dettaglio e la conferma.
- **PDF:**
  - ispezione: `…/inspections/[id]/pdf`;
  - report mensile: `/owner/properties/[id]/report.pdf?month=YYYY-MM` (anche `/admin/properties/[id]/report.pdf`);
  - contenuto del report: entrate e uscite dal rendiconto pubblicato, pagamenti, manutenzione aperta, scadenze nei prossimi 120 giorni, foto dell'ultima ispezione;
  - ogni PDF ha un codice di integrità HMAC e ogni download è registrato nell'audit.
- **Correzione ai PDF in ebraico** (vale anche per il rendiconto esistente):
  - il testo ebraico usciva invertito, perché fontkit inverte già i run RTL;
  - i segni bidi inseriti da `Intl` apparivano come quadratini.

  Correzione in `src/lib/bidi.ts` → `pdfRuns`.
- **`/api/public/sla`:** metriche aggregate per il sito, dietro `PUBLIC_METRICS_ENABLED` (spenta; con la flag spenta risponde 404).
- **Test** (`npm test`, 93/93):
  - `tests/inspections.test.ts`: RLS per ruolo, scritture, immutabilità, presa visione, storage;
  - `tests/pdf-trust.test.ts`: PDF in 4 lingue, codice di integrità, endpoint SLA spento.
- **Screenshot del portale:** `node --env-file=.env scripts/screenshots-inspections.mjs` (richiede seed e dev server).

## Screenshot
In `screenshots/trust-batch/`:
- sito: `scripts/trust/screenshots-trust.mjs`, contro una preview su una porta libera, es. 4331;
- portale: `portal-*.png`.
