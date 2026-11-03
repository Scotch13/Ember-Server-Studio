const {_electron:electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{Manager}=require('../lib/manager');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-tunnels-ui-')),manager=await new Manager(path.join(root,'Dati')).init(),cert=path.join(root,'public.crt');
  execFileSync(require('./test-env').openssl,['req','-x509','-newkey','rsa:2048','-nodes','-days','2','-keyout',path.join(root,'private.key'),'-out',cert,'-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{windowsHide:true,stdio:'ignore'});
  manager.servers.push({...manager.validate({name:'Tunnel QA',type:'vanilla',version:'1.21.1',ram:2,port:29937,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id:'tunnel-qa',installed:false});await manager.save();
  const output=path.join(root,'exported-frps.toml'),app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
    await app.evaluate(({dialog},{cert,output})=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[cert]});dialog.showSaveDialog=async()=>({canceled:false,filePath:output});},{cert,output});
    await page.locator('[data-nav="tunnels"]').click();await page.locator('#vps-form').waitFor();
    await page.locator('#tn-host').fill('localhost');await page.locator('#tn-publicHost').fill('play.example.com');await page.locator('#tn-tlsName').fill('localhost');await page.locator('[data-tunnel="generate"]').click();await page.waitForFunction(()=>document.querySelector('#tn-token').value.length>=32);
    const token=await page.locator('#tn-token').inputValue();assert.equal(await page.locator('#tn-token').getAttribute('type'),'password');
    await page.locator('[data-tunnel="certificate"]').click();await page.waitForFunction(()=>document.querySelector('#tn-caPem').value.includes('BEGIN CERTIFICATE'));await page.locator('#vps-form [type="submit"]').click();await page.waitForFunction(()=>formDirty===false);
    assert(!(await fs.readFile(path.join(root,'Dati','vps.json'),'utf8')).includes(token));assert.equal(await page.locator('#tn-token').inputValue(),'');
    await page.locator('.quick-server').click();await page.locator('[data-tab="tunnel"]').click();await page.locator('#server-tunnel-form').waitFor();await page.locator('[name="enabled"]').check();
    await page.locator('#server-tunnel-form [type="submit"]').click();await page.locator('.ember-dialog').waitFor();await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>ember.call('tunnelState'))).servers[0].enabled,false);
    await page.locator('#server-tunnel-form [type="submit"]').click();await page.locator('.ember-dialog .button').last().click();await page.waitForFunction(()=>formDirty===false);await page.getByText('In attesa del server',{exact:true}).waitFor();
    const status=await page.evaluate(()=>ember.call('tunnelState'));assert.equal(status.servers[0].enabled,true);assert.equal(status.servers[0].ready,false);assert.equal(status.servers[0].address,'play.example.com:29937');
    for(const language of ['en','es','fr','de','it']){await page.evaluate(l=>EmberLocale.set(l),language);await page.waitForFunction(l=>document.documentElement.lang===l,language);assert.notEqual(await page.locator('.nav[data-nav="tunnels"]').textContent(),'');}
    await page.locator('.nav[data-nav="tunnels"]').click();await page.locator('#vps-form').waitFor();await page.locator('[data-tunnel="export"]').click();await page.locator('.ember-dialog').waitFor();await page.keyboard.press('Escape');await assert.rejects(fs.access(output));
    await page.locator('[data-tunnel="export"]').click();await page.locator('.ember-dialog .button').last().click();await page.waitForFunction(()=>!document.querySelector('.ember-dialog'));await new Promise(r=>setTimeout(r,300));const exported=await fs.readFile(output,'utf8');assert(exported.includes(token));assert(exported.includes('single = 29937'));
    await page.locator('#tn-host').fill('unsaved.example.com');await page.locator('[data-nav="servers"]').click();await page.locator('.ember-dialog').waitFor();await page.keyboard.press('Escape');await page.locator('#vps-form').waitFor();assert.equal(await page.locator('#tn-host').inputValue(),'unsaved.example.com');
    await page.evaluate(()=>{formDirty=false;});await page.locator('#theme-toggle').click();await page.screenshot({path:path.join(__dirname,'../../Anteprime/20-vps-tunnels.png'),animations:'disabled'});
    assert.deepEqual(errors,[]);console.log('TUNNEL UI OK: sidebar, TLS public cert import, masked generated token, DPAPI disk persistence, per-server enable/cancel, offline waiting, secret-export cancel/confirm, dirty navigation, themes and languages.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
