const { _electron: electron } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-close-'));
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.getByRole('heading',{name:'Bentornato nel tuo spazio.'}).waitFor();
    await app.evaluate(({ipcMain})=>{
      ipcMain.removeHandler('catalog');ipcMain.handle('catalog',(_,type)=>{
        if(type==='forge')return new Promise(resolve=>{global.__delayedCatalog=resolve;});
        return {ok:true,data:['26.3','1.21.1']};
      });
    });
    async function open(){
      const before=await page.locator('.topbar-right').evaluate(el=>el.getBoundingClientRect().right);
      await page.locator('.topbar [data-action="create"]').click();await page.locator('.modal').waitFor();
      await page.waitForFunction(()=>{
        const layer=document.querySelector('#modal-layer'),modal=layer.querySelector('.modal');
        return modal&&parseFloat(getComputedStyle(layer).opacity)>.98&&parseFloat(getComputedStyle(modal).opacity)>.98;
      });
      const after=await page.locator('.topbar-right').evaluate(el=>el.getBoundingClientRect().right);
      if(Math.abs(before-after)>1)throw new Error('La pagina si sposta lateralmente aprendo la finestra');
    }
    for(const theme of ['dark','light']){
      if(theme==='light')await page.locator('#theme-toggle').click();
      for(const method of ['close','cancel','escape','backdrop']){
        await open();
        const initial=await page.evaluate(method=>{
          if(method==='escape')document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
          else if(method==='backdrop')document.querySelector('#modal-layer').click();
          else document.querySelector(method==='close'?'.modal-header [data-action="close-wizard"]':'.modal-footer [data-action="close-wizard"]').click();
          const layer=document.querySelector('#modal-layer'),modal=layer.querySelector('.modal');
          return {closing:layer.classList.contains('is-closing'),hidden:layer.classList.contains('hidden'),retained:!!modal,inert:modal?.inert,animated:modal?.getAnimations().some(a=>a.effect.getTiming().duration===180)};
        },method);
        if(!initial.closing||initial.hidden||!initial.retained||!initial.inert||!initial.animated)throw new Error(`Animazione mancante per ${method}/${theme}: ${JSON.stringify(initial)}`);
        // Una seconda richiesta di chiusura non deve avviare un'altra animazione.
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>document.querySelector('#modal-layer').classList.contains('hidden'));
        const closed=await page.evaluate(()=>({empty:!document.querySelector('.modal'),overflow:document.body.style.overflow,focused:document.activeElement.matches('.topbar [data-action="create"]'),staleAnimations:document.querySelector('#modal-layer').getAnimations().filter(a=>a.effect?.getTiming().fill==='forwards').length}));
        if(!closed.empty||closed.overflow||!closed.focused||closed.staleAnimations)throw new Error(`Chiusura incompleta per ${method}/${theme}`);
      }
    }
    await open();
    await page.evaluate(()=>{closeWizard();openWizard('paper');});
    await page.waitForFunction(()=>!!document.querySelector('[data-wizard-type="paper"].selected')&&!document.querySelector('#modal-layer').classList.contains('is-closing'));
    await page.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('#modal-layer')).opacity)>.98);
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.modal'));
    // Chiudere durante il download non deve far ricomparire il wizard.
    await open();await page.locator('[data-wizard-type="forge"]').click();await page.keyboard.press('Escape');
    await app.evaluate(()=>{global.__delayedCatalog({ok:true,data:['26.3']});});
    await page.waitForFunction(()=>!document.querySelector('.modal'));
    await page.emulateMedia({reducedMotion:'reduce'});await open();
    const instant=await page.evaluate(()=>{closeWizard();return !document.querySelector('.modal')&&document.body.style.overflow==='';});
    if(!instant)throw new Error('Preferenza movimento ridotto non rispettata');
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('CHIUSURA WIZARD OK: fade/riduzione 180ms, X, Annulla, Esc, sfondo, entrambi i temi, focus/scroll, riapertura rapida, cataloghi in ritardo e movimento ridotto.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
