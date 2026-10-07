// Testi dei diagrammi dei flussi (manutenzione via WhatsApp, dati e denaro). Nomi delle persone FITTIZI.
const en = {
  eyebrow: 'How it flows',
  title: 'From a WhatsApp message to your monthly statement.',
  lead: 'One connected workflow: the tenant reports, we coordinate, you approve, and every shekel lands in your statement with its invoice.',
  planned: 'Integrations planned / in development. Brand names and logos belong to their owners and do not imply any partnership.',
  testMarker: 'TEST – remove before publishing',
  tabs: { maint: 'Maintenance', money: 'Money & data' },
  maint: [
    { t: 'Tenant', d: 'Reports a leak with a photo, any time.' },
    { t: 'WhatsApp bot', d: 'Asks urgency and availability, opens a ticket.' },
    { t: 'Easybayit portal', d: 'Ticket, photos and SLA timer in one place.' },
    { t: 'Technician', d: 'Booked in the calendar, quote attached.' },
    { t: 'Owner approval', d: 'One tap to approve the quote or ask for another.' },
    { t: 'Invoice', d: 'Tax invoice issued and filed with the job.' },
    { t: 'Monthly statement', d: 'Rent, costs and net payout in your currency.' },
  ],
  money: [
    { t: 'Registered company', d: 'Easy Bayit Property Management Ltd, registered in Israel; contracts and invoices in its name.' },
    { t: 'Rent estimate', d: 'Official averages by city and size, plus comparables.' },
    { t: 'Lease signed', d: 'Digital signature, documents archived.' },
    { t: 'Rent collected', d: 'Payment tracked; reminders if late.' },
    { t: 'Currency rates', d: 'Shown at the official representative rate, with date.' },
    { t: 'Annual tax pack', d: 'Income, expenses and invoices for your accountant.' },
    { t: 'Data protection', d: 'Access control and retention by design.' },
  ],
  labels: {
    cbs: 'CBS data', boi: 'Bank of Israel rates', ita: 'Tax Authority-ready', ica: 'Registered company', ppa: 'Privacy law (Amend. 13)',
    morning: 'Morning (Green Invoice)', grow: 'Grow payments',
  },
};
export type FlowsDict = typeof en;

const he: FlowsDict = {
  eyebrow: 'איך זה עובד',
  title: 'מהודעת וואטסאפ ועד הדוח החודשי שלכם.',
  lead: 'תהליך מחובר אחד: הדייר מדווח, אנחנו מתאמים, אתם מאשרים, וכל שקל מופיע בדוח עם החשבונית שלו.',
  planned: 'אינטגרציות מתוכננות / בפיתוח. שמות המותגים והלוגואים שייכים לבעליהם ואינם מעידים על שותפות.',
  testMarker: 'TEST – remove before publishing',
  tabs: { maint: 'תחזוקה', money: 'כסף ונתונים' },
  maint: [
    { t: 'דייר', d: 'מדווח על נזילה עם תמונה, בכל שעה.' },
    { t: 'בוט וואטסאפ', d: 'שואל על דחיפות וזמינות ופותח קריאה.' },
    { t: 'פורטל Easybayit', d: 'קריאה, תמונות וטיימר SLA במקום אחד.' },
    { t: 'טכנאי', d: 'נקבע ביומן, הצעת מחיר מצורפת.' },
    { t: 'אישור הבעלים', d: 'הקשה אחת לאישור ההצעה או לבקשת הצעה נוספת.' },
    { t: 'חשבונית', d: 'חשבונית מס מופקת ומתויקת עם העבודה.' },
    { t: 'דוח חודשי', d: 'שכירות, הוצאות ותשלום נטו במטבע שלכם.' },
  ],
  money: [
    { t: 'חברה רשומה', d: 'איזי בית ניהול נכסים בע״מ, רשומה בישראל; חוזים וחשבוניות בשמה.' },
    { t: 'הערכת שכירות', d: 'ממוצעים רשמיים לפי עיר וגודל, ועסקאות דומות.' },
    { t: 'חתימת חוזה', d: 'חתימה דיגיטלית, מסמכים בארכיון.' },
    { t: 'גביית שכירות', d: 'מעקב תשלומים ותזכורות באיחור.' },
    { t: 'שערי מטבע', d: 'לפי השער היציג הרשמי, עם תאריך.' },
    { t: 'חבילת מס שנתית', d: 'הכנסות, הוצאות וחשבוניות לרואה החשבון.' },
    { t: 'הגנת מידע', d: 'בקרת גישה ושמירת מידע מתוכננות מראש.' },
  ],
  labels: {
    cbs: 'נתוני הלמ״ס', boi: 'שערי בנק ישראל', ita: 'מוכן לרשות המסים', ica: 'חברה רשומה', ppa: 'חוק הגנת הפרטיות (תיקון 13)',
    morning: 'Morning (חשבונית ירוקה)', grow: 'Grow תשלומים',
  },
};

