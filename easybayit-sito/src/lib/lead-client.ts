// Invio dei moduli dal browser verso /api/lead/ (vedi src/pages/api/lead.ts). Nessuna chiave nel client.
export type LeadKind = 'contact' | 'lead' | 'capture' | 'popup';
export async function sendLead(kind: LeadKind, data: Record<string, unknown>, startedAt: number): Promise<{ ok: boolean; status: number }> {
  try {
    const r = await fetch('/api/lead/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, ...data, elapsed: Date.now() - startedAt, lang: document.documentElement.lang, page: location.pathname }),
    });
    return { ok: r.ok, status: r.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
