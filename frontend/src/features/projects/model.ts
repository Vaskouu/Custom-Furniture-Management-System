export type Dimensions={w:number;d:number;h:number};
export type ProjectItem={id:string;label:string;size:Dimensions;x:number;y:number;rotate?:boolean;color:string;material:string;note:string};
export type ProjectCase={id:string;name:string;type:string;imageCell:number;summary:string;brief:string;solution:string[];features:string[];materials:{name:string;color:string}[];room:{w:number;d:number;window:{wall:'top'|'left'|'right';start:number;length:number}};items:ProjectItem[];relatedModelIds:string[]};
export type ProjectBrief={id:string;projectId:string;name:string;category:string;dimensions:string;materials:string;summary:string};
export const projectSize=(size:Dimensions)=>`${size.w} × ${size.d} × ${size.h} см`;
export const projectArea=(p:ProjectCase)=>Math.round(p.room.w*p.room.d/10000);
export const footprint=(item:ProjectItem)=>({w:item.rotate?item.size.d:item.size.w,d:item.rotate?item.size.w:item.size.d});
export function projectBrief(p:ProjectCase):ProjectBrief{
 return {id:'project-'+p.id,projectId:p.id,name:p.name,category:p.type==='Кухня'?'Цяла кухня':'Цялостно обзавеждане',dimensions:`Помещение ${p.room.w} × ${p.room.d} см (около ${projectArea(p)} м²)`,materials:p.materials.map(m=>m.name).join(', '),summary:`Искам подобно решение: ${p.name}.\n\nЗадача: ${p.brief}\n\nРешение:\n${p.solution.map(s=>'• '+s).join('\n')}\n\nМебели (ширина × дълбочина × височина):\n${p.items.map(item=>'• '+item.label+': '+projectSize(item.size)+'; '+item.material).join('\n')}\n\nРазмерите са примерни и ще се уточнят за моето помещение.`};
}
