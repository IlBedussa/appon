// Testo localizzato di una notifica (usato sia nell'interfaccia sia nelle email).
import { fill, type Dict } from '../i18n';
import { money, date } from './format';

export function notificationText(kind: string, params: Record<string, unknown>, t: Dict, intl: string): string {
  const tpl = (t.notif.kinds as Record<string, string>)[kind];
  if (!tpl) return kind;
  const p: Record<string, string> = {};
  for (const [k, v] of Object.entries(params ?? {})) p[k] = String(v ?? '');
  if (p.ref) p.ref = `R-${p.ref}`;
  if (p.status) p.status = (t.maintStatus as Record<string, string>)[p.status] ?? p.status;
  if (p.decision) p.decision = (t.quoteStatus as Record<string, string>)[p.decision] ?? p.decision;
  if (p.kind) p.kind = kind.startsWith('inspection_')
    ? (t.inspKind as Record<string, string>)[p.kind] ?? p.kind
    : (t.payKind as Record<string, string>)[p.kind] ?? p.kind;
  if (p.role) p.role = (t.roles as Record<string, string>)[p.role]?.toLowerCase() ?? p.role;
  if (typeof params?.date === 'string') p.date = date(params.date, intl);
  if (params?.amount_ils != null) p.amount = money(Number(params.amount_ils), intl);
  if (params?.total_ils != null) p.total = money(Number(params.total_ils), intl);
  return fill(tpl, p);
}
