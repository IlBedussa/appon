// Foto di ispezione servite tramite il server (bucket privato; RLS su tabella e storage).
import type { APIRoute } from 'astro';
import { logEvent } from '../../../lib/audit';

export const GET: APIRoute = async ({ params, locals, url }) => {
  const id = params.id ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
  const { data: ph } = await locals.supabase.from('inspection_photos').select('id, inspection_id, storage_path, mime_type').eq('id', id).maybeSingle();
  if (!ph) return new Response('Not found', { status: 404 });
  const { data: blob, error } = await locals.supabase.storage.from('inspection-photos').download(ph.storage_path);
  if (error || !blob) return new Response('Not found', { status: 404 });
  // apertura a schermo intero (non le miniature) registrata nell'audit
  if (url.searchParams.get('full') === '1') await logEvent(locals.supabase, 'inspection.photo_view', 'inspection_photos', ph.id, { inspection: ph.inspection_id });
  return new Response(blob.stream(), {
    headers: { 'content-type': ph.mime_type, 'cache-control': 'private, max-age=300', 'content-disposition': 'inline', 'x-content-type-options': 'nosniff' },
  });
};
