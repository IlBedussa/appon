// Testi delle ispezioni fotografiche e del report mensile sullo stato dell'immobile (4 lingue).
// Modulo separato dai dizionari principali per non appesantirli; il tipo deriva dall'inglese.
import type { Locale } from './index';

const en = {
  title: 'Inspections', sub: 'Room-by-room photo inspections: move-in, move-out and annual.',
  kinds: { move_in: 'Move-in inspection', move_out: 'Move-out inspection', annual: 'Annual inspection' },
  status: { draft: 'Draft', completed: 'Completed' },
  cond: { good: 'Good', fair: 'Fair', poor: 'Poor', na: 'Not applicable' },
  empty: 'No inspections yet.', performed: 'Inspection date', items: '{n} items', photos: '{n} photos', rooms: 'Rooms',
  acked: 'Acknowledged', toAck: 'Waiting for your acknowledgment', summary: 'Summary', performedBy: 'Performed by', completedOn: 'Completed {d}',
  roomsTitle: 'Room by room', photosTitle: 'Photos', takenAt: 'Taken {d}', uploadedAt: 'Uploaded {d}', fingerprint: 'File fingerprint (SHA-256)',
  acksTitle: 'Acknowledgments', ackLine: '{role} · {d}', noAcks: 'Not acknowledged yet.', lease: 'Lease', leaseNone: '— not linked to a lease —',
  ackTitle: 'Acknowledge this report',
  ackText: 'By acknowledging you confirm that you have received and seen this report. Add a comment if you disagree with any item: it is attached to the report. [TO CONFIRM] legal value of the acknowledgment.',
  ackComment: 'Comment (optional)', ackButton: 'I have seen this report', ackDone: 'Thank you: your acknowledgment has been recorded.', ackAlready: 'You acknowledged this report on {d}.',
  downloadPdf: 'Download PDF', immutable: 'Completed inspections are locked: items and photos can no longer be changed.',
  admin: {
    new: 'New inspection', property: 'Property', kind: 'Type', date: 'Inspection date', create: 'Create draft', created: 'Draft created. Add rooms, items and photos, then complete it.',
    addItem: 'Add item', room: 'Room', item: 'Item', condition: 'Condition', note: 'Note', roomHint: 'e.g. Kitchen, Bathroom, Living room',
    addPhotos: 'Add photos', caption: 'Caption', takenAt: 'Photo taken at', takenAtHint: 'Used only for photos without a date in their metadata (EXIF).', linkItem: 'Linked item', none: '— none —', photosHint: 'JPG, PNG or WebP, max 8 MB each, up to 10 at a time.',
    complete: 'Complete and share', completeConfirm: 'Complete this inspection? It will be locked and shared with the owner and tenant.',
    completeHint: 'After completion, items and photos cannot be changed. The owner and tenant are notified.', completed: 'Inspection completed and shared.',
    needItems: 'Add at least one item before completing.', deleteDraft: 'Delete draft', deleted: 'Draft deleted.', removeItem: 'Remove', removePhoto: 'Remove photo',
    saveSummary: 'Save summary', drafts: 'Drafts', all: 'All inspections',
  },
  pdf: {
    title: 'Inspection report', property: 'Property', date: 'Date', tenant: 'Tenant', status: 'Status', generated: 'Generated on {d}', page: 'Page {n} of {t}',
    integrity: 'Integrity code', footer: 'Generated from the portal records. Photos are stored with their upload time and SHA-256 fingerprint.',
    photoIndex: 'Photo index', acks: 'Acknowledgments', noAcks: 'No acknowledgment recorded yet.', ref: 'Ref.',
  },
  report: {
    title: 'Monthly property health report', short: 'Health report', month: 'Month', download: 'Download health report', choose: 'Report for',
    rent: 'Rent and income', income: 'Income', expenses: 'Expenses', net: 'Net to owner', fromStatement: 'From the {m} statement',
    noStatement: 'No published statement for this month yet.', payments: 'Payments recorded this month', noPayments: 'No payments recorded.',
    maintenance: 'Open maintenance', noMaintenance: 'No open requests.', deadlines: 'Upcoming deadlines (next 120 days)', noDeadlines: 'No deadlines in the next 120 days.',
    leaseEnd: 'Lease end', photos: 'Latest inspection photos', noPhotos: 'No completed inspection yet.', since: 'open since {d}',
    footer: 'Generated from the portal records (statements, payments, documents, maintenance and inspections). Amounts in ILS.',
  },
};
export type InspDict = typeof en;

