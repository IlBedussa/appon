// Download documento: riga letta con RLS (se non visibile -> 404), file scaricato dallo Storage con
// il client dell'utente (le policy di storage.objects ricontrollano il permesso), download tracciato.
import type { APIRoute } from 'astro';
import { logEvent } from '../../../lib/audit';

export const GET: APIRoute = async ({ params, locals }) => {
  const id = params.id ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
  const { data: doc } = await locals.supabase.from('documents').select('id, title, storage_path, mime_type').eq('id', id).maybeSingle();
  if (!doc) return new Response('Not found', { status: 404 });
  const { data: blob, error } = await locals.supabase.storage.from('documents').download(doc.storage_path);
  if (error || !blob) return new Response('Not found', { status: 404 });
  await logEvent(locals.supabase, 'document.download', 'documents', doc.id, { title: doc.title.slice(0, 100) });
  const ext = doc.storage_path.split('.').pop();
  const safeName = doc.title.replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 80) || 'document';
  return new Response(blob.stream(), {
    headers: {
      'content-type': doc.mime_type,
      'content-disposition': `attachment; filename="document.${ext}"; filename*=UTF-8''${encodeURIComponent(safeName)}.${ext}`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
};
