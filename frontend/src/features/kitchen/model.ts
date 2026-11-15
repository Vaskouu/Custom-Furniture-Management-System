import type {Kitchen} from '../../data';

export type RunId='a'|'b'|'c'|'island';
export type ApplianceKind='sink'|'oven'|'hob'|'hood'|'fridge'|'dishwasher'|'washer'|'dryer'|'microwave'|'wineCooler';
export type RunSpec={id:RunId;length:number};
export type Appliance={id:string;kind:ApplianceKind;runId:RunId;slot:number};
export type KitchenRun=RunSpec&{label:string;short:string;orientation:'back'|'left'|'right'|'opposite'|'island';modules:number};
export const applianceInfo:Record<ApplianceKind,{label:string;short:string;color:string}>={
 sink:{label:'Мивка',short:'МИВ',color:'#2c839a'},oven:{label:'Фурна',short:'ФУР',color:'#655882'},
 hob:{label:'Котлони',short:'КОТ',color:'#c58b3e'},hood:{label:'Аспиратор',short:'АСП',color:'#8b715a'},
 fridge:{label:'Хладилник',short:'ХЛД',color:'#576b88'},dishwasher:{label:'Съдомиялна',short:'СЪД',color:'#4a7f6a'},
 washer:{label:'Пералня',short:'ПЕР',color:'#3e789c'},dryer:{label:'Сушилня',short:'СУШ',color:'#ac6d55'},
 microwave:{label:'Микровълнова',short:'МИК',color:'#7c648f'},wineCooler:{label:'Винен охладител',short:'ВИН',color:'#8a5364'}
};
const hasSides=(k:Kitchen)=>['Ъглова кухня','П-образна кухня'].includes(k.layout);
const floor60=(n:number,min=120)=>Math.max(min,Math.floor(n/60)*60);
export function kitchenRuns(k:Kitchen):KitchenRun[]{
 const specs:{id:RunId;label:string;short:string;orientation:KitchenRun['orientation'];max:number;fallback:number}[]=[{id:'a',label:'Стена A · основна',short:'A',orientation:'back',max:k.roomW,fallback:k.length}];
 if(hasSides(k))specs.push({id:'b',label:k.layout==='П-образна кухня'?'Стена B · лява':'Стена B · дясна',short:'B',orientation:k.layout==='П-образна кухня'?'left':'right',max:k.roomD-k.lowerDepth,fallback:240});
 if(k.layout==='П-образна кухня')specs.push({id:'c',label:'Стена C · дясна',short:'C',orientation:'right',max:k.roomD-k.lowerDepth,fallback:240});
 if(k.layout==='Паралелна кухня')specs.push({id:'b',label:'Стена B · срещуположна',short:'B',orientation:'opposite',max:k.roomW,fallback:k.length});
 if(k.layout==='Кухня с остров')specs.push({id:'island',label:'Остров',short:'О',orientation:'island',max:k.roomW-180,fallback:180});
 return specs.map(spec=>{
  const requested=k.runs?.find(r=>r.id===spec.id)?.length??(spec.id==='a'?k.length:spec.fallback),length=floor60(Math.min(spec.max,requested));
  return {id:spec.id,label:spec.label,short:spec.short,orientation:spec.orientation,length,modules:length/60};
 });
}
export function totalKitchenLength(k:Kitchen){return kitchenRuns(k).reduce((sum,r)=>sum+r.length,0)}
const indexFor=(position:string,n:number)=>position==='Ляво'?0:position==='Дясно'?n-1:Math.floor(n/2);
export function kitchenAppliances(k:Kitchen):Appliance[]{
 const runs=kitchenRuns(k),main=runs[0],n=main.modules;
 if(k.appliances)return k.appliances.filter(a=>a.kind!=='hood'||k.hood!=='Без аспиратор').map(a=>({...a}));
 const sink=indexFor(k.sink,n),hob=indexFor(k.oven,n),fridge=indexFor(k.fridge,n);
 const apps:Appliance[]=[{id:'sink',kind:'sink',runId:'a',slot:sink},{id:'hob',kind:'hob',runId:'a',slot:hob},{id:'oven',kind:'oven',runId:'a',slot:hob}];
 if(k.hood!=='Без аспиратор')apps.push({id:'hood',kind:'hood',runId:'a',slot:k.hoodPosition==='Над котлоните'?hob:indexFor(k.hoodPosition||k.oven,n)});
 if(k.tall>0)apps.push({id:'fridge',kind:'fridge',runId:'a',slot:fridge});
 const free=runs.flatMap(r=>Array.from({length:r.modules},(_,slot)=>({runId:r.id,slot}))).find(pos=>!apps.some(a=>a.runId===pos.runId&&a.slot===pos.slot&&a.kind!=='hood'));
 if(free)apps.push({id:'dishwasher',kind:'dishwasher',...free});
 return apps;
}
export function normalizeKitchen(k:Kitchen):Kitchen{
 return {...k,hoodFollowsHob:k.hoodFollowsHob??true,runs:kitchenRuns(k).map(({id,length})=>({id,length})),appliances:kitchenAppliances(k)};
}
export const at=(apps:Appliance[],runId:RunId,slot:number)=>apps.filter(a=>a.runId===runId&&a.slot===slot);
const upper=(kind:ApplianceKind)=>['hood','microwave'].includes(kind);
function compatible(a:ApplianceKind,b:ApplianceKind){
 if(a==='fridge'||b==='fridge')return false;
 if(upper(a)&&upper(b))return false;
 if(upper(a)||upper(b))return !(a==='microwave'&&b==='sink'||b==='microwave'&&a==='sink');
 return a==='oven'&&b==='hob'||a==='hob'&&b==='oven';
}
export function kitchenIssues(k:Kitchen):string[]{
 const runs=kitchenRuns(k),apps=kitchenAppliances(k),issues:string[]=[];
 for(const app of apps){
  const run=runs.find(r=>r.id===app.runId);
  if(!run||!Number.isInteger(app.slot)||app.slot<0||app.slot>=run.modules){issues.push(`${applianceInfo[app.kind].label}: избери съществуваща стена и модул.`);continue;}
  for(const other of apps.filter(b=>b.id>app.id&&b.runId===app.runId&&b.slot===app.slot))if(!compatible(app.kind,other.kind))issues.push(`${applianceInfo[app.kind].label} и ${applianceInfo[other.kind].label} не могат да заемат ${run.short}${app.slot+1}.`);
  if(app.kind==='hood'&&k.hood==='Таванен над остров'&&run.id!=='island')issues.push('Таванният аспиратор над остров трябва да е върху острова.');
 }
 const hob=apps.find(a=>a.kind==='hob'),hood=apps.find(a=>a.kind==='hood');
 if(hob&&hood&&(hob.runId!==hood.runId||hob.slot!==hood.slot))issues.push('Аспираторът трябва да бъде над котлоните. Изравни позициите или включи свързаното преместване.');
 if(hasSides(k)&&k.roomW<k.lowerDepth*2+90)issues.push('Между страничните модули остава тесен проход. Увеличи ширината на стаята.');
 if(k.layout==='Кухня с остров'&&k.roomD<k.lowerDepth+90+120+90)issues.push('Провери проходите около острова: препоръчителното разстояние е поне 90 см.');
 return [...new Set(issues)];
}
export function canPlace(k:Kitchen,kind:ApplianceKind,runId:RunId,slot:number,except:string[]=[]){
 const run=kitchenRuns(k).find(r=>r.id===runId);
 if(!run||slot<0||slot>=run.modules||!Number.isInteger(slot))return false;
 if((kind==='microwave'||kind==='fridge')&&runId==='island')return false;
 return at(kitchenAppliances(k).filter(a=>!except.includes(a.id)),runId,slot).every(a=>compatible(a.kind,kind));
}
export function moveAppliance(k:Kitchen,id:string,runId:RunId,slot:number):Kitchen{
 const next=normalizeKitchen(k),app=next.appliances!.find(a=>a.id===id);
 if(!app)throw new Error('Първо избери уред.');
 const coupled=app.kind==='hob'&&next.hoodFollowsHob?next.appliances!.filter(a=>a.kind==='hood'):[];
 const ignore=[id,...coupled.map(a=>a.id)];
 if(app.kind==='hood'||coupled.length){if(runId==='island')next.hood='Таванен над остров';else if(next.hood==='Таванен над остров')next.hood='Вграден в шкаф';}
 if(!canPlace(next,app.kind,runId,slot,ignore)||coupled.some(a=>!canPlace(next,a.kind,runId,slot,ignore)))throw new Error('Този модул е зает или е неподходящ. Избери свободен модул.');
 return {...next,hoodFollowsHob:app.kind==='hood'?false:next.hoodFollowsHob,appliances:next.appliances!.map(a=>ignore.includes(a.id)?{...a,runId,slot}:a)};
}
export function addAppliance(k:Kitchen,kind:ApplianceKind):Kitchen{
 const next=normalizeKitchen(k);
 if(next.appliances!.some(a=>a.kind===kind))throw new Error('Този уред вече е добавен.');
 const adjusted=kind==='hood'&&k.hood==='Без аспиратор'?{...next,hood:'Вграден в шкаф'}:next;
 const hob=adjusted.appliances!.find(a=>a.kind==='hob');
 const places=kitchenRuns(adjusted).flatMap(r=>Array.from({length:r.modules},(_,slot)=>({runId:r.id,slot})));
 const target=(kind==='hood'&&hob&&canPlace(adjusted,kind,hob.runId,hob.slot)?hob:places.find(pos=>canPlace(adjusted,kind,pos.runId,pos.slot)));
 if(!target)throw new Error('Няма свободен подходящ модул. Увеличи работната линия или освободи място.');
 return {...adjusted,appliances:[...adjusted.appliances!,{id:kind,kind,runId:target.runId,slot:target.slot}]};
}
export function removeAppliance(k:Kitchen,id:string):Kitchen{
 const next=normalizeKitchen(k),app=next.appliances!.find(a=>a.id===id);
 return {...next,hood:app?.kind==='hood'?'Без аспиратор':next.hood,appliances:next.appliances!.filter(a=>a.id!==id)};
}

