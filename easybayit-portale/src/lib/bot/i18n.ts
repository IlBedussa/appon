// Testi del bot nelle lingue supportate (EN/HE/IT/FR + RU facoltativo).
import type { BotLocale, Category } from './types';

type Strings = {
  hello: string; unknown: string; askProperty: string; askCategory: string; cats: Record<Category, string>;
  askDescription: string; tooShort: string; askMedia: string; mediaGot: string; mediaMax: string; skip: string; done: string;
  askUrgency: string; urgentYes: string; urgentNo: string; emergency: string; emergencyKinds: Record<'gas' | 'flood' | 'power' | 'security', string>;
  askAvailability: string; avail: { morning: string; afternoon: string; evening: string; any: string };
  summary: string; confirm: string; edit: string; created: string; cancelled: string; notUnderstood: string;
  urgentLabel: string; routineLabel: string; none: string; status: string; restart: string;
};

const en: Strings = {
  hello: 'Hi {name}! I am the Easybayit maintenance assistant. I will open a repair request for you in a few steps. Type "cancel" at any time to stop.',
  unknown: 'Sorry, this number is not linked to an active Easybayit lease. Please contact the office or sign in to the tenant portal.',
  askProperty: 'Which property is this about?',
  askCategory: 'What kind of problem is it? Reply with a number or choose an option:',
  cats: { plumbing: 'Plumbing / water leak', electrical: 'Electricity', heating_ac: 'Heating / AC / boiler', appliances: 'Appliances', doors_windows: 'Doors, windows, locks', gas: 'Gas', pests: 'Pests', other: 'Other' },
  askDescription: 'Please describe the problem: where is it, since when, is it getting worse?',
  tooShort: 'Could you add a few more details (at least a short sentence)?',
  askMedia: 'Send photos or short videos of the problem (up to {n}). When finished, tap "Done" — or "Skip" if you have none.',
  mediaGot: 'Received ({n}). Send more or tap "Done".', mediaMax: 'Maximum number of files reached.', skip: 'Skip', done: 'Done',
  askUrgency: 'Is it urgent? (active leak, no water or hot water, no heating in winter, risk of damage)', urgentYes: 'Yes, urgent', urgentNo: 'No, can wait',
  emergency: '⚠️ This looks like an EMERGENCY ({kind}). For your safety: {advice} Call the Easybayit emergency line now: {phone}. I am marking your request as URGENT.',
  emergencyKinds: { gas: 'gas smell — do not use switches or flames, open windows, close the gas valve and leave the apartment.', flood: 'flooding — close the main water valve and keep away from electrical sockets.', power: 'no electricity — check the main breaker; do not touch damaged wiring.', security: 'security issue — if you are in danger call the police (100).' },
  askAvailability: 'When can a technician come? Choose or write your availability (e.g. "Mon-Wed after 4pm").',
  avail: { morning: 'Mornings', afternoon: 'Afternoons', evening: 'Evenings', any: 'Any time' },
  summary: 'Please confirm:\n• Property: {property}\n• Problem: {category}\n• Details: {description}\n• Photos/videos: {media}\n• Urgency: {urgency}\n• Availability: {availability}',
  confirm: 'Confirm', edit: 'Start over',
  created: '✅ Request {ref} created. Our team has been notified and will reply soon. You will receive status updates here.',
  cancelled: 'Request cancelled. Write anytime to open a new one.', notUnderstood: 'Sorry, I did not understand. Please choose one of the options.',
  urgentLabel: 'Urgent', routineLabel: 'Normal', none: 'none',
  status: 'Update on request {ref}: {status}', restart: 'Ok, let us start again.',
};
const it: Strings = {
  hello: 'Ciao {name}! Sono l’assistente manutenzione di Easybayit. Apro per te una richiesta di intervento in pochi passi. Scrivi "annulla" in qualsiasi momento per interrompere.',
  unknown: 'Spiacenti, questo numero non è collegato a un contratto Easybayit attivo. Contatta l’ufficio o accedi al portale inquilini.',
  askProperty: 'Per quale immobile?',
  askCategory: 'Che tipo di problema è? Rispondi con un numero o scegli un’opzione:',
  cats: { plumbing: 'Idraulica / perdita d’acqua', electrical: 'Elettricità', heating_ac: 'Riscaldamento / clima / boiler', appliances: 'Elettrodomestici', doors_windows: 'Porte, finestre, serrature', gas: 'Gas', pests: 'Infestanti', other: 'Altro' },
  askDescription: 'Descrivi il problema: dove si trova, da quando, sta peggiorando?',
  tooShort: 'Puoi aggiungere qualche dettaglio in più (almeno una breve frase)?',
  askMedia: 'Invia foto o brevi video del problema (fino a {n}). Quando hai finito tocca "Fatto", oppure "Salta" se non ne hai.',
  mediaGot: 'Ricevuti ({n}). Inviane altri o tocca "Fatto".', mediaMax: 'Numero massimo di file raggiunto.', skip: 'Salta', done: 'Fatto',
  askUrgency: 'È urgente? (perdita in corso, niente acqua o acqua calda, niente riscaldamento in inverno, rischio di danni)', urgentYes: 'Sì, urgente', urgentNo: 'No, può attendere',
  emergency: '⚠️ Sembra un’EMERGENZA ({kind}). Per la tua sicurezza: {advice} Chiama subito il numero di emergenza Easybayit: {phone}. Segno la richiesta come URGENTE.',
  emergencyKinds: { gas: 'odore di gas — non usare interruttori o fiamme, apri le finestre, chiudi la valvola del gas ed esci.', flood: 'allagamento — chiudi la valvola generale dell’acqua e stai lontano dalle prese elettriche.', power: 'niente elettricità — controlla l’interruttore generale; non toccare cavi danneggiati.', security: 'problema di sicurezza — se sei in pericolo chiama la polizia (100).' },
  askAvailability: 'Quando può passare un tecnico? Scegli o scrivi la tua disponibilità (es. "lun-mer dopo le 16").',
  avail: { morning: 'Mattina', afternoon: 'Pomeriggio', evening: 'Sera', any: 'Sempre' },
  summary: 'Conferma i dati:\n• Immobile: {property}\n• Problema: {category}\n• Dettagli: {description}\n• Foto/video: {media}\n• Urgenza: {urgency}\n• Disponibilità: {availability}',
  confirm: 'Conferma', edit: 'Ricomincia',
  created: '✅ Richiesta {ref} creata. Il nostro team è stato avvisato e ti risponderà a breve. Riceverai qui gli aggiornamenti di stato.',
  cancelled: 'Richiesta annullata. Scrivici quando vuoi per aprirne una nuova.', notUnderstood: 'Scusa, non ho capito. Scegli una delle opzioni.',
  urgentLabel: 'Urgente', routineLabel: 'Normale', none: 'nessuno',
  status: 'Aggiornamento richiesta {ref}: {status}', restart: 'Ok, ricominciamo.',
};
const fr: Strings = {
  hello: 'Bonjour {name} ! Je suis l’assistant maintenance d’Easybayit. J’ouvre pour vous une demande d’intervention en quelques étapes. Écrivez « annuler » à tout moment pour arrêter.',
  unknown: 'Désolé, ce numéro n’est lié à aucun bail Easybayit actif. Contactez l’agence ou connectez-vous au portail locataire.',
  askProperty: 'Pour quel logement ?',
  askCategory: 'Quel type de problème ? Répondez par un numéro ou choisissez une option :',
  cats: { plumbing: 'Plomberie / fuite d’eau', electrical: 'Électricité', heating_ac: 'Chauffage / clim / chauffe-eau', appliances: 'Électroménager', doors_windows: 'Portes, fenêtres, serrures', gas: 'Gaz', pests: 'Nuisibles', other: 'Autre' },
  askDescription: 'Décrivez le problème : où se trouve-t-il, depuis quand, s’aggrave-t-il ?',
  tooShort: 'Pouvez-vous ajouter quelques détails (au moins une courte phrase) ?',
  askMedia: 'Envoyez des photos ou de courtes vidéos du problème (jusqu’à {n}). Ensuite touchez « Terminé », ou « Passer » si vous n’en avez pas.',
  mediaGot: 'Reçu ({n}). Envoyez-en d’autres ou touchez « Terminé ».', mediaMax: 'Nombre maximal de fichiers atteint.', skip: 'Passer', done: 'Terminé',
  askUrgency: 'Est-ce urgent ? (fuite en cours, pas d’eau ou d’eau chaude, pas de chauffage en hiver, risque de dégâts)', urgentYes: 'Oui, urgent', urgentNo: 'Non, ça peut attendre',
  emergency: '⚠️ Cela ressemble à une URGENCE ({kind}). Pour votre sécurité : {advice} Appelez immédiatement la ligne d’urgence Easybayit : {phone}. Je marque votre demande comme URGENTE.',
  emergencyKinds: { gas: 'odeur de gaz — n’utilisez ni interrupteurs ni flammes, ouvrez les fenêtres, fermez le robinet de gaz et sortez.', flood: 'inondation — fermez le robinet d’eau général et éloignez-vous des prises électriques.', power: 'plus d’électricité — vérifiez le disjoncteur général ; ne touchez pas les câbles endommagés.', security: 'problème de sécurité — si vous êtes en danger appelez la police (100).' },
  askAvailability: 'Quand un technicien peut-il passer ? Choisissez ou écrivez vos disponibilités (ex. « lun-mer après 16 h »).',
  avail: { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir', any: 'N’importe quand' },
  summary: 'Merci de confirmer :\n• Logement : {property}\n• Problème : {category}\n• Détails : {description}\n• Photos/vidéos : {media}\n• Urgence : {urgency}\n• Disponibilités : {availability}',
  confirm: 'Confirmer', edit: 'Recommencer',
  created: '✅ Demande {ref} créée. Notre équipe a été prévenue et vous répondra rapidement. Vous recevrez ici les mises à jour.',
  cancelled: 'Demande annulée. Écrivez-nous à tout moment pour en ouvrir une nouvelle.', notUnderstood: 'Désolé, je n’ai pas compris. Choisissez une des options.',
  urgentLabel: 'Urgent', routineLabel: 'Normal', none: 'aucun',
  status: 'Mise à jour de la demande {ref} : {status}', restart: 'D’accord, recommençons.',
};
const he: Strings = {
  hello: 'שלום {name}! אני העוזר הדיגיטלי לתחזוקה של Easybayit. אפתח עבורך קריאת שירות בכמה צעדים. אפשר לכתוב "ביטול" בכל שלב.',
  unknown: 'מצטערים, המספר הזה אינו מקושר לחוזה פעיל ב־Easybayit. נא לפנות למשרד או להתחבר לפורטל הדיירים.',
  askProperty: 'באיזה נכס מדובר?',
  askCategory: 'מה סוג התקלה? יש להשיב במספר או לבחור אפשרות:',
  cats: { plumbing: 'אינסטלציה / נזילה', electrical: 'חשמל', heating_ac: 'חימום / מזגן / דוד', appliances: 'מכשירי חשמל', doors_windows: 'דלתות, חלונות, מנעולים', gas: 'גז', pests: 'מזיקים', other: 'אחר' },
  askDescription: 'נא לתאר את התקלה: איפה, ממתי, האם היא מחמירה?',
  tooShort: 'אפשר להוסיף עוד כמה פרטים (לפחות משפט קצר)?',
  askMedia: 'נא לשלוח תמונות או סרטונים קצרים של התקלה (עד {n}). בסיום יש ללחוץ "סיימתי", או "דלג" אם אין.',
  mediaGot: 'התקבלו ({n}). אפשר לשלוח עוד או ללחוץ "סיימתי".', mediaMax: 'הגעת למספר הקבצים המרבי.', skip: 'דלג', done: 'סיימתי',
  askUrgency: 'האם זה דחוף? (נזילה פעילה, אין מים או מים חמים, אין חימום בחורף, סכנת נזק)', urgentYes: 'כן, דחוף', urgentNo: 'לא, יכול לחכות',
  emergency: '⚠️ נראה שמדובר במקרה חירום ({kind}). לביטחונך: {advice} יש להתקשר מיד לקו החירום של Easybayit: {phone}. הקריאה מסומנת כדחופה.',
  emergencyKinds: { gas: 'ריח גז — אין להפעיל מתגים או אש, לפתוח חלונות, לסגור את ברז הגז ולצאת מהדירה.', flood: 'הצפה — לסגור את ברז המים הראשי ולהתרחק משקעי חשמל.', power: 'אין חשמל — לבדוק את המפסק הראשי; אין לגעת בחוטים פגועים.', security: 'בעיית ביטחון — במקרה של סכנה יש להתקשר למשטרה (100).' },
  askAvailability: 'מתי טכנאי יכול להגיע? יש לבחור או לכתוב זמינות (למשל "א׳-ג׳ אחרי 16:00").',
  avail: { morning: 'בוקר', afternoon: 'צהריים', evening: 'ערב', any: 'בכל זמן' },
  summary: 'נא לאשר:\n• נכס: {property}\n• תקלה: {category}\n• פרטים: {description}\n• תמונות/סרטונים: {media}\n• דחיפות: {urgency}\n• זמינות: {availability}',
  confirm: 'אישור', edit: 'להתחיל מחדש',
  created: '✅ קריאה {ref} נפתחה. הצוות שלנו קיבל הודעה ויחזור אליך בקרוב. עדכוני סטטוס יישלחו לכאן.',
  cancelled: 'הקריאה בוטלה. אפשר לכתוב בכל עת כדי לפתוח קריאה חדשה.', notUnderstood: 'סליחה, לא הבנתי. נא לבחור אחת מהאפשרויות.',
  urgentLabel: 'דחוף', routineLabel: 'רגיל', none: 'אין',
  status: 'עדכון לקריאה {ref}: {status}', restart: 'בסדר, מתחילים מחדש.',
};
const ru: Strings = {
  hello: 'Здравствуйте, {name}! Я помощник Easybayit по ремонту. Я открою заявку за несколько шагов. Напишите «отмена» в любой момент, чтобы остановиться.',
  unknown: 'Извините, этот номер не связан с действующим договором Easybayit. Свяжитесь с офисом или войдите в портал арендатора.',
  askProperty: 'О какой квартире идёт речь?',
  askCategory: 'Какая проблема? Ответьте номером или выберите вариант:',
  cats: { plumbing: 'Сантехника / протечка', electrical: 'Электричество', heating_ac: 'Отопление / кондиционер / бойлер', appliances: 'Бытовая техника', doors_windows: 'Двери, окна, замки', gas: 'Газ', pests: 'Вредители', other: 'Другое' },
  askDescription: 'Опишите проблему: где, с какого времени, становится ли хуже?',
  tooShort: 'Добавьте, пожалуйста, немного подробностей (хотя бы одно предложение).',
  askMedia: 'Отправьте фото или короткие видео (до {n}). Затем нажмите «Готово» или «Пропустить», если их нет.',
  mediaGot: 'Получено ({n}). Отправьте ещё или нажмите «Готово».', mediaMax: 'Достигнуто максимальное число файлов.', skip: 'Пропустить', done: 'Готово',
  askUrgency: 'Это срочно? (активная протечка, нет воды или горячей воды, нет отопления зимой, риск ущерба)', urgentYes: 'Да, срочно', urgentNo: 'Нет, может подождать',
  emergency: '⚠️ Похоже на АВАРИЮ ({kind}). Для вашей безопасности: {advice} Немедленно позвоните на аварийную линию Easybayit: {phone}. Заявка отмечена как СРОЧНАЯ.',
  emergencyKinds: { gas: 'запах газа — не пользуйтесь выключателями и огнём, откройте окна, перекройте газ и выйдите из квартиры.', flood: 'затопление — перекройте главный кран воды и держитесь подальше от розеток.', power: 'нет электричества — проверьте главный автомат; не трогайте повреждённые провода.', security: 'угроза безопасности — при опасности звоните в полицию (100).' },
  askAvailability: 'Когда может прийти мастер? Выберите или напишите (например, «пн-ср после 16:00»).',
  avail: { morning: 'Утро', afternoon: 'День', evening: 'Вечер', any: 'В любое время' },
  summary: 'Подтвердите:\n• Квартира: {property}\n• Проблема: {category}\n• Детали: {description}\n• Фото/видео: {media}\n• Срочность: {urgency}\n• Доступность: {availability}',
  confirm: 'Подтвердить', edit: 'Начать заново',
  created: '✅ Заявка {ref} создана. Наша команда уведомлена и скоро ответит. Обновления статуса придут сюда.',
  cancelled: 'Заявка отменена. Напишите в любое время, чтобы открыть новую.', notUnderstood: 'Извините, я не понял. Выберите один из вариантов.',
  urgentLabel: 'Срочно', routineLabel: 'Обычно', none: 'нет',
  status: 'Обновление по заявке {ref}: {status}', restart: 'Хорошо, начнём сначала.',
};
export const botStrings: Record<BotLocale, Strings> = { en, it, fr, he, ru };
export const fillB = (s: string, p: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? ''));

