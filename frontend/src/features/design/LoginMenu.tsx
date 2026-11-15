import {useEffect,useRef,useState} from 'react';
import {UserRound,UserPlus,UsersRound,ChevronDown,ArrowUpRight} from 'lucide-react';
import {useStore} from '../../store';
export default function LoginMenu({navigate}:{navigate:(page:string)=>void}){
 const {user}=useStore();
 const names=user?.name.trim().split(/\s+/).filter(Boolean)||[];
 const label=user?(names.length>1?`${names[0]} ${Array.from(names[names.length-1])[0]}.`:names[0]||'Моят профил'):'Вход/Регистрация';
 const [open,setOpen]=useState(false),ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const close=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key)}},[]);
 function go(page:string){setOpen(false);navigate(page)}
 return <div className="login-menu" ref={ref}><button className="login-trigger" aria-expanded={open} aria-controls="login-choices" onClick={()=>setOpen(!open)}><UserRound size={17}/><span>{label}</span><ChevronDown size={13}/></button>{open&&<div className="login-choices" id="login-choices"><span>ДОБРЕ ДОШЪЛ В FURNIPRO</span><button onClick={()=>go('profile')}><UserRound size={21}/><span><b>{user?'Моят профил':'Клиент'}</b><small>Моите идеи и запитвания</small></span><ArrowUpRight size={16}/></button>{!user&&<button onClick={()=>go('register')}><UserPlus size={21}/><span><b>Регистрация</b><small>Създай клиентски профил</small></span><ArrowUpRight size={16}/></button>}<button onClick={()=>go('admin')}><UsersRound size={21}/><span><b>Човек от екипа</b><small>Служебен вход и поръчки</small></span><ArrowUpRight size={16}/></button></div>}</div>
}
