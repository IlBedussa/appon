// Webhook WhatsApp Cloud API.
//  GET  = verifica della sottoscrizione (hub.verify_token)
//  POST = eventi: firma X-Hub-Signature-256 obbligatoria, idempotenza per message id, risposta 200 rapida.
import type { APIRoute } from 'astro';
import { verifySignature, parseWebhook } from '../../../lib/bot/whatsapp';
import { botConfig } from '../../../lib/bot/config';
import { handleInbound, processChatOutbox } from '../../../lib/bot/engine';
import { tokensMatch } from '../../../lib/csrf';

export const GET: APIRoute = ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge') ?? '';
  if (mode === 'subscribe' && botConfig.verifyToken && tokensMatch(token, botConfig.verifyToken) && /^[\w-]{1,128}$/.test(challenge)) {
    return new Response(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return new Response('Forbidden', { status: 403 });
};

export const POST: APIRoute = async ({ request }) => {
  if (botConfig.provider === 'disabled') return new Response('Disabled', { status: 404 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return new Response('Too large', { status: 413 });
  if (!verifySignature(raw, request.headers.get('x-hub-signature-256'), botConfig.appSecret)) {
    return new Response('Invalid signature', { status: 401 });
  }
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }
  const messages = parseWebhook(payload);
  const results = [];
  // elaborazione in ordine (i messaggi dello stesso mittente devono rispettare la sequenza)
  for (const m of messages) {
    try { results.push(await handleInbound(m)); } catch (e) { console.error('[whatsapp] handle', (e as Error).message); results.push({ processed: false, error: true }); }
  }
  void processChatOutbox().catch(() => {});
  // Meta ritenta in caso di risposta non 2xx: si risponde sempre 200 dopo una firma valida
  return new Response(JSON.stringify({ ok: true, results }), { status: 200, headers: { 'content-type': 'application/json' } });
};
