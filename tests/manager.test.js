const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Manager, javaRequired, neoMinecraft, parseProperties } = require('../lib/manager');
const TEMP = require('../tools/test-env').tempDirectory;
let manager, root;
const profile = (overrides={}) => ({name:'Mondo di prova',type:'fabric',version:'1.21.1',ram:2,port:29565,maxPlayers:20,gamemode:'survival',difficulty:'normal',motd:'Ciao mondo',seed:'',onlineMode:true,whitelist:false,pvp:true,...overrides});
beforeEach(async()=>{root=await fs.mkdtemp(path.join(TEMP,'ember-unit-'));manager=await new Manager(root).init();manager.install=async()=>{};});
afterEach(async()=>{await fs.rm(root,{recursive:true,force:true});});
test('Versioni Java storiche e moderne',()=>{
  assert.equal(javaRequired('1.16.5'),8);assert.equal(javaRequired('1.17.1'),16);assert.equal(javaRequired('1.20.4'),17);assert.equal(javaRequired('1.20.5'),21);assert.equal(javaRequired('1.21.1'),21);
});
test('Mappatura NeoForge classica e nuova numerazione 26.x',()=>{
  assert.equal(neoMinecraft('21.1.265'),'1.21.1');assert.equal(neoMinecraft('21.0.1'),'1.21');
  assert.equal(neoMinecraft('26.3.0.101'),'26.3');assert.equal(neoMinecraft('26.1.2.125'),'26.1.2');assert.equal(javaRequired('26.3'),25);
});
test('Rifiuta EULA non accettata e dati non validi',async()=>{
  await assert.rejects(manager.create(profile()),/EULA/);
  assert.throws(()=>manager.validate(profile({port:0})),/Porta/);
  assert.throws(()=>manager.validate(profile({name:'\n'})),/nome/);
  assert.throws(()=>manager.validate(profile({ram:-4})),/RAM/);
  assert.throws(()=>manager.validate(profile({version:'../../x'})),/Versione/);
  assert.throws(()=>manager.validate(profile({type:'custom'})),/Software/);
});
test('Crea, conserva le proprietà avanzate e ricarica i dati',async()=>{
  const id=await manager.create({...profile(),eula:true});
  const file=path.join(manager.dir(id),'server.properties');
  await fs.appendFile(file,'view-distance=7\n');
  await manager.update(id,{motd:'Un mondo è qui',port:29566});
  const props=parseProperties(await fs.readFile(file,'utf8'));
  assert.equal(props['view-distance'],'7');assert.equal(props['server-port'],'29566');assert.match(props.motd,/\\u00e8/);
  const reload=await new Manager(root).init();assert.equal(reload.get(id).port,29566);
  assert.equal(reload.snapshot().servers[0].status,'offline');
});
test('Porta duplicata non consentita',async()=>{
  await manager.create({...profile(),eula:true});
  await assert.rejects(manager.create({...profile(),eula:true}),/porta/);
});
test('Scritture simultanee non corrompono il database',async()=>{
  await Promise.all(Array.from({length:25},()=>manager.save()));
  assert.deepEqual(JSON.parse(await fs.readFile(manager.db,'utf8')),[]);
});
test('Backup e ripristino completo con salvataggio di sicurezza',async()=>{
  const id=await manager.create({...profile(),eula:true});
  const s=manager.get(id);s.installed=true;s.build='build-originale';s.javaMajor=21;s.launch=['-jar','server-originale.jar','nogui'];
  const world=path.join(manager.dir(id),'world');await fs.mkdir(world);await fs.writeFile(path.join(world,'level.dat'),'mondo originale');
  const zip=await manager.backup(id);assert.ok((await fs.stat(zip)).size>100);
  await fs.writeFile(path.join(world,'level.dat'),'mondo modificato');
  s.build='build-nuova';s.launch=['-jar','server-nuovo.jar','nogui'];
  await manager.restore(id,path.basename(zip));
  assert.equal(await fs.readFile(path.join(world,'level.dat'),'utf8'),'mondo originale');
  assert.equal(s.build,'build-originale');assert.deepEqual(s.launch,['-jar','server-originale.jar','nogui']);
  assert.equal((await manager.backups(id)).length,2);
  await assert.rejects(manager.restore(id,'../invalido.zip'),/non valido/);
});
test('Server attivo: vietati backup, impostazioni e archiviazione',async()=>{
  const id=await manager.create({...profile(),eula:true});manager.runtime.set(id,{status:'online',players:new Set()});
  await assert.rejects(manager.backup(id),/Arresta/);await assert.rejects(manager.update(id,{}),/Arresta/);await assert.rejects(manager.remove(id),/Arresta/);
});
test('Importa .jar senza sovrascrivere file esistenti',async()=>{
  const id=await manager.create({...profile(),eula:true});const file=path.join(root,'demo.jar');await fs.writeFile(file,'test jar');
  assert.equal(await manager.imports(id,[file]),1);assert.deepEqual(await manager.files(id),['demo.jar']);
  await assert.rejects(manager.imports(id,[file]),/Esiste già/);
});
test('Archivia senza cancellare mondi o backup',async()=>{
  const id=await manager.create({...profile(),eula:true});await manager.backup(id);await manager.remove(id);
  assert.equal(manager.servers.length,0);assert.ok(await fs.stat(path.join(root,'archivio',id,'server.properties')));assert.equal((await fs.readdir(path.join(root,'backups',id))).length,1);
});
test('Rifiuta comandi multilinea o server offline',()=>{
  assert.throws(()=>manager.command('x','help'),/non è in esecuzione/);
  manager.runtime.set('x',{status:'online'});assert.throws(()=>manager.command('x','say ciao\nstop'),/non valido/);
});
test('Elimina via Cestino, conserva i backup e rimuove il profilo',async()=>{
  const id=await manager.create({...profile(),eula:true});await manager.backup(id);manager.log(id,'test');
  const source=manager.dir(id),recycled=path.join(root,'cestino-test');
  await manager.deleteServer(id,async folder=>{assert.equal(folder,source);await fs.rename(folder,recycled);});
  assert.equal(manager.servers.length,0);assert.equal(manager.logs.has(id),false);
  assert.ok(await fs.stat(path.join(recycled,'server.properties')));
  assert.equal((await fs.readdir(path.join(root,'backups',id))).length,1);
  assert.equal((await new Manager(root).init()).servers.length,0);
});
test('Se il Cestino fallisce non cancella file né profilo',async()=>{
  const id=await manager.create({...profile(),eula:true});
  await assert.rejects(manager.deleteServer(id,async()=>{throw new Error('Cestino non disponibile');}),/Cestino/);
  assert.ok(manager.get(id));assert.ok(await fs.stat(manager.dir(id)));assert.equal(manager.busy.has(id),false);
});
test('Eliminazione bloccata per server attivi o operazioni in corso',async()=>{
  const id=await manager.create({...profile(),eula:true});let called=false;
  const recycle=async()=>{called=true;};
  manager.runtime.set(id,{status:'online',players:new Set()});await assert.rejects(manager.deleteServer(id,recycle),/Arresta/);
  manager.runtime.delete(id);manager.busy.add(id);await assert.rejects(manager.deleteServer(id,recycle),/Arresta/);
  assert.equal(called,false);assert.ok(manager.get(id));
});
test('Log limitati a 1600 righe, codici ANSI rimossi',()=>{
  for(let n=0;n<1700;n++)manager.log('x','\x1b[31m'+n);
  assert.equal(manager.logs.get('x').length,1600);assert.equal(manager.logs.get('x')[0].text,'100');
});