/** Stati richiesta tradotti per gli aggiornamenti in chat (RU incluso, che il portale non ha). */
export const statusText: Record<BotLocale, Record<string, string>> = {
  en: { reported: 'reported', in_review: 'being reviewed by our team', quote_pending: 'quote sent to the owner for approval', approved: 'repair approved', scheduled: 'technician scheduled', closed: 'completed and closed', cancelled: 'cancelled' },
  it: { reported: 'segnalata', in_review: 'in verifica da parte del nostro team', quote_pending: 'preventivo inviato al proprietario', approved: 'intervento approvato', scheduled: 'tecnico programmato', closed: 'completata e chiusa', cancelled: 'annullata' },
  fr: { reported: 'signalée', in_review: 'en cours d’examen par notre équipe', quote_pending: 'devis envoyé au propriétaire', approved: 'intervention approuvée', scheduled: 'technicien planifié', closed: 'terminée et clôturée', cancelled: 'annulée' },
  he: { reported: 'נפתחה', in_review: 'בבדיקת הצוות', quote_pending: 'הצעת מחיר נשלחה לבעל הנכס', approved: 'התיקון אושר', scheduled: 'טכנאי תואם', closed: 'הושלמה ונסגרה', cancelled: 'בוטלה' },
  ru: { reported: 'зарегистрирована', in_review: 'на рассмотрении у команды', quote_pending: 'смета отправлена владельцу', approved: 'ремонт одобрен', scheduled: 'мастер назначен', closed: 'выполнена и закрыта', cancelled: 'отменена' },
};
