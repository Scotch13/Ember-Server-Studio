(() => {
  const data=window.EmberLanguageData;
  let language='it';try{const saved=localStorage.getItem('ember-language');if(Object.hasOwn(data.languages,saved))language=saved;}catch{}
  const textSources=new WeakMap(),attributeSources=new WeakMap();
  const skip='script,style,svg,code,input,textarea,.console-line,[translate="no"]';
  const personal='.server-card h3,.server-grid>.panel>h3,.quick-server>span:last-child,.server-heading h1,.file-copy strong,.player-avatar,.player>span:nth-child(2),.server-address,.modal-body>div[style] h3';
  let observer;
  const t=(text,context)=>data.translate(text,language,context);
  function protect(root){
    if(root.matches?.(personal))root.setAttribute('translate','no');
    const elements=root.querySelectorAll?.(personal)||[];
    for(const el of elements)if(el.getAttribute('translate')!=='no')el.setAttribute('translate','no');
  }
  function text(node){
    if(!node.parentElement||node.parentElement.closest(skip)||!node.data.trim())return;
    let record=textSources.get(node);if(!record||node.data!==record.output)record={source:node.data};
    record.output=t(record.source,node.parentElement.closest('[data-locale-context]')?.dataset.localeContext);textSources.set(node,record);
    if(node.data!==record.output)node.data=record.output;
  }
  function attributes(el){
    if(el.closest('script,style,svg,code,.console-line,[translate="no"]'))return;
    let records=attributeSources.get(el);if(!records){records={};attributeSources.set(el,records);}
    for(const name of ['title','placeholder','aria-label']){
      const value=el.getAttribute(name);if(value===null)continue;
      let record=records[name];if(!record||value!==record.output)record={source:value};
      record.output=t(record.source);records[name]=record;
      if(value!==record.output)el.setAttribute(name,record.output);
    }
  }
  function translateRoot(root){
    if(root.nodeType===Node.TEXT_NODE){text(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
    protect(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))text(node);
    if(root.nodeType===Node.ELEMENT_NODE)attributes(root);
    for(const el of root.querySelectorAll('[title],[placeholder],[aria-label]'))attributes(el);
  }
  const options={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label']};
  function apply(root=document){
    observer?.disconnect();
    translateRoot(root);window.EmberDropdowns?.refresh();
    observer?.observe(document.body,options);
  }
  function set(next){
    if(typeof next!=='string'||!Object.hasOwn(data.languages,next))return;
    language=next;document.documentElement.lang=language;
    try{localStorage.setItem('ember-language',language);}catch{}
    apply();window.dispatchEvent(new Event('ember-language-change'));
    window.ember.call('setLanguage',language).catch(()=>{});
  }
  const api={t,set,apply,get:()=>language,languages:data.languages};
  Object.defineProperty(api,'locale',{get:()=>data.languages[language].locale});window.EmberLocale=api;
  observer=new MutationObserver(records=>{
    observer.disconnect();const roots=new Set();
    for(const record of records){
      if(record.type==='childList'){for(const node of record.addedNodes)if(node.isConnected)roots.add(node);}
      else if(record.target.isConnected)roots.add(record.target);
    }
    for(const root of roots)translateRoot(root);
    window.EmberDropdowns?.refresh();observer.observe(document.body,options);
  });
  set(language);
})();
