// Astrazione del provider email: oggi SMTP locale (Mailpit di Supabase) o console,
// in produzione Resend (API HTTP, nessun SDK necessario). Si cambia con EMAIL_PROVIDER.
import nodemailer from 'nodemailer';
import { EMAIL_PROVIDER, EMAIL_FROM, SMTP_HOST, SMTP_PORT, RESEND_API_KEY } from 'astro:env/server';

export interface EmailMessage { to: string; subject: string; html: string; text: string }
export interface EmailProvider { name: string; send(msg: EmailMessage): Promise<void> }

class ConsoleProvider implements EmailProvider {
  name = 'console';
  async send(m: EmailMessage) { console.info(`[email:console] to=${m.to} subject=${m.subject}`); }
}

class SmtpProvider implements EmailProvider {
  name = 'smtp';
  private tx = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: false, ignoreTLS: SMTP_HOST === '127.0.0.1' || SMTP_HOST === 'localhost' });
  async send(m: EmailMessage) { await this.tx.sendMail({ from: EMAIL_FROM, to: m.to, subject: m.subject, html: m.html, text: m.text }); }
}

class ResendProvider implements EmailProvider {
  name = 'resend';
  async send(m: EmailMessage) {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [m.to], subject: m.subject, html: m.html, text: m.text }),
    });
    if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

let provider: EmailProvider | null = null;
export function emailProvider(): EmailProvider {
  if (!provider) provider = EMAIL_PROVIDER === 'smtp' ? new SmtpProvider() : EMAIL_PROVIDER === 'resend' ? new ResendProvider() : new ConsoleProvider();
  return provider;
}
