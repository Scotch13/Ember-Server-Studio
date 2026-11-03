(() => {
  let getContext=()=>({}),input=null,popup=null,result=null,index=0,explicit=false,composing=false;
  const histories=new Map();let historyPosition=null,historyDraft='';
  const t=text=>window.EmberLocale?.t(text)||text;
  function close(){
    popup?.remove();popup=null;result=null;explicit=false;
    if(input){input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
  }
  function highlight(){
    if(!popup)return;
    [...popup.querySelectorAll('[role="option"]')].forEach((option,i)=>option.setAttribute('aria-selected',String(i===index)));
    const selected=popup.querySelectorAll('[role="option"]')[index];if(selected){input.setAttribute('aria-activedescendant',selected.id);selected.scrollIntoView({block:'nearest'});}
  }
  function apply(){
    if(!input||input.disabled||!result)return;
    const replacement=window.EmberCommandData.complete(input.value,result,index);if(!replacement)return;
    input.value=replacement.value;input.focus({preventScroll:true});input.setSelectionRange(replacement.caret,replacement.caret);update(input);
  }
  function update(editor,force=false){
    if(editor!==input){close();input=editor;}
    if(editor.disabled||composing||document.activeElement!==editor||editor.selectionStart!==editor.selectionEnd||!force&&!editor.value.trim()){close();return;}
    result=window.EmberCommandData.suggest(editor.value,editor.selectionStart,getContext());
    if(!result.items.length){close();return;}
    popup?.remove();index=0;explicit=false;
    editor.setAttribute('role','combobox');editor.setAttribute('aria-autocomplete','list');editor.setAttribute('aria-controls','command-suggestion-list');editor.setAttribute('aria-expanded','true');editor.setAttribute('spellcheck','false');
    popup=document.createElement('div');popup.className='command-suggestions';
    const label=document.createElement('div');label.className='command-suggestions-heading';label.textContent=t('Suggerimenti comandi');popup.append(label);
    const list=document.createElement('div');list.id='command-suggestion-list';list.className='command-suggestion-list';list.setAttribute('role','listbox');list.setAttribute('aria-label',t('Suggerimenti comandi'));
    result.items.forEach((item,i)=>{
      const option=document.createElement('div');option.className='command-suggestion';option.id='command-suggestion-'+i;option.setAttribute('role','option');
      const name=document.createElement('code');name.textContent=item.value;const kind=document.createElement('span');kind.textContent=t(item.kind);option.append(name,kind);
      if(item.usage){const syntax=document.createElement('small');syntax.setAttribute('translate','no');syntax.textContent=item.usage;option.append(syntax);}
      option.addEventListener('pointerdown',event=>event.preventDefault());option.addEventListener('click',()=>{index=i;apply();});
      list.append(option);
    });popup.append(list);
    const hint=document.createElement('div');hint.className='command-suggestions-hint';hint.textContent=t('Tab completa · ↑↓ seleziona · Esc chiude');hint.title=t('Suggerimenti locali: i comandi mod/plugin possono differire.');popup.append(hint);editor.closest('form').append(popup);highlight();
  }
  document.addEventListener('input',event=>{if(event.target.id==='command-input'){historyPosition=null;update(event.target);}});
  document.addEventListener('focusin',event=>{if(event.target.id==='command-input'){historyPosition=null;const id=getContext().id;if(id)window.ember.call('commandHistory',id).then(list=>histories.set(id,list)).catch(()=>{});update(event.target);}else if(!popup?.contains(event.target))close();});
  document.addEventListener('focusout',event=>{if(event.target===input)close();});
  document.addEventListener('click',event=>{if(event.target.id==='command-input')update(event.target);else if(!popup?.contains(event.target))close();});
  document.addEventListener('compositionstart',event=>{if(event.target.id==='command-input'){composing=true;close();}});
  document.addEventListener('compositionend',event=>{if(event.target.id==='command-input'){composing=false;update(event.target);}});
  document.addEventListener('keydown',event=>{
    const editor=event.target;if(editor.id!=='command-input'||editor.disabled||event.isComposing||composing||event.ctrlKey||event.altKey||event.metaKey)return;
    if(event.key==='Escape'&&popup){event.preventDefault();event.stopPropagation();close();return;}
    if(event.key==='Tab'&&!event.shiftKey){
      if(!popup)update(editor,true);
      if(popup){event.preventDefault();event.stopPropagation();apply();}return;
    }
    if(['ArrowDown','ArrowUp'].includes(event.key)&&popup){event.preventDefault();event.stopPropagation();index=(index+(event.key==='ArrowDown'?1:-1)+result.items.length)%result.items.length;explicit=true;highlight();return;}
    if(['ArrowUp','ArrowDown'].includes(event.key)&&!popup){
      const list=histories.get(getContext().id)||[];if(!list.length||event.key==='ArrowDown'&&historyPosition===null)return;
      event.preventDefault();event.stopPropagation();if(historyPosition===null){historyDraft=editor.value;historyPosition=list.length;}
      historyPosition=Math.max(0,Math.min(list.length,historyPosition+(event.key==='ArrowUp'?-1:1)));editor.value=historyPosition===list.length?historyDraft:list[historyPosition];editor.setSelectionRange(editor.value.length,editor.value.length);return;
    }
    if(event.key==='Enter'){
      if(popup&&explicit){event.preventDefault();event.stopPropagation();apply();}else close();return;
    }
    if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))queueMicrotask(()=>update(editor));
  },true);
  document.addEventListener('submit',event=>{if(event.target.id==='command-form')close();},true);
  new MutationObserver(()=>{if(input&&(!input.isConnected||input.disabled)){close();input=null;}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
  window.addEventListener('ember-language-change',()=>{if(input?.isConnected)update(input);});
  window.EmberCommands={configure:context=>{getContext=context;},close,remember:(id,command)=>{const list=histories.get(id)||[];if(list.at(-1)!==command)list.push(command);histories.set(id,list.slice(-100));historyPosition=null;},clearHistory:id=>{histories.set(id,[]);historyPosition=null;}};
})();
