// Caricamento dati del rendiconto per il PDF (con il client dell'utente -> RLS applicata).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StatementPdfData } from './pdf/statement';

export async function loadStatementForPdf(sb: SupabaseClient, id: string): Promise<StatementPdfData | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await sb.from('statements')
    .select('id, period, published_at, owner:owners(id, full_name), statement_lines(line_date, category, description, amount_ils, property:properties(code, name))')
    .eq('id', id).maybeSingle();
  if (!data || !data.owner) return null;
  return {
    id: data.id, period: data.period, published_at: data.published_at,
    owner: data.owner as unknown as StatementPdfData['owner'],
    lines: (data.statement_lines ?? []).map((l: any) => ({ ...l, amount_ils: Number(l.amount_ils) })),
  };
}
