const {test,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Manager}=require('../lib/manager');
let manager,root,id,folder;
beforeEach(async()=>{
  root=await fs.mkdtemp(require('../tools/test-env').tempPrefix('ember-files-unit-'));manager=await new Manager(root).init();
  id='files-test';manager.servers.push({id,name:'File fixture',type:'fabric',version:'1.21.1',installed:true});
  folder=manager.fileFolder(id);await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,'A.jar'),'contenuto-A');await fs.writeFile(path.join(folder,'B.jar'),'contenuto-B');await fs.writeFile(path.join(folder,'C.jar.disabled'),'contenuto-C');
});
afterEach(async()=>{await fs.rm(root,{recursive:true,force:true});});
test('Elenco include file attivi e disattivati, non file estranei o directory',async()=>{
  await fs.writeFile(path.join(folder,'note.txt'),'non-mod');await fs.mkdir(path.join(folder,'directory.jar'));
  const files=await manager.fileEntries(id);assert.deepEqual(files.map(f=>f.name),['A.jar','B.jar','C.jar.disabled']);
  assert.equal(files[2].displayName,'C.jar');assert.equal(files[2].enabled,false);assert.equal(files[0].size,11);
});
test('Disattiva e riattiva in blocco senza cambiare contenuto',async()=>{
  const result=await manager.manageFiles(id,['A.jar','B.jar'],'disable');assert.equal(result.changed.length,2);assert.equal(result.failed.length,0);
  assert.equal(await fs.readFile(path.join(folder,'A.jar.disabled'),'utf8'),'contenuto-A');
  const enabled=await manager.manageFiles(id,['A.jar.disabled','B.jar.disabled','C.jar.disabled'],'enable');assert.equal(enabled.changed.length,3);
  assert.equal(await fs.readFile(path.join(folder,'C.jar'),'utf8'),'contenuto-C');assert.equal((await manager.fileEntries(id)).every(f=>f.enabled),true);
});
test('Selezione mista: salta i file già nello stato richiesto',async()=>{
  const result=await manager.manageFiles(id,['A.jar','C.jar.disabled'],'enable');assert.equal(result.changed.length,1);assert.deepEqual(result.skipped,['A.jar']);
});
test('Conflitti: controlla tutto prima di modificare e non sovrascrive',async()=>{
  await fs.writeFile(path.join(folder,'B.jar.disabled'),'da-conservare');
  await assert.rejects(manager.manageFiles(id,['A.jar','B.jar'],'disable'),/Esiste già/);
  assert.equal(await fs.readFile(path.join(folder,'A.jar'),'utf8'),'contenuto-A');assert.equal(await fs.readFile(path.join(folder,'B.jar.disabled'),'utf8'),'da-conservare');assert.equal(manager.busy.has(id),false);
});
test('Rifiuta percorsi esterni, ADS, estensioni sbagliate e selezioni non valide',async()=>{
  for(const name of ['../A.jar','folder\\A.jar','C:/A.jar','A.jar:ads','A.txt','A.jar.disabled.disabled','A.jar\n'])await assert.rejects(manager.manageFiles(id,[name],'disable'),/Nome/);
  await assert.rejects(manager.manageFiles(id,[],'disable'),/Seleziona/);await assert.rejects(manager.manageFiles(id,['A.jar'],'invalid'),/Azione/);
  assert.equal(await fs.readFile(path.join(folder,'A.jar'),'utf8'),'contenuto-A');
});
test('Blocca modifiche durante esecuzione o altre operazioni',async()=>{
  manager.runtime.set(id,{status:'online'});await assert.rejects(manager.manageFiles(id,['A.jar'],'disable'),/Arresta/);
  manager.runtime.delete(id);manager.busy.add(id);await assert.rejects(manager.manageFiles(id,['A.jar'],'disable'),/Arresta/);
});
test('Elimina soltanto i file selezionati usando il Cestino, non mondi o backup',async()=>{
  const trash=path.join(root,'cestino-test');await fs.mkdir(trash);
  const world=path.join(manager.dir(id),'world');await fs.mkdir(world);await fs.writeFile(path.join(world,'level.dat'),'mondo');
  const result=await manager.manageFiles(id,['A.jar','C.jar.disabled'],'delete',file=>fs.rename(file,path.join(trash,path.basename(file))));
  assert.equal(result.changed.length,2);assert.equal(await fs.readFile(path.join(folder,'B.jar'),'utf8'),'contenuto-B');assert.equal(await fs.readFile(path.join(world,'level.dat'),'utf8'),'mondo');
  assert.equal(await fs.readFile(path.join(trash,'C.jar.disabled'),'utf8'),'contenuto-C');
});
test('Cestino fallito: segnala gli errori senza eliminazione permanente',async()=>{
  const result=await manager.manageFiles(id,['A.jar'],'delete',async()=>{throw new Error('Cestino non disponibile');});
  assert.equal(result.changed.length,0);assert.equal(result.failed.length,1);assert.ok(await fs.stat(path.join(folder,'A.jar')));
});
test('Rifiuta una cartella mod collegata fuori dal server',async()=>{
  const outside=path.join(root,'outside');await fs.mkdir(outside);const real=path.join(manager.dir(id),'mods-originali');await fs.rename(folder,real);await fs.symlink(outside,folder,'junction');
  await assert.rejects(manager.fileEntries(id),/sicura/);await assert.rejects(manager.manageFiles(id,['A.jar'],'disable'),/sicura/);
});
test('Usa la cartella plugins per Paper e Purpur',async()=>{
  manager.get(id).type='paper';assert.equal(path.basename(manager.fileFolder(id)),'plugins');await fs.mkdir(manager.fileFolder(id));await fs.writeFile(path.join(manager.fileFolder(id),'P.jar'),'plugin');
  await manager.manageFiles(id,['P.jar'],'disable');assert.ok(await fs.stat(path.join(manager.fileFolder(id),'P.jar.disabled')));
});
test('Import multiplo: valida tutto prima di copiare e conserva gli originali',async()=>{
  const incoming=path.join(root,'incoming');await fs.mkdir(incoming);const jar=path.join(incoming,'New.jar'),text=path.join(incoming,'invalid.txt');
  await fs.writeFile(jar,'nuova-mod');await fs.writeFile(text,'non-jar');
  await assert.rejects(manager.imports(id,[jar,text]),/file .jar/);
  await assert.rejects(fs.access(path.join(folder,'New.jar')));
  assert.equal(await manager.imports(id,[jar]),1);assert.equal(await fs.readFile(jar,'utf8'),'nuova-mod');assert.equal(await fs.readFile(path.join(folder,'New.jar'),'utf8'),'nuova-mod');
});
test('Import multiplo: conflitti e nomi doppi non causano copie parziali',async()=>{
  const one=path.join(root,'incoming-one'),two=path.join(root,'incoming-two');await fs.mkdir(one);await fs.mkdir(two);
  const fresh=path.join(one,'New.jar'),conflict=path.join(one,'A.jar'),duplicate=path.join(two,'New.jar');await fs.writeFile(fresh,'nuovo');await fs.writeFile(conflict,'da-non-sovrascrivere');await fs.writeFile(duplicate,'duplicato');
  await assert.rejects(manager.imports(id,[fresh,conflict]),/Esiste già/);await assert.rejects(fs.access(path.join(folder,'New.jar')));
  await assert.rejects(manager.imports(id,[fresh,duplicate]),/stesso nome/);await assert.rejects(fs.access(path.join(folder,'New.jar')));
  assert.equal(await fs.readFile(path.join(folder,'A.jar'),'utf8'),'contenuto-A');assert.equal(manager.busy.has(id),false);
});
test('Import file bloccato a server acceso e su cartelle collegate',async()=>{
  const source=path.join(root,'External.jar');await fs.writeFile(source,'esterno');
  manager.runtime.set(id,{status:'online'});await assert.rejects(manager.imports(id,[source]),/Arresta/);manager.runtime.delete(id);
  const outside=path.join(root,'linked');await fs.mkdir(outside);await fs.rename(folder,folder+'-original');await fs.symlink(outside,folder,'junction');
  await assert.rejects(manager.imports(id,[source]),/sicura/);assert.deepEqual(await fs.readdir(outside),[]);
});
