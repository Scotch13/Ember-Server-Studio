const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Manager}=require('../lib/manager');
const locale=require('../ui/locale-details');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-file-actions-'));
  const manager=await new Manager(path.join(root,'Dati')).init(),id='file-actions-fixture';
  manager.servers.push({...manager.validate({name:'Mod selection',type:'fabric',version:'1.21.1',ram:2,port:29970,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id,installed:true});
  const folder=manager.fileFolder(id);await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,'A.jar'),'mod-A');await fs.writeFile(path.join(folder,'B.jar'),'mod-B');await fs.writeFile(path.join(folder,'C.jar.disabled'),'mod-C');
  const world=path.join(manager.dir(id),'world');await fs.mkdir(world);await fs.writeFile(path.join(world,'level.dat'),'mondo-da-conservare');await manager.save();
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.locator('.quick-server').click();await page.locator('.tab[data-tab="files"]').click();
    await page.waitForFunction(()=>document.querySelectorAll('[data-file-row]').length===3);
    const updates=await page.locator('[data-workspace="updates"]').boundingBox(),panel=await page.locator('#files-panel').boundingBox(),list=await page.locator('#file-list').boundingBox();
    if(updates.y<list.y+list.height||panel.x+panel.width-updates.x-updates.width>40||panel.y+panel.height-updates.y-updates.height>40)throw new Error('Update check is not in the bottom-right corner of the mods panel');
    await page.locator('[data-workspace="updates"]').click();await page.locator('.ws-updates-empty').waitFor();
    const messageBox=await page.locator('.ws-updates-empty').boundingBox(),checkBox=await page.locator('[data-workspace="updates"]').boundingBox();
    if(messageBox.y<checkBox.y+checkBox.height||await page.locator('.ws-updates-empty').evaluate(el=>getComputedStyle(el).textAlign)!=='right')throw new Error('No-update message is not below the button and right aligned');
    if(!await page.locator('#file-selection-bar').isHidden())throw new Error('Barra visibile senza selezione');
    await page.locator('[data-file-row="A.jar"] .file-copy').click();
    if(await page.locator('#file-selection-bar').isHidden()||!await page.locator('[data-file-operation="enable"]').isDisabled())throw new Error('Selezione riga o stato pulsanti errato');
    await page.locator('[data-file-select="B.jar"]').check();
    if(!await page.locator('#files-select-all').evaluate(el=>el.indeterminate))throw new Error('Selezione parziale non indicata');
    await page.locator('[data-file-operation="disable"]').click();
    await page.waitForFunction(()=>document.querySelectorAll('[data-file-row$=".disabled"]').length===3&&document.querySelector('#file-selection-bar').classList.contains('hidden'));
    if(await fs.readFile(path.join(folder,'A.jar.disabled'),'utf8')!=='mod-A')throw new Error('Contenuto modificato');
    await page.locator('#files-select-all').check();await page.locator('[data-file-operation="enable"]').click();
    await page.waitForFunction(()=>document.querySelectorAll('[data-file-row$=".disabled"]').length===0&&document.querySelector('#file-selection-bar').classList.contains('hidden'));
    await page.locator('[data-file-select="B.jar"]').check();await page.locator('[data-file-operation="delete"]').click();
    await page.locator('.ember-dialog .button').first().click();
    await page.waitForFunction(()=>!fileViews.get(selected).working);
    if(!await page.locator('[data-file-select="B.jar"]').isChecked())throw new Error('Annulla ha perso la selezione');
    await fs.access(path.join(folder,'B.jar'));
    await page.locator('[data-file-operation="delete"]').click();
    await page.locator('.ember-dialog .button').last().click();
    await page.waitForFunction(()=>!document.querySelector('[data-file-row="B.jar"]'));
    try{await fs.access(path.join(folder,'B.jar'));throw new Error('File non spostato nel Cestino');}catch(e){if(e.code!=='ENOENT')throw e;}
    if(await fs.readFile(path.join(world,'level.dat'),'utf8')!=='mondo-da-conservare')throw new Error('Mondo modificato');
    for(let i=0;i<60;i++)await fs.writeFile(path.join(folder,`Example-${i}.jar`),'fixture');
    await page.locator('[data-action="files-refresh"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-file-row]').length===62);
    await page.locator('[data-file-select="A.jar"]').check();
    const bar=await page.locator('#file-selection-bar').boundingBox();const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
    if(bar.y<0||bar.y+bar.height>viewport.height)throw new Error('Barra non visibile con una lista lunga: '+JSON.stringify(bar));
    for(const theme of ['dark','light']){
      if(theme==='light')await page.locator('#theme-toggle').click();
      for(const language of ['it','en','es','fr','de']){
        await page.evaluate(language=>EmberLocale.set(language),language);
        const expected=locale.translate('Attiva',language,'file-actions');
        if((await page.locator('[data-file-operation="enable"]').textContent()).trim()!==expected)throw new Error('Azione non tradotta: '+language);
      }
      await page.evaluate(()=>EmberLocale.set('it'));
      await page.screenshot({path:path.join(__dirname,'..','..','Anteprime',`12-file-actions-${theme}.png`),animations:'disabled'});
    }
    await page.evaluate(()=>{state.servers.find(s=>s.id===selected).status='online';render();});
    await page.waitForFunction(()=>document.querySelector('#file-selection-bar')&&!document.querySelector('#file-selection-bar').classList.contains('hidden'));
    for(const action of ['enable','disable','delete'])if(!await page.locator(`[data-file-operation="${action}"]`).isDisabled())throw new Error('Azione disponibile mentre online');
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('FILE ACTIONS UI OK: selezione singola/multipla/tutte, attiva/disattiva, Cestino e Annulla, liste lunghe, blocco online, temi e 5 lingue.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
