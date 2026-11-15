import {useState} from 'react';
import {ArrowUpRight,Check,Ruler,LayoutPanelTop,Images} from 'lucide-react';
import {Config,newConfig} from '../../data';
import {QuoteSubject} from '../../quoteTypes';
import {useStore} from '../../store';
import {PageTitle,Modal,Button} from '../../components';
import {projects} from './data';
import {ProjectCase,projectArea,projectSize,projectBrief} from './model';
import ProjectImage from './ProjectImage';
import ProjectPlan from './ProjectPlan';

type Props={navigate:(page:string)=>void;configure:(config:Config)=>void;onQuote:(subject:QuoteSubject)=>void};
export default function ProjectsPage({navigate,configure,onQuote}:Props){
 const s=useStore(),[filter,setFilter]=useState('Всички'),[selected,setSelected]=useState<ProjectCase|null>(null),[view,setView]=useState('visual');
 function open(project:ProjectCase){setSelected(project);setView('visual')}
 const shown=projects.filter(p=>filter==='Всички'||p.type===filter);
 return <><PageTitle eyebrow="ПРОЕКТИРАНО ОКОЛО ЕЖЕДНЕВИЕТО" title="Всяка стая. Свое решение." description="Виж конкретните мебели, задачата и разпределението зад всяка идея — от ТВ секцията до работното бюро."/>
  <div className="tabs project-category-tabs" role="group" aria-label="Вид проект">{['Всички',...new Set(projects.map(p=>p.type))].map(type=><button key={type} className={type===filter?'active':''} aria-pressed={type===filter} onClick={()=>setFilter(type)}>{type}</button>)}</div>
  <div className="project-stories-grid">{shown.map(p=><article key={p.id} className="project-story-card"><button className="project-card-open" aria-label={'Разгледай проект '+p.name} onClick={()=>open(p)}><div className="project-card-photo"><ProjectImage cell={p.imageCell} label={p.name+' — идейна визуализация'}/><span>{p.type.toUpperCase()}</span></div><div className="project-card-meta"><span>ИДЕЕН ПРОЕКТ</span><span>около {projectArea(p)} м²</span></div><h2>{p.name}</h2><p>{p.summary}</p><div className="project-feature-tags">{p.features.map(f=><span key={f}>{f}</span>)}</div><div className="project-card-action">Разгледай мебелите и разпределението <ArrowUpRight size={18}/></div></button></article>)}</div>
  <p className="project-concept-note">Четири примерни проектни решения със студийни визуализации. Размерите и материалите служат за отправна точка при индивидуална поръчка.</p>
  {s.resources.portfolio.length>0&&<section className="section"><h2>Още идеи от студиото</h2><div className="values">{s.resources.portfolio.map(r=><article key={r.id}><h3>{r.name}</h3><p>{r.description}</p><Button secondary onClick={()=>navigate('quote')}>Запитване за подобен проект</Button></article>)}</div></section>}
  {selected&&<Modal title={selected.name} onClose={()=>setSelected(null)}><div className="project-detail-meta"><span>{selected.type}</span><span>около {projectArea(selected)} м²</span><span>Идеен проект</span></div><p className="project-detail-summary">{selected.summary}</p><div className="project-detail-tabs" role="group" aria-label="Детайли на проекта">{[{id:'visual',name:'Визуализация',icon:Images},{id:'plan',name:'Разпределение',icon:LayoutPanelTop},{id:'details',name:'Мебели и материали',icon:Ruler}].map(tab=><button key={tab.id} className={view===tab.id?'active':''} aria-pressed={view===tab.id} onClick={()=>setView(tab.id)}><tab.icon size={15}/>{tab.name}</button>)}</div>
   {view==='visual'?<div className="project-visual-layout"><ProjectImage cell={selected.imageCell} label={selected.name+' — идейна визуализация'}/><div className="project-brief"><span className="eyebrow">КАКВО ПРОЕКТИРАМЕ</span><h3>{selected.type==='Домашен офис'?'Работно място за един човек.':'Решение за конкретна стая.'}</h3><p>{selected.brief}</p><ul>{selected.features.map(feature=><li key={feature}><Check size={14}/>{feature}</li>)}</ul><div className="project-materials">{selected.materials.map(m=><span key={m.name}><i style={{background:m.color}}/>{m.name}</span>)}</div></div></div>:view==='plan'?<ProjectPlan key={selected.id} project={selected}/>:<div className="project-case-details"><div className="project-case-explanation"><section><span className="eyebrow">ЗАДАЧАТА</span><p>{selected.brief}</p></section><section><span className="eyebrow">РЕШЕНИЕТО</span><ol>{selected.solution.map(solution=><li key={solution}>{solution}</li>)}</ol></section></div><div className="project-furniture-list"><div><b>Мебел / елемент</b><span>Ширина × дълбочина × височина</span></div>{selected.items.map(item=><div key={item.id}><span><b>{item.label}</b><small>{item.material}</small></span><strong>{projectSize(item.size)}</strong></div>)}</div></div>}
   <div className="project-detail-footer"><div><b>Създай подобно решение за своя дом.</b><p>Запитването ще включва този проект, мебелите и примерните размери.</p></div><Button onClick={()=>onQuote(projectBrief(selected))}>Запитване за този проект <ArrowUpRight size={16}/></Button></div>
   {selected.relatedModelIds.some(id=>s.catalog.some(p=>p.id===id))&&<div className="project-related"><span>Отправни модели от каталога</span>{selected.relatedModelIds.map(id=>s.catalog.find(p=>p.id===id)).filter(p=>!!p).map(product=><button key={product.id} onClick={()=>configure(newConfig(product))}>Персонализирай {product.name} <ArrowUpRight size={13}/></button>)}</div>}
  </Modal>}
 </>;
}
