import { chromium } from 'playwright-core';
// Test automatico del popup lead (trigger, frequenza, Esc, focus trap, invio). Richiede il server su BASE_URL.
// Uso: npm run test:popup
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const b=await chromium.launch({executablePath:process.env.CHROME_PATH ?? '/usr/bin/google-chrome',args:['--no-sandbox']});
const ok=(c,m)=>{ console.log(c?'✓':'✗',m); if(!c) process.exitCode=1; };
// Desktop: exit intent
{ const c=await b.newContext({viewport:{width:1280,height:900}}); const p=await c.newPage(); await p.clock.install();
  await p.goto(`${BASE}/`); 
  const exit=()=>p.evaluate(()=>document.dispatchEvent(new MouseEvent('mouseout',{clientY:-5,relatedTarget:null,bubbles:true})));
  await p.clock.runFor(5000); await exit(); ok(!(await p.locator('dialog[data-lp][open]').count()),'desktop: niente popup prima di 10 s');
  await p.clock.runFor(6000); await exit(); ok(await p.locator('dialog[data-lp][open]').count()===1,'desktop: exit intent dopo 10 s apre');
  ok(await p.evaluate(()=>document.activeElement.id)==='lp-name','focus sul primo campo');
  for(let i=0;i<15;i++) await p.keyboard.press('Tab');
  ok(await p.evaluate(()=>!!document.activeElement.closest('dialog[data-lp]')),'focus trap (15 Tab restano nel popup)');
  await p.keyboard.press('Escape'); ok(!(await p.locator('dialog[data-lp][open]').count()),'Esc chiude');
  await p.reload(); await p.clock.runFor(12000); await exit(); ok(!(await p.locator('dialog[data-lp][open]').count()),'frequenza: non riappare entro 7 giorni');
  await p.evaluate(()=>{const s=JSON.parse(localStorage.eb_lp);s.last-=8*864e5;localStorage.eb_lp=JSON.stringify(s)});
  await p.reload(); await p.clock.runFor(12000); await exit(); ok(await p.locator('dialog[data-lp][open]').count()===1,'dopo 7 giorni riappare');
  // invio
  let payload=null; p.on('request',r=>{if(r.url().includes('/api/lead/'))payload=JSON.parse(r.postData())});
  await p.clock.runFor(3000);
  await p.click('dialog[data-lp] .lp__cta'); ok(await p.locator('#lp-name[aria-invalid=true]').count()===1,'validazione campi obbligatori');
  await p.fill('#lp-name','Test User'); await p.fill('#lp-contact','+972 50 123 4567'); await p.selectOption('#lp-city','jerusalem'); await p.selectOption('#lp-type','apartment'); await p.check('#lp-consent');
  await p.click('dialog[data-lp] .lp__cta'); await p.waitForSelector('.lp__done:not([hidden])');
  ok(payload&&payload.kind==='popup'&&['a','b'].includes(payload.variant)&&payload.trigger==='exit'&&payload.phone,'payload: '+JSON.stringify(payload));
  ok(JSON.parse(await p.evaluate(()=>localStorage.eb_lp)).done===true,'dopo l’invio: mai più');
  await c.close(); }
// Mobile: 45 s e scroll 60%
{ const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await c.newPage(); await p.clock.install();
  await p.goto(`${BASE}/pricing/`); await p.clock.runFor(44000); ok(!(await p.locator('dialog[data-lp][open]').count()),'mobile: chiuso a 44 s');
  await p.clock.runFor(2000); ok(await p.locator('dialog[data-lp][open]').count()===1,'mobile: aperto a 45 s');
  ok(await p.evaluate(()=>document.activeElement.classList.contains('lp__shell')),'mobile: nessun campo a fuoco (niente tastiera)');
  await p.click('dialog[data-lp] .lp__close'); ok(!(await p.locator('dialog[data-lp][open]').count()),'pulsante chiudi');
  await c.close();
  const c2=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p2=await c2.newPage(); await p2.clock.install();
  await p2.goto(`${BASE}/pricing/`); await p2.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight*0.7)); await p2.clock.runFor(3000);
  ok(!(await p2.locator('dialog[data-lp][open]').count()),'mobile: scroll 60% prima di 10 s → aspetta');
  await p2.clock.runFor(8000); const v=await p2.evaluate(()=>document.querySelector('dialog[data-lp]').open); ok(v,'mobile: scroll 60% → apre a 10 s');
  await c2.close(); }
await b.close();
