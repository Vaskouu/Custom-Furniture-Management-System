import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {readLocal,writeLocal} from '../../api';
const Context=createContext({decorations:true,setDecorations:(_value:boolean)=>{}});
export function DecorationProvider({children}:{children:ReactNode}){const [decorations,setDecorations]=useState(()=>readLocal<boolean>('catalog-decorations',true));useEffect(()=>writeLocal('catalog-decorations',decorations),[decorations]);return <Context.Provider value={{decorations,setDecorations}}>{children}</Context.Provider>;}
export const useDecorations=()=>useContext(Context);
export default function DecorationToggle({value,onChange}:{value?:boolean;onChange?:(value:boolean)=>void}){const shared=useDecorations(),active=value??shared.decorations,change=onChange||shared.setDecorations;return <div className="decoration-toggle" role="group" aria-label="Декорации в изгледа"><button type="button" aria-pressed={active} onClick={()=>change(true)}><span aria-hidden="true">✧</span> С декорации</button><button type="button" aria-pressed={!active} onClick={()=>change(false)}><span aria-hidden="true">□</span> Без декорации</button></div>;}
