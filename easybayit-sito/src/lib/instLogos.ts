// Loghi delle istituzioni israeliane: SOLO con SHOW_TEST_LOGOS=1 (test locale, vedi src/config/flags.ts).
// Restituisce data URI letti dal disco a build-time; a flag spento restituisce null e nessun file finisce in dist/.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SHOW_TEST_LOGOS } from '../config/flags';

const files = {
  ica: ['israel-corporations-authority.png', 'image/png', 'Israel Corporations Authority'],
  ita: ['israel-tax-authority.svg', 'image/svg+xml', 'Israel Tax Authority'],
  ppa: ['privacy-protection-authority.svg', 'image/svg+xml', 'Privacy Protection Authority'],
  cbs: ['central-bureau-of-statistics.png', 'image/png', 'Central Bureau of Statistics'],
} as const;
export type InstKey = keyof typeof files;

export function instLogo(k: InstKey): { src: string; alt: string } | null {
  if (!SHOW_TEST_LOGOS) return null;
  const [f, mime, alt] = files[k];
  const src = `data:${mime};base64,${readFileSync(join(process.cwd(), 'test-assets', 'authority-logos', f)).toString('base64')}`;
  return { src, alt };
}
