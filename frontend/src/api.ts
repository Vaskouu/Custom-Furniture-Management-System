/// <reference types="vite/client" />
export const DEMO=import.meta.env.VITE_DEMO==='true';
export const API_URL=(import.meta.env.VITE_API_URL||(typeof window==='undefined'?'http://localhost:5173':window.location.origin)).replace(/\/$/,'');
export async function api<T>(path:string,init:RequestInit={}):Promise<T>{
  let response:Response;
  try {
    response=await fetch(API_URL+path,{...init,credentials:'include',headers:{...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...init.headers},signal:init.signal||AbortSignal.timeout(15000)});
  } catch {
    throw new Error('Няма връзка със сървъра. Опитай отново след малко.');
  }
  if(!response.ok){
    let message='Заявката не беше изпълнена. Опитай отново.';
    try {
      const body=await response.json();
      if(typeof body.detail==='string')message=body.detail;
      else if(Array.isArray(body.detail)){
        const labels:Record<string,string>={name:'Име',email:'Имейл',phone:'Телефон',password:'Парола'};
        const field=body.detail[0]?.loc?.at(-1);
        message=labels[field]?`Провери полето „${labels[field]}“ и въведи валидна стойност.`:'Провери въведените данни.';
      }
    } catch { /* Keep the readable fallback for non-JSON responses. */ }
    throw new Error(message);
  }
  return response.status===204?undefined as T:response.json();
}
export function readLocal<T>(key:string,fallback:T):T{try{const v=JSON.parse(localStorage.getItem('fp-v2-'+key)||'null');return v??fallback}catch{return fallback}}
export function writeLocal(key:string,value:unknown){try{localStorage.setItem('fp-v2-'+key,JSON.stringify(value))}catch{throw new Error('Няма място за локално запазване.')}}
export type User={id:number;name:string;email:string;phone?:string;city?:string;role:'customer'|'employee'|'admin'};
export type Inquiry={id:number;name:string;email:string;phone:string;city:string;category:string;description:string;budget:number;dimensions:string;material:string;status:string;created_at:string;config?:unknown;notes?:string;attachment?:string;customer_id?:number};
