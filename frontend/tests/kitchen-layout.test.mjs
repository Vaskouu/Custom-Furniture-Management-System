import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const dir=await mkdtemp(join(tmpdir(),'fp-walls-'));
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import KitchenScene from './src/features/configurator/KitchenScene';
 export * from './src/features/kitchen/model';export * from './src/features/catalog/media';
 export {products,kitchens,legacyProductImages,kitchenPrice} from './src/data';
 export const render=(k,view,runId)=>renderToStaticMarkup(<KitchenScene k={k} view={view} runId={runId}/>);
`},bundle:true,platform:'node',format:'cjs',outfile:join(dir,'layout.cjs')});
const s=createRequire(import.meta.url)(join(dir,'layout.cjs'));
after(()=>rm(dir,{recursive:true,force:true}));

test('LED segments never cross fridges or hoods in any kitchen elevation',()=>{
 let checked=0;
 for(const preset of s.kitchens){
  const k={...preset,light:true},apps=s.kitchenAppliances(k);
  for(const run of s.kitchenRuns(k))for(const view of ['front','upper','walls']){
   const html=s.render(k,view,run.id);
   for(const match of html.matchAll(/data-led-run="([^"]+)" data-led-slot="(\d+)"/g)){
    assert.ok(!apps.some(a=>a.runId===match[1]&&a.slot===Number(match[2])&&['fridge','hood'].includes(a.kind)),preset.name);
    checked++;
   }
  }
  assert.doesNotMatch(s.render({...k,light:false},'front'),/data-led-slot/);
 }
 assert.ok(checked>0);
});

test('all 68 products map to distinct reviewed local product tiles, including the two Pietra tables',async()=>{
 assert.equal(new Set(s.products.map(p=>p.image)).size,68);
 for(const p of s.products){const tile=s.atlasTile(p.image);assert.ok(tile,p.name+' needs a product image');assert.ok((await stat('public'+tile.source)).size>0)}
 assert.match(s.products.find(p=>p.name==='Pietra').image,/paired-04\.png#cell=6$/);
 assert.match(s.products.find(p=>p.name==='Pietra Plus').image,/paired-04\.png#cell=8$/);
 assert.equal(s.atlasTile('/assets/products/collection-02.png#cell=9'),null);
});
test('photo migration repairs old defaults without overwriting admin images or reintroducing deleted models',()=>{
 const p=s.products[0],q=s.products[1],catalog=[{...p,image:s.legacyProductImages[p.id],name:'Редактирано име'},{...q,image:'https://example.com/my-photo.jpg'}];
 const updated=s.refreshDemoPhotos(catalog,s.products,s.legacyProductImages);
 assert.equal(updated[0].image,p.image);assert.equal(updated[0].name,'Редактирано име');assert.equal(updated[1].image,catalog[1].image);assert.equal(updated.length,2);
});
test('all ten kitchen presets use distinct kitchen visualizations, with no exterior stock scenes',async()=>{
 assert.equal(new Set(s.kitchens.map(k=>k.image)).size,10);
 for(const k of s.kitchens){const tile=s.atlasTile(k.image);assert.ok(tile,k.name);assert.equal(tile.rows,2);assert.ok((await stat('public'+tile.source)).size>0)}
 assert.equal(s.atlasTile('/assets/kitchens/collection-01.png#cell=6'),null);
});
test('every kitchen preset starts without overlapping appliances; wall counts match each layout',()=>{
 const counts={'Права кухня':1,'Малка кухня':1,'Ъглова кухня':2,'П-образна кухня':3,'Паралелна кухня':2,'Кухня с остров':2};
 for(const k of s.kitchens){assert.equal(s.kitchenRuns(k).length,counts[k.layout]);assert.deepEqual(s.kitchenIssues(k),[],k.name)}
});
test('hob and linked hood move together to wall B while oven remains independent',()=>{
 const original=s.kitchens[2],snapshot=structuredClone(original),hob=s.kitchenAppliances(original).find(a=>a.kind==='hob'),oven=s.kitchenAppliances(original).find(a=>a.kind==='oven');
 const k=s.moveAppliance(original,hob.id,'b',1),apps=s.kitchenAppliances(k);
 assert.deepEqual(apps.filter(a=>['hob','hood'].includes(a.kind)).map(a=>[a.runId,a.slot]),[['b',1],['b',1]]);
 assert.deepEqual(apps.find(a=>a.kind==='oven'),oven);assert.deepEqual(original,snapshot);assert.deepEqual(s.kitchenIssues(k),[]);
 assert.match(s.render(k,'front','b'),/КОТ \/ АСП/);assert.doesNotMatch(s.render(k,'front','c'),/data-hob="true"/);
 assert.match(s.kitchenSummary(k),/Котлони B2/);assert.match(s.kitchenSummary(k),/Фурна A4/);
});
test('occupied and out-of-range modules reject moves atomically',()=>{
 const k=s.kitchens[2],snapshot=structuredClone(k),washer=s.kitchenAppliances(k).find(a=>a.kind==='washer'),sink=s.kitchenAppliances(k).find(a=>a.kind==='sink');
 assert.throws(()=>s.moveAppliance(k,washer.id,sink.runId,sink.slot),/зает/);
 assert.throws(()=>s.moveAppliance(k,washer.id,'b',99),/зает/);
 assert.throws(()=>s.moveAppliance(k,washer.id,'island',0),/зает/);assert.deepEqual(k,snapshot);
});
test('fully occupied kitchens can swap modules without losing appliances or separating a hob/oven/hood stack',()=>{
 const k=s.kitchens[0],original=structuredClone(k),apps=s.kitchenAppliances(k),hob=apps.find(a=>a.kind==='hob'),washer=apps.find(a=>a.kind==='washer');
 const next=s.exchangeModules(k,hob.id,washer.runId,washer.slot),after=s.kitchenAppliances(next);
 assert.deepEqual(after.map(a=>a.id).sort(),apps.map(a=>a.id).sort());
 for(const kind of ['hob','oven','hood'])assert.equal(after.find(a=>a.kind===kind).slot,washer.slot);
 assert.equal(after.find(a=>a.kind==='washer').slot,hob.slot);assert.deepEqual(s.kitchenIssues(next),[]);assert.deepEqual(k,original);
 const island=s.kitchens[3],fridge=s.kitchenAppliances(island).find(a=>a.kind==='fridge');
 assert.throws(()=>s.exchangeModules(island,fridge.id,'island',0),/Високите/);
});
test('washer, dryer, dishwasher, microwave and wine cooler can be added and independently placed',()=>{
 let k=s.kitchens[1];
 for(const kind of ['washer','dryer','microwave','wineCooler'])k=s.addAppliance(k,kind);
 const before=s.kitchenAppliances(k),washer=before.find(a=>a.kind==='washer');
 k=s.moveAppliance(k,washer.id,'b',3);assert.deepEqual(s.kitchenIssues(k),[]);
 for(const kind of ['washer','dryer','microwave','wineCooler','dishwasher'])assert.ok(s.kitchenAppliances(k).some(a=>a.kind===kind));
 assert.match(s.render(k,'front','b'),/ПЕР/);
 const count=s.kitchenAppliances(k).length;k=s.removeAppliance(k,washer.id);assert.equal(s.kitchenAppliances(k).length,count-1);
});
test('island hob uses a ceiling hood and plan geometry preserves 90 cm circulation in the standard room',()=>{
 let k=s.kitchens[3];const hob=s.kitchenAppliances(k).find(a=>a.kind==='hob');
 k=s.moveAppliance(k,hob.id,'island',0);assert.equal(k.hood,'Таванен над остров');assert.deepEqual(s.kitchenIssues(k),[]);
 const island=s.kitchenRuns(k).find(r=>r.id==='island'),slot=s.planSlot(k,island,0);
 assert.ok(slot.y-k.lowerDepth>=90);assert.ok(k.roomD-slot.y-slot.d>=90);
 assert.match(s.render(k,'front','island'),/КОТ \/ АСП/);
});
test('all-walls view renders every wall, and shrinking/removing a wall re-homes appliances without loss',()=>{
 let k=s.moveAppliance(s.kitchens[2],'sink','c',3),ids=s.kitchenAppliances(k).map(a=>a.id).sort();
 const svg=s.render(k,'walls','a');for(const run of s.kitchenRuns(k))assert.match(svg,new RegExp('data-elevation-run="'+run.id+'"'));
 k=s.resizeRun(k,'c',120);assert.deepEqual(s.kitchenIssues(k),[]);assert.deepEqual(s.kitchenAppliances(k).map(a=>a.id).sort(),ids);
 k=s.changeKitchenGeometry(k,{layout:'Права кухня'});assert.equal(s.kitchenRuns(k).length,1);assert.deepEqual(s.kitchenAppliances(k).map(a=>a.id).sort(),ids);assert.deepEqual(s.kitchenIssues(k),[]);
});
test('price and inquiry summary include the second and third work lines',()=>{
 const k=s.kitchens[2],total=s.kitchenRuns(k).reduce((n,r)=>n+r.length,0);assert.equal(s.totalKitchenLength(k),total);assert.equal(total,900);
 assert.ok(s.kitchenPrice(k)>s.kitchenPrice(s.changeKitchenGeometry(k,{layout:'Права кухня'})));
 const summary=s.kitchenSummary(k);for(const label of ['Стена A','Стена B','Стена C','Пералня'])assert.ok(summary.includes(label));
});
