// Regole degli upload diretti (pure, senza I/O: usate dal server, dal client per i controlli
// preliminari e dai test). Il server ricontrolla tutto alla firma e alla finalizzazione.
import { EXT, IMAGE_MIMES, VIDEO_MIMES, type AllowedMime } from './upload';

export const UPLOAD_KINDS = ['maintenance', 'inspection', 'document', 'webchat'] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];
export type Bucket = 'maintenance-photos' | 'inspection-photos' | 'documents';

export const MB = 1024 * 1024;
export const MAX_PHOTO_BYTES = 8 * MB;
export const MAX_VIDEO_BYTES = 50 * MB;
export const MAX_DOCUMENT_BYTES = 10 * MB;

export interface KindPolicy { bucket: Bucket; mimes: AllowedMime[]; maxFiles: number; maxBytes: (m: AllowedMime) => number }
const media = (m: AllowedMime) => (m.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES);
export const POLICY: Record<UploadKind, KindPolicy> = {
  maintenance: { bucket: 'maintenance-photos', mimes: [...IMAGE_MIMES, ...VIDEO_MIMES], maxFiles: 5, maxBytes: media },
  inspection: { bucket: 'inspection-photos', mimes: [...IMAGE_MIMES], maxFiles: 10, maxBytes: () => MAX_PHOTO_BYTES },
  document: { bucket: 'documents', mimes: ['application/pdf', ...IMAGE_MIMES], maxFiles: 1, maxBytes: () => MAX_DOCUMENT_BYTES },
  webchat: { bucket: 'maintenance-photos', mimes: [...IMAGE_MIMES, ...VIDEO_MIMES], maxFiles: 1, maxBytes: media },
};
export const isUploadKind = (v: unknown): v is UploadKind => typeof v === 'string' && (UPLOAD_KINDS as readonly string[]).includes(v);

export type DeclaredFile = { name: string; size: number; type: string };
export type DeclaredCheck = { ok: true; mime: AllowedMime; ext: string } | { ok: false; reason: 'type' | 'size' | 'empty' };

/** Controllo del file dichiarato dal browser (nome, dimensione, tipo) prima di emettere l'URL firmato. */
export function checkDeclared(kind: UploadKind, f: DeclaredFile): DeclaredCheck {
  const p = POLICY[kind];
  if (!Number.isSafeInteger(f.size) || f.size <= 0) return { ok: false, reason: 'empty' };
  const mime = (f.type || '').toLowerCase() as AllowedMime;
  if (!p.mimes.includes(mime)) return { ok: false, reason: 'type' };
  if (f.size > p.maxBytes(mime)) return { ok: false, reason: 'size' };
  return { ok: true, mime, ext: EXT[mime] };
}

/** Tipo reale compatibile con quello dichiarato (MP4 e MOV condividono il formato ISO BMFF). */
export function mimeCompatible(declared: string, sniffed: AllowedMime): boolean {
  if (declared === sniffed) return true;
  const iso = ['video/mp4', 'video/quicktime'];
  return iso.includes(declared) && iso.includes(sniffed);
}

export type ObjectFacts = { size: number; sniffed: AllowedMime | null };
export type VerifyResult = { ok: true; mime: AllowedMime } | { ok: false; reason: 'missing' | 'size' | 'type' | 'mismatch' };

/** Verifica alla finalizzazione: l'oggetto caricato corrisponde all'intento e alle regole del tipo. */
export function verifyObject(kind: UploadKind, intent: { declared_size: number; declared_mime: string }, facts: ObjectFacts | null): VerifyResult {
  if (!facts) return { ok: false, reason: 'missing' };
  const p = POLICY[kind];
  if (facts.size !== intent.declared_size) return { ok: false, reason: 'mismatch' };
  if (!facts.sniffed || !p.mimes.includes(facts.sniffed)) return { ok: false, reason: 'type' };
  if (facts.size > p.maxBytes(facts.sniffed)) return { ok: false, reason: 'size' };
  if (!mimeCompatible(intent.declared_mime, facts.sniffed)) return { ok: false, reason: 'mismatch' };
  return { ok: true, mime: facts.sniffed };
}

