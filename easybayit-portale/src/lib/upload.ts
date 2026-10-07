// Controlli sui file caricati: dimensione massima e tipo reale (firma binaria "magic bytes"),
// senza fidarsi del nome o del Content-Type dichiarato dal browser.
export type AllowedMime = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' | 'video/mp4' | 'video/webm' | 'video/quicktime';
export const EXT: Record<AllowedMime, string> = {
  'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
};
export const IMAGE_MIMES: AllowedMime[] = ['image/jpeg', 'image/png', 'image/webp'];
export const VIDEO_MIMES: AllowedMime[] = ['video/mp4', 'video/webm', 'video/quicktime'];

export function sniffMime(buf: Uint8Array): AllowedMime | null {
  const s = (o: number, sig: number[]) => sig.every((b, i) => buf[o + i] === b);
  const ascii = (o: number, n: number) => String.fromCharCode(...buf.slice(o, o + n));
  if (buf.length >= 5 && s(0, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'; // %PDF-
  if (buf.length >= 8 && s(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (buf.length >= 3 && s(0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (buf.length >= 12 && s(0, [0x52, 0x49, 0x46, 0x46]) && s(8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp';
  if (buf.length >= 4 && s(0, [0x1a, 0x45, 0xdf, 0xa3])) return 'video/webm'; // EBML (WebM/Matroska)
  if (buf.length >= 12 && ascii(4, 4) === 'ftyp') {
    // ISO BMFF: "qt  " = QuickTime (.mov), altri brand (isom, mp41, mp42, avc1, M4V…) = MP4
    return ascii(8, 4) === 'qt  ' ? 'video/quicktime' : 'video/mp4';
  }
  return null;
}

export type UploadCheck = { ok: true; mime: AllowedMime; bytes: Uint8Array; size: number } | { ok: false; reason: 'empty' | 'type' | 'size' };

/** maxBytes può dipendere dal tipo rilevato (es. foto 8 MB, video 50 MB). */
export async function checkUpload(file: File, allowed: AllowedMime[], maxBytes: number | ((m: AllowedMime) => number)): Promise<UploadCheck> {
  if (!file || file.size === 0) return { ok: false, reason: 'empty' };
  const hardMax = typeof maxBytes === 'number' ? maxBytes : Math.max(...allowed.map(maxBytes));
  if (file.size > hardMax) return { ok: false, reason: 'size' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime || !allowed.includes(mime)) return { ok: false, reason: 'type' };
  const limit = typeof maxBytes === 'number' ? maxBytes : maxBytes(mime);
  if (bytes.byteLength > limit) return { ok: false, reason: 'size' };
  return { ok: true, mime, bytes, size: bytes.byteLength };
}
