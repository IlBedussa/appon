// Testi del popup di acquisizione contatti (src/components/LeadPopup.astro), nelle 4 lingue.
// Variante A (principale, scelta da David): tono "sfidante" verso chi ha già un gestore, SENZA accusare nessuno.
// Variante B: tono morbido (stima affitto gratuita). Rotazione A/B in localStorage, variante inviata con il lead.
// [P] = segnaposto evidenziato in giallo (da confermare con David).
import type { Locale } from './config';

type Variant = { eyebrow: string; title: string; lead: string; points: string[]; cta: string };
export type PopupText = {
  a: Variant;
  b: Variant;
  name: string;
  contact: string;
  contactHint: string;
  city: string;
  cityOther: string;
  type: string;
  types: { v: string; l: string }[];
  choose: string;
  consentA: string;
  consentLink: string;
  consentB: string;
  close: string;
  later: string;
  sending: string;
  success: string;
  successTitle: string;
  errRequired: string;
  errContact: string;
  errConsent: string;
  fail: string;
  statement: { title: string; rows: string[]; net: string };
};

const en: PopupText = {
  a: {
    eyebrow: 'Free management check',
    title: 'Hidden fees? Find out in 2 minutes.',
    lead: 'Your apartment is managed by someone. Do you know where every shekel goes? Leave your details: we ask for your latest statement and go through it with you, line by line.',
    points: ['Every fee and charge explained', 'Repairs, invoices and net payout checked', 'Free, with no obligation'],
    cta: 'Get a free check of your current management',
  },
  b: {
    eyebrow: 'Free rent estimate',
    title: 'Own a home in Israel? Know exactly what it earns you, every month.',
    lead: 'Get a free, sourced rent estimate for your apartment and see what a transparent monthly statement looks like.',
    points: ['Based on official CBS averages', 'Reviewed by a local manager', 'Free, with no obligation'],
    cta: 'Get my free estimate',
  },
  name: 'Name',
  contact: 'Email or WhatsApp',
  contactHint: 'e.g. name@email.com or +972 50…',
  city: 'City',
  cityOther: 'Other city',
  type: 'Property',
  types: [
    { v: 'apartment', l: 'Apartment' },
    { v: 'house', l: 'House' },
    { v: 'several', l: 'Several properties' },
    { v: 'other', l: 'Other' },
  ],
  choose: 'Choose…',
  consentA: 'I agree to the ',
  consentLink: 'privacy policy',
  consentB: ' and to being contacted about my request.',
  close: 'Close',
  later: 'Not now',
  sending: 'Sending…',
  successTitle: 'Thank you!',
  success: 'Your request has been received. We will contact you within [TO CONFIRM] business day.',
  errRequired: 'Please fill in this field.',
  errContact: 'Enter a valid email or a WhatsApp number with country code.',
  errConsent: 'Please accept the privacy policy.',
  fail: 'Sending failed. Please try again or write to us from the contact page.',
  statement: { title: 'Monthly statement', rows: ['Management fee', 'Repair', 'Other charges'], net: 'Net to you' },
};

const he: PopupText = {
  a: {
    eyebrow: 'בדיקת ניהול בחינם',
    title: 'עמלות נסתרות? גלו תוך 2 דקות.',
    lead: 'מישהו מנהל לכם את הדירה. אתם יודעים לאן הולך כל שקל? השאירו פרטים: נבקש את הדוח האחרון שלכם ונעבור עליו איתכם, שורה אחר שורה.',
    points: ['הסבר לכל עמלה וחיוב', 'בדיקת תיקונים, חשבוניות וסכום נטו', 'בחינם וללא התחייבות'],
    cta: 'לבדיקה חינם של הניהול הנוכחי',
  },
  b: {
    eyebrow: 'הערכת שכירות בחינם',
    title: 'יש לכם דירה בישראל? דעו בדיוק כמה היא מכניסה, כל חודש.',
    lead: 'קבלו הערכת שכירות חינם, מבוססת מקורות, וראו איך נראה דוח חודשי שקוף.',
    points: ['על בסיס ממוצעים רשמיים של הלמ״ס', 'נבדקת על ידי מנהל נכסים מקומי', 'בחינם וללא התחייבות'],
    cta: 'לקבלת הערכה חינם',
  },
  name: 'שם',
  contact: 'אימייל או וואטסאפ',
  contactHint: 'name@email.com · ‎+972 50…',
  city: 'עיר',
  cityOther: 'עיר אחרת',
  type: 'סוג נכס',
  types: [
    { v: 'apartment', l: 'דירה' },
    { v: 'house', l: 'בית פרטי' },
    { v: 'several', l: 'כמה נכסים' },
    { v: 'other', l: 'אחר' },
  ],
  choose: 'בחרו…',
  consentA: 'אני מסכים/ה ל',
  consentLink: 'מדיניות הפרטיות',
  consentB: ' ולכך שייצרו איתי קשר בנוגע לפנייה.',
  close: 'סגירה',
  later: 'לא עכשיו',
  sending: 'שולח…',
  successTitle: 'תודה!',
  success: 'הפנייה התקבלה. ניצור איתכם קשר תוך [לאישור] ימי עסקים.',
  errRequired: 'נא למלא שדה זה.',
  errContact: 'נא להזין אימייל תקין או מספר וואטסאפ עם קידומת מדינה.',
  errConsent: 'נא לאשר את מדיניות הפרטיות.',
  fail: 'השליחה נכשלה. נסו שוב או כתבו לנו דרך עמוד יצירת הקשר.',
  statement: { title: 'דוח חודשי', rows: ['דמי ניהול', 'תיקון', 'חיובים אחרים'], net: 'נטו אליכם' },
};

