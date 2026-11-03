/* Portable development-only paths. Never points tests at real Ember user data. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const tempDirectory=path.resolve(process.env.EMBER_TEST_TMP||path.join(os.tmpdir(),'opencode'));
fs.mkdirSync(tempDirectory,{recursive:true});
function executable(name,extra=[]){
  const filenames=process.platform==='win32'?[name+'.exe',name]:[name];
  for(const directory of [...(process.env.PATH||'').split(path.delimiter),...extra])for(const filename of filenames){const file=path.join(directory.replace(/^"|"$/g,''),filename);if(fs.existsSync(file))return file;}
  throw new Error(`Missing ${name}. Install it and add it to PATH; see docs/BUILDING.md.`);
}
let detectedJavaHome;
function javaHome(){
  if(process.env.JAVA_HOME)return process.env.JAVA_HOME;
  if(detectedJavaHome)return detectedJavaHome;
  try{const compiler=executable('javac'),candidate=path.dirname(path.dirname(fs.realpathSync(compiler)));if(fs.existsSync(path.join(candidate,'bin',process.platform==='win32'?'javac.exe':'javac')))return detectedJavaHome=candidate;
    const result=require('node:child_process').spawnSync(compiler,['-J-XshowSettings:properties','-version'],{windowsHide:true,encoding:'utf8',timeout:10000}),match=(result.stderr||'').match(/^\s*java\.home\s*=\s*(.+)$/m);if(result.status===0&&match)return detectedJavaHome=match[1].trim();
  }catch{}
  const fallback=path.join(process.env.ProgramFiles||'C:/Program Files','Java','jdk-17');if(fs.existsSync(path.join(fallback,'bin','javac.exe')))return detectedJavaHome=fallback;
  throw new Error('A JDK is required. Set JAVA_HOME; see docs/BUILDING.md.');
}
module.exports={tempDirectory,tempPrefix:name=>path.join(tempDirectory,name),get javaHome(){return javaHome();},get java(){return path.join(javaHome(),'bin',process.platform==='win32'?'java.exe':'java');},get javac(){return path.join(javaHome(),'bin',process.platform==='win32'?'javac.exe':'javac');},get openssl(){return process.env.OPENSSL_PATH||executable('openssl',[path.join(process.env.ProgramFiles||'C:/Program Files','Git','usr','bin')]);}};