export function exchangeModules(k:Kitchen,id:string,runId:RunId,slot:number):Kitchen{
 const next=normalizeKitchen(k),source=next.appliances!.find(a=>a.id===id),target=kitchenRuns(next).find(r=>r.id===runId);
 if(!source||!target||slot<0||slot>=target.modules||!Number.isInteger(slot))throw new Error('Избери съществуващ модул за размяната.');
 const address={runId:source.runId,slot:source.slot};
 const appliances=next.appliances!.map(a=>a.runId===address.runId&&a.slot===address.slot?{...a,runId,slot}:a.runId===runId&&a.slot===slot?{...a,...address}:a);
 const hood=appliances.find(a=>a.kind==='hood');
 const candidate={...next,appliances,hood:hood?.runId==='island'?'Таванен над остров':next.hood==='Таванен над остров'?'Вграден в шкаф':next.hood};
 if(appliances.some(a=>!canPlace(candidate,a.kind,a.runId,a.slot,[a.id])))throw new Error('Тези модули не могат да се разменят. Високите уреди и микровълновата изискват стена.');
 return candidate;
}
export function changeKitchenGeometry(k:Kitchen,patch:Partial<Kitchen>):Kitchen{
 const old=normalizeKitchen(k),candidate={...old,...patch};
 if(patch.length!==undefined)candidate.runs=old.runs!.map(r=>r.id==='a'?{...r,length:patch.length!}:r);
 const runs=kitchenRuns(candidate),placed:Appliance[]=[];
 for(const app of old.appliances!){
  const test={...candidate,appliances:placed},run=runs.find(r=>r.id===app.runId);
  let target=run&&app.slot<run.modules&&canPlace(test,app.kind,app.runId,app.slot)?{runId:app.runId,slot:app.slot}:null;
  if(!target)target=runs.flatMap(r=>Array.from({length:r.modules},(_,slot)=>({runId:r.id,slot}))).find(pos=>canPlace(test,app.kind,pos.runId,pos.slot))||null;
  if(!target)throw new Error('Няма място за всички уреди в това разпределение. Премахни уред или увеличи работната линия.');
  placed.push({...app,...target});
 }
 let next:Kitchen={...candidate,length:runs[0].length,runs:runs.map(({id,length})=>({id,length})),appliances:placed};
 const hob=placed.find(a=>a.kind==='hob'),hood=placed.find(a=>a.kind==='hood');
 if(next.hoodFollowsHob&&hob&&hood)next=moveAppliance(next,hob.id,hob.runId,hob.slot);
 return next;
}
export function resizeRun(k:Kitchen,id:RunId,length:number):Kitchen{
 return changeKitchenGeometry(k,{...(id==='a'?{length}:{}),runs:kitchenRuns(k).map(r=>({id:r.id,length:r.id===id?length:r.length}))});
}
export function planSlot(k:Kitchen,run:KitchenRun,slot:number){
 const depth=k.lowerDepth;
 if(run.orientation==='back')return{x:(k.layout==='Ъглова кухня'?k.roomW-run.length:0)+slot*60,y:0,w:60,d:depth};
 if(run.orientation==='left')return{x:0,y:depth+slot*60,w:depth,d:60};
 if(run.orientation==='right')return{x:k.roomW-depth,y:depth+slot*60,w:depth,d:60};
 if(run.orientation==='opposite')return{x:(run.modules-1-slot)*60,y:k.roomD-depth,w:60,d:depth};
 return{x:(k.roomW-run.length)/2+slot*60,y:(depth+k.roomD-120)/2,w:60,d:120};
}
export const kitchenSummary=(k:Kitchen)=>kitchenRuns(k).map(run=>`${run.label}: ${run.length} см; ${kitchenAppliances(k).filter(a=>a.runId===run.id).map(a=>`${applianceInfo[a.kind].label} ${run.short}${a.slot+1}`).join(', ')||'шкафове'}`).join('\n');
