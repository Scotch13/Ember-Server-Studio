const {Manager}=require('../lib/manager');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
  const reportPath=path.join(__dirname,'..','..','Anteprime','verifica-installazioni.json');
  const report=JSON.parse(await fs.readFile(reportPath,'utf8'));const m=await new Manager(report.root).init();
  for(const s of m.servers.filter(s=>s.type==='quilt')){
    await m.install(s.id);m.logs.delete(s.id);await m.start(s.id);
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{m.off('update',check);m.stop(s.id,true);reject(new Error('Timeout avvio Quilt'));},180000);const check=()=>{if(!m.runtime.has(s.id)){clearTimeout(timer);m.off('update',check);resolve();}};m.on('update',check);check();});
    const text=(m.logs.get(s.id)||[]).map(l=>l.text).join('\n'),ok=/agree.*EULA|EULA.*agree/i.test(text);
    console.log(ok?'PASS':'FAIL','Quilt',s.version,'loader',s.build);if(!ok){console.log(text.slice(-9000));process.exitCode=1;}
    const target=s.version==='1.21.1'?report.report.find(r=>r.type==='quilt'):report.modern.find(r=>r.type==='quilt');
    Object.assign(target,{build:s.build,ok:true,installed:true,launch:s.launch,launchVerified:ok,launcherVerified:ok,error:null});
  }
  await fs.writeFile(reportPath,JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
