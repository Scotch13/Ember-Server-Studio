const { _electron: electron } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
(async()=>{
  const userData=await fs.mkdtemp(require('./test-env').tempPrefix('ember-fluid-'));
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:userData},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.getByRole('heading',{name:'Bentornato nel tuo spazio.'}).waitFor();
    // Risposte controllate: verifica anche Internet lento, risposte fuori ordine
    // e retry senza creare server o toccare dati reali.
    await app.evaluate(({ipcMain})=>{
      global.__catalogCalls=[];global.__catalogPending=new Map();
      ipcMain.removeHandler('catalog');ipcMain.handle('catalog',(_,type)=>new Promise(resolve=>{global.__catalogCalls.push(type);global.__catalogPending.set(type,resolve);}));
    });
    const resolve=async(type,versions=['26.3','1.21.1'],error)=>app.evaluate((_,payload)=>{
      const done=global.__catalogPending.get(payload.type);if(!done)throw new Error('Richiesta mancante: '+payload.type);
      global.__catalogPending.delete(payload.type);done(payload.error?{ok:false,error:payload.error}:{ok:true,data:payload.versions});
    },{type,versions,error});
    async function trackNodes(){await page.evaluate(()=>{
      window.__wizardNodes=['.modal','.modal-header','.wizard-steps','#wizard-form','.type-grid','#f-name','#wizard-version','.modal-footer'].map(selector=>({selector,node:document.querySelector(selector)}));
      window.__modalAnimationStarts=0;document.querySelector('.modal').addEventListener('animationstart',e=>{if(e.target===document.querySelector('.modal'))window.__modalAnimationStarts++;});
      window.__wizardHeight=document.querySelector('.modal').scrollHeight;
    });}
    async function stable(){const failure=await page.evaluate(()=>{
      for(const {selector,node}of window.__wizardNodes)if(!node.isConnected||document.querySelector(selector)!==node)return 'Nodo ricreato: '+selector;
      if(document.querySelector('.modal').scrollHeight!==window.__wizardHeight)return 'Altezza della scheda cambiata';
      if(window.__modalAnimationStarts>1)return 'Animazione della finestra riavviata';
      return '';
    });if(failure)throw new Error(failure);}
    await page.locator('.topbar [data-action="create"]').click();await trackNodes();
    await resolve('fabric');await page.locator('#wizard-version').waitFor();await page.waitForFunction(()=>!document.querySelector('#wizard-version').disabled);
    await page.locator('#f-name').fill('Un mondo senza flicker');
    await page.locator('[data-wizard-type="vanilla"]').click();
    await page.locator('#f-name').focus();
    const saved=await page.evaluate(()=>{const input=document.querySelector('#f-name');input.setSelectionRange(3,9);const modal=document.querySelector('.modal');modal.scrollTop=60;return {scroll:modal.scrollTop,start:input.selectionStart,end:input.selectionEnd};});
    await resolve('vanilla');await page.waitForFunction(()=>!document.querySelector('#wizard-version').disabled);
    const after=await page.evaluate(()=>({value:document.querySelector('#f-name').value,focus:document.activeElement.id,scroll:document.querySelector('.modal').scrollTop,start:document.querySelector('#f-name').selectionStart,end:document.querySelector('#f-name').selectionEnd}));
    if(after.value!=='Un mondo senza flicker'||after.focus!=='f-name'||after.scroll!==saved.scroll||after.start!==saved.start||after.end!==saved.end)throw new Error('Nome, focus, selezione o scroll persi durante il download');await stable();
    await page.locator('[data-wizard-type="paper"]').click();await page.locator('[data-wizard-type="forge"]').click();
    await resolve('paper',['1.20.1']);
    if(await page.locator('[data-wizard-type="forge"]').getAttribute('aria-pressed')!=='true'||!await page.locator('#wizard-version').isDisabled())throw new Error('Risposta vecchia applicata al software sbagliato');
    await resolve('forge');await page.waitForFunction(()=>!document.querySelector('#wizard-version').disabled);await stable();
    await page.locator('[data-wizard-type="fabric"]').click();
    if(await page.locator('#wizard-version').isDisabled())throw new Error('Catalogo già caricato non istantaneo');
    await page.locator('[data-wizard-type="fabric"]').click();
    const fabricCalls=await app.evaluate(()=>global.__catalogCalls.filter(type=>type==='fabric').length);if(fabricCalls!==1)throw new Error('Richieste ripetute per catalogo già caricato');
    await stable();
    const modal=await page.locator('.modal').elementHandle();
    await page.getByRole('button',{name:'Continua',exact:true}).click();
    if(!await modal.evaluate(el=>el===document.querySelector('.modal')))throw new Error('Finestra ricreata al cambio passo');
    await page.locator('[data-action="wizard-back"]').click();
    if(await page.locator('#f-name').inputValue()!=='Un mondo senza flicker')throw new Error('Nome perso tornando al primo passo');
    await page.locator('[data-action="close-wizard"]').first().click();
    await page.locator('#theme-toggle').click();
    await page.locator('.topbar [data-action="create"]').click();await trackNodes();
    for(const type of ['vanilla','paper','fabric','forge','neoforge','purpur','quilt']){
      await page.locator(`[data-wizard-type="${type}"]`).click();
      if(await page.locator('#wizard-version').isDisabled()){
        if(type==='quilt'){
          await resolve(type,[],'Connessione interrotta: test del retry');await page.locator('[data-action="retry-catalog"]').click();
        }
        await resolve(type);await page.waitForFunction(()=>!document.querySelector('#wizard-version').disabled);
      }
      await stable();
    }
    await page.locator('[data-action="close-wizard"]').first().click();
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('WIZARD FLUIDO OK: nodi stabili, niente riapertura/flash, altezza costante, input/focus/scroll preservati, cache immediata, risposte fuori ordine, retry e entrambi i temi.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
