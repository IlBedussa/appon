import { chromium } from 'playwright-core';
// Screenshot del popup lead (varianti A/B, 4 lingue, desktop/tablet/mobile) in screenshots/. Server su BASE_URL.
const out='screenshots'; const BASE=process.env.BASE_URL ?? 'http://localhost:4321';
const list=[['en','/',1280,'a'],['he','/he/',1280,'a'],['fr','/fr/',1280,'a'],['it','/it/',1280,'a'],['en','/',1280,'b'],['en','/',390,'a'],['he','/he/',390,'a'],['en','/',390,'b'],['it','/it/',390,'a'],['en','/',768,'a'],['en','/',1440,'a'],['he','/he/',1280,'b'],['fr','/fr/',1280,'b'],['it','/it/',1280,'b'],['fr','/fr/',390,'a']];
const b=await chromium.launch({executablePath:process.env.CHROME_PATH ?? '/usr/bin/google-chrome',args:['--no-sandbox']});
for(const [l,p,w,v] of list){
  const c=await b.newContext({viewport:{width:w,height:w<500?844:900},deviceScaleFactor:w<500?2:1,reducedMotion:'reduce',hasTouch:w<1024,isMobile:w<500});
  const pg=await c.newPage(); await pg.goto(`${BASE}${p}?popup=${v}`,{waitUntil:'networkidle'});
  await pg.waitForSelector('dialog[data-lp][open]'); await pg.evaluate(()=>document.fonts.ready); await pg.waitForTimeout(300);
  const f=`${out}/${l}-popup-${v.toUpperCase()}-${w<500?'mobile':w<1000?'tablet':'desktop'}${w===1440?'-1440':''}.png`;
  await pg.screenshot({path:f}); console.log(f); await c.close();
}
await b.close();
