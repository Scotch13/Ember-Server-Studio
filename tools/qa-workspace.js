const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const net=require('node:net');
const {Manager}=require('../lib/manager');
const {Modrinth}=require('../lib/modrinth');
const {extract}=require('../lib/archive');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-workspace-ui-')),manager=await new Manager(path.join(root,'Dati')).init(),id='workspace-ui';
  const profile={name:'Workspace QA',type:'fabric',version:'1.21.1',ram:2,port:29934,maxPlayers:8,gamemode:'survival',difficulty:'normal'};
  manager.servers.push({...manager.validate(profile),id,installed:true});await fs.mkdir(path.join(manager.dir(id),'world'),{recursive:true});await fs.writeFile(path.join(manager.dir(id),'world','level.dat'),'important-world');await manager.writeProperties(manager.get(id));
  await fs.mkdir(path.join(manager.dir(id),'logs'));await fs.writeFile(path.join(manager.dir(id),'logs','latest.log'),'java.lang.OutOfMemoryError: Java heap space\n');await fs.writeFile(path.join(manager.dir(id),'whitelist.json'),JSON.stringify([{name:'Steve',uuid:'qa'}]));await manager.save();
  const modrinth=new Modrinth(manager),versions=(await modrinth.versions(id,'gvQqBUqZ')).filter(v=>v.type==='release');if(versions.length<2)throw new Error('Need two real compatible Modrinth releases');
  await modrinth.install(id,(await modrinth.plan(id,'gvQqBUqZ',versions.at(-1).id)).token);
  const oldName=(await manager.fileEntries(id))[0].name;
  const source=path.join(root,'source-server');await fs.mkdir(path.join(source,'world'),{recursive:true});await fs.writeFile(path.join(source,'world','level.dat'),'source-world');await fs.writeFile(path.join(source,'server.jar'),'fixture-launcher');await fs.writeFile(path.join(source,'server.properties'),'server-port=29935\ngamemode=creative\ndifficulty=easy\n');await fs.mkdir(path.join(source,'custom-java','bin'),{recursive:true});await fs.writeFile(path.join(source,'custom-java','bin','java.exe'),'runtime');
  const destination=path.join(root,'exported-server.zip'),app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});let listener;
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await app.evaluate(({dialog},{source,destination})=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[source]});dialog.showSaveDialog=async()=>({canceled:false,filePath:destination});},{source,destination});
    await page.locator('.quick-server').click();await page.locator('[data-tab="backups"]').click();await page.locator('#automation-form').waitFor();
    await page.locator('[name="enabled"]').check();await page.locator('#ws-intervalMinutes').fill('5');await page.locator('#ws-keep').fill('2');await page.locator('#automation-form button[type="submit"]').click();
    const config=await page.evaluate(()=>window.ember.call('automation',selected));if(!config.enabled||config.keep!==2||!config.beforeMods)throw new Error('Automation settings not saved');
    await page.locator('[data-tab="tools"]').click();await page.locator('[data-workspace="diagnostics"]').click();await page.getByText('RAM insufficiente',{exact:true}).waitFor();
    await page.locator('[data-workspace="select-player"]').first().click();if(await page.locator('#ws-player').inputValue()!=='Steve')throw new Error('Player selection failed');
    if(!await page.locator('#player-management button[type="submit"]').isDisabled())throw new Error('Offline player actions enabled');
    listener=net.createServer();await new Promise(resolve=>listener.listen(29934,'127.0.0.1',resolve));await page.locator('[data-workspace="connection"]').click();await page.locator('#connection-result').getByText('Raggiungibile',{exact:true}).first().waitFor();await new Promise(resolve=>listener.close(resolve));listener=null;
    const out=path.join(__dirname,'..','..','Anteprime');await page.screenshot({path:path.join(out,'19-workspace-tools-dark.png'),animations:'disabled'});
    await page.locator('[data-tab="files"]').click();await page.locator('[data-workspace="updates"]').click();await page.locator('[data-workspace="update-mod"]').waitFor();await page.locator('[data-workspace="update-mod"]').click();await page.locator('.ember-dialog .button').last().click();
    await page.waitForFunction(version=>document.querySelector('.modrinth-origin')?.textContent.includes(version),versions[0].version);
    const updated=JSON.parse(await fs.readFile(path.join(manager.dir(id),'.ember-modrinth.json'),'utf8'));if(updated.gvQqBUqZ.versionId!==versions[0].id)throw new Error('Real Modrinth upgrade failed');
    const backups=await manager.backups(id);if(!backups.length)throw new Error('Update did not create safety backup');const extracted=path.join(root,'safety-backup');await extract(path.join(manager.root,'backups',id,backups[0].name),{dir:extracted});await fs.access(path.join(extracted,'mods',oldName));
    await page.locator('.nav[data-nav="servers"]').click();await page.locator('[data-workspace="import"]').click();await page.locator('.ws-import-dialog').waitFor();await page.locator('.ember-dialog .button').last().click();await page.getByText('Completa i campi e conferma EULA e server fermo.',{exact:true}).waitFor();
    await page.locator('#ws-name').fill('Imported workspace');await page.locator('#ws-version').fill('1.21.1');await page.locator('#ws-stopped').check();await page.locator('#ws-eula').check();await page.locator('.ember-dialog .button').last().click();await page.getByRole('heading',{name:'Imported workspace',exact:true}).waitFor();
    if(await fs.readFile(path.join(source,'world','level.dat'),'utf8')!=='source-world')throw new Error('Import changed original world');
    const imported=await page.evaluate(()=>state.servers.find(s=>s.id===selected));if(imported.gamemode!=='creative'||imported.difficulty!=='easy')throw new Error('Imported settings not preserved');
    await page.locator('[data-tab="tools"]').click();await page.locator('[data-workspace="export"]').click();await page.getByText('Pacchetto server esportato.',{exact:true}).waitFor();await fs.access(destination);
    const portable=path.join(root,'portable');await extract(destination,{dir:portable});await fs.access(path.join(portable,'world','level.dat'));await assertMissing(path.join(portable,'custom-java'));
    await page.locator('#theme-toggle').click();await page.screenshot({path:path.join(out,'19-workspace-tools-light.png'),animations:'disabled'});
    for(const language of ['it','en','es','fr','de']){await page.evaluate(language=>EmberLocale.set(language),language);if(await page.locator('[data-workspace="diagnostics"]').textContent()==='')throw new Error('Missing translated tools');}
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('WORKSPACE LIVE UI OK: backup settings, diagnostics, player lists, TCP probe, real Modrinth upgrade with recoverable backup, validated import preserving source/settings, portable export, themes and five languages.');
  }finally{if(listener)listener.close();await app.close();}
  async function assertMissing(file){try{await fs.access(file);throw new Error('Unexpected exported runtime');}catch(e){if(e.code!=='ENOENT')throw e;}}
})().catch(e=>{console.error(e);process.exitCode=1;});
