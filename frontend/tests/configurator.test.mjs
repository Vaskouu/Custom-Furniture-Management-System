import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';

const dir=await mkdtemp(join(tmpdir(),'fp-scenes-'));
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Furniture from './src/features/configurator/FurnitureScene';
import Kitchen from './src/features/configurator/KitchenScene';
import Pie from './src/features/studio/OrderPieChart';
export {pieSlices} from './src/features/studio/OrderPieChart';
export {handlePosition,normalizeConfig,silhouette} from './src/features/configurator/model';
export {products,categories,kitchens,newConfig,limits} from './src/data';
export const furniture=(config,product,inside=false)=>renderToStaticMarkup(<Furniture config={config} product={product} inside={inside}/>);
export const kitchen=(k,view)=>renderToStaticMarkup(<Kitchen k={k} view={view}/>);
export const pie=orders=>renderToStaticMarkup(<Pie orders={orders}/>);
`},bundle:true,platform:'node',format:'cjs',outfile:join(dir,'scenes.cjs')});
const s=createRequire(import.meta.url)(join(dir,'scenes.cjs'));
after(()=>rm(dir,{recursive:true,force:true}));

test('bed mattresses stay centered and storage drawers are paired',()=>{
 for(const p of s.products.filter(p=>p.kind==='bed')){
  const html=s.furniture(s.newConfig(p),p);
  const center=Number(html.match(/data-bed-center="([^"]+)"/)[1]);
  const points=html.match(/data-bed-mattress="true" points="([^"]+)"/)[1].split(' ').map(x=>x.split(',').map(Number));
  assert.ok(Math.abs(points[0][0]+points[1][0]-2*center)<.001,p.name);
  assert.ok(Math.abs(points[2][0]+points[3][0]-2*center)<.001,p.name);
  if(p.variant.endsWith('storage'))assert.equal((html.match(/data-bed-drawer=/g)||[]).length,2);
 }
});

test('kids compartments retain independent colors, glass and open fronts',()=>{
 const p=s.products.find(p=>p.kind==='kids');
 const html=s.furniture({...s.newConfig(p),mirrorDoors:[],fronts:{0:{kind:'wood',color:'#123456'},1:{kind:'glass',color:'#654321'},2:{kind:'open'}}},p);
 assert.match(html,/data-front-cell="0" data-front-kind="wood"/);
 assert.match(html,/fill="#123456"/);
 assert.match(html,/data-front-cell="1" data-front-kind="glass"/);
 assert.match(html,/stroke="#654321"/);
 assert.match(html,/data-front-cell="2" data-front-kind="open"/);
});

test('wall units render every requested lower cabinet door',()=>{
 for(const p of s.products.filter(p=>p.variant?.startsWith('wall-'))){
  for(const n of [1,6]){
   const c=s.newConfig(p),html=s.furniture({...c,lowerDoors:n,doors:c.doors-3+n},p);
   assert.equal((html.match(/data-wall-base-door=/g)||[]).length,n);
   for(let i=0;i<n;i++)assert.match(html,new RegExp('data-wall-base-door="'+i+'"><g data-door-index="'+i+'"'));
  }
 }
});

test('old saved furniture keeps its dimensions and finish while gaining editable hardware defaults',()=>{
 const p=s.products[0],legacy={...s.newConfig(p),w:211,d:57,h:238,color:'Тъмен орех',handles:'Месинг'};
 for(const key of ['edgeColor','handleColor','handleVertical','handleHorizontal','handleStyle','handleOrientation','textureStrength'])delete legacy[key];
 const c=s.normalizeConfig(legacy,p);
 assert.deepEqual([c.w,c.d,c.h,c.color],[211,57,238,'Тъмен орех']);
 assert.equal(c.handleColor,'#b28a43');assert.equal(c.edgeColor,'auto');
 assert.ok(c.handleVertical&&c.handleHorizontal&&c.handleStyle);
 assert.doesNotMatch(s.furniture(legacy,p),/NaN|undefined/);
});

test('handle placement respects high/middle/low, center and mirrored door handing',()=>{
 const c=s.newConfig(s.products[0]);
 const ys=['Високо','В средата','Ниско'].map(handleVertical=>s.handlePosition(80,180,{...c,handleVertical}).y);
 assert.ok(ys[0]<ys[1]&&ys[1]<ys[2]);
 assert.equal(s.handlePosition(80,180,{...c,handleHorizontal:'В центъра'}).x,40);
 const right=s.handlePosition(80,180,{...c,direction:'Дясно'}).x;
 const left=s.handlePosition(80,180,{...c,direction:'Ляво'}).x;
 assert.equal(right+left,80);assert.notEqual(right,left);
});

test('all categories render finite geometry at supported size boundaries, with distinct silhouettes',()=>{
 const shapes=new Set();
 for(const category of s.categories){
  const p=s.products.find(p=>p.category===category),lim=s.limits(p);shapes.add(s.silhouette(p));
  for(const edge of [0,1]){
   const c={...s.newConfig(p),w:lim.w[edge],d:lim.d[edge],h:lim.h[edge]};
   const svg=s.furniture(c,p);
   assert.match(svg,/<svg/);assert.doesNotMatch(svg,/NaN|Infinity|undefined|(?:width|height)="-\d/);
  }
 }
 assert.ok(shapes.size>=16,'categories must not share a generic cabinet silhouette');
});

test('body texture, edge and handle changes reach the illustration independently; no-handle removes pulls',()=>{
 const p=s.products[0],c=s.newConfig(p);
 const svg=s.furniture({...c,edgeColor:'#f03b48',handleColor:'#21a6c9',finish:'Камък'},p);
 assert.match(svg,/stroke="#f03b48"/);assert.match(svg,/#21a6c9/);assert.match(svg,/data-finish="Камък"/);
 assert.match(svg,/data-handle-position=/);
 assert.doesNotMatch(s.furniture({...c,handles:'Без дръжки'},p),/data-handle-position=/);
 assert.notEqual(s.furniture(c,p),s.furniture({...c,handleVertical:'Ниско',handleHorizontal:'В центъра'},p));
 assert.notEqual(s.furniture(c,p),s.furniture(c,p,true));
 const table=s.products.find(p=>p.category==='Трапезни маси');
 assert.notEqual(s.furniture({...s.newConfig(table),tableShape:'Кръгла'},table),s.furniture({...s.newConfig(table),tableShape:'Правоъгълна'},table));
});

test('kitchen views render every layout and distinguish integrated hood from no hood',()=>{
 for(const k of s.kitchens){for(const view of ['front','plan','upper']){
  const svg=s.kitchen(k,view);assert.match(svg,new RegExp('data-view="'+view+'"'));assert.doesNotMatch(svg,/NaN|Infinity|undefined|(?:width|height)="-\d/);
 }}
 const k=s.kitchens[0];
 assert.match(s.kitchen({...k,hood:'Вграден в шкаф'},'front'),/data-integrated-hood="true"/);
 assert.doesNotMatch(s.kitchen({...k,hood:'Без аспиратор'},'front'),/data-integrated-hood/);
 assert.match(s.kitchen({...k,hood:'Вграден в шкаф'},'upper'),/Горни шкафове/);
});

test('pie handles empty, one-status and mixed orders without invalid arcs',()=>{
 const empty=s.pieSlices([]);assert.ok(empty.every(p=>p.count===0&&p.end===0&&p.percent===0));
 const orders=['Нова','Нова','В процес','Завършена','Отказана'].map(status=>({status})),slices=s.pieSlices(orders);
 assert.equal(slices.reduce((n,p)=>n+p.count,0),orders.length);assert.equal(slices.at(-1).end,360);
 assert.equal(new Set(slices.map(p=>p.color)).size,4);assert.deepEqual(slices.map(p=>p.percent),[40,20,20,20]);
 for(const rows of [[],[{status:'Нова'}],orders])assert.doesNotMatch(s.pie(rows),/NaN|Infinity/);
 assert.match(s.pie([{status:'Нова'}]),/Нова 1/);
});
