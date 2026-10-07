// Video demo del bot WhatsApp per inquilini: simulatore (sinistra) + back-office (destra), didascalie in italiano.
// Uso: npm run db:reset && npm run dev  →  node --env-file=.env scripts/whatsapp-demo-video.mjs
// Registra tre contesti reali (simulatore, staff, proprietario) e li compone con ffmpeg (hstack + sottotitoli ASS).
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { launch, cred, BASE } from './lib/browser.mjs';
import { totp } from './lib/totp.mjs';

const OUT = new URL('../demo/', import.meta.url).pathname;
const RAW = OUT + 'raw-wa/';
const FIX = new URL('./fixtures/', import.meta.url).pathname;
rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });
const LW = 520, RW = 920, H = 900, BAR = 140;
const browser = await launch();

/** contesto registrato; t0 = istante (circa) d'inizio del video. Il login avviene nel tratto iniziale, poi tagliato. */
async function recorded(key, w) {
  const dir = `${RAW}${key}/`;
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: w, height: H }, recordVideo: { dir, size: { width: w, height: H } } });
  await ctx.addCookies([{ name: 'eb_lang', value: 'en', url: BASE }]);
  const page = await ctx.newPage();
  const t0 = Date.now();
  if (key !== 'sim') {
    const c = cred(key);
    await page.goto(`${BASE}/login`);
    await page.fill('input[name=email]', c.email);
    await page.fill('input[name=password]', c.password);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]);
    if (new URL(page.url()).pathname.startsWith('/mfa')) {
      await page.fill('input[name=code]', totp(c.totpSecret));
      await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/mfa')), page.click('button[type=submit]')]);
    }
  }
  return { ctx, page, t0, dir };
}

const sim = await recorded('sim', LW);
const staff = await recorded('staff', RW);
const owner = await recorded('owner1', RW);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ring = async (page, loc) => {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  if (!b) return;
  await page.evaluate((b) => {
    const r = document.createElement('div');
    Object.assign(r.style, { position: 'fixed', left: `${b.x - 5}px`, top: `${b.y - 5}px`, width: `${b.width + 10}px`, height: `${b.height + 10}px`,
      border: '4px solid #f59e0b', borderRadius: '12px', boxShadow: '0 0 0 6px rgba(245,158,11,.25)', zIndex: '2147483646', pointerEvents: 'none' });
    document.documentElement.append(r); setTimeout(() => r.remove(), 1000);
  }, b);
  await wait(800);
};
const clickNav = async (page, loc) => { await ring(page, loc); await Promise.all([page.waitForNavigation(), loc.click()]); await page.waitForLoadState('load'); };

// ---- preparazione (fuori dal tratto utile) ----
await sim.page.goto(`${BASE}/dev/whatsapp-sim`);
await sim.page.selectOption('#from', '972500000001');
await sim.page.evaluate(() => { const n = document.querySelector('.note'); if (n) n.style.display = 'none'; });
await staff.page.goto(`${BASE}/admin/maintenance`);
await owner.page.goto(`${BASE}/owner/maintenance`);
await wait(1500);

// ---- timeline didascalie ----
const A = Date.now();
const caps = [];
let open = null;
const cap = (step, text) => { const t = Date.now() - A; if (open) open.end = t; open = { start: t, end: t, step, text }; caps.push(open); };
const marks = {};
const mark = (k) => { marks[k] = Date.now() - A; };
const shots = [];
const keyframe = (name, delay = 400) => shots.push({ t: Date.now() - A + delay, name });

// ---- simulatore ----
const sp = sim.page;
const botCount = () => sp.locator('.msg.in').count();
const waitBot = async (before) => {
  await sp.waitForFunction((n) => document.querySelectorAll('.msg.in').length > n, before, { timeout: 15000 });
  await wait(700); // eventuale secondo messaggio
};
const say = async (text) => {
  const n = await botCount();
  await sp.locator('#text').click();
  await sp.locator('#text').pressSequentially(text, { delay: 38 });
  await ring(sp, sp.locator('#send'));
  await sp.locator('#send').click();
  await waitBot(n);
};
const tap = async (id) => {
  const n = await botCount();
  const b = sp.locator(`.btns button[data-id="${id}"]`);
  await ring(sp, b);
  await b.click();
  await waitBot(n);
};
const buttons = () => sp.locator('.btns button').evaluateAll((bs) => bs.map((b) => b.dataset.id));
const lastBot = () => sp.locator('.msg.in').last().innerText();

