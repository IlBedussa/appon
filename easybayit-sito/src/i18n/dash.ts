// Testi della dashboard DEMO proprietari (EN/HE/IT/FR).
// I nomi di immobili e persone sono volutamente fittizi ("Demo", "Prova", "Test").

const en = {
  banner: 'Demo — sample data and fictional properties. This is not a live product and nothing is saved.',
  badge: 'Demo data',
  back: 'Back to the portal page',
  owner: 'Demo Owner',
  hello: 'Welcome back',
  navLabel: 'Dashboard sections',
  nav: {
    overview: 'Overview', properties: 'Properties', statement: 'Statements', maintenance: 'Maintenance', documents: 'Documents',
    leases: 'Tenants & leases', payments: 'Payments', messages: 'Messages', notifications: 'Notifications', security: 'Security',
  },
  currency: 'Display currency',
  ratesNote: 'Illustrative fixed rates for the demo, not live exchange rates.',
  theme: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
  openNotifications: 'Open notifications',
  props: {
    A: 'Demo Residence A', B: 'Sample Loft B', C: 'Example Flat C', D: 'Test House D',
    addr: 'Example St. {n} · Demo City',
    rooms: '{n} rooms',
  },
  tenant: { A: 'Tenant A (demo)', B: 'Tenant B (demo)', D: 'Tenant D (demo)' },
  manager: 'Account manager (demo)',
  kpi: {
    rent: 'Rent collected · September', occupancy: 'Occupancy', occupancySub: '{a} of {b} units let',
    maint: 'Open maintenance', maintSub: '1 urgent · 1 scheduled', payout: 'Next payout', payoutSub: 'Expected on {d}',
    rentSub: '3 of 3 payments received',
  },
  charts: {
    ie: 'Income vs expenses', ieSub: 'Last 12 months', income: 'Income', expenses: 'Expenses',
    cf: 'Net cash flow', cfSub: 'Cumulative, last 12 months', net: 'Net',
    summary: 'Chart: monthly income and expenses for the last 12 months (demo data).',
  },
  status: { occupied: 'Let', vacant: 'Vacant · listed', maintenance: 'Let · maintenance open' },
  propCols: { rent: 'Monthly rent', asking: 'Asking rent', leaseEnd: 'Lease ends', tenant: 'Tenant' },
  statement: {
    title: 'Monthly statement', month: 'Month', date: 'Date', item: 'Item', property: 'Property', amount: 'Amount', doc: 'Document',
    income: 'Total income', expenses: 'Total expenses', net: 'Net to owner', download: 'Download PDF', downloadNote: 'Demo: PDF download not available.',
    attached: 'Attached', items: {
      rent: 'Rent', fee: 'Management fee (demo rate)', repair: 'Repair: water heater', vaad: 'Building committee (va’ad bayit)',
      insurance: 'Building insurance', listing: 'Listing and viewings', cleaning: 'Cleaning before listing',
    },
  },
  maint: {
    title: 'Maintenance requests', opened: 'Opened {d}', urgent: 'Urgent', normal: 'Routine',
    req: { heater: 'Water heater not working', ac: 'Air conditioner noisy', tap: 'Kitchen tap leaking' },
    steps: ['Reported by tenant', 'Checked by account manager', 'Quote sent to owner', 'Technician scheduled', 'Closed · invoice in statement'],
    statusLabel: ['Reported', 'In review', 'Waiting for your approval', 'Scheduled', 'Closed'],
    quote: 'Quote for your approval', supplier: 'Supplier: licensed technician (demo)', qItems: ['Labour', 'Parts', 'VAT'], total: 'Total',
    approve: 'Approve', reject: 'Reject', confirmApprove: 'Confirm approval of this quote?', confirmReject: 'Reject this quote? Your account manager will contact you.',
    confirm: 'Confirm', cancel: 'Cancel', approved: 'Approved — technician will be scheduled', rejected: 'Rejected — your account manager will follow up', undo: 'Undo',
    rule: 'Rule: repairs above your approval limit always wait for you.',
  },
  docs: {
    title: 'Document vault', search: 'Search documents', filters: { all: 'All', lease: 'Leases', insurance: 'Insurance', invoice: 'Invoices', statement: 'Statements' },
    names: { lease: 'Lease agreement', insurance: 'Insurance policy', invoice: 'Invoice #{n}', statement: 'Statement {m}' },
    open: 'Open', empty: 'No documents match your filters.', count: '{n} documents',
  },
  leases: {
    title: 'Tenants & leases', start: 'Start', end: 'End', deposit: 'Guarantee', renewal: 'Lease ends in', days: 'days',
    remind: 'Set reminder', reminded: 'Reminder set (demo)', vacant: 'No tenant — listing active',
  },
  payments: {
    title: 'Payment history', date: 'Date', property: 'Property', tenant: 'Tenant', amount: 'Amount', method: 'Method', status: 'Status',
    methods: { transfer: 'Bank transfer', standing: 'Standing order' }, statuses: { paid: 'Paid', late: 'Paid late', pending: 'Due' },
  },
  messages: {
    title: 'Secure messages', with: 'Your fixed account manager', reply: 'Usually replies within [TO CONFIRM]',
    placeholder: 'Write a message…', send: 'Send', note: 'Demo: messages are not sent anywhere.', you: 'You',
    thread: [
      { from: 'm', text: 'Good morning. The tenant in Test House D reported the water heater. I checked photos: it needs a technician.', time: '24 Sep · 09:12' },
      { from: 'm', text: 'I have sent you a quote for approval in the Maintenance section.', time: '24 Sep · 09:14' },
      { from: 'o', text: 'Thanks. Is it covered by the building insurance?', time: '24 Sep · 18:40' },
      { from: 'm', text: 'No, it is inside the apartment. I attached the invoice terms to the quote.', time: '25 Sep · 08:05' },
    ],
  },
  notifications: {
    title: 'Notifications', markAll: 'Mark all as read', unread: '{n} unread',
    items: [
      { icon: 'tool', text: 'Quote waiting for your approval · Test House D', time: '2 h ago', unread: true },
      { icon: 'chart', text: 'September statement is ready', time: 'Yesterday', unread: true },
      { icon: 'wallet', text: 'Rent received · Demo Residence A', time: '1 Sep', unread: true },
      { icon: 'doc', text: 'New document: insurance policy', time: '28 Aug', unread: false },
      { icon: 'key', text: 'Lease renewal coming up · Sample Loft B', time: '20 Aug', unread: false },
    ],
  },
  security: {
    title: 'Security', twofa: 'Two-factor authentication', on: 'On', off: 'Off', twofaText: 'A code from your authenticator app is required at every login.',
    sessions: 'Active sessions', current: 'This device', signOut: 'Sign out', signedOut: 'Signed out (demo)',
    sessionList: [
      { device: 'Laptop · Browser', where: 'Demo location 1', when: 'Now', current: true },
      { device: 'Phone · App', where: 'Demo location 2', when: '2 days ago', current: false },
    ],
    log: 'Access log', event: 'Event', device: 'Device', when: 'When',
    logList: [
      { event: 'Login with 2FA', device: 'Laptop', when: 'Today 08:31' },
      { event: 'Viewed statement (September)', device: 'Laptop', when: 'Today 08:33' },
      { event: 'Downloaded document: lease A', device: 'Phone', when: '29 Sep 21:10' },
      { event: 'Login with 2FA', device: 'Phone', when: '29 Sep 21:08' },
      { event: 'Account manager viewed request R-1042', device: 'Staff', when: '24 Sep 09:10' },
    ],
  },
};
export type DashDict = typeof en;

