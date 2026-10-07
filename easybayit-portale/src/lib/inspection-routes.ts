// Risposte condivise per i PDF di ispezione e del report mensile (stesse regole per tutti i ruoli:
// i dati sono letti con il client dell'utente, quindi RLS decide cosa è visibile → altrimenti 404).
import type { APIContext } from 'astro';
import { PDF_INTEGRITY_SECRET } from 'astro:env/server';
import { loadInspection, photoBytes } from './inspections';
import { loadHealthReport, isMonth, prevMonth } from './health-report';
import { renderInspectionPdf } from './pdf/inspection';
import { renderHealthReportPdf } from './pdf/health-report';
import { logEvent } from './audit';
import { ix } from '../i18n/inspections';

const pdfResponse = (pdf: Buffer, filename: string) => new Response(new Uint8Array(pdf), {
  headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${filename}"`, 'cache-control': 'private, no-store' },
});

export async function inspectionPdf({ params, locals }: APIContext): Promise<Response> {
  const d = await loadInspection(locals.supabase, params.id ?? '');
  if (!d) return new Response('Not found', { status: 404 });
  const images = await photoBytes(locals.supabase, d.photos, 24);
  const pdf = await renderInspectionPdf(d, images, locals.lang, locals.t, ix(locals.lang), PDF_INTEGRITY_SECRET);
  await logEvent(locals.supabase, 'inspection.pdf_download', 'inspections', d.id, { kind: d.kind });
  return pdfResponse(pdf, `easybayit-inspection-${d.property?.code ?? 'property'}-${d.performed_at}.pdf`);
}

export async function healthReportPdf({ params, url, locals }: APIContext): Promise<Response> {
  // report economico: solo proprietario (RLS limita ai suoi immobili) e staff
  if (!['owner', 'admin', 'staff'].includes(locals.profile?.role ?? '')) return new Response('Not found', { status: 404 });
  const m = url.searchParams.get('month') ?? prevMonth();
  if (!isMonth(m)) return new Response('Bad request', { status: 400 });
  const d = await loadHealthReport(locals.supabase, params.id ?? '', m);
  if (!d) return new Response('Not found', { status: 404 });
  const images = d.inspection ? await photoBytes(locals.supabase, d.inspection.photos, 4) : new Map();
  const pdf = await renderHealthReportPdf(d, images, locals.lang, locals.t, ix(locals.lang), PDF_INTEGRITY_SECRET);
  await logEvent(locals.supabase, 'report.pdf_download', 'properties', d.property.id, { month: m });
  return pdfResponse(pdf, `easybayit-health-report-${d.property.code}-${m}.pdf`);
}
