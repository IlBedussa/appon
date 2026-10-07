// Registra il video demo end-to-end (azioni reali sul portale locale) con didascalie in italiano.
// Uso: npm run db:reset && npm run dev  →  node --env-file=.env scripts/demo-video.mjs
import { mkdirSync, readdirSync, renameSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { launch, cred, BASE } from './lib/browser.mjs';
import { totp } from './lib/totp.mjs';

const OUT = new URL('../demo/', import.meta.url).pathname;
const RAW = OUT + 'raw/';
rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });
const W = 1440, H = 900;
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: RAW, size: { width: W, height: H } }, acceptDownloads: true });
await ctx.addCookies([{ name: 'eb_lang', value: 'en', url: BASE }]);
const page = await ctx.newPage();
const hold = (ms) => page.waitForTimeout(ms);

// ---- didascalia + indicatore di passo (DOM via CSSOM, compatibile con la CSP) ----
let cur = { step: '', text: '' };
const paint = async () => {
  await page.evaluate(({ step, text }) => {
    let b = document.getElementById('demo-cap');
    if (!b) {
      b = document.createElement('div'); b.id = 'demo-cap';
      Object.assign(b.style, { position: 'fixed', left: '50%', bottom: '28px', transform: 'translateX(-50%)', maxWidth: '1100px', width: 'calc(100% - 120px)',
        background: 'rgba(11,19,36,.92)', color: '#fff', font: '600 24px/1.4 system-ui, sans-serif', padding: '16px 26px', borderRadius: '14px',
        boxShadow: '0 10px 30px rgba(0,0,0,.35)', zIndex: '2147483647', direction: 'ltr', textAlign: 'left', pointerEvents: 'none' });
      const s = document.createElement('div'); s.id = 'demo-step';
      Object.assign(s.style, { font: '700 14px/1 system-ui, sans-serif', letterSpacing: '.08em', textTransform: 'uppercase', color: '#5eead4', marginBottom: '8px' });
      const t = document.createElement('div'); t.id = 'demo-txt';
      b.append(s, t); document.documentElement.append(b);
    }
    document.getElementById('demo-step').textContent = step;
    document.getElementById('demo-txt').textContent = text;
    b.style.display = text ? 'block' : 'none';
  }, cur).catch(() => {});
};
page.on('load', () => paint());
const cap = async (step, text, ms = 3500) => { cur = { step, text }; await paint(); await hold(ms); };

// evidenzia l'elemento prima del clic (il video non mostra il puntatore)
const ring = async (loc) => {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  if (!b) return;
  await page.evaluate((b) => {
    const r = document.createElement('div');
    Object.assign(r.style, { position: 'fixed', left: `${b.x - 6}px`, top: `${b.y - 6}px`, width: `${b.width + 12}px`, height: `${b.height + 12}px`,
      border: '4px solid #f59e0b', borderRadius: '12px', boxShadow: '0 0 0 6px rgba(245,158,11,.25)', zIndex: '2147483646', pointerEvents: 'none' });
    document.documentElement.append(r); setTimeout(() => r.remove(), 900);
  }, b);
  await hold(800);
};
const click = async (sel, nav = true) => {
  const loc = typeof sel === 'string' ? page.locator(sel).first() : sel;
  await ring(loc);
  if (nav) await Promise.all([page.waitForLoadState('load'), page.waitForNavigation(), loc.click()]);
  else await loc.click();
};
const type = async (sel, text, delay = 45) => { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await l.click(); await l.pressSequentially(text, { delay }); };
const go = async (path) => { await page.goto(BASE + path); await page.waitForLoadState('load'); };
const smoothTo = async (sel) => { await page.locator(sel).first().evaluate((e) => e.scrollIntoView({ behavior: 'smooth', block: 'center' })); await hold(900); };
const top = async () => { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await hold(700); };
let frame = 0;
const keyframe = async (name) => { frame++; await page.screenshot({ path: `${OUT}keyframe-${String(frame).padStart(2, '0')}-${name}.png` }); };
const login = async (key, { mfaSlow = false } = {}) => {
  const c = cred(key);
  await go('/login');
  await paint();
  await type('input[name=email]', c.email, 35);
  await type('input[name=password]', c.password, 25);
  await click('button[type=submit]');
  if (new URL(page.url()).pathname.startsWith('/mfa')) {
    if (mfaSlow) await cap('2 · Staff', "Lo staff ha la 2FA obbligatoria: inserisce il codice a 6 cifre generato dall'app di autenticazione (TOTP).", 3500);
    await type('input[name=code]', totp(c.totpSecret), 180);
    if (mfaSlow) await keyframe('staff-2fa');
    await click('button[type=submit]');
  }
};
const logout = async () => { await click('form[action="/logout"] button'); };

