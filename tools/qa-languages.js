const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Manager}=require('../lib/manager');
const translations=require('../ui/locale-details');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-languages-'));
  const manager=await new Manager(path.join(root,'Dati')).init();
  const id='language-fixture';
  manager.servers.push({...manager.validate({name:'Panoramica',type:'fabric',version:'1.21.1',ram:2,port:29985,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id,installed:true,javaMajor:21,launch:['-jar','server.jar'],createdAt:new Date().toISOString()});
  await fs.mkdir(manager.dir(id),{recursive:true});await manager.save();
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.getByRole('heading',{name:'Bentornato nel tuo spazio.'}).waitFor();
    await app.evaluate(({ipcMain,dialog})=>{
      ipcMain.removeHandler('catalog');ipcMain.handle('catalog',()=>({ok:true,data:['26.3','1.21.1',...Array.from({length:20},(_,i)=>`1.20.${i}`)]}));
    });
    const missing=new Set();
    async function audit(){const items=await page.evaluate(()=>{
      const result=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
      while((n=walk.nextNode())){
        if(n.parentElement.closest('script,style,svg,code,input,[translate="no"]'))continue;
        const value=n.data.trim();if(value.length>2&&/[A-Za-zÀ-ž]/.test(value)&&EmberLanguageData.translate(value,'en')===value)result.push(value);
      }return result;
    });items.forEach(x=>missing.add(x));}
    await audit();
    for(const nav of ['servers','backups','guide','settings']){await page.locator(`.nav[data-nav="${nav}"]`).click();await audit();}
    await page.locator('.quick-server').click();
    for(const tab of ['overview','console','files','backups','settings']){await page.locator(`.tab[data-tab="${tab}"]`).click();await audit();}
    await page.locator('.topbar [data-action="create"]').click();await page.waitForFunction(()=>!document.querySelector('#wizard-version').disabled);await audit();
    await page.getByRole('button',{name:'Continua',exact:true}).click();await audit();await page.getByRole('button',{name:'Continua',exact:true}).click();await audit();
    await page.locator('.modal-header [data-action="close-wizard"]').click();await page.waitForFunction(()=>!document.querySelector('.modal'));
    console.log('AUDIT: testi invariati / tecnici da verificare:\n'+[...missing].sort().join('\n'));
    const englishLabels={en:'Made to be yours.',es:'Hecho para ti.',fr:'Conçu pour vous.',de:'Für dich gemacht.',it:'Fatto per essere tuo.'};
    for(const language of ['en','es','fr','de','it']){
      await page.locator('.nav[data-nav="settings"]').click();
      await page.locator('#app-language').locator('..').locator('.ember-select-trigger').click();
      await page.getByRole('option',{name:translations.languages[language].name,exact:true}).click();
      await page.getByRole('heading',{name:englishLabels[language],exact:true}).waitFor();
      if(await page.locator('html').getAttribute('lang')!==language)throw new Error('Lingua html non aggiornata');
      await page.reload();await page.getByRole('heading',{name:translations.translate('Bentornato nel tuo spazio.',language),exact:true}).waitFor();
      if(await page.evaluate(()=>EmberLocale.get())!==language)throw new Error('Lingua non salvata al ricaricamento');
      await page.locator('.quick-server').click();
      if(await page.locator('.server-heading h1').textContent()!=='Panoramica')throw new Error('Nome del server tradotto per errore');
      await page.locator('.tab[data-tab="settings"]').click();
      const mode=page.locator('#f-gamemode').locator('..').locator('.ember-select-trigger');await mode.click();
      await page.getByRole('option',{name:translations.translate('Creativa',language),exact:true}).click();
      if(await page.locator('#f-gamemode').inputValue()!=='creative')throw new Error('Valore del server tradotto o perso');
      // Non salva le modifiche al server fixture: navigazione senza perdere dati reali.
      await page.evaluate(()=>{formDirty=false;});
      await page.locator('[data-action="delete-server"]').click();
      await page.locator('.ember-dialog').waitFor();
      if(await page.locator('#ember-dialog-title').textContent()!==translations.translate('Elimina server',language)||!(await page.locator('.ember-dialog').textContent()).includes('Panoramica'))throw new Error('Dialogo integrato non tradotto o nome modificato');
      await page.locator('.ember-dialog .button').first().click();
      const error=await page.evaluate(async id=>{try{await window.ember.call('update',id,{port:1});return '';}catch(e){return e.message;}},id);
      if(error!==translations.translate('Porta valida: da 1024 a 65535.',language))throw new Error('Validazione non localizzata');
      await page.locator('.topbar [data-action="create"]').click();await page.waitForFunction(()=>!document.querySelector('#wizard-version').disabled);
      await page.locator('#wizard-version').locator('..').locator('.ember-select-trigger').click();
      const search=page.locator('.ember-select-search input');await search.fill('1.21.1');await page.keyboard.press('Enter');
      if(await page.locator('#wizard-version').inputValue()!=='1.21.1')throw new Error('Ricerca o selezione versione fallita');
      await page.locator('#wizard-version').locator('..').locator('.ember-select-trigger').click();await page.keyboard.press('Escape');
      if(!await page.locator('.modal').isVisible()||await page.locator('.ember-select-menu').count())throw new Error('Escape non chiude solo il menu');
      await page.getByRole('button',{name:translations.translate('Continua',language),exact:true}).click();
      await page.locator('.modal #f-difficulty').locator('..').locator('.ember-select-trigger').click();
      await page.getByRole('option',{name:translations.translate('Difficile',language),exact:true}).click();
      if(await page.locator('.modal #f-difficulty').inputValue()!=='hard')throw new Error('Difficoltà non sincronizzata');
      await page.locator('.modal-header [data-action="close-wizard"]').click();await page.waitForFunction(()=>!document.querySelector('.modal'));
      await page.locator('.nav[data-nav="settings"]').click();
      if(language==='en'||language==='de')await page.screenshot({path:path.join(__dirname,'..','..','Anteprime',`10-language-${language}.png`),animations:'disabled'});
    }
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1100,730));
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Overflow nella finestra minima');
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('LINGUE E MENU OK: 5 lingue, persistenza, nomi e valori invariati, dialoghi/errori tradotti, ricerca versioni, menu da tastiera e Escape.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
