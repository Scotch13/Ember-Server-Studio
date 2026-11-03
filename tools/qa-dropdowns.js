const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-dropdowns-'));
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.getByRole('heading',{name:'Bentornato nel tuo spazio.'}).waitFor();
    await app.evaluate(({ipcMain})=>{ipcMain.removeHandler('catalog');ipcMain.handle('catalog',()=>({ok:true,data:['26.3','1.21.1',...Array.from({length:40},(_,i)=>`1.20.${i}`)]}));});
    for(const theme of ['dark','light']){
      if(theme==='light')await page.locator('#theme-toggle').click();
      await page.locator('.sidebar-bottom [data-nav="settings"]').click();
      await page.locator('#app-language').locator('..').locator('.ember-select-trigger').click();
      await page.screenshot({path:path.join(__dirname,'..','..','Anteprime',`11-dropdown-${theme}.png`),animations:'disabled'});
      const box=await page.locator('.ember-select-menu').boundingBox();const viewport=page.viewportSize()||await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
      if(box.x<0||box.y<0||box.x+box.width>viewport.width||box.y+box.height>viewport.height)throw new Error('Menu fuori dalla finestra');
      await page.keyboard.press('Escape');await page.locator('.topbar [data-action="create"]').click();
      await page.waitForFunction(()=>!document.querySelector('#wizard-version').disabled);
      await page.locator('#wizard-version').locator('..').locator('.ember-select-trigger').click();
      await page.locator('.ember-select-search input').fill('nessuna-versione');
      await page.getByText('Nessun risultato',{exact:true}).waitFor();
      await page.locator('.ember-select-search input').fill('1.21.1');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
      if(await page.locator('#wizard-version').inputValue()!=='1.21.1')throw new Error('Ricerca versione non sincronizzata');
      await page.getByRole('button',{name:'Continua',exact:true}).click();
      const mode=page.locator('.modal #f-gamemode').locator('..').locator('.ember-select-trigger');await mode.focus();
      await page.keyboard.press('ArrowDown');await page.keyboard.press('End');await page.keyboard.press('Enter');
      if(await page.locator('.modal #f-gamemode').inputValue()!=='spectator')throw new Error('Navigazione tastiera non sincronizzata');
      await mode.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('c');await page.keyboard.press('Enter');
      if(await page.locator('.modal #f-gamemode').inputValue()!=='creative')throw new Error('Ricerca rapida da tastiera non sincronizzata');
      if(await page.locator('select:not(.ember-native-select)').count())throw new Error('Menu nativi non sostituiti');
      await page.locator('.modal-header [data-action="close-wizard"]').click();await page.waitForFunction(()=>!document.querySelector('.modal'));
      if(await page.locator('.ember-select-menu').count())throw new Error('Menu rimasto dopo chiusura');
    }
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('DROPDOWN OK: temi, ricerca, nessun risultato, frecce/Home/End, typeahead, valori nativi e contenimento nella finestra.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
