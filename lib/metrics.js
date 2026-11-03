const path=require('node:path');
const {spawn}=require('node:child_process');
class Metrics {
  constructor(manager,emit){this.manager=manager;this.emit=emit;this.readers=new Map();this.history=new Map();manager.on('update',()=>this.sync());}
  sync(){
    for(const [id,reader]of this.readers)if(this.manager.runtime.get(id)?.child.pid!==reader.pid){reader.child.kill();this.readers.delete(id);}
    for(const [id,runtime]of this.manager.runtime){
      if(!runtime.child?.pid||this.readers.has(id))continue;
      this.history.set(id,[]);
      const executable=path.join(__dirname,'../assets/ram-reader.exe').replace('app.asar'+path.sep,'app.asar.unpacked'+path.sep);
      const child=spawn(executable,[String(runtime.child.pid)],{windowsHide:true,stdio:['ignore','pipe','ignore']});
      const reader={pid:runtime.child.pid,child};this.readers.set(id,reader);let buffer='';
      child.stdout.on('data',chunk=>{buffer+=chunk;const lines=buffer.split(/\r?\n/);buffer=lines.pop();for(const line of lines){
        const bytes=Number(line);if(!Number.isFinite(bytes)||bytes<=0||this.manager.runtime.get(id)!==runtime)continue;
        const point={time:Date.now(),memoryMB:bytes/1048576};runtime.memoryMB=point.memoryMB;
        const history=this.history.get(id);history.push(point);if(history.length>150)history.shift();this.emit({id,...point});
      }});
      child.on('error',()=>{});
      child.on('exit',()=>{if(this.readers.get(id)===reader)this.readers.delete(id);});
    }
  }
  get(id){this.manager.get(id);return this.history.get(id)||[];}
  close(){for(const reader of this.readers.values())reader.child.kill();this.readers.clear();}
}
module.exports={Metrics};
