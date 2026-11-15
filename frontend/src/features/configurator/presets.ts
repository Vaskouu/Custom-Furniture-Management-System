import {kidsCells,cellFront} from './fronts';
import type {Config,Product} from '../../data';
export function furnitureDefaults(p:Product):Partial<Config>{
 const v=p.variant||'';
 const counts:Record<string,[number,number,number]>={
 'wardrobe-flat':[2,4,2],'wardrobe-frame':[3,5,0],'wardrobe-slide':[3,5,0],
 'nightstand-two':[0,0,2],'nightstand-open':[0,1,1],'nightstand-round':[0,1,1],'nightstand-float':[0,1,1],
 'dresser-six':[0,0,6],'dresser-wide':[0,0,3],
 'shelf-open':[0,5,0],'shelf-grid':[0,4,0],'shelf-ladder':[0,4,0],'shelf-base':[2,4,0],
 'tv-open':[2,1,0],'tv-float':[0,0,3],'tv-slats':[2,1,0],'tv-asymmetric':[1,2,0],
 'shoes-tilt':[0,1,3],'shoes-bench':[2,1,0],
 'hall-panel':[1,2,1],'hall-arch':[1,2,0],'hall-locker':[1,3,0],
 'kitchen-sink':[2,1,0],'kitchen-drawers':[0,0,3],'kitchen-pantry':[2,5,0],'kitchen-island':[0,2,3],
 'bath-float':[0,0,2],'bath-legs':[0,0,2],'bath-tower':[1,3,0],
 'kids-cubes':[4,2,0],'kids-house':[2,2,0],'kids-low':[0,1,0],'kids-bins':[0,2,0],'kids-tall':[2,4,0],
 'office-glass':[4,4,0],'office-frame':[4,4,0],'office-low':[4,1,0],'office-files':[0,0,4],'office-grid':[4,2,0],'office-credenza':[2,1,3],'office-tower':[1,3,0],'office-cart':[0,0,3],
 'wall-classic':[3,3,0],'wall-frame':[4,3,0],'wall-asymmetric':[3,3,0],'wall-bridge':[7,3,0]};
 const [doors,shelves,drawers]=counts[v]||(['sofa','bed','chair','table'].includes(p.kind)?[0,0,v==='table-storage'?1:0]:p.kind==='desk'?[0,0,v==='desk-trestle'?0:3]:[2,3,2]);
 return {doors,shelves,drawers,decorations:false,mirrorDoors:v==='wardrobe-slide'?[1]:[],mirrorTint:'Сребърно',mirrorStyle:'С рамка',opening:v==='wardrobe-slide'?'Плъзгащи':'На панти',frontStyle:/frame|arch/.test(v)?'Рамкова':/slats|slide/.test(v)?'Ламели':'Гладка',tableShape:/round|pedestal/.test(v)?'Кръгла':/pebble|metal|nesting/.test(v)?'Овална':'Правоъгълна',legs:/trestle|cross|metal|swivel/.test(v)?'Метални крака':'Стандартна основа'};
}
export function mirrorDoorCount(p:Product,c:Config){if(['sofa','bed','chair','table','desk'].includes(p.kind))return 0;if(p.kind==='kids')return kidsCells(p).filter(cell=>cellFront(p,c,cell.id).kind!=='open').length;const capacity=p.variant&&!p.variant.startsWith('wardrobe')?(furnitureDefaults(p).doors??8)+(p.variant.startsWith('wall-')?(c.lowerDoors||3)-3:0):8;return Math.max(0,Math.min(capacity,Math.floor(c.doors||0)));}
export function selectedMirrorDoors(p:Product,c:Config){const count=mirrorDoorCount(p,c);return [...new Set(c.mirrorDoors||[])].filter(n=>Number.isInteger(n)&&n>=0&&n<count).sort((a,b)=>a-b);}
export function mirrorSummary(p:Product,c:Config){const doors=selectedMirrorDoors(p,c);return doors.length?`Външно огледало: врати ${doors.map(n=>n+1).join(', ')} · ${c.mirrorTint||'Сребърно'} · ${c.mirrorStyle||'С рамка'}`:'Без външно огледало';}
