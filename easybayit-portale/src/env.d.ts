/// <reference types="astro/client" />
// Tipi dei dati condivisi tra middleware e pagine (Astro.locals).
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Dict, Locale } from './i18n';
import type { Profile } from './lib/session';
import type { FxRates } from './lib/fx';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: User | null;
      profile: Profile | null;
      aal: { current: string | null; next: string | null };
      hasMfa: boolean;
      lang: Locale;
      t: Dict;
      dir: 'ltr' | 'rtl';
      intl: string;
      csrf: string;
      flash: { type: 'success' | 'error' | 'info'; text: string } | null;
      currency: 'ILS' | 'USD' | 'EUR' | 'GBP';
      fx: FxRates | null;
      ip: string;
    }
  }
}
export {};
