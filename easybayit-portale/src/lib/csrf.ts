// Protezione CSRF "double submit" con cookie HttpOnly: il server inserisce il token nei form
// (campo nascosto _csrf o header x-csrf-token) e lo confronta con il cookie a ogni POST.
// Si aggiunge al controllo dell'header Origin già fatto da Astro (security.checkOrigin).
import { randomBytes, timingSafeEqual } from 'node:crypto';

export const csrfCookieName = (secure: boolean) => (secure ? '__Host-eb_csrf' : 'eb_csrf');
export const newCsrfToken = () => randomBytes(32).toString('base64url');

export function tokensMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