const he: DashDict = {
  banner: 'הדגמה — נתונים לדוגמה ונכסים בדיוניים. זה לא מוצר פעיל ושום דבר לא נשמר.',
  badge: 'נתוני הדגמה',
  back: 'חזרה לעמוד הפורטל',
  owner: 'בעל נכס לדוגמה',
  hello: 'שמחים לראות אותך',
  navLabel: 'אזורי לוח הבקרה',
  nav: {
    overview: 'סקירה', properties: 'נכסים', statement: 'דוחות', maintenance: 'תחזוקה', documents: 'מסמכים',
    leases: 'שוכרים וחוזים', payments: 'תשלומים', messages: 'הודעות', notifications: 'התראות', security: 'אבטחה',
  },
  currency: 'מטבע תצוגה',
  ratesNote: 'שערים קבועים להמחשה בלבד, לא שערי חליפין עדכניים.',
  theme: { toDark: 'מעבר למצב כהה', toLight: 'מעבר למצב בהיר' },
  openNotifications: 'פתיחת התראות',
  props: {
    A: 'דירת הדגמה A', B: 'לופט לדוגמה B', C: 'דירת דוגמה C', D: 'בית ניסיון D',
    addr: 'רחוב הדוגמה {n} · עיר הדגמה',
    rooms: '{n} חדרים',
  },
  tenant: { A: 'שוכר A (הדגמה)', B: 'שוכרת B (הדגמה)', D: 'שוכר D (הדגמה)' },
  manager: 'מנהל/ת תיק (הדגמה)',
  kpi: {
    rent: 'שכר דירה שנגבה · ספטמבר', occupancy: 'תפוסה', occupancySub: '{a} מתוך {b} יחידות מושכרות',
    maint: 'קריאות פתוחות', maintSub: '1 דחופה · 1 מתוזמנת', payout: 'ההעברה הבאה', payoutSub: 'צפויה ב־{d}',
    rentSub: '3 מתוך 3 תשלומים התקבלו',
  },
  charts: {
    ie: 'הכנסות מול הוצאות', ieSub: '12 החודשים האחרונים', income: 'הכנסות', expenses: 'הוצאות',
    cf: 'תזרים נטו', cfSub: 'מצטבר, 12 החודשים האחרונים', net: 'נטו',
    summary: 'תרשים: הכנסות והוצאות חודשיות ב־12 החודשים האחרונים (נתוני הדגמה).',
  },
  status: { occupied: 'מושכר', vacant: 'פנוי · בפרסום', maintenance: 'מושכר · קריאה פתוחה' },
  propCols: { rent: 'שכר דירה חודשי', asking: 'מחיר מבוקש', leaseEnd: 'סיום חוזה', tenant: 'שוכר' },
  statement: {
    title: 'דוח חודשי', month: 'חודש', date: 'תאריך', item: 'פריט', property: 'נכס', amount: 'סכום', doc: 'מסמך',
    income: 'סה״כ הכנסות', expenses: 'סה״כ הוצאות', net: 'נטו לבעל הנכס', download: 'הורדת PDF', downloadNote: 'הדגמה: הורדת PDF לא זמינה.',
    attached: 'מצורף', items: {
      rent: 'שכר דירה', fee: 'דמי ניהול (תעריף הדגמה)', repair: 'תיקון: דוד מים', vaad: 'ועד בית',
      insurance: 'ביטוח מבנה', listing: 'פרסום וסיורים', cleaning: 'ניקיון לפני פרסום',
    },
  },
  maint: {
    title: 'קריאות שירות', opened: 'נפתחה ב־{d}', urgent: 'דחוף', normal: 'שגרתי',
    req: { heater: 'דוד המים לא עובד', ac: 'המזגן רועש', tap: 'הברז במטבח מטפטף' },
    steps: ['השוכר דיווח', 'מנהל/ת התיק בדק/ה', 'הצעת מחיר נשלחה לבעל הנכס', 'נקבע מועד לטכנאי', 'נסגרה · החשבונית בדוח'],
    statusLabel: ['דווחה', 'בבדיקה', 'ממתינה לאישורך', 'מתוזמנת', 'נסגרה'],
    quote: 'הצעת מחיר לאישורך', supplier: 'ספק: טכנאי מוסמך (הדגמה)', qItems: ['עבודה', 'חלקים', 'מע״מ'], total: 'סה״כ',
    approve: 'אישור', reject: 'דחייה', confirmApprove: 'לאשר את הצעת המחיר?', confirmReject: 'לדחות את ההצעה? מנהל/ת התיק יחזרו אליך.',
    confirm: 'כן, להמשיך', cancel: 'ביטול', approved: 'אושר — נקבע מועד לטכנאי', rejected: 'נדחה — מנהל/ת התיק יחזרו אליך', undo: 'ביטול הפעולה',
    rule: 'הכלל: תיקון מעל תקרת האישור שלך תמיד מחכה לך.',
  },
  docs: {
    title: 'כספת מסמכים', search: 'חיפוש מסמכים', filters: { all: 'הכול', lease: 'חוזים', insurance: 'ביטוח', invoice: 'חשבוניות', statement: 'דוחות' },
    names: { lease: 'חוזה שכירות', insurance: 'פוליסת ביטוח', invoice: 'חשבונית {n}', statement: 'דוח {m}' },
    open: 'פתיחה', empty: 'אין מסמכים שמתאימים לסינון.', count: '{n} מסמכים',
  },
  leases: {
    title: 'שוכרים וחוזים', start: 'התחלה', end: 'סיום', deposit: 'ביטחונות', renewal: 'החוזה מסתיים בעוד', days: 'ימים',
    remind: 'תזכורת', reminded: 'התזכורת נקבעה (הדגמה)', vacant: 'אין שוכר — הנכס בפרסום',
  },
  payments: {
    title: 'היסטוריית תשלומים', date: 'תאריך', property: 'נכס', tenant: 'שוכר', amount: 'סכום', method: 'אמצעי', status: 'סטטוס',
    methods: { transfer: 'העברה בנקאית', standing: 'הוראת קבע' }, statuses: { paid: 'שולם', late: 'שולם באיחור', pending: 'לתשלום' },
  },
  messages: {
    title: 'הודעות מאובטחות', with: 'מנהל/ת התיק הקבוע/ה שלך', reply: 'זמן מענה רגיל: [לאישור]',
    placeholder: 'כתיבת הודעה…', send: 'שליחה', note: 'הדגמה: ההודעות לא נשלחות.', you: 'את/ה',
    thread: [
      { from: 'm', text: 'בוקר טוב. השוכר בבית ניסיון D דיווח על דוד המים. ראיתי את התמונות — צריך טכנאי.', time: '24 בספט׳ · 09:12' },
      { from: 'm', text: 'שלחתי לך הצעת מחיר לאישור באזור התחזוקה.', time: '24 בספט׳ · 09:14' },
      { from: 'o', text: 'תודה. זה מכוסה בביטוח הבניין?', time: '24 בספט׳ · 18:40' },
      { from: 'm', text: 'לא, התקלה בתוך הדירה. צירפתי להצעה את תנאי החשבונית.', time: '25 בספט׳ · 08:05' },
    ],
  },
  notifications: {
    title: 'התראות', markAll: 'סימון הכול כנקרא', unread: '{n} שלא נקראו',
    items: [
      { icon: 'tool', text: 'הצעת מחיר ממתינה לאישורך · בית ניסיון D', time: 'לפני שעתיים', unread: true },
      { icon: 'chart', text: 'הדוח של ספטמבר מוכן', time: 'אתמול', unread: true },
      { icon: 'wallet', text: 'שכר דירה התקבל · דירת הדגמה A', time: '1 בספט׳', unread: true },
      { icon: 'doc', text: 'מסמך חדש: פוליסת ביטוח', time: '28 באוג׳', unread: false },
      { icon: 'key', text: 'חידוש חוזה מתקרב · לופט לדוגמה B', time: '20 באוג׳', unread: false },
    ],
  },
  security: {
    title: 'אבטחה', twofa: 'אימות דו־שלבי', on: 'פעיל', off: 'כבוי', twofaText: 'בכל כניסה נדרש קוד מאפליקציית האימות.',
    sessions: 'חיבורים פעילים', current: 'המכשיר הזה', signOut: 'ניתוק', signedOut: 'נותק (הדגמה)',
    sessionList: [
      { device: 'מחשב נייד · דפדפן', where: 'מיקום הדגמה 1', when: 'עכשיו', current: true },
      { device: 'טלפון · אפליקציה', where: 'מיקום הדגמה 2', when: 'לפני יומיים', current: false },
    ],
    log: 'יומן גישה', event: 'פעולה', device: 'מכשיר', when: 'מתי',
    logList: [
      { event: 'כניסה עם אימות דו־שלבי', device: 'מחשב נייד', when: 'היום 08:31' },
      { event: 'צפייה בדוח (ספטמבר)', device: 'מחשב נייד', when: 'היום 08:33' },
      { event: 'הורדת מסמך: חוזה A', device: 'טלפון', when: '29 בספט׳ 21:10' },
      { event: 'כניסה עם אימות דו־שלבי', device: 'טלפון', when: '29 בספט׳ 21:08' },
      { event: 'מנהל/ת התיק צפה/תה בקריאה R-1042', device: 'צוות', when: '24 בספט׳ 09:10' },
    ],
  },
};

