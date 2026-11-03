const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { Manager } = require('./lib/manager');
const { Metrics } = require('./lib/metrics');
const { Modrinth } = require('./lib/modrinth');
const { Workspace, inside } = require('./lib/workspace');
const { Tunnels, certificate } = require('./lib/tunnels');
const languageData = require('./ui/locale-details');
let language = 'it';
const tr = text => languageData.translate(text, language);
const localizeOptions = options => ({ ...options, title: options.title && tr(options.title), message: options.message && tr(options.message), detail: options.detail && tr(options.detail), buttons: options.buttons?.map(tr), filters: options.filters?.map(filter => ({...filter,name:tr(filter.name)})) });
let dialogSequence=0;
const pendingDialogs=new Map();
const messageBox = (parent, options) => new Promise(resolve=>{
  if(!parent||parent.isDestroyed())return resolve({response:options.cancelId??0});
  const id=++dialogSequence;pendingDialogs.set(id,{resolve,cancel:options.cancelId??0,count:options.buttons?.length||1});
  parent.webContents.send('ember-dialog',{id,options:localizeOptions(options)});
});
let window, manager, quitting = false, closePrompt = false;
if (process.env.EMBER_TEST_DATA && !app.isPackaged) app.setPath('userData', process.env.EMBER_TEST_DATA);
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); } });
  app.whenReady().then(async () => {
    try {
      nativeTheme.themeSource = 'dark';
      manager = await new Manager(path.join(app.getPath('userData'), 'Dati')).init();
      window = new BrowserWindow({ width: 1440, height: 940, minWidth: 1100, minHeight: 730, backgroundColor: '#0b0b10',
        title: 'Ember Server Studio', icon: path.join(__dirname, 'assets/ember.ico'), autoHideMenuBar: true,
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
      window.setMenu(null);
      ipcMain.on('ember-dialog-response',(event,id,response)=>{
        if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame)return;
        const request=pendingDialogs.get(id);if(!request||!Number.isInteger(response)||response<0||response>=request.count)return;
        pendingDialogs.delete(id);request.resolve({response});
      });
      window.on('closed',()=>{for(const request of pendingDialogs.values())request.resolve({response:request.cancel});pendingDialogs.clear();});
      window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      window.webContents.on('will-navigate', e => e.preventDefault());
      window.on('app-command',(event,command)=>{
        if(!['browser-backward','browser-forward'].includes(command))return;
        event.preventDefault();window.webContents.send('navigation',command==='browser-backward'?'back':'forward');
      });
      const emit = (event, data) => { if (window && !window.isDestroyed()) window.webContents.send(event, data); };
      manager.on('update', () => emit('state', manager.snapshot()));
      manager.on('log', line => emit('log', line));
      const metrics=new Metrics(manager,data=>emit('metrics',data));
      const modrinth=new Modrinth(manager);
      const workspace=await new Workspace(manager,file=>shell.trashItem(file)).init();workspace.start();
      const tunnels=await new Tunnels(manager,safeStorage).init();tunnels.on('update',data=>emit('tunnel-state',data));
      app.on('before-quit',()=>{metrics.close();workspace.close();tunnels.close().catch(()=>{});});
      const handlers = {
        state: () => manager.snapshot(), catalog: type => manager.catalog(type), create: data => manager.create(data),
        metrics: id=>metrics.get(id),
        tunnelState: ()=>tunnels.snapshot(),
        saveVps: data=>tunnels.saveVps(data),
        generateVpsToken: ()=>require('node:crypto').randomBytes(32).toString('base64url'),
        probeVps: ()=>tunnels.probe(),
        importVpsCertificate: async()=>{const result=await dialog.showOpenDialog(window,localizeOptions({title:'Importa certificato pubblico VPS',properties:['openFile'],filters:[{name:'Certificato PEM',extensions:['pem','crt','cer']}]}));if(result.canceled)return null;const stat=await fs.lstat(result.filePaths[0]);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>131072)throw new Error('Certificato PEM non valido.');return certificate(await fs.readFile(result.filePaths[0],'utf8'));},
        setServerTunnel: async(id,data)=>{
          const server=manager.get(id);if(data.enabled===true){const {response}=await messageBox(window,{title:'Attiva tunnel personale',message:'Rendere questo server raggiungibile tramite la tua VPS?',detail:server.name+'\n\n'+tr('Verrà esposta soltanto la porta Minecraft. Usa autenticazione e whitelist. Ember non gestisce la VPS e non apre porte nel tuo router.')+(server.onlineMode===false?'\n\n'+tr('Autenticazione Minecraft disattivata: verifica i rischi prima di esporre il server.'):''),buttons:['Annulla','Attiva tunnel'],cancelId:0});if(response!==1)return null;}
          return tunnels.setServer(id,data);
        },
        tunnelLogs: id=>{manager.get(id);return tunnels.logs.get(id)||[];},
        exportVpsConfig: async()=>{
          const text=tunnels.serverTemplate(),{response}=await messageBox(window,{title:'Esporta configurazione VPS',message:'Il file conterrà il token segreto della tua VPS.',detail:'Conservalo al sicuro e copialo soltanto sulla tua VPS. Non pubblicarlo su GitHub e non condividerlo con i giocatori.',buttons:['Annulla','Esporta'],cancelId:0});if(response!==1)return false;
          const result=await dialog.showSaveDialog(window,localizeOptions({title:'Esporta configurazione VPS',defaultPath:'frps.toml',filters:[{name:'TOML',extensions:['toml']}]}));if(result.canceled)return false;
          const file=path.join(await fs.realpath(path.dirname(result.filePath)),path.basename(result.filePath));if(inside(await fs.realpath(manager.root),file))throw new Error('Salva la configurazione VPS fuori dalla cartella dati Ember.');const temporary=file+'.'+require('node:crypto').randomUUID()+'.tmp';try{await fs.writeFile(temporary,text,{mode:0o600,flag:'wx'});await fs.rename(temporary,file);}finally{await fs.rm(temporary,{force:true}).catch(()=>{});}return true;
        },
        openVpsGuide: async()=>{const folder=await fs.mkdtemp(path.join(app.getPath('temp'),'ember-vps-guide-')),file=path.join(folder,'VPS-GUIDE.txt');await fs.copyFile(path.join(__dirname,'VPS-GUIDE.txt'),file);const error=await shell.openPath(file);if(error)throw new Error(error);},
        update: (id, data) => manager.update(id, data), start: id => manager.start(id), stop: (id, force) => manager.stop(id, force),
        install: id => manager.install(id), command: async (id, command) => {manager.command(id,command);await workspace.remember(id,String(command).trim()).catch(e=>manager.log(id,'Cronologia: '+e.message));}, logs: id => { manager.get(id); return manager.logs.get(id) || []; },
        backup: id => workspace.backup(id), backups: id => manager.backups(id), restore: (id, name) => manager.restore(id, name), files: id => manager.files(id),
        automation: id=>workspace.config(id),setAutomation: (id,data)=>workspace.setConfig(id,data),
        commandHistory: id=>workspace.history(id),clearCommandHistory: async id=>{const {response}=await messageBox(window,{title:'Cronologia comandi',message:'Cancellare la cronologia di questo server?',buttons:['Annulla','Elimina'],cancelId:0});if(response===1){await workspace.clearHistory(id);return true;}return false;},
        diagnostics: id=>workspace.diagnostics(id),players: id=>workspace.players(id),connection: id=>workspace.connection(id),
        playerAction: async(id,name,action)=>{const command=workspace.playerCommand(id,name,action);const {response}=await messageBox(window,{title:'Gestione giocatori',message:'Inviare questo comando al server?',detail:command,buttons:['Annulla','Conferma'],cancelId:0});if(response===1){manager.command(id,command);return true;}return false;},
        inspectImport: async()=>{const result=await dialog.showOpenDialog(window,localizeOptions({title:'Importa server esistente',properties:['openDirectory']}));return result.canceled?null:workspace.inspectImport(result.filePaths[0]);},
        importServer: (token,data)=>workspace.importServer(token,data),
        exportServer: async id=>{const server=manager.get(id);const result=await dialog.showSaveDialog(window,localizeOptions({title:'Esporta server',defaultPath:server.name.replace(/[^a-zA-Z0-9_-]/g,'_')+'-server.zip',filters:[{name:'ZIP',extensions:['zip']}]}));return result.canceled?false:workspace.exportServer(id,result.filePath);},
        modrinthUpdates: id=>modrinth.updates(id),
        updateModrinth: async(id,project,version)=>{
          const plan=await modrinth.plan(id,project,version,{update:true}),internal=modrinth.plans.get(plan.token);
          const {response}=await messageBox(window,{title:'Aggiorna mod',message:'Aggiornare la mod e le dipendenze compatibili?',detail:tr('Prima verrà creato un backup completo. I file modificati manualmente non vengono sovrascritti.')+'\n\n'+internal.files.map(f=>f.filename).join('\n'),buttons:['Annulla','Aggiorna'],cancelId:0});
          if(response!==1)return null;await workspace.backup(id,true);internal.expires=Date.now()+300000;return modrinth.install(id,plan.token);
        },
        fileEntries: id => modrinth.entries(id),
        modrinthSearch: options=>modrinth.search(options),
        modrinthVersions: (id,project)=>modrinth.versions(id,project),
        modrinthPlan: (id,project,version)=>modrinth.plan(id,project,version),
        modrinthInstall: async (id,token)=>{
          const plan=modrinth.plans.get(token);if(!plan||plan.id!==id)throw new Error('Piano Modrinth scaduto. Ripeti la selezione.');
          const {response}=await messageBox(window,{title:'Installa da Modrinth',message:'Installare questi file nel server?',detail:manager.get(id).name+'\n\n'+plan.files.map(f=>f.filename+(f.existing?' ✓':'')).join('\n')+'\n\n'+tr('Installa soltanto codice di cui ti fidi. Le dipendenze obbligatorie sono incluse.'),buttons:['Annulla','Installa'],cancelId:0});
          if(response!==1)return null;await workspace.beforeMods(id);plan.expires=Date.now()+300000;return modrinth.install(id,token);
        },
        deleteBackup: async (id,name)=>{
          manager.get(id);
          const {response}=await messageBox(window,{title:'Elimina backup',message:'Spostare questo backup nel Cestino?',detail:name,buttons:['Annulla','Elimina'],cancelId:0});
          return response===1?manager.deleteBackup(id,name,file=>shell.trashItem(file)):false;
        },
        manageFiles: async (id,names,action) => {
          names=manager.checkFileAction(id,names,action).names;
          if(action==='delete'){
            const {response}=await messageBox(window,{
              type:'warning',title:'Elimina file selezionati',message:names.length===1?'Eliminare il file selezionato?':`Eliminare i ${names.length} file selezionati?`,
              detail:tr('I file selezionati verranno spostati nel Cestino di Windows. Le dipendenze non vengono rimosse automaticamente. I mondi e i backup non verranno modificati.')+'\n\n'+names.slice(0,8).join('\n')+(names.length>8?'\n…':''),
              buttons:['Annulla','Elimina'],defaultId:0,cancelId:0,noLink:true
            });
            if(response!==1)return null;
          }
          const result=await manager.manageFiles(id,names,action,file=>shell.trashItem(file));
          result.failed=result.failed.map(item=>({...item,error:tr(item.error)}));return result;
        },
        importFiles: async id => { manager.get(id); const result = await dialog.showOpenDialog(window, localizeOptions({ title: 'Importa mod o plugin .jar', filters: [{ name: 'Minecraft Java', extensions: ['jar'] }], properties: ['openFile','multiSelections'] }));if(result.canceled)return 0;await workspace.beforeMods(id);return manager.imports(id, result.filePaths); },
        importDroppedFiles: async (id, paths) => {await workspace.beforeMods(id);return manager.imports(id, paths);},
        openFolder: async (id, kind) => {
          let folder;
          if (kind === 'data') folder = manager.root;
          else { manager.get(id); if (kind === 'backups') folder = path.join(manager.root, 'backups', id);
            else if (kind === 'mods') folder = path.join(manager.dir(id), ['paper','purpur'].includes(manager.get(id).type) ? 'plugins' : 'mods');
            else folder = manager.dir(id); }
          await fs.mkdir(folder, { recursive: true }); const error = await shell.openPath(folder); if (error) throw new Error(error);
        },
        remove: async id => { const s = manager.get(id); const { response } = await messageBox(window, { type: 'warning', buttons: ['Annulla', 'Archivia server'], defaultId: 0, cancelId: 0,
          title: 'Archivia server', message: `Archiviare “${s.name}”?`, detail: 'Verrà rimosso dalla dashboard. I file del mondo saranno conservati nella cartella Dati/archivio; i backup non saranno eliminati.' }); if (response === 1) { await manager.remove(id); return true; } return false; },
        external: url => { const allowed = ['https://www.minecraft.net/eula','https://playit.gg/','https://modrinth.com/mods','https://modrinth.com/plugins','https://docs.papermc.io/','https://www.minecraft.net/download/server']; if (!allowed.includes(url)) throw new Error('Link non consentito.'); return shell.openExternal(url); },
        exportLogs: async id => { const s = manager.get(id); const result = await dialog.showSaveDialog(window, localizeOptions({ title: 'Esporta console', defaultPath: `${s.name.replace(/[^a-zA-Z0-9_-]/g, '_')}-console.txt`, filters: [{ name: 'Testo', extensions: ['txt'] }] })); if (!result.canceled) await fs.writeFile(result.filePath, (manager.logs.get(id) || []).map(l => `[${l.time}] ${l.text}`).join('\n')); },
        deleteServer: async id => {
          const s = manager.get(id);
          if (manager.runtime.has(id) || manager.busy.has(id)) throw new Error('Arresta il server e attendi la fine delle operazioni prima di eliminarlo.');
          const { response } = await messageBox(window, {
            type: 'warning', title: 'Elimina server', message: `Eliminare “${s.name}”?`,
            detail: 'Il server sarà rimosso dalla dashboard. La sua cartella, compresi mondo, configurazioni, mod e plugin, verrà spostata nel Cestino di Windows. I backup ZIP già creati saranno conservati in Dati/backups. Per conservare invece i file in Ember, usa Archivia server.',
            buttons: ['Annulla', 'Elimina server'], defaultId: 0, cancelId: 0, noLink: true
          });
          if (response !== 1) return false;
          await manager.deleteServer(id, folder => shell.trashItem(folder)); return true;
        },
        setLanguage: next => { if (typeof next!=='string'||!Object.hasOwn(languageData.languages,next)) throw new Error('Lingua non valida.'); language=next; return next; },
        setTheme: theme => {
          if (!['light', 'dark'].includes(theme)) throw new Error('Tema non valido.');
          nativeTheme.themeSource = theme;
          window.setBackgroundColor(theme === 'light' ? '#f5f3f7' : '#0b0b10');
          return theme;
        },
        version: () => app.getVersion()
      };
      for (const [name, handler] of Object.entries(handlers)) ipcMain.handle(name, async (event, ...args) => {
        if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) return { ok: false, error: 'Richiesta non autorizzata.' };
        try { return { ok: true, data: await handler(...args) }; } catch(e) { return { ok: false, error: tr(e.message) }; }
      });
      await window.loadFile(path.join(__dirname, 'ui/index.html'));
      window.on('close', async e => {
        if (quitting) return;
        if (manager.runtime.size || manager.busy.size) {
          e.preventDefault(); if (closePrompt) return; closePrompt = true;
          try {
            if (manager.busy.size) { await messageBox(window, { type: 'info', message: 'Attendi il completamento delle installazioni o dei backup prima di chiudere.', buttons: ['Va bene'] }); return; }
            const { response } = await messageBox(window, { type: 'question', title: 'Server in esecuzione', message: 'Arrestare i server e chiudere Ember?', detail: 'Verrà inviato il comando stop per salvare i mondi. La finestra resterà aperta fino all’arresto. Se un server si blocca puoi forzare l’arresto dalla sua dashboard.', buttons: ['Resta aperto', 'Arresta e chiudi'], defaultId: 0, cancelId: 0 });
            if (response === 1) {
              manager.closing = true;
              for (const id of manager.runtime.keys()) manager.stop(id);
              const check = () => { if (!manager.runtime.size) { manager.off('update', check); quitting = true; app.quit(); } };
              manager.on('update', check); check();
            }
          } finally { closePrompt = false; }
        }
      });
    } catch(e) { dialog.showErrorBox('Ember — Impossibile avviare', e.message); app.quit(); }
  });
  app.on('window-all-closed', () => app.quit());
}
