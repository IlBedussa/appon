// Tipi del bot di manutenzione (indipendenti dal canale: WhatsApp, web chat del portale, simulatore).
export type BotLocale = 'en' | 'he' | 'it' | 'fr' | 'ru';
export type Channel = 'whatsapp' | 'webchat';
export type Category = 'plumbing' | 'electrical' | 'heating_ac' | 'appliances' | 'doors_windows' | 'gas' | 'pests' | 'other';
export type Emergency = 'gas' | 'flood' | 'power' | 'security';

export interface InboundMedia { id: string; mime: string; caption?: string }
export interface Inbound {
  channel: Channel;
  /** id esterno del mittente: numero WhatsApp (solo cifre) o id profilo per la web chat */
  from: string;
  /** id del messaggio del provider (idempotenza) */
  messageId: string;
  text?: string;
  /** risposta a un pulsante/lista (id dell'opzione) */
  replyId?: string;
  media?: InboundMedia[];
  timestamp?: number;
  /** nome profilo WhatsApp (solo informativo) */
  profileName?: string;
}

export interface Button { id: string; title: string }
export interface Outbound { text: string; buttons?: Button[] }

export interface PropertyOption { id: string; code: string; name: string }

/** Dati raccolti durante la conversazione (salvati in chat_conversations.data). */
export interface ConvData {
  propertyId?: string;
  category?: Category;
  description?: string;
  media?: { path: string; mime: string; size: number }[];
  emergency?: Emergency | null;
  urgent?: boolean;
  availability?: string;
  invalid?: number;
}

export type State =
  | 'start' | 'ask_property' | 'ask_category' | 'ask_description' | 'ask_media' | 'ask_urgency'
  | 'ask_availability' | 'confirm' | 'done' | 'cancelled' | 'unknown_sender';

export interface Ctx {
  locale: BotLocale;
  tenantName?: string | null;
  properties: PropertyOption[];
  emergencyPhone: string;
  maxMedia: number;
}

export type Action =
  | { type: 'create_request' }
  | { type: 'close' };

export interface StepResult { state: State; data: ConvData; replies: Outbound[]; actions: Action[] }
