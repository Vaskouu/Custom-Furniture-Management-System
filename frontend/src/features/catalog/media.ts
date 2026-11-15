import type {Product} from '../../data';

export function atlasTile(value:string){
 const paired=value.match(/^(\/assets\/products\/paired-0[1-9]\.png)#cell=(\d{1,2})$/);
 if(paired){const cell=Number(paired[2]);return cell<16?{source:paired[1],cell,row:Math.floor(cell/4),column:cell%4,rows:4,columns:4}:null;}
 const match=value.match(/^(\/assets\/(?:products\/collection-0[1-4]|kitchens\/collection-0[1-2])\.png)#cell=([0-8])$/);
 if(!match)return null;
 const cell=Number(match[2]),rows=match[1].includes('/kitchens/')?2:3;if(cell>=rows*3)return null;return {source:match[1],cell,row:Math.floor(cell/3),column:cell%3,rows,columns:3};
}
export const studioPhoto=(index:number)=>`/assets/products/collection-${String(Math.floor(index/9)+1).padStart(2,'0')}.png#cell=${index%9}`;


export function refreshDemoPhotos(catalog:Product[],current:Product[],originalImages:Record<string,string>,previousDefaults:Record<string,Partial<Product>>={}):Product[]{
 return catalog.map(p=>{const seed=current.find(x=>x.id===p.id);if(!seed)return p;const stock=originalImages[p.id]===p.image||/^\/assets\/products\/collection-0[1-4]\.png#cell=[0-8]$/.test(p.image);const changes=Object.fromEntries(Object.entries(previousDefaults[p.id]||{}).filter(([key,value])=>p[key as keyof Product]===value).map(([key])=>[key,seed[key as keyof Product]]));return stock?{...p,...changes,image:seed.image,cleanImage:seed.cleanImage,variant:p.variant||seed.variant,decorationTheme:seed.decorationTheme}:p;});
}
export function mergeNewModels(catalog:Product[],current:Product[],knownIds:string[]){return [...catalog,...current.filter(p=>!knownIds.includes(p.id)&&!catalog.some(x=>x.id===p.id))];}
