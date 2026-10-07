// WhatsApp Cloud API (Meta): verifica firma del webhook e parsing del payload in messaggi neutri.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Inbound } from './types';

/** Verifica X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(app secret, corpo grezzo). */
export function verifySignature(rawBody: string | Uint8Array, header: string | null | undefined, appSecret: string): boolean {
  if (!appSecret || !header || !header.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  let got: Buffer;
  try { got = Buffer.from(header.slice(7), 'hex'); } catch { return false; }
  return got.length === expected.length && timingSafeEqual(got, expected);
}
export const sign = (rawBody: string, appSecret: string) => `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;

/** Normalizza un numero in sole cifre con prefisso internazionale (numeri israeliani 0XX… -> 972XX…). */
export function normalizePhone(p: string | null | undefined): string {
  let d = (p ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = `972${d.slice(1)}`;
  return d;
}

interface WaMessage {
  from: string; id: string; timestamp?: string; type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  video?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; mime_type: string; caption?: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
  button?: { payload?: string; text?: string };
}

/** Estrae i messaggi in arrivo (ignora stati di consegna e tipi non gestiti, che ricevono un testo di cortesia). */
export function parseWebhook(payload: any): Inbound[] {
  const out: Inbound[] = [];
  if (payload?.object !== 'whatsapp_business_account') return out;
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value ?? {};
      const names = new Map<string, string>((v.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name]));
      for (const m of (v.messages ?? []) as WaMessage[]) {
        const base: Inbound = { channel: 'whatsapp', from: normalizePhone(m.from), messageId: m.id, timestamp: Number(m.timestamp ?? 0), profileName: names.get(m.from) };
        if (m.type === 'text') out.push({ ...base, text: m.text?.body ?? '' });
        else if (m.type === 'image' && m.image) out.push({ ...base, text: m.image.caption, media: [{ id: m.image.id, mime: m.image.mime_type }] });
        else if (m.type === 'video' && m.video) out.push({ ...base, text: m.video.caption, media: [{ id: m.video.id, mime: m.video.mime_type }] });
        else if (m.type === 'interactive') {
          const r = m.interactive?.button_reply ?? m.interactive?.list_reply;
          out.push({ ...base, replyId: r?.id, text: r?.title });
        } else if (m.type === 'button') out.push({ ...base, replyId: m.button?.payload, text: m.button?.text });
        else out.push({ ...base, text: '' });
      }
    }
  }
  return out;
}

/** Costruisce un payload identico a quello di Meta (usato dal simulatore e dai test). */
export function buildWebhookPayload(msg: { from: string; id: string; name?: string; text?: string; replyId?: string; replyTitle?: string; media?: { id: string; mime: string; caption?: string } }) {
  const m: any = { from: msg.from, id: msg.id, timestamp: String(Math.floor(Date.now() / 1000)) };
  if (msg.media) { const kind = msg.media.mime.startsWith('video/') ? 'video' : 'image'; m.type = kind; m[kind] = { id: msg.media.id, mime_type: msg.media.mime, caption: msg.media.caption }; }
  else if (msg.replyId) { m.type = 'interactive'; m.interactive = { type: 'button_reply', button_reply: { id: msg.replyId, title: msg.replyTitle ?? msg.replyId } }; }
  else { m.type = 'text'; m.text = { body: msg.text ?? '' }; }
  return {
    object: 'whatsapp_business_account',
    entry: [{ id: 'SIM-WABA', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { display_phone_number: '972000000000', phone_number_id: 'SIM' }, contacts: [{ wa_id: msg.from, profile: { name: msg.name ?? 'Simulator' } }], messages: [m] } }] }],
  };
}