cap('Bot WhatsApp · demo', 'Simulatore WhatsApp locale (sinistra) collegato al webhook reale con firma HMAC Meta; back-office staff (destra).');
await wait(4500);
cap('1 · Segnalazione', "L'inquilino (Tenant Alpha, TLV-01) scrive al numero aziendale: la caldaia perde acqua.");
await say('Hi, the boiler is leaking water in the bathroom');
keyframe('wa-first-message');
await wait(2500);

let photo = false, ticket = null;
for (let i = 0; i < 12 && !ticket; i++) {
  const ids = await buttons();
  const txt = await lastBot();
  const m = /R-\d+/.exec(txt);
  if (m) { ticket = m[0]; break; }
  if (ids.some((x) => x.startsWith('prop:'))) { cap('1 · Segnalazione', "Il bot chiede per quale immobile è la segnalazione."); await wait(1500); await tap(ids.find((x) => x.startsWith('prop:'))); }
  else if (ids.some((x) => x.startsWith('cat:'))) { cap('2 · Triage', 'Il bot propone le categorie: riscaldamento / acqua calda.'); await wait(1500); await tap(ids.includes('cat:heating_ac') ? 'cat:heating_ac' : ids[0]); }
  else if (ids.includes('media:skip') && !photo) {
    cap('2 · Foto', 'Categoria e descrizione riconosciute dal primo messaggio. Il bot chiede foto o video: l\'inquilino allega una foto.');
    await wait(2500);
    const n = await botCount();
    await ring(sp, sp.locator('#attach'));
    await sp.setInputFiles('#file', FIX + 'heater-1.png');
    await waitBot(n);
    photo = true;
    keyframe('wa-photo');
    await wait(2200);
  }
  else if (ids.includes('media:done')) { await tap('media:done'); }
  else if (ids.some((x) => x.startsWith('urg:'))) { cap('2 · Triage urgenza', "Triage: il bot chiede se c'è un rischio immediato (acqua che si allarga, danni)."); await wait(2500); await tap('urg:yes'); }
  else if (ids.some((x) => x.startsWith('avail:'))) { cap('2 · Disponibilità', 'Il bot chiede quando il tecnico può accedere: pomeriggio.'); await wait(2300); await tap('avail:afternoon'); }
  else if (ids.some((x) => x.startsWith('confirm:'))) { cap('3 · Conferma', 'Riepilogo: immobile, categoria, urgenza, disponibilità, 1 foto. L\'inquilino conferma.'); keyframe('wa-summary'); await wait(3500); await tap('confirm:yes'); }
  else { await say('Water is dripping from the bottom of the boiler since this morning'); }
}
if (!ticket) { const m = /R-\d+/.exec(await lastBot()); ticket = m?.[0]; }
if (!ticket) throw new Error('ticket non creato');
cap('3 · Ticket creato', `Richiesta ${ticket} creata nel portale: l'inquilino riceve subito il numero di ticket.`);
keyframe('wa-ticket');
await wait(4000);

// ---- staff ----
const stp = staff.page;
cap('4 · Back-office staff', `Lo staff (con 2FA) aggiorna la coda manutenzione: ${ticket} è in cima, priorità urgente, badge "via WhatsApp".`);
await stp.reload(); await stp.waitForLoadState('load');
const ref = ticket.slice(2);
const row = stp.locator(`a[href^="/admin/maintenance/"]`, { hasText: new RegExp(`(R-)?${ref}\\b`) }).first();
const rowFallback = stp.locator('a[href^="/admin/maintenance/"]').filter({ has: stp.locator('[data-testid=src-whatsapp]') }).first();
const target = (await row.count()) ? row : rowFallback;
await wait(1200);
await ring(stp, stp.locator('[data-testid=src-whatsapp]').first());
keyframe('staff-queue');
await wait(2500);
await clickNav(stp, target);
cap('4 · Back-office staff', 'Dettaglio: descrizione, disponibilità, foto inviata in chat già allegata alla richiesta.');
await wait(1500);
const ph = stp.locator('img[src^="/files/photo/"]').first();
if (await ph.count()) await ph.evaluate((e) => e.scrollIntoView({ behavior: 'smooth', block: 'center' }));
keyframe('staff-detail', 2200);
await wait(3500);
await stp.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ---- proprietario ----
mark('B');
const op = owner.page;
cap('5 · Proprietario', `Il proprietario (Dana Demo-Levi) vede la stessa richiesta nel suo portale, con origine "via WhatsApp".`);
await op.reload(); await op.waitForLoadState('load');
await wait(1200);
const ob = op.locator('[data-testid=src-whatsapp]').first();
await ring(op, ob);
keyframe('owner-list');
await wait(2000);
const orow = op.locator('a[href^="/owner/maintenance/"]').filter({ has: ob }).first();
await clickNav(op, (await orow.count()) ? orow : op.locator('a[href^="/owner/maintenance/"]').first());
await wait(2000);
keyframe('owner-detail', 0); // prima del ritorno al back-office staff (segmento successivo)
await wait(1500);
mark('C');

