// PDF del report di ispezione (ingresso / uscita / annuale): voci stanza per stanza, foto con data,
// impronte SHA-256 e prese visione. Codice di integrità HMAC sui dati (non è una firma qualificata).
import { createKit, hmacCode, C } from './kit';
import { fill, type Dict, type Locale } from '../../i18n';
import type { InspDict } from '../../i18n/inspections';
import { date as fmtDate, dateTime } from '../format';
import { byRoom, type InspectionFull } from '../inspections';

export function inspectionIntegrity(d: InspectionFull, secret: string) {
  return hmacCode({
    id: d.id, kind: d.kind, property: d.property?.id, performed_at: d.performed_at, completed_at: d.completed_at,
    items: d.items.map((i) => [i.room, i.item, i.condition, i.note]), photos: d.photos.map((p) => p.sha256 ?? p.id),
  }, secret);
}

export async function renderInspectionPdf(d: InspectionFull, images: Map<string, Buffer>, lang: Locale, t: Dict, x: InspDict, secret: string): Promise<Buffer> {
  const k = createKit(lang, { Title: `${x.pdf.title} · ${x.kinds[d.kind]}` });
  const { doc, text, para, colX, M, inner, intl } = k;
  let y = k.header(x.pdf.title, `${x.kinds[d.kind]} · ${fmtDate(d.performed_at, intl, { day: 'numeric', month: 'long', year: 'numeric' })}`, t.meta.company);

  // --- Riquadro dati ---
  const rows: [string, string][] = [
    [x.pdf.property, d.property ? `${d.property.code} · ${d.property.name}` : '—'],
    [t.admin.fields.address, d.property ? `${d.property.address}, ${d.property.city}` : '—'],
    [x.pdf.tenant, d.lease?.tenant?.full_name ?? '—'],
    [x.lease, d.lease ? `${fmtDate(d.lease.start_date, intl)} – ${fmtDate(d.lease.end_date, intl)}` : x.leaseNone],
    [x.pdf.status, d.completed_at ? fill(x.completedOn, { d: dateTime(d.completed_at, intl) }) : x.status.draft],
    [x.pdf.ref, d.id.slice(0, 8).toUpperCase()],
  ];
  const boxH = 14 + Math.ceil(rows.length / 2) * 30;
  doc.roundedRect(M, y, inner, boxH, 8).fill(C.soft);
  const half = (inner - 30) / 2;
  rows.forEach(([kk, v], i) => {
    const cx = colX(10 + (i % 2) * (half + 10), half);
    const cy = y + 10 + Math.floor(i / 2) * 30;
    text(kk, cx, cy, half, { size: 7.5, color: C.muted });
    text(v, cx, cy + 11, half, { size: 10, bold: true });
  });
  y += boxH + 18;

  if (!d.completed_at) {
    doc.roundedRect(M, y, inner, 22, 6).fill(C.warnSoft);
    text(x.status.draft.toUpperCase(), M + 10, y + 6, inner - 20, { size: 9, bold: true, color: C.warn });
    y += 34;
  }

  // --- Sintesi ---
  if (d.summary.trim()) {
    y = k.section(x.summary, y);
    y = para(d.summary, M, y, inner, { size: 10, color: C.ink2 }) + 8;
  }

  // --- Stanza per stanza ---
  y = k.section(x.roomsTitle, y);
  const tone = (c: string) => (c === 'good' ? 'ok' : c === 'fair' ? 'warn' : c === 'poor' ? 'bad' : 'neutral') as 'ok' | 'warn' | 'bad' | 'neutral';
  for (const [room, items] of byRoom(d.items)) {
    y = k.ensure(y, 50);
    doc.rect(M, y, inner, 20).fill(C.brandSoft);
    text(room, M + 8, y + 5, inner - 16, { size: 10, bold: true, color: C.brand });
    y += 26;
    for (const it of items) {
      const noteLines = it.note ? k.wrap(it.note, inner - 260, 8.5) : [];
      const rowH = Math.max(18, 6 + noteLines.length * 12);
      y = k.ensure(y, rowH + 4);
      text(it.item, colX(8, 150), y, 150, { size: 9.5 });
      k.pill(x.cond[it.condition], k.rtl ? colX(166, 80) + 80 : colX(166, 80), y, tone(it.condition));
      noteLines.forEach((l, i) => text(l, colX(252, inner - 260), y + i * 12, inner - 260, { size: 8.5, color: C.ink2 }));
      y += rowH;
      doc.moveTo(M, y - 3).lineTo(M + inner, y - 3).lineWidth(0.5).strokeColor(C.line).stroke();
    }
    y += 8;
  }

  // --- Foto ---
  if (d.photos.length) {
    y = k.section(fill(x.photos, { n: d.photos.length }) + ' · ' + x.photosTitle, y, 200);
    const cols = 3, gap = 12, pw = (inner - gap * (cols - 1)) / cols, ph = pw * 0.75;
    let i = 0;
    for (const p of d.photos) {
      const c = i % cols;
      if (c === 0 && i > 0) y += ph + 52;
      if (c === 0) y = k.ensure(y, ph + 50);
      const px = colX(c * (pw + gap), pw);
      const img = images.get(p.id);
      doc.roundedRect(px, y, pw, ph, 6).fill(C.soft);
      if (img) {
        try { doc.save().roundedRect(px, y, pw, ph, 6).clip().image(img, px, y, { cover: [pw, ph], align: 'center', valign: 'center' }).restore(); } catch { doc.restore(); }
      }
      text(`${i + 1}. ${p.caption || '—'}`, px, y + ph + 5, pw, { size: 8.5, bold: true });
      text(p.taken_at ? fill(x.takenAt, { d: dateTime(p.taken_at, intl) }) : fill(x.uploadedAt, { d: dateTime(p.uploaded_at, intl) }), px, y + ph + 17, pw, { size: 7.5, color: C.muted });
      if (p.sha256) text(`SHA-256 ${p.sha256.slice(0, 16)}…`, px, y + ph + 28, pw, { size: 6.5, color: C.muted });
      i++;
    }
    y += ph + 60;
  }

  // --- Prese visione ---
  y = k.section(x.pdf.acks, y, 50);
  if (!d.acks.length) { text(x.pdf.noAcks, M, y, inner, { size: 9.5, color: C.muted }); y += 18; }
  for (const a of d.acks) {
    y = k.ensure(y, 34);
    text(`${fill(x.ackLine, { role: t.roles[a.role], d: dateTime(a.acknowledged_at, intl) })}`, M, y, inner, { size: 9.5, bold: true, color: C.ok });
    y += 14;
    if (a.comment) y = para(`“${a.comment}”`, M + 12, y, inner - 12, { size: 9, color: C.ink2 });
    y += 6;
  }
  y += 4;
  y = k.ensure(y, 40);
  para(x.ackText, M, y, inner, { size: 7.5, color: C.muted, lh: 10.5 });

  const code = inspectionIntegrity(d, secret);
  k.footer([x.pdf.footer, `${x.pdf.integrity}: ${code} · ${fill(x.pdf.generated, { d: fmtDate(new Date().toISOString(), intl) })} · ID ${d.id.slice(0, 8)}`],
    (n, tt) => fill(x.pdf.page, { n, t: tt }));
  doc.end();
  return k.done;
}
