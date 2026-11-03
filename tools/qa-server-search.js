const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {Manager}=require('../lib/manager');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-search-ui-')),manager=await new Manager(path.join(root,'Dati')).init();
  for(const [id,name,port] of [['search-a','Avventura',29938],['search-b','Creativo',29939]])manager.servers.push({...manager.validate({name,type:'vanilla',version:'1.21.1',ram:2,port,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id,installed:false});
  await manager.save();const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.locator('.nav[data-nav="servers"]').click();await page.locator('#server-search').waitFor();
    for(const width of [1440,1100,1000]){await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setSize(width,940),width);
      const search=await page.locator('.servers-heading-actions .search').boundingBox(),button=await page.locator('[data-workspace="import"]').boundingBox();assert(Math.abs(search.y-button.y)<3,'Search and import must share a row');assert(button.x-search.x-search.width>=10,'Search must sit directly before import');assert(search.width>=250);assert(search.height>=44);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    await page.locator('#server-search').fill('Avventura');assert.equal(await page.locator('#server-search').inputValue(),'Avventura');await page.getByRole('heading',{name:'Avventura',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Creativo',exact:true}).count(),0);assert.equal(await page.locator('[data-workspace="import"]').count(),1);assert(await page.locator('#server-search').evaluate(el=>document.activeElement===el));
    await page.locator('#server-search').fill('');await page.getByRole('heading',{name:'Creativo',exact:true}).waitFor();
    for(const theme of ['dark','light']){await page.evaluate(theme=>applyTheme(theme),theme);await page.locator('#server-search').focus();await page.waitForFunction(()=>{const input=document.querySelector('#server-search'),style=getComputedStyle(input);return style.boxShadow==='none'&&style.borderWidth==='0px'&&getComputedStyle(input.closest('.search')).boxShadow!=='none';});await page.screenshot({path:path.join(__dirname,`../../Anteprime/21-server-search-${theme}.png`),animations:'disabled'});}
    assert.deepEqual(errors,[]);console.log('SERVER SEARCH OK: grouped next to import, larger field, responsive alignment, search/filter/focus preserved, dark/light themes.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
