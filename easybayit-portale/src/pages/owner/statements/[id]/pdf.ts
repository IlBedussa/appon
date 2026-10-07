// PDF del rendiconto generato lato server. I dati sono letti con il client dell'utente:
// se RLS non concede il rendiconto, la risposta è 404. Ogni download viene registrato nell'audit.
import type { APIRoute } from 'astro';
import { PDF_INTEGRITY_SECRET } from 'astro:env/server';
import { renderStatementPdf } from '../../../../lib/pdf/statement';
import { loadStatementForPdf } from '../../../../lib/statements';
import { logEvent } from '../../../../lib/audit';

export const GET: APIRoute = async ({ params, locals }) => {
  const data = await loadStatementForPdf(locals.supabase, params.id ?? '');
  if (!data) return new Response('Not found', { status: 404 });
  const pdf = await renderStatementPdf(data, locals.lang, locals.t, PDF_INTEGRITY_SECRET);
  await logEvent(locals.supabase, 'statement.pdf_download', 'statements', data.id, { period: data.period });
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="easybayit-statement-${data.period.slice(0, 7)}.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
};
