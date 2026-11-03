/* Reproducible vendor import: official release, pinned archive SHA-256. */
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {extract}=require('../lib/archive');
const VERSION='0.71.1',SHA='b90074b2b6a1d792a7a40f085ac6d276bcab2d1bc60201f8a86ca53ce65ce821';
(async()=>{
  const temp=await fs.mkdtemp(require('./test-env').tempPrefix('ember-frp-vendor-'));
  const url=`https://github.com/fatedier/frp/releases/download/v${VERSION}/frp_${VERSION}_windows_amd64.zip`;
  const response=await fetch(url,{headers:{'User-Agent':'EmberServerStudio/1.0'},signal:AbortSignal.timeout(120000)});if(!response.ok)throw new Error('FRP download: '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());if(crypto.createHash('sha256').update(bytes).digest('hex')!==SHA)throw new Error('FRP archive checksum mismatch');
  const archive=path.join(temp,'frp.zip');await fs.writeFile(archive,bytes);await extract(archive,{dir:path.join(temp,'extracted')});
  const source=path.join(temp,'extracted',`frp_${VERSION}_windows_amd64`),target=path.join(__dirname,'../assets/frp');await fs.mkdir(target,{recursive:true});
  const exe=await fs.readFile(path.join(source,'frpc.exe'));await fs.writeFile(path.join(target,'frpc.exe'),exe);
  await fs.copyFile(path.join(source,'LICENSE'),path.join(target,'LICENSE.txt'));
  const manifest={version:VERSION,sha256:crypto.createHash('sha256').update(exe).digest('hex'),archiveSHA256:SHA,source:url};await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2));
  await fs.writeFile(path.join(__dirname,'.frp-test-path.json'),JSON.stringify({frps:path.join(source,'frps.exe')}));
  console.log('FRP verified and vendored:',JSON.stringify(manifest));
})().catch(e=>{console.error(e);process.exitCode=1;});