const he: InspDict = {
  title: 'ביקורות', sub: 'ביקורות מצולמות חדר אחר חדר: כניסה, יציאה וביקורת שנתית.',
  kinds: { move_in: 'ביקורת כניסה', move_out: 'ביקורת יציאה', annual: 'ביקורת שנתית' },
  status: { draft: 'טיוטה', completed: 'הושלמה' },
  cond: { good: 'תקין', fair: 'סביר', poor: 'לקוי', na: 'לא רלוונטי' },
  empty: 'אין עדיין ביקורות.', performed: 'תאריך הביקורת', items: '{n} פריטים', photos: '{n} תמונות', rooms: 'חדרים',
  acked: 'אושר', toAck: 'ממתין לאישור הצפייה שלכם', summary: 'סיכום', performedBy: 'בוצע על ידי', completedOn: 'הושלם {d}',
  roomsTitle: 'חדר אחר חדר', photosTitle: 'תמונות', takenAt: 'צולם {d}', uploadedAt: 'הועלה {d}', fingerprint: 'טביעת אצבע של הקובץ (SHA-256)',
  acksTitle: 'אישורי צפייה', ackLine: '{role} · {d}', noAcks: 'טרם אושר.', lease: 'חוזה', leaseNone: '— לא מקושר לחוזה —',
  ackTitle: 'אישור צפייה בדוח',
  ackText: 'באישור אתם מאשרים שקיבלתם וראיתם את הדוח. אם אינכם מסכימים עם פריט כלשהו, הוסיפו הערה: היא תצורף לדוח. [לאישור] התוקף המשפטי של האישור.',
  ackComment: 'הערה (רשות)', ackButton: 'ראיתי את הדוח', ackDone: 'תודה: אישור הצפייה נרשם.', ackAlready: 'אישרתם את הדוח ב-{d}.',
  downloadPdf: 'הורדת PDF', immutable: 'ביקורות שהושלמו נעולות: לא ניתן עוד לשנות פריטים ותמונות.',
  admin: {
    new: 'ביקורת חדשה', property: 'נכס', kind: 'סוג', date: 'תאריך הביקורת', create: 'יצירת טיוטה', created: 'הטיוטה נוצרה. הוסיפו חדרים, פריטים ותמונות ואז השלימו.',
    addItem: 'הוספת פריט', room: 'חדר', item: 'פריט', condition: 'מצב', note: 'הערה', roomHint: 'למשל מטבח, חדר רחצה, סלון',
    addPhotos: 'הוספת תמונות', caption: 'כיתוב', takenAt: 'מועד הצילום', takenAtHint: 'משמש רק לתמונות ללא תאריך במטא-נתונים (EXIF).', linkItem: 'פריט מקושר', none: '— ללא —', photosHint: 'JPG, PNG או WebP, עד 8MB לקובץ, עד 10 בכל פעם.',
    complete: 'השלמה ושיתוף', completeConfirm: 'להשלים את הביקורת? היא תינעל ותשותף עם הבעלים והשוכר.',
    completeHint: 'לאחר ההשלמה לא ניתן לשנות פריטים ותמונות. הבעלים והשוכר יקבלו הודעה.', completed: 'הביקורת הושלמה ושותפה.',
    needItems: 'הוסיפו לפחות פריט אחד לפני ההשלמה.', deleteDraft: 'מחיקת טיוטה', deleted: 'הטיוטה נמחקה.', removeItem: 'הסרה', removePhoto: 'הסרת תמונה',
    saveSummary: 'שמירת סיכום', drafts: 'טיוטות', all: 'כל הביקורות',
  },
  pdf: {
    title: 'דוח ביקורת', property: 'נכס', date: 'תאריך', tenant: 'שוכר', status: 'סטטוס', generated: 'הופק ב-{d}', page: 'עמוד {n} מתוך {t}',
    integrity: 'קוד שלמות', footer: 'הופק מרשומות הפורטל. התמונות נשמרות עם מועד ההעלאה וטביעת אצבע SHA-256.',
    photoIndex: 'אינדקס תמונות', acks: 'אישורי צפייה', noAcks: 'טרם נרשם אישור צפייה.', ref: 'מס׳',
  },
  report: {
    title: 'דוח חודשי על מצב הנכס', short: 'דוח מצב', month: 'חודש', download: 'הורדת דוח המצב', choose: 'דוח עבור',
    rent: 'שכירות והכנסות', income: 'הכנסות', expenses: 'הוצאות', net: 'נטו לבעלים', fromStatement: 'מתוך דוח החשבון של {m}',
    noStatement: 'עדיין אין דוח חשבון שפורסם לחודש זה.', payments: 'תשלומים שנרשמו החודש', noPayments: 'לא נרשמו תשלומים.',
    maintenance: 'תחזוקה פתוחה', noMaintenance: 'אין קריאות פתוחות.', deadlines: 'מועדים קרובים (120 הימים הבאים)', noDeadlines: 'אין מועדים ב-120 הימים הקרובים.',
    leaseEnd: 'סיום חוזה', photos: 'תמונות מהביקורת האחרונה', noPhotos: 'עדיין אין ביקורת שהושלמה.', since: 'פתוחה מאז {d}',
    footer: 'הופק מרשומות הפורטל (דוחות חשבון, תשלומים, מסמכים, תחזוקה וביקורות). הסכומים בש״ח.',
  },
};

