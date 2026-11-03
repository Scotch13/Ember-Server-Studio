const {Manager}=require('../lib/manager');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
  const reportFile=path.join(__dirname,'..','..','Anteprime','verifica-installazioni.json');
  const report=JSON.parse(await fs.readFile(reportFile,'utf8'));
  const manager=await new Manager(report.root).init();
  const quilt=manager.servers.find(s=>s.type==='quilt');
  if(!quilt.installed){await manager.install(quilt.id);const i=report.report.findIndex(s=>s.type==='quilt');report.report[i]={type:'quilt',version:quilt.version,build:quilt.build,ok:true,launch:quilt.launch};}
  for(const s of manager.servers){
    await fs.writeFile(path.join(manager.dir(s.id),'eula.txt'),'eula=false\n');
    let timer;
    try{
      await manager.start(s.id);
      await new Promise((resolve,reject)=>{
        const check=()=>{if(!manager.runtime.has(s.id)){clearTimeout(timer);manager.off('update',check);resolve();}};
        timer=setTimeout(()=>{manager.off('update',check);manager.stop(s.id,true);reject(new Error('Avvio non terminato entro 180 secondi'));},180000);manager.on('update',check);check();
      });
      const lines=(manager.logs.get(s.id)||[]).map(l=>l.text).join('\n');
      const ok=/agree.*EULA|EULA.*agree/i.test(lines);
      if(!ok)console.log(lines.slice(-9000));
      console.log(ok?'PASS':'FAIL',s.type,'launcher + arresto previsto con EULA non accettata');
      report.report.find(r=>r.type===s.type).launchVerified=ok;
    }catch(e){console.log('FAIL',s.type,e.message);report.report.find(r=>r.type===s.type).launchError=e.message;}
    finally{clearTimeout(timer);}
  }
  report.date=new Date().toISOString();await fs.writeFile(reportFile,JSON.stringify(report,null,2));
  if(report.report.some(r=>!r.launchVerified))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