const fr: PopupText = {
  a: {
    eyebrow: 'Analyse de gestion gratuite',
    title: 'Frais cachés ? Découvrez-le en 2 minutes.',
    lead: 'Quelqu’un gère votre appartement. Savez-vous où va chaque shekel ? Laissez vos coordonnées : nous vous demandons votre dernier relevé et l’analysons avec vous, ligne par ligne.',
    points: ['Chaque frais et chaque charge expliqués', 'Réparations, factures et montant net vérifiés', 'Gratuit et sans engagement'],
    cta: 'Obtenir une analyse gratuite de votre gestion actuelle',
  },
  b: {
    eyebrow: 'Estimation de loyer gratuite',
    title: 'Propriétaire en Israël ? Sachez exactement ce que votre bien vous rapporte, chaque mois.',
    lead: 'Recevez une estimation de loyer gratuite et sourcée, et découvrez à quoi ressemble un relevé mensuel transparent.',
    points: ['Basée sur les moyennes officielles du CBS', 'Vérifiée par un gestionnaire local', 'Gratuit et sans engagement'],
    cta: 'Recevoir mon estimation gratuite',
  },
  name: 'Nom',
  contact: 'E-mail ou WhatsApp',
  contactHint: 'ex. nom@email.com ou +33 6…',
  city: 'Ville',
  cityOther: 'Autre ville',
  type: 'Bien',
  types: [
    { v: 'apartment', l: 'Appartement' },
    { v: 'house', l: 'Maison' },
    { v: 'several', l: 'Plusieurs biens' },
    { v: 'other', l: 'Autre' },
  ],
  choose: 'Choisir…',
  consentA: 'J’accepte la ',
  consentLink: 'politique de confidentialité',
  consentB: ' et d’être contacté(e) au sujet de ma demande.',
  close: 'Fermer',
  later: 'Plus tard',
  sending: 'Envoi…',
  successTitle: 'Merci !',
  success: 'Votre demande a bien été reçue. Nous vous contacterons sous [À CONFIRMER] jour ouvré.',
  errRequired: 'Veuillez remplir ce champ.',
  errContact: 'Saisissez un e-mail valide ou un numéro WhatsApp avec l’indicatif du pays.',
  errConsent: 'Veuillez accepter la politique de confidentialité.',
  fail: 'L’envoi a échoué. Réessayez ou écrivez-nous depuis la page contact.',
  statement: { title: 'Relevé mensuel', rows: ['Frais de gestion', 'Réparation', 'Autres charges'], net: 'Net pour vous' },
};

const it: PopupText = {
  a: {
    eyebrow: 'Check gestione gratuito',
    title: 'Commissioni nascoste? Scoprilo in 2 minuti.',
    lead: 'Qualcuno gestisce il tuo appartamento. Sai dove va ogni shekel? Lasciaci i tuoi dati: ti chiediamo l’ultimo rendiconto e lo analizziamo con te, voce per voce.',
    points: ['Ogni commissione e ogni addebito spiegati', 'Riparazioni, fatture e netto verificati', 'Gratis e senza impegno'],
    cta: 'Ricevi un check gratuito della tua gestione attuale',
  },
  b: {
    eyebrow: 'Stima d’affitto gratuita',
    title: 'Hai casa in Israele? Sappi esattamente quanto ti rende, ogni mese.',
    lead: 'Ricevi una stima d’affitto gratuita e documentata e scopri com’è fatto un rendiconto mensile trasparente.',
    points: ['Basata sulle medie ufficiali del CBS', 'Verificata da un gestore locale', 'Gratis e senza impegno'],
    cta: 'Ricevi la stima gratuita',
  },
  name: 'Nome',
  contact: 'Email o WhatsApp',
  contactHint: 'es. nome@email.com o +39 3…',
  city: 'Città',
  cityOther: 'Altra città',
  type: 'Immobile',
  types: [
    { v: 'apartment', l: 'Appartamento' },
    { v: 'house', l: 'Casa indipendente' },
    { v: 'several', l: 'Più immobili' },
    { v: 'other', l: 'Altro' },
  ],
  choose: 'Scegli…',
  consentA: 'Accetto l’',
  consentLink: 'informativa sulla privacy',
  consentB: ' e di essere ricontattato/a per la mia richiesta.',
  close: 'Chiudi',
  later: 'Non ora',
  sending: 'Invio…',
  successTitle: 'Grazie!',
  success: 'Abbiamo ricevuto la tua richiesta. Ti contatteremo entro [DA CONFERMARE] giorno lavorativo.',
  errRequired: 'Compila questo campo.',
  errContact: 'Inserisci un’email valida o un numero WhatsApp con prefisso internazionale.',
  errConsent: 'Accetta l’informativa sulla privacy.',
  fail: 'Invio non riuscito. Riprova o scrivici dalla pagina contatti.',
  statement: { title: 'Rendiconto mensile', rows: ['Commissione di gestione', 'Riparazione', 'Altri addebiti'], net: 'Netto a te' },
};

export const popup: Record<Locale, PopupText> = { en, he, fr, it };
