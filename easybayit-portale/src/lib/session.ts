// Regole di accesso alle route (la vera protezione dei dati è RLS nel database).
export type Role = 'admin' | 'staff' | 'owner' | 'tenant';
export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  locale: 'en' | 'he' | 'it' | 'fr';
  preferred_currency: 'ILS' | 'USD' | 'EUR' | 'GBP';
  is_active: boolean;
}

export const isStaffRole = (r?: Role | null) => r === 'admin' || r === 'staff';

/** Pagina iniziale per ruolo. */
export const homeFor = (r?: Role | null) => (isStaffRole(r) ? '/admin' : r === 'owner' ? '/owner' : r === 'tenant' ? '/tenant' : '/login');

/** Percorsi accessibili senza login. */
export const PUBLIC_PATHS = ['/login', '/forgot-password', '/auth/confirm', '/healthz', '/lang', '/favicon.svg', '/robots.txt'];
export const isPublicPath = (p: string) =>
  PUBLIC_PATHS.includes(p) || p.startsWith('/_astro/') || p.startsWith('/api/cron/') || p.startsWith('/_image')
  // webhook autenticato dalla firma Meta; simulatore solo in sviluppo (verificato anche nel middleware)
  || p === '/api/whatsapp/webhook' || p === '/dev/whatsapp-sim' || p.startsWith('/dev/whatsapp-sim/')
  // metriche aggregate pubbliche (solo se PUBLIC_METRICS_ENABLED; altrimenti l'endpoint risponde 404)
  || p === '/api/public/sla';

/** Area riservata a un ruolo, in base al prefisso del percorso. */
export function areaAllowed(path: string, role: Role): boolean {
  if (path === '/admin' || path.startsWith('/admin/')) return isStaffRole(role);
  if (path === '/owner' || path.startsWith('/owner/')) return role === 'owner';
  if (path === '/tenant' || path.startsWith('/tenant/')) return role === 'tenant';
  return true;
}

/** Valida un percorso di ritorno interno (evita open redirect). */
export function safeNext(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\') || next.includes('://')) return fallback;
  return next;
}