const it: InspDict = {
  title: 'Ispezioni', sub: 'Ispezioni fotografiche stanza per stanza: ingresso, uscita e annuale.',
  kinds: { move_in: 'Ispezione d’ingresso', move_out: 'Ispezione d’uscita', annual: 'Ispezione annuale' },
  status: { draft: 'Bozza', completed: 'Completata' },
  cond: { good: 'Buono', fair: 'Discreto', poor: 'Scadente', na: 'Non applicabile' },
  empty: 'Nessuna ispezione per ora.', performed: 'Data ispezione', items: '{n} voci', photos: '{n} foto', rooms: 'Stanze',
  acked: 'Presa visione confermata', toAck: 'In attesa della tua presa visione', summary: 'Sintesi', performedBy: 'Eseguita da', completedOn: 'Completata il {d}',
  roomsTitle: 'Stanza per stanza', photosTitle: 'Foto', takenAt: 'Scattata il {d}', uploadedAt: 'Caricata il {d}', fingerprint: 'Impronta del file (SHA-256)',
  acksTitle: 'Prese visione', ackLine: '{role} · {d}', noAcks: 'Nessuna presa visione per ora.', lease: 'Contratto', leaseNone: '— non collegata a un contratto —',
  ackTitle: 'Conferma la presa visione',
  ackText: 'Confermando dichiari di aver ricevuto e visto questo report. Se non sei d’accordo su una voce, aggiungi un commento: viene allegato al report. [DA CONFERMARE] valore legale della presa visione.',
  ackComment: 'Commento (facoltativo)', ackButton: 'Ho visto questo report', ackDone: 'Grazie: la tua presa visione è stata registrata.', ackAlready: 'Hai confermato la presa visione il {d}.',
  downloadPdf: 'Scarica PDF', immutable: 'Le ispezioni completate sono bloccate: voci e foto non si possono più modificare.',
  admin: {
    new: 'Nuova ispezione', property: 'Immobile', kind: 'Tipo', date: 'Data ispezione', create: 'Crea bozza', created: 'Bozza creata. Aggiungi stanze, voci e foto, poi completala.',
    addItem: 'Aggiungi voce', room: 'Stanza', item: 'Voce', condition: 'Stato', note: 'Nota', roomHint: 'es. Cucina, Bagno, Soggiorno',
    addPhotos: 'Aggiungi foto', caption: 'Didascalia', takenAt: 'Data dello scatto', takenAtHint: 'Usata solo per le foto senza data nei metadati (EXIF).', linkItem: 'Voce collegata', none: '— nessuna —', photosHint: 'JPG, PNG o WebP, max 8 MB ciascuna, fino a 10 per volta.',
    complete: 'Completa e condividi', completeConfirm: 'Completare l’ispezione? Verrà bloccata e condivisa con proprietario e inquilino.',
    completeHint: 'Dopo il completamento voci e foto non si possono modificare. Proprietario e inquilino ricevono una notifica.', completed: 'Ispezione completata e condivisa.',
    needItems: 'Aggiungi almeno una voce prima di completare.', deleteDraft: 'Elimina bozza', deleted: 'Bozza eliminata.', removeItem: 'Rimuovi', removePhoto: 'Rimuovi foto',
    saveSummary: 'Salva sintesi', drafts: 'Bozze', all: 'Tutte le ispezioni',
  },
  pdf: {
    title: 'Report di ispezione', property: 'Immobile', date: 'Data', tenant: 'Inquilino', status: 'Stato', generated: 'Generato il {d}', page: 'Pagina {n} di {t}',
    integrity: 'Codice di integrità', footer: 'Generato dai dati del portale. Le foto sono conservate con orario di caricamento e impronta SHA-256.',
    photoIndex: 'Indice delle foto', acks: 'Prese visione', noAcks: 'Nessuna presa visione registrata.', ref: 'Rif.',
  },
  report: {
    title: 'Report mensile sullo stato dell’immobile', short: 'Report di stato', month: 'Mese', download: 'Scarica il report di stato', choose: 'Report di',
    rent: 'Affitto ed entrate', income: 'Entrate', expenses: 'Uscite', net: 'Netto al proprietario', fromStatement: 'Dal rendiconto di {m}',
    noStatement: 'Nessun rendiconto pubblicato per questo mese.', payments: 'Pagamenti registrati nel mese', noPayments: 'Nessun pagamento registrato.',
    maintenance: 'Manutenzione aperta', noMaintenance: 'Nessuna richiesta aperta.', deadlines: 'Prossime scadenze (120 giorni)', noDeadlines: 'Nessuna scadenza nei prossimi 120 giorni.',
    leaseEnd: 'Fine contratto', photos: 'Foto dell’ultima ispezione', noPhotos: 'Nessuna ispezione completata.', since: 'aperta dal {d}',
    footer: 'Generato dai dati del portale (rendiconti, pagamenti, documenti, manutenzione e ispezioni). Importi in ILS.',
  },
};

