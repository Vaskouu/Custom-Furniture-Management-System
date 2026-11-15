import {useState} from 'react';
import {ArrowUpRight,Check,Heart,Ruler} from 'lucide-react';
import {Config,Product,imageUrl} from '../../data';
import {useStore} from '../../store';
import {Button,Modal} from '../../components';
import {FurniturePreview} from '../../Preview';
import ProductImage from './ProductImage';
import DecorationToggle,{useDecorations} from './Decorations';
import {configurationFor,purpose,sizeOptions,sizeText} from './model';

type Props={product:Product;onClose:()=>void;onConfigure:(c:Config)=>void;onQuote:(c:Config)=>void;onRelated?:(p:Product)=>void};
export default function ProductDetails({product:p,onClose,onConfigure,onQuote,onRelated}:Props){
 const {decorations}=useDecorations();
 const s=useStore(),sizes=sizeOptions(p),[selected,setSelected]=useState(sizes[0].id),[view,setView]=useState<'photo'|'diagram'>('photo');
 const size=sizes.find(x=>x.id===selected)||sizes[0],config={...configurationFor(p,size),decorations};
 return <Modal title={p.name} onClose={onClose}><div className="product-detail-grid">
  <div className="detail-visual"><div className="detail-image-stage">{view==='photo'?<ProductImage product={p}/>:<FurniturePreview config={config} product={p}/>}</div><div className="detail-view-switch" aria-label="Изглед на модела"><button type="button" className={view==='photo'?'active':''} onClick={()=>setView('photo')}>Продуктов изглед</button><button type="button" className={view==='diagram'?'active':''} onClick={()=>setView('diagram')}><Ruler size={14}/> Размерна схема</button></div><DecorationToggle/><p className="caption">Студийна визуализация на модела. Размерната схема се обновява според избрания размер; декорите се потвърждават с мостра.</p></div>
  <div><span className="eyebrow">{p.category.toUpperCase()} / {purpose(p).toUpperCase()}</span><p>{p.description}</p><dl className="detail-specs"><div><dt>Материал</dt><dd>{p.material}</dd></div><div><dt>Стил</dt><dd>{p.style}</dd></div><div><dt>Изработка</dt><dd>По индивидуална поръчка</dd></div></dl>
   <div className="size-selector" role="radiogroup" aria-label="Избери размер" onKeyDown={e=>{if(["ArrowDown","ArrowRight","ArrowUp","ArrowLeft"].includes(e.key)){e.preventDefault();const i=sizes.findIndex(x=>x.id===selected),next=(i+(["ArrowDown","ArrowRight"].includes(e.key)?1:sizes.length-1))%sizes.length;setSelected(sizes[next].id);setView("diagram");e.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next]?.focus()}}}><div className="size-selector-heading"><b>Избери размер</b><span>Ширина × дълбочина × височина</span></div>{sizes.map(x=><button type="button" role="radio" tabIndex={selected===x.id?0:-1} aria-checked={selected===x.id} className={selected===x.id?'selected':''} key={x.id} onClick={()=>{setSelected(x.id);setView('diagram')}}><span className="radio-marker">{selected===x.id&&<Check size={12}/>}</span><span><b>{sizeText(x)}</b><small>{x.label||'Примерен вариант'}</small></span><span className="size-option-label">Ш × Д × В</span></button>)}</div>
   <div className="selected-dimensions"><span><small>Ширина</small><b>{size.w} см</b></span><span><small>Дълбочина</small><b>{size.d} см</b></span><span><small>Височина</small><b>{size.h} см</b></span></div>
   <div className="on-request"><strong>Цена след запитване</strong><small>Според размерите, материалите и детайлите.</small></div><Button onClick={()=>onQuote(config)}>Изпрати запитване <ArrowUpRight size={16}/></Button><div className="detail-secondary-actions"><button className="text-link" onClick={()=>onConfigure(config)}>Други размери и декори ↗</button><button className="icon-button" aria-label="Добави или премахни от любими" aria-pressed={s.favorites.includes(p.id)} onClick={()=>s.favorite(p.id)}><Heart size={18} fill={s.favorites.includes(p.id)?'currentColor':'none'}/></button></div>
  </div></div>{onRelated&&s.catalog.some(x=>x.category===p.category&&x.id!==p.id)&&<div className="detail-related"><span>Още от тази колекция</span>{s.catalog.filter(x=>x.category===p.category&&x.id!==p.id).slice(0,3).map(x=><button key={x.id} onClick={()=>{s.view(x.id);onRelated(x)}}>{x.name} <ArrowUpRight size={14}/></button>)}</div>}</Modal>
}
