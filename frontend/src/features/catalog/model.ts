import {Config, Product, newConfig,limits} from '../../data';
import {atlasTile} from './media';

/** Named dimensions are used everywhere; UI order is width × depth × height. */
export type SizeOption = {id:string;w:number;d:number;h:number;label?:string};
export const sizeText=(size:Pick<SizeOption,'w'|'d'|'h'>)=>`${size.w} × ${size.d} × ${size.h} см`;
export function sizeOptions(product:Product):SizeOption[]{
  if(product.sizeOptions?.length) return product.sizeOptions;
  const base={id:'standard',w:product.w,d:product.d,h:product.h,label:'Основен размер'};
  let variants:SizeOption[];
  switch(product.kind){
    case 'sofa': variants=[{id:'compact',w:180,d:90,h:85},{id:'family',w:280,d:100,h:90}];break;
    case 'bed': variants=[{id:'double',w:140,d:210,h:100},{id:'queen',w:160,d:210,h:100}];break;
    case 'chair': variants=[{id:'slim',w:45,d:48,h:80},{id:'wide',w:55,d:55,h:85}];break;
    case 'desk': variants=[{id:'compact',w:110,d:60,h:75},{id:'large',w:180,d:75,h:75}];break;
    case 'table': variants=product.h<60?[{id:'small',w:80,d:50,h:40},{id:'large',w:120,d:70,h:45}]:[{id:'small',w:140,d:80,h:76},{id:'large',w:220,d:100,h:76}];break;
    case 'nightstand': variants=[{id:'small',w:35,d:35,h:45},{id:'large',w:60,d:45,h:55}];break;
    default: variants=product.category==='Гардероби'?[{id:'slim',w:110,d:60,h:220},{id:'wide',w:200,d:60,h:220},{id:'wall',w:300,d:60,h:230}]:[{id:'compact',w:Math.max(40,product.w-30),d:product.d,h:product.h},{id:'large',w:Math.min(350,product.w+40),d:product.d,h:product.h}];
  }
  const result=[base,...variants].filter((v,i,arr)=>arr.findIndex(x=>x.w===v.w&&x.d===v.d&&x.h===v.h)===i);const lim=limits(product);for(const factor of [.85,1.15,1.3]){if(result.length>=3)break;const extra={id:`alternative-${factor}`,w:Math.round(Math.max(lim.w[0],Math.min(lim.w[1],product.w*factor))/5)*5,d:product.d,h:product.h};if(!result.some(x=>x.w===extra.w&&x.d===extra.d&&x.h===extra.h))result.push(extra);}return result;
}
export function purpose(p:Product):string {
  if(p.purpose)return p.purpose;
  if(['Легла','Гардероби','Нощни шкафчета','Скринове'].includes(p.category))return 'Спалня';
  if(['Бюра','Офис шкафове'].includes(p.category))return 'Кабинет';
  if(p.category==='Кухненски шкафове')return 'Кухня';
  if(p.category==='Баня мебели')return 'Баня';
  if(['Антре мебели','Шкафове за обувки'].includes(p.category))return 'Антре';
  if(p.category==='Детски мебели')return 'Детска стая';
  return 'Дневна';
}
export const isFrequent=(p:Product)=>p.frequent??['p1-0','p2-0','p4-0','p14-0'].includes(p.id);
export const isBestseller=(p:Product)=>p.bestseller??['p3-0','p8-0','p10-0','p6-0'].includes(p.id);
export function configurationFor(p:Product,size:SizeOption):Config{return {...newConfig(p),w:size.w,d:size.d,h:size.h}}
export function imageSourceValid(src:string):boolean{return !!atlasTile(src)||/^photo-[a-zA-Z0-9-]+$/.test(src)||/^https:\/\//.test(src)||/^data:image\/(jpeg|png|webp);base64,/.test(src)}
