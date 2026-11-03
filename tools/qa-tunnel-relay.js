const fs=require('node:fs/promises'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process'),{EventEmitter}=require('node:events'),{Tunnels}=require('../lib/tunnels');
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return server.address().port;}
async function freePort(){const s=net.createServer(),p=await listen(s);await new Promise(r=>s.close(r));return p;}
async function until(check,timeout=18000){const start=Date.now();while(!check()){if(Date.now()-start>timeout)throw Error('Timed out');await new Promise(r=>setTimeout(r,100));}}
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-frp-relay-')),key=path.join(root,'key.pem'),cert=path.join(root,'cert.pem');
  execFileSync(require('./test-env').openssl,['req','-x509','-newkey','rsa:2048','-nodes','-days','2','-keyout',key,'-out',cert,'-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{windowsHide:true,stdio:'ignore'});
  const pem=await fs.readFile(cert,'utf8'),control=await freePort(),remote=await freePort(),echo=net.createServer(s=>s.pipe(s)),local=await listen(echo),manager=new EventEmitter();
  Object.assign(manager,{root,servers:[{id:'qa',port:local}],runtime:new Map(),get:id=>manager.servers.find(s=>s.id===id)});
  const storage={isEncryptionAvailable:()=>true,encryptString:s=>Buffer.from(s),decryptString:b=>b.toString()},t=await new Tunnels(manager,storage).init();let relay,relayLog='';
  try{
    await t.saveVps({host:'127.0.0.1',controlPort:control,publicHost:'127.0.0.1',tlsName:'localhost',caPem:pem,token:'real_test_token_'.repeat(3)});await t.setServer('qa',{enabled:true,remotePort:remote});
    let template=t.serverTemplate().replaceAll('/etc/frp/server.crt',cert.replaceAll('\\','/')).replaceAll('/etc/frp/server.key',key.replaceAll('\\','/')).replaceAll('0.0.0.0','127.0.0.1');
    const file=path.join(root,'frps.toml');await fs.writeFile(file,template);const {frps}=require('./.frp-test-path.json');execFileSync(frps,['verify','-c',file],{windowsHide:true});
    relay=spawn(frps,['-c',file],{windowsHide:true,stdio:['ignore','pipe','pipe']});for(const stream of [relay.stdout,relay.stderr])stream.on('data',b=>relayLog+=b);await until(()=>relayLog.includes('frps started successfully'));
    assert.equal((await t.probe()).verified,true);
    const goodName=t.vps.tlsName;t.vps.tlsName='wrong.invalid';await assert.rejects(t.probe());t.vps.tlsName=goodName;
    const secret=t.secret;t.secret='wrong_token_'.repeat(4);manager.runtime.set('qa',{status:'online'});await t.start('qa');await until(()=>t.serverState('qa').status==='reconnecting');assert.equal(t.serverState('qa').ready,false);await t.stop('qa');t.secret=secret;
    await t.start('qa');await until(()=>t.serverState('qa').ready);
    const echoed=await new Promise((resolve,reject)=>{const socket=net.connect({host:'127.0.0.1',port:remote},()=>socket.write('ember-forwarding-verified'));socket.setTimeout(10000,()=>{socket.destroy();reject(Error('forward timeout'));});socket.once('data',b=>{socket.destroy();resolve(b.toString());});socket.on('error',reject);});assert.equal(echoed,'ember-forwarding-verified');
    const entry=t.active.get('qa'),client=await fs.readFile(entry.config,'utf8');assert(!client.includes(secret));manager.runtime.set('qa',{status:'offline'});manager.emit('update');await until(()=>t.active.size===0);await until(()=>!require('node:fs').existsSync(entry.config));
    console.log('REAL FRP RELAY OK: template verify, TLS verification/name rejection, bad token rejection, active status, TCP echo forwarding, no token on disk, offline cleanup.');
  }catch(e){console.error('Relay:',relayLog,'Client:',t.logs.get('qa'),'State:',t.serverState('qa'));throw e;}finally{await t.close();if(relay){const done=new Promise(r=>relay.once('close',r));relay.kill();await done;}await new Promise(r=>echo.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
