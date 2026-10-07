// Hub "Legale & fiscale" — italiano. Stesse regole di en.ts (fonti ufficiali, nessun dato inventato, V = da verificare).
import type { LegalDict } from './en';
const V = '[DA VERIFICARE]';
const P = '[DA CONFERMARE]';
const L = '[DA CONFERMARE con l’avvocato]';

const it: LegalDict = {
  V, P, L,
  nav: 'Legale & fiscale',
  meta: {
    title: 'Leggi e tasse per proprietari in Israele · Easybayit',
    description: 'Tasse sugli affitti, ritenute per proprietari esteri, IVA, legge sull’affitto equo, contratto, sfratto, privacy e accessibilità, con fonti ufficiali.',
  },
  eyebrow: 'Hub legale & fiscale',
  h1: 'Il quadro legale e fiscale, spiegato con precisione.',
  lead: 'Ciò che ogni proprietario di un appartamento affittato in Israele dovrebbe sapere — residente o non residente. Ogni affermazione rimanda alla fonte ufficiale, con la data dell’ultima verifica.',
  disclaimer: 'Informazioni generali, non consulenza legale o fiscale. Le regole cambiano e dipendono dalla tua situazione: consulta un avvocato o un commercialista israeliano abilitato (e un consulente fiscale nel tuo Paese di residenza) prima di agire.',
  verifyNote: `I punti marcati ${V} sono in verifica con professionisti prima della pubblicazione.`,
  tocTitle: 'Indice',
  sourcesTitle: 'Fonti ufficiali',
  lastReview: 'Contenuti verificati l’ultima volta il 2 ottobre 2026',
  sections: [
    {
      id: 'rental-tax', icon: 'wallet', title: 'Tassazione degli affitti: i tre regimi',
      items: [
        { h: 'Regime di esenzione', p: 'L’affitto residenziale percepito da una persona fisica può essere totalmente esente quando il totale mensile degli affitti di tutti gli appartamenti residenziali non supera il tetto — ₪5.654 al mese per il 2026 secondo l’Autorità fiscale israeliana. Sopra il tetto si applica un’esenzione ridotta (parziale) fino al doppio del tetto; oltre, nessuna esenzione. Tra le condizioni, l’uso abitativo da parte dell’inquilino.' },
        { h: 'Regime del 10% (sezione 122)', p: 'Un’imposta fissa del 10% sull’affitto lordo, senza deduzione di spese né ammortamento. L’imposta si paga entro 30 giorni dalla fine dell’anno fiscale in cui l’affitto è stato percepito.' },
        { h: 'Regime ordinario (aliquote marginali)', p: 'L’affitto si somma agli altri redditi ed è tassato con le aliquote marginali; in cambio si possono dedurre spese come interessi, riparazioni, compensi di gestione e ammortamento.' },
        { h: 'Residenti e non residenti', p: `I non residenti sono tassati in Israele sugli affitti di fonte israeliana. Quali regimi siano disponibili per un non residente, come si applichino i punti di credito e come il Paese di residenza riconosca l’imposta israeliana in base al trattato contro le doppie imposizioni va verificato caso per caso ${V}.` },
      ],
      sources: ['itaBooklet2026', 'ita122', 'itaRights2024'],
    },
    {
      id: 'withholding', icon: 'doc', title: 'Ritenute e dichiarazioni per proprietari esteri',
      items: [
        { h: 'Ritenuta alla fonte', p: `L’affitto pagato a un non residente può essere soggetto a ritenuta da parte di chi paga, salvo autorizzazione a un’aliquota ridotta o esenzione rilasciata dall’ufficio delle imposte. La direttiva 2026 dell’Autorità fiscale stabilisce la procedura per le autorizzazioni, anche per gli affitti. Aliquote applicabili ${V}.` },
        { h: 'Dichiarazioni', p: `Il regime del 10% richiede dichiarazione e pagamento all’Autorità fiscale; gli altri regimi passano dalla dichiarazione annuale. L’obbligo di dichiarazione annuale per un non residente dipende dal regime e dagli altri redditi ${V}.` },
        { h: 'Bonifici all’estero', p: `Le banche possono chiedere documenti fiscali prima di trasferire l’affitto all’estero ${V}. Teniamo i documenti pronti nel portale.` },
      ],
      sources: ['itaWithholding2026', 'itaRights2024'],
    },
    {
      id: 'vat', icon: 'chart', title: 'IVA sui compensi di gestione',
      items: [
        { h: 'Aliquota', p: 'L’aliquota IVA ordinaria in Israele è del 18% dal 1° gennaio 2025. I compensi di gestione fatturati da un’impresa israeliana sono soggetti a IVA: per questo mostriamo i prezzi IVA inclusa.' },
        { h: 'L’affitto in sé', p: `L’affitto residenziale percepito da un privato in genere non è soggetto a IVA ${V}. Regole particolari possono valere per servizi resi a non residenti ${V}.` },
      ],
      sources: ['itaVat18'],
    },
    {
      id: 'purchase-sale', icon: 'key', title: 'Imposta d’acquisto e plusvalenze (investitori)',
      items: [
        { h: 'Imposta d’acquisto (mas rechisha)', p: 'Le aliquote dipendono dal valore e dal fatto che sia o meno l’unico appartamento residenziale; gli scaglioni sono aggiornati periodicamente. Usa il simulatore ufficiale dell’Autorità fiscale invece di stime approssimative.' },
        { h: 'Imposta sulla plusvalenza (mas shevach)', p: `Alla vendita la plusvalenza è tassata salvo esenzioni. Le esenzioni per l’unico appartamento hanno condizioni diverse per residenti e non residenti ${V}. Il regime scelto negli anni per gli affitti può incidere sul calcolo alla vendita (es. ammortamento) ${V}.` },
      ],
      sources: ['itaRealEstateSimulator'],
    },
    {
      id: 'fair-rental', icon: 'shield', title: 'La legge sull’affitto equo (2017)',
      items: [
        { h: 'Ambito', p: `La modifica del 2017 alla legge su locazione e comodato si applica alla maggior parte dei contratti residenziali; esclude tra l’altro i contratti fino a 3 mesi senza opzione di rinnovo e quelli con canone mensile oltre una soglia (₪20.000, indicizzata) ${V}.` },
        { h: 'Abitabilità', p: 'Il locatore deve consegnare un appartamento abitabile e in buono stato, come previsto dalla legge e dal suo allegato, e un contratto scritto con i contenuti obbligatori.' },
        { h: 'Riparazioni', p: 'Il locatore deve riparare i difetti non causati da un uso irragionevole dell’inquilino entro un tempo ragionevole e non oltre 30 giorni dalla richiesta — o 3 giorni per un difetto che impedisce di abitare ragionevolmente.' },
        { h: 'Garanzie e depositi', p: 'Le garanzie che comportano un esborso per l’inquilino hanno un tetto pari al minore tra tre mensilità e un terzo del canone dell’intera durata del contratto, e possono essere usate solo per gli scopi previsti dalla legge.' },
        { h: 'Costi non addebitabili all’inquilino', p: `Alcuni costi restano a carico del locatore, come l’assicurazione dell’edificio e la provvigione dell’agente se incaricato dal locatore ${V}.` },
      ],
      sources: ['knessetFairRental2017', 'govFairRentalBroker'],
    },
    {
      id: 'lease', icon: 'doc', title: 'Il contratto: gli elementi essenziali',
      items: [
        { h: 'Per iscritto, in una lingua che capisci', p: 'Il contratto scritto è obbligatorio per i contratti coperti dalla legge. Se non leggi l’ebraico, chiedi una traduzione e conserva entrambe le versioni.' },
        { h: 'Clausole da verificare', p: `Durata e opzioni; indicizzazione; garanzie (entro il tetto di legge); chi paga arnona, va’ad bayit e utenze; verbale di consegna con foto; accesso per riparazioni; recesso anticipato; preavvisi ${V}.` },
      ],
      sources: ['knessetFairRental2017'],
    },
    {
      id: 'eviction', icon: 'alert', title: 'Sfratto: panoramica della procedura',
      items: [
        { h: 'Solo tramite tribunale', p: `Lo sfratto di un inquilino passa da un’azione accelerata davanti al tribunale di primo grado (Magistrates’ Court) secondo il regolamento di procedura civile del 2018. L’azione accelerata riguarda solo il rilascio; le pretese economiche sono separate. Farsi giustizia da sé (cambiare serrature, staccare utenze) non è consentito ${V}.` },
        { h: 'Esecuzione', p: 'Se l’inquilino non lascia l’immobile dopo la sentenza, questa viene eseguita tramite l’Autorità per l’esecuzione e la riscossione.' },
      ],
      sources: ['kolZchutEviction'],
      note: `Link al testo ufficiale del regolamento da aggiungere dopo revisione ${V}.`,
    },
    {
      id: 'arnona-vaad', icon: 'pin', title: 'Arnona e va’ad bayit',
      items: [
        { h: 'Arnona (tassa comunale)', p: `L’arnona è a carico di chi occupa l’immobile; all’ingresso l’inquilino si registra presso il comune e, quando l’appartamento è vuoto, di norma paga il proprietario. Aliquote e riduzioni sono stabilite da ciascun comune ${V}.` },
        { h: 'Va’ad bayit (condominio)', p: `Le spese condominiali ordinarie sono spesso dell’inquilino e i lavori straordinari del proprietario — va scritto nel contratto ${V}.` },
      ],
      sources: [],
    },
    {
      id: 'insurance', icon: 'shield', title: 'Assicurazioni',
      items: [
        { h: 'Chi assicura cosa', p: 'L’assicurazione dell’edificio è a carico del locatore secondo la legge sull’affitto equo; l’inquilino di solito assicura i propri beni. Responsabilità civile e danni da acqua vanno verificati con un agente assicurativo abilitato.' },
        { h: 'Danni da guerra e terrorismo', p: `I danni da atti ostili sono in genere gestiti dal fondo statale di indennizzo anziché dalle polizze private ${V}.` },
      ],
      sources: ['knessetFairRental2017'],
    },
    {
      id: 'privacy', icon: 'lock', title: 'Privacy: Emendamento 13',
      items: [
        { h: 'In vigore dal 14 agosto 2025', p: 'L’Emendamento 13 alla legge sulla tutela della privacy ha ampliato le definizioni chiave, introdotto in alcuni casi la nomina di responsabili della protezione dei dati e attribuito all’Autorità per la privacy poteri sanzionatori amministrativi, anche pecuniari.' },
        { h: 'Cosa significa per locatori e gestori', p: `I fascicoli degli inquilini (documento d’identità, buste paga, documenti del garante) contengono dati personali: raccogliere solo il necessario, conservarli in sicurezza, limitare gli accessi e tenerli solo per il tempo necessario. Gli impegni di Easybayit sul trattamento dati saranno nel contratto di gestione ${L}.` },
      ],
      sources: ['ppaAmendment13'],
    },
    {
      id: 'accessibility', icon: 'user', title: 'Norme sull’accessibilità',
      items: [
        { h: 'Accessibilità digitale', p: 'In Israele i fornitori di servizi devono rendere accessibili i propri siti in base al regolamento del 2013 sull’accessibilità dei servizi, che rimanda allo standard israeliano SI 5568 (basato sulle WCAG, livello AA), e pubblicare una dichiarazione di accessibilità.' },
        { h: 'Il nostro approccio', p: `Questo sito e il portale proprietari sono progettati secondo le WCAG 2.x AA; vedi la dichiarazione di accessibilità. Gli obblighi di accessibilità fisica degli edifici sono un tema separato ${V}.` },
      ],
      sources: ['accessibilityRegs2013', 'si5568'],
    },
  ],
  checklist: {
    eyebrow: 'Scarica',
    title: 'Checklist di conformità per proprietari',
    lead: 'Un elenco pratico da seguire prima, durante e dopo un contratto. Stampalo o salvalo in PDF.',
    download: 'Scarica il PDF',
    print: 'Stampa',
    groups: [
      { title: 'Prima di affittare', items: ['Scegli il regime fiscale dell’anno e annota la scadenza', 'Non residente: chiedi l’autorizzazione sulle ritenute all’ufficio delle imposte', 'Appartamento abitabile; mamad, boiler, impianto elettrico verificati', 'Assicurazione dell’edificio attiva; verifica la copertura danni da acqua'] },
      { title: 'Firma del contratto', items: ['Contratto scritto con tutti i contenuti obbligatori, tradotto se serve', 'Garanzie entro il tetto di legge (minore tra 3 mensilità e 1/3 del canone totale)', 'Chi paga arnona, va’ad bayit, utenze — per iscritto', 'Verbale di consegna con foto datate e letture dei contatori'] },
      { title: 'Durante la locazione', items: ['Riparazioni: urgenti entro 3 giorni, le altre entro 30 giorni dalla richiesta', 'Conserva fatture e ricevute di ogni spesa', 'Affitti incassati e ritenute documentati ogni mese', 'Date di rinnovo e indicizzazione in calendario'] },
      { title: 'Fisco e dichiarazioni', items: ['Regime 10%: dichiara e paga entro 30 giorni dalla fine dell’anno', 'Dichiarazione annuale se dovuta — con il tuo commercialista', 'Dichiarazione nel Paese di residenza e credito da trattato (non residenti)', 'Pacchetto fiscale annuale inviato al commercialista'] },
      { title: 'Fine della locazione', items: ['Verbale di uscita con foto; confronto con l’ingresso', 'Restituisci o usa le garanzie solo come consentito dalla legge', 'Riporta arnona e utenze a tuo nome; letture finali', 'Niente giustizia privata: sfratto solo tramite tribunale'] },
      { title: 'Dati e privacy', items: ['Raccogli solo i dati necessari dell’inquilino', 'Conserva i documenti in sicurezza; limita gli accessi', 'Cancella i dati non più necessari', 'Verifica i termini di trattamento dati del gestore'] },
    ],
    footer: 'Informazioni generali, non consulenza legale o fiscale. Fonti e date su easybayit — Hub legale & fiscale.',
  },
  taxPack: {
    eyebrow: 'Servizio',
    title: 'Pacchetto fiscale annuale per il tuo commercialista',
    lead: 'Ogni anno prepariamo i documenti che servono al tuo commercialista — in Israele e nel tuo Paese di residenza. Non diamo consulenza fiscale: rendiamo il suo lavoro più rapido e preciso.',
    items: [
      'Affitti incassati mese per mese, per appartamento',
      'Tutte le spese con fatture originali (riparazioni, va’ad bayit, assicurazione, arnona se sfitto)',
      'Compensi di gestione con IVA separata',
      'Certificati di ritenuta e versamenti all’Autorità fiscale',
      'Importi anche in USD, EUR o GBP al cambio della Banca d’Israele, con la data',
      'Contratto, garanzie e inventario',
    ],
    when: `Consegnato entro il ${P} di ogni anno. Incluso nel piano Full; per gli altri piani ${P}.`,
  },
  partners: {
    eyebrow: 'Rete di partner',
    title: 'Professionisti abilitati, quando servono.',
    lead: `Stiamo costruendo una rete di professionisti abilitati indipendenti. I nomi saranno pubblicati solo dopo un accordo scritto ${P}. Eventuali accordi di segnalazione ti saranno comunicati.`,
    cards: [
      { icon: 'shield', role: 'Avvocato immobiliarista (Israele)', text: 'Contratti, controversie, sfratti, compravendite.' },
      { icon: 'chart', role: 'Commercialista abilitato (Israele)', text: 'Regimi fiscali sugli affitti, dichiarazioni annuali, autorizzazioni sulle ritenute.' },
      { icon: 'globe', role: 'Consulente fiscale internazionale', text: 'Italia, Francia, Regno Unito, USA: crediti da trattato e dichiarazioni nel Paese di residenza.' },
      { icon: 'key', role: 'Perito abilitato (shamai)', text: 'Valutazioni formali per vendite, successioni o controversie.' },
      { icon: 'doc', role: 'Agente assicurativo abilitato', text: 'Edificio, responsabilità civile, danni da acqua.' },
    ],
    placeholder: P,
  },
  teaser: {
    title: 'Legale & fiscale, con fonti ufficiali',
    text: 'Regimi fiscali, ritenute, legge sull’affitto equo, privacy — spiegati con precisione, con link a gov.il e ai testi di legge.',
    cta: 'Apri l’hub legale & fiscale',
  },
};
export default it;
