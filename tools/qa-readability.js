const { _electron: electron } = require('playwright');
const path = require('node:path');
function rgb(hex) { return hex.match(/\d+/g).slice(0,3).map(Number); }
function luminance(values) { const [r,g,b]=values.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b; }
function contrast(a,b) { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
(async()=>{
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:require('./test-env').tempPrefix('ember-contrast-'+Date.now())},timeout:60000});
  const results=[];
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(30000);
    await page.getByRole('heading',{name:'Bentornato nel tuo spazio.'}).waitFor();
    async function check(selector,background=[36,18,28],minimumFont=0){
      const css=await page.locator(selector).first().evaluate(el=>{const s=getComputedStyle(el);return {color:s.color,size:parseFloat(s.fontSize)};});
      const ratio=contrast(rgb(css.color),background);
      if(ratio<4.5)throw new Error(`${selector}: contrasto insufficiente ${ratio.toFixed(2)}:1`);
      if(css.size<minimumFont)throw new Error(`${selector}: carattere troppo piccolo ${css.size}px`);
      results.push(`${selector}: ${ratio.toFixed(2)}:1, ${css.size}px`);
    }
    for(const selector of ['.page-heading p','.stat-bottom','.stat-value small','.local-badge small','.sidebar-heading','.bottom-note','.step-mini p','.template-row small'])await check(selector);
    await page.locator('.topbar [data-action="create"]').click();
    await page.locator('#wizard-version option[value="1.21.1"]').waitFor({state:'attached'});
    for(const selector of ['.type-option small','.field small','.modal-footer > span'])await check(selector,[36,18,28],11);
    await page.locator('[data-action="close-wizard"]').first().click();
    await page.locator('.navigation [data-nav="guide"]').click();
    for(const selector of ['.guide-card p','.guide-card li','.guide-hero p','.notice'])await check(selector);
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1100,730));
    await page.locator('.navigation [data-nav="dashboard"]').click();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
    if(overflow)throw new Error('Overflow orizzontale alla dimensione minima della finestra');
    console.log('LEGGIBILITÀ OK: testo secondario controllato con contrasto >= 4.5:1; nessun overflow a 1100×730.\n'+results.join('\n'));
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
