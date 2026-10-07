// Link dalle email di Supabase (invito, reset password): verifica il token_hash e crea la sessione.
import type { APIRoute } from 'astro';
import { setFlash } from '../../lib/flash';
import { safeNext } from '../../lib/session';

const TYPES = ['recovery', 'invite', 'email', 'magiclink'] as const;
type OtpType = (typeof TYPES)[number];

export const GET: APIRoute = async ({ url, locals, cookies, redirect }) => {
  const tokenHash = url.searchParams.get('token_hash') ?? '';
  const type = url.searchParams.get('type') as OtpType;
  const next = safeNext(url.searchParams.get('next'), '/set-password');
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(tokenHash) || !TYPES.includes(type)) {
    setFlash(cookies, 'error', locals.t.auth.linkInvalid);
    return redirect('/login', 303);
  }
  const { error } = await locals.supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    setFlash(cookies, 'error', locals.t.auth.linkInvalid);
    return redirect('/forgot-password', 303);
  }
  return redirect(next, 303);
};
