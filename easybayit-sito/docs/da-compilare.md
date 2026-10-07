# Da compilare — elenco unico dei segnaposto

> Aggiornato al 2 ottobre 2026. Tutto ciò che David deve fornire o confermare prima (o dopo) il lancio.
> Nel sito i segnaposto compaiono **evidenziati in giallo**: `[TO CONFIRM]` (EN), `[לאישור]` (HE), `[À CONFIRMER]` (FR), `[DA CONFERMARE]` (IT); nell'hub legale e nel blog anche `[TO VERIFY]` / `[DA VERIFICARE …]`.
> Dove trovarli nel codice: testi in `src/i18n/{en,he,fr,it}.ts`, `src/i18n/extra/*.ts`, `src/i18n/legal/*.ts`, `src/i18n/popup.ts`; ogni valore va inserito **in tutte e 4 le lingue**.
> Legenda priorità: 🔴 bloccante per il lancio · 🟠 importante (subito dopo) · 🟢 può aspettare.

---

## 1. 🔴 Dominio, email e account (necessari per andare online)
- [ ] **Dominio principale** (es. `easybayit.co.il`) e domini secondari (es. `easybayit.com`) → acquisto su LiveDNS; poi `SITE_URL` su Vercel. Vedi `docs/go-live.md` §1–3.
- [ ] **Casella che riceve i lead** (`LEAD_TO_EMAIL`), es. `info@…`.
- [ ] **Mittente delle email del sito** (`LEAD_FROM_EMAIL`), es. `sito@notify.<dominio>` (sottodominio verificato su Resend).
- [ ] **Casella per i report DMARC** (es. `dmarc@<dominio>`).
- [ ] Account Vercel, Resend e repository Git: da creare da David (non creati da noi).
- [ ] Servizio di posta per il dominio principale (Google Workspace / Microsoft 365 / LiveDNS) `[DA DECIDERE]`.

