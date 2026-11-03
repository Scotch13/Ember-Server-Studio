const fs=require('node:fs/promises');
const path=require('node:path');
const net=require('node:net');
const tls=require('node:tls');
const crypto=require('node:crypto');
const {domainToASCII}=require('node:url');
const {spawn}=require('node:child_process');
const {EventEmitter}=require('node:events');
const VERSION='0.71.1',CLIENT_SHA='23d11640bee87207c7a99d006b84c554df997feeba7ac7243db20a88a9cb5e01';
function host(value){
  if(typeof value!=='string'||value!==value.trim()||!value||value.length>253||/[\s\/\\@?#\x00-\x1f]/.test(value))throw new Error('Host VPS non valido. Inserisci solo dominio o IP, senza URL o porta.');
  if(net.isIP(value))return value;
  const ascii=domainToASCII(value).toLowerCase();if(!ascii||!ascii.split('.').every(part=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part)))throw new Error('Host VPS non valido. Inserisci solo dominio o IP, senza URL o porta.');return ascii;
}
function port(value,min=1){const result=Number(value);if(!Number.isInteger(result)||result<min||result>65535)throw new Error('Porta tunnel non valida.');return result;}
function certificate(value){
  if(typeof value!=='string'||value.length>131072||/PRIVATE KEY/.test(value))throw new Error('Inserisci soltanto il certificato pubblico PEM, mai la chiave privata.');
  const blocks=value.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  if(!blocks?.length||blocks.length>10||value.replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,'').trim())throw new Error('Certificato PEM non valido.');
  for(const block of blocks){let cert;try{cert=new crypto.X509Certificate(block);}catch{throw new Error('Certificato PEM non valido.');}if(Date.parse(cert.validTo)<Date.now()||Date.parse(cert.validFrom)>Date.now())throw new Error('Il certificato non è ancora valido oppure è scaduto.');}
  return blocks.join('\n')+'\n';
}
function validateVps(input){return {host:host(input.host),controlPort:port(input.controlPort),publicHost:host(input.publicHost||input.host),tlsName:host(input.tlsName||input.host),caPem:certificate(input.caPem)};}
class Tunnels extends EventEmitter {
  constructor(manager,storage,options={}){
    super();this.manager=manager;this.storage=storage;this.file=path.join(manager.root,'vps.json');this.folder=path.join(manager.root,'tunnel-runtime');this.vps=null;this.secret='';this.savedSecret='';this.servers={};this.active=new Map();this.logs=new Map();this.queue=Promise.resolve();this.closed=false;this.problem='';
    this.spawn=options.spawn||spawn;this.executable=options.executable||path.join(__dirname,'../assets/frp/frpc.exe').replace('app.asar'+path.sep,'app.asar.unpacked'+path.sep);this.expectedSHA=options.expectedSHA||CLIENT_SHA;
    this.onManager=()=>this.sync();manager.on('update',this.onManager);
  }
  async init(){
    try{const stat=await fs.lstat(this.file);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>1024*1024)throw new Error('Configurazione VPS non leggibile.');const data=JSON.parse(await fs.readFile(this.file,'utf8'));
      this.vps=validateVps(data.vps);this.servers=data.servers&&typeof data.servers==='object'&&!Array.isArray(data.servers)?data.servers:{};this.savedSecret=typeof data.secret==='string'?data.secret:'';
      try{if(this.storage.isEncryptionAvailable())this.secret=this.storage.decryptString(Buffer.from(this.savedSecret,'base64'));}catch{}
      if(!/^[A-Za-z0-9_-]{32,128}$/.test(this.secret)){this.secret='';this.problem='Reinserisci il token VPS su questo account Windows.';}
    }catch(error){if(error.code!=='ENOENT'){this.vps=null;this.secret='';this.problem='Configurazione VPS non leggibile. Reinserisci i parametri senza modificare i server.';}}
    return this;
  }
  async persist(){
    const value=JSON.stringify({vps:this.vps,secret:this.savedSecret,servers:this.servers},null,2);
    this.queue=this.queue.catch(()=>{}).then(async()=>{const temp=this.file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temp,value,{flag:'wx',mode:0o600});await fs.rename(temp,this.file);}finally{await fs.rm(temp,{force:true}).catch(()=>{});}});await this.queue;
  }
  snapshot(){return {version:VERSION,vps:this.vps?{...this.vps}:null,hasToken:!!this.secret,problem:this.problem,servers:this.manager.servers.map(server=>this.serverState(server.id))};}
  notify(){this.emit('update',this.snapshot());}
  serverState(id){
    const server=this.manager.get(id),config=this.servers[id]||{},entry=this.active.get(id),enabled=config.enabled===true,remotePort=Number(config.remotePort)||server.port;
    const hostname=this.vps?.publicHost||'',address=hostname?`${net.isIP(hostname)===6?'['+hostname+']':hostname}:${remotePort}`:'';
    return {id,enabled,remotePort,address,status:!enabled?'disabled':!this.vps||!this.secret?'unconfigured':entry?.status||'waiting',error:entry?.error||'',ready:entry?.status==='active'};
  }
  async saveVps(input){
    if(this.active.size)throw new Error('Disattiva i tunnel prima di modificare la VPS.');
    const vps=validateVps(input),secret=input.token||this.secret;
    if(Object.values(this.servers).some(config=>config.enabled&&Number(config.remotePort)===vps.controlPort))throw new Error('La porta pubblica non può coincidere con la porta di controllo FRP.');
    if(typeof secret!=='string'||!/^[A-Za-z0-9_-]{32,128}$/.test(secret))throw new Error('Usa un token di 32–128 caratteri: lettere, numeri, trattino o underscore.');
    if(!this.storage.isEncryptionAvailable())throw new Error('Protezione credenziali Windows non disponibile. Il token non verrà salvato in chiaro.');
    const encrypted=this.storage.encryptString(secret).toString('base64'),old={vps:this.vps,secret:this.secret,savedSecret:this.savedSecret};this.vps=vps;this.secret=secret;this.savedSecret=encrypted;
    try{await this.persist();}catch(error){Object.assign(this,old);throw error;}this.problem='';this.notify();this.sync();return this.snapshot();
  }
  async setServer(id,input){
    this.manager.get(id);const remotePort=port(input.remotePort,1024),enabled=input.enabled===true;
    if(enabled){if(!this.vps||!this.secret)throw new Error('Configura prima la VPS e il certificato nel menu VPS e tunnel.');if(remotePort===this.vps.controlPort)throw new Error('La porta pubblica non può coincidere con la porta di controllo FRP.');
      if(Object.entries(this.servers).some(([other,cfg])=>other!==id&&cfg.enabled&&Number(cfg.remotePort)===remotePort&&this.manager.servers.some(s=>s.id===other)))throw new Error('Questa porta pubblica è già assegnata a un altro tunnel attivo.');}
    const old=this.servers[id];this.servers[id]={enabled,remotePort};try{await this.persist();}catch(e){if(old)this.servers[id]=old;else delete this.servers[id];throw e;}
    await this.stop(id);this.sync();this.notify();return this.serverState(id);
  }
  shouldRun(id){return !this.closed&&!this.manager.closing&&this.vps&&this.secret&&this.servers[id]?.enabled===true&&this.manager.runtime.get(id)?.status==='online';}
  sync(){
    for(const [id]of this.active)if(!this.shouldRun(id))this.stop(id).catch(()=>{});
    for(const server of this.manager.servers)if(this.shouldRun(server.id)&&!this.active.has(server.id))this.start(server.id).catch(()=>{});
  }
  async verifyClient(){const stat=await fs.lstat(this.executable);if(stat.isSymbolicLink()||!stat.isFile()||crypto.createHash('sha256').update(await fs.readFile(this.executable)).digest('hex')!==this.expectedSHA)throw new Error('Verifica del client FRP fallita. Reinstalla Ember da una copia fidata.');}
  async safeFolder(){await fs.mkdir(this.folder,{recursive:true});const stat=await fs.lstat(this.folder);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('Cartella tunnel non sicura.');}
  clientConfig(id,caFile){const server=this.manager.get(id);return {serverAddr:this.vps.host,serverPort:this.vps.controlPort,loginFailExit:false,auth:{method:'token',token:'{{ .Envs.EMBER_FRP_TOKEN }}',additionalScopes:['HeartBeats','NewWorkConns']},transport:{protocol:'tcp',dialServerTimeout:10,proxyURL:'',tls:{enable:true,disableCustomTLSFirstByte:true,trustedCaFile:caFile,serverName:this.vps.tlsName}},log:{to:'console',level:'info',disablePrintColor:true},webServer:{addr:'127.0.0.1',port:0},proxies:[{name:'ember-'+id,type:'tcp',localIP:'127.0.0.1',localPort:server.port,remotePort:port(this.servers[id].remotePort,1024)}]};}
  append(id,line,source){
    if(source&&this.active.get(id)!==source)return;
    const clean=String(line).replace(/\u001b\[[0-9;]*m/g,'').split(this.secret||'\x00').join('[redacted]').slice(0,2000),list=this.logs.get(id)||[];list.push(clean);if(list.length>80)list.shift();this.logs.set(id,list);
    const entry=this.active.get(id);if(!entry)return;
    if(/start proxy success/i.test(clean)){entry.status='active';entry.error='';}
    else if(/login to server failed|connect to server error|start error|proxy.*error|connection.*closed|control.*closed/i.test(clean)){entry.status='reconnecting';entry.error=clean;}
    this.notify();
  }
  async start(id){
    if(!this.shouldRun(id)||this.active.has(id))return;
    const entry={child:null,status:'connecting',error:'',cancelled:false,timer:null,config:null,ca:null};this.active.set(id,entry);this.notify();
    try{
      await this.verifyClient();await this.safeFolder();
      const tag=crypto.randomUUID();entry.config=path.join(this.folder,tag+'.json');entry.ca=path.join(this.folder,tag+'.pem');
      await fs.writeFile(entry.ca,this.vps.caPem,{flag:'wx',mode:0o600});await fs.writeFile(entry.config,JSON.stringify(this.clientConfig(id,entry.ca)),{flag:'wx',mode:0o600});
      if(entry.cancelled||!this.shouldRun(id)){await this.cleanup(entry);return;}
      const env={...process.env,EMBER_FRP_TOKEN:this.secret,http_proxy:'',HTTP_PROXY:'',https_proxy:'',HTTPS_PROXY:'',ALL_PROXY:'',all_proxy:''};
      const child=this.spawn(this.executable,['-c',entry.config],{windowsHide:true,shell:false,cwd:this.folder,env,stdio:['ignore','pipe','pipe']});entry.child=child;
      for(const stream of [child.stdout,child.stderr]){let buffer='';stream.setEncoding('utf8');stream.on('data',chunk=>{buffer=(buffer+chunk).slice(-65536);const lines=buffer.split(/\r?\n/);buffer=lines.pop();for(const line of lines)if(line)this.append(id,line,entry);});}
      child.on('error',()=>{if(this.active.get(id)===entry){entry.status='error';entry.error='Impossibile avviare il client FRP.';this.notify();}});
      child.once('close',()=>{this.cleanup(entry).catch(()=>{});if(this.active.get(id)!==entry)return;if(entry.cancelled||!this.shouldRun(id)){this.active.delete(id);this.notify();return;}entry.child=null;entry.status='error';entry.error=entry.error||'Il client FRP si è chiuso. Nuovo tentativo tra pochi secondi.';this.notify();entry.timer=setTimeout(()=>{if(this.active.get(id)===entry){this.active.delete(id);this.sync();}},10000);entry.timer.unref?.();});
    }catch(error){await this.cleanup(entry).catch(()=>{});if(this.active.get(id)===entry&&!entry.cancelled){entry.status='error';entry.error=error.message;this.notify();}}
  }
  async cleanup(entry){for(const file of [entry.config,entry.ca])if(file)await fs.rm(file,{force:true}).catch(()=>{});}
  async stop(id){const entry=this.active.get(id);if(!entry)return;entry.cancelled=true;clearTimeout(entry.timer);this.active.delete(id);if(entry.child){await new Promise(resolve=>{const timeout=setTimeout(resolve,3000);entry.child.once('close',()=>{clearTimeout(timeout);resolve();});entry.child.kill();});}await this.cleanup(entry);this.notify();}
  async probe(){
    if(!this.vps)throw new Error('Configura prima la VPS e il certificato nel menu VPS e tunnel.');const config=this.vps;
    return new Promise((resolve,reject)=>{const start=Date.now(),socket=tls.connect({host:config.host,port:config.controlPort,servername:net.isIP(config.tlsName)?undefined:config.tlsName,ca:config.caPem,rejectUnauthorized:true,checkServerIdentity:(_,cert)=>tls.checkServerIdentity(config.tlsName,cert)});let done=false;
      const fail=()=>{if(done)return;done=true;socket.destroy();reject(new Error('Connessione TLS alla VPS non riuscita. Controlla host, porta, certificato e firewall.'));};socket.setTimeout(10000,fail);socket.once('error',fail);socket.once('secureConnect',()=>{if(done)return;done=true;socket.destroy();resolve({verified:true,latency:Date.now()-start});});});
  }
  serverTemplate(){
    if(!this.vps||!this.secret)throw new Error('Configura prima la VPS e il certificato nel menu VPS e tunnel.');
    const ports=[...new Set(this.manager.servers.filter(s=>this.servers[s.id]?.enabled).map(s=>port(this.servers[s.id].remotePort,1024)))];if(!ports.length)ports.push(25565);
    return `# FRP ${VERSION} — VPS di proprietà dell'utente. Nessun relay Ember.\n# Conserva questo file come segreto (chmod 600).\nbindAddr = "0.0.0.0"\nbindPort = ${this.vps.controlPort}\nproxyBindAddr = "0.0.0.0"\nauth.method = "token"\nauth.token = "${this.secret}"\nauth.additionalScopes = ["HeartBeats", "NewWorkConns"]\ntransport.tls.force = true\ntransport.tls.certFile = "/etc/frp/server.crt"\ntransport.tls.keyFile = "/etc/frp/server.key"\nallowPorts = [${ports.map(p=>`{ single = ${p} }`).join(', ')}]\nmaxPortsPerClient = 1\nwebServer.port = 0\nlog.to = "console"\nlog.level = "info"\n`;
  }
  async close(){this.closed=true;this.manager.off('update',this.onManager);await Promise.all([...this.active.keys()].map(id=>this.stop(id)));}
}
module.exports={Tunnels,host,port,certificate,validateVps,VERSION};