// ---- staff aggiorna lo stato -> messaggio in chat ----
cap('6 · Aggiornamento stato', 'Lo staff programma il tecnico per domani e salva.');
const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
await stp.locator('select[name=status]').scrollIntoViewIfNeeded();
await ring(stp, stp.locator('select[name=status]'));
await stp.selectOption('select[name=status]', 'scheduled');
await wait(700);
await stp.fill('input[name=scheduled_for]', tomorrow);
await wait(700);
const nBefore = await botCount();
await clickNav(stp, stp.locator('form:has(input[name=action][value=status]) button[type=submit]'));
cap('6 · Aggiornamento stato', "Il cambio di stato genera una notifica nella stessa chat WhatsApp dell'inquilino, nella sua lingua.");
await sp.waitForFunction((n) => document.querySelectorAll('.msg.in').length > n, nBefore, { timeout: 15000 });
await wait(600);
keyframe('wa-status-update', 1200);
await ring(sp, sp.locator('.msg.in').last());
await wait(4000);
cap('Fine', 'Bot WhatsApp: segnalazione guidata, triage, foto, ticket immediato e aggiornamenti in chat. Dati fittizi, ambiente locale.');
await wait(4000);
const D = Date.now() - A;
open.end = D;

// ---- chiusura e composizione ----
const vids = {};
for (const r of [sim, staff, owner]) { const p = await r.page.video().path(); await r.ctx.close(); vids[r.dir] = p; }
await browser.close();
const off = (r) => (A - r.t0) / 1000;
const s = (ms) => (ms / 1000).toFixed(3);
const ts = (ms) => { const t = Math.max(0, ms) / 1000; const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = (t % 60).toFixed(2).padStart(5, '0'); return `${h}:${String(m).padStart(2, '0')}:${sec}`; };
const esc = (x) => x.replace(/[{}]/g, '').replace(/\n/g, '\\N');
const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1440
PlayResY: ${H + BAR}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,30,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,7,60,60,${H + 22},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${caps.map((c) => `Dialogue: 0,${ts(c.start)},${ts(c.end)},Cap,,0,0,0,,{\\fs19\\c&H00D4EA5E&}${esc(c.step.toUpperCase())}\\N{\\fs29\\c&H00FFFFFF&}${esc(c.text)}`).join('\n')}
`;
writeFileSync(RAW + 'captions.ass', ass);
const seg = (i, a, b, w) => `[${i}:v]trim=start=${a.toFixed(3)}:end=${b.toFixed(3)},setpts=PTS-STARTPTS,fps=25,scale=${w}:${H}`;
const fc = [
  `${seg(0, off(sim), off(sim) + D / 1000, LW)}[L]`,
  `${seg(1, off(staff), off(staff) + marks.B / 1000, RW)}[r1]`,
  `${seg(2, off(owner) + marks.B / 1000, off(owner) + marks.C / 1000, RW)}[r2]`,
  `${seg(1, off(staff) + marks.C / 1000, off(staff) + D / 1000, RW)}[r3]`,
  `[r1][r2][r3]concat=n=3:v=1:a=0[R]`,
  `[L][R]hstack=inputs=2,pad=1440:${H + BAR}:0:0:color=0x0b1324,subtitles=${RAW}captions.ass[v]`,
].join(';');
const out = OUT + 'whatsapp-bot-demo.mp4';
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vids[sim.dir], '-i', vids[staff.dir], '-i', vids[owner.dir], '-filter_complex', fc, '-map', '[v]',
  '-c:v', 'libx264', '-crf', '22', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
for (const f of readdirSync(OUT)) if (f.startsWith('wa-keyframe-')) rmSync(OUT + f);
shots.forEach((k, i) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', s(k.t), '-i', out, '-frames:v', '1', `${OUT}wa-keyframe-${String(i + 1).padStart(2, '0')}-${k.name}.png`]));
console.log(JSON.stringify({ out, seconds: D / 1000, ticket, marks, caps: caps.length, keyframes: shots.map((k) => k.name) }));
