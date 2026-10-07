// Configurazione del CRUD generico del back-office (proprietari, inquilini, immobili, contratti).
// Ogni scrittura usa il client dell'utente staff: RLS consente le modifiche solo a staff/admin con 2FA.
import type { SupabaseClient } from '@supabase/supabase-js';
import { z, reqText, optText, optEmail, money, optMoney, isoDate, checkbox } from './validation';
import type { Dict } from '../i18n';

export type FieldType = 'checkbox' | 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea';
export interface FieldDef { name: string; type: FieldType; required?: boolean; max?: number; step?: string; span?: boolean; options?: string }
export interface Column { key: string; label: string; get: (row: any, t: Dict) => string }
export interface EntityDef {
  table: string;
  navKey: string;
  title: (t: Dict) => string;
  select: string;
  order: string;
  fields: FieldDef[];
  schema: z.ZodType<Record<string, unknown>>;
  columns: Column[];
  label: (row: any) => string;
}

const optNum = (min: number, max: number) => z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().min(min).max(max).optional());

export const entities: Record<string, EntityDef> = {
  owners: {
    table: 'owners', navKey: 'owners', title: (t) => t.nav.owners, order: 'full_name',
    select: 'id, full_name, email, phone, country, approval_limit_ils, auto_approve_below_limit, notes, profile_id, properties(count)',
    fields: [
      { name: 'full_name', type: 'text', required: true, max: 200 }, { name: 'email', type: 'email', max: 320 },
      { name: 'phone', type: 'text', max: 40 }, { name: 'country', type: 'text', max: 80 },
      { name: 'approval_limit_ils', type: 'number', required: true, step: '0.01' }, { name: 'auto_approve_below_limit', type: 'checkbox' }, { name: 'notes', type: 'textarea', max: 4000, span: true },
    ],
    schema: z.object({ full_name: reqText(200), email: optEmail, phone: optText(40), country: optText(80), approval_limit_ils: money.refine((n) => n >= 0), auto_approve_below_limit: checkbox, notes: optText(4000) }),
    columns: [
      { key: 'full_name', label: 'full_name', get: (r) => r.full_name },
      { key: 'email', label: 'email', get: (r) => r.email ?? '—' },
      { key: 'country', label: 'country', get: (r) => r.country ?? '—' },
      { key: 'props', label: 'kpiProps', get: (r) => String(r.properties?.[0]?.count ?? 0) },
      { key: 'user', label: 'linkedUser', get: (r, t) => (r.profile_id ? t.common.yes : t.common.no) },
    ],
    label: (r) => r.full_name,
  },
  tenants: {
    table: 'tenants', navKey: 'tenants', title: (t) => t.nav.tenants, order: 'full_name',
    select: 'id, full_name, email, phone, notes, profile_id',
    fields: [
      { name: 'full_name', type: 'text', required: true, max: 200 }, { name: 'email', type: 'email', max: 320 },
      { name: 'phone', type: 'text', max: 40 }, { name: 'notes', type: 'textarea', max: 4000, span: true },
    ],
    schema: z.object({ full_name: reqText(200), email: optEmail, phone: optText(40), notes: optText(4000) }),
    columns: [
      { key: 'full_name', label: 'full_name', get: (r) => r.full_name },
      { key: 'email', label: 'email', get: (r) => r.email ?? '—' },
      { key: 'phone', label: 'phone', get: (r) => r.phone ?? '—' },
      { key: 'user', label: 'linkedUser', get: (r, t) => (r.profile_id ? t.common.yes : t.common.no) },
    ],
    label: (r) => r.full_name,
  },
  properties: {
    table: 'properties', navKey: 'properties', title: (t) => t.nav.properties, order: 'code',
    select: 'id, code, name, address, city, rooms, size_sqm, status, asking_rent_ils, owner_id, owner:owners(full_name)',
    fields: [
      { name: 'code', type: 'text', required: true, max: 20 }, { name: 'name', type: 'text', required: true, max: 200 },
      { name: 'owner_id', type: 'select', required: true, options: 'owners' }, { name: 'status', type: 'select', required: true, options: 'propertyStatus' },
      { name: 'address', type: 'text', required: true, max: 300 }, { name: 'city', type: 'text', required: true, max: 100 },
      { name: 'rooms', type: 'number', step: '0.5' }, { name: 'size_sqm', type: 'number', step: '0.1' }, { name: 'asking_rent_ils', type: 'number', step: '0.01' },
    ],
    schema: z.object({
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{1,20}$/), name: reqText(200), owner_id: z.uuid(),
      status: z.enum(['occupied', 'vacant', 'maintenance']), address: reqText(300), city: reqText(100),
      rooms: optNum(0.5, 49), size_sqm: optNum(1, 100000), asking_rent_ils: optMoney,
    }),
    columns: [
      { key: 'code', label: 'code', get: (r) => r.code },
      { key: 'name', label: 'name', get: (r) => r.name },
      { key: 'city', label: 'city', get: (r) => r.city },
      { key: 'owner', label: 'owner_id', get: (r) => r.owner?.full_name ?? '—' },
      { key: 'status', label: 'status', get: (r, t) => (t.status as Record<string, string>)[r.status] },
    ],
    label: (r) => `${r.code} · ${r.name}`,
  },
  leases: {
    table: 'leases', navKey: 'leases', title: (t) => t.nav.leases, order: 'start_date',
    select: 'id, property_id, tenant_id, start_date, end_date, monthly_rent_ils, deposit_ils, payment_day, status, notes, property:properties(code, name), tenant:tenants(full_name)',
    fields: [
      { name: 'property_id', type: 'select', required: true, options: 'properties' }, { name: 'tenant_id', type: 'select', required: true, options: 'tenants' },
      { name: 'start_date', type: 'date', required: true }, { name: 'end_date', type: 'date', required: true },
      { name: 'monthly_rent_ils', type: 'number', required: true, step: '0.01' }, { name: 'deposit_ils', type: 'number', required: true, step: '0.01' },
      { name: 'payment_day', type: 'number', required: true, step: '1' }, { name: 'status', type: 'select', required: true, options: 'leaseStatus' },
      { name: 'notes', type: 'textarea', max: 4000, span: true },
    ],
    schema: z.object({
      property_id: z.uuid(), tenant_id: z.uuid(), start_date: isoDate, end_date: isoDate,
      monthly_rent_ils: money.refine((n) => n >= 0), deposit_ils: money.refine((n) => n >= 0),
      payment_day: z.coerce.number().int().min(1).max(28), status: z.enum(['upcoming', 'active', 'ended']), notes: optText(4000),
    }).refine((v) => v.end_date > v.start_date, { path: ['end_date'], message: 'end_date must be after start_date' }),
    columns: [
      { key: 'property', label: 'property_id', get: (r) => (r.property ? `${r.property.code} · ${r.property.name}` : '—') },
      { key: 'tenant', label: 'tenant_id', get: (r) => r.tenant?.full_name ?? '—' },
      { key: 'start', label: 'start_date', get: (r) => r.start_date },
      { key: 'end', label: 'end_date', get: (r) => r.end_date },
      { key: 'rent', label: 'monthly_rent_ils', get: (r) => Number(r.monthly_rent_ils).toLocaleString('en-US') },
      { key: 'status', label: 'status', get: (r, t) => (t.leaseStatus as Record<string, string>)[r.status] },
    ],
    label: (r) => `${r.property?.code ?? ''} · ${r.tenant?.full_name ?? ''}`,
  },
};

/** Opzioni delle select (caricate con RLS). */
export async function loadOptions(sb: SupabaseClient, t: Dict): Promise<Record<string, { value: string; label: string }[]>> {
  const [o, te, p] = await Promise.all([
    sb.from('owners').select('id, full_name').order('full_name'),
    sb.from('tenants').select('id, full_name').order('full_name'),
    sb.from('properties').select('id, code, name').order('code'),
  ]);
  return {
    owners: (o.data ?? []).map((r) => ({ value: r.id, label: r.full_name })),
    tenants: (te.data ?? []).map((r) => ({ value: r.id, label: r.full_name })),
    properties: (p.data ?? []).map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })),
    propertyStatus: (['occupied', 'vacant', 'maintenance'] as const).map((s) => ({ value: s, label: t.status[s] })),
    leaseStatus: (['active', 'upcoming', 'ended'] as const).map((s) => ({ value: s, label: t.leaseStatus[s] })),
  };
}

/** undefined -> null, così un campo svuotato viene cancellato nel DB. */
export const nullify = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === undefined ? null : v]));