## 2. 🔴 Contatti (pagina Contatti, Chi siamo, footer, pagina inquilini)
- [ ] Email pubblica.
- [ ] Telefono / WhatsApp.
- [ ] Orari d'ufficio.
- [ ] Indirizzo (sede / ufficio).
- [ ] Numero per le **emergenze** degli inquilini (perdite d'acqua, guasti elettrici) — pagina Inquilini.
- [ ] Tempo di risposta ai contatti ("rispondiamo personalmente entro …") — pagina Contatti.
- [ ] Tempo di ricontatto dopo il popup ("entro … giorno lavorativo") — `src/i18n/popup.ts`.

## 3. 🔴 Pagine legali
**Privacy** (`/privacy/`)
- [ ] Indirizzo ed email del titolare del trattamento (Easy Bayit Property Management Ltd, ח״פ 515863884 è già inserito).
- [ ] Dati raccolti (moduli: nome, email/WhatsApp, telefono, città, tipo di immobile, messaggio) e dati di gestione — confermare.
- [ ] Finalità del trattamento — confermare.
- [ ] Conservazione, base giuridica, trasferimenti all'estero: testo da completare secondo la Legge israeliana sulla protezione della privacy 5741-1981 (e Emendamento 13) e il GDPR dove applicabile — **da far scrivere/verificare a un avvocato**.
- [ ] Fornitori con cui si condividono dati (hosting Vercel, invio email Resend, …) — confermare l'elenco.
- [ ] Cookie: oggi il sito non usa cookie di analisi/pubblicità (il popup usa solo `localStorage` per non ripresentarsi) — confermare.
- [ ] Contatto per richieste di accesso / rettifica / cancellazione; contatto per domande sulla privacy.

**Termini** (`/terms/`)
- [ ] Legge applicabile e foro competente (es. legge israeliana, tribunale di …).

**Accessibilità** (`/accessibility/`)
- [ ] Data dell'ultimo aggiornamento della dichiarazione.
- [ ] Stato di conformità a IS 5568 (testo).
- [ ] Referente accessibilità: nome, telefono, email.

## 4. 🟠 Azienda e fiducia (Chi siamo, sezione "Verificabile")
- [ ] Anno e luogo di fondazione; frase di presentazione.
- [ ] Storia del fondatore (chi è, perché Easybayit, esperienza).
- [ ] Team: nome e ruolo del fondatore e del property manager (foto facoltative).
- [ ] Area di attività.
- [ ] Licenza di intermediazione immobiliare (se applicabile) e numero.
- [ ] Assicurazione di responsabilità professionale.
- [ ] Associazioni professionali.
- [ ] **Conto separato per i fondi dei clienti** (sì/no, banca) — citato anche in home ("affitti incassati tenuti su un conto separato").
- [ ] Modalità di pagamento dell'affitto ("bonifico a …, mai contanti") — Chi siamo.
- [ ] Testimonianze reali (solo verificate) — `[REAL TESTIMONIAL TO BE ADDED]` in home: oggi nascoste dietro il segnaposto.

## 5. 🟠 Prezzi e condizioni commerciali
I prezzi attuali sono **di esempio** (basati su benchmark di mercato): `src/data/pricing.ts`.
- [ ] Listino definitivo dei 3 piani (Essential 8% min ₪400, Full 10%, Care ₪950/mese: tutti da confermare) e quota di ricerca inquilino.
- [ ] Voci extra in pagina Prezzi: costi "al costo con fattura", interventi inclusi all'anno, tariffa oraria, % sui lavori, importo fisso.
- [ ] Ore incluse nel piano Care; servizi festività (sukkah, pulizie di Pesach/kasherizzazione tramite fornitore).
- [ ] Preavviso di uscita (oggi "30 giorni" in home) e condizioni di recesso (FAQ).
- [ ] **Soglia di approvazione** delle riparazioni (₪ …): sotto si procede, sopra serve il tuo OK — compare in Come funziona, Proprietari, FAQ, Inquilini, mockup.
- [ ] Garanzie di servizio: riduzione del canone di … % se mancano i tempi pubblicati — **da validare con l'avvocato** (`[TO CONFIRM with lawyer]`).
- [ ] Programma referral (home) e condizioni per costruttori/broker/avvocati (pagina Developers).
- [ ] Pacchetto fiscale annuale: data di consegna; incluso nel Full, prezzo per gli altri piani (hub Legale & Fiscale).

## 6. 🟠 Processi e tempi di servizio (SLA)
- [ ] Tempi di risposta pubblicati in home ("… ore", "… ore lavorative", "… giorni lavorativi").
- [ ] Giorno del mese entro cui arriva il rendiconto online; giorno entro cui si trasferisce il netto.
- [ ] Come paga l'inquilino (bonifico / ordine permanente / …).
- [ ] Cosa riceve il proprietario alla firma (contratto firmato + accesso al portale?).
- [ ] Canale per le richieste di manutenzione (modulo online / WhatsApp / …).
- [ ] Tempo di risposta del referente (dashboard demo).
- [ ] Contratto standard rivisto da un avvocato (sì/no) — Proprietari.
- [ ] Riepilogo annuale per il commercialista — Proprietari.
- [ ] Periodo di riferimento e tipo di immobile nei mockup della home.

## 7. 🟠 Lingue e copertura
- [ ] Lingue parlate davvero con proprietari (EN/HE/FR/IT?) e con inquilini (HE/EN?).
- [ ] Città servite: disponibilità a Gerusalemme, Beit Shemesh, Ra'anana, Netanya, Tel Aviv; frase "copertura per città".
- [ ] Videochiamata di sopralluogo su richiesta (home "Vivi all'estero?").
- [ ] Guida PDF nelle 4 lingue (pagina Guida).

## 8. 🟢 Tecnologia e sicurezza (pagina Tecnologia, Portale)
- [ ] Stato delle funzioni (attivo / in arrivo): incasso tramite fornitore di pagamento, avvisi email/SMS/WhatsApp, firma online, export per il commercialista, export dati del proprietario, 2FA.
- [ ] Fornitore di pagamento autorizzato (nome).
- [ ] Regione di hosting dei dati; frequenza dei backup cifrati; pagina di stato e obiettivo di uptime.
- [ ] Certificazioni di sicurezza (oggi: nessuna — confermare il testo).
- [ ] Portale: come vengono inviati rendiconti e documenti finché il portale non è attivo.

## 9. 🟠 Hub Legale & Fiscale, guida (revisione professionisti)
- [ ] Revisione di un **avvocato israeliano** e di un **commercialista** di tutti i punti `[TO VERIFY]` dell'hub `/legal-tax/` (tasse sugli affitti per non residenti, ritenuta alla fonte, IVA, mas shevach, Legge sull'affitto equo, sfratto, arnona, va'ad bayit, danni da atti ostili, privacy, accessibilità).
- [ ] Link al testo ufficiale del regolamento (sezione sfratto).
- [ ] Rete di professionisti: nomi pubblicabili solo dopo accordo scritto; eventuali compensi di segnalazione da dichiarare.
- [ ] Guida "Possedere dall'estero": revisione avvocato + commercialista prima della pubblicazione.
- [ ] Rigenerare i PDF della checklist dopo le modifiche (`node scripts/make-checklists.mjs` con la preview attiva).

## 10. 🟢 Blog (tutti gli articoli sono in bozza: non visibili in produzione)
Per ogni articolo: risolvere i `[DA VERIFICARE …]`, revisione madrelingua (+ avvocato/commercialista per fisco e legge), poi `draft: false`.

| Articolo | Lingue | Marcatori da verificare |
|---|---|---|
| Tasse sugli affitti per non residenti | EN · FR · IT | 7–8 per lingua (il più delicato) |
| Affitto a Gerusalemme | EN · FR · IT | 3 |
| Legge sull'affitto equo | EN · FR · IT | 2 |
| Immobile in affitto dall'estero | EN · FR · HE · IT | 2 |
| Property manager: servizi e costi | EN · FR · HE · IT | 2 |
| Preparare casa per le feste dall'estero | EN · FR · IT | 2 |

## 11. 🟠 Popup lead e moduli
- [ ] Tempo di ricontatto nel messaggio di conferma del popup (vedi §2).
- [ ] Offerta della variante A ("check gratuito della gestione attuale"): confermare che il servizio è davvero gratuito e senza impegno e chi lo esegue.
- [ ] Variante B: "stima affitto gratuita, verificata da un gestore locale" — confermare.
- [ ] Guida via email: invio automatico del PDF / newsletter con doppio opt-in? (oggi la richiesta arriva solo come lead).
- [ ] Dopo 2–4 settimane: confrontare le varianti A/B (il campo `variant` è nell'oggetto e nei tag delle email Resend).

## 12. 🟢 Grafica e SEO
- [ ] Logo definitivo (oggi provvisorio: `src/components/Logo.astro`, `public/favicon.svg`).
- [ ] Immagine social `og:image` 1200×630 (`src/layouts/Base.astro`).
- [ ] Foto reali (team, immobili gestiti con autorizzazione) — facoltative.
- [ ] Google Search Console: verifica del dominio e invio della sitemap dopo il lancio.

## 13. 🟢 Stima affitto (strumento)
- [ ] Coefficienti di aggiustamento (piano, ascensore, mamad, parcheggio, balcone, stato): sono **assunzioni di Easybayit**, da validare con un perito o dati reali (`src/lib/rent/estimate.ts`).
- [ ] Comparabili reali: oggi `demo`. Yad2 / Nadlan solo con accordo o API ufficiale `[DA VERIFICARE]` (`src/lib/rent/providers.ts`).

## 14. 🔴 Loghi delle istituzioni (solo test locale)
- [ ] I loghi di Corporations Authority, Tax Authority, Privacy Protection Authority e CBS restano **solo** con `SHOW_TEST_LOGOS=1` in locale. Per pubblicarli serve l'**autorizzazione scritta** di ciascuna autorità. Senza autorizzazione: non fare nulla (in produzione non compaiono).

## 15. Trust batch (pagine preparate ma disattivate)
Pagine `/service-metrics/` e `/trust-security/` dietro `SHOW_SERVICE_METRICS` / `SHOW_TRUST_SECURITY` (spente di default, `src/config/trust-flags.ts`), con dati di esempio in `src/data/trust/` (immobile e nomi fittizi).
- [ ] Listino usato negli esempi di rendiconto (Full 10% + IVA) — stesso punto del §5.
- [ ] Dati reali di SLA dal portale (`PORTAL_METRICS_URL`) prima di accendere le metriche.
- [ ] Contenuti di sicurezza (2FA, cifratura, regione dati) coerenti con il §8.
> Questa sezione è in lavorazione in parallelo: completarla con i segnaposto definitivi di quelle pagine.

---

### Come verificare che non manchi nulla
```bash
# segnaposto ancora presenti nei testi (EN come riferimento)
grep -rn "TO CONFIRM\|TO VERIFY\|REAL TESTIMONIAL" src/i18n/en.ts src/i18n/extra/en.ts src/i18n/legal/en.ts src/i18n/popup.ts
grep -rn "DA CONFERMARE\|DA VERIFICARE" src astro.config.mjs
```

---

## 16. 🟠 Trust batch: segnaposto definitivi (completa il §15)
Pagine attive: Transparency Pledge (con il Drive di esempio), Report mensile, Ispezioni, Videochiamata, Cambio gestore. Dettagli tecnici in `docs/trust-batch.md`.

**Impegni del Pledge** (`src/i18n/trust/*.ts` → `pledge`):
- [ ] **Nessun ricarico sui lavori:** si paga il prezzo della fattura originale, senza commissioni di segnalazione. È usato anche nel calcolatore di cambio gestore (`EASYBAYIT_MARKUP_PCT = 0`).
- [ ] **Affitti su conto separato**, distinto dai fondi operativi di Easybayit.
- [ ] **Preavviso di recesso:** 30 giorni, con consegna di documenti, chiavi e storico.
- [ ] **Data del report mensile:** in quale giorno lavorativo del mese è disponibile.

**Ispezioni:**
- [ ] **Valore legale** della presa visione nel portale (equivale a un inventario firmato?). Da chiedere all'avvocato.
- [ ] **Frequenza per piano:** Essential annuale, Full video trimestrale, Care ogni due settimane. Sono piani di esempio.

**Videochiamata** (`src/lib/trust/booking.ts`):
- [ ] **Giorni e orari:** oggi domenica–giovedì, 09:00–18:00 ora israeliana; chiamate da 15 minuti, slot ogni 30 minuti, preavviso minimo 12 ore, prenotabile fino a 21 giorni avanti.
- [ ] **Festività israeliane** escluse: l'elenco va integrato nel calendario reale.
- [ ] **Piattaforme** offerte (Google Meet, Zoom, WhatsApp video…).
- [ ] **Per andare online:** calendario e CRM reali, email di conferma e promemoria, rimozione della modalità simulata (vedi `docs/trust-batch.md`).

**Cambio gestore:**
- [ ] **Listino di esempio** (Essential / Full / Care) e mesi di affitto come commissione di locazione (Essential 1, Full ½, Care n.a.). Stesso punto del §5.
- [ ] **Durata tipica del passaggio** in settimane.
- [ ] **Modello di lettera di disdetta**, rivisto dall'avvocato.

**Fiducia e sicurezza** (pagina spenta, `SHOW_TRUST_SECURITY`):
- [ ] **Dati tecnici:** cifratura dei dati a riposo presso l'hosting, regione dei dati, backup.
- [ ] **Privacy:**
  - verifica di conformità alla Legge sulla privacy (Emendamento 13);
  - obblighi di registrazione delle banche dati;
  - responsabile privacy (se richiesto).
- [ ] **Licenze e assicurazioni:** licenza di agente immobiliare (se applicabile), assicurazione di responsabilità professionale.
- [ ] **Email** per segnalare problemi di sicurezza.
- [ ] **Conservazione dei dati** dopo la fine del mandato. Nel portale una ispezione completata si può solo cancellare per intero, con il service role.

**Metriche di servizio** (pagina spenta, `SHOW_SERVICE_METRICS`):
- [ ] **Prima di accendere** servono dati reali dal portale (`PUBLIC_METRICS_ENABLED=true` nel portale, `PORTAL_METRICS_URL` nel sito).

**Portale:**
- [ ] **Vault:** nuove categorie documento `utilities` (arnona/utenze) e `tax` per rispecchiare le 8 cartelle del Drive (`src/lib/vault-structure.ts`).
