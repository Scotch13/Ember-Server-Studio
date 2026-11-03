const { contextBridge, ipcRenderer, webUtils } = require('electron');
const channels = new Set(['state','catalog','create','update','start','stop','install','command','logs','backup','backups','restore','files','fileEntries','manageFiles','importFiles','openFolder','remove','deleteServer','external','exportLogs','setTheme','setLanguage','version']);
contextBridge.exposeInMainWorld('ember', {
  onDialog: callback => { const handler=(_,request)=>callback(request);ipcRenderer.on('ember-dialog',handler);return ()=>ipcRenderer.removeListener('ember-dialog',handler); },
  onMetrics: callback => { const handler=(_,data)=>callback(data);ipcRenderer.on('metrics',handler);return ()=>ipcRenderer.removeListener('metrics',handler); },
  onNavigation: callback => { const handler=(_,direction)=>{if(['back','forward'].includes(direction))callback(direction);};ipcRenderer.on('navigation',handler);return ()=>ipcRenderer.removeListener('navigation',handler); },
  onTunnelState: callback => {const handler=(_,value)=>callback(value);ipcRenderer.on('tunnel-state',handler);return ()=>ipcRenderer.removeListener('tunnel-state',handler);},
  respondDialog: (id,response) => ipcRenderer.send('ember-dialog-response',id,response),
  importDroppedFiles: async (id, files) => {
    if(typeof id!=='string'||!Array.isArray(files)||!files.length||files.length>2000)throw new Error('Seleziona da 1 a 2000 file.');
    const paths=files.map(file=>{
      if(!file||typeof file.name!=='string'||!/^.+\.jar$/i.test(file.name))throw new Error('Sono consentiti soltanto file .jar.');
      let diskPath='';try{diskPath=webUtils.getPathForFile(file);}catch{}
      if(!diskPath)throw new Error('Trascina file .jar salvati sul computer.');
      return diskPath;
    });
    // Non esporre un IPC generico con percorsi arbitrari: i percorsi provengono
    // soltanto da veri File di sistema, risolti nel preload tramite webUtils.
    const result=await ipcRenderer.invoke('importDroppedFiles',id,paths);
    if(!result.ok)throw new Error(result.error);return result.data;
  },
  call: async (channel, ...args) => {
    if(['deleteBackup','modrinthSearch','modrinthVersions','modrinthPlan','modrinthInstall','metrics','automation','setAutomation','commandHistory','clearCommandHistory','diagnostics','players','connection','playerAction','inspectImport','importServer','exportServer','modrinthUpdates','updateModrinth','tunnelState','saveVps','generateVpsToken','probeVps','importVpsCertificate','setServerTunnel','tunnelLogs','exportVpsConfig','openVpsGuide'].includes(channel))channels.add(channel);
    if (!channels.has(channel)) throw new Error('Operazione non consentita.');
    const result = await ipcRenderer.invoke(channel, ...args);
    if (!result.ok) throw new Error(result.error); return result.data;
  },
  onState: callback => { const handler = (_, state) => callback(state); ipcRenderer.on('state', handler); return () => ipcRenderer.removeListener('state', handler); },
  onLog: callback => { const handler = (_, line) => callback(line); ipcRenderer.on('log', handler); return () => ipcRenderer.removeListener('log', handler); }
});
