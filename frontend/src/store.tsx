import {uid} from './id';
import {createContext,useContext,useEffect,useState,useRef,ReactNode} from 'react';
import {api,DEMO,readLocal,writeLocal,User,Inquiry} from './api';
import {Config,Product,products,materials} from './data';
import {loadBrowserCatalog} from './features/catalog/browserCatalog';
export type ResourceRecord={id:string;name:string;description?:string;email?:string;phone?:string;value?:number};
export type Resources=Record<string,ResourceRecord[]>;
const defaultResources:Resources={customers:[],materials:materials.map((m,i)=>({id:String(i),name:m.name,description:m.description,value:m.factor})),portfolio:[],pricing:[{id:"delivery",name:"Доставка",value:60,description:"Цена на доставка в евро"},{id:"installation",name:"Монтаж",value:10,description:"Процент от стойността на мебелите"}]};
type Store={resources:Resources;setResources:(v:Resources)=>void;catalog:Product[];setCatalog:(v:Product[])=>void;saved:Config[];favorites:string[];recent:string[];inquiries:Inquiry[];user:User|null;demoRole:'customer'|'employee'|'admin'|null;setDemoRole:(r:'customer'|'employee'|'admin'|null)=>void;setUser:(u:User|null)=>void;save:(c:Config)=>Promise<void>;removeSaved:(id:string)=>Promise<void>;favorite:(id:string)=>void;view:(id:string)=>void;submit:(q:Omit<Inquiry,'id'|'status'|'created_at'>)=>Promise<Inquiry>;updateInquiry:(id:number,patch:Partial<Inquiry>)=>Promise<void>;deleteInquiry:(id:number)=>Promise<void>;refresh:()=>Promise<void>;notice:(text:string)=>void;error:string;loading:boolean};
const C=createContext<Store>(null!);export const useStore=()=>useContext(C);
export function StoreProvider({children}:{children:ReactNode}){const [catalog,setProducts]=useState<Product[]>(()=>DEMO?loadBrowserCatalog():products),[saved,setSaved]=useState<Config[]>(DEMO?readLocal('saved',[]):[]),[favorites,setFavorites]=useState<string[]>([]),[recent,setRecent]=useState<string[]>(readLocal('recent',[])),[inquiries,setInquiries]=useState<Inquiry[]>(DEMO?readLocal('inquiries',[]):[]),[user,setUser]=useState<User|null>(DEMO?readLocal('demo-user',null):null),[demoRole,setDemoRole]=useState<'customer'|'employee'|'admin'|null>(null),[message,setMessage]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
const [favoritesOwner,setFavoritesOwner]=useState<number|null>(null);
const activeUser=useRef<number|null>(null);activeUser.current=user?.id??null;
const favoriteRequests=useRef(new Set<string>());
const favoritesReady=useRef<number|null>(null);
useEffect(()=>{
 const owner=user?.id??null;let cancelled=false;favoritesReady.current=null;setFavorites([]);setFavoritesOwner(owner);
 if(owner===null)return;
 if(DEMO){setFavorites(readLocal<string[]>('favorites-user-'+owner,[]));favoritesReady.current=owner;return;}
 void api<string[]>('/api/favorites').then(ids=>{if(!cancelled&&activeUser.current===owner){setFavorites(ids);favoritesReady.current=owner}}).catch(()=>{if(!cancelled)setError('Любимите модели не могат да се заредят. Презареди страницата, за да опиташ отново.');});
 return()=>{cancelled=true};
},[user?.id]);
const [resources,setResourceState]=useState<Resources>(DEMO?readLocal('admin-resources',defaultResources):defaultResources);const setResources=(v:Resources)=>{if(DEMO)writeLocal('admin-resources',v);setResourceState(v)};
const notice=(m:string)=>{setMessage(m);setTimeout(()=>setMessage(''),4000)};const setCatalog=(v:Product[])=>{if(DEMO)writeLocal('catalog',v);setProducts(v)};
async function refresh(){if(DEMO)return;setLoading(true);setError('');try{const all=await api<Product[]>('/api/products');setProducts(all);const lib=await api<Resources>('/api/library');setResourceState({...defaultResources,...lib});try{const me=await api<User>('/api/auth/me');setUser(me);const cs=await api<Config[]>('/api/configurations');setSaved(cs);const qs=await api<Inquiry[]>('/api/inquiries');setInquiries(qs)}catch(e){setUser(null);setSaved([]);setInquiries([]);if(user)setError((e as Error).message)}}catch(e){setError((e as Error).message)}finally{setLoading(false)}}
useEffect(()=>{void refresh()},[]);
async function save(c:Config){if(!DEMO&&!user)throw new Error('Влез в профила си, за да запазиш конфигурация.');const copy={...c,id:uid()};if(!DEMO)await api('/api/configurations',{method:'POST',body:JSON.stringify(copy)});const next=[...saved,copy];if(DEMO)writeLocal('saved',next);setSaved(next);notice(DEMO?'Идеята е запазена на това устройство.':'Конфигурацията е запазена.')}
async function removeSaved(id:string){if(!DEMO)await api('/api/configurations/'+id,{method:'DELETE'});const next=saved.filter(x=>x.id!==id);if(DEMO)writeLocal('saved',next);setSaved(next)}
async function favorite(id:string){
 const owner=user?.id;
 if(owner===undefined){notice('Влез в профила си, за да запазиш любими модели.');return;}
 if(favoritesReady.current!==owner){notice('Изчакай да се заредят любимите модели.');return;}
 const key=owner+':'+id;if(favoriteRequests.current.has(key))return;
 favoriteRequests.current.add(key);
 const removing=favoritesOwner===owner&&favorites.includes(id);
 try{
  if(!DEMO)await api('/api/favorites/'+encodeURIComponent(id),{method:removing?'DELETE':'PUT'});
  if(activeUser.current!==owner)return;
  setFavoritesOwner(owner);
  setFavorites(current=>{const next=removing?current.filter(x=>x!==id):[...new Set([...current,id])];if(DEMO)writeLocal('favorites-user-'+owner,next);return next});
 }catch(e){if(activeUser.current===owner)notice((e as Error).message)}finally{favoriteRequests.current.delete(key)}
}
function view(id:string){const next=[id,...recent.filter(x=>x!==id)].slice(0,6);setRecent(next);writeLocal('recent',next)}
async function submit(q:Omit<Inquiry,'id'|'status'|'created_at'>){const row:Inquiry=DEMO?{...q,id:Date.now(),status:'Нова заявка',created_at:new Date().toISOString()}:await api('/api/inquiries',{method:'POST',body:JSON.stringify(q)});const next=[row,...inquiries];if(DEMO)writeLocal('inquiries',next);setInquiries(next);return row}
async function updateInquiry(id:number,patch:Partial<Inquiry>){if(!DEMO)await api('/api/inquiries/'+id,{method:'PATCH',body:JSON.stringify(patch)});const next=inquiries.map(q=>q.id===id?{...q,...patch}:q);if(DEMO)writeLocal('inquiries',next);setInquiries(next)}async function deleteInquiry(id:number){if(!DEMO)await api('/api/inquiries/'+id,{method:'DELETE'});const next=inquiries.filter(x=>x.id!==id);if(DEMO)writeLocal('inquiries',next);setInquiries(next)}
return <C.Provider value={{resources,setResources,catalog,setCatalog,saved,favorites:user&&favoritesOwner===user.id?favorites:[],recent,inquiries,user,setUser,demoRole,setDemoRole,save,removeSaved,favorite,view,submit,updateInquiry,deleteInquiry,refresh,notice,error,loading}}>{children}{message&&<div className="toast" role="status">{message}</div>}</C.Provider>}
