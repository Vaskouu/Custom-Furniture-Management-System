import {api,DEMO,readLocal,writeLocal} from '../../api';
import {StudioState} from './types';
import {demoStudioState} from './demoData';
/** This adapter is intentionally independent of the existing FastAPI backend.
 * Integrators can inject an implementation after mapping their existing DTOs.
 * No assumed endpoints, database writes or browser-stored real credentials. */
export interface StudioRepository { readonly mode:'demo'|'api'; load():Promise<StudioState>; save(state:StudioState):Promise<void>; }
export const demoRepository:StudioRepository={
 mode:'demo',
 async load(){const state=readLocal<StudioState|null>('studio-management-v1',null);if(state?.version===1&&Array.isArray(state.customers)&&Array.isArray(state.orders)&&Array.isArray(state.materials)&&Array.isArray(state.users))return state;const seed=demoStudioState();writeLocal('studio-management-v1',seed);return seed},
 async save(state){writeLocal('studio-management-v1',state)}
};

let loaded:StudioState={version:1,customers:[],orders:[],materials:[],users:[]};
export const apiRepository:StudioRepository={
 mode:'api',
 async load(){loaded=await api<StudioState>('/api/studio/state');return loaded},
 async save(next){
  for(const kind of ['customers','materials','orders','users'] as const){
   const before=loaded[kind],after=next[kind];
   const ids=new Set([...before.map(x=>x.id),...after.map(x=>x.id)]);
   for(const id of ids){
    const previous=before.find(x=>x.id===id)||null,record=after.find(x=>x.id===id)||null;
    if(JSON.stringify(previous)!==JSON.stringify(record)){
     loaded=await api<StudioState>('/api/studio/'+kind+'/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({previous,record})});
    }
   }
  }
 }
};
export const defaultRepository=DEMO?demoRepository:apiRepository;
