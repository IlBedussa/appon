// Uscita (solo POST con token CSRF, verificato dal middleware).
import type { APIRoute } from 'astro';
import { logEvent } from '../lib/audit';
import { setFlash } from '../lib/flash';

export const POST: APIRoute = async ({ locals, cookies, redirect }) => {
  if (locals.user) {
    await logEvent(locals.supabase, 'auth.logout', 'auth', locals.user.id);
    await locals.supabase.auth.signOut({ scope: 'local' });
  }
  setFlash(cookies, 'info', locals.t.auth.loggedOut);
  return redirect('/login', 303);
};
export const GET: APIRoute = ({ redirect }) => redirect('/', 303);
