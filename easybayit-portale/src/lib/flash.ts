// Messaggi "flash" dopo un redirect (pattern Post/Redirect/Get), salvati in un cookie di breve durata.
import type { AstroCookies } from 'astro';
import { COOKIE_SECURE } from 'astro:env/server';

export type Flash = { type: 'success' | 'error' | 'info'; text: string };
const NAME = 'eb_flash';

export function setFlash(cookies: AstroCookies, type: Flash['type'], text: string) {
  cookies.set(NAME, encodeURIComponent(JSON.stringify({ type, text: text.slice(0, 400) })), {
    path: '/', httpOnly: true, sameSite: 'lax', secure: COOKIE_SECURE, maxAge: 60,
  });
}

export function takeFlash(cookies: AstroCookies): Flash | null {
  const raw = cookies.get(NAME)?.value;
  if (!raw) return null;
  cookies.delete(NAME, { path: '/' });
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    if (v && ['success', 'error', 'info'].includes(v.type) && typeof v.text === 'string') return v;
  } catch { /* cookie manomesso: ignorato */ }
  return null;
}
