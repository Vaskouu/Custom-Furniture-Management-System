import {useState} from 'react';
import {ProjectCase,footprint,projectSize} from './model';

export default function ProjectPlan({project:p}:{project:ProjectCase}){
 const [selected,setSelected]=useState(p.items[0].id),active=p.items.find(i=>i.id===selected)||p.items[0];
 const scale=Math.min(480/p.room.w,355/p.room.d),w=p.room.w*scale,d=p.room.d*scale,x=(600-w)/2,y=55;
 const door=80*scale,doorX=x+(w-door)/2;
 const win=p.room.window,windowPosition=win.wall==='top'?{x1:x+win.start*scale,y1:y,x2:x+(win.start+win.length)*scale,y2:y}:{x1:win.wall==='left'?x:x+w,y1:y+win.start*scale,x2:win.wall==='left'?x:x+w,y2:y+(win.start+win.length)*scale};
 return <div className="project-plan-layout"><div className="project-room-plan"><svg viewBox="0 0 600 480" role="group" aria-label={'Разпределение на '+p.name}>
  <rect x={x} y={y} width={w} height={d} fill="#faf8f0" stroke="#aab39b" strokeWidth="3"/>
  <line {...windowPosition} stroke="#85a7ad" strokeWidth="7"/><text x={x+w/2} y="29" textAnchor="middle" fill="#657857" fontSize="13">{p.room.w} см</text><text x={x-19} y={y+d/2} textAnchor="middle" fill="#657857" fontSize="12" transform={`rotate(-90 ${x-19} ${y+d/2})`}>{p.room.d} см</text>
  {p.items.map((item,index)=>{const box=footprint(item),ix=x+item.x*scale,iy=y+item.y*scale,iw=box.w*scale,ih=box.d*scale;return <g key={item.id} className="project-plan-item" role="button" tabIndex={0} aria-label={'Маркирай '+item.label} aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(item.id)}}}><rect x={ix+1} y={iy+1} width={iw-2} height={ih-2} rx="3" fill={item.color} stroke={selected===item.id?'#324d28':'#fff8'} strokeWidth={selected===item.id?3.5:1.5}/><circle cx={ix+iw/2} cy={iy+ih/2} r="11" fill="#faf7e9e8"/><text x={ix+iw/2} y={iy+ih/2+4} textAnchor="middle" fill="#3b5032" fontSize="11" fontWeight="600">{index+1}</text></g>})}
  <path d={`M${doorX} ${y+d}h${door}m-${door} 0v-${door}a${door} ${door} 0 0 1 ${door} ${door}`} stroke="#b9c1ad" strokeWidth="1.5" fill="none"/>
  <text x="300" y="451" textAnchor="middle" fill="#7a8a69" fontSize="11">Натисни номер или мебел от списъка, за да видиш детайлите.</text>
 </svg><p className="caption">Идейно разпределение. Размерите са примерни; отворите и отстоянията се уточняват за конкретното помещение.</p></div>
 <div><div className="project-plan-legend" role="group" aria-label="Мебели в разпределението">{p.items.map((item,i)=><button key={item.id} aria-pressed={item.id===selected} className={item.id===selected?'active':''} onClick={()=>setSelected(item.id)}><span style={{background:item.color}}>{i+1}</span><div><b>{item.label}</b><small>{projectSize(item.size)}</small></div></button>)}</div><div className="project-plan-description" role="status"><b>{active.label}</b><p>{active.note}</p><small>{active.material}</small></div></div>
 </div>;
}
