// Messaggio dalla web chat dell'inquilino -> motore del bot (canale webchat). Sessione e CSRF verificati dal middleware.
// Gli allegati non passano dal corpo della richiesta (limite Vercel 4,5 MB): il browser li carica direttamente
// sullo storage con un URL firmato (/api/uploads/sign, kind "webchat") e qui arriva solo uploadId.
import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { handleInbound, processChatOutbox } from '../../../lib/bot/engine';
import { simMedia } from '../../../lib/bot/provider';
import { hit } from '../../../lib/ratelimit';
import { adminClient } from '../../../lib/supabase';
import { finalizeUploads, discardPending } from '../../../lib/direct-upload';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || locals.profile?.role !== 'tenant') return new Response('Forbidden', { status: 403 });
  if (!(await hit('webchat', user.id, 60, 600))) return new Response('Too many messages', { status: 429 });
  // solo JSON: i file non viaggiano nel corpo della richiesta
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return new Response('Unsupported media type', { status: 415 });
  const b = await request.json().catch(() => ({}));
  const text = typeof b.text === 'string' ? b.text.slice(0, 2000) : undefined;
  const replyId = typeof b.replyId === 'string' ? b.replyId.slice(0, 200) : undefined;
  let media: { id: string; mime: string }[] | undefined;
  let pending: string | null = null;
  if (typeof b.uploadId === 'string') {
    // verifica dell'oggetto caricato (esistenza, dimensione, tipo reale) e passaggio al motore come media del canale
    const r = await finalizeUploads({ sb: locals.supabase, userId: user.id, role: 'tenant' }, { kind: 'webchat' }, [b.uploadId]);
    const f = r.ok[0];
    if (!f) return Response.json({ ok: false, error: r.rejected[0]?.reason ?? 'invalid' }, { status: 422 });
    const dl = await adminClient().storage.from('maintenance-photos').download(f.path);
    if (dl.error || !dl.data) { await discardPending('maintenance-photos', f.path); return Response.json({ ok: false, error: 'server' }, { status: 500 }); }
    const id = `webchat-${randomUUID()}`;
    simMedia.put(id, new Uint8Array(await dl.data.arrayBuffer()), f.mime);
    media = [{ id, mime: f.mime }];
    pending = f.path;
  }
  try {
    const r = await handleInbound({ channel: 'webchat', from: user.id, messageId: `web-${randomUUID()}`, text, replyId, media });
    void processChatOutbox().catch(() => {});
    return Response.json({ ok: r.processed, requestRef: r.requestRef ?? null });
  } finally {
    // il motore ha copiato il file nell'area della conversazione: l'originale temporaneo si rimuove
    if (pending) await discardPending('maintenance-photos', pending);
  }
};
