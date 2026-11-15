import {useState, type FormEvent} from 'react';
import {ArrowUpRight, Bookmark, Heart, Package} from 'lucide-react';
import {api, DEMO, type User} from '../../api';
import {useStore} from '../../store';
import {PageTitle, Button, Field, ErrorMessage} from '../../components';

export default function Register({navigate}:{navigate:(page:string)=>void}) {
  const store=useStore();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [showPassword,setShowPassword]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy)return;
    setError('');
    const form=new FormData(event.currentTarget);
    const password=String(form.get('password'));
    if(password!==form.get('confirmation')) {
      setError('Паролите не съвпадат.');
      return;
    }
    const phone=String(form.get('phone')).trim();
    const digits=phone.replace(/\D/g,'');
    if(digits.length<7||digits.length>15) {
      setError('Въведи валиден телефонен номер с 7 до 15 цифри.');
      return;
    }
    setBusy(true);
    try {
      const user=await api<User>('/api/auth/register', {method:'POST',body:JSON.stringify({
        name:String(form.get('name')).trim(),email:String(form.get('email')).trim(),phone,password,
      })});
      store.setUser(user);
      await store.refresh();
      store.notice('Профилът ти е създаден. Добре дошъл във FurniPro!');
      navigate('profile');
    } catch(error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PageTitle eyebrow="ТВОЕТО НАЧАЛО С FURNIPRO" title="Място за всяка твоя идея." description="Създай клиентски профил и направи първата стъпка към мебелите по твоя мярка."/>
    <div className="auth-layout">
      <div>
        <div className="eyebrow">СЪЗДАДЕНО ОКОЛО ТЕБ</div>
        <h2>Твоят дом.<br/>Твоите идеи.<br/><em>Твоят профил.</em></h2>
        <p>Запазвай любимите си модели, връщай се към конфигурациите си и следи напредъка на запитванията си.</p>
        <div className="account-benefits"><span><Bookmark/> Запазени конфигурации</span><span><Heart/> Любими мебели</span><span><Package/> Твоите запитвания</span></div>
      </div>
      <div className="auth-panel">
        <h2>Регистрация</h2>
        {store.user?<><p>Вече си влязъл като {store.user.name||store.user.email}.</p><Button onClick={()=>navigate('profile')}>Към моя профил <ArrowUpRight size={17}/></Button></>:DEMO?<><p>Регистрацията е достъпна при свързан сървър. В демо режима можеш да разгледаш примерен профил.</p><Button onClick={()=>navigate('profile')}>Към демо профила</Button></>:<>
          <p>Попълни данните си. За следващ вход използвай имейла и паролата си.</p>
          <form onSubmit={submit} aria-busy={busy}>
            <Field label="Име и фамилия"><input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Иван Петров"/></Field>
            <Field label="Имейл"><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="ivan@example.com"/></Field>
            <Field label="Телефон"><input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} pattern={String.raw`\+?[0-9 \(\)\-]+`} placeholder="+359 888 123 456"/></Field>
            <Field label="Парола"><input name="password" type={showPassword?'text':'password'} autoComplete="new-password" required minLength={10} maxLength={128} aria-describedby="password-hint"/></Field>
            <p id="password-hint" className="caption">Използвай поне 10 символа.</p>
            <Field label="Повтори паролата"><input name="confirmation" type={showPassword?'text':'password'} autoComplete="new-password" required minLength={10} maxLength={128}/></Field>
            <label className="check-field"><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/>Покажи паролите</label>
            <p className="caption">Научи как използваме данните ти в <button type="button" className="text-link" onClick={()=>navigate('privacy')}>информацията за личните данни</button>.</p>
            {error&&<div role="alert"><ErrorMessage>{error}</ErrorMessage></div>}
            <Button type="submit" disabled={busy}>{busy?'Създаване на профила…':'Създай профил'} <ArrowUpRight size={17}/></Button>
          </form>
          <button className="text-link" onClick={()=>navigate('profile')}>Вече имаш профил? Влез.</button>
        </>}
      </div>
    </div>
  </>;
}
