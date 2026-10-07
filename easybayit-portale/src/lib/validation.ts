// Validazione input con Zod (incluso in Astro). Tutti i form passano da qui prima di arrivare al DB.
import { z } from 'astro/zod';

export { z };

/** Converte FormData in oggetto semplice (i campi ripetuti diventano array). */
export function formToObject(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== 'string' || k === '_csrf') continue;
    const prev = out[k];
    if (prev === undefined) out[k] = v;
    else out[k] = Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  return out;
}

/** Errori Zod -> mappa campo => messaggio (per aria-invalid e messaggi accanto al campo). */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? '_');
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

// --- Primitive riutilizzabili ---
const emptyToUndef = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
export const text = (max: number) => z.string().trim().max(max);
export const reqText = (max: number, min = 1) => z.string().trim().min(min).max(max);
export const optText = (max: number) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
export const email = z.string().trim().toLowerCase().pipe(z.email().max(320));
export const optEmail = z.preprocess(emptyToUndef, z.string().trim().toLowerCase().pipe(z.email().max(320)).optional());
export const uuid = z.uuid();
export const optUuid = z.preprocess(emptyToUndef, z.uuid().optional());
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(s + 'T00:00:00Z')), 'invalid date');
export const optIsoDate = z.preprocess(emptyToUndef, isoDate.optional());
export const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const money = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/[,\s₪]/g, '') : v),
  z.coerce.number().finite().min(-10_000_000).max(10_000_000).transform((n) => Math.round(n * 100) / 100),
);
export const positiveMoney = money.refine((n) => n > 0, 'must be > 0');
export const optMoney = z.preprocess(emptyToUndef, money.optional());
export const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === '1', z.boolean());
export const totpCode = z.string().trim().regex(/^\d{6}$/);

/** Requisiti password (allineati a supabase/config.toml: min 10, maiuscole/minuscole/cifre). */
export const password = z
  .string()
  .min(10)
  .max(128)
  .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), 'weak');
