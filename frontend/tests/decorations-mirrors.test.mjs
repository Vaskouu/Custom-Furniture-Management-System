import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,stat,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const dir=await mkdtemp(join(tmpdir(),'fp-mirrors-'));
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import Scene from './src/features/configurator/FurnitureScene';import Photo from './src/features/catalog/ProductImage';
export {products,categories,newConfig,limits,legacyProductImages,legacyProductDefaults} from './src/data';
export {normalizeConfig} from './src/features/configurator/model';
export * from './src/features/configurator/presets';export * from './src/features/catalog/media';export {estimate} from './src/pricing';
export const scene=(product,config,inside=false)=>renderToStaticMarkup(<Scene product={product} config={config} inside={inside}/>);
export const photo=(product,decorations)=>renderToStaticMarkup(<Photo product={product} decorations={decorations}/>);
`},define:{'import.meta.env':'{}'},bundle:true,platform:'node',format:'cjs',outfile:join(dir,'mirrors.cjs')});
const s=createRequire(import.meta.url)(join(dir,'mirrors.cjs'));after(()=>rm(dir,{recursive:true,force:true}));
test('68 distinct designs have varied category counts',()=>{
 assert.equal(s.products.length,68);assert.equal(new Set(s.products.map(p=>p.variant)).size,68);assert.equal(new Set(s.products.map(p=>p.id)).size,68);
 for(const [category,count] of Object.entries({'Гардероби':3,'Бюра':4,'Дивани':3,'Скринове':2,'Холни маси':5,'Офис шкафове':8,'Детски мебели':5,'Секции за хол':4}))assert.equal(s.products.filter(p=>p.category===category).length,count);
});
test('each product has distinct decorated and clean views in the correct photo pair',async()=>{
 for(const p of s.products){const a=s.atlasTile(p.image),b=s.atlasTile(p.cleanImage);assert.ok(a&&b,p.name);assert.equal(a.source,b.source);assert.equal(a.cell%2,0);assert.equal(b.cell,a.cell+1);assert.ok((await stat('public'+b.source)).size>0);assert.ok(s.photo(p,true).includes('data-photo-cell="'+a.cell+'"'));assert.ok(s.photo(p,false).includes('data-photo-cell="'+b.cell+'"'));}
 assert.equal(s.atlasTile('/assets/products/paired-01.png#cell=16'),null);
});
test('configurator always shows clean furniture, including legacy saved decorations',async()=>{
 for(const p of s.products){const c=s.newConfig(p);assert.equal(c.decorations,false);for(const decorations of [true,false,undefined]){const legacy={...c,decorations};assert.equal(s.normalizeConfig(legacy,p).decorations,false);for(const inside of [false,true])assert.doesNotMatch(s.scene(p,legacy,inside),/data-decoration=|data-decorations="true"/,p.name);}assert.equal(s.estimate(c).total,s.estimate({...c,decorations:true}).total);}
 const ui=await readFile('src/features/configurator/Configurator.tsx','utf8');assert.doesNotMatch(ui,/DecorationToggle|С декорации|Без декорации/);
 const catalog=await readFile('src/features/catalog/Catalog.tsx','utf8');assert.match(catalog,/DecorationToggle/);
});
test('every selectable exterior mirror belongs to one real door and hides for the interior view',()=>{
 for(const p of s.products){const c=s.newConfig(p),n=s.mirrorDoorCount(p,c);if(!n)continue;const selected=Array.from({length:n},(_,i)=>i),value={...c,mirrorDoors:selected,mirrorTint:'Бронзово'},svg=s.scene(p,value);const indices=[...svg.matchAll(/data-mirror-door="(\d+)"/g)].map(m=>Number(m[1]));assert.deepEqual([...new Set(indices)].sort((a,b)=>a-b),selected,p.name);assert.equal(indices.length,n,p.name);assert.doesNotMatch(s.scene(p,value,true),/data-mirror-door=/,p.name);}
});
test('mirror selection survives saving, prices the chosen area, and ignores invalid or removed doors',()=>{
 const p=s.products[0],base=s.newConfig(p),c={...base,mirrorDoors:[1],mirrorTint:'Графит',mirrorStyle:'Цяла врата',decorations:false},restored=s.normalizeConfig(JSON.parse(JSON.stringify(c)),p);
 assert.deepEqual(restored.mirrorDoors,[1]);assert.equal(restored.mirrorStyle,'Цяла врата');assert.equal(restored.decorations,false);assert.match(s.mirrorSummary(p,restored),/врати 2 · Графит · Цяла врата/);assert.ok(s.estimate(c).mirrors>0);assert.ok(s.estimate(c).total>s.estimate(base).total);assert.deepEqual(s.selectedMirrorDoors(p,{...base,doors:1,mirrorDoors:[-1,0,0,1,99,.5]}),[0]);assert.deepEqual(s.normalizeConfig({...c,doors:1},p).mirrorDoors,[]);assert.equal(s.estimate({...c,quantity:2}).total,s.estimate(c).total*2);
});
test('catalogue upgrades add new models once and preserve custom images, edits and deletions',()=>{
 const a=s.products[0],b=s.products[1],old=[{...a,...s.legacyProductDefaults[a.id],name:'Моят гардероб',image:'/assets/products/collection-01.png#cell=0'},{...b,image:'https://example.com/custom.jpg',cleanImage:undefined}];
 const migrated=s.mergeNewModels(s.refreshDemoPhotos(old,s.products,s.legacyProductImages,s.legacyProductDefaults),s.products,Object.keys(s.legacyProductImages));
 assert.equal(migrated.length,34);assert.equal(migrated[0].name,'Моят гардероб');assert.equal(migrated[0].image,a.image);assert.equal(migrated[1].image,'https://example.com/custom.jpg');assert.equal(migrated[1].cleanImage,undefined);assert.ok(!migrated.some(p=>p.id==='p2-0'));const deleted=migrated.filter(p=>p.id!=='p17-7');assert.ok(!s.mergeNewModels(deleted,s.products,s.products.map(p=>p.id)).some(p=>p.id==='p17-7'));
});
test('all 68 furniture models render finite geometry at both size boundaries',()=>{
 for(const p of s.products){const limits=s.limits(p);for(const edge of [0,1]){const c={...s.newConfig(p),w:limits.w[edge],d:limits.d[edge],h:limits.h[edge],decorations:false};assert.doesNotMatch(s.scene(p,c),/NaN|Infinity|undefined|(?:width|height)="-\d/,p.name);}}
});
test('the active navigation underline spans the full text',async()=>{const css=await readFile('src/styles.css','utf8');assert.match(css,/\.header nav a\.active:after\{[^}]*width:100%/);});
