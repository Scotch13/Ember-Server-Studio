/* Interfaccia locale: nessun CDN, nessun account, nessun contenuto remoto eseguibile. */
const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M15 6.5h3M15 17.5h3"/>',
  archive: '<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v12h14V8M9 12h6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', settings: '<path d="m9 3-.6 2.4-2 .9-2.2-.7-1.8 3.1 1.7 1.7v2.3l-1.7 1.7 1.8 3.1 2.3-.6 2 .9.5 2.2h3.6l.6-2.3 2-.9 2.2.7 1.8-3.1-1.7-1.7v-2.3l1.7-1.7-1.8-3.1-2.3.6-2-.9L12.6 3Z"/><circle cx="10.8" cy="11.5" r="3"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  memory: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10v4M12 10v4M17 10v4M7 18v3M12 18v3M17 18v3"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>', stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', chevron: '<path d="m9 5 7 7-7 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  cube: '<path d="m12 3 9 5v9l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v9M7 5.8l10 5.4"/>',
  feather: '<path d="M20 3c-7-2-15 5-15 12l4 4c7 0 14-9 11-16ZM3 21 16 8M8 15h6M11 12V7"/>',
  fabric: '<path d="m5 3 14 2 2 14-14 2L3 7ZM5 8l14-2M6 14l14-2M9 4l2 16M15 5l2 14"/>',
  hammer: '<path d="m14 4 6 6-3 3-6-6ZM12 9 3 18l3 3 9-9M13 3l8 8"/>',
  quilt: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16M4 4l8 8 8-8M4 20l8-8 8 8"/>',
  terminal: '<path d="m5 6 6 6-6 6M13 18h6"/>', folder: '<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  link: '<path d="m10 13 4-4M8 15l-2 2a3 3 0 0 0 4 4l5-5a3 3 0 0 0 0-4M16 9l2-2a3 3 0 0 0-4-4l-5 5a3 3 0 0 0 0 4"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  alert: '<path d="M10 4 2 19a1 1 0 0 0 1 2h18a1 1 0 0 0 1-2L14 4a2 2 0 0 0-4 0Z"/><path d="M12 9v5M12 17h.01"/>',
  check: '<path d="m5 12 4 4L20 5"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>', lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  external: '<path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-3l2 3M4 17l2 3a8 8 0 0 0 13-3"/>',
  network: '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="6" rx="1"/><rect x="15" y="16" width="7" height="6" rx="1"/><path d="M12 8v4M5.5 16v-4h13v4"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>'
};
const TYPES = {
  vanilla: { label: 'Vanilla', icon: 'cube', short: 'L’esperienza originale', desc: 'Il server ufficiale Mojang: Minecraft puro, senza mod o plugin. Perfetto per un mondo survival con gli amici.' },
  paper: { label: 'Paper', icon: 'feather', short: 'Prestazioni e plugin', desc: 'Ottimizzato per prestazioni e stabilità. Supporta plugin Bukkit/Spigot/Paper, non le mod Fabric o Forge.' },
  fabric: { label: 'Fabric', icon: 'fabric', short: 'Modding leggero e veloce', desc: 'Un loader leggero per le tue mod. Le mod vanno aggiunte separatamente: molte richiedono Fabric API e la stessa configurazione sul client.' },
  forge: { label: 'Forge', icon: 'hammer', short: 'Grandi mod, grandi mondi', desc: 'L’ecosistema storico del modding. Aggiungi mod Forge compatibili e installa le stesse mod richieste anche sui client.' },
  neoforge: { label: 'NeoForge', icon: 'spark', short: 'La nuova era del modding', desc: 'Un loader moderno per mod NeoForge. Le mod Forge non sono automaticamente compatibili; controlla sempre versione e loader.' },
  purpur: { label: 'Purpur', icon: 'feather', short: 'Plugin e personalizzazione', desc: 'Basato su Paper, con tantissime opzioni extra per il gameplay. Supporta plugin compatibili con Paper.' },
  quilt: { label: 'Quilt', icon: 'quilt', short: 'Un’alternativa aperta', desc: 'Loader comunitario per mod Quilt e alcune mod Fabric. Controlla la compatibilità delle mod con la versione scelta.' }
};
const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const icon = name => `<i aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[name] || ICONS.cube}</svg></i>`;
const typeIcon = type => `<div class="type-icon ${esc(type)}">${icon(TYPES[type]?.icon || 'cube')}</div>`;
const button = (text, action, cls = '', symbol = '', extra = '') => `<button class="button ${cls}" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ''}${text}</button>`;
const statusLabel = s => ({ online: 'Online', offline: s.installed ? 'Offline' : 'Da installare', starting:'Avvio…', installing:s.job || 'Installazione…', stopping:'Arresto…' }[s.status] || 'Offline');
const pill = s => `<span class="status-pill ${s.status}"><span class="status-dot ${s.status}"></span>${esc(statusLabel(s))}</span>`;
const date = v => new Date(v).toLocaleString(window.EmberLocale.locale, { dateStyle:'medium', timeStyle:'short' });
const size = v => v > 1073741824 ? `${(v/1073741824).toFixed(2)} GB` : `${(v/1048576).toFixed(1)} MB`;
const call = (...args) => window.ember.call(...args);
let state = { servers:[], system:{totalMemoryGB:32,freeMemoryGB:0,cpus:0}, addresses:[], root:'' };
let page = 'dashboard', selected = null, tab = 'overview', filter = 'all', query = '', wizard = null, catalogToken = 0;
let logs = new Map(), pending = new Set(), formDirty = false, viewGeneration = 0, previousFocus = null;
const fileViews = new Map();
const modrinthView={query:'',serverId:'',offset:0,hits:[]};
const ramHistories=new Map();
function drawRam(id){
  if(page!=='server'||selected!==id||tab!=='overview')return;
  const graph=$('#ram-graph');if(!graph)return;
  const points=ramHistories.get(id)||[],server=state.servers.find(s=>s.id===id),running=['online','starting','stopping'].includes(server?.status);
  const latest=points.at(-1),max=Math.max(512,...points.map(p=>p.memoryMB));
  $('#ram-current').textContent=running?(latest?`${Math.round(latest.memoryMB)} MB`:'In attesa di misurazione…'):'Server fermo';
  const d=points.map((p,i)=>`${i?'L':'M'}${(i/149*900).toFixed(1)},${(135-p.memoryMB/max*120).toFixed(1)}`).join(' ');
  graph.innerHTML=`<line x1="0" y1="135" x2="900" y2="135"/><path d="${d}"/>${latest?`<circle cx="${((points.length-1)/149*900).toFixed(1)}" cy="${(135-latest.memoryMB/max*120).toFixed(1)}" r="3"/>`:''}`;
}
function attachRam(s){
  if($('#ram-graph'))return;
  const card=$('#server-body .stats-grid .stat:nth-child(3)');if(!card||!s)return;
  card.classList.add('ram-stat');card.insertAdjacentHTML('beforeend',`<div class="ram-mini" title="Memoria fisica del processo Java (Working Set), non il limite RAM assegnato. Campionamento ogni 2 secondi."><svg id="ram-graph" class="ram-chart" viewBox="0 0 900 150" preserveAspectRatio="none" role="img" aria-label="Grafico RAM"></svg><small id="ram-current" aria-live="off"></small></div>`);
  drawRam(s.id);call('metrics',s.id).then(points=>{ramHistories.set(s.id,points);drawRam(s.id);}).catch(()=>{});
}
async function renderModrinth(){
  const generation=viewGeneration;
  content.innerHTML=heading('Libreria Modrinth','Cerca mod e plugin e installali nei tuoi server.')+`<section class="panel"><form id="modrinth-search" class="modrinth-search"><input name="query" aria-label="Cerca su Modrinth" placeholder="Cerca su Modrinth" value="${esc(modrinthView.query)}" maxlength="100"><button class="button primary" type="submit">Cerca</button></form><p>Catalogo fornito da Modrinth. La compatibilità viene verificata prima dell’installazione. Mod e plugin eseguono codice sul computer.</p><div id="modrinth-results" class="modrinth-grid"><span class="spinner"></span></div><div class="button-group" id="modrinth-pages"></div></section>`;
  try{
    const result=await call('modrinthSearch',{query:modrinthView.query,offset:modrinthView.offset});
    if(generation!==viewGeneration||page!=='modrinth')return;
    if(result.limited){modrinthView.offset=0;$('#modrinth-results').insertAdjacentHTML('beforebegin',`<div class="notice info modrinth-search-warning">${icon('info')}<div>Il servizio di ricerca Modrinth è temporaneamente indisponibile. Mostriamo risultati limitati recuperati dai progetti o dalla cache. Per trovare una mod, prova il nome esatto o lo slug.</div></div>`);}
    modrinthView.hits=result.hits;
    $('#modrinth-results').innerHTML=result.hits.length?result.hits.map(p=>`<article class="panel modrinth-card"><div class="modrinth-card-heading">${modImage(p.iconUrl,p.title)}<h3 translate="no">${esc(p.title)}</h3></div><small translate="no">${p.author?esc(p.author)+' · ':''}${Number(p.downloads).toLocaleString()} download</small><p translate="no">${esc(p.description)}</p>${button('Aggiungi al server','modrinth-select','primary','plus',`data-project="${esc(p.id)}"`)}</article>`).join(''):result.limited?'<p>Nessun progetto trovato nella ricerca limitata. Riprova più tardi per il catalogo completo.</p>':'<p>Nessun risultato compatibile.</p>';
    $('#modrinth-pages').innerHTML=result.limited?button('Riprova ricerca completa','modrinth-retry','small','refresh'):button('Indietro','modrinth-prev','small','',modrinthView.offset===0?'disabled':'')+button('Continua','modrinth-next','small','',modrinthView.offset+20>=result.total?'disabled':'');
  }catch(e){if(generation===viewGeneration)$('#modrinth-results').innerHTML=`<p>${esc(e.message)}</p>${button('Riprova','modrinth-retry')}`;}
}
async function chooseModrinth(project){
  const mod=modrinthView.hits.find(hit=>hit.id===project);if(!mod)return;
  const servers=state.servers.filter(s=>s.type!=='vanilla');
  const available=servers.filter(s=>s.status==='offline'),preferred=available.find(s=>s.id===modrinthView.serverId)||available[0];
  const sheet=document.createElement('div');sheet.className='mod-add-sheet';
  sheet.innerHTML=`<div class="mod-add-info">${modImage(mod.iconUrl,mod.title)}<h3 translate="no">${esc(mod.title)}</h3><small translate="no">${esc(mod.author)}</small><p translate="no">${esc(mod.description)}</p></div><div class="mod-add-controls"><div class="field"><label for="mod-add-server">Server di destinazione</label><select id="mod-add-server" ${!available.length?'disabled':''}>${servers.length?servers.map(s=>`<option value="${esc(s.id)}" ${s.id===preferred?.id?'selected':''} ${s.status!=='offline'?'disabled':''}>${esc(s.name)} · ${esc(s.type)} ${esc(s.version)}${s.status!=='offline'?' · '+esc(statusLabel(s)):''}</option>`).join(''):'<option value="">Nessun server compatibile</option>'}</select></div><p>${available.length?'Scegli il server. Ember verificherà versione, loader e dipendenze.':servers.length?'Arresta il server prima di importare file.':'Crea un server compatibile prima di installare mod.'}</p></div>`;
  const select=$('#mod-add-server',sheet);
  select.closest('.field').insertAdjacentHTML('afterend',`<div class="field mod-version-field"><label for="mod-add-version">Versione della mod</label><select id="mod-add-version" disabled><option value="">Seleziona un server</option></select><small id="mod-version-status" role="status"></small><button type="button" class="button small ghost hidden" id="mod-version-retry">Riprova</button></div>`);
  const versionSelect=$('#mod-add-version',sheet),status=$('#mod-version-status',sheet),retry=$('#mod-version-retry',sheet);
  let request=0,loadedServer=null,versions=[];
  const updateAdd=()=>{const add=$('.mod-add-controls .button.primary',sheet);if(add)add.disabled=loadedServer!==select.value||!versions.some(v=>v.id===versionSelect.value);};
  const loadVersions=async()=>{
    const generation=++request,serverId=select.value,restoreFocus=document.activeElement===retry;loadedServer=null;versions=[];updateAdd();
    versionSelect.disabled=true;versionSelect.replaceChildren(new Option(window.EmberLocale.t('Caricamento versioni…'),''));versionSelect.setAttribute('aria-busy','true');retry.classList.add('hidden');status.textContent='';window.EmberDropdowns?.refresh();
    if(!available.some(s=>s.id===serverId)){versionSelect.replaceChildren(new Option(window.EmberLocale.t('Seleziona un server'),''));versionSelect.setAttribute('aria-busy','false');return;}
    try{
      const result=await call('modrinthVersions',serverId,project);if(generation!==request||!sheet.isConnected)return;
      versions=result;loadedServer=serverId;versionSelect.replaceChildren(...(result.length?result.map(v=>{const option=new Option(`${v.version}${v.type&&v.type!=='release'?' · '+v.type:''}`,v.id);option.setAttribute('translate','no');return option;}):[new Option(window.EmberLocale.t('Nessuna versione compatibile'), '')]));
      versionSelect.disabled=!result.length;status.textContent=result.length?'Versioni compatibili con Minecraft e loader del server.':'Nessuna versione compatibile con questo server.';
    }catch(error){if(generation!==request||!sheet.isConnected)return;versionSelect.replaceChildren(new Option(window.EmberLocale.t('Impossibile caricare le versioni'),''));status.textContent=error.message;retry.classList.remove('hidden');}
    finally{if(generation===request&&sheet.isConnected){versionSelect.setAttribute('aria-busy','false');updateAdd();window.EmberDropdowns?.refresh();if(restoreFocus){const target=!retry.classList.contains('hidden')?retry:!versionSelect.disabled?versionSelect.parentElement.querySelector('.ember-select-trigger'):$('.mod-add-controls .button-group button',sheet);target?.focus();}}}
  };
  select.addEventListener('change',loadVersions);versionSelect.addEventListener('change',updateAdd);retry.addEventListener('click',loadVersions);
  const {response}=await window.EmberDialogs.show({title:'Aggiungi al server',content:sheet,actionsContainer:$('.mod-add-controls',sheet),className:'mod-add-dialog',buttons:['Annulla','Aggiungi'],disabledButtons:[1],cancelId:0,onOpen:loadVersions});
  request++;
  if(!response)return;const server=servers.find(s=>s.id===select.value);if(!server)return;
  if(loadedServer!==server.id||!versions.some(v=>v.id===versionSelect.value))return;
  await perform('modrinth-install',async()=>{
    const plan=await call('modrinthPlan',server.id,project,versionSelect.value),result=await call('modrinthInstall',server.id,plan.token);
    if(result){toast('Installazione Modrinth completata.');fileViews.delete(server.id);navigate('server',server.id,'files');}
  });
}
const fileDrop={zone:null,message:'',active:false,timer:null};
function modImage(url,title){
  let source='';try{const parsed=new URL(url);if(parsed.protocol==='https:'&&parsed.hostname==='cdn.modrinth.com'&&!parsed.username&&!parsed.password&&(!parsed.port||parsed.port==='443'))source=parsed.href;}catch{}
  return `<span class="mod-image" aria-hidden="true"><span translate="no">${esc((title||'?').slice(0,1).toUpperCase())}</span>${source?`<img src="${esc(source)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:''}</span>`;
}
document.addEventListener('error',event=>{if(event.target.matches?.('.mod-image img'))event.target.remove();},true);
let autoScroll = localStorage.getItem('ember-autoscroll') !== 'false';
const content = $('#content');
window.EmberCommands.configure(()=>state.servers.find(server=>server.id===selected)||{});

