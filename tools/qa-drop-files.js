const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Manager}=require('../lib/manager');
const locale=require('../ui/locale-details');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-drag-drop-'));
  const manager=await new Manager(path.join(root,'Dati')).init();
  for(const [index,type]of ['fabric','paper','vanilla'].entries()){
    manager.servers.push({...manager.validate({name:'Drag & drop '+type,type,version:'1.21.1',ram:2,port:29960+index,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id:'drop-'+type,installed:true});
    await fs.mkdir(manager.dir('drop-'+type),{recursive:true});
  }
  await manager.save();const incoming=path.join(root,'incoming');await fs.mkdir(incoming);
  for(const name of ['One.jar','Two.jar','New.jar','Invalid.txt','NotImported.jar'])await fs.writeFile(path.join(incoming,name),'original-'+name);
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.locator('.quick-server').first().waitFor();
    async function begin(names){
      await page.evaluate(()=>{document.querySelector('#qa-drop-input')?.remove();const input=document.createElement('input');input.type='file';input.multiple=true;input.id='qa-drop-input';input.style.display='none';document.body.append(input);});
      await page.locator('#qa-drop-input').setInputFiles(names.map(name=>path.join(incoming,name)));
      return page.evaluate(()=>{
        const transfer=new DataTransfer();for(const file of document.querySelector('#qa-drop-input').files)transfer.items.add(file);
        transfer.effectAllowed='all';window.__qaTransfer=transfer;
        const event=new DragEvent('dragenter',{bubbles:true,cancelable:true,dataTransfer:transfer,clientX:600,clientY:500});document.body.dispatchEvent(event);return event.defaultPrevented;
      });
    }
    async function hover(){await page.evaluate(()=>{const r=document.querySelector('#file-drop-zone').getBoundingClientRect();document.body.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:window.__qaTransfer,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));});}
    async function drop(){return page.evaluate(()=>{const zone=document.querySelector('#file-drop-zone'),r=zone?.getBoundingClientRect();const event=new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:window.__qaTransfer,clientX:r?r.left+r.width/2:600,clientY:r?r.top+r.height/2:500});document.body.dispatchEvent(event);return event.defaultPrevented;});}
    const leave=()=>page.evaluate(()=>document.body.dispatchEvent(new DragEvent('dragleave',{bubbles:true,dataTransfer:window.__qaTransfer,clientX:0,clientY:0,relatedTarget:null})));
    await page.locator('[data-server="drop-fabric"]').first().click();
    if(!await begin(['One.jar','Two.jar']))throw new Error('Comportamento di navigazione file non bloccato');
    await page.waitForFunction(()=>document.querySelector('.tab[data-tab="files"]')?.classList.contains('active'));
    await page.locator('#file-drop-zone.is-visible').waitFor();await hover();
    if(!await drop())throw new Error('Drop non intercettato');
    try{await page.waitForFunction(()=>document.querySelectorAll('[data-file-row]').length===2);}catch(e){console.log('TOAST:',await page.locator('#toasts').textContent());throw e;}
    const mods=manager.fileFolder('drop-fabric');
    for(const name of ['One.jar','Two.jar']){
      if(await fs.readFile(path.join(mods,name),'utf8')!=='original-'+name)throw new Error('Copia non riuscita');await fs.access(path.join(incoming,name));
    }
    await begin(['New.jar','One.jar']);await hover();await drop();
    await page.getByText(/Esiste già un file chiamato/).waitFor();
    try{await fs.access(path.join(mods,'New.jar'));throw new Error('Importazione parziale dopo conflitto');}catch(e){if(e.code!=='ENOENT')throw e;}
    await begin(['Invalid.txt','NotImported.jar']);await hover();await drop();
    await page.getByText('Sono consentiti soltanto file .jar.',{exact:true}).waitFor();
    try{await fs.access(path.join(mods,'NotImported.jar'));throw new Error('Formato misto importato parzialmente');}catch(e){if(e.code!=='ENOENT')throw e;}
    const security=await page.evaluate(async()=>{
      let synthetic=false,generic=false;
      try{await window.ember.importDroppedFiles('drop-fabric',[new File(['fake'],'Synthetic.jar')]);}catch(e){synthetic=e.message.includes('salvati sul computer');}
      try{await window.ember.call('importDroppedFiles','drop-fabric',['C:/arbitrary.jar']);}catch(e){generic=e.message.includes('non consentita');}
      return synthetic&&generic;
    });if(!security)throw new Error('Bridge accetta percorsi arbitrari o file sintetici');
    await page.locator('.toasts .icon-button').evaluateAll(buttons=>buttons.forEach(button=>button.click()));
    for(const theme of ['dark','light']){
      if(theme==='light')await page.locator('#theme-toggle').click();
      for(const language of ['it','en','es','fr','de']){
        await page.evaluate(language=>EmberLocale.set(language),language);await begin(['New.jar']);await hover();
        if((await page.locator('#file-drop-title').textContent())!==locale.translate('Rilascia qui le mod .jar',language))throw new Error('Target non tradotto');
        if(await page.locator('#file-drop-zone svg').count()!==1)throw new Error('Simbolo + mancante');
        await leave();
      }
      await page.evaluate(()=>EmberLocale.set('it'));await begin(['New.jar']);await hover();
      await page.screenshot({path:path.join(__dirname,'..','..','Anteprime',`13-drag-drop-${theme}.png`),animations:'disabled'});await leave();
    }
    await page.locator('[data-server="drop-paper"]').first().click();await begin(['One.jar']);await hover();await drop();
    await page.waitForFunction(()=>!!document.querySelector('[data-file-row="One.jar"]'));
    await fs.access(path.join(manager.fileFolder('drop-paper'),'One.jar'));
    await page.evaluate(()=>{state.servers.find(s=>s.id===selected).status='online';render();});
    await begin(['New.jar']);await hover();if(!await page.locator('#file-drop-zone').evaluate(el=>el.classList.contains('is-blocked')))throw new Error('Target non bloccato mentre online');await drop();
    try{await fs.access(path.join(manager.fileFolder('drop-paper'),'New.jar'));throw new Error('Import consentito mentre online');}catch(e){if(e.code!=='ENOENT')throw e;}
    await page.evaluate(()=>{state.servers.find(s=>s.id===selected).status='offline';navigate('server',selected,'settings');});
    await page.locator('#f-name').fill('Modifiche non salvate');await begin(['New.jar']);
    if(await page.locator('#file-drop-zone').evaluate(el=>el.classList.contains('is-visible')))throw new Error('Modifiche non salvate ignorate');await drop();
    if(await page.locator('#f-name').inputValue()!=='Modifiche non salvate')throw new Error('Input perso trascinando file');
    await page.evaluate(()=>{formDirty=false;});await page.locator('[data-server="drop-vanilla"]').first().click();await begin(['New.jar']);await hover();await drop();
    if((await fs.readdir(manager.dir('drop-vanilla'))).length)throw new Error('File importati su Vanilla');
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('DRAG & DROP OK: veri File di sistema, copia multipla, originali conservati, conflitti/formati misti senza import parziale, bridge sicuro, temi/lingue, plugin, blocco online/Vanilla e modifiche non salvate.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
