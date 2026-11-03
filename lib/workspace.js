const fs=require('node:fs/promises');
const constants=require('node:fs').constants;
const path=require('node:path');
const crypto=require('node:crypto');
const net=require('node:net');
const {createZIP}=require('./archive');
const {parseProperties,javaRequired,neoMinecraft}=require('./manager');
const DEFAULT={enabled:false,intervalMinutes:60,keep:10,beforeMods:true,lastBackup:0,status:''};
const inside=(root,file)=>{const rel=path.relative(path.resolve(root),path.resolve(file));return rel===''||!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel);};
async function regular(file,max=8*1024*1024){const stat=await fs.lstat(file);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>max)throw new Error('File non sicuro o troppo grande.');return fs.readFile(file,'utf8');}
async function readJSON(file,fallback){try{return JSON.parse(await regular(file));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
function diagnose(text){
  const tests=[
    [/OutOfMemoryError|Java heap space|GC overhead limit/i,'RAM insufficiente','Aumenta la RAM lasciando memoria libera per Windows; verifica mod e distanza di simulazione.'],
    [/UnsupportedClassVersionError|class file version|requires Java|requires.*java.*(?:17|21|25)/i,'Versione Java incompatibile','Controlla versione Minecraft e runtime Java richiesto dalle mod.'],
    [/requires.*(?:missing|not installed)|missing.*dependenc|Missing mandatory dependencies|ModResolutionException|Incompatible mod set/i,'Dipendenze mod mancanti o incompatibili','Controlla le dipendenze obbligatorie e la compatibilità di ogni mod con versione e loader.'],
    [/Failed to bind|Address already in use|bind.*failed/i,'Porta già occupata','Ferma gli altri processi sulla stessa porta oppure scegli una porta diversa.'],
    [/AccessDeniedException|Permission denied|Access is denied/i,'Accesso ai file negato','Controlla permessi, antivirus e spazio disponibile. Non spostare i file mentre il server è attivo.'],
    [/No space left|not enough space|disk full/i,'Spazio su disco insufficiente','Libera spazio prima di riavviare e conserva una copia del mondo.'],
    [/Failed to load level|Exception reading.*level|Corrupt.*(?:world|chunk)|ZipException/i,'Possibili file danneggiati','Conserva i file attuali e verifica un backup prima di sostituire mondi o mod.'],
    [/You need to agree to the EULA|eula\.txt/i,'EULA non accettata','Leggi e accetta la EULA di Minecraft prima di avviare il server.'],
    [/NoClassDefFoundError|ClassNotFoundException|Mixin.*(?:failed|error)|InvalidMixinException/i,'Possibile conflitto tra mod','Verifica loader, versione e mod aggiornate. Prova su una copia del server, non sul mondo originale.']
  ];
  return tests.filter(([regex])=>regex.test(text)).map(([regex,title,advice])=>({title,advice,evidence:text.split(/\r?\n/).filter(line=>regex.test(line)).slice(-4).map(line=>line.slice(0,500))}));
}
class Workspace {
  constructor(manager,recycle){this.manager=manager;this.recycle=recycle;this.settings={};this.histories={};this.imports=new Map();this.queue=Promise.resolve();this.running=false;}
  async init(){this.settings=await readJSON(path.join(this.manager.root,'automation.json'),{});this.histories=await readJSON(path.join(this.manager.root,'command-history.json'),{});return this;}
  async write(name,value){const text=JSON.stringify(value,null,2);this.queue=this.queue.catch(()=>{}).then(async()=>{const target=path.join(this.manager.root,name),temp=target+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temp,text,{flag:'wx'});await fs.rename(temp,target);}finally{await fs.rm(temp,{force:true}).catch(()=>{});}});return this.queue;}
  config(id){this.manager.get(id);return {...DEFAULT,...this.settings[id]};}
  async setConfig(id,input){
    const old=this.config(id),intervalMinutes=Number(input.intervalMinutes),keep=Number(input.keep);
    if(!Number.isInteger(intervalMinutes)||intervalMinutes<5||intervalMinutes>10080||!Number.isInteger(keep)||keep<1||keep>100)throw new Error('Intervallo o numero di backup non valido.');
    this.settings[id]={...old,enabled:input.enabled===true,beforeMods:input.beforeMods===true,intervalMinutes,keep,scheduledAt:Date.now(),status:''};await this.write('automation.json',this.settings);return this.config(id);
  }
  history(id){this.manager.get(id);return (this.histories[id]||[]).slice(-100);}
  async remember(id,command){this.manager.get(id);const list=this.history(id);if(list.at(-1)!==command)list.push(command);this.histories[id]=list.slice(-100);await this.write('command-history.json',this.histories);}
  async clearHistory(id){this.manager.get(id);this.histories[id]=[];await this.write('command-history.json',this.histories);}
  async backup(id,automatic=false){
    const file=await this.manager.backup(id);const config=this.config(id);this.settings[id]={...config,lastBackup:Date.now(),status:'Backup completato'};
    if(automatic){this.settings[id].automatic=[...(config.automatic||[]),path.basename(file)];await this.write('automation.json',this.settings);await this.prune(id);}
    await this.write('automation.json',this.settings);return file;
  }
  async prune(id){
    const config=this.config(id),existing=new Set((await this.manager.backups(id)).map(f=>f.name)),names=(config.automatic||[]).filter(name=>existing.has(name));
    while(names.length>config.keep){await this.manager.deleteBackup(id,names[0],this.recycle);names.shift();}
    this.settings[id]={...this.config(id),automatic:names};
  }
  async beforeMods(id){if(this.config(id).beforeMods)await this.backup(id,true);}
  async tick(now=Date.now()){
    if(this.running||this.manager.closing)return;this.running=true;
    try{for(const server of this.manager.servers){const config=this.config(server.id);if(!config.enabled||now-Math.max(config.lastBackup||0,config.scheduledAt||0)<config.intervalMinutes*60000)continue;
      if(this.manager.runtime.has(server.id)||this.manager.busy.has(server.id)){this.settings[server.id]={...config,status:'In attesa del server fermo'};continue;}
      try{await this.backup(server.id,true);}catch(e){this.settings[server.id]={...this.config(server.id),lastBackup:now,status:e.message};this.manager.log(server.id,'Backup automatico: '+e.message);await this.write('automation.json',this.settings);}
    }}finally{this.running=false;}
  }
  start(){this.timer=setInterval(()=>this.tick().catch(()=>{}),30000);this.timer.unref();}
  close(){clearInterval(this.timer);}
  async diagnostics(id){
    const dir=this.manager.dir(id),sources=[],texts=[];
    const append=async(file,label)=>{try{const stat=await fs.lstat(file);if(stat.isSymbolicLink()||!stat.isFile())return;const handle=await fs.open(file,'r');try{const buffer=Buffer.alloc(Math.min(stat.size,256*1024));await handle.read(buffer,0,buffer.length,Math.max(0,stat.size-buffer.length));texts.push(buffer.toString('utf8'));sources.push(label);}finally{await handle.close();}}catch(e){if(e.code!=='ENOENT')throw e;}};
    for(const name of ['logs','crash-reports'])try{if((await fs.lstat(path.join(dir,name))).isSymbolicLink())throw new Error('Cartella log non sicura.');}catch(e){if(e.code!=='ENOENT')throw e;}
    await append(path.join(dir,'logs','latest.log'),'logs/latest.log');
    try{const folder=path.join(dir,'crash-reports'),files=(await fs.readdir(folder)).filter(n=>/^crash-[\w.-]+\.txt$/.test(n)).sort().reverse();if(files[0])await append(path.join(folder,files[0]),'crash-reports/'+files[0]);}catch(e){if(e.code!=='ENOENT')throw e;}
    texts.push((this.manager.logs.get(id)||[]).map(l=>l.text).join('\n'),this.manager.get(id).lastError||'');return {sources,findings:diagnose(texts.join('\n')),hasLogs:texts.some(t=>t.trim()),lastError:this.manager.get(id).lastError||''};
  }
  async players(id){
    const dir=this.manager.dir(id),read=async name=>{const data=await readJSON(path.join(dir,name),[]);if(!Array.isArray(data))throw new Error('Elenco giocatori non valido.');return data.filter(p=>p&&typeof p.name==='string').map(p=>p.name);};
    return {online:[...(this.manager.runtime.get(id)?.players||[])],whitelist:await read('whitelist.json'),operators:await read('ops.json'),banned:await read('banned-players.json')};
  }
  playerCommand(id,name,action){
    this.manager.get(id);if(typeof name!=='string'||!/^[A-Za-z0-9_]{1,16}$/.test(name))throw new Error('Nickname non valido.');
    const commands={kick:'kick',ban:'ban',pardon:'pardon',op:'op',deop:'deop',whitelistAdd:'whitelist add',whitelistRemove:'whitelist remove'};
    if(!Object.hasOwn(commands,action))throw new Error('Azione giocatore non valida.');return commands[action]+' '+name;
  }
  async connection(id){
    const server=this.manager.get(id),connect=host=>new Promise(resolve=>{const start=Date.now(),socket=net.createConnection({host,port:server.port});let done=false;const finish=ok=>{if(done)return;done=true;socket.destroy();resolve({host,reachable:ok,latency:ok?Date.now()-start:null});};socket.setTimeout(1500,()=>finish(false));socket.on('connect',()=>finish(true));socket.on('error',()=>finish(false));});
    const addresses=this.manager.snapshot().addresses.slice(0,8);return {port:server.port,local:await connect('127.0.0.1'),lan:await Promise.all(addresses.map(connect)),internetVerified:false};
  }
  async inspectImport(source){
    if(typeof source!=='string'||!path.isAbsolute(source))throw new Error('Cartella server non valida.');source=await fs.realpath(source);
    const managedRoot=await fs.realpath(this.manager.root);
    if(inside(managedRoot,source)||inside(source,managedRoot))throw new Error('Scegli una cartella esterna ai dati Ember.');
    if(!(await fs.lstat(source)).isDirectory())throw new Error('Cartella server non valida.');
    const props=parseProperties(await regular(path.join(source,'server.properties'))),launchers=[];
    async function scan(folder,depth=0){if(depth>7)return;for(const entry of await fs.readdir(folder,{withFileTypes:true})){if(entry.isSymbolicLink())continue;const file=path.join(folder,entry.name);if(entry.isFile()&&(depth===0&&/^.+\.jar$/i.test(entry.name)&&!/(?:installer|sources|javadoc)/i.test(entry.name)||entry.name==='win_args.txt'))launchers.push(path.relative(source,file));if(entry.isDirectory()&&(depth>0||entry.name==='libraries'))await scan(file,depth+1);}}
    await scan(source);if(!launchers.length)throw new Error('Nessun launcher server trovato nella cartella.');
    let profile={};try{profile=await readJSON(path.join(source,'ember-profile.json'),{});}catch{}if(!profile||typeof profile!=='object')profile={};
    const names=launchers.join(' ').replace(/\\/g,'/').toLowerCase(),guessedType=names.includes('neoforged')?'neoforge':names.includes('minecraftforge')?'forge':names.includes('quilt')?'quilt':names.includes('fabric')?'fabric':names.includes('purpur')?'purpur':names.includes('paper')?'paper':'vanilla';
    const guess={type:['vanilla','paper','purpur','fabric','forge','neoforge','quilt'].includes(profile.type)?profile.type:guessedType,version:/^\d+\.\d+(?:\.\d+)?$/.test(profile.version)?profile.version:(names.match(/(?:^|[-_/])(\d+\.\d+(?:\.\d+)?)(?:[-_. ]|$)/)?.[1]||'')};
    if(guessedType==='neoforge'&&!/^\d+\.\d+(?:\.\d+)?$/.test(profile.version)){const build=names.match(/neoforge\/(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)\//)?.[1];if(build)guess.version=neoMinecraft(build);}
    const token=crypto.randomUUID();if(this.imports.size>10)this.imports.clear();this.imports.set(token,{source,launchers,expires:Date.now()+600000});
    return {token,source,name:path.basename(source).slice(0,48),launchers,guess,port:Number(props['server-port'])||25565,motd:props.motd||'',maxPlayers:Number(props['max-players'])||20,settings:{gamemode:({'0':'survival','1':'creative','2':'adventure','3':'spectator'})[props.gamemode]||props.gamemode||'survival',difficulty:({'0':'peaceful','1':'easy','2':'normal','3':'hard'})[props.difficulty]||props.difficulty||'normal',seed:props['level-seed']||'',onlineMode:props['online-mode']!=='false',whitelist:props['white-list']==='true',pvp:props.pvp!=='false'}};
  }
  async importServer(token,input){
    const plan=this.imports.get(token);if(!plan||plan.expires<Date.now())throw new Error('Importazione scaduta. Scegli di nuovo la cartella.');
    if(input.eula!==true||input.stopped!==true)throw new Error('Conferma EULA e server originale fermo.');
    if(!plan.launchers.includes(input.launcher))throw new Error('Launcher non valido.');
    const data=this.manager.validate(input);if(this.manager.servers.some(s=>s.port===data.port))throw new Error('Porta già utilizzata da un altro server.');
    this.imports.delete(token);const id=crypto.randomUUID(),parent=path.join(this.manager.root,'servers');await fs.mkdir(parent,{recursive:true});
    const target=path.join(parent,id);await fs.mkdir(target);this.manager.busy.add(id);this.manager.jobs.set(id,'Importazione server');
    try{
      async function copy(source,dest){for(const entry of await fs.readdir(source,{withFileTypes:true})){const from=path.join(source,entry.name),to=path.join(dest,entry.name);const stat=await fs.lstat(from);if(stat.isSymbolicLink())throw new Error('La cartella contiene collegamenti: importazione annullata.');if(entry.name==='session.lock')continue;if(stat.isDirectory()){await fs.mkdir(to);await copy(from,to);}else if(stat.isFile())await fs.copyFile(from,to,constants.COPYFILE_EXCL);else throw new Error('File server non valido.');}}
      await copy(plan.source,target);
      const launch=input.launcher.endsWith('win_args.txt')?['@'+input.launcher,'nogui']:['-jar',input.launcher,'nogui'];
      const server={...data,id,installed:true,launch,javaMajor:javaRequired(data.version),createdAt:new Date().toISOString(),eulaAcceptedAt:new Date().toISOString()};
      this.manager.servers.push(server);await this.manager.writeProperties(server);await fs.writeFile(path.join(target,'eula.txt'),'eula=true\n');await this.manager.save();return id;
    }catch(e){this.manager.servers=this.manager.servers.filter(s=>s.id!==id);await fs.rm(target,{recursive:true,force:true});throw e;}
    finally{this.manager.busy.delete(id);this.manager.jobs.delete(id);this.manager.emit('update');}
  }
  async exportServer(id,destination){
    const server=this.manager.get(id);if(this.manager.runtime.has(id)||this.manager.busy.has(id))throw new Error('Arresta il server prima di esportare.');
    destination=path.join(await fs.realpath(path.dirname(destination)),path.basename(destination));
    if(inside(await fs.realpath(this.manager.root),destination))throw new Error('Salva il pacchetto fuori dalla cartella dati Ember.');
    this.manager.busy.add(id);this.manager.jobs.set(id,'Esportazione server');this.manager.emit('update');const temp=destination+'.'+crypto.randomUUID()+'.part';
    try{const runtimeRoots=new Set(['runtimes']);for(const entry of await fs.readdir(this.manager.dir(id),{withFileTypes:true}))if(entry.isDirectory())for(const java of ['java.exe','javaw.exe','java'])try{await fs.access(path.join(this.manager.dir(id),entry.name,'bin',java));runtimeRoots.add(entry.name);}catch{}
      await createZIP(this.manager.dir(id),temp,server,{exclude:relative=>runtimeRoots.has(relative.split('/')[0])||/^(?:logs|crash-reports|cache|backups)(?:\/|$)/i.test(relative)||/(?:^|\/)session\.lock$|\.part$|\.tmp$|^\.modrinth-stage-/i.test(relative)});await fs.rename(temp,destination);return true;}
    finally{await fs.rm(temp,{force:true}).catch(()=>{});this.manager.busy.delete(id);this.manager.jobs.delete(id);this.manager.emit('update');}
  }
}
module.exports={Workspace,diagnose,inside};
