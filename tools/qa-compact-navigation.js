const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Manager}=require('../lib/manager');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-compact-nav-'));
  const manager=await new Manager(path.join(root,'Dati')).init(),id='compact-test';
  manager.servers.push({...manager.validate({name:'Compact RAM',type:'fabric',version:'1.21.1',ram:8,port:29948,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id,installed:true});
  await fs.mkdir(manager.dir(id),{recursive:true});await manager.save();
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const command=direction=>app.evaluate(({BrowserWindow},direction)=>{
      let prevented=false;BrowserWindow.getAllWindows()[0].emit('app-command',{preventDefault(){prevented=true;}},direction==='back'?'browser-backward':'browser-forward');
      if(!prevented)throw new Error('Native app command not intercepted');
    },direction);
    await page.locator('.quick-server').click();await page.locator('.ram-stat #ram-graph').waitFor();
    const box=await page.locator('#ram-graph').boundingBox();if(box.height>55||box.width>200)throw new Error('Graph is not compact');
    if(await page.locator('#server-body > .panel:has(#ram-graph)').count())throw new Error('Large RAM panel still present');
    await page.evaluate(()=>{ramHistories.set(selected,Array.from({length:150},(_,i)=>({time:Date.now()-(149-i)*2000,memoryMB:2100+Math.sin(i/8)*250+i*2})));state.servers.find(s=>s.id===selected).status='online';drawRam(selected);});
    if(!(await page.locator('#ram-graph path').getAttribute('d')).includes('L'))throw new Error('No RAM line');
    const out=path.join(__dirname,'..','..','Anteprime');
    for(const theme of ['dark','light']){
      if(theme==='light')await page.locator('#theme-toggle').click();
      await page.locator('.stats-grid').screenshot({path:path.join(out,`15-compact-ram-${theme}.png`),animations:'disabled'});
    }
    await page.locator('.tab[data-tab="console"]').click();await command('back');await page.locator('#ram-graph').waitFor();
    await command('forward');await page.locator('#command-input').waitFor();
    await page.locator('[data-tab="settings"]').click();await page.evaluate(()=>{state.servers.find(s=>s.id===selected).status='offline';render();});
    await page.locator('#f-name').fill('Unsaved changes');await command('back');await page.locator('.ember-dialog').waitFor();await page.keyboard.press('Escape');
    if(await page.locator('#f-name').inputValue()!=='Unsaved changes')throw new Error('Back discarded unsaved changes');
    await command('back');await page.locator('.ember-dialog .button').last().click();await page.locator('#command-input').waitFor();
    await command('back');await page.locator('#ram-graph').waitFor();
    await page.locator('.nav[data-nav="guide"]').click();await command('forward');
    if(await page.locator('#ram-graph').count())throw new Error('Forward branch not cleared');
    await page.locator('.nav[data-nav="modrinth"]').click();await page.locator('#modrinth-search input').fill('lithium');await page.locator('#modrinth-search input').press('Enter');
    const image=page.locator('.modrinth-card:has([data-project="gvQqBUqZ"]) img');await image.waitFor();await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const img=document.querySelector('.modrinth-card:has([data-project="gvQqBUqZ"]) img');return img?.complete&&img.naturalWidth>0;});
    await page.screenshot({path:path.join(out,'16-modrinth-images-light.png'),animations:'disabled'});
    await page.locator('.nav[data-nav="guide"]').click();await command('back');
    if(await page.locator('#modrinth-search input').inputValue()!=='')throw new Error('Search not reset when returning through history');
    await page.waitForFunction(()=>document.querySelector('.modrinth-card img'));
    await page.evaluate(()=>document.querySelector('.modrinth-card img').dispatchEvent(new Event('error')));
    if(await page.locator('.modrinth-card').first().locator('.mod-image img').count())throw new Error('Broken image not replaced by fallback');
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1100,730));
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Minimum-size overflow');
    if(errors.length)throw new Error(errors.join('\n'));
    await page.locator('#modrinth-search input').fill('fabric');await page.locator('#modrinth-search input').press('Enter');
    await page.locator('.nav[data-nav="guide"]').click();await page.locator('.nav[data-nav="modrinth"]').click();
    if(await page.locator('#modrinth-search input').inputValue()!=='')throw new Error('Search not reset when returning through sidebar');
    if(await page.evaluate(()=>modrinthView.offset)!==0)throw new Error('Pagination not reset');
    console.log('COMPACT RAM / IMAGES / MOUSE HISTORY OK: small RAM card, themes, live CDN icons/fallback, native back/forward, tabs, dirty cancel/confirm, history branching and search reset on return.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
