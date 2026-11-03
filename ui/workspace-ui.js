(() => {
  const root=document.querySelector('#content');
  const action=(label,key,extra='',cls='')=>`<button type="button" class="button ${cls}" data-workspace="${key}" ${extra} ${cls==='disabled'?'disabled':''}>${label}</button>`;
  const field=(name,label,value,type='text',extra='')=>`<div class="field"><label for="ws-${name}">${label}</label><input id="ws-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
  const current=()=>state.servers.find(s=>s.id===selected);
  async function automation(server){
    if(document.querySelector('#automation-panel'))return;
    const panel=document.createElement('section');panel.id='automation-panel';panel.className='panel';panel.style.marginTop='20px';document.querySelector('#server-body').append(panel);
    try{const config=await call('automation',server.id);if(!panel.isConnected)return;
      panel.innerHTML=`<h3>Backup automatici</h3><p>I backup programmati vengono creati solo con Ember aperto e server fermo. Se è acceso, restano in attesa. La rotazione riguarda solo i backup automatici, non quelli manuali.</p><form id="automation-form"><div class="form-grid">${field('intervalMinutes','Intervallo (minuti)',config.intervalMinutes,'number','min="5" max="10080" required')}${field('keep','Backup automatici da conservare',config.keep,'number','min="1" max="100" required')}</div><label class="ws-check"><input type="checkbox" name="enabled" ${config.enabled?'checked':''}>Abilita backup programmati</label><label class="ws-check"><input type="checkbox" name="beforeMods" ${config.beforeMods?'checked':''}>Backup prima di installare mod</label><p><span>Ultimo backup:</span> <span translate="no">${config.lastBackup?date(config.lastBackup):'—'}</span> · <span>${esc(config.status||'Nessuna operazione pianificata')}</span></p><p>Le copie automatiche oltre il limite vengono spostate nel Cestino.</p><button class="button primary" type="submit">Salva automazione</button></form>`;
      panel.querySelector('form').addEventListener('input',()=>{formDirty=true;});
      panel.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const form=event.target,data=Object.fromEntries(new FormData(form));data.enabled=form.elements.enabled.checked;data.beforeMods=form.elements.beforeMods.checked;await perform('save-automation',async()=>{await call('setAutomation',server.id,data);formDirty=false;},'Automazione salvata.');});
    }catch(e){if(panel.isConnected)panel.textContent=e.message;}
  }
  async function renderTools(server,body){
    body.innerHTML=`<div class="two-columns"><div class="stack"><section class="panel"><div class="panel-heading"><h3>Diagnostica dei crash</h3>${action('Analizza log','diagnostics')}</div><p>Analisi locale degli ultimi log e del crash report più recente. Le cause suggerite non sono una diagnosi certa; nessun file viene caricato online.</p><div id="diagnostics-result"></div></section><section class="panel"><div class="panel-heading"><h3>Controllo connessione</h3>${action('Verifica connessione','connection')}</div><p>Verifica la porta locale e gli indirizzi di rete di questo PC. Non è una prova di raggiungibilità da Internet.</p><div id="connection-result"></div></section><section class="panel"><h3>Esporta server</h3><p>Crea un pacchetto ZIP trasferibile con mondo, configurazioni, mod e loader. Java, cache, log e file temporanei sono esclusi. Il server deve essere fermo.</p>${action('Esporta server','export','',server.status!=='offline'?'disabled':'')}<p>Cronologia dei comandi salvata localmente, separata per server.</p>${action('Cancella cronologia','clear-history','','ghost')}</section></div><section class="panel"><div class="panel-heading"><h3>Gestione giocatori</h3>${action('Aggiorna elenco','players-refresh')}</div><p>Consulta giocatori online, whitelist, operatori e ban. Le modifiche vengono inviate al server acceso dopo conferma.</p><form id="player-management"><div class="field"><label for="ws-player">Nickname</label><input id="ws-player" name="name" pattern="[A-Za-z0-9_]{1,16}" maxlength="16" required></div><div class="field"><label for="ws-player-action">Azione</label><select id="ws-player-action" name="action">${[['whitelistAdd','Aggiungi alla whitelist'],['whitelistRemove','Rimuovi dalla whitelist'],['op','Rendi operatore'],['deop','Rimuovi operatore'],['kick','Espelli'],['ban','Banna'],['pardon','Rimuovi ban']].map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></div><button class="button primary" type="submit" ${!['online','starting'].includes(server.status)?'disabled':''}>Applica</button></form><div id="managed-players"></div></section></div>`;
    body.querySelector('#player-management').addEventListener('submit',async event=>{event.preventDefault();const data=new FormData(event.target);await perform('player-management',async()=>{if(await call('playerAction',server.id,data.get('name'),data.get('action')))toast('Comando inviato al server.');await players(server.id);});});await players(server.id);
  }
  async function players(id){
    const container=document.querySelector('#managed-players');if(!container)return;container.innerHTML='<span class="spinner"></span>';
    try{const data=await call('players',id);if(!container.isConnected)return;
      container.innerHTML=Object.entries(data).map(([key,names])=>`<h4>${({online:'Online',whitelist:'Whitelist',operators:'Operatori',banned:'Bannati'})[key]}</h4>${names.length?names.map(name=>`<div class="ws-player"><code translate="no">${esc(name)}</code>${action('Seleziona','select-player',`data-name="${esc(name)}"`,'small ghost')}</div>`).join(''):'<p>Nessun giocatore</p>'}`).join('');
    }catch(e){if(container.isConnected)container.textContent=e.message;}
  }
  async function importServer(){
    const inspected=await call('inspectImport');if(!inspected)return;
    const content=document.createElement('div');let port=inspected.port;while(state.servers.some(s=>s.port===port)&&port<65535)port++;
    content.innerHTML=`<p>La cartella originale non verrà modificata. Arresta il server originale prima di copiarlo e importa solo codice fidato.</p><p translate="no">${esc(inspected.source)}</p><div class="form-grid">${field('name','Nome del server',inspected.name,'text','maxlength="48" required')}<div class="field"><label for="ws-type">Software</label><select id="ws-type" name="type">${Object.entries(TYPES).map(([key,type])=>`<option value="${key}">${esc(type.label)}</option>`).join('')}</select></div>${field('version','Versione Minecraft','','text','placeholder="1.21.1" required')}${field('ram','RAM massima (GB)',4,'number','min="1" required')}${field('port','Porta',port,'number','min="1024" max="65535" required')}<div class="field"><label for="ws-launcher">Launcher</label><select id="ws-launcher">${inspected.launchers.map(launcher=>`<option value="${esc(launcher)}" translate="no">${esc(launcher)}</option>`).join('')}</select></div></div><label class="ws-check"><input id="ws-stopped" type="checkbox">Confermo che il server originale è fermo</label><label class="ws-check"><input id="ws-eula" type="checkbox">Ho letto e accetto la EULA di Minecraft</label>`;
    if(inspected.guess){content.querySelector('#ws-type').value=inspected.guess.type;content.querySelector('#ws-version').value=inspected.guess.version;}
    const error=document.createElement('div');error.className='notice error hidden';error.setAttribute('role','alert');content.prepend(error);
    const {response}=await EmberDialogs.show({title:'Importa server esistente',content,buttons:['Annulla','Importa'],cancelId:0,className:'ws-import-dialog',canClose:response=>{if(!response)return true;const valid=[...content.querySelectorAll('input')].every(input=>input.checkValidity())&&/^\d+\.\d+(?:\.\d+)?$/.test(content.querySelector('#ws-version').value)&&content.querySelector('#ws-stopped').checked&&content.querySelector('#ws-eula').checked;if(!valid){error.textContent='Completa i campi e conferma EULA e server fermo.';error.classList.remove('hidden');}return valid;}});if(!response)return;
    const input={name:content.querySelector('#ws-name').value,type:content.querySelector('#ws-type').value,version:content.querySelector('#ws-version').value,ram:content.querySelector('#ws-ram').value,port:content.querySelector('#ws-port').value,launcher:content.querySelector('#ws-launcher').value,stopped:content.querySelector('#ws-stopped').checked,eula:content.querySelector('#ws-eula').checked,maxPlayers:Math.min(500,Math.max(1,inspected.maxPlayers)),motd:inspected.motd,gamemode:'survival',difficulty:'normal',onlineMode:true};
    Object.assign(input,inspected.settings);const id=await call('importServer',inspected.token,input);state=await call('state');navigate('server',id);toast('Server importato. La cartella originale è intatta.');
  }
  function decorate(){
    if(page==='servers'&&!document.querySelector('[data-workspace="import"]'))document.querySelector('.servers-heading-actions').insertAdjacentHTML('beforeend',action('Importa server esistente','import','','primary'));
    if(page!=='server')return;const server=current();if(!server)return;
    const tabs=document.querySelector('.tabs');if(tabs&&!tabs.querySelector('[data-tab="tools"]'))tabs.insertAdjacentHTML('beforeend',`<button class="tab ${tab==='tools'?'active':''}" data-tab="tools">${icon('settings')}Strumenti</button>`);
    if(tab==='backups')automation(server);
    if(tab==='files'&&!document.querySelector('[data-workspace="updates"]'))document.querySelector('#files-panel').insertAdjacentHTML('beforeend',`<div class="ws-updates">${action('Controlla aggiornamenti mod','updates','',server.type==='vanilla'?'disabled':'')}<div id="mod-updates-result" role="status"></div></div>`);
  }
  document.addEventListener('click',async event=>{
    const target=event.target.closest('[data-workspace]');if(!target)return;const key=target.dataset.workspace,id=selected;
    if(key==='select-player'){document.querySelector('#ws-player').value=target.dataset.name;document.querySelector('#ws-player').focus();return;}
    target.disabled=true;
    try{
      if(key==='import')await importServer();
      if(key==='export'){if(await call('exportServer',id))toast('Pacchetto server esportato.');}
      if(key==='clear-history'){if(await call('clearCommandHistory',id)){window.EmberCommands?.clearHistory(id);toast('Cronologia cancellata.');}}
      if(key==='players-refresh')await players(id);
      if(key==='diagnostics'){
        const container=document.querySelector('#diagnostics-result'),data=await call('diagnostics',id);if(container?.isConnected)container.innerHTML=data.findings.length?data.findings.map(f=>`<div class="notice info ws-finding"><div><strong>${esc(f.title)}</strong><p>${esc(f.advice)}</p><pre translate="no">${esc(f.evidence.join('\n'))}</pre></div></div>`).join(''):'<p>Nessuna causa nota rilevata. Consulta comunque i log originali.</p>';
      }
      if(key==='connection'){
        const container=document.querySelector('#connection-result'),data=await call('connection',id);if(container?.isConnected)container.innerHTML=`<p>Porta TCP: <code>${data.port}</code></p>${[data.local,...data.lan].map(result=>`<div class="key-value"><code>${esc(result.host)}</code><span>${result.reachable?'Raggiungibile':'Non raggiungibile'}</span></div>`).join('')}<p>Internet: non verificato. Controlla firewall, inoltro porte o tunnel. Una connessione locale riuscita non garantisce l’accesso dall’esterno.</p>`;
      }
      if(key==='updates'){
        const container=document.querySelector('#mod-updates-result'),updates=await call('modrinthUpdates',id);if(container?.isConnected)container.innerHTML=updates.length?updates.map(mod=>`<div class="ws-update"><div><strong translate="no">${esc(mod.title)}</strong><small translate="no">${esc(mod.current)} → ${esc(mod.version)}</small></div>${action('Aggiorna','update-mod',`data-project="${esc(mod.projectId)}" data-version="${esc(mod.versionId)}"`,'small primary')}</div>`).join(''):'<p class="ws-updates-empty">Nessun aggiornamento stabile compatibile per le mod Modrinth attive.</p>';
      }
      if(key==='update-mod'){if(await call('updateModrinth',id,target.dataset.project,target.dataset.version)){fileViews.delete(id);state=await call('state');render();toast('Mod aggiornata. Backup precedente conservato.');}}
    }catch(error){toast(error.message,true);}finally{if(target.isConnected)target.disabled=false;}
  });
  window.EmberWorkspaceUI={decorate,renderTools};
})();
