const {test,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {Manager}=require('../lib/manager');
const {Modrinth}=require('../lib/modrinth');
let manager,root,modrinth,records,bytes,requests;
beforeEach(async()=>{
  root=await fs.mkdtemp(require('../tools/test-env').tempPrefix('ember-modrinth-unit-'));manager=await new Manager(root).init();
  manager.servers.push({id:'test',name:'Test',type:'fabric',version:'1.21.1'});await fs.mkdir(manager.dir('test'),{recursive:true});
  bytes=Buffer.from('jar-test');requests=[];
  const version=(id,project)=>({id,project_id:project,version_number:'1.0',loaders:['fabric'],game_versions:['1.21.1'],dependencies:[],files:[{primary:true,filename:project+'.jar',size:bytes.length,url:'https://cdn.modrinth.com/data/'+project,hashes:{sha512:crypto.createHash('sha512').update(bytes).digest('hex')}}]});
  records={main:version('vmain','main'),dep:version('vdep','dep')};
  records.main.dependencies=[{dependency_type:'required',project_id:'dep',version_id:'vdep'}];
  modrinth=new Modrinth(manager,async url=>{
    requests.push(url);
    if(url.startsWith('https://cdn.modrinth.com/'))return new Response(bytes);
    const route=url.replace('https://api.modrinth.com/v2','');
    if(route.startsWith('/search'))return Response.json({hits:[],total_hits:0});
    const match=/^\/project\/(main|dep)(\/version)?/.exec(route);
    if(match)return Response.json(match[2]?[records[match[1]],...(match[1]==='main'&&records.old?[records.old]:[])]:{id:match[1],title:match[1],project_type:'mod',server_side:'required',icon_url:'https://cdn.modrinth.com/data/'+match[1]+'/icon.png'});
    if(route==='/version/vdep')return Response.json(records.dep);
    if(route==='/version/vmain')return Response.json(records.main);
    if(route==='/version/vold')return Response.json(records.old);
    throw new Error('Unexpected route '+route);
  });
});
afterEach(async()=>{await fs.rm(root,{recursive:true,force:true});});
test('Modrinth resolves required dependencies, verifies hashes and tracks installed files',async()=>{
  const plan=await modrinth.plan('test','main');assert.deepEqual(plan.files.map(f=>f.projectId),['dep','main']);
  assert.equal((await modrinth.install('test',plan.token)).installed,2);
  const entries=await modrinth.entries('test');assert.equal(entries.length,2);assert.equal(entries[0].modrinth.projectId,'dep');
  assert.equal((await modrinth.install('test',(await modrinth.plan('test','main')).token)).installed,0);
});
test('Modrinth blocks incompatible loader, game version and running server',async()=>{
  records.main.loaders=['forge'];await assert.rejects(modrinth.plan('test','main'),/Nessuna versione/);
  manager.runtime.set('test',{});await assert.rejects(modrinth.plan('test','main'),/Arresta/);
});
test('Modrinth rejects unsafe filenames and unofficial download hosts',async()=>{
  records.main.files[0].filename='../unsafe.jar';await assert.rejects(modrinth.plan('test','main'),/File Modrinth/);
  modrinth.cache.clear();records.main.files[0].filename='safe.jar';records.main.files[0].url='https://evil.test/payload.jar';await assert.rejects(modrinth.plan('test','main'),/File Modrinth/);
});
test('Modrinth checksum failure leaves no partially installed dependencies',async()=>{
  const plan=await modrinth.plan('test','main');bytes=Buffer.from('tampered');await assert.rejects(modrinth.install('test',plan.token),/SHA-512/);
  assert.deepEqual(await manager.fileEntries('test'),[]);assert.equal(manager.busy.has('test'),false);
});
test('Modrinth preserves conflicts and blocks disabled dependencies',async()=>{
  const folder=manager.fileFolder('test');await fs.mkdir(folder);await fs.writeFile(path.join(folder,'main.jar'),'user-file');
  await assert.rejects(modrinth.plan('test','main'),/conflitto/);assert.equal(await fs.readFile(path.join(folder,'main.jar'),'utf8'),'user-file');
  await fs.unlink(path.join(folder,'main.jar'));await fs.writeFile(path.join(folder,'dep.jar.disabled'),bytes);
  await assert.rejects(modrinth.plan('test','main'),/disattivata/);
});
test('Modrinth plan cannot be reused or installed after server version changes',async()=>{
  const plan=await modrinth.plan('test','main');manager.get('test').version='1.20.1';await assert.rejects(modrinth.install('test',plan.token),/scaduto/);
  manager.get('test').version='1.21.1';await assert.rejects(modrinth.install('test',plan.token),/scaduto/);
});
test('Search caches responses and filters server-side version and loader',async()=>{
  await modrinth.search({query:'hello',serverId:'test'});await modrinth.search({query:'hello',serverId:'test'});
  assert.equal(requests.length,1);const facets=JSON.parse(new URL(requests[0]).searchParams.get('facets'));
  assert.ok(facets.flat().includes('categories:fabric'));assert.ok(facets.flat().includes('versions:1.21.1'));
});
test('Backup deletion validates paths, preserves world, and uses recycle callback',async()=>{
  const folder=path.join(root,'backups','test');await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'one.zip'),'backup');
  await assert.rejects(manager.deleteBackup('test','../one.zip',()=>{}),/Nome backup/);
  await assert.rejects(manager.deleteBackup('test','one.zip',async()=>{throw new Error('trash failed');}),/trash failed/);await fs.access(path.join(folder,'one.zip'));
  await manager.deleteBackup('test','one.zip',file=>fs.rename(file,path.join(root,'recycled.zip')));await fs.access(path.join(root,'recycled.zip'));
});
test('Modrinth stores project icons and recovers icons for earlier installations',async()=>{
  await modrinth.install('test',(await modrinth.plan('test','main')).token);
  let entries=await modrinth.entries('test');assert.equal(entries[0].modrinth.iconUrl,'https://cdn.modrinth.com/data/dep/icon.png');
  const filename=path.join(manager.dir('test'),'.ember-modrinth.json'),metadata=JSON.parse(await fs.readFile(filename,'utf8'));
  delete metadata.main.iconUrl;await fs.writeFile(filename,JSON.stringify(metadata));
  entries=await modrinth.entries('test');assert.equal(entries.find(f=>f.modrinth.projectId==='main').modrinth.iconUrl,'https://cdn.modrinth.com/data/main/icon.png');
});
test('Search only exposes icons from the official Modrinth CDN',async()=>{
  const client=new Modrinth(manager,async()=>Response.json({total_hits:3,hits:[
    {icon_url:'https://cdn.modrinth.com/data/test/icon.png'},
    {icon_url:'https://cdn.modrinth.com.evil.test/icon.png'},
    {icon_url:'javascript:alert(1)'}
  ]}));
  assert.deepEqual((await client.search()).hits.map(hit=>hit.iconUrl),['https://cdn.modrinth.com/data/test/icon.png','','']);
});
test('Version selector filters compatibility and installs the explicitly selected older release',async()=>{
  records.old={...structuredClone(records.main),id:'vold',version_number:'0.9'};
  const versions=await modrinth.versions('test','main');assert.deepEqual(versions.map(v=>v.id),['vmain','vold']);
  const plan=await modrinth.plan('test','main','vold');assert.equal(plan.files.find(f=>f.projectId==='main').versionId,'vold');
  await modrinth.install('test',plan.token);assert.equal((await modrinth.entries('test')).find(f=>f.modrinth.projectId==='main').modrinth.version,'0.9');
});
test('Explicit versions reject another project, incompatible Minecraft, and invalid IDs',async()=>{
  await assert.rejects(modrinth.plan('test','main','vdep'),/Nessuna versione/);
  await assert.rejects(modrinth.plan('test','main','../unsafe'),/Versione Modrinth/);
  records.main.game_versions=['1.20.1'];modrinth.cache.clear();
  assert.deepEqual(await modrinth.versions('test','main'),[]);
  await assert.rejects(modrinth.plan('test','main','vmain'),/Nessuna versione/);
});
test('Modrinth update detects stable releases, replaces tracked files and rolls back failed copies',async()=>{
  const original=Buffer.from(bytes);records.old={...structuredClone(records.main),id:'vold',version_number:'0.9',version_type:'release',date_published:'2025-01-01T00:00:00Z'};
  await modrinth.install('test',(await modrinth.plan('test','main','vold')).token);
  bytes=Buffer.from('new-main-jar');records.main.version_type='release';records.main.date_published='2026-01-01T00:00:00Z';records.main.files[0].size=bytes.length;records.main.files[0].hashes.sha512=crypto.createHash('sha512').update(bytes).digest('hex');modrinth.cache.clear();
  const updates=await modrinth.updates('test');assert.equal(updates.find(u=>u.projectId==='main').versionId,'vmain');
  const plan=await modrinth.plan('test','main','vmain',{update:true}),copy=fs.copyFile,target=path.join(manager.fileFolder('test'),'main.jar');
  fs.copyFile=async(from,to,...args)=>{if(to===target)throw new Error('Simulated disk failure');return copy(from,to,...args);};
  try{await assert.rejects(modrinth.install('test',plan.token),/disk failure/);}finally{fs.copyFile=copy;}
  assert.deepEqual(await fs.readFile(target),original);assert.equal((await modrinth.entries('test')).find(f=>f.modrinth.projectId==='main').modrinth.versionId,'vold');
  await modrinth.install('test',(await modrinth.plan('test','main','vmain',{update:true})).token);
  assert.deepEqual(await fs.readFile(target),bytes);assert.equal((await modrinth.entries('test')).find(f=>f.modrinth.projectId==='main').modrinth.versionId,'vmain');
});
