const {_electron:electron}=require('playwright');
const path=require('node:path');
(async()=>{
  const executablePath=path.join(__dirname,'..','..','App','Ember Server Studio-win32-x64','Ember Server Studio.exe');
  const app=await electron.launch({executablePath,args:[],timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.locator('.page-heading h1').waitFor();
    const details=await app.evaluate(({app})=>({packaged:app.isPackaged,name:app.getName(),version:app.getVersion(),userData:app.getPath('userData'),node:process.versions.node,electron:process.versions.electron}));
    if(!details.packaged)throw new Error('Il test non sta usando il pacchetto finale');
    const security=await page.evaluate(()=>({require:typeof require,node:typeof process}));
    if(security.require!=='undefined'||security.node!=='undefined')throw new Error('Isolamento renderer non attivo');
    await page.locator('.nav[data-nav="tunnels"]').click();await page.locator('#vps-form').waitFor();
    const frp=await app.evaluate(async()=>{const {execFile}=process.getBuiltinModule('node:child_process'),path=process.getBuiltinModule('node:path'),fs=process.getBuiltinModule('node:fs'),crypto=process.getBuiltinModule('node:crypto');const file=path.join(process.resourcesPath,'app.asar.unpacked','assets','frp','frpc.exe');if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!=='23d11640bee87207c7a99d006b84c554df997feeba7ac7243db20a88a9cb5e01')throw Error('FRP checksum');return new Promise((resolve,reject)=>execFile(file,['--version'],{windowsHide:true,timeout:10000},(e,out)=>e?reject(e):resolve(out.trim())));});if(frp!=='0.71.1')throw Error('FRP bundled version');
    await page.locator('.nav[data-nav="dashboard"]').click();
    const completions=await page.evaluate(()=>EmberCommandData.suggest('gam',3,{version:'26.3'}).items.map(item=>item.value));
    if(completions.join(',')!=='gamemode,gamerule')throw new Error('Suggerimenti console mancanti nel pacchetto');
    await page.locator('.navigation [data-nav="servers"]').click();await page.locator('[data-workspace="import"]').waitFor();
    if(await page.evaluate(()=>typeof EmberWorkspaceUI.renderTools)!=='function')throw new Error('Strumenti workspace mancanti nel pacchetto');
    await page.locator('.navigation [data-nav="dashboard"]').click();
    const memory=await app.evaluate(async()=>{
      const {spawn}=process.getBuiltinModule('node:child_process'),path=process.getBuiltinModule('node:path');
      const executable=path.join(process.resourcesPath,'app.asar.unpacked','assets','ram-reader.exe');
      return new Promise((resolve,reject)=>{
        const child=spawn(executable,[String(process.pid)],{windowsHide:true,stdio:['ignore','pipe','ignore']});
        const timer=setTimeout(()=>{child.kill();reject(new Error('RAM helper timeout'));},10000);
        child.on('error',error=>{clearTimeout(timer);reject(error);});
        child.stdout.once('data',chunk=>{clearTimeout(timer);child.kill();resolve(Number(chunk.toString().trim()));});
      });
    });if(!Number.isFinite(memory)||memory<=0)throw new Error('Helper RAM del pacchetto non funzionante');
    await page.locator('[data-nav="modrinth"]').click();await page.locator('[data-action="modrinth-select"]').first().waitFor();
    if(await page.locator('#modrinth-search select').count())throw new Error('Obsolete catalog server filter present');
    await page.locator('[data-action="modrinth-select"]').first().click();await page.locator('#mod-add-version').waitFor({state:'attached'});
    await page.keyboard.press('Escape');await page.locator('.mod-add-dialog').waitFor({state:'detached'});
    await page.waitForFunction(()=>[...document.querySelectorAll('.modrinth-card img')].some(img=>img.complete&&img.naturalWidth>0));
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].emit('app-command',{preventDefault(){}},'browser-backward'));
    await page.waitForFunction(()=>page==='dashboard');
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].emit('app-command',{preventDefault(){}},'browser-forward'));
    await page.locator('#modrinth-search').waitFor();
    await page.evaluate(()=>{window.__packagedDialog=EmberDialogs.confirm('Verifica conferma integrata');});
    await page.locator('.ember-dialog').waitFor();await page.keyboard.press('Escape');
    if(await page.evaluate(()=>window.__packagedDialog)!==false)throw new Error('Escape del dialogo non funzionante');
    await page.locator('.navigation [data-nav="dashboard"]').click();
    await page.locator('.topbar [data-action="create"]').click();
    await page.locator('#wizard-version option[value="1.21.1"]').waitFor({state:'attached'});
    const wizardModal=await page.locator('.modal').elementHandle();
    const wizardName=await page.locator('#f-name').elementHandle();
    await page.locator('[data-wizard-type="paper"]').click();
    await page.locator('#wizard-version option[value="1.21.1"]').waitFor({state:'attached'});
    if(!await wizardModal.evaluate(el=>el===document.querySelector('.modal'))||!await wizardName.evaluate(el=>el===document.querySelector('#f-name')))throw new Error('Flicker: creazione server ricostruita al cambio software');
    await page.locator('[data-action="close-wizard"]').first().click();
    await page.waitForFunction(()=>!document.querySelector('.modal'));
    // Non basta che il nodo esista: un effetto opacity:0 persistente rendeva
    // invisibile la seconda apertura pur lasciando il dialogo nel DOM.
    await page.locator('.topbar [data-action="create"]').click();
    await page.waitForFunction(()=>{
      const layer=document.querySelector('#modal-layer'),modal=layer.querySelector('.modal');
      return modal&&parseFloat(getComputedStyle(layer).opacity)>.98&&parseFloat(getComputedStyle(modal).opacity)>.98;
    });
    await page.locator('[data-action="close-wizard"]').first().click();
    await page.waitForFunction(()=>!document.querySelector('.modal'));
    const initialTheme=await page.locator('html').getAttribute('data-theme');
    await page.locator('#theme-toggle').click();
    const expectedTheme=initialTheme==='light'?'dark':'light';
    await page.waitForFunction(expected=>document.documentElement.dataset.theme===expected,expectedTheme);
    if(await app.evaluate(({nativeTheme})=>nativeTheme.themeSource)!==expectedTheme)throw new Error('Tema nativo del pacchetto non sincronizzato');
    await page.locator('#theme-toggle').click();
    await page.waitForFunction(initial=>document.documentElement.dataset.theme===initial,initialTheme);
    const initialLanguage=await page.evaluate(()=>EmberLocale.get());
    await page.locator('.sidebar-bottom [data-nav="settings"]').click();
    await page.locator('#app-language').locator('..').locator('.ember-select-trigger').click();
    await page.getByRole('option',{name:'English',exact:true}).click();
    await page.getByRole('heading',{name:'Made to be yours.',exact:true}).waitFor();
    if(await page.locator('#app-language option').count()!==5)throw new Error('Lingue mancanti nel pacchetto');
    await page.evaluate(initial=>EmberLocale.set(initial),initialLanguage);
    await page.locator('.navigation [data-nav="dashboard"]').click();
    await page.screenshot({path:path.join(__dirname,'..','..','Anteprime','07-app-pronta.png'),animations:'disabled'});
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('ESEGUIBILE FINALE OK:',JSON.stringify(details),'renderer isolato, wizard, temi, cinque lingue, catalogo Modrinth live, dialoghi integrati e helper RAM scompattato funzionanti.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
