const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://voltas.talentrecruit.com/career-page', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(6000);

  const result = await page.evaluate(() => {
    const qsa = (sel) => [...document.querySelectorAll(sel)];
    const sels = ['.card-wrap','.right-listing','.job-title','.total-jobs','[class*="card"]','[class*="job"]','app-job-card','mat-card','.mat-card','li','article'];
    const counts = {};
    for (const s of sels) counts[s] = qsa(s).length;

    const allClasses = new Set();
    qsa('*').slice(0,400).forEach(el => el.className?.toString().split(' ').forEach(c => { if(c && c.length > 2 && c.length < 40) allClasses.add(c); }));

    const textEls = qsa('*').filter(el => { const t=el.innerText?.trim(); return t && t.length>5 && t.length<120 && el.childElementCount<3; }).slice(0,30).map(el=>({ tag:el.tagName?.toLowerCase(), cls:el.className?.toString()?.slice(0,80), txt:el.innerText?.trim()?.slice(0,80) }));

    const firstJobLike = qsa('[class*="job"],[class*="card"],li,mat-card,.mat-card').filter(el=>el.innerText?.trim().length>10).slice(0,2).map(el=>({ cls:el.className?.toString(), html:el.outerHTML?.slice(0,1000) }));

    return { url:window.location.href, title:document.title, counts, allClasses:[...allClasses].slice(0,80), textEls, firstJobLike, body:document.body.innerHTML.slice(0,3000) };
  });

  console.log('\n=== SELECTOR COUNTS ===');
  for (const [s,c] of Object.entries(result.counts)) console.log(`  ${c>0?'✅':'❌'} "${s}": ${c}`);
  console.log('\n=== ALL CLASSES ===');
  console.log(result.allClasses.join(', '));
  console.log('\n=== TEXT ELEMENTS (first 30) ===');
  result.textEls.forEach((t,i)=>console.log(`  [${i}] <${t.tag} class="${t.cls}"> "${t.txt}"`));
  console.log('\n=== FIRST JOB-LIKE ELEMENTS HTML ===');
  result.firstJobLike.forEach((c,i)=>{ console.log(`\n--- [${i}] class="${c.cls}" ---`); console.log(c.html); });
  console.log('\n=== BODY HTML (first 3000 chars) ===');
  console.log(result.body);
  await browser.close();
})();
