const { Manager } = require('../lib/manager');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-live-'));
  const manager=await new Manager(root).init();
  console.log('Cartella test isolata:',root);
  const report=[];
  manager.on('log',l=>{if(/ERRORE|failed|error|completata|Preparazione Java|Installazione .*Minecraft/i.test(l.text))console.log(l.text);});
  for(const type of ['vanilla','paper','purpur','fabric','forge','neoforge','quilt']){
    const start=Date.now();
    const s={...manager.validate({name:'QA '+type,type,version:'1.21.1',ram:2,port:29565,maxPlayers:2,gamemode:'survival',difficulty:'normal'}),id:crypto.randomUUID(),installed:false,createdAt:new Date().toISOString()};
    manager.servers.push(s);await fs.mkdir(manager.dir(s.id),{recursive:true});await manager.writeProperties(s);
    // Non accetta la EULA e non avvia Minecraft: verifica soltanto gli installer ufficiali.
    await fs.writeFile(path.join(manager.dir(s.id),'eula.txt'),'eula=false\n');
    try{
      const versions=await manager.catalog(type);if(!versions.includes(s.version))throw new Error('Versione test non nel catalogo');
      await manager.install(s.id);
      report.push({type,version:s.version,build:s.build,ok:s.installed,launch:s.launch,seconds:Math.round((Date.now()-start)/1000)});
      console.log('PASS',type,JSON.stringify(s.launch));
    }catch(e){report.push({type,ok:false,error:e.message});console.log('FAIL',type,e.message);}
  }
  await fs.mkdir(path.join(__dirname,'..','..','Anteprime'),{recursive:true});
  await fs.writeFile(path.join(__dirname,'..','..','Anteprime','verifica-installazioni.json'),JSON.stringify({date:new Date().toISOString(),root,report},null,2));
  console.log(JSON.stringify(report,null,2));
  if(report.some(r=>!r.ok))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
