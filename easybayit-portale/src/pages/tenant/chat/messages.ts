// Messaggi della web chat dell'inquilino (client dell'utente: la RLS limita alle sue conversazioni).
import type { APIRoute } from 'astro';
export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user) return new Response('Forbidden', { status: 403 });
  const after = Number(url.searchParams.get('after') ?? 0) || 0;
  const { data: convs } = await locals.supabase.from('chat_conversations').select('id').eq('channel', 'webchat').eq('external_id', locals.user.id)
    .gte('created_at', new Date(Date.now() - 7 * 86400_000).toISOString());
  const ids = (convs ?? []).map((c) => c.id);
  if (!ids.length) return Response.json({ messages: [] });
  const { data } = await locals.supabase.from('chat_messages').select('id, direction, body, buttons, media, created_at').in('conversation_id', ids).gt('id', after).order('id').limit(200);
  return Response.json({ messages: data ?? [] });
};
