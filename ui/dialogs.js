/* One queued, accessible in-app dialog for renderer and main-process requests. */
(() => {
  let tail=Promise.resolve();
  const show=options=>{
    const task=tail.then(()=>new Promise(resolve=>{
      window.EmberDropdowns?.close();
      const previous=document.activeElement,layer=document.createElement('div'),dialog=document.createElement('section');
      layer.className='ember-dialog-layer';dialog.className='ember-dialog panel';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','ember-dialog-title');
      const title=document.createElement('h2');title.id='ember-dialog-title';title.textContent=options.title||'Ember Server Studio';dialog.append(title);
      if(options.content instanceof HTMLElement){dialog.append(options.content);if(options.className)dialog.classList.add(options.className);}
      for(const text of [options.message,options.detail])if(text){const p=document.createElement('p');p.textContent=text;dialog.append(p);}
      const actions=document.createElement('div');actions.className='button-group';(options.actionsContainer||dialog).append(actions);layer.append(dialog);
      const siblings=[...document.body.children].filter(el=>el.tagName!=='SCRIPT');const inert=siblings.map(el=>[el,el.inert]);siblings.forEach(el=>el.inert=true);
      const cancel=options.cancelId??0,buttons=options.buttons||['Annulla','Continua'];
      const finish=response=>{if(options.canClose&&options.canClose(response)===false)return;window.EmberDropdowns?.close();layer.remove();inert.forEach(([el,value])=>el.inert=value);if(previous?.isConnected)previous.focus();resolve({response});};
      buttons.forEach((text,i)=>{const button=document.createElement('button');button.className='button '+(i===0?'ghost':'primary');button.textContent=text;button.type='button';button.disabled=options.disabledButtons?.includes(i)||false;button.addEventListener('click',()=>finish(i));actions.append(button);});
      layer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(cancel);}if(e.key==='Tab'){const list=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(el=>el.getClientRects().length&&!el.classList.contains('ember-native-select')),i=list.indexOf(document.activeElement);if(!list.length)return;e.preventDefault();list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();}});
      document.body.append(layer);window.EmberDropdowns?.refresh();actions.children[options.defaultId??0]?.focus();options.onOpen?.();
    }));tail=task.catch(()=>{});return task;
  };
  window.EmberDialogs={show,confirm:async message=>(await show({message})).response===1};
  window.ember.onDialog(async request=>{const result=await show(request.options);window.ember.respondDialog(request.id,result.response);});
})();