// ============================ INTRO ============================
await go('/login');
await cap('Easybayit · demo', 'Demo end-to-end sul portale reale in esecuzione in locale: azioni vere, database Supabase locale, dati fittizi.', 4500);

// ============================ 1. INQUILINO ============================
await cap('1 · Inquilino', "L'inquilino (Tenant Alpha, interfaccia in inglese) accede con email e password.", 2500);
await login('tenant1');
await cap('1 · Inquilino', 'Cruscotto inquilino: contratto, giorni alla scadenza, richieste di manutenzione.', 3200);
await click('a[href="/tenant/requests/new"]');
await cap('1 · Inquilino', 'Apre una nuova richiesta di manutenzione: titolo, urgenza, descrizione…', 2500);
await type('input[name=title]', 'Bathroom extractor fan broken');
await page.selectOption('select[name=priority]', 'urgent'); await hold(500);
await type('textarea[name=description]', 'The fan stopped working and makes a burning smell. Photo and short video attached.', 22);
await cap('1 · Inquilino', '…e allega una foto e un breve video (controllo reale del tipo di file e della dimensione lato server).', 1500);
await page.setInputFiles('input[name=photos]', ['scripts/fixtures/heater-1.png', 'scripts/fixtures/demo-leak.mp4']);
await ring(page.locator('input[name=photos]'));
await hold(1500);
await click('[data-testid=request-form] button[type=submit]');
const reqUrl = new URL(page.url()).pathname;
const reqId = reqUrl.split('/').pop();
await cap('1 · Inquilino', 'Richiesta creata: stato «Segnalata», foto e video salvati nello storage privato. Lo staff riceve una notifica.', 3000);
await smoothTo('[data-testid=media-grid]');
await keyframe('tenant-request-photo-video');
await hold(1500);
await top();
await logout();

// ============================ 2. STAFF ============================
await cap('2 · Staff', 'Ora entra un membro dello staff Easybayit.', 2000);
await login('staff', { mfaSlow: true });
await go('/lang?l=en&next=/admin');
await cap('2 · Staff', 'Back-office: la nuova richiesta compare tra le richieste aperte.', 3000);
await go('/admin/maintenance');
await paint();
await ring(page.locator(`a[href="/admin/maintenance/${reqId}"]`).first());
await click(`a[href="/admin/maintenance/${reqId}"]`);
await cap('2 · Staff', 'Lo staff prende in carico la richiesta: passando a «In verifica» viene registrato il tempo di prima risposta.', 3000);
await page.selectOption('form:has(input[value=status]) select[name=status]', 'in_review'); await hold(600);
await click('form:has(input[value=status]) button[type=submit]');
await cap('2 · Staff', 'Stato aggiornato, evento in timeline e notifica all’inquilino e al proprietario.', 2500);
await smoothTo('form:has(input[value=quote])');
await cap('2 · Staff', 'Inserisce il preventivo del fornitore: 2.419 ₪, sopra la soglia di approvazione della proprietaria (1.500 ₪).', 2000);
await type('form:has(input[value=quote]) input[name=supplier]', 'Demo Electric Ltd (fictional)', 30);
await type('form:has(input[value=quote]) textarea[name=items]', 'Labour; 900\nNew extractor fan; 1150\nVAT 18%; 369', 30);
await click('form:has(input[value=quote]) button[type=submit]');
await smoothTo('.q-rule');
await cap('2 · Staff', 'Sopra soglia → la richiesta passa a «In attesa di approvazione» e la proprietaria viene avvisata (in-app + email).', 3500);
await keyframe('staff-quote-above-threshold');
await top();
await logout();

// ============================ 3. PROPRIETARIA ============================
await cap('3 · Proprietaria', 'La proprietaria (Dana Demo-Levi, vive all’estero) accede al portale.', 2000);
await login('owner1');
await cap('3 · Proprietaria', 'Cruscotto: affitti incassati, occupazione, tempi di intervento, scadenze. La campanella segnala le novità.', 3200);
await click('a[href="/notifications"]');
await cap('3 · Proprietaria', 'Notifica: c’è un preventivo in attesa della sua approvazione.', 2800);
await click(page.locator(`form:has(input[name=link][value="/owner/maintenance/${reqId}"]) button`).first());
await cap('3 · Proprietaria', 'Vede la richiesta con foto e video dell’inquilino, la timeline e il preventivo dettagliato.', 2500);
await smoothTo('[data-testid=media-grid]');
await page.locator('[data-testid=media-grid] video').evaluate((v) => { v.muted = true; return v.play(); }).catch(() => {});
await hold(3000);
await top();
await cap('3 · Proprietaria', 'Cambia la valuta di visualizzazione: USD… (cambio ufficiale Banca d’Israele)', 1200);
await click('a[href^="/lang?cur=USD"]');
await paint(); await hold(2200);
await cap('3 · Proprietaria', '…ed EUR. La contabilità resta in shekel.', 1200);
await click('a[href^="/lang?cur=EUR"]');
await keyframe('owner-quote-eur');
await hold(1500);
await cap('3 · Proprietaria', 'Approva il preventivo con un solo clic. La decisione viene registrata con data, ora e utente.', 2500);
await click('[data-testid=approve-quote]');
await cap('3 · Proprietaria', 'Preventivo approvato: lo staff viene avvisato e programma il tecnico.', 3200);
await click('a[href^="/lang?cur=ILS"]');
await logout();

