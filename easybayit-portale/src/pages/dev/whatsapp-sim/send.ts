// Simulatore: costruisce un payload identico a Meta, lo firma e lo POSTa al webhook reale.
import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { botConfig } from '../../../lib/bot/config';
import { buildWebhookPayload, sign } from '../../../lib/bot/whatsapp';

export const POST: APIRoute = async ({ request, url }) => {
  if (!botConfig.simulatorEnabled) return new Response('Not found', { status: 404 });
  const b = await request.json().catch(() => null);
  if (!b || !/^\d{8,15}$/.test(String(b.from ?? ''))) return new Response('Bad request', { status: 400 });
  const payload = buildWebhookPayload({
    from: b.from, id: `wamid.SIM.${randomUUID()}`, text: typeof b.text === 'string' ? b.text.slice(0, 4000) : undefined,
    replyId: typeof b.replyId === 'string' ? b.replyId.slice(0, 200) : undefined, replyTitle: typeof b.replyTitle === 'string' ? b.replyTitle.slice(0, 40) : undefined,
    media: b.media && typeof b.media.id === 'string' ? { id: b.media.id, mime: String(b.media.mime) } : undefined,
  });
  const raw = JSON.stringify(payload);
  const res = await fetch(new URL('/api/whatsapp/webhook', url.origin), { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sign(raw, botConfig.appSecret) }, body: raw });
  return new Response(await res.text(), { status: res.status, headers: { 'content-type': 'application/json' } });
};
