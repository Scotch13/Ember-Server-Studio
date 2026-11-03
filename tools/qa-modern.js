const {Manager}=require('../lib/manager');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
(async()=>{
  const reportPath=path.join(__dirname,'..','..','Anteprime','verifica-installazioni.json');
  const report=JSON.parse(await fs.readFile(reportPath,'utf8'));
  const m=await new Manager(report.root).init();const modern=[];
  for(const type of ['paper','fabric','forge','neoforge','quilt']){
    const versions=await m.catalog(type);const version=versions[0];
    const s={...m.validate({name:'QA recente '+type,type,version,ram:2,port:29799,maxPlayers:2,gamemode:'survival',difficulty:'normal'}),id:crypto.randomUUID(),installed:false};
    m.servers.push(s);await fs.mkdir(m.dir(s.id),{recursive:true});await m.writeProperties(s);await fs.writeFile(path.join(m.dir(s.id),'eula.txt'),'eula=false\n');
    try{
      await m.install(s.id);await m.start(s.id);
      await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{m.off('update',check);m.stop(s.id,true);reject(new Error('Timeout'));},180000);const check=()=>{if(!m.runtime.has(s.id)){clearTimeout(timer);m.off('update',check);resolve();}};m.on('update',check);check();});
      const lines=(m.logs.get(s.id)||[]).map(l=>l.text).join('\n'),ok=/agree.*EULA|EULA.*agree/i.test(lines);
      modern.push({type,version,build:s.build,java:s.javaMajor,installed:s.installed,launcherVerified:ok});console.log(ok?'PASS':'FAIL',type,version,'Java',s.javaMajor);
      if(!ok)console.log(lines.slice(-9000));
    }catch(e){console.log('FAIL',type,version,e.message);modern.push({type,version,error:e.message});}
  }
  report.modern=modern;await fs.writeFile(reportPath,JSON.stringify(report,null,2));
  if(modern.some(r=>!r.launcherVerified))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