const fr: InspDict = {
  title: 'États des lieux', sub: 'États des lieux photo pièce par pièce : entrée, sortie et visite annuelle.',
  kinds: { move_in: 'État des lieux d’entrée', move_out: 'État des lieux de sortie', annual: 'Visite annuelle' },
  status: { draft: 'Brouillon', completed: 'Terminé' },
  cond: { good: 'Bon', fair: 'Moyen', poor: 'Mauvais', na: 'Sans objet' },
  empty: 'Aucun état des lieux pour l’instant.', performed: 'Date de la visite', items: '{n} éléments', photos: '{n} photos', rooms: 'Pièces',
  acked: 'Pris connaissance', toAck: 'En attente de votre prise de connaissance', summary: 'Synthèse', performedBy: 'Réalisé par', completedOn: 'Terminé le {d}',
  roomsTitle: 'Pièce par pièce', photosTitle: 'Photos', takenAt: 'Prise le {d}', uploadedAt: 'Téléversée le {d}', fingerprint: 'Empreinte du fichier (SHA-256)',
  acksTitle: 'Prises de connaissance', ackLine: '{role} · {d}', noAcks: 'Pas encore de prise de connaissance.', lease: 'Bail', leaseNone: '— non lié à un bail —',
  ackTitle: 'Confirmer la prise de connaissance',
  ackText: 'En confirmant, vous attestez avoir reçu et consulté ce rapport. Si vous contestez un élément, ajoutez un commentaire : il est joint au rapport. [À CONFIRMER] valeur juridique de la confirmation.',
  ackComment: 'Commentaire (facultatif)', ackButton: 'J’ai pris connaissance du rapport', ackDone: 'Merci : votre prise de connaissance est enregistrée.', ackAlready: 'Vous avez confirmé la prise de connaissance le {d}.',
  downloadPdf: 'Télécharger le PDF', immutable: 'Les états des lieux terminés sont verrouillés : éléments et photos ne peuvent plus être modifiés.',
  admin: {
    new: 'Nouvel état des lieux', property: 'Bien', kind: 'Type', date: 'Date de la visite', create: 'Créer le brouillon', created: 'Brouillon créé. Ajoutez pièces, éléments et photos, puis terminez-le.',
    addItem: 'Ajouter un élément', room: 'Pièce', item: 'Élément', condition: 'État', note: 'Note', roomHint: 'ex. Cuisine, Salle de bain, Séjour',
    addPhotos: 'Ajouter des photos', caption: 'Légende', takenAt: 'Date de la prise de vue', takenAtHint: 'Utilisée uniquement pour les photos sans date dans leurs métadonnées (EXIF).', linkItem: 'Élément lié', none: '— aucun —', photosHint: 'JPG, PNG ou WebP, 8 Mo max chacune, jusqu’à 10 à la fois.',
    complete: 'Terminer et partager', completeConfirm: 'Terminer cet état des lieux ? Il sera verrouillé et partagé avec le propriétaire et le locataire.',
    completeHint: 'Une fois terminé, éléments et photos ne peuvent plus être modifiés. Le propriétaire et le locataire sont notifiés.', completed: 'État des lieux terminé et partagé.',
    needItems: 'Ajoutez au moins un élément avant de terminer.', deleteDraft: 'Supprimer le brouillon', deleted: 'Brouillon supprimé.', removeItem: 'Retirer', removePhoto: 'Retirer la photo',
    saveSummary: 'Enregistrer la synthèse', drafts: 'Brouillons', all: 'Tous les états des lieux',
  },
  pdf: {
    title: 'Rapport d’état des lieux', property: 'Bien', date: 'Date', tenant: 'Locataire', status: 'Statut', generated: 'Généré le {d}', page: 'Page {n} sur {t}',
    integrity: 'Code d’intégrité', footer: 'Généré à partir des données du portail. Les photos sont conservées avec leur heure de téléversement et leur empreinte SHA-256.',
    photoIndex: 'Index des photos', acks: 'Prises de connaissance', noAcks: 'Aucune prise de connaissance enregistrée.', ref: 'Réf.',
  },
  report: {
    title: 'Rapport mensuel sur l’état du bien', short: 'Rapport d’état', month: 'Mois', download: 'Télécharger le rapport d’état', choose: 'Rapport de',
    rent: 'Loyer et revenus', income: 'Revenus', expenses: 'Dépenses', net: 'Net propriétaire', fromStatement: 'D’après le relevé de {m}',
    noStatement: 'Aucun relevé publié pour ce mois.', payments: 'Paiements enregistrés ce mois-ci', noPayments: 'Aucun paiement enregistré.',
    maintenance: 'Maintenance en cours', noMaintenance: 'Aucune demande en cours.', deadlines: 'Échéances à venir (120 jours)', noDeadlines: 'Aucune échéance dans les 120 prochains jours.',
    leaseEnd: 'Fin du bail', photos: 'Photos du dernier état des lieux', noPhotos: 'Aucun état des lieux terminé.', since: 'ouverte depuis le {d}',
    footer: 'Généré à partir des données du portail (relevés, paiements, documents, maintenance et états des lieux). Montants en ILS.',
  },
};

const dicts: Record<Locale, InspDict> = { en, he, it, fr };
export const ix = (l: Locale): InspDict => dicts[l];
