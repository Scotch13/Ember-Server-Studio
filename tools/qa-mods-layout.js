const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Manager}=require('../lib/manager');
(async()=>{
  const root=await fs.mkdtemp(require('./test-env').tempPrefix('ember-mods-layout-'));
  const manager=await new Manager(path.join(root,'Dati')).init();
  for(const [i,type]of ['fabric','paper'].entries()){
    const server={...manager.validate({name:'Layout '+type,type,version:'1.21.1',ram:2,port:29980+i,maxPlayers:8,gamemode:'survival',difficulty:'normal'}),id:'layout-'+type,installed:true};
    manager.servers.push(server);await fs.mkdir(manager.dir(server.id),{recursive:true});
  }
  await manager.save();
  const app=await electron.launch({args:[path.join(__dirname,'..')],env:{...process.env,EMBER_TEST_DATA:root},timeout:60000});
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(20000);
    await page.locator('.quick-server').first().waitFor();
    for(const theme of ['dark','light']){
      if(theme==='light')await page.locator('#theme-toggle').click();
      for(const width of [1440,1100]){
        await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setSize(width,900),width);
        for(const type of ['fabric','paper']){
          await page.locator(`.quick-server[data-server="layout-${type}"]`).click();
          for(const tab of ['files','backups']){
          await page.locator(`.tab[data-tab="${tab}"]`).click();
          await page.locator('#server-body .empty-panel p').waitFor();
          for(const language of ['it','en','es','fr','de']){
            await page.evaluate(language=>EmberLocale.set(language),language);
            const layout=await page.evaluate(()=>{
              const panel=document.querySelector('#server-body .empty-panel'),p=panel.querySelector('p'),icon=panel.querySelector('svg'),h3=panel.querySelector('h3');
              const center=el=>{const r=el.getBoundingClientRect();return r.left+r.width/2;};
              return {delta:Math.abs(center(p)-center(panel)),icon:Math.abs(center(icon)-center(panel)),title:Math.abs(center(h3)-center(panel)),align:getComputedStyle(p).textAlign,overflow:p.scrollWidth>p.clientWidth};
            });
            if(layout.delta>1||layout.icon>1||layout.title>1||layout.align!=='center'||layout.overflow)throw new Error('Allineamento errato '+JSON.stringify({theme,width,type,tab,language,layout}));
          }
          }
        }
      }
    }
    console.log('MOD/PLUGIN/BACKUP LAYOUT OK: testo, titolo e icona centrati a 1440/1100px, in entrambi i temi e tutte le lingue.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
