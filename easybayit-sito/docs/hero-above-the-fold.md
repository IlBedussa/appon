# Home: primo viewport ("3 secondi") — decisioni e alternative

> 2 ottobre 2026. Versione in produzione = **A**. Nessun dato inventato: le uniche "prove" sono verificabili (numero di società, lingue, prezzi pubblici, mockup etichettato "Dati demo").

## Cosa deve capire il visitatore in 3 secondi
| Elemento | Dove | EN (A, in produzione) |
|---|---|---|
| Per chi | eyebrow | Property management for owners abroad |
| Promessa (≤ 8 parole) | H1 | Your property in Israel. **Every shekel visible.** |
| Sottotitolo (≤ 20 parole) | lead | Full-service management from abroad: you approve every quote, and every invoice and statement lands in your online drive. |
| Prova | sotto le CTA + visual | ✓ Registered Israeli company · No. 515863884 (link alla sezione "Verificabile") · EN/עברית/FR/IT · Public prices · mockup dashboard con badge "Demo data" |
| CTA primaria | bottone pieno | Get a free rent estimate → `/rent-estimate/` |
| CTA secondaria | bottone contorno | See a sample owner drive → `/transparency-pledge/#example-drive` |

Le 4 lingue sono in `src/i18n/extra/{en,he,it,fr}.ts` → `home` (eyebrow, h1a, h1b, lead, ctaPrimary, ctaSecondary, chips).

## Cosa è stato tolto dal primo viewport
- Terzo link ("Try the live owner dashboard"): il badge sul mockup porta già alla demo.
- Chip "Exit with 30 days' notice [TO CONFIRM]": un segnaposto giallo nel primo viewport toglie fiducia.
- "A Jerusalem-based team": non ancora confermato (sede/indirizzo sono `[DA CONFERMARE]`).
- Mobile: il pulsante flottante "Rent estimate" compare solo dopo l'hero (duplicava la CTA e copriva il mockup).

## Prestazioni (Lighthouse 12, build locale servita con compressione brotli come su Vercel)
| Pagina | Mobile perf | Desktop perf | CLS desktop prima → dopo |
|---|---|---|---|
| / (EN) | 96 → 98–99 | 96 → 100 | 0.117 → 0.033 |
| /he/ | 98 → 98 | 100 | 0.01 → 0.017 |
| /it/ | 96 → 99 | 99 → 100 | 0.058 → 0.002 |
| /fr/ | 97 → 99 | 100 → 100 | 0.006 → 0.002 |
Accessibilità, Best practices, SEO: 100 sulle pagine misurate. Nessuna immagine aggiunta: il visual resta in puro CSS/HTML.
Nota: `astro preview` non comprime l'HTML (321 KB), quindi Lighthouse in locale senza brotli dà ~84 su mobile: è un artefatto del server locale, non della pagina.

## Alternativa B (non in produzione) — "free check" come CTA principale
Più aggressiva sulla conversione di chi ha già un gestore. Da usare **solo** dopo aver confermato che il check è davvero gratuito e chi lo fa (`docs/da-compilare.md` §11).

| | EN | HE | IT | FR |
|---|---|---|---|---|
| eyebrow | Registered Israeli company · No. 515863884 | חברה רשומה בישראל · ח״פ 515863884 | Società israeliana registrata · n. 515863884 | Société israélienne immatriculée · n° 515863884 |
| H1 | Every quote. Every invoice. In your drive. | כל הצעת מחיר. כל חשבונית. בתיקייה שלך. | Ogni preventivo. Ogni fattura. Nel tuo drive. | Chaque devis. Chaque facture. Dans votre drive. |
| lead | Property management in Israel for owners abroad: approve each quote, see each original invoice, get a monthly statement in your language. | ניהול נכסים בישראל לבעלים בחו״ל: אשרו כל הצעה, ראו כל חשבונית מקורית, וקבלו דוח חודשי בשפה שלכם. | Gestione immobiliare in Israele per chi vive all'estero: approvi ogni preventivo, vedi ogni fattura originale, ricevi un rendiconto mensile nella tua lingua. | Gestion locative en Israël pour les propriétaires à l'étranger : validez chaque devis, consultez chaque facture originale, recevez un relevé mensuel dans votre langue. |
| CTA 1 | Compare your current manager's costs → `/switching-manager/` | השוו את העלויות של חברת הניהול הנוכחית | Confronta i costi del tuo gestore attuale | Comparez les coûts de votre gestionnaire actuel |
| CTA 2 | Get a free rent estimate | להערכת שכר דירה בחינם | Stima gratis l'affitto | Estimer mon loyer gratuitement |

Test A/B consigliato dopo il lancio (stesso meccanismo del popup: variante salvata in `localStorage`, campo `variant` nei lead).

## Hero v3 (3 ottobre 2026) — mockup "finito" e riga lingue nel footer
- **Laptop:** barra laterale con 5 voci reali (icona + etichetta localizzata, "Panoramica" attiva), titolo pagina + etichetta valuta all'inizio della riga (il telefono non la copre più), titolo del grafico. Misure in unità del contenitore (`cqi`): stesse proporzioni da 320 a 1440 px.
- **Telefono:** al posto dell'icona monitor, illustrazione SVG inline di uno scaldabagno con piccola perdita al raccordo + chiave inglese, etichetta "Foto demo", 2 miniature (ritagli della stessa illustrazione via `<use>`, zero peso in più), voce "Riparazione scaldabagno".
- **Nessuna animazione d'ingresso** (tolte le barre che "crescevano"): il mockup è completo al primo paint. Resta solo il galleggiamento leggero, disattivato con "riduci movimento".
- **Fix RTL:** le regole `[dir='rtl']` erano annullate dallo scoping di Astro (ora `:global(...)`); notch del telefono centrato.
- **Footer:** icona globo + etichetta "Lingua", nomi nativi (English · עברית · Français · Italiano), bersagli ≥ 44 px, testo ≈ 15:1, lingua attuale evidenziata; cookie `eb_lang` invariato.
- Lighthouse 12 (brotli, locale): mobile EN 99 · HE 98 · FR 98 · IT 98; desktop 99–100; CLS ≤ 0.023; A11y/BP/SEO 100. Screenshot: `screenshots/hero-v3/`.
