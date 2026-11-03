/* Accessible select enhancement, visually adapted from HetPatel69's
   nervous-treefrog-70 on Uiverse.io. Native selects remain the form model. */
(() => {
  const widgets = new Map();
  let active = null, serial = 0, scheduled = false;
  const t = text => window.EmberLocale?.t(text) || text;
  const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>';
  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg>';
  const disabled = select => select.disabled || select.matches(':disabled');
  function close(focus = false) {
    if (!active) return;
    const current = active; active = null;
    current.widget.trigger.setAttribute('aria-expanded', 'false');
    current.widget.trigger.removeAttribute('aria-activedescendant');
    current.menu.remove();
    if (focus && current.widget.trigger.isConnected && !current.widget.trigger.disabled) current.widget.trigger.focus({ preventScroll: true });
  }
  function sync(widget) {
    const { select, trigger, caption } = widget;
    const selected = select.selectedOptions[0];
    const label = selected?.textContent || t('Seleziona…');
    if (caption.textContent !== label) caption.textContent = label;
    if(trigger.disabled !== disabled(select))trigger.disabled = disabled(select);
    const field = select.getAttribute('aria-label') || select.closest('.field')?.querySelector('label')?.textContent || select.labels?.[0]?.textContent || select.name || t('Seleziona…');
    if (trigger.getAttribute('aria-label') !== field) trigger.setAttribute('aria-label', field);
    if (trigger.title !== label) trigger.title = label;
    const busy=select.getAttribute('aria-busy') || 'false';if(trigger.getAttribute('aria-busy')!==busy)trigger.setAttribute('aria-busy',busy);
    if (active?.widget === widget) {
      if (trigger.disabled) close();
      else {
        const signature = [...select.options].map(o => `${o.value}:${o.textContent}:${o.disabled}`).join('|') + select.selectedIndex;
        if (signature !== active.signature) { active.signature = signature; renderOptions(); }
      }
    }
  }
  function refresh() {
    for (const [select, widget] of widgets) if (!select.isConnected) { if(active?.widget===widget)close(); widgets.delete(select); }
    for (const select of document.querySelectorAll('select:not([multiple]):not([size])')) {
      if (widgets.has(select)) { sync(widgets.get(select)); continue; }
      const wrapper = document.createElement('div'); wrapper.className = 'ember-select';
      const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'ember-select-trigger';
      trigger.setAttribute('role','combobox'); trigger.setAttribute('aria-haspopup','listbox'); trigger.setAttribute('aria-expanded','false'); trigger.setAttribute('translate','no');
      const id = `ember-options-${++serial}`; trigger.setAttribute('aria-controls',id);
      const caption = document.createElement('span'); caption.className = 'ember-select-caption';
      const arrow = document.createElement('span'); arrow.className = 'ember-select-arrow'; arrow.innerHTML = chevron;
      trigger.append(caption,arrow); select.before(wrapper); wrapper.append(select,trigger);
      select.classList.add('ember-native-select'); select.tabIndex = -1; select.setAttribute('aria-hidden','true');
      const widget = { select, trigger, caption, wrapper, id }; widgets.set(select,widget);
      trigger.addEventListener('click',()=>{ if(active?.widget===widget)close(); else open(widget); });
      trigger.addEventListener('keydown',event=>{
        if (disabled(select)) return;
        if (['ArrowDown','ArrowUp','Enter',' '].includes(event.key)) {
          event.preventDefault(); event.stopPropagation();
          if(!active || active.widget!==widget)open(widget,event.key==='ArrowUp'?-1:1);
          else key(event);
        } else if (event.key.length===1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          open(widget); if(active?.search){active.search.value=event.key;renderOptions();}else key(event);
        }
      });
      select.addEventListener('focus',()=>trigger.focus({preventScroll:true}));
      sync(widget);
    }
  }
  function position() {
    if (!active) return;
    const {menu,widget}=active, rect=widget.trigger.getBoundingClientRect();
    const width=Math.min(Math.max(rect.width,220),innerWidth-24);
    const below=innerHeight-rect.bottom-12, above=rect.top-12;
    const upward=below<220 && above>below;
    const height=Math.max(90,Math.min(320,upward?above:below));
    menu.style.width=`${width}px`;menu.style.maxHeight=`${height}px`;
    menu.style.left=`${Math.max(12,Math.min(rect.left,innerWidth-width-12))}px`;
    if(upward){menu.style.top='auto';menu.style.bottom=`${innerHeight-rect.top+6}px`;}
    else{menu.style.bottom='auto';menu.style.top=`${rect.bottom+6}px`;}
  }
  function highlight(index) {
    if (!active || !active.options.length) return;
    active.index=(index+active.options.length)%active.options.length;
    active.options.forEach((item,i)=>item.node.classList.toggle('is-highlighted',i===active.index));
    const selected=active.options[active.index];
    active.widget.trigger.setAttribute('aria-activedescendant',selected.node.id);
    active.search?.setAttribute('aria-activedescendant',selected.node.id);
    selected.node.scrollIntoView({block:'nearest'});
  }
  function choose(option) {
    if(!active||option.disabled)return;
    const widget=active.widget;widget.select.value=option.value;
    close(true);sync(widget);
    widget.select.dispatchEvent(new Event('input',{bubbles:true}));
    widget.select.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function renderOptions() {
    if (!active) return;
    const current=active,query=(current.search?.value || '').toLocaleLowerCase();
    current.list.replaceChildren();current.options=[];
    for(const [index,option] of [...current.widget.select.options].entries()){
      if(query && !option.textContent.toLocaleLowerCase().includes(query))continue;
      const node=document.createElement('div');node.className='ember-select-option';node.id=`${current.widget.id}-${index}`;
      node.setAttribute('role','option');node.setAttribute('aria-selected',String(option.selected));node.setAttribute('aria-disabled',String(option.disabled));
      if(option.selected)node.classList.add('is-selected');if(option.disabled)node.classList.add('is-disabled');
      const mark=document.createElement('span');mark.className='ember-select-mark';mark.innerHTML=option.selected?check:'<span class="ember-option-dot"></span>';
      const label=document.createElement('span');label.textContent=option.textContent;node.append(mark,label);
      current.list.append(node);
      if(!option.disabled){
        const itemIndex=current.options.length;current.options.push({node,option});
        node.addEventListener('pointermove',()=>{if(active===current&&current.index!==itemIndex)highlight(itemIndex);});
        node.addEventListener('pointerdown',event=>event.preventDefault());node.addEventListener('click',()=>choose(option));
      }
    }
    if(!current.options.length){const empty=document.createElement('div');empty.className='ember-select-empty';empty.textContent=t('Nessun risultato');current.list.append(empty);current.index=-1;}
    else{const selected=current.options.findIndex(item=>item.option.selected);highlight(selected<0?0:selected);}
  }
  function open(widget) {
    if(disabled(widget.select))return;close();
    const menu=document.createElement('div');menu.className='ember-select-menu';menu.setAttribute('translate','no');
    const list=document.createElement('div');list.className='ember-select-options';list.id=widget.id;list.setAttribute('role','listbox');list.setAttribute('aria-label',widget.trigger.getAttribute('aria-label'));
    let search=null;
    if(widget.select.options.length>12){
      const row=document.createElement('div');row.className='ember-select-search';row.innerHTML=searchIcon;
      search=document.createElement('input');search.type='search';search.placeholder=t('Cerca nelle opzioni…');search.setAttribute('aria-label',t('Cerca nelle opzioni…'));search.setAttribute('aria-controls',widget.id);search.autocomplete='off';
      search.addEventListener('input',renderOptions);row.append(search);menu.append(row);
    }
    menu.append(list);(widget.select.closest('.ember-dialog-layer, #modal-layer')||document.body).append(menu);
    active={widget,menu,list,search,index:0,options:[],signature:''};widget.trigger.setAttribute('aria-expanded','true');
    position();renderOptions();sync(widget);
    menu.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:140,easing:'ease-out'});
    if(search)search.focus({preventScroll:true});
  }
  function key(event) {
    if(!active)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
    else if(event.key==='Tab')close(true);
    else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();event.stopPropagation();
      highlight(event.key==='Home'?0:event.key==='End'?active.options.length-1:active.index+(event.key==='ArrowDown'?1:-1));
    }else if(event.key==='Enter'||(event.key===' '&&event.target===active.widget.trigger)){
      event.preventDefault();event.stopPropagation();const item=active.options[active.index];if(item)choose(item.option);
    }else if(event.target===active.widget.trigger&&event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();event.stopPropagation();
      const now=Date.now();active.typeBuffer=now-(active.typeTime||0)>700?event.key:(active.typeBuffer||'')+event.key;active.typeTime=now;
      const index=active.options.findIndex(item=>item.option.textContent.toLocaleLowerCase().startsWith(active.typeBuffer.toLocaleLowerCase()));if(index>=0)highlight(index);
    }
  }
  document.addEventListener('keydown',event=>{if(active)key(event);},true);
  document.addEventListener('pointerdown',event=>{if(active&&!active.menu.contains(event.target)&&!active.widget.wrapper.contains(event.target))close();},true);
  document.addEventListener('click',event=>{const label=event.target.closest('label');const select=label?.closest('.field')?.querySelector('select')||label?.control;const widget=select&&widgets.get(select);if(widget){event.preventDefault();widget.trigger.focus();}});
  document.addEventListener('change',event=>{const widget=widgets.get(event.target);if(widget)sync(widget);});
  document.addEventListener('reset',()=>queueMicrotask(refresh));
  window.addEventListener('resize',position);
  window.addEventListener('scroll',event=>{if(active&&!active.menu.contains(event.target))close();},true);
  new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;refresh();});}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','aria-busy','aria-label']});
  window.addEventListener('ember-language-change',()=>{close();refresh();});
  window.EmberDropdowns={refresh,close};refresh();
})();
