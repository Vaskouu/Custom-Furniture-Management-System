import {useState} from 'react';
import {ArrowUpRight,FolderOpen} from 'lucide-react';
import {Kitchen,kitchens,kitchenPrice,imageUrl} from '../../data';
import {PageTitle,Button} from '../../components';
import {money} from '../../pricing';
import {readLocal} from '../../api';
import ProductImage from '../catalog/ProductImage';
import KitchenPlanner from './KitchenPlanner';
import {kitchenRuns} from './model';

export default function Kitchens({onQuote}:{onQuote:(k:Kitchen)=>void}){
 const [selected,setSelected]=useState<Kitchen|null>(null),[revision,setRevision]=useState(0),[style,setStyle]=useState('Всички');
 const [draft]=useState<Kitchen|null>(()=>readLocal('kitchen-draft-v2',null));
 function choose(k:Kitchen){setSelected(k);setRevision(n=>n+1);setTimeout(()=>document.getElementById('kitchen-plan')?.scrollIntoView({behavior:'smooth'}),30)}
 return <><PageTitle eyebrow="КУХНЯТА Е СЪРЦЕТО НА ДОМА" title="Събрани около добрия дизайн." description="Десет начални идеи. Шест разпределения. Всяка стена има свой изглед."/>
  {draft&&<div className="kitchen-restore"><FolderOpen size={18}/><span>Имаш запазен кухненски проект в този браузър.</span><button onClick={()=>choose(draft)}>Продължи с {draft.name} ↗</button></div>}
  <div className="tabs">{['Всички','Минималистична','Естествено дърво','Скандинавска','Индустриална','Класическа'].map(s=><button className={style===s?'active':''} key={s} onClick={()=>setStyle(s)}>{s}</button>)}</div>
  <div className="kitchen-grid">{kitchens.filter(k=>style==='Всички'||k.style===style).map(k=><article key={k.id} className="kitchen-card"><div className="kitchen-inspiration-photo"><ProductImage source={k.image} label={'Начална студийна визуализация на '+k.name+' — '+k.layout}/><span>НАЧАЛНА СТУДИЙНА ВИЗУАЛИЗАЦИЯ</span></div><div className="kitchen-card-info"><div><small>{k.style} / {k.layout}</small><h2>{k.name}</h2><span>от {money(kitchenPrice(k))} · ориентировъчно</span><small className="kitchen-run-note">{kitchenRuns(k).map(r=>(r.id==='island'?'Остров':'Стена '+r.short)+' '+r.length+' см').join(' · ')}</small></div><button className="circle-button" aria-label={'Персонализирай кухня '+k.name} onClick={()=>choose(k)}><ArrowUpRight/></button></div></article>)}</div>
  {!selected&&<div className="centered"><Button onClick={()=>choose(kitchens[0])}>Създай своята кухня <ArrowUpRight size={17}/></Button></div>}
  {selected&&<KitchenPlanner key={selected.id+'-'+revision} initial={selected} onQuote={onQuote}/>}
 </>;
}
