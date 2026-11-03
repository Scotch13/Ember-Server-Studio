const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const yazl=require('yazl');
const {extract}=require('../lib/archive');
async function zipBuffer(name,data,options={}){
  const zip=new yazl.ZipFile(),chunks=[];
  const done=new Promise((resolve,reject)=>{zip.outputStream.on('data',c=>chunks.push(c));zip.outputStream.on('error',reject);zip.outputStream.on('end',()=>resolve(Buffer.concat(chunks)));});
  zip.addBuffer(Buffer.from(data),name,options);zip.end();return done;
}
test('Estrazione ZIP: blocca symlink, traversal e directory junction',{timeout:10000},async()=>{
  const root=await fs.mkdtemp(require('../tools/test-env').tempPrefix('ember-zip-'));
  try{
    const file=path.join(root,'test.zip');
    await fs.writeFile(file,await zipBuffer('link','../fuori',{mode:0o120777}));
    await assert.rejects(extract(file,{dir:path.join(root,'symlink')}),/non sicuro/);
    const safe=await zipBuffer('xx/evil.txt','non scrivere fuori');
    // Modifica entrambe le intestazioni senza alterare lunghezze o CRC dei dati.
    for(let offset=safe.indexOf('xx/evil.txt');offset>=0;offset=safe.indexOf('xx/evil.txt',offset+1))safe.write('../evil.txt',offset);
    await fs.writeFile(file,safe);await assert.rejects(extract(file,{dir:path.join(root,'traversal')}));
    const target=path.join(root,'target');await fs.mkdir(target);await fs.symlink(target,path.join(root,'junction'),'junction');
    await fs.writeFile(file,await zipBuffer('demo.txt','test'));await assert.rejects(extract(file,{dir:path.join(root,'junction')}),/non sicura/);
    assert.deepEqual(await fs.readdir(target),[]);
    const damaged=await zipBuffer('crc.txt','CRC originale',{compress:false});
    damaged[damaged.indexOf('CRC originale')]=65;await fs.writeFile(file,damaged);
    await assert.rejects(extract(file,{dir:path.join(root,'crc')}),/Integrità ZIP/);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
