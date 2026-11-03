const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Modrinth}=require('../lib/modrinth');
const api='https://api.modrinth.com/v2';
const fabric={id:'P7dR8mSH',slug:'fabric-api',title:'Fabric API',description:'Fabric library',project_type:'mod',server_side:'optional',game_versions:['1.21.1'],categories:['fabric'],icon_url:'https://cdn.modrinth.com/data/icon.png',downloads:100};
test('Search retries temporary HTTP failures then returns the full catalog',async()=>{
  let count=0;const client=new Modrinth({},async()=>++count===1?new Response('no available server',{status:503}):Response.json({hits:[{...fabric,project_id:fabric.id}],total_hits:1}));
  const result=await client.search({query:'fabric'});assert.equal(count,2);assert.equal(result.limited,false);assert.equal(result.hits[0].title,'Fabric API');
});
test('Search outage falls back to official project lookup without claiming full results',async()=>{
  const calls=[];const client=new Modrinth({},async url=>{calls.push(url);if(url.startsWith(api+'/search?'))return new Response('no available server',{status:503});if(url.startsWith(api+'/projects?'))return Response.json([{...fabric,id:'other',title:'Other',slug:'other'}]);if(url===api+'/project/fabric-api')return Response.json(fabric);throw new Error('Unexpected URL');});
  const result=await client.search({query:'Fabric API',offset:40});assert.equal(result.limited,true);assert.equal(result.offset,0);assert.equal(result.hits[0].id,fabric.id);assert.equal(result.total,1);assert.equal(calls.filter(url=>url.includes('/search?')).length,2);
});
test('Fallback matches cached popular titles, filters client-only projects and server compatibility',async()=>{
  const client=new Modrinth({get:()=>({type:'fabric',version:'1.21.1'})},async url=>url.startsWith(api+'/search?')?new Response('',{status:503}):url.startsWith(api+'/projects?')?Response.json([fabric,{...fabric,id:'client',server_side:'unsupported'},{...fabric,id:'forge',categories:['forge']}]):new Response('',{status:404}));
  const result=await client.search({query:'fabricapi',serverId:'fixture'});assert.deepEqual(result.hits.map(p=>p.id),[fabric.id]);assert.equal(result.limited,true);
});
test('Rate limits do not trigger retries or additional fallback requests',async()=>{
  let count=0;const client=new Modrinth({},async()=>{count++;return new Response('',{status:429});});await assert.rejects(client.search({query:'fabric'}),/troppe richieste/);assert.equal(count,1);
});
test('Complete network outage reports unavailability rather than an empty catalog',async()=>{
  const client=new Modrinth({},async()=>{throw new Error('network failure');});await assert.rejects(client.search({query:'fabric'}),/temporaneamente indisponibile/);
});
