// PDF del report mensile sullo stato dell'immobile (una pagina, due se servono):
// entrate/uscite del mese, pagamenti, manutenzione aperta, scadenze, foto dell'ultima ispezione.
import { createKit, hmacCode, C } from './kit';
import { fill, type Dict, type Locale } from '../../i18n';
import type { InspDict } from '../../i18n/inspections';
import { ils, date as fmtDate, monthLong } from '../format';
import type { HealthReportData } from '../health-report';

export function healthTotals(d: HealthReportData) {
  const lines = d.statement?.lines ?? [];
  const inc = lines.filter((l) => l.amount_ils > 0).reduce((a, l) => a + l.amount_ils, 0);
  const exp = lines.filter((l) => l.amount_ils < 0).reduce((a, l) => a + l.amount_ils, 0);
  return { inc, exp, net: inc + exp };
}

export async function renderHealthReportPdf(d: HealthReportData, images: Map<string, Buffer>, lang: Locale, t: Dict, x: InspDict, secret: string): Promise<Buffer> {
  const r = x.report;
  const k = createKit(lang, { Title: `${r.title} · ${d.property.code} · ${d.month}` });
  const { doc, text, colX, M, inner, intl } = k;
  let y = k.header(r.title, `${d.property.code} · ${d.property.name} · ${monthLong(d.month, intl)}`, t.meta.company);
  text(`${d.property.address}, ${d.property.city}`, M, y, inner, { size: 9, color: C.muted });
  if (d.lease) text(`${t.common.tenant}: ${d.lease.tenant ?? '—'} · ${t.tenant.rent}: ${ils(d.lease.monthly_rent_ils, intl)}`, M, y + 13, inner, { size: 9, color: C.muted });
  y += 36;

  // --- Riepilogo economico ---
  y = k.section(r.rent, y);
  const tt = healthTotals(d);
  const bw = (inner - 20) / 3;
  [{ l: r.income, v: tt.inc, c: C.ink }, { l: r.expenses, v: tt.exp, c: C.ink }, { l: r.net, v: tt.net, c: C.brand }].forEach((b, i) => {
    const bx = colX(i * (bw + 10), bw);
    doc.roundedRect(bx, y, bw, 50, 6).fill(i === 2 ? C.brandSoft : C.soft);
    text(b.l, bx + 10, y + 8, bw - 20, { size: 8, color: C.muted });
    text(d.statement ? ils(b.v, intl) : '—', bx + 10, y + 23, bw - 20, { size: 14, bold: true, color: b.c });
  });
  y += 58;
  text(d.statement ? fill(r.fromStatement, { m: monthLong(d.month, intl) }) : r.noStatement, M, y, inner, { size: 8, color: C.muted });
  y += 14;
  for (const l of (d.statement?.lines ?? []).slice(0, 8)) {
    const label = (t.categories as Record<string, string>)[l.category] ?? l.category;
    text(fmtDate(l.line_date, intl, { day: '2-digit', month: '2-digit' }), colX(0, 50), y, 50, { size: 8.5, color: C.muted });
    text(l.description ? `${label} · ${l.description}` : label, colX(56, inner - 160), y, inner - 160, { size: 8.5 });
    text(ils(l.amount_ils, intl), colX(inner - 100, 100), y, 100, { size: 8.5, align: 'end', color: l.amount_ils > 0 ? C.ok : C.ink });
    y += 13;
  }
  y += 4;
  text(`${r.payments}: ${d.payments.length ? d.payments.map((p) => `${fmtDate(p.paid_on, intl, { day: '2-digit', month: '2-digit' })} ${(t.payKind as Record<string, string>)[p.kind] ?? p.kind} ${ils(p.amount_ils, intl)} (${(t.payStatus as Record<string, string>)[p.status] ?? p.status})`).join(' · ') : r.noPayments}`, M, y, inner, { size: 8.5, color: C.ink2 });
  y += 24;

  // --- Manutenzione e scadenze (due colonne) ---
  const colW = (inner - 20) / 2;
  let yl = k.section(r.maintenance, y, 80);
  const startY = yl;
  const leftX = colX(0, colW), rightX = colX(colW + 20, colW);
  // titolo della seconda colonna allo stesso livello
  doc.rect(k.rtl ? rightX + colW - 3 : rightX, startY - 26, 3, 16).fill(C.brand);
  text(r.deadlines, k.rtl ? rightX : rightX + 10, startY - 25, colW - 10, { size: 12.5, bold: true });
  if (!d.maintenance.length) { text(r.noMaintenance, leftX, yl, colW, { size: 9, color: C.muted }); yl += 16; }
  for (const m of d.maintenance.slice(0, 6)) {
    text(`R-${m.ref} · ${m.title}`, leftX, yl, colW, { size: 9, bold: true });
    text(`${(t.maintStatus as Record<string, string>)[m.status] ?? m.status} · ${fill(r.since, { d: fmtDate(m.created_at, intl) })}${m.priority === 'urgent' ? ' · ' + t.priority.urgent : ''}`, leftX, yl + 12, colW, { size: 8, color: m.priority === 'urgent' ? C.bad : C.muted });
    yl += 28;
  }
  let yr = startY;
  if (!d.deadlines.length) { text(r.noDeadlines, rightX, yr, colW, { size: 9, color: C.muted }); yr += 16; }
  for (const dl of d.deadlines.slice(0, 6)) {
    text(fmtDate(dl.date, intl), rightX, yr, colW, { size: 9, bold: true });
    text(dl.kind === 'lease' ? r.leaseEnd : dl.label, rightX, yr + 12, colW, { size: 8, color: C.muted });
    yr += 28;
  }
  y = Math.max(yl, yr) + 10;

  // --- Foto dell'ultima ispezione ---
  y = k.section(r.photos, y, 150);
  const ins = d.inspection;
  if (!ins || !ins.photos.length) { text(r.noPhotos, M, y, inner, { size: 9, color: C.muted }); y += 16; }
  else {
    text(`${x.kinds[ins.kind]} · ${fmtDate(ins.performed_at, intl)}`, M, y, inner, { size: 8.5, color: C.muted });
    y += 14;
    const cols = 4, gap = 10, pw = (inner - gap * (cols - 1)) / cols, ph = pw * 0.75;
    y = k.ensure(y, ph + 26);
    ins.photos.slice(0, 4).forEach((p, i) => {
      const px = colX(i * (pw + gap), pw);
      doc.roundedRect(px, y, pw, ph, 5).fill(C.soft);
      const img = images.get(p.id);
      if (img) { try { doc.save().roundedRect(px, y, pw, ph, 5).clip().image(img, px, y, { cover: [pw, ph], align: 'center', valign: 'center' }).restore(); } catch { doc.restore(); } }
      text(p.caption || '—', px, y + ph + 4, pw, { size: 7.5 });
    });
    y += ph + 22;
  }

  const code = hmacCode({ p: d.property.id, m: d.month, lines: (d.statement?.lines ?? []).map((l) => [l.line_date, l.category, l.amount_ils.toFixed(2)]), pays: d.payments.map((p) => [p.paid_on, p.amount_ils]) }, secret);
  k.footer([r.footer, `${x.pdf.integrity}: ${code} · ${fill(x.pdf.generated, { d: fmtDate(new Date().toISOString(), intl) })}`], (n, tt2) => fill(x.pdf.page, { n, t: tt2 }));
  doc.end();
  return k.done;
}
