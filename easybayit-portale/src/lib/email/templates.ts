// Template email delle notifiche, nella lingua del destinatario (HTML semplice + testo).
import { dict, isLocale, langMeta } from '../../i18n';
import { notificationText } from '../notify-text';
import type { EmailMessage } from './provider';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function renderNotificationEmail(to: string, locale: string, kind: string, params: Record<string, unknown>, siteUrl: string): EmailMessage {
  const l = isLocale(locale) ? locale : 'en';
  const t = dict(l);
  const { dir, intl } = langMeta[l];
  const line = notificationText(kind, params, t, intl);
  const link = typeof params.link === 'string' && params.link.startsWith('/') ? siteUrl.replace(/\/$/, '') + params.link : siteUrl;
  const subject = `Easybayit · ${line}`.slice(0, 180);
  const html = `<!doctype html><html lang="${l}" dir="${dir}"><body style="font-family:Arial,sans-serif;color:#0b1324;line-height:1.5">
<p style="font-size:18px;font-weight:bold;color:#1a4fd6">Easybayit</p>
<p>${esc(line)}</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#1a4fd6;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">${esc(t.common.open)}</a></p>
<p style="color:#526075;font-size:12px">${esc(t.meta.company)}<br>${esc(t.auth.noCard)}</p>
</body></html>`;
  const text = `${line}\n\n${link}\n\n${t.meta.company}`;
  return { to, subject, html, text };
}
