import {useId} from 'react';
import {Kitchen,products,newConfig} from '../../data';
import {SurfaceDefs,surfaceFill} from './Surface';
import {colorHex,shade} from './model';
import {RunId,KitchenRun,kitchenRuns,kitchenAppliances,at,planSlot,applianceInfo} from '../kitchen/model';

export type KitchenView='front'|'plan'|'upper'|'walls';
export function kitchenZones(k:Kitchen){const apps=kitchenAppliances(k),slot=(kind:string)=>apps.find(a=>a.kind===kind)?.slot??-1;return {n:kitchenRuns(k)[0].modules,sink:slot('sink'),oven:slot('oven'),fridge:slot('fridge'),hood:slot('hood')}}
type Props={k:Kitchen;view?:KitchenView;runId?:RunId;selectedId?:string|null;onSlotClick?:(runId:RunId,slot:number)=>void};

export default function KitchenScene({k,view='front',runId='a',selectedId,onSlotClick}:Props){
 const id='k'+useId().replace(/:/g,''),runs=kitchenRuns(k),apps=kitchenAppliances(k),current=runs.find(r=>r.id===runId)||runs[0];
 const color=colorHex(k.color),upperColor=colorHex(k.upperColor||'Кашмир'),edge=k.edgeColor==='auto'||!k.edgeColor?shade(color,-20):colorHex(k.edgeColor),handle=k.handleColor||'#252b32';
 const cfg={...newConfig(products[26]),color:k.color,finish:/дъб|орех|Бреза/.test(k.color)||k.front==='Масив'?'Дървесен':'Гладък мат',handleColor:handle},upperCfg={...cfg,finish:/дъб|орех|Бреза/.test(k.upperColor||'')?'Дървесен':'Гладък мат'};
 const fill=surfaceFill(id,cfg.finish),upperFill=surfaceFill(id+'u',upperCfg.finish),counter=k.counter==='Кварц'?`url(#${id}-counter)`:k.counter==='Масив'?'#b99368':'#e3ded3';
 const title=view==='plan'?'План отгоре':view==='walls'?'Всички стени':view==='upper'?'Горни шкафове':current.label;
 const selected=apps.find(a=>a.id===selectedId),activate=(run:RunId,slot:number)=>onSlotClick?.(run,slot);
 function SlotHit({run,slot,x,y,w,h}:{run:KitchenRun;slot:number;x:number;y:number;w:number;h:number}){
  if(!onSlotClick)return null;
  return <rect className="kitchen-slot-hit" x={x} y={y} width={w} height={h} fill="transparent" stroke="transparent" strokeWidth="2" role="button" tabIndex={0} aria-label={`${selected?'Постави '+applianceInfo[selected.kind].label+': ':''}${run.label}, модул ${slot+1}`} onClick={()=>activate(run.id,slot)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(run.id,slot)}}}/>;
 }
 function Pull({x,y,w}:{x:number;y:number;w:number}){return k.handles==='Без дръжки'?null:<path d={`M${x+w*.65} ${y+14}h${w*.22}`} stroke={handle} strokeWidth="3" strokeLinecap="round"/>}
 function Machine({x,y,w,h,dryer=false}:{x:number;y:number;w:number;h:number;dryer?:boolean}){return <g><rect x={x+3} y={y+2} width={w-6} height={h-4} rx="2" fill="#e8eded" stroke="#92a3a7"/><rect x={x+4} y={y+4} width={w-8} height="17" fill="#f4f6f5"/><circle cx={x+w*.57} cy={y+12} r="4" fill="#829295" stroke="#dce2e3"/><rect x={x+9} y={y+8} width={w*.24} height="5" fill="#a7b7bb"/><circle cx={x+w/2} cy={y+h*.6} r={Math.min(w*.32,h*.3)} fill="#344d5d" stroke="#aab8bf" strokeWidth="4"/><circle cx={x+w/2} cy={y+h*.6} r={Math.min(w*.25,h*.23)} fill={dryer?'#b4c5ca':'#769daa'}/><path d={`M${x+w*.33} ${y+h*.62}q${w*.17} ${h*.17} ${w*.34} 0`} stroke={dryer?'#e5d7bc':'#c1dce1'} strokeWidth="4" fill="none"/><path d={`M${x+9} ${y+h-8}h${w*.3}`} stroke="#aebbbd" strokeWidth="2"/></g>}
 function Oven({x,y,w,h,micro=false}:{x:number;y:number;w:number;h:number;micro?:boolean}){return <g><rect x={x+4} y={y+5} width={w-8} height={h-10} rx="2" fill="#263641" stroke="#738a92" strokeWidth="2"/><rect x={x+9} y={y+25} width={w-18} height={h-39} fill="#172b37" stroke="#4c6671"/><path d={`M${x+12} ${y+22}h${w-24}`} stroke="#b8c6c9" strokeWidth="3"/>{[.25,.5,.75].map(t=><circle key={t} cx={x+w*t} cy={y+13} r="2" fill="#b6c9cc"/>)}<path d={`M${x+12} ${y+h-19}h${w-24}`} stroke="#7b949c" strokeWidth="1"/>{micro&&<text x={x+w/2} y={y+h/2+5} textAnchor="middle" fill="#92adbb" fontSize="8">MICRO</text>}</g>}
 function Elevation({run,upperOnly=false}:{run:KitchenRun;upperOnly?:boolean}){
  const width=Math.min(570,Math.max(310,run.length*1.25)),x=(720-width)/2,unit=width/run.modules,y=313,h=k.lowerHeight*1.12,uh=k.upper*1.24,uy=210-uh,island=run.id==='island';
  const entries=Array.from({length:run.modules},(_,i)=>({slot:['left','opposite'].includes(run.orientation)?run.modules-1-i:i,index:i}));
  return <g data-elevation-run={run.id}><rect x="22" y="25" width="676" height="420" fill="#f3f0e8"/><path d="M22 445H698L720 530H0Z" fill="#ded5c2"/><path d="M22 445H698" stroke="#c4c7bb"/>
   <text x="360" y="48" textAnchor="middle" fill="#526346" fontSize="13" fontWeight="600">{run.label} · {run.length} см</text>
   <g opacity={upperOnly?.12:1}>
   {!island&&<rect x={x} y="215" width={width} height={y-215} fill={k.backsplash==='Керамика'?`url(#${id}-tiles)`:k.backsplash==='Стъкло'?'#d1e0df':fill}/>}
   <rect x={x-2} y={y+h} width={width+4} height="11" fill={shade(color,-42)}/>
   {entries.map(({slot,index})=>{const px=x+index*unit,here=at(apps,run.id,slot),base=here.find(a=>!['hob','hood','microwave'].includes(a.kind)),hob=here.some(a=>a.kind==='hob');
    return <g key={slot} data-run={run.id} data-slot={slot}>
     <rect x={px+1} y={y} width={unit-2} height={h} fill={fill} stroke={edge} strokeWidth="1.6"/>
     {base?.kind==='oven'?<Oven x={px} y={y} w={unit} h={h}/>:base?.kind==='washer'||base?.kind==='dryer'?<Machine x={px} y={y} w={unit} h={h} dryer={base.kind==='dryer'}/>:base?.kind==='dishwasher'?<><rect x={px+3} y={y+3} width={unit-6} height="14" fill="#b7c4c6"/><circle cx={px+unit-13} cy={y+10} r="2" fill="#3e656d"/><path d={`M${px+12} ${y+24}h${unit-24}`} stroke={handle} strokeWidth="3"/><path d={`M${px+8} ${y+h-7}h${unit-16}`} stroke={edge}/></>:base?.kind==='wineCooler'?<><rect x={px+5} y={y+5} width={unit-10} height={h-10} fill="#263b40" stroke="#8f9f9c"/>{[.24,.47,.7].map(t=><g key={t}><path d={`M${px+10} ${y+h*t+8}h${unit-20}`} stroke="#ac8b5e" strokeWidth="3"/>{[.28,.5,.72].map(v=><circle key={v} cx={px+unit*v} cy={y+h*t} r="4.5" fill="#645047" stroke="#af966d"/>)}</g>)}</>:!base&&k.drawers>0&&index===0?<>{[0,1,2].map(j=><g key={j}><rect x={px+2} y={y+j*h/3} width={unit-4} height={h/3-1} fill={fill} stroke={edge}/><Pull x={px} y={y+j*h/3-3} w={unit}/></g>)}</>:<Pull x={px} y={y} w={unit}/>}
     <rect x={px} y={y-8} width={unit} height="8" fill={counter} stroke="#a6aba0"/>
     {base?.kind==='sink'&&<><ellipse cx={px+unit*.5} cy={y-7} rx={unit*.31} ry="5" fill="#91aaaf" stroke="#d3dfdc" strokeWidth="2"/><path d={`M${px+unit*.66} ${y-10}v-26q0-10-10-10h-8v11`} stroke={handle} strokeWidth="3" fill="none"/></>}
     {hob&&<g data-hob="true"><rect x={px+unit*.08} y={y-14} width={unit*.84} height="7" rx="2" fill="#21333d"/>{[.32,.65].map(v=><ellipse key={v} cx={px+unit*v} cy={y-13} rx={unit*.1} ry="2" fill="none" stroke="#9aadb1"/>)}</g>}
     {base?.kind==='fridge'&&<><rect x={px+1} y={uy} width={unit-2} height={y+h-uy} fill={fill} stroke={edge} strokeWidth="2"/><path d={`M${px+3} ${y}h${unit-6}`} stroke={edge} strokeWidth="2"/><path d={`M${px+unit-13} ${uy+70}v30m0 85v20`} stroke={handle} strokeWidth="3"/></>}
     {selected&&here.some(a=>a.id===selected.id)&&<rect x={px+2} y={y+2} width={unit-4} height={h-4} fill="#bba36b22" stroke="#b1863d" strokeDasharray="5 3" strokeWidth="2"/>}
    </g>;
   })}
   {k.applianceGarage&&!island&&(()=>{const place=entries.find(({slot,index})=>index===1&&!at(apps,run.id,slot).length)||entries.find(({slot})=>!at(apps,run.id,slot).length);if(!place)return null;return <g data-appliance-garage-slot={place.slot} transform={`translate(${(place.index-1)*unit} 0)`}><rect x={x+unit+4} y={y-79} width={unit-8} height="69" fill={fill} stroke={edge}/>{[0,1,2,3,4,5].map(i=><path key={i} d={`M${x+unit+8} ${y-73+i*10}h${unit-16}`} stroke={shade(color,-28)}/>)}<path d={`M${x+unit+14} ${y-20}h${unit-28}`} stroke={handle} strokeWidth="2"/></g>})()}
   </g>
   {entries.map(({slot,index})=>{const px=x+index*unit,here=at(apps,run.id,slot),hood=here.find(a=>a.kind==='hood'),micro=here.some(a=>a.kind==='microwave'),fridge=here.some(a=>a.kind==='fridge');
    const open=!hood&&!micro&&(k.upperStyle==='Отворени рафтове'||k.openShelves&&index===0),glass=k.glassCabinets&&index===run.modules-2&&!hood&&!micro;
    if(fridge)return null;
    return <g key={slot}>
     {!island&&(hood&&k.hood==='Декоративен коминен'?<><rect x={px+unit*.38} y={uy} width={unit*.24} height={uh*.65} fill="#b6c6cd" stroke="#78909c"/><path d={`M${px+unit*.38} ${uy+uh*.65}h${unit*.24}l${unit*.3} ${uh*.32}h-${unit*.84}z`} fill="#9aafb9" stroke="#637e8b"/></>:open?<><rect x={px+2} y={uy} width={unit-4} height={uh} fill={shade(upperColor,-16)}/>{[.33,.66,1].map((t,j)=><g key={j}><path d={`M${px+2} ${uy+uh*t}h${unit-4}`} stroke={shade(upperColor,-22)} strokeWidth="4"/>{j===0?<><rect x={px+10} y={uy+uh*t-20} width="13" height="18" rx="2" fill="#c69e7c"/><circle cx={px+unit*.65} cy={uy+uh*t-9} r="8" fill="#8ca181"/></>:<path d={`M${px+14} ${uy+uh*t-4}h${unit-28}`} stroke="#eee3cc" strokeWidth="5"/>}</g>)}</>:<><rect x={px+1} y={uy} width={unit-2} height={uh} fill={upperFill} stroke={shade(upperColor,-22)} strokeWidth="1.6"/>{micro?<Oven x={px+2} y={uy+uh*.22} w={unit-4} h={uh*.7} micro/>:glass?<><rect x={px+7} y={uy+7} width={unit-14} height={uh-14} fill={`url(#${id}-glass)`} stroke={shade(upperColor,-28)} strokeWidth="3"/>{[.35,.7].map(t=><path key={t} d={`M${px+8} ${uy+uh*t}h${unit-16}`} stroke="#8ea2a1" strokeWidth="2"/>)}</>:k.handles!=='Без дръжки'&&<path d={`M${px+unit-12} ${uy+uh-28}v17`} stroke={handle} strokeWidth="3"/>}</>)}
     {hood&&k.hood==='Вграден в шкаф'&&<g data-integrated-hood="true"><rect x={px+4} y={uy+uh} width={unit-8} height="9" fill="#849ba6" stroke="#587380"/>{[.2,.35,.5,.65,.8].map(t=><path key={t} d={`M${px+unit*t} ${uy+uh+2}v4`} stroke="#263e49"/>)}<circle cx={px+12} cy={uy+uh+4} r="2" fill="#ffe7a1"/><circle cx={px+unit-12} cy={uy+uh+4} r="2" fill="#ffe7a1"/></g>}
     {hood&&k.hood==='Таванен над остров'&&<g><path d={`M${px+unit*.2} 60v55m${unit*.6} -55v55`} stroke="#8da3ac" strokeWidth="2"/><rect x={px+1} y="115" width={unit-2} height="12" fill="#9eafb8" stroke="#677f8b"/><path d={`M${px+10} 124h${unit-20}`} stroke="#f5df9f" strokeWidth="3"/></g>}
     {!island&&k.ceilingCabinets&&k.upperStyle==='До тавана'&&<rect x={px+1} y={uy-32} width={unit-2} height="28" fill={upperFill} stroke={shade(upperColor,-22)}/>}
    </g>;
   })}
   {k.light&&!island&&entries.map(({slot,index})=>{
    if(at(apps,run.id,slot).some(a=>a.kind==='fridge'||a.kind==='hood'))return null;
    const left=x+index*unit+4,lightY=uy+uh+10,clipId=`${id}-light-${run.id}-${slot}`;
    return <g key={slot} data-led-run={run.id} data-led-slot={slot}>
     <defs><clipPath id={clipId}><rect x={x+index*unit+2} y={lightY-6} width={unit-4} height="20"/></clipPath></defs>
     <g clipPath={`url(#${clipId})`}><path d={`M${left} ${lightY}h${unit-8}`} stroke="#ffd47a" strokeWidth="8" opacity=".5" filter={`url(#${id}-led)`}/><path d={`M${left} ${lightY}h${unit-8}`} stroke="#ffe7b3" strokeWidth="2"/></g>
    </g>;
   })}
   {k.wineRack&&!island&&<g><rect x={x-30} y={uy} width="26" height={uh} fill={shade(upperColor,-25)} stroke={edge}/>{[0,1,2].map(j=><path key={j} d={`M${x-29} ${uy+j*uh/3}l24 ${uh/3}m0-${uh/3}l-24 ${uh/3}`} stroke={upperColor} strokeWidth="2"/>)}</g>}
   {entries.map(({slot,index})=><g key={slot}><text x={x+(index+.5)*unit} y="462" textAnchor="middle" fontSize="10" fill="#64735c">{run.short}{slot+1}</text><text x={x+(index+.5)*unit} y="478" textAnchor="middle" fontSize="7" fill="#68775f">{at(apps,run.id,slot).map(a=>applianceInfo[a.kind].short).join(' / ')||'ШКАФ'}</text><SlotHit run={run} slot={slot} x={x+index*unit} y={upperOnly?uy:y} w={unit} h={upperOnly?uh:h+5}/></g>)}
   <path d={`M${x} 491v6m0-3h${width}m0-3v6`} stroke="#8a977c"/><text x="360" y="516" textAnchor="middle" fontSize="11" fill="#627555">{run.length} см · модули по 60 см · изглед от помещението</text>
  </g>;
 }
 const board=view==='walls',rows=Math.ceil(runs.length/2),cols=runs.length===1?1:2;
 return <svg className="kitchen-svg detailed-kitchen" role="img" aria-label={`${title}: ${k.name}, ${k.layout}. ${runs.map(r=>r.label+': '+apps.filter(a=>a.runId===r.id).map(a=>applianceInfo[a.kind].label+' '+r.short+(a.slot+1)).join(', ')).join('. ')}`} data-view={view} data-hood={k.hood||'Вграден в шкаф'} data-active-wall={current.id} viewBox={board?`0 0 ${720*cols} ${530*rows}`:'0 0 720 530'}>
  <SurfaceDefs id={id} color={color} config={cfg}/><SurfaceDefs id={id+'u'} color={upperColor} config={upperCfg}/>
  <defs><pattern id={id+'-tiles'} width="55" height="26" patternUnits="userSpaceOnUse"><rect width="55" height="26" fill="#e9e5dc"/><path d="M0 0h55v26" stroke="#d0d0c4" fill="none"/></pattern><pattern id={id+'-counter'} width="130" height="30" patternUnits="userSpaceOnUse"><rect width="130" height="30" fill="#f0eae1"/><path d="M-5 21l30-7 20 4 35-12 55-7" stroke="#a4a79e" strokeWidth="1.2" opacity=".6" fill="none"/></pattern></defs>
  {view==='plan'?(()=>{
   const scale=Math.min(600/k.roomW,365/k.roomD),ox=(720-k.roomW*scale)/2,oy=72;
   return <><text x="360" y="30" textAnchor="middle" fill="#596c4d" fontSize="13">{k.layout} · {k.roomW} × {k.roomD} см</text><rect x={ox} y={oy} width={k.roomW*scale} height={k.roomD*scale} fill="#f5f2e9" stroke="#b9c3ae" strokeWidth="3"/>
   {runs.map(run=><g key={run.id} data-plan-run={run.id}>{Array.from({length:run.modules},(_,slot)=>{
    const r=planSlot(k,run,slot),x=ox+r.x*scale,y=oy+r.y*scale,w=r.w*scale,h=r.d*scale,here=at(apps,run.id,slot),isSelected=here.some(a=>a.id===selectedId),surface=here.find(a=>!['hood','microwave'].includes(a.kind));
    return <g key={slot} data-run={run.id} data-slot={slot}><rect x={x+1} y={y+1} width={w-2} height={h-2} fill={surface?applianceInfo[surface.kind].color:fill} stroke={isSelected?'#b88b36':edge} strokeWidth={isSelected?3:1.5}/><text x={x+w/2} y={y+h*.35} textAnchor="middle" fontSize={Math.max(7,9*scale)} fill={surface?'#fff':'#4b6146'} fontWeight="600">{run.short}{slot+1}</text>{here.slice(0,3).map((a,j)=><text key={a.id} x={x+w/2} y={y+h*.55+j*10*scale} textAnchor="middle" fontSize={Math.max(6,8*scale)} fill="#fff" stroke="#0002" strokeWidth=".2">{applianceInfo[a.kind].short}</text>)}{here.some(a=>a.kind==='hood')&&<path d={`M${x+4} ${y+4}h${w-8}`} stroke="#edc56b" strokeWidth="4"/>}<SlotHit run={run} slot={slot} x={x} y={y} w={w} h={h}/></g>;
   })}</g>)}
   <text x="360" y="472" textAnchor="middle" fill="#6b7c5d" fontSize="11">{runs.map(r=>r.label+' '+r.length+' см').join(' · ')}</text><text x="360" y="501" textAnchor="middle" fill="#879077" fontSize="10">{selected?'Избери модул, за да преместиш '+applianceInfo[selected.kind].label.toLocaleLowerCase('bg')+'.':'Цветните модули показват разположението на уредите.'}</text></>;
  })():board?runs.map((run,i)=><svg key={run.id} x={(i%cols)*720} y={Math.floor(i/cols)*530} width="720" height="530" viewBox="0 0 720 530"><Elevation run={run}/></svg>):<Elevation run={current} upperOnly={view==='upper'}/>}
 </svg>;
}