const it: DashDict = {
  banner: 'Demo — dati di esempio e immobili fittizi. Non è un prodotto attivo e nulla viene salvato.',
  badge: 'Dati demo',
  back: 'Torna alla pagina del portale',
  owner: 'Proprietario Demo',
  hello: 'Bentornato',
  navLabel: 'Sezioni della dashboard',
  nav: {
    overview: 'Panoramica', properties: 'Immobili', statement: 'Rendiconti', maintenance: 'Manutenzione', documents: 'Documenti',
    leases: 'Inquilini e contratti', payments: 'Pagamenti', messages: 'Messaggi', notifications: 'Notifiche', security: 'Sicurezza',
  },
  currency: 'Valuta di visualizzazione',
  ratesNote: 'Tassi fissi illustrativi per la demo, non cambi reali aggiornati.',
  theme: { toDark: 'Passa al tema scuro', toLight: 'Passa al tema chiaro' },
  openNotifications: 'Apri le notifiche',
  props: {
    A: 'Residenza Demo A', B: 'Loft di Prova B', C: 'Appartamento Esempio C', D: 'Casa Test D',
    addr: 'Via Esempio {n} · Città Demo',
    rooms: '{n} locali',
  },
  tenant: { A: 'Inquilino A (demo)', B: 'Inquilina B (demo)', D: 'Inquilino D (demo)' },
  manager: 'Referente (demo)',
  kpi: {
    rent: 'Affitti incassati · settembre', occupancy: 'Occupazione', occupancySub: '{a} su {b} unità affittate',
    maint: 'Manutenzioni aperte', maintSub: '1 urgente · 1 programmata', payout: 'Prossimo bonifico', payoutSub: 'Previsto il {d}',
    rentSub: '3 pagamenti su 3 ricevuti',
  },
  charts: {
    ie: 'Entrate vs uscite', ieSub: 'Ultimi 12 mesi', income: 'Entrate', expenses: 'Uscite',
    cf: 'Flusso di cassa netto', cfSub: 'Cumulato, ultimi 12 mesi', net: 'Netto',
    summary: 'Grafico: entrate e uscite mensili degli ultimi 12 mesi (dati demo).',
  },
  status: { occupied: 'Affittato', vacant: 'Libero · in annuncio', maintenance: 'Affittato · manutenzione aperta' },
  propCols: { rent: 'Affitto mensile', asking: 'Affitto richiesto', leaseEnd: 'Fine contratto', tenant: 'Inquilino' },
  statement: {
    title: 'Rendiconto mensile', month: 'Mese', date: 'Data', item: 'Voce', property: 'Immobile', amount: 'Importo', doc: 'Documento',
    income: 'Totale entrate', expenses: 'Totale uscite', net: 'Netto al proprietario', download: 'Scarica PDF', downloadNote: 'Demo: download PDF non disponibile.',
    attached: 'Allegato', items: {
      rent: 'Affitto', fee: 'Compenso di gestione (tariffa demo)', repair: 'Riparazione: scaldabagno', vaad: 'Spese condominiali (va’ad bayit)',
      insurance: 'Assicurazione fabbricato', listing: 'Annuncio e visite', cleaning: 'Pulizia prima dell’annuncio',
    },
  },
  maint: {
    title: 'Richieste di manutenzione', opened: 'Aperta il {d}', urgent: 'Urgente', normal: 'Ordinaria',
    req: { heater: 'Scaldabagno guasto', ac: 'Condizionatore rumoroso', tap: 'Rubinetto della cucina che perde' },
    steps: ['Segnalata dall’inquilino', 'Verificata dal referente', 'Preventivo inviato al proprietario', 'Tecnico programmato', 'Chiusa · fattura nel rendiconto'],
    statusLabel: ['Segnalata', 'In verifica', 'In attesa della tua approvazione', 'Programmata', 'Chiusa'],
    quote: 'Preventivo da approvare', supplier: 'Fornitore: tecnico abilitato (demo)', qItems: ['Manodopera', 'Ricambi', 'IVA'], total: 'Totale',
    approve: 'Approva', reject: 'Rifiuta', confirmApprove: 'Confermi l’approvazione del preventivo?', confirmReject: 'Rifiutare il preventivo? Il referente ti contatterà.',
    confirm: 'Conferma', cancel: 'Annulla', approved: 'Approvato — il tecnico verrà programmato', rejected: 'Rifiutato — il referente ti ricontatterà', undo: 'Annulla azione',
    rule: 'Regola: le riparazioni oltre il tuo limite di approvazione aspettano sempre te.',
  },
  docs: {
    title: 'Archivio documenti', search: 'Cerca documenti', filters: { all: 'Tutti', lease: 'Contratti', insurance: 'Assicurazioni', invoice: 'Fatture', statement: 'Rendiconti' },
    names: { lease: 'Contratto di locazione', insurance: 'Polizza assicurativa', invoice: 'Fattura n. {n}', statement: 'Rendiconto {m}' },
    open: 'Apri', empty: 'Nessun documento corrisponde ai filtri.', count: '{n} documenti',
  },
  leases: {
    title: 'Inquilini e contratti', start: 'Inizio', end: 'Fine', deposit: 'Garanzia', renewal: 'Il contratto scade tra', days: 'giorni',
    remind: 'Imposta promemoria', reminded: 'Promemoria impostato (demo)', vacant: 'Nessun inquilino — annuncio attivo',
  },
  payments: {
    title: 'Storico pagamenti', date: 'Data', property: 'Immobile', tenant: 'Inquilino', amount: 'Importo', method: 'Metodo', status: 'Stato',
    methods: { transfer: 'Bonifico', standing: 'Ordine permanente' }, statuses: { paid: 'Pagato', late: 'Pagato in ritardo', pending: 'In scadenza' },
  },
  messages: {
    title: 'Messaggi sicuri', with: 'Il tuo referente fisso', reply: 'Risponde di solito entro [DA CONFERMARE]',
    placeholder: 'Scrivi un messaggio…', send: 'Invia', note: 'Demo: i messaggi non vengono inviati.', you: 'Tu',
    thread: [
      { from: 'm', text: 'Buongiorno. L’inquilino di Casa Test D ha segnalato lo scaldabagno. Ho visto le foto: serve un tecnico.', time: '24 set · 09:12' },
      { from: 'm', text: 'Ti ho inviato un preventivo da approvare nella sezione Manutenzione.', time: '24 set · 09:14' },
      { from: 'o', text: 'Grazie. È coperto dall’assicurazione del palazzo?', time: '24 set · 18:40' },
      { from: 'm', text: 'No, il guasto è dentro l’appartamento. Ho allegato al preventivo le condizioni della fattura.', time: '25 set · 08:05' },
    ],
  },
  notifications: {
    title: 'Notifiche', markAll: 'Segna tutte come lette', unread: '{n} da leggere',
    items: [
      { icon: 'tool', text: 'Preventivo in attesa di approvazione · Casa Test D', time: '2 ore fa', unread: true },
      { icon: 'chart', text: 'Il rendiconto di settembre è pronto', time: 'Ieri', unread: true },
      { icon: 'wallet', text: 'Affitto ricevuto · Residenza Demo A', time: '1 set', unread: true },
      { icon: 'doc', text: 'Nuovo documento: polizza assicurativa', time: '28 ago', unread: false },
      { icon: 'key', text: 'Rinnovo contratto in arrivo · Loft di Prova B', time: '20 ago', unread: false },
    ],
  },
  security: {
    title: 'Sicurezza', twofa: 'Autenticazione a due fattori', on: 'Attiva', off: 'Disattiva', twofaText: 'A ogni accesso serve un codice dalla tua app di autenticazione.',
    sessions: 'Sessioni attive', current: 'Questo dispositivo', signOut: 'Disconnetti', signedOut: 'Disconnesso (demo)',
    sessionList: [
      { device: 'Laptop · Browser', where: 'Località demo 1', when: 'Ora', current: true },
      { device: 'Telefono · App', where: 'Località demo 2', when: '2 giorni fa', current: false },
    ],
    log: 'Registro accessi', event: 'Evento', device: 'Dispositivo', when: 'Quando',
    logList: [
      { event: 'Accesso con 2FA', device: 'Laptop', when: 'Oggi 08:31' },
      { event: 'Visualizzato rendiconto (settembre)', device: 'Laptop', when: 'Oggi 08:33' },
      { event: 'Scaricato documento: contratto A', device: 'Telefono', when: '29 set 21:10' },
      { event: 'Accesso con 2FA', device: 'Telefono', when: '29 set 21:08' },
      { event: 'Il referente ha visualizzato la richiesta R-1042', device: 'Staff', when: '24 set 09:10' },
    ],
  },
};


