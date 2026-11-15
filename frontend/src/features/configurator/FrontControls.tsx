import type {Config,Product} from '../../data';
import {Field} from '../../components';
import ColorPicker from './ColorPicker';
import {kidsCells,cellFront,type FrontStyle} from './fronts';

export default function FrontControls({product,config,onChange}:{product:Product;config:Config;onChange:(fronts:NonNullable<Config['fronts']>)=>void}){
 return <><div className="editor-intro"><h3>Всеки модул — по твой избор.</h3><p>Номерата следват редовете отляво надясно. Избери отворен рафт, плътна или стъклена вратичка.</p></div>{kidsCells(product).map(cell=>{
  const front=cellFront(product,config,cell.id);
  const patch=(change:Partial<FrontStyle>)=>onChange({...config.fronts,[cell.id]:{...front,...change}});
  return <details className="front-module" key={cell.id}><summary>Модул {cell.id+1} · {front.kind==='open'?'Отворен':front.kind==='glass'?'Стъкло':'Плътна врата'}</summary><Field label={`Вратичка на модул ${cell.id+1}`}><select value={front.kind} onChange={e=>patch({kind:e.target.value as FrontStyle['kind']})}><option value="wood">Плътна врата</option><option value="glass">Стъклена врата</option><option value="open">Отворен рафт</option></select></Field>{front.kind!=='open'&&<ColorPicker label={front.kind==='glass'?'Цвят на рамката':'Цвят на вратичката'} value={front.color||config.color} onChange={color=>patch({color})}/>}</details>;
 })}</>;
}
