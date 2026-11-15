import type {Config,Product} from '../../data';
export type FrontStyle={kind:'wood'|'glass'|'open';color?:string};
export function kidsCells(p:Product){
 const v=p.variant||'kids-cubes';
 if(v.endsWith('bins'))return Array.from({length:6},(_,i)=>{const col=Math.floor(i/2),row=i%2,height=1-col*.22;return {id:i,x:col/3,y:1-height+row*height/2,w:1/3,h:height/2,closed:row===1}});
 const house=v.endsWith('house'),low=v.endsWith('low'),tall=v.endsWith('tall'),cols=low||tall||house?2:3,rows=tall?4:low?2:3;
 return Array.from({length:cols*rows},(_,i)=>{const col=i%cols,row=Math.floor(i/cols);return {id:i,x:col/cols,y:row/rows,w:1/cols,h:1/rows,closed:tall||house?row===rows-1:!low&&(row===0?col!==1:col===1)}});
}
export function cellFront(p:Product,c:Config,index:number):FrontStyle{
 const cells=kidsCells(p),cell=cells[index];
 const doorIndex=cells.slice(0,index+1).filter(x=>x.closed).length-1;
 return c.fronts?.[index]||{kind:cell?.closed&&doorIndex<c.doors?'wood':'open',color:['#b9be9e','#c79b84','#c9b16c'][index%3]};
}
