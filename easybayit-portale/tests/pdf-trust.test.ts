// PDF di ispezione e report mensile: generazione in tutte le lingue (senza DB), intestazione %PDF.
import { describe, it, expect } from 'vitest';
import { renderInspectionPdf, inspectionIntegrity } from '../src/lib/pdf/inspection';
import { renderHealthReportPdf, healthTotals } from '../src/lib/pdf/health-report';
import { dict } from '../src/i18n';
import { ix } from '../src/i18n/inspections';
import type { InspectionFull } from '../src/lib/inspections';
import type { HealthReportData } from '../src/lib/health-report';
import { readFileSync } from 'node:fs';

const photo = readFileSync(new URL('../scripts/fixtures/insp-kitchen.jpg', import.meta.url));
const insp: InspectionFull = {
  id: '00000000-0000-4000-8000-000000000001', kind: 'move_in', status: 'completed', performed_at: '2026-03-31', summary: 'Good overall. דירה במצב טוב.',
  completed_at: '2026-03-31T09:00:00Z', created_at: '2026-03-31T07:00:00Z',
  property: { id: 'p1', code: 'TST-01', name: 'Example Flat', address: '1 Example St.', city: 'Jerusalem' },
  lease: { id: 'l1', start_date: '2026-04-01', end_date: '2027-03-31', tenant: { full_name: 'Tenant Example' } }, performer: null,
  items: Array.from({ length: 30 }, (_, i) => ({ id: `i${i}`, room: ['Kitchen', 'מטבח', 'Bathroom'][i % 3], item: `Item ${i}`, condition: (['good', 'fair', 'poor', 'na'] as const)[i % 4], note: i % 2 ? 'A longer note that should wrap onto more than one line in the PDF table when it is long enough to overflow.' : '', position: i })),
  photos: Array.from({ length: 5 }, (_, i) => ({ id: `ph${i}`, item_id: null, caption: `Photo ${i}`, taken_at: '2026-03-31T10:00:00Z', uploaded_at: '2026-03-31T10:05:00Z', mime_type: 'image/jpeg', size_bytes: photo.length, sha256: 'a'.repeat(64), storage_path: 'x' })),
  acks: [{ id: 'a1', profile_id: 'u1', role: 'tenant', acknowledged_at: '2026-03-31T12:00:00Z', comment: 'OK' }],
};
const hr: HealthReportData = {
  month: '2026-09', property: { id: 'p1', code: 'TST-01', name: 'Example Flat', address: '1 Example St.', city: 'Jerusalem', status: 'occupied' },
  lease: { tenant: 'Tenant Example', monthly_rent_ils: 7200, end_date: '2026-12-31' },
  statement: { period: '2026-09-01', published_at: '2026-10-01T06:00:00Z', lines: [
    { line_date: '2026-09-01', category: 'rent', description: '', amount_ils: 7200 }, { line_date: '2026-09-30', category: 'management_fee', description: '', amount_ils: -849.6 }] },
  payments: [{ paid_on: '2026-09-01', kind: 'rent', amount_ils: 7200, status: 'paid' }],
  deadlines: [{ date: '2026-11-01', label: 'Gas safety check', kind: 'document' }, { date: '2026-12-31', label: '', kind: 'lease' }],
  maintenance: [{ ref: 1001, title: 'Water heater', status: 'quote_pending', priority: 'urgent', created_at: '2026-09-20T08:00:00Z' }],
  inspection: insp,
};

describe('PDF ispezione e report di stato', () => {
  for (const l of ['en', 'he', 'it', 'fr'] as const) {
    it(`ispezione ${l}: PDF valido, multipagina`, async () => {
      const pdf = await renderInspectionPdf(insp, new Map(insp.photos.map((p) => [p.id, photo])), l, dict(l), ix(l), 'secret');
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pdf.length).toBeGreaterThan(20_000);
    });
    it(`report mensile ${l}: PDF valido`, async () => {
      const pdf = await renderHealthReportPdf(hr, new Map([['ph0', photo]]), l, dict(l), ix(l), 'secret');
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    });
  }
  it('codice di integrità stabile e sensibile ai dati', () => {
    const a = inspectionIntegrity(insp, 's');
    expect(a).toMatch(/^[0-9A-F]{4}(-[0-9A-F]{4}){4}$/);
    expect(inspectionIntegrity(insp, 's')).toBe(a);
    expect(inspectionIntegrity({ ...insp, items: insp.items.slice(1) }, 's')).not.toBe(a);
  });
  it('totali del report dal rendiconto', () => {
    expect(healthTotals(hr)).toEqual({ inc: 7200, exp: -849.6, net: 6350.4 });
  });
});

describe('metriche pubbliche (spente di default)', () => {
  it('percorso pubblico ma 404 se PUBLIC_METRICS_ENABLED non è attivo', async () => {
    const { isPublicPath } = await import('../src/lib/session');
    expect(isPublicPath('/api/public/sla')).toBe(true);
    expect(isPublicPath('/api/public/other')).toBe(false);
    const { GET } = await import('../src/pages/api/public/sla');
    const res = await (GET as any)({});
    expect(res.status).toBe(404);
  });
});
