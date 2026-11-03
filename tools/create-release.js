/* Package only a reviewed generated app plus explicit public documentation. */
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {createReadStream,createWriteStream}=require('node:fs'),{pipeline}=require('node:stream/promises'),yazl=require('yazl');
(async()=>{
  const root=path.join(__dirname,'..'),version=require('../package.json').version,app=path.resolve(root,'../App/Ember Server Studio-win32-x64'),out=path.resolve(root,'../Releases');
  await fs.access(path.join(app,'Ember Server Studio.exe'));await fs.mkdir(out,{recursive:true});
  const name=`Ember-Server-Studio-${version}-windows-x64.zip`,destination=path.join(out,name),temporary=destination+'.tmp',zip=new yazl.ZipFile();
  const completion=pipeline(zip.outputStream,createWriteStream(temporary,{flags:'wx'}));completion.catch(()=>{});let count=0;
  async function walk(folder,prefix){for(const entry of await fs.readdir(folder,{withFileTypes:true})){if(entry.isSymbolicLink())throw new Error('Refusing linked release input: '+entry.name);if(/^(?:Dati|servers|backups|world(?:_nether|_the_end)?|tunnel-runtime|\.git|\.env(?:\..*)?|vps\.json|servers\.json|frps\.toml|frpc\.toml)$/i.test(entry.name)||/\.(?:pem|key|pfx|p12|crt|cer|log)$/i.test(entry.name))throw new Error('Potentially private material in app package: '+entry.name);const source=path.join(folder,entry.name),target=prefix+entry.name;if(entry.isDirectory())await walk(source,target+'/');else if(entry.isFile()){zip.addFile(source,target);count++;}}}
  try{
    await walk(app,'Ember Server Studio/');
    for(const file of ['README.md','LICENSE','THIRD-PARTY-NOTICES.txt','SECURITY.md','CHANGELOG.md','VPS-GUIDE.txt','docs/USER-GUIDE.md','docs/TUNNELS.md','docs/PRIVACY.md','docs/BUILDING.md','docs/RELEASING.md','assets/ember.png','assets/frp/LICENSE.txt','assets/frp/manifest.json'])zip.addFile(path.join(root,file),file);
    zip.end();await completion;await fs.rename(temporary,destination);
    const hash=crypto.createHash('sha256');for await(const chunk of createReadStream(destination))hash.update(chunk);const digest=hash.digest('hex');await fs.writeFile(path.join(out,'SHA256SUMS.txt'),`${digest}  ${name}\n`);
    console.log(JSON.stringify({zip:destination,sha256:digest,bytes:(await fs.stat(destination)).size,applicationFiles:count},null,2));
  }catch(e){zip.outputStream.destroy();await completion.catch(()=>{});await fs.rm(temporary,{force:true}).catch(()=>{});throw e;}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
