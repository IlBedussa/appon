// Comprensione del testo libero dietro un'interfaccia: oggi regole/parole chiave multilingue,
// domani un modello AI (es. NLU_PROVIDER=llm) senza toccare la macchina a stati.
import type { BotLocale, Category, Emergency } from './types';

export interface Understanding {
  category?: Category;
  emergency?: Emergency;
  intent?: 'cancel' | 'yes' | 'no' | 'skip' | 'done' | 'restart';
}
export interface Nlu { understand(text: string, locale: BotLocale): Understanding }

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

// Regole di emergenza: gas, allagamento, blackout, sicurezza (EN/IT/FR/HE/RU)
const EMERGENCY: Record<Emergency, string[]> = {
  gas: ['gas smell', 'smell of gas', 'smells like gas', 'gas leak', 'odore di gas', 'puzza di gas', 'perdita di gas', 'odeur de gaz', 'fuite de gaz', 'ריח גז', 'דליפת גז', 'запах газа', 'утечка газа', 'пахнет газом'],
  flood: ['flood', 'flooding', 'water everywhere', 'burst pipe', 'allagat', 'allagamento', 'tubo rotto', 'inond', 'degat des eaux', 'canalisation eclatee', 'הצפה', 'מוצף', 'צינור התפוצץ', 'потоп', 'затоп', 'прорвало'],
  power: ['no electricity', 'no power', 'power outage', 'blackout', 'sparks', 'niente corrente', 'senza corrente', 'manca la corrente', 'scintill', 'plus d\'electricite', 'pas d\'electricite', 'coupure de courant', 'etincel', 'אין חשמל', 'הפסקת חשמל', 'ניצוצות', 'нет света', 'нет электричества', 'искр'],
  security: ['break-in', 'broken into', 'burglar', 'door won\'t lock', 'cannot lock', 'intruder', 'scasso', 'ladri', 'porta non si chiude', 'effraction', 'cambriol', 'porte ne ferme plus', 'פריצה', 'פורצים', 'הדלת לא ננעלת', 'взлом', 'грабител', 'дверь не закрывается'],
};
const CATS: [Category, string[]][] = [
  ['gas', ['gas', 'gaz', 'גז', 'газ']],
  // categorie specifiche (caldaia, A/C) prima di quelle generiche (acqua/perdita)
  ['heating_ac', ['boiler', 'heater', 'heating', 'hot water', 'air condition', ' ac ', 'riscaldamento', 'caldaia', 'condizionatore', 'acqua calda', 'chauffage', 'chauffe-eau', 'clim', 'eau chaude', 'דוד', 'מזגן', 'חימום', 'מים חמים', 'бойлер', 'отоплен', 'кондиционер', 'горячей воды']],
  ['plumbing', ['leak', 'water', 'pipe', 'tap', 'toilet', 'drain', 'sink', 'shower', 'perdita', 'acqua', 'rubinetto', 'scarico', 'lavandino', 'doccia', 'fuite', 'eau', 'robinet', 'evier', 'douche', 'נזיל', 'מים', 'ברז', 'סתימה', 'אסלה', 'протеч', 'вода', 'кран', 'унитаз', 'засор']],
  ['electrical', ['electric', 'socket', 'light', 'power', 'fuse', 'breaker', 'corrente', 'presa', 'luce', 'elettric', 'prise', 'lumiere', 'electricite', 'disjonct', 'חשמל', 'שקע', 'תאורה', 'электр', 'розетк', 'свет']],
  ['appliances', ['fridge', 'oven', 'washing machine', 'dishwasher', 'stove', 'frigo', 'forno', 'lavatrice', 'lavastoviglie', 'refrigerateur', 'four', 'lave-linge', 'lave-vaisselle', 'מקרר', 'תנור', 'מכונת כביסה', 'מדיח', 'холодильник', 'духовк', 'стиральн', 'посудомо']],
  ['doors_windows', ['door', 'window', 'lock', 'key', 'shutter', 'porta', 'finestra', 'serratura', 'chiave', 'tapparell', 'porte', 'fenetre', 'serrure', 'cle', 'volet', 'דלת', 'חלון', 'מנעול', 'תריס', 'двер', 'окно', 'замок', 'ключ']],
  ['pests', ['cockroach', 'mice', 'mouse', 'rats', 'ants', 'bed bugs', 'scarafaggi', 'topi', 'formiche', 'cafards', 'souris', 'fourmis', 'ג׳וקים', 'ג\'וקים', 'עכברים', 'נמלים', 'таракан', 'мыш', 'муравь']],
];
const INTENTS: [NonNullable<Understanding['intent']>, string[]][] = [
  ['cancel', ['cancel', 'stop', 'annulla', 'annuler', 'ביטול', 'בטל', 'отмена', 'отменить']],
  ['restart', ['start over', 'restart', 'ricomincia', 'recommencer', 'להתחיל מחדש', 'начать заново']],
  ['skip', ['skip', 'salta', 'passer', 'דלג', 'пропустить']],
  ['done', ['done', 'finished', 'fatto', 'finito', 'termine', 'סיימתי', 'готово']],
  ['yes', ['yes', 'yep', 'si', 'sì', 'oui', 'כן', 'да', 'confirm', 'conferma', 'confirmer', 'אישור', 'подтвердить', 'ok']],
  ['no', ['no', 'non', 'לא', 'нет']],
];

export class RulesNlu implements Nlu {
  understand(text: string, _locale?: BotLocale): Understanding {
    const t = ` ${norm(text)} `;
    const out: Understanding = {};
    for (const [k, words] of Object.entries(EMERGENCY) as [Emergency, string[]][]) if (has(t, words.map(norm))) { out.emergency = k; break; }
    for (const [c, words] of CATS) if (has(t, words.map(norm))) { out.category = c; break; }
    if (out.emergency === 'gas') out.category = 'gas';
    const bare = norm(text).replace(/[!.?,]/g, '');
    for (const [i, words] of INTENTS) if (words.map(norm).includes(bare)) { out.intent = i; break; }
    return out;
  }
}

/** Punto di estensione per un NLU basato su AI (non attivo nell'MVP: ricade sulle regole). */
export class LlmNluStub implements Nlu {
  private rules = new RulesNlu();
  understand(text: string, locale: BotLocale): Understanding { return this.rules.understand(text, locale); }
}
export const createNlu = (provider = 'rules'): Nlu => (provider === 'llm' ? new LlmNluStub() : new RulesNlu());

/** Lingua dal sistema di scrittura del testo (fallback quando il mittente non ha un profilo). */
export function detectLocale(text: string | undefined, fallback: BotLocale = 'en'): BotLocale {
  if (!text) return fallback;
  if (/[\u0590-\u05FF]/.test(text)) return 'he';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  const t = ` ${norm(text)} `;
  if (/\b(ciao|buongiorno|salve|perdita|rubinetto)\b/.test(t)) return 'it';
  if (/\b(bonjour|salut|fuite|merci)\b/.test(t)) return 'fr';
  return fallback;
}
