const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Manager}=require('../lib/manager');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-mod-version-ui-'));
  const manager=await new Manager(path.join(root,'Dati')).init();
  for(const [id,type]of [['server-a','fabric'],['server-b','forge']]){
    manager.servers.push({...manager.validate({name:id,type,version:'1.21.1',ram:2,port:id==='server-a'?29942:29943,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id,installed:true});await fs.mkdir(manager.dir(id),{recursive:true});
  }
  await manager.save();const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await app.evaluate(({ipcMain})=>{
      for(const channel of ['modrinthSearch','modrinthVersions','modrinthPlan','modrinthInstall'])ipcMain.removeHandler(channel);
      ipcMain.handle('modrinthSearch',()=>({ok:true,data:{total:1,hits:[{id:'testmod',title:'Version Test',author:'QA',description:'A mod with selectable releases.',downloads:1}],offset:0}}));
      ipcMain.handle('modrinthVersions',async(_,server)=>{
        if(global.__failVersions){global.__failVersions=false;return {ok:false,error:'Network test error'};}
        const response={ok:true,data:global.__noVersions?[]:[{id:server+'-new',version:server+' latest',type:'release'},{id:server+'-old',version:server+' older',type:'beta'}]};
        if(server==='server-b'){global.__slowVersionPromise=new Promise(resolve=>setTimeout(()=>resolve(response),400));return global.__slowVersionPromise;}
        return response;
      });
      ipcMain.handle('modrinthPlan',(_,id,project,version)=>{global.__chosenVersion={id,project,version};return {ok:true,data:{token:'qa'}};});
      ipcMain.handle('modrinthInstall',()=>({ok:true,data:null}));
    });
    await page.locator('[data-nav="modrinth"]').click();await page.locator('[data-project="testmod"]').click();
    await page.waitForFunction(()=>!document.querySelector('#mod-add-version').disabled);
    const choose=async(id,label)=>{await page.locator('#'+id).locator('..').locator('.ember-select-trigger').click();await page.getByRole('option',{name:label}).click();};
    await choose('mod-add-server',/server-b/);
    if(!await page.locator('.mod-add-controls .button.primary').isDisabled())throw new Error('Add enabled during version loading');
    await choose('mod-add-server',/server-a/);
    await page.waitForFunction(()=>document.querySelector('#mod-add-version').value==='server-a-new');
    await app.evaluate(async()=>{await global.__slowVersionPromise;});
    if(await page.locator('#mod-add-version').inputValue()!=='server-a-new')throw new Error('Stale response replaced current server versions');
    await choose('mod-add-version','server-a older · beta');
    await page.locator('.mod-add-controls .button.primary').click();
    await page.waitForFunction(()=>!document.querySelector('.mod-add-dialog'));
    const chosen=await app.evaluate(()=>global.__chosenVersion);
    if(chosen.id!=='server-a'||chosen.project!=='testmod'||chosen.version!=='server-a-old')throw new Error('Selected version not sent to installer');
    await app.evaluate(()=>{global.__failVersions=true;});await page.locator('[data-project="testmod"]').click();
    await page.locator('#mod-version-retry:not(.hidden)').waitFor();
    if(!await page.locator('.mod-add-controls .button.primary').isDisabled())throw new Error('Add enabled after failure');
    await page.locator('#mod-version-retry').click();await page.waitForFunction(()=>!document.querySelector('#mod-add-version').disabled);
    await page.keyboard.press('Escape');await app.evaluate(()=>{global.__noVersions=true;});
    await page.locator('[data-project="testmod"]').click();await page.getByText('Nessuna versione compatibile con questo server.',{exact:true}).waitFor();
    if(!await page.locator('.mod-add-controls .button.primary').isDisabled())throw new Error('Add enabled without compatible versions');
    await page.keyboard.press('Escape');
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('MOD VERSION UI OK: dependent server/version dropdowns, older version selection, stale replies ignored, loading/failure/no-compatible states and retry.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
