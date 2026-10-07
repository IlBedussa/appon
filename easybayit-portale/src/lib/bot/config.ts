// Configurazione del bot da variabili d'ambiente (validate da astro:env).
import {
  WHATSAPP_PROVIDER, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_GRAPH_VERSION, WHATSAPP_SIMULATOR, BOT_EMERGENCY_PHONE, NLU_PROVIDER,
} from 'astro:env/server';
import { CloudProvider, LocalProvider, type ChatProvider } from './provider';
import type { Channel } from './types';

export const botConfig = {
  provider: (WHATSAPP_PROVIDER ?? 'simulator') as 'cloud' | 'simulator' | 'disabled',
  appSecret: WHATSAPP_APP_SECRET ?? '',
  verifyToken: WHATSAPP_VERIFY_TOKEN ?? '',
  /** il simulatore esiste solo in sviluppo, o se abilitato esplicitamente (mai insieme al provider cloud) */
  simulatorEnabled: (import.meta.env.DEV || WHATSAPP_SIMULATOR === true) && WHATSAPP_PROVIDER !== 'cloud',
  emergencyPhone: BOT_EMERGENCY_PHONE || '+972-0-000-0000 (placeholder)',
  nlu: NLU_PROVIDER ?? 'rules',
  maxMedia: 5,
};

export function providerFor(channel: Channel): ChatProvider {
  if (channel === 'webchat') return new LocalProvider('webchat');
  if (botConfig.provider === 'cloud') {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) throw new Error('WhatsApp Cloud API non configurata');
    return new CloudProvider(WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_GRAPH_VERSION || 'v21.0');
  }
  return new LocalProvider('simulator');
}