/** Ora locale israeliana "YYYY-MM-DDTHH:MM[:SS]" → ISO UTC (offset corretto anche con l'ora legale). */
export function israelLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local);
  if (!m) return null;
  const guess = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)));
  if (Number.isNaN(guess.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(guess);
  const g = (k: string) => Number(parts.find((p) => p.type === k)!.value);
  const asIl = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return new Date(guess.getTime() - (asIl - guess.getTime())).toISOString();
}

// ---------- Data di scatto dai metadati EXIF (JPEG APP1, PNG eXIf, WebP EXIF) ----------

/** Restituisce il blocco TIFF dell'EXIF, se presente nei primi byte del file. */
function tiffBlock(b: Uint8Array): Uint8Array | null {
  const ascii = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));
  const stripExifHeader = (x: Uint8Array) => (x.length >= 6 && String.fromCharCode(...x.subarray(0, 4)) === 'Exif' ? x.subarray(6) : x);
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o + 4 <= b.length && b[o] === 0xff) {
      const marker = b[o + 1];
      if (marker === 0xda || marker === 0xd9) break; // inizio dati immagine
      const len = (b[o + 2] << 8) | b[o + 3];
      if (len < 2) break;
      if (marker === 0xe1 && ascii(o + 4, 4) === 'Exif') return b.subarray(o + 10, Math.min(b.length, o + 2 + len));
      o += 2 + len;
    }
    return null;
  }
  if (b.length > 8 && b[0] === 0x89 && ascii(1, 3) === 'PNG') {
    let o = 8;
    while (o + 12 <= b.length) {
      const len = ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
      const type = ascii(o + 4, 4);
      if (type === 'eXIf') return stripExifHeader(b.subarray(o + 8, Math.min(b.length, o + 8 + len)));
      if (type === 'IDAT' || type === 'IEND') break;
      o += 12 + len;
    }
    return null;
  }
  if (b.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    let o = 12;
    while (o + 8 <= b.length) {
      const len = b[o + 4] | (b[o + 5] << 8) | (b[o + 6] << 16) | ((b[o + 7] << 24) >>> 0);
      if (ascii(o, 4) === 'EXIF') return stripExifHeader(b.subarray(o + 8, Math.min(b.length, o + 8 + len)));
      o += 8 + len + (len % 2);
    }
  }
  return null;
}

function readTiffTags(t: Uint8Array): Map<number, string> {
  const out = new Map<number, string>();
  if (t.length < 8) return out;
  const le = t[0] === 0x49 && t[1] === 0x49;
  if (!le && !(t[0] === 0x4d && t[1] === 0x4d)) return out;
  const u16 = (o: number) => (o + 2 <= t.length ? (le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]) : -1);
  const u32 = (o: number) => (o + 4 <= t.length ? (le ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16)) + t[o + 3] * 0x1000000 : t[o] * 0x1000000 + ((t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3])) : -1);
  const WANTED = new Set([0x0132, 0x9003, 0x9011]);
  const readIfd = (off: number, depth: number) => {
    const n = u16(off);
    if (n < 0 || n > 500 || depth > 2) return;
    for (let i = 0; i < n; i++) {
      const e = off + 2 + i * 12;
      const tag = u16(e), type = u16(e + 2), count = u32(e + 4);
      if (tag < 0 || count < 0) return;
      if (tag === 0x8769) { readIfd(u32(e + 8), depth + 1); continue; } // puntatore all'IFD EXIF
      if (!WANTED.has(tag) || type !== 2 || count > 64) continue; // solo stringhe ASCII brevi
      const at = count <= 4 ? e + 8 : u32(e + 8);
      if (at < 0 || at + count > t.length) continue;
      out.set(tag, String.fromCharCode(...t.subarray(at, at + count)).replace(/\0+$/, '').trim());
    }
  };
  readIfd(u32(4), 0);
  return out;
}

/** Data di scatto (DateTimeOriginal, altrimenti DateTime) in ISO UTC. Senza fuso nell'EXIF si assume l'ora israeliana. */
export function exifTakenAt(head: Uint8Array, now = new Date()): string | null {
  const tiff = tiffBlock(head);
  if (!tiff) return null;
  const tags = readTiffTags(tiff);
  const raw = tags.get(0x9003) || tags.get(0x0132);
  const m = raw && /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!m) return null;
  const local = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  const off = tags.get(0x9011);
  const iso = off && /^[+-]\d{2}:\d{2}$/.test(off) ? new Date(local + off).toISOString() : israelLocalToIso(local);
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t) || t < Date.UTC(1995, 0, 1) || t > now.getTime() + 86_400_000) return null; // orologio della fotocamera non plausibile
  return iso;
}
