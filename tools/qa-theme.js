const { _electron: electron } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
function luminance(rgb) { const [r,g,b]=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b; }
function contrast(a,b) { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
(async()=>{
  const userData=await fs.mkdtemp(require('./test-env').tempPrefix('ember-theme-'));
  const options={args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:userData},timeout:60000};
  let app=await electron.launch(options);
  const out=path.join(__dirname,'..','..','Anteprime');await fs.mkdir(out,{recursive:true});
  try{
    let page=await app.firstWindow();page.setDefaultTimeout(30000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.getByRole('heading',{name:'Bentornato nel tuo spazio.'}).waitFor();
    if(await page.locator('.avatar').count())throw new Error('Avatar E non rimosso');
    if(await page.locator('#theme-toggle svg').count()!==2)throw new Error('Icone sole e luna mancanti');
    if(await page.locator('#theme-toggle').getAttribute('aria-checked')!=='false')throw new Error('Tema iniziale non scuro');
    await page.getByRole('switch',{name:'Modalità chiara'}).click();
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    if(await app.evaluate(({nativeTheme})=>nativeTheme.themeSource)!=='light')throw new Error('Tema nativo non sincronizzato');
    const checked=[];
    async function check(selector,background=[240,232,246]){
      const value=await page.locator(selector).first().evaluate(el=>getComputedStyle(el).color);
      const rgb=value.match(/\d+/g).slice(0,3).map(Number),ratio=contrast(rgb,background);
      if(ratio<4.5)throw new Error(`${selector}: contrasto chiaro ${ratio.toFixed(2)}:1`);
      checked.push(`${selector} ${ratio.toFixed(2)}:1`);
    }
    for(const s of ['.page-heading p','.stat-bottom','.local-badge small','.sidebar-heading','.bottom-note','.template-row small'])await check(s);
    await check('.hero p',[245,229,237]);
    await page.screenshot({path:path.join(out,'08-tema-chiaro.png'),animations:'disabled'});
    await page.locator('.topbar [data-action="create"]').click();
    await page.locator('#wizard-version option[value="1.21.1"]').waitFor({state:'attached'});
    for(const s of ['.type-option small','.field small','.modal-footer > span','.type-description'])await check(s);
    await page.screenshot({path:path.join(out,'09-creazione-chiara.png'),animations:'disabled'});
    await page.getByRole('button',{name:'Continua',exact:true}).click();
    if(await page.locator('#f-port').evaluate(el=>getComputedStyle(el).colorScheme)!=='light')throw new Error('Controlli non in modalità chiara');
    await page.getByRole('button',{name:'Continua',exact:true}).click();await check('.notice.info');await check('.eula-check');
    await page.locator('[data-action="close-wizard"]').first().click();
    await page.locator('.navigation [data-nav="guide"]').click();for(const s of ['.guide-card p','.guide-card code','.guide-hero p'])await check(s);
    await page.locator('.sidebar-bottom [data-nav="settings"]').click();for(const s of ['.panel p','.key-value strong','.hint'])await check(s);
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1100,730));
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Overflow finestra minima');
    const invalid=await page.evaluate(async()=>{try{await window.ember.call('setTheme','invalid');return false;}catch{return true;}});if(!invalid)throw new Error('Tema non valido accettato');
    if(errors.length)throw new Error(errors.join('\n'));
    await app.close();app=await electron.launch(options);page=await app.firstWindow();
    await page.getByRole('heading',{name:'Bentornato nel tuo spazio.'}).waitFor();
    if(await page.locator('html').getAttribute('data-theme')!=='light')throw new Error('Tema non ricordato al riavvio');
    if(await page.locator('#theme-toggle').getAttribute('aria-checked')!=='true')throw new Error('Pulsante non sincronizzato al riavvio');
    await page.getByRole('switch',{name:'Modalità chiara'}).focus();await page.keyboard.press('Space');
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    console.log('TEMA OK: sole/luna, chiaro/scuro, controlli nativi, persistenza al riavvio, tastiera e layout.\nContrasto testo chiaro >= 4.5:1:\n'+checked.join('\n'));
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
