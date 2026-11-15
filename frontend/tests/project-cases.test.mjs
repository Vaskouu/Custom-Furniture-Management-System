import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'fp-cases-'));
await build({entryPoints:{data:'src/data.ts',cases:'src/features/projects/data.ts',model:'src/features/projects/model.ts'},outdir:dir,bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'}});
const {projects}=await import(pathToFileURL(join(dir,'cases.mjs'))),{products}=await import(pathToFileURL(join(dir,'data.mjs'))),{footprint,projectBrief,projectSize}=await import(pathToFileURL(join(dir,'model.mjs')));
after(()=>rm(dir,{recursive:true,force:true}));
test('four project stories have distinct room purposes, images and specific furniture descriptions',async()=>{
 assert.equal(projects.length,4);assert.equal(new Set(projects.map(p=>p.id)).size,4);assert.equal(new Set(projects.map(p=>p.type)).size,4);assert.equal(new Set(projects.map(p=>p.imageCell)).size,4);
 assert.ok((await stat('public/assets/projects/project-stories.png')).size>0);
 const office=projects.find(p=>p.type==='Домашен офис');assert.match(office.name,/бюро/);assert.match(office.summary,/документи/);assert.doesNotMatch(office.name,/перспектива/);
});
test('all furniture footprints fit the stated room without overlapping, including rotated units',()=>{
 for(const p of projects){
  assert.equal(new Set(p.items.map(i=>i.id)).size,p.items.length);
  for(const item of p.items){const b=footprint(item);assert.ok(item.x>=0&&item.y>=0&&b.w>0&&b.d>0);assert.ok(item.x+b.w<=p.room.w&&item.y+b.d<=p.room.d,p.id+': '+item.label+' exceeds the room');
   for(const other of p.items.filter(o=>o.id>item.id)){const c=footprint(other),overlapX=Math.min(item.x+b.w,other.x+c.w)-Math.max(item.x,other.x),overlapY=Math.min(item.y+b.d,other.y+c.d)-Math.max(item.y,other.y);assert.ok(overlapX<=0||overlapY<=0,p.id+': '+item.label+' overlaps '+other.label)}
  }
 }
});
test('project inquiries preserve the selected case, each furniture dimension and the material palette',()=>{
 for(const p of projects){const q=projectBrief(p);assert.equal(q.projectId,p.id);assert.equal(q.name,p.name);assert.equal(q.category,p.type==='Кухня'?'Цяла кухня':'Цялостно обзавеждане');
  for(const item of p.items){assert.ok(q.summary.includes(item.label));assert.ok(q.summary.includes(projectSize(item.size)))}
  for(const material of p.materials)assert.ok(q.materials.includes(material.name));assert.ok(q.summary.includes(p.brief));
 }
});
test('related furniture links resolve to real catalogue models',()=>{
 for(const p of projects){assert.ok(p.relatedModelIds.length>0);for(const id of p.relatedModelIds)assert.ok(products.some(item=>item.id===id),p.id+' references missing '+id)}
});
