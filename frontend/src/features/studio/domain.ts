import {StudioAction,StudioUser,StudioState,StudioOrder,Material} from './types';
export const can=(user:StudioUser|null,action:StudioAction)=>!!user?.active&&(user.role==='admin'||action==='read'||action==='order.status');
export function reservedFor(materialId:string,orders:StudioOrder[],excludeId?:string):number{return Math.round(100*orders.filter(o=>o.id!==excludeId&&(o.status==='Нова'||o.status==='В процес')).reduce((sum,o)=>sum+o.materials.filter(m=>m.materialId===materialId).reduce((n,m)=>n+m.quantity,0),0))/100}
export const availableFor=(material:Material,orders:StudioOrder[],excludeId?:string)=>Math.round(100*(material.stock-reservedFor(material.id,orders,excludeId)))/100;
export function validateOrder(order:StudioOrder,state:StudioState){
 if(!state.customers.some(c=>c.id===order.customerId))throw new Error('Избери съществуващ клиент.');
 if(!order.title.trim()||!order.furnitureType.trim()||order.description.trim().length<5)throw new Error('Попълни име, вид мебели и описание на поръчката.');
 if(!Number.isInteger(order.quantity)||order.quantity<1||order.quantity>100)throw new Error('Количеството трябва да е цяло число от 1 до 100.');
 if(![order.dimensions.w,order.dimensions.d,order.dimensions.h].every(v=>Number.isFinite(v)&&v>0&&v<=1000))throw new Error('Размерите трябва да са между 1 и 1000 см.');
 if(!Number.isFinite(order.amount)||order.amount<0)throw new Error('Стойността не може да бъде отрицателна.');
 if(order.assignedTo&&!state.users.some(u=>u.id===order.assignedTo&&u.active))throw new Error('Избери активен служител.');
 const ids=new Set<string>();
 for(const line of order.materials){const m=state.materials.find(x=>x.id===line.materialId);if(!m)throw new Error('Избраният материал вече не съществува.');if(ids.has(m.id))throw new Error('Материалът е добавен два пъти.');ids.add(m.id);if(!Number.isFinite(line.quantity)||line.quantity<=0)throw new Error('Въведи положително количество за всеки материал.');if(['Нова','В процес'].includes(order.status)&&line.quantity>availableFor(m,state.orders,order.id))throw new Error(`Недостатъчна наличност за „${m.name}“. Свободни: ${availableFor(m,state.orders,order.id)} ${m.unit}.`)}
}
export const orderNumber=(orders:StudioOrder[])=>'FP-'+(Math.max(1051,...orders.map(o=>Number(o.number.replace('FP-',''))||0))+1);
export const customerOrders=(state:StudioState,id:string)=>state.orders.filter(o=>o.customerId===id);
export function validateCustomer(name:string,email:string,phone:string){if(name.trim().length<2)throw new Error('Името трябва да е поне 2 символа.');if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Въведи валиден имейл.');if(phone&&!/^[+0-9 ()-]{6,25}$/.test(phone))throw new Error('Въведи валиден телефон.');}
