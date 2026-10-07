// Invio periodico delle email in coda e pulizia degli upload non finalizzati. Protetto da CRON_SECRET (Vercel Cron: header Authorization: Bearer).
import type { APIRoute } from 'astro';
import { CRON_SECRET } from 'astro:env/server';
import { tokensMatch } from '../../../lib/csrf';
import { processOutbox } from '../../../lib/outbox';
import { processChatOutbox } from '../../../lib/bot/engine';
import { cleanupUploads } from '../../../lib/direct-upload';

const handler: APIRoute = async ({ request }) => {
  const auth = request.headers.get('authorization') ?? '';
  if (!CRON_SECRET || !tokensMatch(auth, `Bearer ${CRON_SECRET}`)) return new Response('Unauthorized', { status: 401 });
  const r = await processOutbox(50);
  const chat = await processChatOutbox(50).catch(() => ({ sent: 0, failed: 0 }));
  // upload diretti non finalizzati (intenti scaduti, oggetti orfani in pending/): ogni 10 minuti con la coda email
  const uploads = await cleanupUploads().catch((e) => { console.error('[uploads-cleanup]', (e as Error).message); return null; });
  return new Response(JSON.stringify({ ...r, chat, uploads }), { headers: { 'content-type': 'application/json' } });
};
export const GET = handler;
export const POST = handler;
