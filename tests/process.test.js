const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {Manager}=require('../lib/manager');
test('Processo Java nascosto: avvio, stato online, giocatori, comando e stop',{timeout:45000},async()=>{
  const root=await fs.mkdtemp(require('../tools/test-env').tempPrefix('ember-process-'));
  const {java,javac}=require('../tools/test-env');
  const source=`import java.io.*; public class FakeServer {public static void main(String[] a) throws Exception {System.out.println("[Server thread/INFO]: Done (0.1s)! For help, type help");System.out.println("[Server thread/INFO]: TestPlayer joined the game");BufferedReader r=new BufferedReader(new InputStreamReader(System.in));String line;while((line=r.readLine())!=null){if(line.equals("stop")){System.out.println("Saving worlds");break;}System.out.println("ECHO: "+line);}}}`;
  await fs.writeFile(path.join(root,'FakeServer.java'),source);
  const compile=spawnSync(javac,[path.join(root,'FakeServer.java')],{windowsHide:true,encoding:'utf8'});assert.equal(compile.status,0,compile.stderr);
  const m=await new Manager(root).init();const id='process-test';
  m.servers.push({id,name:'Process test',type:'vanilla',version:'1.20.1',ram:1,port:29678,maxPlayers:4,installed:true,javaMajor:17,launch:['-cp',root,'FakeServer']});
  await fs.mkdir(m.dir(id),{recursive:true});m.java=async()=>java;
  const until=fn=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{m.off('update',check);reject(new Error('Attesa processo scaduta'));},15000);const check=()=>{if(fn()){clearTimeout(timeout);m.off('update',check);resolve();}};m.on('update',check);check();});
  try{
    await m.start(id);await until(()=>m.runtime.get(id)?.players.has('TestPlayer'));
    assert.equal(m.snapshot().servers[0].status,'online');assert.deepEqual(m.snapshot().servers[0].players,['TestPlayer']);
    m.command(id,'say Ciao');m.stop(id);await until(()=>!m.runtime.has(id));
    assert.ok(m.logs.get(id).some(l=>l.text==='ECHO: say Ciao'));assert.equal(m.snapshot().servers[0].status,'offline');
  }finally{if(m.runtime.has(id))m.stop(id,true);await fs.rm(root,{recursive:true,force:true});}
});