const fr: FlowsDict = {
  eyebrow: 'Le parcours',
  title: 'D’un message WhatsApp à votre relevé mensuel.',
  lead: 'Un seul flux connecté : le locataire signale, nous coordonnons, vous validez, et chaque shekel apparaît dans votre relevé avec sa facture.',
  planned: 'Intégrations prévues / en développement. Les marques et logos appartiennent à leurs propriétaires et n’impliquent aucun partenariat.',
  testMarker: 'TEST – remove before publishing',
  tabs: { maint: 'Maintenance', money: 'Argent & données' },
  maint: [
    { t: 'Locataire', d: 'Signale une fuite avec une photo, à toute heure.' },
    { t: 'Bot WhatsApp', d: 'Demande l’urgence et les disponibilités, ouvre un ticket.' },
    { t: 'Portail Easybayit', d: 'Ticket, photos et minuteur SLA au même endroit.' },
    { t: 'Technicien', d: 'Planifié dans l’agenda, devis joint.' },
    { t: 'Accord du propriétaire', d: 'Un geste pour valider le devis ou en demander un autre.' },
    { t: 'Facture', d: 'Facture fiscale émise et classée avec l’intervention.' },
    { t: 'Relevé mensuel', d: 'Loyer, frais et versement net dans votre devise.' },
  ],
  money: [
    { t: 'Société enregistrée', d: 'Easy Bayit Property Management Ltd, enregistrée en Israël ; contrats et factures à son nom.' },
    { t: 'Estimation du loyer', d: 'Moyennes officielles par ville et taille, plus comparables.' },
    { t: 'Bail signé', d: 'Signature électronique, documents archivés.' },
    { t: 'Loyer encaissé', d: 'Paiement suivi ; relances en cas de retard.' },
    { t: 'Taux de change', d: 'Au taux représentatif officiel, avec la date.' },
    { t: 'Dossier fiscal annuel', d: 'Revenus, dépenses et factures pour votre comptable.' },
    { t: 'Protection des données', d: 'Contrôle d’accès et conservation dès la conception.' },
  ],
  labels: {
    cbs: 'Données CBS', boi: 'Taux Banque d’Israël', ita: 'Prêt pour l’Autorité fiscale', ica: 'Société enregistrée', ppa: 'Loi vie privée (amend. 13)',
    morning: 'Morning (Green Invoice)', grow: 'Paiements Grow',
  },
};

const it: FlowsDict = {
  eyebrow: 'Il flusso',
  title: 'Da un messaggio WhatsApp al tuo rendiconto mensile.',
  lead: 'Un unico flusso collegato: l’inquilino segnala, noi coordiniamo, tu approvi, e ogni shekel finisce nel rendiconto con la sua fattura.',
  planned: 'Integrazioni previste / in sviluppo. Marchi e loghi appartengono ai rispettivi titolari e non implicano alcuna partnership.',
  testMarker: 'TEST – remove before publishing',
  tabs: { maint: 'Manutenzione', money: 'Denaro & dati' },
  maint: [
    { t: 'Inquilino', d: 'Segnala una perdita con una foto, a qualsiasi ora.' },
    { t: 'Bot WhatsApp', d: 'Chiede urgenza e disponibilità, apre un ticket.' },
    { t: 'Portale Easybayit', d: 'Ticket, foto e timer SLA in un unico posto.' },
    { t: 'Tecnico', d: 'Fissato in calendario, preventivo allegato.' },
    { t: 'Approvazione', d: 'Un tocco per approvare il preventivo o chiederne un altro.' },
    { t: 'Fattura', d: 'Fattura fiscale emessa e archiviata con l’intervento.' },
    { t: 'Rendiconto mensile', d: 'Affitto, costi e netto nella tua valuta.' },
  ],
  money: [
    { t: 'Società registrata', d: 'Easy Bayit Property Management Ltd, registrata in Israele; contratti e fatture a suo nome.' },
    { t: 'Stima affitto', d: 'Medie ufficiali per città e dimensione, più comparabili.' },
    { t: 'Contratto firmato', d: 'Firma digitale, documenti archiviati.' },
    { t: 'Affitto incassato', d: 'Pagamenti tracciati; solleciti se in ritardo.' },
    { t: 'Tassi di cambio', d: 'Al tasso rappresentativo ufficiale, con data.' },
    { t: 'Pacchetto fiscale annuale', d: 'Entrate, spese e fatture per il commercialista.' },
    { t: 'Protezione dati', d: 'Controllo accessi e conservazione by design.' },
  ],
  labels: {
    cbs: 'Dati CBS', boi: 'Tassi Banca d’Israele', ita: 'Pronto per l’Autorità fiscale', ica: 'Società registrata', ppa: 'Legge privacy (emend. 13)',
    morning: 'Morning (Green Invoice)', grow: 'Pagamenti Grow',
  },
};

export default { en, he, fr, it };
