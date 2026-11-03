const {test}=require('node:test');
const assert=require('node:assert/strict');
const {suggest,complete}=require('../ui/command-data');
const values=(value,context)=>suggest(value,value.length,context).items.map(item=>item.value);
test('Console commands complete prefixes, leading slash and vanilla namespace',()=>{
  assert.deepEqual(values('gam'),['gamemode','gamerule']);
  assert.deepEqual(values('/gam'),['/gamemode','/gamerule']);
  assert.deepEqual(values('minecraft:gam'),['minecraft:gamemode','minecraft:gamerule']);
  assert.deepEqual(values('/minecraft:gam'),['/minecraft:gamemode','/minecraft:gamerule']);
  assert.equal(complete('gam',suggest('gam')).value,'gamemode ');
});
test('Console suggestions include context-specific branches and boolean game rules',()=>{
  assert.deepEqual(values('gamemode c'),['creative']);assert.deepEqual(values('time set n'),['noon','night']);
  assert.deepEqual(values('gamerule keep'),['keepInventory']);assert.deepEqual(values('gamerule keepInventory '),['true','false']);
  assert.deepEqual(values('gamerule randomTickSpeed '),[]);assert.deepEqual(values('say '),[]);
});
test('Player names are read from current server only and are never translated',()=>{
  assert.deepEqual(values('give St',{players:['Steve','Alex','Steve','invalid\nname']}),['Steve']);
  assert.deepEqual(values('whitelist add Al',{players:['Alex']}),['Alex']);
  assert.deepEqual(values('gamemode survival @'),['@a','@e','@p','@r','@s']);
  assert.ok(values('give Steve diam').includes('diamond_sword'));
});
test('Modern Minecraft gamerule names and command availability respect server version',()=>{
  assert.deepEqual(values('gamerule keep',{version:'26.3'}),['keep_inventory']);
  assert.deepEqual(values('gamerule minecraft:keep',{version:'1.21.11'}),['minecraft:keep_inventory']);
  assert.deepEqual(values('gamerule keep_inventory ',{version:'26.3'}),['true','false']);
  assert.deepEqual(values('gamerule random_tick_speed ',{version:'26.3'}),[]);
  assert.deepEqual(values('tick',{version:'1.20.1'}),[]);assert.deepEqual(values('tick',{version:'26.3'}),['tick']);
  assert.ok(values('give Steve minecraft:dia').includes('minecraft:diamond'));
  assert.deepEqual(values('summon light'),['lightning_bolt']);
});
test('Completion replaces current token at caret without damaging following arguments',()=>{
  const input='/gamem survival Steve',result=suggest(input,6);
  assert.equal(complete(input,result).value,'/gamemode survival Steve');
  assert.equal(complete(input,result).caret,9);
});
test('Paper-only commands do not leak to Vanilla and JSON/NBT are not completed',()=>{
  assert.deepEqual(values('pl',{type:'vanilla'}),['place','playsound']);
  assert.deepEqual(values('plug',{type:'paper'}),['plugins']);
  assert.deepEqual(values('plug',{type:'fabric'}),[]);
  assert.deepEqual(values('tellraw @a {"text":"he'),[]);
  assert.deepEqual(values('give @a[na'),[]);
  assert.deepEqual(values('stop\nsay unsafe'),[]);
});