function applyTheme(theme) {
  const light = theme === 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem('ember-theme', theme); } catch {}
  const toggle = $('#theme-toggle');
  toggle.setAttribute('aria-checked', String(light));
  toggle.title = light ? 'Tema chiaro · Passa alla modalità scura' : 'Tema scuro · Passa alla modalità chiara';
  call('setTheme', theme).catch(e => toast(e.message, true));
}

function hydrate(root = document) { $$('[data-icon]', root).forEach(el => { el.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[el.dataset.icon] || ''}</svg>`; }); }
function toast(message, error = false) {
  const node = document.createElement('div'); node.className = `toast ${error ? 'error' : ''}`;
  node.innerHTML = `${icon(error?'alert':'check')}<span>${esc(message)}</span><button class="icon-button" aria-label="Chiudi notifica">${icon('close')}</button>`;
  node.querySelector('button').onclick = () => node.remove(); $('#toasts').append(node); setTimeout(() => node.remove(), error ? 10000 : 5000);
}
async function perform(key, task, success) {
  if (pending.has(key)) return; pending.add(key);
  $$(`[data-action="${key}"]`).forEach(el => el.disabled = true);
  try { const result = await task(); if (success) toast(success); return result; }
  catch(e) { toast(e.message, true); }
  finally { pending.delete(key); $$(`[data-action="${key}"]`).forEach(el => el.disabled = false); }
}
function heading(title, subtitle, extra = '') { return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${extra}</div>`; }
function hero() {
  return `<section class="hero"><div class="hero-copy"><div class="hero-tag"><span></span>IL PROSSIMO MONDO INIZIA QUI</div><h2>Il tuo server.<br><em>Le tue regole.</em></h2><p>Crea, personalizza e vivi Minecraft con i tuoi amici.<br>Tutto sotto controllo, in un unico spazio.</p><div class="button-group">${button('Crea il tuo server','create','primary','plus')}${button('Come funziona','guide','ghost','arrow')}</div></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orbit two"></div><div class="art-glow"></div><div class="voxel-scene"><div class="voxel"><div class="cube-front">${'<b></b>'.repeat(16)}</div><div class="cube-right"></div><div class="cube-top"></div></div></div><div class="art-spark"></div><div class="art-spark two"></div></div></section>`;
}
function stats(server) {
  const active = state.servers.filter(s => ['online','starting','stopping'].includes(s.status));
  const allocated = active.reduce((n,s) => n + s.ram, 0);
  const players = active.reduce((n,s) => n + s.players.length, 0);
  const items = server ? [
    ['Stato del server', statusLabel(server), '', server.type === 'vanilla' ? 'Minecraft originale' : TYPES[server.type].label, 'server'],
    ['Giocatori online', server.players.length, `/ ${server.maxPlayers}`, 'Rilevati dalla console del server', 'users'],
    ['RAM massima', server.ram, 'GB', 'Limite configurato per Java', 'memory'],
    ['Tempo di attività', uptime(server), '', 'Dall’ultimo avvio del processo', 'clock']
  ] : [
    ['Server creati', state.servers.length, '', `${TYPES ? '7 software disponibili' : ''}`, 'server'],
    ['Server attivi', active.length, '', active.length ? 'Il tuo mondo è in movimento' : 'Pronti quando lo sei tu', 'play'],
    ['Giocatori online', players, '', 'Connessi ai tuoi server', 'users'],
    ['RAM assegnata', allocated, `/ ${state.system.totalMemoryGB} GB`, `${state.system.freeMemoryGB} GB liberi sul sistema`, 'memory']
  ];
  return `<section class="stats-grid">${items.map(([label,value,unit,note,symbol],index) => `<div class="stat"><div class="stat-top"><span>${label}</span>${icon(symbol)}</div><div class="stat-value" ${server && index === 3 ? 'id="uptime"' : ''}>${esc(value)}<small>${unit}</small></div><div class="stat-bottom">${esc(note)}</div>${!server && index === 3 ? `<div class="stat-bar"><span style="width:${Math.min(100, allocated/state.system.totalMemoryGB*100)}%"></span></div>` : ''}</div>`).join('')}</section>`;
}
function uptime(s) {
  if (!s.startedAt || !['online','starting','stopping'].includes(s.status)) return '—';
  const seconds = Math.floor((Date.now()-s.startedAt)/1000);
  return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds/60)}m ${seconds%60}s` : `${Math.floor(seconds/3600)}h ${Math.floor(seconds%3600/60)}m`;
}
function card(s) {
  const active = ['online','starting'].includes(s.status), busy = ['installing','stopping'].includes(s.status);
  return `<article class="server-card" data-server="${s.id}" tabindex="0" role="button" aria-label="Apri ${esc(s.name)}"><div class="card-main"><div class="card-head">${typeIcon(s.type)}${pill(s)}</div><h3>${esc(s.name)}</h3><div class="server-meta">${TYPES[s.type].label}<span class="mini-dot"></span>Minecraft ${esc(s.version)}</div><div class="card-metrics"><span>${icon('memory')}${s.ram} GB RAM</span><span>${icon('users')}${s.players.length} / ${s.maxPlayers}</span><span>${icon('shield')}${s.onlineMode ? 'Autenticato' : 'Offline mode'}</span></div></div><div class="card-footer"><span class="server-address">localhost:${s.port}</span><div class="button-group">${button(active ? 'Arresta' : s.installed ? 'Avvia' : 'Installa', active ? 'card-stop' : s.installed ? 'card-start' : 'card-install', active ? 'danger small' : 'small', active ? 'stop' : s.installed ? 'play' : 'download', `data-id="${s.id}" ${busy?'disabled':''}`)}${deleteButton(s,true)}</div></div></article>`;
}
function deleteButton(s, compact = false) {
  return button(compact ? '' : 'Elimina server','delete-server',compact ? 'danger small' : 'danger','trash',`data-id="${s.id}" title="${s.status==='offline'?'Elimina server: sposta i file nel Cestino':'Arresta il server prima di eliminarlo'}" aria-label="Elimina server ${esc(s.name)}" ${s.status!=='offline'?'disabled':''}`);
}
function newCard() { return `<button class="new-server-card" data-action="create"><span class="new-icon">${icon('plus')}</span><strong>Un nuovo mondo ti aspetta</strong><small>Crea un altro server</small></button>`; }
function emptyStart() {
  return `<div class="start-layout"><section class="panel"><div class="panel-heading"><h3>${icon('spark')} Da dove vuoi iniziare?</h3><span class="eyebrow" style="margin:0;font-size:8px">SCEGLI IL TUO STILE</span></div>${['vanilla','fabric','paper'].map(type => `<button class="template-row" data-action="template" data-type="${type}">${typeIcon(type)}<span class="template-copy"><strong>${TYPES[type].label}</strong><small>${TYPES[type].short}</small></span>${icon('arrow')}</button>`).join('')}</section><section class="panel"><h3>Da zero al tuo mondo, in tre passi.</h3>${[['Scegli il tuo software','Vanilla, plugin o mod? Trova il motore giusto per la tua avventura.'],['Dagli il tuo tocco','Nome, versione, RAM e regole: ogni dettaglio è nelle tue mani.'],['Accendi il tuo mondo','Installazione guidata, Java incluso. Avvia e invita chi vuoi.']].map(([title,desc],i)=>`<div class="step-mini"><span class="step-number">${i+1}</span><div><strong>${title}</strong><p>${desc}</p></div></div>`).join('')}</section></div>`;
}
function renderDashboard() {
  content.innerHTML = `${heading('Bentornato nel tuo spazio.', 'Meno configurazioni. Più avventure.', '<div class="heading-extra">'+icon('clock')+new Date().toLocaleDateString(window.EmberLocale.locale,{day:'numeric',month:'long',year:'numeric'})+'</div>')}${hero()}${stats()}<div class="section-title"><h2>I tuoi mondi <span class="counter">${state.servers.length}</span></h2>${state.servers.length ? button('Tutti i server','all-servers','link','arrow') : '<span class="muted" style="font-size:10px">LA TUA PROSSIMA AVVENTURA</span>'}</div>${state.servers.length ? `<div class="server-grid">${state.servers.slice(0,5).map(card).join('')}${newCard()}</div>` : emptyStart()}<div class="bottom-note">${icon('lock')}I tuoi server e i tuoi mondi restano sul tuo computer. Nessun account richiesto.</div>`;
}
function renderServers() {
  const list = state.servers.filter(s => (filter === 'all' || (filter === 'online' ? ['online','starting'].includes(s.status) : s.status === 'offline')) && `${s.name} ${s.type} ${s.version}`.toLowerCase().includes(query.toLowerCase()));
  content.innerHTML = `${heading('I miei server','Ogni mondo ha una storia. Gestiscile tutte da qui.', `<div class="servers-heading-actions"><div class="search">${icon('search')}<input id="server-search" aria-label="Cerca server" placeholder="Cerca un server…" value="${esc(query)}"></div></div>`)}<div class="section-title"><h2>La tua collezione <span class="counter">${state.servers.length}</span></h2><div class="filters">${[['all','Tutti'],['online','Attivi'],['offline','Offline']].map(([f,label])=>`<button class="filter ${filter===f?'active':''}" data-filter="${f}">${label}</button>`).join('')}</div></div><div class="server-grid">${list.map(card).join('')}${newCard()}</div>${!list.length && state.servers.length ? '<p class="hint">Nessun server corrisponde ai filtri di ricerca.</p>' : ''}`;
  $('#server-search').addEventListener('input', e => { const pos = e.target.selectionStart; query = e.target.value; renderServers(); $('#server-search').focus(); $('#server-search').setSelectionRange(pos,pos); });
  window.EmberWorkspaceUI?.decorate();
}
function controls(s) {
  const active = ['online','starting'].includes(s.status);
  return `<div class="button-group">${button('Cartella','folder','','folder')}${s.status === 'stopping' ? button('Forza arresto','force','danger','stop') : active ? button('Arresta server','stop','danger','stop') : button(s.installed?'Avvia server':'Installa server', s.installed?'start':'install','primary', s.installed?'play':'download', s.status==='installing'?'disabled':'')}</div>`;
}
function serverHeader(s) {
  return `<div class="page-heading"><div class="server-heading">${typeIcon(s.type)}<div><h1>${esc(s.name)}</h1><div class="server-meta">${TYPES[s.type].label} <span class="mini-dot"></span> ${esc(s.version)} <span class="mini-dot"></span> ${pill(s)}</div></div></div>${controls(s)}</div><div class="tabs">${[['overview','Panoramica','grid'],['console','Console','terminal'],['files',['paper','purpur'].includes(s.type)?'Plugin':'Mod','cube'],['backups','Backup','archive'],['settings','Impostazioni','settings']].map(([key,label,symbol])=>`<button class="tab ${tab===key?'active':''}" data-tab="${key}">${icon(symbol)}${label}</button>`).join('')}</div>${s.lastError ? `<div class="notice error">${icon('alert')}<div>${esc(s.lastError)}<br>Apri la scheda Console per i dettagli. Puoi riprovare l’installazione dalle impostazioni.</div></div>` : ''}${s.status==='installing'?`<div class="notice info"><span class="spinner"></span><div>${esc(s.job || 'Operazione in corso')}… Segui i dettagli nella console. Non chiudere l’applicazione.</div></div>`:''}`;
}
function renderServer() {
  const s = state.servers.find(s=>s.id===selected); if (!s) { page='servers'; render(); return; }
  content.innerHTML = serverHeader(s) + '<div id="server-body"></div>';
  const body = $('#server-body');
  if (tab==='overview') renderOverview(s, body);
  if (tab==='console') { body.innerHTML = consoleHTML(s); fillConsole(s.id); }
  if (tab==='files') renderFiles(s, body);
  if (tab==='backups') renderBackupsBody(s, body);
  if (tab==='settings') renderServerSettings(s, body);
  if (tab==='tools') window.EmberWorkspaceUI.renderTools(s,body);
  window.EmberWorkspaceUI?.decorate();
}
function consoleHTML(s, compact=false) {
  return `<div class="console-panel"><div class="console-toolbar"><div class="console-title">${icon('terminal')} Console integrata <span class="status-dot ${s.status}"></span></div><div class="console-actions"><label><input type="checkbox" id="auto-scroll" ${autoScroll?'checked':''}>Scorrimento automatico</label>${button('Esporta','export-logs','small ghost','download')}</div></div><div id="console-lines" class="console-lines ${compact?'compact':''}" role="log" aria-label="Log del server"><div class="console-empty">La console è pronta. I log appariranno durante l’installazione e l’avvio.</div></div><form class="command-form" id="command-form"><span>›</span><input id="command-input" aria-label="Comando server" maxlength="2000" placeholder="Scrivi un comando, es. help, list, say Ciao a tutti…" autocomplete="off" ${['online','starting'].includes(s.status)?'':'disabled'}><button class="icon-button" title="Invia comando" type="submit">${icon('arrow')}</button></form></div>${!compact?'<div class="hint">I comandi vengono inviati al server senza aprire finestre esterne. La console mostra gli ultimi 1.600 messaggi di questa sessione; i log completi del server sono nella cartella logs.</div>':''}`;
}
function appendLine(line) {
  const box = $('#console-lines'); if (!box) return;
  $('.console-empty',box)?.remove();
  const node = document.createElement('div');
  node.className = 'console-line' + (/error|exception|failed|errore|fatal/i.test(line.text)?' error':/Done \(|✓|joined the game/i.test(line.text)?' success':'');
  const time = document.createElement('span'); time.className='log-time'; time.textContent=`[${line.time}]`;
  node.append(time, document.createTextNode(line.text)); box.append(node);
  while(box.childElementCount>1600) box.firstElementChild.remove();
  if(autoScroll) box.scrollTop=box.scrollHeight;
}
async function fillConsole(id) {
  const generation = viewGeneration;
  try { const lines = await call('logs', id); logs.set(id, lines); if(selected!==id || !$('#console-lines') || generation!==viewGeneration) return; $('#console-lines').replaceChildren(); if(!lines.length) $('#console-lines').innerHTML='<div class="console-empty">La console è pronta. Nessun messaggio in questa sessione.</div>'; else lines.forEach(appendLine); } catch(e){toast(e.message,true);}
}
function renderOverview(s, body) {
  body.innerHTML = `${stats(s)}<div class="two-columns"><div class="stack"><section class="panel"><div class="panel-heading"><h3>${icon('link')} Il punto d’incontro</h3>${button('Guida','guide','link','arrow')}</div><div class="address-box"><div><small>SU QUESTO COMPUTER</small><code>localhost:${s.port}</code></div><button class="icon-button" data-copy="localhost:${s.port}" title="Copia indirizzo">${icon('copy')}</button></div>${state.addresses[0] ? `<div class="address-box"><div><small>NELLA STESSA RETE LOCALE</small><code>${state.addresses[0]}:${s.port}</code></div><button class="icon-button" data-copy="${state.addresses[0]}:${s.port}" title="Copia indirizzo LAN">${icon('copy')}</button></div>` : ''}<div class="hint">Minecraft → Multigiocatore → Aggiungi server. Per giocare da Internet configura il router o un tunnel. Non condividere localhost con gli amici.</div></section><div><div class="section-title"><h2>Uno sguardo alla console</h2><button class="button link" data-tab="console">Apri console ${icon('arrow')}</button></div>${consoleHTML(s,true)}</div></div><div class="stack"><section class="panel"><div class="panel-heading"><h3>${icon('server')} Il tuo server, in breve</h3></div>${[['Software',TYPES[s.type].label],['Minecraft',s.version],['Build / loader',s.build||'Ufficiale'],['Modalità',s.gamemode],['Difficoltà',s.difficulty],['Autenticazione',s.onlineMode?'Microsoft / Mojang':'Disattivata'],['Whitelist',s.whitelist?'Attiva':'Disattivata']].map(([k,v])=>`<div class="key-value"><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</section><section class="panel"><div class="panel-heading"><h3>${icon('users')} Giocatori</h3><span class="counter">${s.players.length}</span></div><div class="players-list">${s.players.length?s.players.map(name=>`<div class="player"><span class="player-avatar">${esc(name[0])}</span><span>${esc(name)}</span><span class="status-dot online"></span></div>`).join(''):'<div class="empty-inline">Nessun giocatore connesso, per ora.</div>'}</div><form id="player-form" class="inline-form"><input name="nickname" placeholder="Nickname Minecraft" aria-label="Nickname Minecraft" pattern="[A-Za-z0-9_]{3,16}" maxlength="16" required><select name="operation" aria-label="Azione giocatore" class="button small"><option value="whitelist add">Whitelist +</option><option value="whitelist remove">Whitelist −</option><option value="op">Operatore +</option><option value="deop">Operatore −</option><option value="kick">Espelli</option></select><button class="button small" type="submit" ${s.status!=='online'?'disabled':''}>${icon('check')}</button></form><div class="hint">Le azioni richiedono il server online. Concedi i permessi operatore solo a persone fidate.</div></section></div></div>`;
  fillConsole(s.id);
}
async function renderFiles(s, body) {
  const plugin = ['paper','purpur'].includes(s.type), generation=viewGeneration;
  const view=fileViews.get(s.id)||{entries:[],selected:new Set(),working:false,loaded:false};fileViews.set(s.id,view);
  body.innerHTML = `${s.type==='vanilla'?`<div class="notice">${icon('info')}Vanilla non carica mod o plugin. Crea un server Fabric/Forge/NeoForge/Quilt per le mod oppure Paper/Purpur per i plugin.</div>`:''}<section class="panel"><div class="panel-heading"><div><h3>${icon('cube')} ${plugin?'Plugin':'Mod'} del server</h3></div><div class="button-group">${button('Sfoglia Modrinth','modrinth','','external')}${button('Apri cartella','mods-folder','','folder')}${button('Importa .jar','import-files','primary','plus',s.type==='vanilla'||s.status!=='offline'?'disabled':'')}${button('','files-refresh','small','refresh','title="Aggiorna elenco" aria-label="Aggiorna elenco"')}</div></div><p>${plugin?'Personalizza il gameplay con plugin compatibili con Paper.':'Aggiungi file .jar compatibili con il loader e la versione Minecraft del tuo server.'}</p><div class="notice info">${icon('shield')}Installa soltanto file da fonti fidate: mod e plugin eseguono codice sul tuo computer. ${plugin?'Non installare mod Fabric o Forge nella cartella plugins.':'Le mod necessarie sul client devono essere installate anche dai giocatori. Fabric API non è inclusa automaticamente.'} Arresta il server prima di modificare i file.</div><div id="file-list" class="loading"><span class="spinner"></span>Lettura dei file…</div><div id="file-selection-bar" class="file-selection-bar hidden" role="region" aria-label="Azioni sui file selezionati"><div class="file-selection-info">${icon('check')}<strong id="file-selection-count" aria-live="polite"></strong></div><div class="button-group">${button('Attiva','file-action','small green','play','data-file-operation="enable"')}${button('Disattiva','file-action','small','stop','data-file-operation="disable"')}${button('Elimina','file-action','small danger','trash','data-file-operation="delete"')}${button('Deseleziona','files-clear','small ghost','close')}</div><div id="file-selection-warning" class="file-selection-warning hidden">Le azioni richiedono il server fermo e nessun’altra operazione in corso.</div></div><div id="file-action-hint" class="hint hidden">Le modifiche vengono applicate al prossimo avvio. Controlla le dipendenze prima di disattivare o eliminare file.</div></section>`;
  $('#file-selection-bar').dataset.localeContext='file-actions';
  $('#file-list').closest('.panel').id='files-panel';
  $('#files-panel .notice').insertAdjacentHTML('beforebegin','<div class="hint file-drop-hint">Puoi anche trascinare qui i file .jar dal computer.</div>');
  $('#files-panel .panel-heading .button-group').insertAdjacentHTML('afterbegin',button('Installa da Modrinth','server-modrinth','primary','plus',s.type==='vanilla'?'disabled':''));
  if(view.loaded){drawFiles(s,view);if(view.working)return;}
  try {
    const files=await call('fileEntries',s.id);
    if(generation!==viewGeneration||page!=='server'||selected!==s.id||tab!=='files'||view.working||!$('#file-list'))return;
    view.entries=files;view.loaded=true;drawFiles(s,view);
  }catch(e){toast(e.message,true);if(generation===viewGeneration&&$('#file-list')){$('#file-list').className='';$('#file-list').innerHTML=`<div class="notice error">${icon('alert')}${esc(e.message)}</div>`;}}
}
function drawFiles(s,view) {
  const list=$('#file-list');if(!list)return;
  const names=new Set(view.entries.map(file=>file.name));view.selected=new Set([...view.selected].filter(name=>names.has(name)));
  list.className='';
  if(!view.entries.length){
    const plugin=['paper','purpur'].includes(s.type);
    list.innerHTML=`<div class="empty-panel">${icon('cube')}<h3>Spazio alle possibilità.</h3><p>Nessun file .jar presente. Importa i tuoi ${plugin?'plugin':'mod'} o apri la cartella per gestirli manualmente.</p></div>`;
  }else{
    list.innerHTML=`<div class="file-list-tools"><label class="file-select-all"><input id="files-select-all" type="checkbox">Seleziona tutte</label><span>${view.entries.length} file</span></div><div class="mod-file-list" role="list">${view.entries.map(file=>`<div class="file-row mod-file-row" role="listitem" data-file-row="${esc(file.name)}" title="${esc(file.name)}"><input type="checkbox" class="file-checkbox" data-file-select="${esc(file.name)}" aria-label="Seleziona ${esc(file.displayName)}">${icon('cube')}<div class="file-copy"><strong>${esc(file.displayName)}</strong><small>${['paper','purpur'].includes(s.type)?'plugins':'mods'} · ${size(file.size)}${file.enabled?'':' · .jar.disabled'}</small></div><span class="status-pill ${file.enabled?'online':'offline'}"><span class="status-dot ${file.enabled?'online':'offline'}"></span>${file.enabled?'Attiva':'Disattivata'}</span></div>`).join('')}</div>`;
  }
  updateFileSelection(s.id);
}
function updateFileSelection(id) {
  if(page!=='server'||selected!==id||tab!=='files')return;
  const view=fileViews.get(id),s=state.servers.find(item=>item.id===id),bar=$('#file-selection-bar');if(!view||!s||!bar)return;
  const chosen=view.entries.filter(file=>view.selected.has(file.name)),locked=view.working||s.status!=='offline';
  $$('[data-file-select]').forEach(input=>{input.checked=view.selected.has(input.dataset.fileSelect);input.disabled=view.working;input.closest('.mod-file-row').classList.toggle('is-selected',input.checked);});
  const all=$('#files-select-all');if(all){all.checked=chosen.length>0&&chosen.length===view.entries.length;all.indeterminate=chosen.length>0&&chosen.length<view.entries.length;all.disabled=view.working;}
  bar.classList.toggle('hidden',!chosen.length);$('#file-selection-count').textContent=chosen.length===1?'1 file selezionato':`${chosen.length} file selezionati`;
  $('[data-file-operation="enable"]').disabled=locked||!chosen.some(file=>!file.enabled);
  $('[data-file-operation="disable"]').disabled=locked||!chosen.some(file=>file.enabled);
  $('[data-file-operation="delete"]').disabled=locked;
  $('[data-action="files-clear"]').disabled=view.working;
  $('[data-action="files-refresh"]').disabled=view.working;
  $('[data-action="import-files"]').disabled=view.working||s.status!=='offline'||s.type==='vanilla';
  $('#file-selection-warning').classList.toggle('hidden',!locked);
  $('#file-action-hint').classList.toggle('hidden',!view.entries.length);
}
async function runFileAction(operation) {
  const id=selected,view=fileViews.get(id);if(!view||view.working||!view.selected.size)return;
  view.working=true;updateFileSelection(id);
  try{
    const result=await call('manageFiles',id,[...view.selected],operation);if(!result)return;
    view.selected=new Set(result.failed.map(item=>item.name));view.entries=await call('fileEntries',id);view.loaded=true;
    if(page==='server'&&selected===id&&tab==='files')drawFiles(state.servers.find(s=>s.id===id),view);
    if(result.failed.length){toast(result.failed.length===1?'Operazione parziale: 1 file non modificato.':`Operazione parziale: ${result.failed.length} file non modificati.`,true);toast(result.failed[0].error,true);}
    if(result.changed.length){const singular=result.changed.length===1;toast(`${result.changed.length} file ${operation==='enable'?(singular?'attivato':'attivati'):operation==='disable'?(singular?'disattivato':'disattivati'):(singular?'spostato nel Cestino':'spostati nel Cestino')}.`);}
  }catch(e){toast(e.message,true);}
  finally{view.working=false;updateFileSelection(id);}
}
function resetFileDrop() {
  clearTimeout(fileDrop.timer);fileDrop.timer=null;fileDrop.active=false;
  if(fileDrop.zone){fileDrop.zone.classList.remove('is-visible','is-over');fileDrop.zone.setAttribute('aria-hidden','true');}
}
function fileDropContext(allowNavigation=false) {
  if(wizard||wizardCloseTask)return {reason:'Chiudi prima la finestra di creazione del server.'};
  if(page!=='server'||!selected)return {reason:'Apri un server per scegliere dove importare i file .jar.'};
  const s=state.servers.find(item=>item.id===selected);if(!s)return {reason:'Server non trovato.'};
  if(tab!=='files'){
    if(formDirty)return {reason:'Salva o annulla le modifiche prima di importare i file.'};
    if(!allowNavigation)return {reason:'Rilascia i file nel riquadro della sezione Mod o Plugin.'};
    window.EmberDropdowns?.close();navigate('server',s.id,'files');
  }
  if(s.type==='vanilla')return {s,reason:'Vanilla non supporta mod o plugin. Usa Fabric/Forge/NeoForge/Quilt per le mod, Paper/Purpur per i plugin.'};
  if(fileViews.get(s.id)?.working||s.status==='installing')return {s,reason:'Attendi il completamento dell’operazione in corso.'};
  if(s.status!=='offline')return {s,reason:'Arresta il server prima di importare file.'};
  return {s,reason:''};
}
function showFileDrop(context) {
  if(!context.s||!$('#files-panel')){resetFileDrop();return false;}
  if(!fileDrop.zone){
    const zone=document.createElement('div');zone.id='file-drop-zone';zone.className='file-drop-zone';zone.setAttribute('role','status');zone.setAttribute('aria-live','polite');zone.setAttribute('aria-hidden','true');
    zone.innerHTML=`<div class="file-drop-symbol">${icon('plus')}</div><strong id="file-drop-title"></strong><span id="file-drop-description"></span>`;
    document.body.append(zone);fileDrop.zone=zone;
  }
  const plugin=['paper','purpur'].includes(context.s.type),key=(plugin?'plugins':'mods')+'|'+context.reason;
  if(fileDrop.message!==key){
    $('#file-drop-title').textContent=plugin?'Rilascia qui i plugin .jar':'Rilascia qui le mod .jar';
    $('#file-drop-description').textContent=context.reason||'Puoi trascinare più file insieme. Gli originali non verranno spostati.';
    fileDrop.message=key;
  }
  const panel=$('#files-panel').getBoundingClientRect(),list=$('#file-list').getBoundingClientRect();
  const bottom=Math.min(innerHeight-20,panel.bottom-16),top=Math.max(16,panel.top+16,Math.min(list.top,bottom-210));
  const left=Math.max(16,panel.left+18),right=Math.min(innerWidth-16,panel.right-18),height=Math.min(210,bottom-top);
  if(height<100||right-left<180){resetFileDrop();return false;}
  Object.assign(fileDrop.zone.style,{left:left+'px',top:top+'px',width:(right-left)+'px',height:height+'px'});
  fileDrop.zone.classList.toggle('is-blocked',!!context.reason);fileDrop.zone.classList.add('is-visible');fileDrop.zone.setAttribute('aria-hidden','false');fileDrop.active=true;
  clearTimeout(fileDrop.timer);fileDrop.timer=setTimeout(resetFileDrop,1000);return true;
}
function insideFileDrop(event) {
  if(!fileDrop.active)return false;
  const box=fileDrop.zone.getBoundingClientRect();return event.clientX>=box.left&&event.clientX<=box.right&&event.clientY>=box.top&&event.clientY<=box.bottom;
}
function isFileDrag(event) {return [...(event.dataTransfer?.types||[])].includes('Files')||!!event.dataTransfer?.files?.length;}
async function importDraggedFiles(id,files) {
  const view=fileViews.get(id);if(!view||view.working)return;
  view.working=true;updateFileSelection(id);
  try{
    const count=await window.ember.importDroppedFiles(id,files);
    if(count)toast(count===1?'1 file importato.':`${count} file importati.`);
  }catch(e){toast(e.message,true);}
  finally{
    try{
      view.entries=await call('fileEntries',id);view.loaded=true;
      if(page==='server'&&selected===id&&tab==='files')drawFiles(state.servers.find(s=>s.id===id),view);
    }catch(e){if(page==='server'&&selected===id&&tab==='files')toast(e.message,true);}
    view.working=false;updateFileSelection(id);
  }
}
for(const eventName of ['dragenter','dragover'])document.addEventListener(eventName,event=>{
  if(!isFileDrag(event))return;event.preventDefault();
  if(!fileDrop.active)window.EmberDropdowns?.close();
  const context=fileDropContext(true),shown=showFileDrop(context),inside=shown&&insideFileDrop(event);
  if(shown)fileDrop.zone.classList.toggle('is-over',inside&&!context.reason);
  if(event.dataTransfer)event.dataTransfer.dropEffect=inside&&!context.reason?'copy':'none';
});
document.addEventListener('dragleave',event=>{if(fileDrop.active&&!event.relatedTarget&&(event.clientX<=0||event.clientY<=0||event.clientX>=innerWidth||event.clientY>=innerHeight))resetFileDrop();});
document.addEventListener('drop',async event=>{
  if(!isFileDrag(event))return;event.preventDefault();
  const context=fileDropContext(),inside=insideFileDrop(event),files=[...(event.dataTransfer?.files||[])];resetFileDrop();
  if(context.reason){toast(context.reason,true);return;}
  if(!inside){toast('Rilascia i file nel riquadro della sezione Mod o Plugin.',true);return;}
  if(!files.length||files.some(file=>!/^.+\.jar$/i.test(file.name))){toast('Sono consentiti soltanto file .jar.',true);return;}
  await importDraggedFiles(context.s.id,files);
});
document.addEventListener('dragend',resetFileDrop);window.addEventListener('blur',resetFileDrop);
async function renderBackupsBody(s, body) {
  const generation=viewGeneration;
  body.innerHTML=`<section class="panel"><div class="panel-heading"><h3>${icon('archive')} Un posto sicuro per i tuoi mondi</h3><div class="button-group">${button('Apri cartella','backups-folder','','folder',`data-id="${s.id}"`)}${button('Crea backup','backup','primary','plus',`data-id="${s.id}" ${s.status!=='offline'?'disabled':''}`)}</div></div><p>Archivio ZIP completo: mondo, configurazione, mod, plugin e profilo del server. I backup restano separati dai file di gioco.</p><div class="notice info">${icon('info')}Per creare un backup coerente il server deve essere arrestato. Per ripristinarlo: arresta il server, conserva una copia attuale e sostituisci i file della sua cartella con il contenuto dello ZIP. I backup non vengono caricati online.</div><div id="backup-list" class="loading"><span class="spinner"></span>Lettura backup…</div></section>`;
  try { const files=await call('backups',s.id); if(generation!==viewGeneration||!$('#backup-list'))return; $('#backup-list').className=''; $('#backup-list').innerHTML=files.length?files.map(f=>`<div class="file-row">${icon('archive')}<div class="file-copy"><strong>${esc(f.name)}</strong><small>${date(f.date)}</small></div><span class="file-size">${size(f.size)}</span>${button('Ripristina','restore','small','refresh',`data-id="${s.id}" data-name="${esc(f.name)}" ${s.status!=='offline'?'disabled':''}`)}</div>`).join(''):`<div class="empty-panel">${icon('archive')}<h3>Proteggi la tua prossima avventura.</h3><p>Ancora nessun backup. Creane uno prima di installare nuove mod o cambiare il tuo mondo.</p></div>`; }catch(e){toast(e.message,true);}
}
function option(value,label,current) { return `<option value="${esc(value)}" ${value===current?'selected':''}>${label}</option>`; }
function field(name,label,value,type='text',extra='',hint='') { return `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}>${hint?`<small>${hint}</small>`:''}</div>`; }
function modeFields(data) {
  return `<div class="field"><label for="f-gamemode">Modalità di gioco</label><select id="f-gamemode" name="gamemode">${[['survival','Sopravvivenza'],['creative','Creativa'],['adventure','Avventura'],['spectator','Spettatore']].map(([v,l])=>option(v,l,data.gamemode)).join('')}</select></div><div class="field"><label for="f-difficulty">Difficoltà</label><select id="f-difficulty" name="difficulty">${[['peaceful','Pacifica'],['easy','Facile'],['normal','Normale'],['hard','Difficile']].map(([v,l])=>option(v,l,data.difficulty)).join('')}</select></div>`;
}
function toggle(name,label,desc,checked) { return `<div class="toggle-row"><div><strong>${label}</strong><p>${desc}</p></div><label class="switch"><input type="checkbox" name="${name}" aria-label="${label}" ${checked?'checked':''}><span></span></label></div>`; }
function renderServerSettings(s,body) {
  const disabled=s.status!=='offline';
  body.innerHTML=`${disabled?`<div class="notice">${icon('info')}Arresta il server e attendi il completamento delle operazioni per modificare le impostazioni.</div>`:''}<form id="settings-form"><fieldset style="border:0;margin:0;padding:0" ${disabled?'disabled':''}><div class="settings-grid"><section class="panel"><div class="panel-heading"><h3>${icon('settings')} Il mondo, come lo vuoi tu</h3></div><div class="form-grid">${field('name','Nome del server',s.name,'text','required maxlength="48"')}${field('port','Porta',s.port,'number','min="1024" max="65535" required')}${field('ram','RAM massima (GB)',s.ram,'number',`min="1" max="${state.system.totalMemoryGB}" required`)}${field('maxPlayers','Posti disponibili',s.maxPlayers,'number','min="1" max="500" required')}${modeFields(s)}${field('motd','Messaggio del server (MOTD)',s.motd,'text','maxlength="160"')}${field('seed','Seed del mondo',s.seed,'text','maxlength="100"','Cambiare il seed non rigenera un mondo già esistente.')}</div></section><section class="panel"><div class="panel-heading"><h3>${icon('shield')} Accesso e regole</h3></div>${toggle('onlineMode','Autenticazione premium','Verifica gli account Microsoft/Mojang. Raccomandata per la sicurezza.',s.onlineMode)}${toggle('whitelist','Solo su invito','Consenti l’accesso soltanto ai nickname nella whitelist.',s.whitelist)}${toggle('pvp','Combattimento tra giocatori','Consenti ai giocatori di danneggiarsi a vicenda.',s.pvp)}<div class="hint">Le impostazioni avanzate sono in server.properties nella cartella del server. I valori non gestiti da Ember vengono mantenuti.</div></section></div><div class="form-actions">${button('Salva modifiche','save-settings','primary','check','type="submit"')}</div></fieldset></form><div class="settings-grid" style="margin-top:24px"><section class="panel"><h3>Software e installazione</h3><p>${TYPES[s.type].label} ${esc(s.version)}${s.build?' · Build '+esc(s.build):''}. Per cambiare software o versione crea un nuovo server: eviterai incompatibilità e danni al mondo.</p>${button('Ripara installazione','install','','refresh',disabled?'disabled':'')}<div class="hint">Riscarica il software, senza cancellare il mondo. Crea un backup prima di procedere.</div></section><section class="panel danger-zone"><h3>Archivia questo server</h3><p>Rimuovilo dalla dashboard senza cancellare i file del mondo. I dati resteranno nella cartella archivio.</p>${button('Archivia server','remove','danger','archive',disabled?'disabled':'')}</section></div>`;
  body.insertAdjacentHTML('beforeend', `<section class="panel danger-zone" style="margin-top:19px"><h3>Elimina server</h3><p>Rimuovi il server e sposta la sua cartella nel Cestino di Windows, compresi mondo, mod, plugin e configurazioni. I backup ZIP già creati saranno conservati. Verrà richiesta una conferma.</p>${deleteButton(s)}</section>`);
  $('#settings-form').addEventListener('input',()=>formDirty=true);
}
function renderGlobalBackups() {
  content.innerHTML=heading('I tuoi punti di ritorno.','Conserva i tuoi mondi prima del prossimo grande cambiamento.')+`<div class="notice info">${icon('shield')}I backup sono locali. Configura quelli automatici nella scheda Backup del server e copia gli ZIP su un altro disco per proteggerti dai guasti.</div><div class="server-grid">${state.servers.map(s=>`<section class="panel"><div class="panel-heading">${typeIcon(s.type)}${pill(s)}</div><h3>${esc(s.name)}</h3><p>${TYPES[s.type].label} · ${esc(s.version)}</p>${button('Gestisci backup','view-backups','wide','archive',`data-id="${s.id}"`)}</section>`).join('')}</div>${!state.servers.length?`<div class="empty-panel">${icon('archive')}<h3>Prima un mondo. Poi un punto di ritorno.</h3><p>Crea il tuo primo server per iniziare a salvare i backup.</p>${button('Crea server','create','primary','plus')}</div>`:''}`;
}
function renderGuide() {
  content.innerHTML=`${heading('Le avventure migliori sono condivise.','Tutto quello che serve per invitare i tuoi amici.')}<div class="guide-hero"><div class="eyebrow">CONNESSIONI, SENZA MISTERI</div><h2>Il server è sul tuo PC. Gli amici possono essere ovunque.</h2><p>Ember gestisce server Minecraft Java Edition locali. Non include un servizio relay come Feather: scegli qui sotto il modo più adatto per collegarti. Il PC e il server devono rimanere accesi.</p></div><div class="guide-grid"><section class="guide-card">${icon('cpu')}<div class="tag">01 / SUL TUO COMPUTER</div><h3>Entra nel tuo mondo</h3><p>Avvia il server da Ember e attendi lo stato Online.</p><ol><li>Apri Minecraft Java della stessa versione.</li><li>Vai su Multigiocatore → Aggiungi server.</li><li>Inserisci <code>localhost:25565</code> o la porta che hai scelto.</li></ol><p>Con un server moddato, installa anche sul client il loader e le mod richieste.</p></section><section class="guide-card">${icon('network')}<div class="tag">02 / STESSA RETE WI-FI O LAN</div><h3>Vicini di avventura</h3><p>I tuoi amici possono usare l’indirizzo locale del tuo PC.</p><ol><li>Collegatevi alla stessa rete.</li><li>Copia l’indirizzo LAN dalla panoramica del server.</li><li>Consenti Java nel firewall Windows per le reti private, se richiesto.</li></ol><p>${state.addresses.length?'Indirizzi rilevati: '+state.addresses.map(a=>'<code>'+esc(a)+'</code>').join(' '):'Nessun indirizzo LAN rilevato. Controlla la connessione di rete.'}</p></section><section class="guide-card">${icon('globe')}<div class="tag">03 / VIA INTERNET</div><h3>Amici, senza confini</h3><p>Due strade: inoltro porta sul router o un servizio tunnel esterno.</p><ol><li>Router: inoltra la porta <strong>TCP</strong> del server verso l’IP LAN del PC e configura il firewall.</li><li>Condividi IP pubblico e porta. Con CGNAT potrebbe non funzionare.</li><li>In alternativa configura un tunnel Minecraft, ad esempio playit.gg.</li></ol>${button('Scopri playit.gg','playit','small','external')}<div class="hint">Servizio esterno, da installare e configurare separatamente. Disponibilità e limiti dipendono dal fornitore.</div></section></div><div class="notice" style="margin-top:23px">${icon('shield')}Lascia attiva l’autenticazione premium, usa una whitelist e non condividere accessi amministrativi o password. Ember non modifica automaticamente firewall e router, non apre porte e non pubblica il tuo IP.</div><section class="panel"><h3>Quali versioni e mod devono avere i giocatori?</h3><p>La stessa versione Minecraft del server. Per Vanilla/Paper/Purpur in genere basta il client originale. Per Fabric/Forge/NeoForge/Quilt servono il loader corrispondente e tutte le mod richieste sul client. Le mod esclusivamente server-side non vanno necessariamente installate dai giocatori.</p></section>`;
}
function renderPreferences() {
  content.innerHTML=`${heading('Fatto per essere tuo.','Un workspace locale, trasparente e senza sorprese.')}<div class="two-columns"><div class="stack"><section class="panel"><div class="panel-heading"><h3>${icon('folder')} I tuoi dati</h3>${button('Apri cartella dati','data-folder','small','folder')}</div><p>Server, runtime Java e backup sono separati dall’applicazione. Puoi aggiornare o spostare il programma senza cancellare i tuoi mondi.</p><div class="address-box"><code style="font-size:11px">${esc(state.root)}</code></div><div class="key-value"><span>Server</span><strong>Dati / servers</strong></div><div class="key-value"><span>Backup ZIP</span><strong>Dati / backups</strong></div><div class="key-value"><span>Java gestito</span><strong>Dati / runtimes</strong></div><div class="key-value"><span>Server archiviati</span><strong>Dati / archivio</strong></div><div class="hint">Per trasferire tutto, chiudi Ember e copia l’intera cartella Dati. I profili sono conservati nel file servers.json.</div></section><section class="panel"><h3>Il tuo sistema</h3><div class="key-value"><span>Memoria fisica</span><strong>${state.system.totalMemoryGB} GB</strong></div><div class="key-value"><span>Memoria disponibile</span><strong>${state.system.freeMemoryGB} GB</strong></div><div class="key-value"><span>Processori logici</span><strong>${state.system.cpus}</strong></div><p style="margin-top:14px">Non assegnare tutta la RAM ai server: lascia spazio a Windows, Minecraft e alle altre applicazioni. Per iniziare bastano spesso 4 GB; i modpack possono richiederne di più.</p></section></div><div class="stack"><section class="panel"><div class="eyebrow">EMBER SERVER STUDIO</div><h3>Il tuo server. Le tue regole.</h3><p>Versione 1.0.0 · Windows x64<br>Server Minecraft Java Edition, gestiti da un’unica interfaccia. Senza terminali e senza account Ember.</p><div class="key-value"><span>Software supportati</span><strong>Vanilla, Paper, Purpur, Fabric, Forge, NeoForge, Quilt</strong></div><div class="key-value"><span>Telemetria Ember</span><strong>Assente</strong></div><div class="key-value"><span>Aggiornamento cataloghi</span><strong>Dai servizi ufficiali</strong></div></section><section class="panel"><h3>Prima di partire</h3><p>È necessaria una connessione Internet per i cataloghi e la prima installazione. Java viene scaricato da Eclipse Adoptium e verificato tramite checksum, senza modificare il Java di sistema.</p><p>Minecraft può inviare dati diagnostici secondo le proprie impostazioni. Eventuali plugin e mod hanno proprie politiche e connessioni.</p>${button('EULA di Minecraft','eula','small','external')}</section><section class="panel"><h3>Un progetto indipendente</h3><p>Ember non è affiliato a Feather Client, Mojang o Microsoft. Non utilizza marchi, servizi o codice proprietario di Feather. Minecraft appartiene ai rispettivi titolari.</p></section></div></div>`;
  content.insertAdjacentHTML('afterbegin',`<section class="panel language-panel"><div class="panel-heading"><h3>${icon('globe')} Lingua dell’applicazione</h3></div><p>Scegli la lingua dell’interfaccia. La preferenza viene salvata automaticamente.</p><div class="field"><label for="app-language">Lingua dell’applicazione</label><select id="app-language" name="language">${Object.entries(window.EmberLocale.languages).map(([code,item])=>option(code,item.name,window.EmberLocale.get())).join('')}</select><small>I nomi dei server, i file, i comandi e i log originali non vengono tradotti.</small></div></section>`);
  content.prepend($('.page-heading',content));
}
function render() {
  viewGeneration++;
  const labels={dashboard:'Panoramica',servers:'I miei server',backups:'Backup',guide:'Gioca con gli amici',settings:'Preferenze',modrinth:'Libreria Modrinth',tunnels:'VPS e tunnel'};
  $('#breadcrumb').textContent=page==='server'?(state.servers.find(s=>s.id===selected)?.name || 'Server'):labels[page];
  $('#breadcrumb').setAttribute('translate',page==='server'?'no':'yes');
  $$('.nav[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===(page==='server'?'servers':page)));
  $('#nav-count').textContent=state.servers.length;
  if(page==='modrinth')renderModrinth();
  if(page==='tunnels')window.EmberTunnelsUI.renderVps();
  $('#quick-servers').innerHTML=state.servers.length?state.servers.map(s=>`<button class="quick-server" data-server="${s.id}"><span class="status-dot ${s.status}"></span><span>${esc(s.name)}</span></button>`).join(''):'<p>Nessun server, per ora.</p>';
  const active=state.servers.filter(s=>['online','starting','stopping'].includes(s.status)).length;
  $('#status-summary').textContent=active?`${active} server attiv${active===1?'o':'i'} · Il tuo PC ospita l’avventura`:'Tutto pronto per il tuo prossimo mondo';
  if(page==='dashboard')renderDashboard(); if(page==='servers')renderServers(); if(page==='server')renderServer(); if(page==='backups')renderGlobalBackups(); if(page==='guide')renderGuide(); if(page==='settings')renderPreferences();
  window.EmberWorkspaceUI?.decorate();
  window.EmberTunnelsUI?.decorate();
}
const navigationHistory=[];
let navigationIndex=-1,navigationPrompt=false;
function currentRoute(){return {page,selected,tab,filter,query,modrinth:{query:modrinthView.query,serverId:modrinthView.serverId,offset:modrinthView.offset},scroll:window.scrollY};}
function navigate(next, id, nextTab='overview',historyIndex=null) {
  if(formDirty){
    if(navigationPrompt)return;navigationPrompt=true;
    window.EmberDialogs.confirm('Hai modifiche non salvate. Vuoi uscire senza salvarle?').then(ok=>{navigationPrompt=false;if(ok){formDirty=false;navigate(next,id,nextTab,historyIndex);}});return;
  }
  const previous=currentRoute();
  if(navigationIndex<0){navigationHistory.push(previous);navigationIndex=0;}else navigationHistory[navigationIndex]=previous;
  if(historyIndex!==null){
    const route=navigationHistory[historyIndex];if(!route)return;
    next=route.page;id=route.selected;nextTab=route.tab;filter=route.filter;query=route.query;Object.assign(modrinthView,route.modrinth);navigationIndex=historyIndex;
  }
  const resetModrinth=next==='modrinth'&&previous.page!=='modrinth';
  if(resetModrinth){modrinthView.query='';modrinthView.offset=0;modrinthView.hits=[];}
  resetFileDrop();
  formDirty=false;page=next;if(id)selected=id;tab=nextTab;render(); window.scrollTo(0,0);
  if(historyIndex===null){
    const route=currentRoute();
    if(previous.page!==route.page||previous.selected!==route.selected||previous.tab!==route.tab){navigationHistory.splice(navigationIndex+1);navigationHistory.push(route);navigationIndex++;if(navigationHistory.length>100){navigationHistory.shift();navigationIndex--;}}
  }else window.scrollTo(0,resetModrinth?0:navigationHistory[navigationIndex].scroll||0);
}
function travelNavigation(direction){
  if(wizard||wizardCloseTask||document.querySelector('.ember-dialog-layer'))return;
  const target=navigationIndex+(direction==='back'?-1:1);if(target<0||target>=navigationHistory.length)return;
  const route=navigationHistory[target];navigate(route.page,route.selected,route.tab,target);
}
window.ember.onNavigation(travelNavigation);
document.addEventListener('auxclick',event=>{if(event.button===3||event.button===4)event.preventDefault();});

/* Creazione guidata */
const wizardCatalogs = new Map();
const wizardCatalogRequests = new Map();
let wizardCloseTask = null;
function openWizard(type='fabric') {
  if(wizardCloseTask){wizardCloseTask.then(()=>openWizard(type));return;}
  if(wizard)return;
  resetFileDrop();
  previousFocus=document.activeElement;
  const used=new Set(state.servers.map(s=>s.port));let port=25565;while(used.has(port))port++;
  wizard={step:0,name:'Il mio mondo',type,version:'',ram:Math.min(4,Math.max(1,Math.floor(state.system.freeMemoryGB/2))),port,maxPlayers:20,gamemode:'survival',difficulty:'normal',motd:'Un nuovo mondo, insieme.',seed:'',onlineMode:true,whitelist:false,pvp:true,eula:false,versions:[],loading:true,error:'',creating:false};
  document.body.style.overflow='hidden';renderWizard(); loadVersions(type);
}
function closeWizard() {
  if(wizard?.creating)return Promise.resolve(false);
  if(wizardCloseTask)return wizardCloseTask;
  if(!wizard)return Promise.resolve(false);
  const layer=$('#modal-layer'),modal=$('.modal',layer),focus=previousFocus;
  let animations=[];
  // Invalida subito i cataloghi in attesa, ma conserva la finestra fino
  // alla fine dell'animazione. Tutti i percorsi di chiusura usano questo punto.
  wizard=null;catalogToken++;layer.classList.add('is-closing');
  if(modal)modal.inert=true;
  const finish=()=>{
    layer.classList.add('hidden');layer.replaceChildren();layer.classList.remove('is-closing');
    // fill:forwards resta attivo anche dopo animation.finished: cancellare
    // gli effetti prima del riutilizzo dello sfondo, altrimenti resta opacity:0.
    animations.forEach(animation=>animation.cancel());
    document.body.style.overflow='';wizardCloseTask=null;previousFocus=null;
    if(focus?.isConnected)focus.focus({preventScroll:true});
    return true;
  };
  if(!modal||matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve(finish());
  const panelStyle=getComputedStyle(modal),backdropStyle=getComputedStyle(layer);
  const timing={duration:180,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'};
  animations=[
    modal.animate([{opacity:panelStyle.opacity,transform:panelStyle.transform},{opacity:0,transform:'translateY(12px) scale(.98)'}],timing),
    layer.animate([{opacity:backdropStyle.opacity},{opacity:0}],timing)
  ];
  wizardCloseTask=Promise.allSettled(animations.map(animation=>animation.finished)).then(finish);
  return wizardCloseTask;
}
async function loadVersions(type) {
  const token=++catalogToken;
  const apply = versions => {
    if(!wizard||token!==catalogToken)return;
    captureWizard();wizard.versions=versions;wizard.version=versions[0];wizard.loading=false;wizard.error='';updateWizardCatalog();
  };
  if(wizardCatalogs.has(type)){apply(wizardCatalogs.get(type));return;}
  updateWizardCatalog();
  let request=wizardCatalogRequests.get(type);
  if(!request){request=call('catalog',type);wizardCatalogRequests.set(type,request);}
  try {const versions=await request;wizardCatalogs.set(type,versions);apply(versions);}
  catch(e){if(!wizard||token!==catalogToken)return;wizard.loading=false;wizard.error=e.message;updateWizardCatalog();}
  finally{if(wizardCatalogRequests.get(type)===request)wizardCatalogRequests.delete(type);}
}
function updateWizardCatalog() {
  if(!wizard||wizard.step!==0)return;
  const w=wizard,select=$('#wizard-version');if(!select)return;
  const options=w.loading?[new Option('Caricamento catalogo ufficiale…','')]:w.versions.length?w.versions.map(v=>new Option(v,v,false,v===w.version)):[new Option('Catalogo non disponibile','')];
  select.replaceChildren(...options);select.disabled=w.loading||!w.versions.length;select.setAttribute('aria-busy',String(w.loading));
  const error=$('#wizard-error');error.textContent=w.error;error.classList.toggle('hidden',!w.error);
  $('#catalog-retry').classList.toggle('hidden',!w.error);
  $('#wizard-form button[type="submit"]').disabled=w.loading||w.creating||!w.versions.length;
}
function selectWizardType(type) {
  if(!wizard||wizard.step!==0||wizard.type===type||!TYPES[type])return;
  captureWizard();wizard.type=type;wizard.version='';wizard.versions=[];wizard.loading=true;wizard.error='';
  $$('[data-wizard-type]',$('#modal-layer')).forEach(button=>{
    const selected=button.dataset.wizardType===type;
    button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
  });
  $$('[data-description-type]',$('#modal-layer')).forEach(item=>{
    const selected=item.dataset.descriptionType===type;
    item.classList.toggle('active',selected);item.setAttribute('aria-hidden',String(!selected));
  });
  loadVersions(type);
}
function captureWizard() {
  const form=$('#wizard-form');if(!form||!wizard)return;
  const data=new FormData(form);
  for(const [key,value]of data)if(key!=='eula')wizard[key]=['ram','port','maxPlayers'].includes(key)?Number(value):value;
  if(wizard.step===1)for(const name of ['onlineMode','whitelist','pvp'])wizard[name]=form.elements[name].checked;
  if(wizard.step===2)wizard.eula=!!form.elements.eula?.checked;
}
function renderWizard() {
  if(!wizard)return;const w=wizard;
  const layer=$('#modal-layer');layer.classList.remove('hidden');
  let inner='';
  if(w.step===0)inner=`<h3>Un motore per ogni avventura.</h3><div class="type-grid">${Object.entries(TYPES).map(([type,t])=>`<button type="button" class="type-option ${w.type===type?'selected':''}" data-wizard-type="${type}" aria-pressed="${w.type===type}">${typeIcon(type)}<strong>${t.label}</strong><small>${t.short}</small></button>`).join('')}</div><div class="type-description" aria-live="polite">${Object.entries(TYPES).map(([type,t])=>`<span class="type-description-item ${w.type===type?'active':''}" data-description-type="${type}" aria-hidden="${w.type!==type}">${t.desc}</span>`).join('')}</div><div class="form-grid">${field('name','Come si chiamerà il tuo server?',w.name,'text','required maxlength="48" placeholder="Il tuo prossimo mondo"')}<div class="field"><label for="wizard-version">Versione Minecraft</label><select id="wizard-version" name="version" aria-busy="${w.loading}" ${w.loading||!w.versions.length?'disabled':''}>${w.loading?'<option>Caricamento catalogo ufficiale…</option>':w.versions.length?w.versions.map(v=>option(v,v,w.version)).join(''):'<option>Catalogo non disponibile</option>'}</select><small>Catalogo ufficiale · Java viene gestito automaticamente.<span id="catalog-retry" class="${w.error?'':'hidden'}"> <button type="button" class="button link" data-action="retry-catalog">Riprova</button></span></small></div></div>`;
  if(w.step===1)inner=`<div class="form-grid"><div class="field full"><label for="f-ram">Spazio per le tue idee <span class="range-value" id="ram-value">${w.ram} GB RAM</span></label><input id="f-ram" name="ram" type="range" min="1" max="${Math.min(state.system.totalMemoryGB-2,24)}" value="${w.ram}" step="1"><div class="range-labels"><span>1 GB · Leggero</span><span>${state.system.freeMemoryGB} GB disponibili sul PC</span><span>${Math.min(state.system.totalMemoryGB-2,24)} GB · Modpack</span></div><small>È un limite massimo, non memoria già occupata. Lascia RAM per Windows e per il gioco.</small></div>${field('port','Porta del server',w.port,'number','min="1024" max="65535" required')}${field('maxPlayers','Giocatori massimi',w.maxPlayers,'number','min="1" max="500" required')}${modeFields(w)}${field('motd','Messaggio del server',w.motd,'text','maxlength="160"')}${field('seed','Seed del mondo · facoltativo',w.seed,'text','maxlength="100" placeholder="Lascia vuoto per un mondo casuale"')}</div><div style="margin-top:18px">${toggle('onlineMode','Autenticazione premium','Controlla gli account Microsoft/Mojang. Consigliata.',w.onlineMode)}${toggle('whitelist','Whitelist','Solo i nickname autorizzati possono entrare.',w.whitelist)}${toggle('pvp','PvP','Consenti il combattimento tra giocatori.',w.pvp)}</div>`;
  if(w.step===2)inner=`<div style="display:flex;gap:15px;align-items:center">${typeIcon(w.type)}<div><h3 style="margin:0 0 6px;font-size:18px">${esc(w.name)}</h3><span class="server-meta">${TYPES[w.type].label} · Minecraft ${esc(w.version)}</span></div></div><div class="review-grid">${[['RAM massima',w.ram+' GB'],['Porta',w.port],['Giocatori',w.maxPlayers],['Modalità',w.gamemode],['Difficoltà',w.difficulty],['Autenticazione',w.onlineMode?'Attiva':'Disattivata'],['Whitelist',w.whitelist?'Attiva':'Disattivata'],['Java','Download automatico']].map(([k,v])=>`<div class="key-value"><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</div>${!w.onlineMode?`<div class="notice">${icon('alert')}Autenticazione disattivata: chi si connette può usare nickname altrui. Non è consigliato per server esposti a Internet.</div>`:''}<div class="notice info">${icon('download')}Scaricheremo il software dai servizi ufficiali e il runtime Java da Eclipse Adoptium. L’installazione può richiedere alcuni minuti. Il server non verrà avviato automaticamente.</div><label class="eula-check"><input type="checkbox" name="eula" required ${w.eula?'checked':''}><span>Ho letto e accetto la <a href="#" data-external="https://www.minecraft.net/eula">EULA di Minecraft</a>. Sono consapevole che il server verrà ospitato sul mio computer e utilizzerà le sue risorse.</span></label>`;
  let modal=$('.modal',layer);
  if(!modal){modal=document.createElement('section');modal.className='modal';layer.append(modal);}
  modal.innerHTML=`<div class="modal-header"><div><div class="eyebrow">UN MONDO TUTTO TUO</div><h2 id="modal-title">Accendi la prossima avventura.</h2><p>Qualche scelta. Infinite possibilità.</p></div><button class="icon-button" data-action="close-wizard" aria-label="Chiudi" ${w.creating?'disabled':''}>${icon('close')}</button></div><div class="wizard-steps">${['Software e identità','Il tuo mondo','Pronti a partire'].map((label,i)=>`<div class="wizard-step ${i===w.step?'active':i<w.step?'done':''}"><span>${i<w.step?'✓':i+1}</span>${label}</div>`).join('')}</div><form id="wizard-form"><div class="modal-body"><div id="wizard-error" class="wizard-error ${w.error?'':'hidden'}" role="alert">${esc(w.error)}</div>${inner}</div><div class="modal-footer"><span>${icon('lock')}Locale. Privato. Tuo.</span><div class="button-group">${w.step?button('Indietro','wizard-back','ghost','','type="button" '+(w.creating?'disabled':'')):button('Annulla','close-wizard','ghost','','type="button"') }<button type="submit" class="button primary" ${w.loading||w.creating||(w.step===0&&!w.versions.length)?'disabled':''}>${w.creating?'<span class="spinner"></span>':icon(w.step===2?'spark':'arrow')}${w.creating?'Creazione…':w.step===2?'Crea e installa':'Continua'}</button></div></div></form>`;
  $('#f-ram',layer)?.addEventListener('input',e=>{$('#ram-value',layer).textContent=e.target.value+' GB RAM';});
  $('#wizard-form').onsubmit=async e=>{
    e.preventDefault();captureWizard();w.error='';
    if(w.step===0 && (!w.name.trim()||!w.version)) {w.error='Inserisci un nome e scegli una versione.';renderWizard();return;}
    if(w.step===1 && state.servers.some(s=>s.port===Number(w.port))) {w.error='Porta già assegnata a un altro server. Scegline una diversa.';renderWizard();return;}
    if(w.step<2){w.step++;renderWizard();return;}
    w.creating=true;renderWizard();
    try{const id=await call('create',w);state=await call('state');w.creating=false;await closeWizard();navigate('server',id,'console');toast('Server creato. Installazione avviata: segui i progressi nella console.');}
    catch(err){w.creating=false;w.error=err.message;renderWizard();}
  };
  $('.modal').scrollTop=0;
  if(!layer.contains(document.activeElement)) $('.type-option.selected, #f-ram, .eula-check input',layer)?.focus();
}

document.addEventListener('click',async e=>{
  const nav=e.target.closest('[data-nav]');if(nav){e.preventDefault();navigate(nav.dataset.nav);return;}
  const link=e.target.closest('[data-external]');if(link){e.preventDefault();perform('external',()=>call('external',link.dataset.external));return;}
  const type=e.target.closest('[data-wizard-type]');if(type&&wizard){selectWizardType(type.dataset.wizardType);return;}
  const copy=e.target.closest('[data-copy]');if(copy){try{await navigator.clipboard.writeText(copy.dataset.copy);toast('Indirizzo copiato.');}catch{toast('Impossibile copiare l’indirizzo.',true);}return;}
  const fileRow=e.target.closest('[data-file-row]');if(fileRow&&!e.target.closest('input,button,a')){const checkbox=$('[data-file-select]',fileRow);if(checkbox&&!checkbox.disabled){checkbox.checked=!checkbox.checked;checkbox.dispatchEvent(new Event('change',{bubbles:true}));}return;}
  const filterButton=e.target.closest('[data-filter]');if(filterButton){filter=filterButton.dataset.filter;render();return;}
  const tabButton=e.target.closest('[data-tab]');if(tabButton){navigate('server',selected,tabButton.dataset.tab);return;}
  const action=e.target.closest('[data-action]');
  if(!action){const server=e.target.closest('[data-server]');if(server)navigate('server',server.dataset.server);return;}
  const key=action.dataset.action, id=action.dataset.id||selected;
  if(key==='toggle-theme'){applyTheme(document.documentElement.dataset.theme==='light'?'dark':'light');return;}
  if(key==='server-modrinth'){modrinthView.serverId=id;modrinthView.offset=0;navigate('modrinth');return;}
  if(key==='modrinth-select'){await chooseModrinth(action.dataset.project);return;}
  if(['modrinth-prev','modrinth-next','modrinth-retry'].includes(key)){modrinthView.offset=Math.max(0,modrinthView.offset+(key==='modrinth-next'?20:key==='modrinth-prev'?-20:0));render();return;}
  if(key==='delete-backup'){await perform(key,async()=>{await call('deleteBackup',id,action.dataset.name);render();});return;}
  if(key==='file-action'){await runFileAction(action.dataset.fileOperation);return;}
  if(key==='files-clear'){const view=fileViews.get(selected);if(view&&!view.working){view.selected.clear();updateFileSelection(selected);}return;}
  if(key==='files-refresh'){if(!fileViews.get(selected)?.working){viewGeneration++;renderServer();}return;}
  if(['save-settings'].includes(key))return;
  if(key==='create'){openWizard();return;}if(key==='template'){openWizard(action.dataset.type);return;}if(key==='close-wizard'){closeWizard();return;}
  if(key==='wizard-back'){captureWizard();wizard.step--;wizard.error='';renderWizard();return;}if(key==='retry-catalog'){wizard.loading=true;wizard.error='';loadVersions(wizard.type);return;}
  if(key==='guide'){navigate('guide');return;}if(key==='all-servers'){navigate('servers');return;}if(key==='view-backups'){navigate('server',id,'backups');return;}
  const external={playit:'https://playit.gg/',eula:'https://www.minecraft.net/eula',modrinth:['paper','purpur'].includes(state.servers.find(s=>s.id===id)?.type)?'https://modrinth.com/plugins':'https://modrinth.com/mods'};
  if(external[key]){perform(key,()=>call('external',external[key]));return;}
  if(['folder','mods-folder','backups-folder','data-folder'].includes(key)){perform(key,()=>call('openFolder',id,{'folder':'server','mods-folder':'mods','backups-folder':'backups','data-folder':'data'}[key]));return;}
  if(key==='restore'){
    if(!await window.EmberDialogs.confirm('Ripristinare questo backup? Il mondo attuale verrà sostituito. Prima verrà creata automaticamente una copia di sicurezza.'))return;
    await perform(key,async()=>{await call('restore',id,action.dataset.name);state=await call('state');render();},'Backup ripristinato. La copia precedente è stata conservata.');return;
  }
  if(['start','card-start','stop','card-stop','force','install','card-install','backup','import-files','export-logs','remove','delete-server'].includes(key)){
    if(key==='force'&&!await window.EmberDialogs.confirm('Forzare l’arresto? I progressi non salvati potrebbero andare persi.'))return;
    const operation={'card-start':'start','card-stop':'stop',force:'stop','card-install':'install','import-files':'importFiles','export-logs':'exportLogs','delete-server':'deleteServer'}[key]||key;
    if(operation==='install'&&state.servers.find(s=>s.id===id)?.installed&&!await window.EmberDialogs.confirm('Riparare l’installazione? Verrà riscaricato il software. Consigliamo un backup prima di procedere.'))return;
    await perform(key,async()=>{
      const result=await call(operation,id,...(key==='force'?[true]:[]));
      if(operation==='deleteServer'&&!result)return;
      state=await call('state');formDirty=false;render();
      if(operation==='backup')toast('Backup completato e salvato sul tuo PC.');
      if(operation==='importFiles'&&result)toast(result===1?'1 file importato.':`${result} file importati.`);
      if(operation==='remove'&&result)toast('Server archiviato. I file del mondo sono stati conservati.');
      if(operation==='deleteServer'&&result)toast('Server eliminato: file nel Cestino. I backup sono stati conservati.');
    });
  }
});
document.addEventListener('submit',async e=>{
  const form=e.target;
  if(form.id==='modrinth-search'){e.preventDefault();modrinthView.query=form.elements.query.value;modrinthView.offset=0;render();return;}
  if(form.id==='command-form'){
    e.preventDefault();const input=$('#command-input');const command=input.value.trim();if(!command)return;
    const id=selected;perform('command',async()=>{await call('command',id,command);window.EmberCommands.remember(id,command);input.value='';input.focus();});
  }
  if(form.id==='player-form'){
    e.preventDefault();const data=new FormData(form);perform('player',()=>call('command',selected,`${data.get('operation')} ${data.get('nickname')}`),'Comando inviato al server.');
  }
  if(form.id==='settings-form'){
    e.preventDefault();const data=Object.fromEntries(new FormData(form));for(const key of ['onlineMode','whitelist','pvp'])data[key]=form.elements[key].checked;
    if(!data.onlineMode&&!await window.EmberDialogs.confirm('Disattivare l’autenticazione? I giocatori potranno impersonare altri nickname.'))return;
    perform('save-settings',async()=>{await call('update',selected,data);formDirty=false;state=await call('state');render();},'Impostazioni salvate. Saranno usate al prossimo avvio.');
  }
});
document.addEventListener('change',e=>{
  const view=fileViews.get(selected);
  if(e.target.matches('[data-file-select]')&&view&&!view.working){if(e.target.checked)view.selected.add(e.target.dataset.fileSelect);else view.selected.delete(e.target.dataset.fileSelect);updateFileSelection(selected);}
  if(e.target.id==='files-select-all'&&view&&!view.working){view.selected=e.target.checked?new Set(view.entries.map(file=>file.name)):new Set();updateFileSelection(selected);}
  if(e.target.id==='app-language')window.EmberLocale.set(e.target.value);
  if(e.target.id==='auto-scroll'){autoScroll=e.target.checked;localStorage.setItem('ember-autoscroll',String(autoScroll));}
});
document.addEventListener('keydown',e=>{
  if(wizardCloseTask&&['Tab','Escape'].includes(e.key)){e.preventDefault();return;}
  if(e.key==='Escape'&&wizard){closeWizard();return;}
  if(wizard&&e.key==='Tab'){
    const focusable=$$('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]',$('#modal-layer')).filter(el=>el.offsetParent!==null);
    const first=focusable[0],last=focusable.at(-1);if(!focusable.length)return;
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!$('#modal-layer').contains(document.activeElement))){e.preventDefault();first.focus();}
  }
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('.server-card')){e.preventDefault();navigate('server',e.target.dataset.server);}
});
$('#modal-layer').addEventListener('click',e=>{if(e.target===$('#modal-layer'))closeWizard();});
window.ember.onLog(line=>{
  const list=logs.get(line.id)||[];list.push(line);if(list.length>1600)list.shift();logs.set(line.id,list);
  if(page==='server'&&selected===line.id)appendLine(line);
});
window.ember.onState(next=>{
  const old=state;state=next;
  const signature=s=>s.servers.map(x=>[x.id,x.status,x.installed,x.lastError,x.name,x.job,x.players.join(',')].join('|')).join(';');
  if(signature(old)!==signature(next)&&!formDirty){
    const editor=$('#command-input'),draft=editor?{value:editor.value,start:editor.selectionStart,end:editor.selectionEnd,focused:document.activeElement===editor}:null;
    render();const replacement=$('#command-input');
    if(draft&&replacement&&!replacement.disabled){replacement.value=draft.value;if(draft.focused){replacement.focus({preventScroll:true});replacement.setSelectionRange(draft.start,draft.end);replacement.dispatchEvent(new Event('input',{bubbles:true}));}}
  }
});
new MutationObserver(()=>{
  if(page==='server'&&tab==='overview')attachRam(state.servers.find(s=>s.id===selected));
  $$('[data-file-row]').forEach(row=>{
    const entry=fileViews.get(selected)?.entries.find(f=>f.name===row.dataset.fileRow);
    if(entry?.modrinth&&!row.querySelector('.modrinth-origin')){const badge=document.createElement('small');badge.className='modrinth-origin';badge.translate=false;badge.textContent='Modrinth · '+entry.modrinth.title+' · '+entry.modrinth.version;row.querySelector('.file-copy').append(badge);row.querySelector(':scope > i')?.remove();row.querySelector('.file-copy').insertAdjacentHTML('beforebegin',modImage(entry.modrinth.iconUrl,entry.modrinth.title));}
  });
  $$('#backup-list [data-action="restore"]').forEach(restore=>{
    if(restore.nextElementSibling?.dataset.action==='delete-backup')return;
    const b=document.createElement('button');b.className='button small danger';b.dataset.action='delete-backup';b.dataset.id=restore.dataset.id;b.dataset.name=restore.dataset.name;b.textContent='Elimina';restore.after(b);
  });
}).observe(content,{childList:true,subtree:true});
window.ember.onMetrics(point=>{const list=ramHistories.get(point.id)||[];list.push(point);if(list.length>150)list.shift();ramHistories.set(point.id,list);drawRam(point.id);});
setInterval(()=>{if(page==='server'){const s=state.servers.find(s=>s.id===selected);if(s&&$('#uptime'))$('#uptime').textContent=uptime(s);}},1000);
setInterval(async()=>{try{const next=await call('state');state.system=next.system;state.addresses=next.addresses;}catch{}},8000);
hydrate();
applyTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
call('state').then(next=>{state=next;render();}).catch(e=>{content.innerHTML=`<div class="notice error">${icon('alert')}${esc(e.message)}</div>`;});
