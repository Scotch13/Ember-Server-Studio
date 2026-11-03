const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../ui/locale-details');
test('Ogni testo ha tutte e quattro le traduzioni e mantiene l’italiano',()=>{
  assert.equal(Object.keys(data.languages).length,5);
  for(const [source,translations]of Object.entries(data.messages)){
    assert.equal(translations.length,4,source);
    for(const text of translations)assert.ok(typeof text==='string'&&text.trim(),source);
    assert.equal(data.translate(source,'it'),source);
  }
});
test('Testi dinamici preservano nomi, numeri e spazi',()=>{
  assert.equal(data.translate('Eliminare “Panoramica”?','en'),'Delete “Panoramica”?');
  assert.equal(data.translate('  Crea server  ','en'),'  Create server  ');
  assert.equal(data.translate('4.5 GB liberi sul sistema','en'),'4.5 GB free on system');
  assert.equal(data.translate('file-personale.jar','de'),'file-personale.jar');
  assert.equal(data.translate('Crea server','invalid'),'Crea server');
});
test('Attiva distingue lo stato dal comando di attivazione',()=>{
  assert.equal(data.translate('Attiva','en'),'Enabled');assert.equal(data.translate('Attiva','en','file-actions'),'Enable');
  assert.equal(data.translate('Attiva','it','file-actions'),'Attiva');
});
