// Funzioni lato browser condivise da pagina /rent-estimate/ e widget chat.
// 1) Chiama l'API server-side; 2) se non disponibile (es. hosting solo statico) calcola nel browser
//    con la STESSA logica (estimate.ts) e annunci di esempio, segnalandolo all'utente.
import { estimateRent, parseQuery } from './estimate';
import { DemoComparablesProvider } from './providers';
import type { RentEstimate } from './types';
import { sources } from '../../data/market';

export type RentStrings = Record<string, any>;
export interface ClientResult { est: RentEstimate; offline: boolean }

export async function requestEstimate(input: Record<string, unknown>): Promise<ClientResult | null> {
  const q = parseQuery(input);
  if (!q) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch('/api/rent-estimate/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q), signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) throw new Error(String(r.status));
    return { est: (await r.json()) as RentEstimate, offline: false };
  } catch {
    const first = estimateRent(q);
    const comps = await new DemoComparablesProvider().find(q, first.mid);
    return { est: estimateRent(q, comps, 'demo'), offline: true };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const fill = (tpl: string, vars: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

/** Genera l'HTML del risultato (metodo, fiducia, comparabili, fonti). Tutto il testo dinamico è sanificato. */
export function renderResult(res: ClientResult, s: RentStrings, ctx: { intl: string; place: string; districtName: string }) {
  const { est, offline } = res;
  const nf = new Intl.NumberFormat(ctx.intl, { maximumFractionDigits: 0 });
  const money = (v: number) => '₪' + nf.format(v);
  const pct = (v: number) => (v > 0 ? '+' : '') + new Intl.NumberFormat(ctx.intl, { maximumFractionDigits: 1 }).format(v) + '%';
  const step1 = est.base.level === 'city' ? s.step1 : est.base.level === 'district' ? s.step1District : s.step1National;
  const adjList = est.adjustments.map((a) => `${s.adj[a.id] ?? a.id} ${pct(a.pct)}`).join(', ');
  const confClass = `conf conf--${est.confidence}`;
  const comps = est.comparables ?? [];
  const compsHtml = comps.length
    ? `<p class="rr-note rr-note--warn">${esc(est.comparablesMode === 'demo' ? s.compsExample : '')}</p>
       <ul class="rr-comps">${comps.map((c) => `<li class="rr-comp">
         ${c.isExample ? `<span class="rr-ex">${esc(s.exampleBadge)}</span>` : ''}
         <strong>${money(c.rent)}</strong><span>${esc(fill(s.compRooms, { rooms: nf.format(c.rooms), sqm: c.sqm, floor: c.floor }))}</span>
         ${c.distanceKm != null ? `<span class="rr-muted">${esc(fill(s.compDistance, { km: c.distanceKm }))}</span>` : ''}
       </li>`).join('')}</ul>`
    : `<p class="rr-note">${esc(s.compsNone)}</p>`;
  const srcIds = [...est.sources, ...(comps.length && est.comparablesMode === 'demo' ? [] : [])];
  const srcHtml = srcIds.map((id) => sources[id as keyof typeof sources]).filter(Boolean)
    .map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener" lang="en">${esc(x.label)}</a> · ${esc(x.date)}</li>`).join('');
  return `
    ${offline ? `<p class="rr-note">${esc(s.offline)}</p>` : ''}
    <div class="rr-head">
      <p class="rr-label">${esc(s.resultTitle)}</p>
      <p class="rr-range"><span>${money(est.low)}</span> – <span>${money(est.high)}</span></p>
      <p class="rr-mid">${esc(s.midLabel)}: <strong>${money(est.mid)}</strong> · <span class="${confClass}">${esc(s.confidence)}: ${esc(s.conf[est.confidence])}</span></p>
      <div class="rr-bar" aria-hidden="true"><span style="inset-inline-start:${50 - est.rangePct * 2}%;inline-size:${est.rangePct * 4}%"></span><i></i></div>
      <p class="rr-muted">${esc(s.confHelp)}</p>
    </div>
    <h3 class="rr-h">${esc(s.methodTitle)}</h3>
    <ol class="rr-steps">
      <li>${esc(fill(step1, { place: est.base.level === 'district' ? `${ctx.place} → ${ctx.districtName}` : ctx.place, value: nf.format(est.base.value) }))}</li>
      <li>${esc(fill(s.step2, { group: est.roomFactor.group, factor: est.roomFactor.factor.toFixed(2) }))}</li>
      <li>${esc(adjList ? fill(s.step3, { list: adjList }) : s.step3None)}</li>
      <li>${esc(fill(s.step4, { pct: est.rangePct }))}</li>
    </ol>
    <h3 class="rr-h">${esc(s.compsTitle)}</h3>
    ${compsHtml}
    <h3 class="rr-h">${esc(s.sourcesTitle)}</h3>
    <ol class="rr-src">${srcHtml}</ol>
    <p class="rr-disclaimer">${esc(s.disclaimer)}</p>`;
}
