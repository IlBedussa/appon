// Dati del report mensile sullo stato di UN immobile (letti con il client dell'utente → RLS).
// Entrate/uscite dal rendiconto pubblicato del mese (righe dell'immobile), pagamenti registrati,
// scadenze (documenti con expires_on, fine contratto), manutenzione aperta, foto dell'ultima ispezione completata.
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadInspection, type InspectionFull } from './inspections';

export interface HealthReportData {
  month: string; // YYYY-MM
  property: { id: string; code: string; name: string; address: string; city: string; status: string };
  lease: { tenant: string | null; monthly_rent_ils: number; end_date: string } | null;
  statement: { period: string; published_at: string | null; lines: { line_date: string; category: string; description: string; amount_ils: number }[] } | null;
  payments: { paid_on: string; kind: string; amount_ils: number; status: string }[];
  deadlines: { date: string; label: string; kind: 'document' | 'lease' }[];
  maintenance: { ref: number; title: string; status: string; priority: string; created_at: string }[];
  inspection: InspectionFull | null;
}

export const isMonth = (m: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
export const prevMonth = (d = new Date()) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)); return x.toISOString().slice(0, 7); };

export async function loadHealthReport(sb: SupabaseClient, propertyId: string, month: string, now = new Date()): Promise<HealthReportData | null> {
  if (!/^[0-9a-f-]{36}$/.test(propertyId) || !isMonth(month)) return null;
  const { data: p } = await sb.from('properties').select('id, code, name, address, city, status, owner_id').eq('id', propertyId).maybeSingle();
  if (!p) return null;
  const start = `${month}-01`;
  const end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const horizon = new Date(now.getTime() + 120 * 86400000).toISOString().slice(0, 10);
  const [{ data: leases }, { data: st }, { data: pays }, { data: docs }, { data: maint }, { data: insp }] = await Promise.all([
    sb.from('leases').select('monthly_rent_ils, end_date, status, tenant:tenants(full_name)').eq('property_id', propertyId).in('status', ['active', 'upcoming']).order('start_date', { ascending: false }).limit(1),
    sb.from('statements').select('period, published_at, status, statement_lines(line_date, category, description, amount_ils, property_id)').eq('owner_id', p.owner_id).eq('period', start).eq('status', 'published').maybeSingle(),
    sb.from('payments').select('paid_on, kind, amount_ils, status').eq('property_id', propertyId).gte('paid_on', start).lt('paid_on', end).order('paid_on'),
    sb.from('documents').select('title, expires_on').eq('property_id', propertyId).not('expires_on', 'is', null).gte('expires_on', today).lte('expires_on', horizon).order('expires_on'),
    sb.from('maintenance_requests').select('ref, title, status, priority, created_at').eq('property_id', propertyId).not('status', 'in', '(closed,cancelled)').order('created_at'),
    sb.from('inspections').select('id').eq('property_id', propertyId).eq('status', 'completed').order('performed_at', { ascending: false }).limit(1),
  ]);
  const lease = leases?.[0] ? { tenant: (leases[0] as any).tenant?.full_name ?? null, monthly_rent_ils: Number(leases[0].monthly_rent_ils), end_date: leases[0].end_date } : null;
  const deadlines: HealthReportData['deadlines'] = (docs ?? []).map((d) => ({ date: d.expires_on as string, label: d.title, kind: 'document' as const }));
  if (lease && lease.end_date >= today && lease.end_date <= horizon) deadlines.push({ date: lease.end_date, label: '', kind: 'lease' });
  deadlines.sort((a, b) => a.date.localeCompare(b.date));
  return {
    month,
    property: { id: p.id, code: p.code, name: p.name, address: p.address, city: p.city, status: p.status },
    lease,
    statement: st ? {
      period: st.period, published_at: st.published_at,
      lines: ((st as any).statement_lines ?? []).filter((l: any) => l.property_id === propertyId).map((l: any) => ({ line_date: l.line_date, category: l.category, description: l.description, amount_ils: Number(l.amount_ils) })),
    } : null,
    payments: (pays ?? []).map((x) => ({ ...x, amount_ils: Number(x.amount_ils) })),
    deadlines,
    maintenance: (maint ?? []) as HealthReportData['maintenance'],
    inspection: insp?.[0] ? await loadInspection(sb, insp[0].id) : null,
  };
}
