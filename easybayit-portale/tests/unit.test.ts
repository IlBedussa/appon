// Test unitari: controllo file, TOTP, CSV, redirect sicuri, CSRF, validazione, cambi BOI, SLA, i18n.
import { describe, it, expect } from 'vitest';
import { sniffMime, checkUpload } from '../src/lib/upload';
import { parseCsv, csvObjects, csvSafe } from '../src/lib/csv';
import { safeNext, areaAllowed, isPublicPath } from '../src/lib/session';
import { tokensMatch } from '../src/lib/csrf';
import { password, money } from '../src/lib/validation';
import { parseBoiCsv } from '../src/lib/fx';
import { median, duration } from '../src/lib/sla';
import { visualRuns } from '../src/lib/bidi';
import en from '../src/i18n/en';
import he from '../src/i18n/he';
import it_ from '../src/i18n/it';
import fr from '../src/i18n/fr';
import { totp } from '../scripts/lib/totp.mjs';

const bytes = (...a: (number | string)[]) => new Uint8Array(a.flatMap((x) => (typeof x === 'string' ? [...x].map((c) => c.charCodeAt(0)) : [x])));

describe('upload: tipo reale dai magic bytes', () => {
  it('riconosce PDF, immagini e video', () => {
    expect(sniffMime(bytes('%PDF-1.7'))).toBe('application/pdf');
    expect(sniffMime(bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png');
    expect(sniffMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(sniffMime(bytes('RIFF', 0, 0, 0, 0, 'WEBP'))).toBe('image/webp');
    expect(sniffMime(bytes(0, 0, 0, 0x20, 'ftypisom'))).toBe('video/mp4');
    expect(sniffMime(bytes(0, 0, 0, 0x14, 'ftypqt  '))).toBe('video/quicktime');
    expect(sniffMime(bytes(0x1a, 0x45, 0xdf, 0xa3))).toBe('video/webm');
  });
  it('rifiuta eseguibili/HTML anche se rinominati', async () => {
    expect(sniffMime(bytes('MZ', 0x90, 0))).toBeNull();
    const f = new File([bytes('<html><script>')], 'photo.jpg', { type: 'image/jpeg' });
    expect(await checkUpload(f, ['image/jpeg'], 1000)).toEqual({ ok: false, reason: 'type' });
  });
  it('limite di dimensione per tipo (foto 8 MB, video 50 MB)', async () => {
    const big = new Uint8Array(9 * 1024 * 1024); big.set([0xff, 0xd8, 0xff]);
    const lim = (m: string) => (m.startsWith('video/') ? 50 : 8) * 1024 * 1024;
    expect(await checkUpload(new File([big], 'a.jpg'), ['image/jpeg', 'video/mp4'], lim)).toEqual({ ok: false, reason: 'size' });
    const vid = new Uint8Array(9 * 1024 * 1024); vid.set(bytes(0, 0, 0, 0x20, 'ftypmp42'));
    expect((await checkUpload(new File([vid], 'v.mp4'), ['image/jpeg', 'video/mp4'], lim)).ok).toBe(true);
  });
});

describe('TOTP (RFC 6238)', () => {
  it('vettore di test SHA-1', () => {
    // segreto "12345678901234567890" in base32, T=59s -> 94287082 (8 cifre) -> 287082 (6 cifre)
    expect(totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000)).toBe('287082');
  });
});

describe('CSV', () => {
  it('virgolette, separatori e righe vuote', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n\n')).toEqual([['a', 'b'], ['x, y', 'say "hi"']]);
    expect(csvObjects('Paid_On,amount_ils\n2026-09-01,7200')).toEqual([{ paid_on: '2026-09-01', amount_ils: '7200' }]);
  });
  it('neutralizza formule (CSV injection)', () => {
    expect(csvSafe('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`);
    expect(csvSafe('Rent')).toBe('Rent');
  });
});

describe('sessione e sicurezza', () => {
  it('safeNext blocca open redirect', () => {
    expect(safeNext('/owner/statements')).toBe('/owner/statements');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext('/\\evil.com')).toBe('/');
  });
  it('aree per ruolo', () => {
    expect(areaAllowed('/admin/users', 'owner')).toBe(false);
    expect(areaAllowed('/owner', 'tenant')).toBe(false);
    expect(areaAllowed('/tenant/requests', 'tenant')).toBe(true);
    expect(areaAllowed('/admin', 'staff')).toBe(true);
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/admin')).toBe(false);
  });
  it('confronto token CSRF a tempo costante', () => {
    expect(tokensMatch('abc', 'abc')).toBe(true);
    expect(tokensMatch('abc', 'abd')).toBe(false);
    expect(tokensMatch('', '')).toBe(false);
    expect(tokensMatch(null, 'x')).toBe(false);
  });
  it('policy password e importi', () => {
    expect(password.safeParse('short1A').success).toBe(false);
    expect(password.safeParse('alllowercase123').success).toBe(false);
    expect(password.safeParse('Good-Password-2026').success).toBe(true);
    expect(money.safeParse('1,234.50').success || money.safeParse('1234.50').success).toBe(true);
    expect(money.safeParse('abc').success).toBe(false);
  });
});

describe('cambi Banca d’Israele', () => {
  it('legge USD, EUR e GBP dal CSV SDMX', () => {
    const csv = 'SERIES_CODE,TIME_PERIOD,OBS_VALUE\nRER_USD_ILS,2026-09-30,3.712\nRER_EUR_ILS,2026-09-30,4.051\nRER_GBP_ILS,2026-09-30,4.876\nRER_JPY_ILS,2026-09-30,2.5';
    const r = parseBoiCsv(csv);
    expect(r.map((x) => x.currency).sort()).toEqual(['EUR', 'GBP', 'USD']);
    expect(r.find((x) => x.currency === 'GBP')!.rate).toBeCloseTo(4.876);
  });
});

describe('SLA', () => {
  it('mediana e durata leggibile', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
    expect(duration(5.25, en.pri, 'en-US')).toBe('5.3 h');
    expect(duration(72, en.pri, 'en-US')).toBe('3 d');
    expect(duration(72, fr.pri, 'fr-FR')).toBe('3 j');
  });
});

describe('bidi PDF', () => {
  it('testo ebraico con numeri: i numeri restano LTR', () => {
    const runs = visualRuns('שכירות 7,200', true);
    expect(runs.map((r) => r.text).join('')).toContain('7,200');
  });
});

describe('i18n: 4 lingue complete', () => {
  const flat = (o: any, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
  const keys = flat(en).sort();
  for (const [name, d] of Object.entries({ he, it: it_, fr })) {
    it(`${name}: stesse chiavi di en, nessun testo vuoto`, () => {
      const k = flat(d);
      const missing = keys.filter((x) => !k.includes(x) && !x.startsWith('sec.actions.'));
      expect(missing).toEqual([]);
      const get = (path: string) => path.split('.').reduce((o: any, s) => o?.[s], d);
      expect(k.filter((x) => String(get(x)).trim() === '')).toEqual([]);
    });
  }
});
