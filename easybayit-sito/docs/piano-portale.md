# Piano: portale proprietari/inquilini Easybayit (versione reale)

**Società:** Easy Bayit Property Management Ltd (ח״פ 515863884), Israele
**Data verifica prezzi:** 02/10/2026. Tutti i prezzi sono IVA esclusa salvo indicazione, in USD o ILS come pubblicati.
**Cambio usato per i totali:** 1 USD = 3,063 ILS (tasso rappresentativo Banca d'Israele del 30/09/2026, dalla API ufficiale `edge.boi.gov.il`).
**Ipotesi di partenza (da confermare):** circa 30–60 immobili, circa 30–60 proprietari (molti all'estero), circa 30–60 inquilini, 2–3 persone dello staff. Scenario di crescita: circa 200 immobili e circa 450 utenti. Pochi GB di documenti all'inizio.
**Legenda:** [DA VERIFICARE] = non confermato su fonte ufficiale · ⚖️ = da sottoporre ad avvocato · 🧾 = da sottoporre a commercialista.

---

## 0. Scelte di architettura (in breve)
- Il sito marketing resta statico in Astro. Il portale è un'app separata su `portal.<dominio>`, costruita in **Astro in modalità SSR** per riusare i18n, RTL e componenti della demo `/portal/demo/`. In alternativa Next.js, a scelta dello sviluppatore.
- **Database, autenticazione e file in un unico servizio (Supabase).** Gli accessi sono protetti da Row Level Security (RLS) sul database: il proprietario vede solo i propri immobili, l'inquilino solo il proprio contratto, lo staff tutto. Ogni azione sensibile finisce in un log di audit (approvazione preventivi, download documenti).
- **Residenza dei dati:** si sceglie la regione Supabase **Francoforte (eu-central-1)**. Supabase non ha regioni in Israele (vedi elenco regioni sotto) e le funzioni Vercel vanno messe nella stessa regione UE. ⚖️ Va verificata la conformità del trasferimento all'estero con la legge israeliana sulla privacy (Emendamento 13 e regolamenti sul trasferimento all'estero) e con il GDPR per i proprietari residenti nell'UE.
- **Pagamenti con carta:** solo tramite pagina di pagamento ospitata o iframe del provider israeliano. I dati delle carte non passano mai sui nostri server (ambito PCI minimo).
- **Multi-valuta:** è solo visualizzazione. La contabilità resta in ILS e gli importi vengono mostrati anche in EUR/USD con il tasso ufficiale BOI del giorno (API gratuita, verificata funzionante il 02/10/2026).
- **Stripe non è un'opzione per una società israeliana:** Israele non compare nella pagina ufficiale dei paesi supportati (https://stripe.com/global, verificato il 02/10/2026).

## 1. Stack consigliato (default)

| Funzione | Servizio | Perché | Costo mensile indicativo | Fonte (verificata il 02/10/2026) |
|---|---|---|---|---|
| Hosting app (SSR) | **Vercel Pro** | Deploy automatico, adapter Astro, regione funzioni UE. Il piano Hobby è solo per uso non commerciale. | $20 (1 seat sviluppatore; ogni seat in più $20) | https://vercel.com/pricing |
| Database + Auth + 2FA + file | **Supabase Pro** (regione Francoforte) | Postgres, RLS per i ruoli, 2FA TOTP inclusa (MFA base in tutti i piani), Storage con permessi, backup giornalieri per 7 giorni | $25 (compute Micro incluso; 100 GB file; 100k MAU) | https://supabase.com/pricing · regioni: https://supabase.com/docs/guides/platform/regions |
| 2FA via SMS (opzionale) | Supabase Advanced MFA Phone | Sconsigliato all'inizio. Meglio TOTP o passkey. | $75 se attivato | https://supabase.com/pricing |
| Email transazionali | **Resend** | API semplice, SPF/DKIM/DMARC, conforme GDPR | $0 (3.000 email/mese, max 100/giorno). Pro: $20 per 50.000 | https://resend.com/pricing |
| Pagamenti ILS | **Grow (ex Meshulam)** | Prezzo pubblico, carta, bit, Apple/Google Pay | ₪59/mese + 0,75% a transazione | https://grow.business/ (sezione "כמה זה עולה?") |
| Fatture/ricevute (Tax Authority) | **Morning (Green Invoice)**, piano Best | Sistema approvato dalla Rashut HaMissim, numero di allocazione "Heshboniot Israel", API e webhook nel piano Best | ₪45/mese con piano annuale (₪540/anno), ₪54 mensile. 50 documenti/mese, poi ₪1 l'uno | https://www.greeninvoice.co.il/pricing/ |
| Firma elettronica | **Dropbox Sign** Essentials (interfaccia web) nella fase 2. API solo in seguito. | Richieste di firma illimitate dal web, audit trail, 22 lingue | $15/mese (1 utente). API Essentials: $75 per 50 richieste/mese | https://sign.dropbox.com/products/dropbox-sign/pricing · https://sign.dropbox.com/products/dropbox-sign-api/pricing |
| WhatsApp (fase 3) | **Meta WhatsApp Cloud API** diretta | Nessun costo di piattaforma intermedio | Israele: utility/authentication $0,0053 a messaggio, marketing $0,0353. Dal 01/10/2026 i messaggi di servizio hanno 1.000 gratis/mese per numero. [DA VERIFICARE sul rate card ufficiale; tariffe lette da fonti secondarie] | https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing |
| Monitoraggio errori | **Sentry** Developer, poi Team | Errori e tracing, 1 monitor uptime incluso | $0 (1 utente). Team: $26 | https://sentry.io/pricing/ |
| Backup esterno | **Cloudflare R2** (dump settimanale del DB e copia dei file) | Copia fuori da Supabase, egress gratuito | $0 entro 10 GB, poi $0,015/GB-mese | https://developers.cloudflare.com/r2/pricing/ |
| Domini | **LiveDNS** (registrar accreditato ISOC-IL) per .co.il e .com | Un unico fornitore israeliano, fattura in ILS | .co.il ₪92/anno e .com ₪92/anno (IVA inclusa) | https://www.domains.livedns.co.il/PriceList.aspx |
| Cambi valuta | API Banca d'Israele | Tasso ufficiale, gratuita | $0 | https://edge.boi.gov.il (endpoint SDMX `EXR`) |

Nota sul dominio: il 02/10/2026 `easybayit.com` risultava **non registrato** (RDAP Verisign: 404). Lo stato di `easybayit.co.il` è [DA VERIFICARE]. Il sito usa ancora il segnaposto `easybayit.example`.

## 2. Alternative

| Funzione | Alternativa | Prezzo verificato | Note / fonte |
|---|---|---|---|
| Hosting | **Cloudflare Workers Paid** | $5/mese minimo (10M richieste) | Più economico. Runtime edge: alcune librerie Node (generazione PDF) vanno verificate. https://developers.cloudflare.com/workers/platform/pricing/ |
| Database | **Neon** (Postgres serverless, piano Launch) | A consumo: $0,106/CU-ora, $0,35/GB-mese, Auth fino a 1M MAU | Va abbinato a un servizio per i file (R2). https://neon.com/pricing |
| Auth | **Clerk** Pro | $25/mese ($20 con piano annuale), MFA inclusa nel Pro | Interfaccia di login pronta e curata, ma un fornitore in più. https://clerk.com/pricing |
| Auth/DB | Firebase | [DA VERIFICARE] (pagina prezzi non consultata) | NoSQL: meno adatto a dati relazionali (contratti, rendiconti) |
| Pagamenti | **Cardcom** | Prezzi non pubblicati, preventivo su misura [DA VERIFICARE] | Gateway, acquirer e fatture certificate in un solo contratto, API e addebiti ricorrenti. https://www.cardcom.co.il/ |
| Pagamenti | **Tranzila** | Prezzi gateway non pubblicati [DA VERIFICARE]. In homepage solo "da ₪29/mese" per la cassa da mobile. | Tokenizzazione, addebiti ricorrenti, bit/PayPal. https://www.tranzila.com/ |
| Pagamenti | **PayPlus** | Non pubblicato sul sito ufficiale. Fonti secondarie: circa ₪79/mese + 0,6% + commissione acquirer, attivazione circa ₪250 [DA VERIFICARE] | https://www.payplus.co.il/ |
| Pagamenti | Stripe | **Non disponibile** per società israeliane | https://stripe.com/global (Israele assente) |
| Fatturazione | **iCount** Advanced | Da ₪32/mese (10 documenti), ₪59 (100), ₪85 (200). API inclusa nel piano completo. | https://www.icount.co.il/pricing/ |
| Fatturazione | **Rivhit** Business Plus | ₪170/mese con piano annuale (₪204 mensile), più modulo API ₪199/mese | Più costoso se serve l'API. https://www.rivhit.co.il/ (pagina "ריווחית אונליין") |
| Firma elettronica | **DocuSign** | Personal €9/mese, Standard €23/utente/mese (annuale, prezzi UE) | Prezzi in USD per Israele [DA VERIFICARE]. https://ecom.docusign.com/plans-and-pricing/esignature |
| Firma elettronica | **ComSign / WeSign** (Comda, israeliano) | Prezzo non pubblicato [DA VERIFICARE] | Firma digitale qualificata secondo la legge israeliana sulla firma elettronica del 2001. https://www.comsigntrust.com/wesign/ |
| Email | **Postmark** | Basic $15/mese (10.000 email) | Ottima deliverability. https://postmarkapp.com/pricing |
| Email | **Amazon SES** | À la carte: $0,10 ogni 1.000 email | Il più economico, ma configurazione AWS più tecnica. https://aws.amazon.com/ses/pricing/ |
| WhatsApp | **Twilio** | $0,005 a messaggio più la tariffa Meta | Integrazione più semplice, costo un po' più alto. https://www.twilio.com/en-us/whatsapp/pricing |
| Domini | Altri registrar ISOC-IL (es. MyNames) | .co.il: ₪74/anno IVA inclusa (annuncio del 03/2025) [DA VERIFICARE prezzo attuale] | https://mynames.co.il/ |

## 3. Costi

### Mensili, all'avvio (circa 30–60 immobili)
| Voce | Minimo | Massimo |
|---|---|---|
| Vercel Pro | $20 | $20 |
| Supabase Pro | $25 | $25 |
| Resend / Sentry / R2 | $0 | $0 |
| Dropbox Sign (dalla fase 2) | $0 | $15 |
| Morning Best | ₪45 | ₪54 |
| Grow (se si incassa online) | ₪0 | ₪59 + 0,75% |
| Domini (₪184/anno ÷ 12) | ₪15 | ₪15 |
| **Totale** | **circa ₪200/mese** (≈ $65) | **circa ₪310/mese** (≈ $100) + 0,75% sugli incassi |

### Mensili, a circa 200 immobili
| Voce | Minimo | Massimo |
|---|---|---|
| Vercel Pro (1–2 seat) | $20 | $40 |
| Supabase Pro (+ compute Small: $15 meno $10 di credito) | $25 | $30–40 |
| Resend Pro | $20 | $20 |
| Sentry Team | $26 | $26 |
| Dropbox Sign (2 utenti web, oppure API Essentials) | $50 | $75 |
| WhatsApp (circa 1.000 utility/mese × $0,0053) | ~$5 | ~$10 |
| Morning Extra (200 documenti) / Prime (500) | ₪89 | ₪155 |
| Grow + domini | ₪74 | ₪74 |
| **Totale** | **circa ₪600/mese** | **circa ₪900/mese** + 0,75% sugli incassi |

Opzionale: Supabase PITR (ripristino puntuale) +$100/mese, consigliato quando i dati economici diventano critici.

### Una tantum
- Domini .co.il + .com: ₪184 il primo anno (LiveDNS, IVA inclusa).
- Sviluppo MVP (freelance o agenzia): [stima da preventivo]. Chiedere 2–3 preventivi a prezzo fisso per fase.
- Security audit / penetration test prima del lancio: [stima da preventivo].
- Avvocato (termini d'uso, privacy policy in EN/HE/IT, aggiornamento dei contratti di gestione, consenso a comunicazioni digitali e firma elettronica, parere su database e trasferimento dati): [stima da preventivo]. ⚖️
- Commercialista (flussi di fatturazione, incassi per conto terzi): [stima da preventivo]. 🧾
- Eventuale attivazione del terminale di pagamento: dipende dal provider [DA VERIFICARE].

## 4. Piano per fasi

### Fase 0: preparazione (2–3 settimane) – **cosa deve fare David personalmente**
1. Creare una casella aziendale (es. `admin@<dominio>`) e aprire **tutti gli account a nome della società** (Easy Bayit Property Management Ltd, ח״פ 515863884): Vercel, Supabase, Resend, Sentry, Cloudflare, GitHub (organizzazione aziendale), LiveDNS, Morning, provider di pagamento, Dropbox Sign, Meta Business.
2. Attivare la 2FA su ogni account, pagare con la carta aziendale e invitare lo sviluppatore come membro del team. **Non condividere mai le password.**
3. Registrare i domini a nome della società.
4. Sottoscrivere i DPA (accordi sul trattamento dei dati) di Supabase, Vercel, Resend e Sentry.
5. Pagamenti: richiedere preventivi scritti a Grow, Cardcom e PayPlus con il volume reale, poi aprire il conto merchant (servono documenti societari e la conferma del conto bancario).
6. Contratto con lo sviluppatore: cessione di codice e proprietà intellettuale alla società, NDA, codice nel GitHub aziendale.
7. ⚖️/🧾 Incontri con avvocato e commercialista (punti al §5).

### Fase 1: MVP (indicativamente 8–10 settimane [stima])
- Login email + password con **2FA TOTP** (obbligatoria per staff/admin, fortemente consigliata ai proprietari) e reset password via email.
- Ruoli: admin, staff, proprietario, inquilino, con RLS e log di audit.
- Anagrafiche: immobili, proprietari, inquilini, contratti (date, canone, deposito, scadenze).
- Documenti con permessi per ruolo (contratti, foto, verbali). Upload da parte dello staff, download tracciato.
- **Rendiconti mensili PDF** generati dai dati e firmati digitalmente dal sistema, con archivio storico.
- **Manutenzione:** l'inquilino apre la richiesta con foto, lo staff allega il preventivo, il proprietario lo approva o rifiuta con un clic (tracciato), poi si seguono gli stati fino alla chiusura.
- **Storico pagamenti:** registrazione manuale o import CSV dei bonifici. Nessun incasso online nell'MVP.
- Notifiche email (Resend), interfaccia EN/HE(RTL)/IT, importi in ILS + EUR/USD (tasso BOI).
- Pannello admin minimo, backup automatici su R2, Sentry, accessibilità (IS 5568) fin dall'inizio.
- Test con 3–5 proprietari pilota, poi penetration test, poi lancio.

### Fase 2 (dopo l'MVP)
- Incasso online (pagina ospitata Grow o Cardcom) di commissioni di gestione e fatture di manutenzione. Riconciliazione automatica tramite webhook.
- Integrazione API Morning: fattura o ricevuta automatica con numero di allocazione.
- Firma elettronica dei contratti (Dropbox Sign prima da web, poi via API).
- Messaggistica interna (thread per immobile o richiesta).

### Fase 3
- Notifiche WhatsApp (template utility approvati da Meta, opt-in esplicito).
- Addebiti ricorrenti (הוראת קבע), report annuali per il proprietario, PWA mobile, PITR.

## 5. Rischi e punti aperti
| Rischio | Mitigazione |
|---|---|
| ⚖️ **Privacy:** legge israeliana sulla protezione della privacy (Emendamento 13), regolamenti sulla sicurezza delle informazioni, GDPR per i proprietari UE, trasferimento dati in UE | Parere legale prima del lancio, privacy policy in 3 lingue, minimizzazione dei dati, regione UE, DPA firmati, log di accesso |
| ⚖️🧾 **Incasso dell'affitto per conto dei proprietari** (gestione di fondi di terzi, conti fiduciari, eventuali licenze, chi emette le ricevute dell'affitto, trattamento fiscale dei proprietari non residenti) | Nell'MVP solo storico. Nessun incasso dell'affitto finché avvocato e commercialista non definiscono il modello |
| 🧾 Fatture "Heshboniot Israel" (numero di allocazione) e soglie | Usare un sistema approvato (Morning, iCount, Rivhit). Il commercialista conferma i flussi |
| ⚖️ Validità della firma elettronica sui contratti d'affitto (legge del 2001) e clausole obbligatorie (legge sull'affitto equo del 2017) | Parere legale. Se serve una firma qualificata, valutare ComSign |
| ⚖️ **Accessibilità obbligatoria** (regolamenti israeliani, standard IS 5568) | Requisito già nell'MVP e audit prima del lancio |
| ⚖️ Comunicazioni marketing (legge anti-spam, art. 30A) via email/WhatsApp | Solo messaggi transazionali, opt-in separato per il marketing |
| Sicurezza (accesso ai dati di altri proprietari) | RLS testata con test automatici, 2FA, penetration test, principio del minimo privilegio |
| Dipendenza da un solo sviluppatore | Codice e account aziendali, documentazione, stack diffuso (Postgres/Supabase) |
| Costi variabili (Vercel/Supabase a consumo) | Spend cap Supabase attivo di default, budget e alert su Vercel |
| Prezzi e tariffe che cambiano (es. WhatsApp ogni trimestre, fornitori USD con ILS forte o debole) | Ricontrollare le fonti prima di ogni contratto. Le voci [DA VERIFICARE] vanno chiuse con preventivi scritti |
| Adozione da parte di utenti non tecnici o anziani all'estero | Interfaccia semplice, 2FA con guida, supporto staff, fase pilota |