const fr: DashDict = {
  banner: 'Démo — données d’exemple et biens fictifs. Ce n’est pas un produit en service et rien n’est enregistré.',
  badge: 'Données de démo',
  back: 'Retour à la page du portail',
  owner: 'Propriétaire Démo',
  hello: 'Bon retour',
  navLabel: 'Sections de l’espace',
  nav: {
    overview: 'Vue d’ensemble', properties: 'Biens', statement: 'Relevés', maintenance: 'Interventions', documents: 'Documents',
    leases: 'Locataires & baux', payments: 'Paiements', messages: 'Messages', notifications: 'Notifications', security: 'Sécurité',
  },
  currency: 'Devise d’affichage',
  ratesNote: 'Taux fixes indicatifs pour la démo, pas des taux de change en direct.',
  theme: { toDark: 'Passer en mode sombre', toLight: 'Passer en mode clair' },
  openNotifications: 'Ouvrir les notifications',
  props: {
    A: 'Résidence Démo A', B: 'Loft Exemple B', C: 'Appartement Exemple C', D: 'Maison Test D',
    addr: '{n} rue de l’Exemple · Ville Démo',
    rooms: '{n} pièces',
  },
  tenant: { A: 'Locataire A (démo)', B: 'Locataire B (démo)', D: 'Locataire D (démo)' },
  manager: 'Gestionnaire (démo)',
  kpi: {
    rent: 'Loyers encaissés · septembre', occupancy: 'Taux d’occupation', occupancySub: '{a} logements loués sur {b}',
    maint: 'Interventions ouvertes', maintSub: '1 urgente · 1 planifiée', payout: 'Prochain versement', payoutSub: 'Prévu le {d}',
    rentSub: '3 paiements reçus sur 3',
  },
  charts: {
    ie: 'Recettes et dépenses', ieSub: '12 derniers mois', income: 'Recettes', expenses: 'Dépenses',
    cf: 'Trésorerie nette', cfSub: 'Cumulée, 12 derniers mois', net: 'Net',
    summary: 'Graphique : recettes et dépenses mensuelles des 12 derniers mois (données de démo).',
  },
  status: { occupied: 'Loué', vacant: 'Vacant · en annonce', maintenance: 'Loué · intervention en cours' },
  propCols: { rent: 'Loyer mensuel', asking: 'Loyer demandé', leaseEnd: 'Fin du bail', tenant: 'Locataire' },
  statement: {
    title: 'Relevé mensuel', month: 'Mois', date: 'Date', item: 'Libellé', property: 'Bien', amount: 'Montant', doc: 'Justificatif',
    income: 'Total recettes', expenses: 'Total dépenses', net: 'Net propriétaire', download: 'Télécharger le PDF', downloadNote: 'Démo : téléchargement PDF indisponible.',
    attached: 'Joint', items: {
      rent: 'Loyer', fee: 'Frais de gestion (taux démo)', repair: 'Réparation : chauffe-eau', vaad: 'Charges de copropriété (va’ad bayit)',
      insurance: 'Assurance de l’immeuble', listing: 'Annonce et visites', cleaning: 'Ménage avant mise en location',
    },
  },
  maint: {
    title: 'Demandes d’intervention', opened: 'Ouverte le {d}', urgent: 'Urgent', normal: 'Courant',
    req: { heater: 'Chauffe-eau en panne', ac: 'Climatisation bruyante', tap: 'Robinet de cuisine qui fuit' },
    steps: ['Signalée par le locataire', 'Vérifiée par le gestionnaire', 'Devis envoyé au propriétaire', 'Technicien planifié', 'Clôturée · facture dans le relevé'],
    statusLabel: ['Signalée', 'En analyse', 'En attente de votre validation', 'Planifiée', 'Clôturée'],
    quote: 'Devis à valider', supplier: 'Fournisseur : technicien qualifié (démo)', qItems: ['Main-d’œuvre', 'Pièces', 'TVA'], total: 'Total',
    approve: 'Valider', reject: 'Refuser', confirmApprove: 'Confirmer la validation de ce devis ?', confirmReject: 'Refuser ce devis ? Votre gestionnaire vous contactera.',
    confirm: 'Confirmer', cancel: 'Annuler', approved: 'Validé — le technicien va être planifié', rejected: 'Refusé — votre gestionnaire va revenir vers vous', undo: 'Annuler l’action',
    rule: 'Règle : les réparations au-delà de votre plafond attendent toujours votre accord.',
  },
  docs: {
    title: 'Coffre-fort documentaire', search: 'Rechercher un document', filters: { all: 'Tous', lease: 'Baux', insurance: 'Assurances', invoice: 'Factures', statement: 'Relevés' },
    names: { lease: 'Contrat de bail', insurance: 'Police d’assurance', invoice: 'Facture n° {n}', statement: 'Relevé {m}' },
    open: 'Ouvrir', empty: 'Aucun document ne correspond à vos filtres.', count: '{n} documents',
  },
  leases: {
    title: 'Locataires & baux', start: 'Début', end: 'Fin', deposit: 'Garantie', renewal: 'Fin du bail dans', days: 'jours',
    remind: 'Créer un rappel', reminded: 'Rappel créé (démo)', vacant: 'Pas de locataire — annonce en ligne',
  },
  payments: {
    title: 'Historique des paiements', date: 'Date', property: 'Bien', tenant: 'Locataire', amount: 'Montant', method: 'Mode', status: 'Statut',
    methods: { transfer: 'Virement', standing: 'Virement permanent' }, statuses: { paid: 'Payé', late: 'Payé en retard', pending: 'À échoir' },
  },
  messages: {
    title: 'Messagerie sécurisée', with: 'Votre gestionnaire attitré', reply: 'Répond généralement sous [À CONFIRMER]',
    placeholder: 'Écrire un message…', send: 'Envoyer', note: 'Démo : les messages ne sont envoyés nulle part.', you: 'Vous',
    thread: [
      { from: 'm', text: 'Bonjour. Le locataire de la Maison Test D a signalé le chauffe-eau. J’ai vu les photos : il faut un technicien.', time: '24 sept. · 09:12' },
      { from: 'm', text: 'Je vous ai envoyé un devis à valider dans la section Interventions.', time: '24 sept. · 09:14' },
      { from: 'o', text: 'Merci. Est-ce couvert par l’assurance de l’immeuble ?', time: '24 sept. · 18:40' },
      { from: 'm', text: 'Non, c’est à l’intérieur de l’appartement. J’ai joint les conditions de la facture au devis.', time: '25 sept. · 08:05' },
    ],
  },
  notifications: {
    title: 'Notifications', markAll: 'Tout marquer comme lu', unread: '{n} non lues',
    items: [
      { icon: 'tool', text: 'Devis en attente de validation · Maison Test D', time: 'Il y a 2 h', unread: true },
      { icon: 'chart', text: 'Le relevé de septembre est disponible', time: 'Hier', unread: true },
      { icon: 'wallet', text: 'Loyer encaissé · Résidence Démo A', time: '1 sept.', unread: true },
      { icon: 'doc', text: 'Nouveau document : police d’assurance', time: '28 août', unread: false },
      { icon: 'key', text: 'Renouvellement de bail à venir · Loft Exemple B', time: '20 août', unread: false },
    ],
  },
  security: {
    title: 'Sécurité', twofa: 'Authentification à deux facteurs', on: 'Activée', off: 'Désactivée', twofaText: 'Un code de votre application d’authentification est demandé à chaque connexion.',
    sessions: 'Sessions actives', current: 'Cet appareil', signOut: 'Se déconnecter', signedOut: 'Déconnecté (démo)',
    sessionList: [
      { device: 'Ordinateur · Navigateur', where: 'Lieu démo 1', when: 'Maintenant', current: true },
      { device: 'Téléphone · Application', where: 'Lieu démo 2', when: 'Il y a 2 jours', current: false },
    ],
    log: 'Journal d’accès', event: 'Événement', device: 'Appareil', when: 'Quand',
    logList: [
      { event: 'Connexion avec 2FA', device: 'Ordinateur', when: 'Aujourd’hui 08:31' },
      { event: 'Relevé consulté (septembre)', device: 'Ordinateur', when: 'Aujourd’hui 08:33' },
      { event: 'Document téléchargé : bail A', device: 'Téléphone', when: '29 sept. 21:10' },
      { event: 'Connexion avec 2FA', device: 'Téléphone', when: '29 sept. 21:08' },
      { event: 'Le gestionnaire a consulté la demande R-1042', device: 'Équipe', when: '24 sept. 09:10' },
    ],
  },
};

export default { en, he, it, fr };
