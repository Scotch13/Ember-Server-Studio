const fs=require('node:fs/promises');
const constants=require('node:fs').constants;
const path=require('node:path');
const crypto=require('node:crypto');
const API='https://api.modrinth.com/v2';
const HEADERS={'User-Agent':'EmberServerStudio/1.0 (local Minecraft server manager)'};
const POPULAR=['P7dR8mSH','gvQqBUqZ','uXXizFIs','l6YH9Als','Vebnzrzj','1u6JkXh5','fALzjamp','nmDcB62a'];
const safeName=name=>typeof name==='string'&&name.length<=200&&/^.+\.jar$/i.test(name)&&!/[\\/:<>"|?*\x00-\x1f]/.test(name)&&name===name.trim();
function iconUrl(value){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='cdn.modrinth.com'&&!url.username&&!url.password&&(!url.port||url.port==='443')?url.href:'';}catch{return '';}}
class Modrinth {
  constructor(manager,request=fetch){this.manager=manager;this.request=request;this.cache=new Map();this.plans=new Map();this.searchProjects=new Map();}
  async api(route,{attempts=1,timeout=45000}={}){
    const cached=this.cache.get(route);if(cached&&cached.until>Date.now())return structuredClone(cached.value);
    for(let attempt=0;attempt<attempts;attempt++)try{
      const response=await this.request(API+route,{headers:HEADERS,signal:AbortSignal.timeout(timeout)});
      if(!response.ok){const error=new Error(response.status===429?'Modrinth: troppe richieste. Riprova tra un minuto.':`Modrinth: HTTP ${response.status}.`);error.status=response.status;throw error;}
      const value=await response.json();if(this.cache.size>150)this.cache.clear();this.cache.set(route,{until:Date.now()+60000,value});return structuredClone(value);
    }catch(error){if(attempt+1>=attempts||error.status&&error.status<500)throw error;await new Promise(resolve=>setTimeout(resolve,350));}
  }
  loader(server){if(!['fabric','forge','neoforge','quilt','paper','purpur'].includes(server.type))throw new Error('Vanilla non supporta mod o plugin.');return server.type==='purpur'?'paper':server.type;}
  idle(id){const server=this.manager.get(id);this.loader(server);if(this.manager.runtime.has(id)||this.manager.busy.has(id))throw new Error('Arresta il server e attendi la fine delle operazioni prima di modificare mod o plugin.');return server;}
  async search(options={}){
    const query=String(options.query||'').trim().slice(0,100),offset=Math.max(0,Math.min(10000,Number(options.offset)||0));
    const facets=[['project_type:mod','project_type:plugin'],['server_side:required','server_side:optional']];
    if(options.serverId){const server=this.manager.get(options.serverId);facets.push([`categories:${this.loader(server)}`],[`versions:${server.version}`]);}
    try{
      const result=await this.api('/search?'+new URLSearchParams({query,offset:String(offset),limit:'20',index:'relevance',facets:JSON.stringify(facets)}),{attempts:2,timeout:10000});
      const hits=result.hits.map(p=>this.searchHit(p));hits.forEach(p=>this.rememberSearch(p));
      return {hits,total:result.total_hits,offset,limited:false};
    }catch(error){if(error.status&&error.status<500)throw error;return this.fallbackSearch(query,options.serverId);}
  }
  searchHit(project){return {id:project.project_id||project.id,title:project.title,description:project.description,author:project.author||'',downloads:project.downloads||0,slug:project.slug,iconUrl:iconUrl(project.icon_url),serverSide:project.server_side,versions:project.game_versions||project.versions||[],loaders:[...(project.loaders||[]),...(project.categories||[]),...(project.additional_categories||[])]};}
  rememberSearch(project){if(!project.id)return;this.searchProjects.set(project.id,project);if(this.searchProjects.size>500)this.searchProjects.delete(this.searchProjects.keys().next().value);}
  async fallbackSearch(query,serverId){
    // Search and project lookup are separate services. Never present this as a complete catalog.
    const slug=/^[A-Za-z0-9]{8}$/.test(query)?query:query.toLowerCase().replace(/\s+/g,'-'),requests=[this.api('/projects?'+new URLSearchParams({ids:JSON.stringify(POPULAR)}),{timeout:8000})];
    if(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(slug))requests.push(this.api('/project/'+encodeURIComponent(slug),{timeout:8000}));
    const results=await Promise.allSettled(requests);let direct;
    for(const [index,result]of results.entries())if(result.status==='fulfilled'){
      const projects=index===0?result.value:[result.value];
      for(const project of projects)if(['mod','plugin'].includes(project.project_type)&&project.server_side!=='unsupported'){const hit=this.searchHit(project);this.rememberSearch(hit);if(index===1)direct=hit.id;}
    }
    if(!this.searchProjects.size)throw new Error('La ricerca Modrinth è temporaneamente indisponibile. Riprova tra poco.');
    const normalize=text=>String(text||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''),needle=normalize(query);
    const server=serverId?this.manager.get(serverId):null,loader=server?this.loader(server):null;
    const hits=[...this.searchProjects.values()].filter(p=>p.serverSide!=='unsupported'&&(!server||p.versions.includes(server.version)&&p.loaders.includes(loader))&&(!needle||p.id===direct||normalize(p.id)===needle||normalize(p.title).includes(needle)||normalize(p.slug).includes(needle))).sort((a,b)=>Number(b.id===direct)-Number(a.id===direct)||b.downloads-a.downloads).slice(0,20);
    return {hits,total:hits.length,offset:0,limited:true};
  }
  async metadata(id){try{const file=path.join(this.manager.dir(id),'.ember-modrinth.json');const stat=await fs.lstat(file);if(stat.isSymbolicLink()||!stat.isFile())throw new Error('Registro Modrinth non sicuro.');return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}}
  async entries(id){
    const [entries,metadata]=await Promise.all([this.manager.fileEntries(id),this.metadata(id)]);
    const projects=Object.values(metadata).filter(p=>entries.some(entry=>entry.displayName===p.filename));
    // Older installations did not store icons. Recover them without touching jars or profiles.
    await Promise.all(projects.map(async project=>{
      if(!Object.hasOwn(project,'iconUrl')&&/^[-\w]{1,100}$/.test(project.projectId))try{project.iconUrl=iconUrl((await this.api('/project/'+encodeURIComponent(project.projectId))).icon_url);}catch{}
      project.iconUrl=iconUrl(project.iconUrl);
    }));
    return entries.map(entry=>({...entry,modrinth:projects.find(p=>p.filename===entry.displayName)||null}));
  }
  async versions(id,projectId){
    const server=this.manager.get(id),loader=this.loader(server);
    if(typeof projectId!=='string'||!/^[-\w]{1,100}$/.test(projectId))throw new Error('Progetto Modrinth non valido.');
    const project=await this.api('/project/'+encodeURIComponent(projectId));
    if(project.server_side==='unsupported'||!['mod','plugin'].includes(project.project_type))throw new Error('Il progetto non è compatibile con un server.');
    const versions=await this.api('/project/'+project.id+'/version?'+new URLSearchParams({loaders:JSON.stringify([loader]),game_versions:JSON.stringify([server.version])}));
    for(const version of versions.slice(0,100))this.cache.set('/version/'+version.id,{until:Date.now()+60000,value:structuredClone(version)});
    return versions.filter(v=>v.project_id===project.id&&v.loaders.includes(loader)&&v.game_versions.includes(server.version)).map(v=>({id:v.id,name:v.name,version:v.version_number,type:v.version_type,published:v.date_published}));
  }
  async updates(id){
    const entries=await this.entries(id),updates=[];
    for(const entry of entries.filter(e=>e.enabled&&e.modrinth)){
      const versions=(await this.versions(id,entry.modrinth.projectId)).filter(v=>v.type==='release');
      const latest=versions[0];if(!latest||latest.id===entry.modrinth.versionId)continue;
      const old=await this.api('/version/'+encodeURIComponent(entry.modrinth.versionId));
      if(latest.published&&old.date_published&&Date.parse(latest.published)<=Date.parse(old.date_published))continue;
      updates.push({projectId:entry.modrinth.projectId,title:entry.modrinth.title,current:entry.modrinth.version,versionId:latest.id,version:latest.version});
    }return updates;
  }
  async plan(id,projectId,versionId,options={}){
    const server=this.idle(id),loader=this.loader(server);if(typeof projectId!=='string'||!/^[-\w]{1,100}$/.test(projectId))throw new Error('Progetto Modrinth non valido.');
    if(versionId!==undefined&&(typeof versionId!=='string'||!/^[-\w]{1,100}$/.test(versionId)))throw new Error('Versione Modrinth non valida.');
    const files=[],visited=new Map(),metadata=await this.metadata(id),incompatible=[],replace=[];
    const visit=async(project,versionId)=>{
      if(visited.size>=60)throw new Error('Troppe dipendenze Modrinth.');
      if(visited.has(project)){if(versionId&&visited.get(project)!==versionId)throw new Error('Dipendenze Modrinth in conflitto.');return;}
      const info=await this.api('/project/'+encodeURIComponent(project));
      if(info.server_side==='unsupported'||!['mod','plugin'].includes(info.project_type))throw new Error('Il progetto non è compatibile con un server.');
      const compatible=v=>v.project_id===info.id&&v.loaders.includes(loader)&&v.game_versions.includes(server.version);
      const version=versionId?await this.api('/version/'+encodeURIComponent(versionId)):(await this.api('/project/'+info.id+'/version?'+new URLSearchParams({loaders:JSON.stringify([loader]),game_versions:JSON.stringify([server.version])}))).filter(compatible)[0];
      if(!version||!compatible(version))throw new Error('Nessuna versione compatibile con questo server.');
      visited.set(project,version.id);
      incompatible.push(...(version.dependencies||[]).filter(dep=>dep.dependency_type==='incompatible'));
      const file=version.files.find(f=>f.primary)||version.files[0];
      if(!file||!safeName(file.filename)||!/^https:\/\/cdn\.modrinth\.com\//.test(file.url)||!/^([a-f0-9]{128})$/i.test(file.hashes?.sha512)||file.size>256*1024*1024)throw new Error('File Modrinth non valido.');
      const old=metadata[info.id];
      if(old&&old.versionId!==version.id&&(await this.manager.fileEntries(id)).some(entry=>entry.displayName===old.filename)){
        if(!options.update)throw new Error('Rimuovi prima la versione Modrinth già installata.');
        const entry=(await this.manager.fileEntries(id)).find(entry=>entry.displayName===old.filename);if(!entry.enabled)throw new Error('Una dipendenza è disattivata. Riattivala prima di installare.');
        const previous=await this.api('/version/'+encodeURIComponent(old.versionId)),previousFile=previous.files.find(f=>f.filename===old.filename);
        if(!previousFile||!safeName(old.filename)||!previousFile.hashes?.sha512)throw new Error('File Modrinth non valido.');
        const oldBytes=await fs.readFile(path.join(this.manager.fileFolder(id),old.filename));
        if(crypto.createHash('sha512').update(oldBytes).digest('hex')!==previousFile.hashes.sha512)throw new Error('Un file esistente è in conflitto. Nessun file sarà sovrascritto.');
        replace.push({projectId:info.id,filename:old.filename,sha512:previousFile.hashes.sha512,versionId:old.versionId});
      }
      for(const dep of version.dependencies||[])if(dep.dependency_type==='required'){
        let depProject=dep.project_id;
        if(!depProject&&dep.version_id)depProject=(await this.api('/version/'+encodeURIComponent(dep.version_id))).project_id;
        if(!depProject)throw new Error('Dipendenza obbligatoria non risolvibile.');
        await visit(depProject,dep.version_id);
      }
      files.push({projectId:info.id,title:info.title,iconUrl:iconUrl(info.icon_url),versionId:version.id,version:version.version_number,filename:file.filename,url:file.url,sha512:file.hashes.sha512,size:file.size});
    };
    await visit(projectId,versionId);
    if(replace.length){for(const installedProject of Object.values(metadata).filter(p=>!files.some(f=>f.projectId===p.projectId))){
      const installedEntries=await this.manager.fileEntries(id);if(!installedEntries.some(e=>e.enabled&&e.displayName===installedProject.filename))continue;
      const record=await this.api('/version/'+encodeURIComponent(installedProject.versionId));
      if((record.dependencies||[]).some(dep=>dep.dependency_type==='required'&&replace.some(p=>dep.version_id===p.versionId)))throw new Error('Dipendenze Modrinth in conflitto.');
    }}
    const installed=await this.manager.fileEntries(id);
    for(const dep of incompatible){
      if(files.some(f=>(dep.version_id?f.versionId===dep.version_id:f.projectId===dep.project_id))||Object.values(metadata).some(f=>(dep.version_id?f.versionId===dep.version_id:f.projectId===dep.project_id)&&installed.some(entry=>entry.enabled&&entry.displayName===f.filename)))throw new Error('Dipendenze Modrinth in conflitto.');
    }
    if(files.reduce((sum,f)=>sum+f.size,0)>1024*1024*1024)throw new Error('File Modrinth troppo grande.');
    for(const file of files){
      const folder=this.manager.fileFolder(id);let existing;
      for(const suffix of ['', '.disabled'])try{existing=await fs.readFile(path.join(folder,file.filename+suffix));if(suffix)throw new Error('Una dipendenza è disattivata. Riattivala prima di installare.');break;}catch(e){if(e.code!=='ENOENT')throw e;}
      const replacing=replace.find(old=>old.filename===file.filename);
      file.existing=!!existing&&!replacing;
      if(existing&&!replacing&&crypto.createHash('sha512').update(existing).digest('hex')!==file.sha512)throw new Error('Un file esistente è in conflitto. Nessun file sarà sovrascritto.');
    }
    const token=crypto.randomUUID();if(this.plans.size>100)this.plans.clear();this.plans.set(token,{id,type:server.type,version:server.version,files,replace,expires:Date.now()+300000});
    return {token,files:files.map(({url,sha512,...file})=>file)};
  }
  async install(id,token){
    const server=this.idle(id),plan=this.plans.get(token);this.plans.delete(token);
    if(!plan||plan.id!==id||plan.expires<Date.now()||plan.type!==server.type||plan.version!==server.version)throw new Error('Piano Modrinth scaduto. Ripeti la selezione.');
    const folder=this.manager.fileFolder(id),created=[],staged=[],moved=[];let staging,committed=false;
    this.manager.busy.add(id);this.manager.jobs.set(id,'Installazione Modrinth');this.manager.emit('update');
    try{
      await fs.mkdir(folder,{recursive:true});const stat=await fs.lstat(folder);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('La cartella mod/plugin non è una cartella locale sicura.');
      staging=await fs.mkdtemp(path.join(this.manager.dir(id),'.modrinth-stage-'));
      const replacements=plan.replace||[];
      for(const old of replacements){const target=path.join(folder,old.filename),stat=await fs.lstat(target);if(stat.isSymbolicLink()||!stat.isFile()||crypto.createHash('sha512').update(await fs.readFile(target)).digest('hex')!==old.sha512)throw new Error('Un file esistente è in conflitto. Nessun file sarà sovrascritto.');}
      const metadata=await this.metadata(id);
      for(const file of plan.files){
        try{await fs.lstat(path.join(folder,file.filename+'.disabled'));throw new Error('Una dipendenza è disattivata. Riattivala prima di installare.');}catch(e){if(e.code!=='ENOENT')throw e;}
        const target=path.join(folder,file.filename);let exists=false;
        try{const info=await fs.lstat(target);if(info.isSymbolicLink()||!info.isFile())throw new Error('File Modrinth non valido.');if(!replacements.some(old=>old.filename===file.filename)){const bytes=await fs.readFile(target);if(crypto.createHash('sha512').update(bytes).digest('hex')!==file.sha512)throw new Error('Un file esistente è in conflitto. Nessun file sarà sovrascritto.');exists=true;}}catch(e){if(e.code!=='ENOENT')throw e;}
        if(!exists){
          const response=await this.request(file.url,{headers:HEADERS,redirect:'error',signal:AbortSignal.timeout(120000)});if(!response.ok)throw new Error(`Modrinth: HTTP ${response.status}.`);
          const chunks=[];let length=0;for await(const chunk of response.body){length+=chunk.length;if(length>256*1024*1024)throw new Error('File Modrinth troppo grande.');chunks.push(chunk);}
          const bytes=Buffer.concat(chunks);if(bytes.length!==file.size||crypto.createHash('sha512').update(bytes).digest('hex')!==file.sha512)throw new Error('Verifica SHA-512 Modrinth fallita.');
          const source=path.join(staging,file.filename);await fs.writeFile(source,bytes,{flag:'wx'});staged.push({source,target});
        }
        metadata[file.projectId]={projectId:file.projectId,title:file.title,iconUrl:file.iconUrl,versionId:file.versionId,version:file.version,filename:file.filename,sha512:file.sha512};
      }
      for(const old of replacements){const source=path.join(folder,old.filename),saved=path.join(staging,'old-'+crypto.randomUUID()+'.jar'),stat=await fs.lstat(source);if(stat.isSymbolicLink()||!stat.isFile()||crypto.createHash('sha512').update(await fs.readFile(source)).digest('hex')!==old.sha512)throw new Error('Un file esistente è in conflitto. Nessun file sarà sovrascritto.');await fs.rename(source,saved);moved.push({source,saved});}
      for(const item of staged){await fs.copyFile(item.source,item.target,constants.COPYFILE_EXCL);created.push(item.target);}
      const meta=path.join(staging,'metadata.json');await fs.writeFile(meta,JSON.stringify(metadata,null,2));await fs.rename(meta,path.join(this.manager.dir(id),'.ember-modrinth.json'));
      committed=true;this.manager.log(id,`Modrinth: ${created.length} file installati.`);return {installed:created.length};
    }catch(e){for(const target of created)await fs.unlink(target).catch(()=>{});for(const old of moved.reverse())try{try{await fs.link(old.saved,old.source);}catch(linkError){if(linkError.code==='EEXIST')throw linkError;await fs.copyFile(old.saved,old.source,constants.COPYFILE_EXCL);}await fs.unlink(old.saved);}catch{this.manager.log(id,'Ripristino automatico incompleto. Copia originale conservata: '+old.saved);}throw e;}
    finally{if(staging&&(committed||!moved.length||await Promise.all(moved.map(old=>fs.access(old.saved).then(()=>false,()=>true))).then(items=>items.every(Boolean))))await fs.rm(staging,{recursive:true,force:true});this.manager.busy.delete(id);this.manager.jobs.delete(id);this.manager.emit('update');}
  }
}
module.exports={Modrinth,safeName};
