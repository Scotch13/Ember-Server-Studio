const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {Manager}=require('../lib/manager');
(async()=>{
  const userData=await fs.mkdtemp(require('./test-env').tempPrefix('ember-ui-server-'));
  const root=path.join(userData,'Dati');const m=await new Manager(root).init();
  const id='preview-server';
  const s={...m.validate({name:'Mondo di prova',type:'fabric',version:'1.20.1',ram:2,port:29876,maxPlayers:12,gamemode:'survival',difficulty:'normal',whitelist:true}),id,installed:true,javaMajor:17,createdAt:new Date().toISOString(),build:'Fixture QA',launch:['-cp',userData,'FakeServer']};
  m.servers.push(s);await fs.mkdir(m.dir(id),{recursive:true});await m.writeProperties(s);await m.save();
  await fs.mkdir(path.join(root,'runtimes','java-17'),{recursive:true});
  await fs.symlink(require('./test-env').javaHome,path.join(root,'runtimes','java-17','test-jdk'),'junction');
  await fs.writeFile(path.join(root,'runtimes','java-17','.ember-ready'),'test-jdk');
  await fs.writeFile(path.join(userData,'FakeServer.java'),'import java.io.*; public class FakeServer {public static void main(String[] a) throws Exception {System.out.println("[Server thread/INFO]: Done (0.8s)! For help, type help");System.out.println("[Server thread/INFO]: Steve joined the game");BufferedReader r=new BufferedReader(new InputStreamReader(System.in));String line;while((line=r.readLine())!=null){if(line.equals("stop")){System.out.println("Saving worlds");break;}System.out.println("[Server thread/INFO]: ECHO: "+line);}}}');
  const compile=spawnSync(require('./test-env').javac,[path.join(userData,'FakeServer.java')],{windowsHide:true});if(compile.status!==0)throw new Error(compile.stderr.toString());
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:userData},timeout:60000});
  try{
    const page=await app.firstWindow(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    const out=path.join(__dirname,'..','..','Anteprime');
    if(process.env.EMBER_QA_THEME==='light')await page.locator('#theme-toggle').click();
    await page.locator('.quick-server').click();await page.locator('.server-heading h1').waitFor();console.log('Server aperto');
    await page.locator('[data-action="start"]').click();await page.waitForFunction(()=>document.querySelector('.server-heading .status-pill.online'));console.log('Server online');
    if(await page.locator('.page-heading [data-action="delete-server"]').count())throw new Error('Pulsante Elimina ancora presente nella barra superiore');
    await page.locator('.tab[data-tab="console"]').click();
    const editor=page.locator('#command-input');
    await editor.fill('gam');await page.locator('.command-suggestions').waitFor();
    await editor.press('Tab');if(await editor.inputValue()!=='gamemode ')throw new Error('Tab did not complete command');
    await editor.fill('gamemode cr');await editor.press('Tab');if(await editor.inputValue()!=='gamemode creative ')throw new Error('Mode completion failed');
    await editor.fill('give St');await editor.press('Tab');if(await editor.inputValue()!=='give Steve ')throw new Error('Player completion failed');
    await editor.fill('gamerule keep');await editor.press('Tab');await editor.press('Tab');
    if(await editor.inputValue()!=='gamerule keepInventory true ')throw new Error('Game rule/value completion failed');
    await editor.fill('/gam');await editor.press('ArrowDown');await editor.press('Enter');if(await editor.inputValue()!=='/gamerule ')throw new Error('Arrow/Enter completion failed');
    await editor.press('Escape');if(await page.locator('.command-suggestions').count())throw new Error('Escape did not close suggestions');
    await editor.fill('time ');await page.locator('.command-suggestion').filter({has:page.locator('code', {hasText:/^set$/})}).click();
    if(await editor.inputValue()!=='time set ')throw new Error('Mouse completion failed');
    const sent=await page.evaluate(async()=>{const lines=await window.ember.call('logs',selected);return lines.filter(line=>line.text.startsWith('> '));});
    if(sent.length)throw new Error('Completion sent unsolicited server commands');
    for(const theme of ['dark','light']){
      await page.evaluate(theme=>applyTheme(theme),theme);await editor.fill('gamemode ');
      await page.locator('.console-panel').screenshot({path:path.join(out,`18-command-suggestions-${theme}.png`),animations:'disabled'});
    }
    await page.evaluate(()=>applyTheme('dark'));
    for(const language of ['it','en','es','fr','de']){
      await page.evaluate(language=>EmberLocale.set(language),language);await editor.fill('give St');
      if(await page.locator('.command-suggestion code').first().textContent()!=='Steve')throw new Error('Player name translated');
    }
    await page.evaluate(()=>EmberLocale.set('it'));await editor.fill('give Al');
    const next=await page.evaluate(async()=>{const next=await window.ember.call('state');next.servers.find(s=>s.id===selected).players.push('Alex');return next;});
    await app.evaluate(({BrowserWindow},next)=>BrowserWindow.getAllWindows()[0].webContents.send('state',next),next);
    await page.waitForFunction(()=>document.querySelector('.command-suggestion code')?.textContent==='Alex');
    if(await editor.inputValue()!=='give Al'||!await editor.evaluate(el=>el===document.activeElement))throw new Error('Draft/focus lost during player update');
    await page.locator('#command-input').fill('say Benvenuti nel nostro mondo!');await page.locator('#command-input').press('Enter');
    await page.waitForFunction(()=>document.querySelector('#console-lines')?.textContent.includes('ECHO: say Benvenuti'));
    await editor.press('ArrowUp');if(await editor.inputValue()!=='say Benvenuti nel nostro mondo!')throw new Error('Command history Up failed');
    await editor.press('ArrowDown');if(await editor.inputValue()!=='')throw new Error('Command history draft not restored');
    if((await page.evaluate(()=>window.ember.call('commandHistory',selected))).at(-1)!=='say Benvenuti nel nostro mondo!')throw new Error('Command history not persisted');
    await page.screenshot({path:path.join(out,'05-console.png'),animations:'disabled'});
    await page.locator('[data-tab="overview"]').click();
    await page.locator('#command-input').fill('gamemode ');await page.locator('.command-suggestions').waitFor();
    const suggestionsBox=await page.locator('.command-suggestions').boundingBox(),consoleBox=await page.locator('.console-panel').boundingBox();
    if(suggestionsBox.y<consoleBox.y||suggestionsBox.y+suggestionsBox.height>consoleBox.y+consoleBox.height)throw new Error('Suggestions clipped in compact console');
    await page.locator('#command-input').press('Escape');
    await page.waitForFunction(()=>/\d+ MB/.test(document.querySelector('#ram-current')?.textContent||''));
    if(!await page.locator('#ram-graph path').getAttribute('d'))throw new Error('Grafico RAM vuoto');
    await page.screenshot({path:path.join(out,'06-panoramica-server.png'),animations:'disabled'});
    await page.locator('[data-tab="tools"]').click();await page.locator('#ws-player').fill('Steve');
    await page.locator('#ws-player-action').locator('..').locator('.ember-select-trigger').click();await page.getByRole('option',{name:'Rendi operatore',exact:true}).click();
    await page.locator('#player-management button[type="submit"]').click();await page.locator('.ember-dialog .button').last().click();await page.waitForFunction(async()=>{const lines=await window.ember.call('logs',selected);return lines.some(line=>line.text.includes('ECHO: op Steve'));});
    await page.locator('[data-workspace="clear-history"]').click();await page.locator('.ember-dialog .button').last().click();await page.getByText('Cronologia cancellata.',{exact:true}).waitFor();
    if((await page.evaluate(()=>window.ember.call('commandHistory',selected))).length)throw new Error('History clear failed');
    await page.locator('[data-tab="settings"]').click();
    if(!await page.locator('#f-name').isDisabled())throw new Error('Impostazioni non protette mentre online');
    if(!await page.locator('#server-body [data-action="delete-server"]').isDisabled())throw new Error('Eliminazione consentita mentre online');
    await page.locator('[data-action="stop"]').click();await page.waitForFunction(()=>document.querySelector('.server-heading .status-pill.offline'));
    if(await page.locator('.command-suggestions').count())throw new Error('Suggestions retained on stopped server');
    await page.locator('#f-name').fill('Mondo aggiornato');await page.locator('[data-action="save-settings"]').click();
    await page.waitForFunction(()=>document.querySelector('.server-heading h1')?.textContent==='Mondo aggiornato');
    await page.locator('[data-tab="backups"]').click();await page.locator('[data-action="backup"]').click();
    await page.locator('[data-action="restore"]').first().waitFor();
    await page.locator('[data-action="restore"]').first().click();
    await page.locator('.ember-dialog .button').last().click();
    await page.waitForFunction(()=>document.querySelectorAll('#backup-list [data-action="restore"]').length===2);
    await page.locator('[data-tab="files"]').click();await page.getByRole('heading',{name:'Spazio alle possibilità.'}).waitFor();
    // Solo il dialogo è automatizzato; il Cestino Windows viene usato davvero,
    // esclusivamente per il server fixture creato in questa cartella temporanea.
    await page.locator('[data-tab="settings"]').click();
    if(await page.locator('#server-body [data-action="delete-server"]').count()!==1)throw new Error('Serve un solo pulsante Elimina in fondo alle impostazioni');
    await page.locator('#server-body [data-action="delete-server"]').click();
    await page.locator('.ember-dialog .button').first().click();
    await page.waitForFunction(()=>!document.querySelector('#server-body [data-action="delete-server"]')?.disabled);
    if((await page.evaluate(()=>window.ember.call('state'))).servers.length!==1)throw new Error('Annulla ha eliminato il server');
    await page.locator('.navigation [data-nav="servers"]').click();
    await page.locator('.server-card [data-action="delete-server"]').click();
    await page.locator('.ember-dialog .button').last().click();
    await page.waitForFunction(()=>document.querySelector('#nav-count')?.textContent==='0');
    try {await fs.access(path.join(root,'servers',id));throw new Error('Cartella server non spostata nel Cestino');}catch(e){if(e.code!=='ENOENT')throw e;}
    if((await fs.readdir(path.join(root,'backups',id))).length!==2)throw new Error('Backup rimossi durante eliminazione');
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('SERVER UI OK: avvio/stop, console, impostazioni, backup/ripristino, mod, eliminazione dal Cestino e Annulla.');
  }finally{
    try { const page=await app.firstWindow();await page.evaluate(async()=>{const state=await window.ember.call('state');for(const s of state.servers)if(['online','starting','stopping'].includes(s.status))await window.ember.call('stop',s.id,true);}); } catch{}
    await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
