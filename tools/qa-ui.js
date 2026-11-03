const { _electron: electron } = require('playwright');
const path = require('node:path');
const fs = require('node:fs/promises');
(async()=>{
  const app = await electron.launch({args:[path.join(__dirname,'..')], env:{...process.env,EMBER_TEST_DATA:require('./test-env').tempPrefix('ember-ui-test-'+Date.now())}, timeout:60000});
  try {
    const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.getByRole('heading',{name:'Bentornato nel tuo spazio.'}).waitFor();
    const out=path.join(__dirname,'..','..','Anteprime');await fs.mkdir(out,{recursive:true});
    await page.screenshot({path:path.join(out,'01-dashboard.png'),animations:'disabled'});
    await page.locator('.topbar [data-action="create"]').click();
    await page.locator('#wizard-version option[value="1.21.1"]').waitFor({state:'attached'});
    await page.locator('[data-wizard-type="paper"]').click();
    await page.locator('#wizard-version option[value="1.21.1"]').waitFor({state:'attached'});
    await page.screenshot({path:path.join(out,'02-creazione-server.png'),animations:'disabled'});
    await page.getByRole('button',{name:'Continua',exact:true}).click();
    await page.locator('#f-maxPlayers').fill('12');
    await page.getByRole('button',{name:'Continua',exact:true}).click();
    await page.getByRole('button',{name:'Crea e installa',exact:true}).waitFor();
    await page.screenshot({path:path.join(out,'03-riepilogo.png'),animations:'disabled'});
    // Nessuna EULA viene accettata e nessun mondo reale viene creato dal test UI.
    await page.locator('[data-action="close-wizard"]').click();
    await page.locator('[data-nav="guide"]').click();await page.getByRole('heading',{name:'Le avventure migliori sono condivise.'}).waitFor();
    await page.screenshot({path:path.join(out,'04-guida-amici.png'),animations:'disabled'});
    for(const name of ['servers','backups','settings']){await page.locator(`[data-nav="${name}"]`).click();}
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('UI OK: dashboard, cataloghi Fabric/Paper, wizard, riepilogo, guida, preferenze. Nessun errore renderer.');
  } finally {await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
