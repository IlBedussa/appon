// Simulatore: messaggi della conversazione più recente del numero (lettura via service role, solo sviluppo).
import type { APIRoute } from 'astro';
import { botConfig } from '../../../lib/bot/config';
import { adminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  if (!botConfig.simulatorEnabled) return new Response('Not found', { status: 404 });
  const phone = url.searchParams.get('phone') ?? '';
  const after = Number(url.searchParams.get('after') ?? 0) || 0;
  if (!/^\d{8,15}$/.test(phone)) return new Response('Bad request', { status: 400 });
  const db = adminClient();
  const { data: convs } = await db.from('chat_conversations').select('id').eq('channel', 'whatsapp').eq('external_id', phone).gte('created_at', new Date(Date.now() - 6 * 3600_000).toISOString());
  const ids = (convs ?? []).map((c) => c.id);
  if (!ids.length) return Response.json({ messages: [] });
  const { data } = await db.from('chat_messages').select('id, direction, body, buttons, media, created_at').in('conversation_id', ids).gt('id', after).order('id').limit(200);
  const messages = (data ?? []).map((m) => ({ ...m, media: Array.isArray(m.media) ? (m.media as any[]).map((x) => ({ mime: x.mime, url: `/dev/whatsapp-sim/media?id=${encodeURIComponent(x.id)}` })) : null }));
  return Response.json({ messages });
};