// ============================ 4. STAFF: CHIUSURA + SLA ============================
await cap('4 · Staff', 'Lo staff rientra (di nuovo con 2FA) e trova l’approvazione della proprietaria.', 1500);
await login('staff');
await go(`/admin/maintenance/${reqId}`);
await cap('4 · Staff', 'Preventivo «Approvato». Programma l’intervento del tecnico…', 2200);
await page.selectOption('form:has(input[value=status]) select[name=status]', 'scheduled');
const d = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
await page.fill('form:has(input[value=status]) input[name=scheduled_for]', d); await hold(800);
await click('form:has(input[value=status]) button[type=submit]');
await cap('4 · Staff', '…e a lavoro finito chiude la richiesta: viene registrato il tempo di risoluzione.', 2000);
await page.selectOption('form:has(input[value=status]) select[name=status]', 'closed'); await hold(600);
await click('form:has(input[value=status]) button[type=submit]');
await smoothTo('.timeline, ol, .event-list');
await hold(1800);
await go('/admin/metrics');
await cap('4 · Staff', 'Metriche di servizio aggiornate: prima risposta e risoluzione misurate dai timestamp, aggregati pronti per il sito.', 4000);
await keyframe('admin-sla-metrics');
await logout();

// ============================ 5. PROPRIETARIA: RENDICONTO + SCADENZE ============================
await login('owner1');
await cap('5 · Proprietaria', 'La proprietaria apre l’ultimo rendiconto mensile pubblicato.', 1500);
await click('a[href="/owner/statements"]');
await click(page.locator('main a[href^="/owner/statements/"]').first());
await cap('5 · Proprietaria', 'Entrate, spese e netto del mese, riga per riga.', 3000);
const dl = page.locator('a[href$="/pdf"]').first();
await ring(dl);
// il PDF viene servito inline: lo si scarica con la stessa sessione del browser
const pdfRes = await ctx.request.get(new URL(await dl.getAttribute('href'), BASE).href);
if (pdfRes.headers()['content-type'] !== 'application/pdf') throw new Error('PDF non ricevuto');
const pdfPath = RAW + 'statement.pdf';
writeFileSync(pdfPath, await pdfRes.body());
execFileSync('pdftoppm', ['-png', '-r', '70', '-f', '1', '-l', '1', pdfPath, RAW + 'stmt']);
const png = readdirSync(RAW).find((f) => f.startsWith('stmt') && f.endsWith('.png'));
const b64 = readFileSync(RAW + png).toString('base64');
const back = page.url();
await page.setContent(`<html><body style="margin:0;background:#334155;display:flex;justify-content:center;align-items:flex-start;padding-top:24px"><img src="data:image/png;base64,${b64}" style="height:760px;box-shadow:0 10px 40px rgba(0,0,0,.5)"></body></html>`);
await cap('5 · Proprietaria', 'Il PDF generato dal server è stato scaricato: ecco la prima pagina del file reale.', 4000);
await keyframe('statement-pdf');
await page.goto(back);
await go('/owner');
await smoothTo('[data-testid=expiries-widget]');
await cap('5 · Proprietaria', 'Archivio documenti: scadenze in arrivo (controllo gas scaduto, assicurazione, fine contratto) con promemoria automatici.', 4200);

// ============================ 6. EBRAICO RTL ============================
await go('/lang?l=he&next=/owner');
await cap('6 · Lingue', 'Stessa area in ebraico, con layout da destra a sinistra (disponibili anche inglese, italiano e francese).', 4500);
await keyframe('owner-hebrew-rtl');
await go('/lang?l=en&next=/owner');

// ============================ 7. CARTELLO FINALE ============================
cur = { step: '', text: '' };
await page.setContent(`<html><body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0b1324,#1d4ed8);color:#fff;font-family:system-ui,sans-serif;text-align:center">
  <div style="font-size:64px;font-weight:800;letter-spacing:-.02em">Easy<span style="color:#5eead4">bayit</span></div>
  <div style="font-size:34px;font-weight:600;margin-top:18px">portale funzionante</div>
  <div style="font-size:22px;opacity:.8;margin-top:14px">demo locale, dati fittizi</div></body></html>`);
await hold(4500);

const video = page.video();
await ctx.close();
const webm = await video.path();
await browser.close();
renameSync(webm, RAW + 'demo.webm');
console.log('raw video:', RAW + 'demo.webm');
