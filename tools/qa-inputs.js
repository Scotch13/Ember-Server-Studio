const {_electron:electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {Manager}=require('../lib/manager');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-inputs-ui-')),manager=await new Manager(path.join(root,'Dati')).init();
  manager.servers.push({...manager.validate({name:'Input QA',type:'vanilla',version:'1.21.1',ram:2,port:29941,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id:'inputs-qa',installed:false});await manager.save();
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);await page.locator('.page-heading').waitFor();
    const style=async selector=>page.locator(selector).first().evaluate(el=>{const s=getComputedStyle(el);return Object.fromEntries(['backgroundColor','borderColor','borderRadius','fontSize','boxShadow'].map(k=>[k,s[k]]));});
    for(const theme of ['dark','light']){
      await page.evaluate(t=>applyTheme(t),theme);await page.locator('.nav[data-nav="servers"]').click();await page.locator('#server-search').waitFor();await page.locator('#breadcrumb').click();const baseline=await style('.servers-heading-actions .search');assert.equal(baseline.fontSize,'14px');assert.equal(baseline.borderRadius,'8px');
      await page.locator('.nav[data-nav="tunnels"]').click();await page.locator('#tn-host').waitFor();
      for(const selector of ['#tn-host','#tn-controlPort','#tn-token','#tn-caPem']){assert.deepEqual(await style(selector),baseline,selector+' must match server search');assert((await page.locator(selector).boundingBox()).height>=44);}
      await page.locator('#tn-host').focus();await page.waitForFunction(()=>{const probe=document.createElement('span');probe.style.color='var(--red)';document.body.append(probe);const color=getComputedStyle(probe).color;probe.remove();return getComputedStyle(document.querySelector('#tn-host')).borderColor===color;},{},{timeout:5000});
      await page.locator('#breadcrumb').click();await page.waitForFunction(()=>!document.querySelector('#tn-host').matches(':focus'));
      await page.screenshot({path:path.join(__dirname,`../../Anteprime/22-shared-inputs-${theme}.png`),animations:'disabled'});
      await page.locator('.quick-server').click();await page.locator('[data-tab="settings"]').click();await page.locator('#settings-form').waitFor();assert.deepEqual(await style('#f-name'),baseline);assert.deepEqual(await style('#settings-form .ember-select-trigger').catch(()=>{throw Error('Missing select');}),baseline);
      await page.locator('[data-tab="tools"]').click();await page.locator('#ws-player').waitFor();assert.deepEqual(await style('#ws-player'),baseline);
      await page.locator('[data-tab="backups"]').click();await page.locator('#ws-intervalMinutes').waitFor();assert.deepEqual(await style('#ws-intervalMinutes'),baseline);assert((await page.locator('#automation-form input[type="checkbox"]').first().boundingBox()).height<25);
      await page.locator('[data-tab="console"]').click();assert.deepEqual(await style('.command-form'),baseline);assert.equal(await page.locator('#command-input').evaluate(el=>getComputedStyle(el).borderWidth),'0px');assert(await page.locator('#command-input').isDisabled());
      await page.locator('.nav[data-nav="modrinth"]').click();await page.locator('#modrinth-search input').waitFor();assert.deepEqual(await style('#modrinth-search input'),baseline);
    }
    await page.evaluate(()=>{const panel=document.createElement('div');panel.className='ember-dialog';panel.id='entry-test';panel.innerHTML='<input type="email" placeholder="Email"><input type="tel"><input type="url"><input type="search"><input type="number"><textarea></textarea><div class="ember-select-menu"><label class="ember-select-search"><input placeholder="Cerca"></label></div>';document.body.append(panel);});
    const baseline=await style('#modrinth-search input');for(const selector of ['#entry-test > input[type="email"]','#entry-test > input[type="tel"]','#entry-test > input[type="url"]','#entry-test > input[type="search"]','#entry-test > input[type="number"]','#entry-test > textarea','#entry-test .ember-select-search'])assert.deepEqual(await style(selector),baseline);
    assert.equal(await page.locator('#entry-test .ember-select-search input').evaluate(el=>getComputedStyle(el).borderWidth),'0px');await page.locator('#entry-test').evaluate(el=>el.remove());
    assert.deepEqual(errors,[]);console.log('SHARED INPUTS OK: identical style across search, VPS text/number/password/textarea, settings, selects, players, backups, console, Modrinth, dialogs and dropdown search; focus, disabled fields and checkboxes preserved in both themes.');
  }catch(e){console.error('Shared input check failed:',e);throw e;}finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
