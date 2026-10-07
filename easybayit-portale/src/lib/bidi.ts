// Ordinamento visuale semplificato per testo misto ebraico/latino nei PDF.
// pdfkit non applica l'algoritmo bidirezionale Unicode: qui si dividono i testi in "run"
// con la stessa direzione, si invertono i run ebraici e, in un paragrafo RTL, l'ordine dei run.
// Copre i casi del rendiconto (etichette, nomi, numeri, date). Non è un'implementazione UBA completa.

export type Run = { text: string; font: 'he' | 'lat' };

const isHeb = (c: string) => /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(c);
const isLatinLetter = (c: string) => /[A-Za-z\u00C0-\u024F]/.test(c);
const isDigit = (c: string) => /[0-9]/.test(c);
const MIRROR: Record<string, string> = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' };

type Dir = 'R' | 'L' | 'N';
const classify = (c: string): Dir => (isHeb(c) ? 'R' : isLatinLetter(c) || isDigit(c) ? 'L' : 'N');

/** Testo logico -> segmenti in ordine visuale da sinistra a destra, con il font adatto. */
export function visualRuns(text: string, rtl: boolean): Run[] {
  const chars = Array.from(text);
  const dirs = chars.map(classify);
  // i neutri prendono la direzione dei vicini se uguali, altrimenti quella del paragrafo
  const para: Dir = rtl ? 'R' : 'L';
  for (let i = 0; i < dirs.length; i++) {
    if (dirs[i] !== 'N') continue;
    let j = i;
    while (j < dirs.length && dirs[j] === 'N') j++;
    const prev = i > 0 ? dirs[i - 1] : para;
    const next = j < dirs.length ? dirs[j] : para;
    const d = prev === next ? prev : para;
    for (let k = i; k < j; k++) dirs[k] = d;
    i = j - 1;
  }
  // raggruppa in run di direzione
  const runs: { dir: Dir; chars: string[] }[] = [];
  chars.forEach((c, i) => {
    const last = runs[runs.length - 1];
    if (last && last.dir === dirs[i]) last.chars.push(c);
    else runs.push({ dir: dirs[i], chars: [c] });
  });
  // run RTL: caratteri invertiti (e parentesi specchiate)
  const visual = runs.map((r) => (r.dir === 'R' ? r.chars.reverse().map((c) => MIRROR[c] ?? c).join('') : r.chars.join('')));
  const ordered = rtl ? visual.reverse() : visual;
  // suddivide per font: caratteri ebraici e ₪ con il font ebraico, il resto con quello latino
  const out: Run[] = [];
  for (const seg of ordered) {
    for (const c of Array.from(seg)) {
      const font: Run['font'] = isHeb(c) || c === '\u20AA' ? 'he' : 'lat';
      const last = out[out.length - 1];
      if (last && last.font === font) last.text += c;
      else out.push({ text: c, font });
    }
  }
  return out;
}

// Segni di controllo bidi (RLM/LRM/ALM, embedding, isolati): Intl in he-IL li inserisce attorno a
// numeri e valute; Heebo non ha i glifi (comparirebbero come quadratini) e l'ordine è già gestito qui.
const BIDI_CONTROLS = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069]/g;

/**
 * Run pronti per pdfkit. fontkit (usato da pdfkit) applica già l'inversione RTL ai run in scrittura
 * ebraica: i run ebraici in ordine visuale vanno quindi ripassati in ordine logico, altrimenti il testo
 * risulta invertito due volte. Un testo senza lettere ebraiche è impaginato LTR anche in un documento RTL
 * (evita parentesi spostate in nomi/indirizzi latini).
 */
export function pdfRuns(text: string, rtl: boolean): Run[] {
  const clean = text.replace(BIDI_CONTROLS, '');
  const hasHeb = /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(clean);
  return visualRuns(clean, rtl && hasHeb).map((r) => (r.font === 'he' && /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(r.text) ? { ...r, text: Array.from(r.text).reverse().join('') } : r));
}
