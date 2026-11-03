const {test,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const net=require('node:net');
const {Manager}=require('../lib/manager');
const {Workspace,diagnose}=require('../lib/workspace');
const {extract}=require('../lib/archive');
let root,manager,workspace,id;
beforeEach(async()=>{
  root=await fs.mkdtemp(require('../tools/test-env').tempPrefix('ember-workspace-unit-'));manager=await new Manager(path.join(root,'Dati')).init();id='workspace-test';
  manager.servers.push({...manager.validate({name:'Workspace',type:'fabric',version:'1.21.1',ram:2,port:29931,maxPlayers:10,gamemode:'survival',difficulty:'normal'}),id,installed:true});
  await fs.mkdir(path.join(manager.dir(id),'world'),{recursive:true});await fs.writeFile(path.join(manager.dir(id),'world','level.dat'),'world-data');await manager.writeProperties(manager.get(id));await manager.save();
  workspace=await new Workspace(manager,async file=>fs.rename(file,path.join(root,'trash-'+path.basename(file)))).init();
});
afterEach(async()=>{workspace.close();await fs.rm(root,{recursive:true,force:true});});
test('Scheduled backups wait for stopped server and recycle only old automatic copies',async()=>{
  await workspace.setConfig(id,{enabled:true,intervalMinutes:5,keep:1,beforeMods:true});
  const folder=path.join(manager.root,'backups',id);await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'manual.zip'),'manual');
  manager.runtime.set(id,{});await workspace.tick(Date.now()+301000);assert.equal((await manager.backups(id)).length,1);assert.match(workspace.config(id).status,/attesa/);
  manager.runtime.delete(id);await workspace.tick(Date.now()+301000);assert.equal((await manager.backups(id)).length,2);
  await workspace.tick(Date.now()+700000);assert.equal((await manager.backups(id)).length,2);assert.equal(await fs.readFile(path.join(folder,'manual.zip'),'utf8'),'manual');
  assert.equal((await fs.readdir(root)).filter(name=>name.startsWith('trash-')).length,1);
});
test('Pre-mod backups configurable, automation persists and settings are validated',async()=>{
  await workspace.beforeMods(id);assert.equal((await manager.backups(id)).length,1);
  await workspace.setConfig(id,{enabled:false,intervalMinutes:30,keep:3,beforeMods:false});await workspace.beforeMods(id);assert.equal((await manager.backups(id)).length,1);
  assert.equal((await new Workspace(manager,()=>{}).init()).config(id).beforeMods,false);
  await assert.rejects(workspace.setConfig(id,{intervalMinutes:0,keep:-1}),/non valido/);
});
test('Persistent history bounded per server and can be cleared',async()=>{
  for(let i=0;i<105;i++)await workspace.remember(id,'say '+i);
  assert.equal(workspace.history(id).length,100);assert.equal(workspace.history(id)[0],'say 5');
  assert.equal((await new Workspace(manager,()=>{}).init()).history(id).at(-1),'say 104');
  await workspace.clearHistory(id);assert.deepEqual(workspace.history(id),[]);
});
test('Diagnostics find likely causes locally and reject linked log folders',async()=>{
  await fs.mkdir(path.join(manager.dir(id),'logs'));await fs.writeFile(path.join(manager.dir(id),'logs','latest.log'),'java.lang.OutOfMemoryError: Java heap space\nFailed to bind to port');
  const report=await workspace.diagnostics(id);assert.equal(report.findings.length,2);assert.ok(report.sources.includes('logs/latest.log'));
  assert.equal(diagnose('UnsupportedClassVersionError')[0].title,'Versione Java incompatibile');
  await fs.rename(path.join(manager.dir(id),'logs'),path.join(manager.dir(id),'logs-original'));await fs.symlink(root,path.join(manager.dir(id),'logs'),'junction');await assert.rejects(workspace.diagnostics(id),/non sicura/);
});
test('Player lists and actions use allowlisted commands and safe nicknames',async()=>{
  await fs.writeFile(path.join(manager.dir(id),'whitelist.json'),JSON.stringify([{name:'Steve',uuid:'test'}]));
  assert.deepEqual((await workspace.players(id)).whitelist,['Steve']);assert.equal(workspace.playerCommand(id,'Steve','op'),'op Steve');
  assert.throws(()=>workspace.playerCommand(id,'Steve\nstop','ban'),/Nickname/);assert.throws(()=>workspace.playerCommand(id,'Steve','stop'),/Azione/);
});
test('Connection probe reports local TCP without claiming Internet reachability',async()=>{
  const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));manager.get(id).port=server.address().port;
  try{const report=await workspace.connection(id);assert.equal(report.local.reachable,true);assert.equal(report.internetVerified,false);}finally{await new Promise(resolve=>server.close(resolve));}
});
test('Import copies a stopped server without modifying the source and export excludes Java/logs/temp',async()=>{
  const source=path.join(root,'source');await fs.mkdir(path.join(source,'world'),{recursive:true});await fs.writeFile(path.join(source,'world','level.dat'),'original-world');await fs.writeFile(path.join(source,'server.jar'),'launcher');await fs.writeFile(path.join(source,'server.properties'),'server-port=29932\ngamemode=creative\n');
  const plan=await workspace.inspectImport(source),input={...manager.get(id),name:'Imported',port:29932,launcher:'server.jar',eula:true,stopped:true};
  await assert.rejects(workspace.importServer(plan.token,{...input,eula:false}),/EULA/);
  const imported=await workspace.importServer(plan.token,input);assert.equal(await fs.readFile(path.join(source,'world','level.dat'),'utf8'),'original-world');assert.equal(manager.get(imported).installed,true);
  const dir=manager.dir(imported);await fs.mkdir(path.join(dir,'logs'));await fs.writeFile(path.join(dir,'logs','latest.log'),'secret-log');await fs.mkdir(path.join(dir,'my-java','bin'),{recursive:true});await fs.writeFile(path.join(dir,'my-java','bin','java.exe'),'runtime');await fs.writeFile(path.join(dir,'download.part'),'temporary');
  const zip=path.join(root,'portable.zip');await workspace.exportServer(imported,zip);const extracted=path.join(root,'extracted');await extract(zip,{dir:extracted});
  assert.equal(await fs.readFile(path.join(extracted,'world','level.dat'),'utf8'),'original-world');await assert.rejects(fs.access(path.join(extracted,'logs')));await assert.rejects(fs.access(path.join(extracted,'my-java')));await assert.rejects(fs.access(path.join(extracted,'download.part')));await fs.access(path.join(extracted,'ember-profile.json'));
});
test('Import rejects linked directories and managed sources; export blocks running servers',async()=>{
  await assert.rejects(workspace.inspectImport(manager.dir(id)),/esterna/);
  const source=path.join(root,'source');await fs.mkdir(source);await fs.writeFile(path.join(source,'server.jar'),'launcher');await fs.writeFile(path.join(source,'server.properties'),'server-port=29933');await fs.symlink(root,path.join(source,'mods'),'junction');
  const plan=await workspace.inspectImport(source);await assert.rejects(workspace.importServer(plan.token,{...manager.get(id),name:'Bad import',port:29933,launcher:'server.jar',eula:true,stopped:true}),/collegamenti/);assert.equal(manager.servers.length,1);
  manager.runtime.set(id,{});await assert.rejects(workspace.exportServer(id,path.join(root,'server.zip')),/Arresta/);
});
