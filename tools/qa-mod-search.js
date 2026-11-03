const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-search-recovery-'));
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await app.evaluate(({ipcMain})=>{
      global.__searchMode='limited';ipcMain.removeHandler('modrinthSearch');
      ipcMain.handle('modrinthSearch',async(_,options)=>{
        if(global.__searchMode==='error')return {ok:false,error:'La ricerca Modrinth è temporaneamente indisponibile. Riprova tra poco.'};
        const response={ok:true,data:{limited:global.__searchMode==='limited',offset:0,total:options.query==='unknown'?0:1,hits:options.query==='unknown'?[]:[{id:'P7dR8mSH',title:'Fabric API',description:'Library for Fabric.',slug:'fabric-api',downloads:100,author:''}]}};
        if(!options.query){global.__initialSearch=new Promise(resolve=>setTimeout(()=>resolve(response),400));return global.__initialSearch;}return response;
      });
    });
    await page.locator('[data-nav="modrinth"]').click();await page.locator('#modrinth-search input').fill('Fabric API');await page.locator('#modrinth-search button').click();
    await page.locator('[data-project="P7dR8mSH"]').waitFor();await page.locator('.modrinth-search-warning').waitFor();
    await app.evaluate(async()=>{await global.__initialSearch;});
    if(await page.locator('#modrinth-search input').inputValue()!=='Fabric API')throw new Error('Late catalog response reset search');
    if(await page.locator('[data-action="modrinth-next"]').count())throw new Error('Partial catalog shows misleading full pagination');
    await page.locator('#modrinth-search input').fill('unknown');await page.locator('#modrinth-search input').press('Enter');
    await page.getByText('Nessun progetto trovato nella ricerca limitata. Riprova più tardi per il catalogo completo.',{exact:true}).waitFor();
    await app.evaluate(()=>{global.__searchMode='full';});await page.locator('#modrinth-search input').fill('Fabric API');await page.locator('[data-action="modrinth-retry"]').click();
    // Retry keeps the submitted search, not an unsubmitted edit.
    await page.locator('[data-action="modrinth-next"]').waitFor();if(await page.locator('.modrinth-search-warning').count())throw new Error('Outage banner persisted after recovery');
    await page.locator('#modrinth-search input').fill('Fabric API');await page.locator('#modrinth-search input').press('Enter');await page.locator('[data-project="P7dR8mSH"]').waitFor();
    await app.evaluate(()=>{global.__searchMode='error';});await page.locator('#modrinth-search button').click();
    await page.getByText('La ricerca Modrinth è temporaneamente indisponibile. Riprova tra poco.',{exact:true}).waitFor();await page.locator('[data-action="modrinth-retry"]').waitFor();
    if(await page.locator('#modrinth-results .spinner').count())throw new Error('Error left an endless spinner');
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('MOD SEARCH RECOVERY UI OK: submit/Enter, partial lookup warning, honest empty state, stale requests ignored, retry recovery and complete outage.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
