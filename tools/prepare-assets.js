/* Build/download generated Windows assets; never fetch an unpinned client. */
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
(async()=>{
  if(process.platform!=='win32')throw new Error('Asset preparation targets Windows x64. Use a Windows build environment.');
  const root=path.join(__dirname,'..'),client=path.join(root,'assets/frp/frpc.exe'),manifest=require('../assets/frp/manifest.json');
  const bytes=await fs.readFile(client).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  if(!bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)execFileSync(process.execPath,[path.join(__dirname,'fetch-frp.js')],{cwd:root,windowsHide:true,stdio:'inherit'});
  const checked=await fs.readFile(client);if(crypto.createHash('sha256').update(checked).digest('hex')!==manifest.sha256)throw new Error('FRP client integrity verification failed.');
  const windows=process.env.SystemRoot||'C:/Windows',csc=path.join(windows,'Microsoft.NET/Framework64/v4.0.30319/csc.exe');
  execFileSync(csc,['/nologo','/target:exe','/platform:x64','/out:'+path.join(root,'assets/ram-reader.exe'),path.join(root,'assets/ram-reader.cs')],{windowsHide:true,stdio:'inherit'});
  console.log('Windows assets ready: verified official FRP client and compiled RAM reader.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
