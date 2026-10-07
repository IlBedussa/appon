// Foto di manutenzione servite tramite il server (bucket privato, RLS su tabella e storage).
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const id = params.id ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
  const { data: ph } = await locals.supabase.from('maintenance_photos').select('id, storage_path, mime_type').eq('id', id).maybeSingle();
  if (!ph) return new Response('Not found', { status: 404 });
  const { data: blob, error } = await locals.supabase.storage.from('maintenance-photos').download(ph.storage_path);
  if (error || !blob) return new Response('Not found', { status: 404 });
  return new Response(blob.stream(), {
    headers: { 'content-type': ph.mime_type, 'cache-control': 'private, max-age=300', 'content-disposition': 'inline', 'x-content-type-options': 'nosniff' },
  });
};
