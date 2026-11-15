import {kidsCells,cellFront} from './fronts';
import {colorHex} from './model';
import BedModel from './BedModel';
import type {ComponentType,ReactNode} from 'react';
import type {Config,Product} from '../../data';
import {shade} from './model';
import {ShelfDecor} from './Decor';
type Shape={x:number;y:number;w:number;h:number};
type Parts={p:Product;c:Config;X:number;Y:number;W:number;H:number;dx:number;id:string;color:string;fill:string;edge:string;Box:ComponentType<Shape&{children?:ReactNode;paint?:string;d?:number}>;Panel:ComponentType<Shape&{index?:number;drawer?:boolean;paint?:string;glass?:boolean;handle?:boolean}>;OpenShelves:ComponentType<Shape&{count?:number;decor?:boolean}>;Top:ComponentType<{x:number;y:number;w:number;d?:number;paint?:string}>;Feet:ComponentType<{x:number;y:number;w:number;height?:number}>};
export default function variantFurniture({p,c,X,Y,W,H,dx,id,color,fill,edge,Box,Panel,OpenShelves,Top,Feet}:Parts):ReactNode{
 const v=p.variant||'',decor=c.decorations!==false,fabric=`url(#${id}-fabric)`,metal=c.legs==='Метални крака'?'#34414a':shade(color,-28);
 const theme=p.kind==='kids'?'kids':p.kind==='office'?'office':p.kind==='wall'||p.kind==='tv'?'wall':p.kind==='desk'?'desk':p.kind==='shelf'?'shelf':'other',seed=Array.from(p.id).reduce((n,s)=>n+s.charCodeAt(0),0);
 const accessory=(x:number,y:number,w:number,h:number,key=0)=>decor?<ShelfDecor x={x} y={y} w={w} h={h} theme={theme} seed={seed+key}/>:null;
 let doorIndex=0;
 const door=(x:number,y:number,w:number,h:number,glass=false,paint?:string)=>{const index=doorIndex++;return index<c.doors?<Panel x={x} y={y} w={w} h={h} index={index} glass={glass} paint={paint}/>:<OpenShelves x={x+3} y={y+3} w={Math.max(4,w-6)} h={Math.max(4,h-6)} count={1}/>;};
 const drawers=(x:number,y:number,w:number,h:number,count=c.drawers)=>count>0?Array.from({length:count},(_,i)=><Panel key={i} x={x} y={y+i*h/count} w={w} h={h/count} drawer/>):<OpenShelves x={x+3} y={y+3} w={w-6} h={h-6} count={1}/>;
 const tv=(x:number,y:number,w:number,h:number)=>decor?<g data-decoration="television"><rect x={x} y={y} width={w} height={h} rx="2" fill="#233940" stroke="#283a3c" strokeWidth="3"/><path d={`M${x+w*.06} ${y+h*.12}l${w*.8} ${h*.6}`} stroke="#537579" strokeWidth={Math.max(3,h*.1)} opacity=".3"/><path d={`M${x+w*.5} ${y+h}v8m-15 0h30`} stroke="#283a3c" strokeWidth="3"/></g>:null;
 const plinth=(x:number,y:number,w:number)=><rect x={x+5} y={y} width={w-10} height="7" fill={shade(color,-44)}/>;
 if(!v||v.startsWith('wardrobe'))return null;
 if(v.startsWith('nightstand')){
  const floating=v.endsWith('float'),round=v.endsWith('round'),open=!v.endsWith('two'),fy=Y-(floating?0:14);
  const content=open?floating||round?<>{drawers(X,fy,W,H*.5,Math.max(1,c.drawers))}<OpenShelves x={X+4} y={fy+H*.52} w={W-8} h={H*.45} count={0}/></>:<><OpenShelves x={X+4} y={fy+4} w={W-8} h={H*.42} count={0}/>{drawers(X,fy+H*.46,W,H*.54,Math.max(1,c.drawers))}</>:drawers(X,fy,W,H);
  return <><Box x={X} y={fy} w={W} h={H}>{content}{round&&<path d={`M${X+8} ${fy+5}v${H-10}m${W-16} 0v-${H-10}`} stroke={shade(color,30)} opacity=".35" strokeWidth="4"/>}</Box>{floating?null:<Feet x={X} y={fy+H} w={W} height={14}/>} {accessory(X+15,fy-64,W-25,44)}</>;
 }
 if(v.startsWith('dresser')){
  const cols=v.endsWith('six')?2:1,rows=Math.max(1,Math.ceil(c.drawers/cols));
  return <><Box x={X} y={Y} w={W} h={H}>{Array.from({length:cols},(_,i)=><g key={i}>{drawers(X+i*W/cols,Y,W/cols,H,rows)}</g>)}</Box>{plinth(X,Y+H,W)}{accessory(X+15,Y-65,W-25,45)}</>;
 }
 if(v.startsWith('shelf')){
  if(v.endsWith('ladder'))return <><path d={`M${X+W*.13} ${Y}l-${W*.1} ${H}m${W*.77} -${H}l${W*.1} ${H}`} stroke={shade(color,-28)} strokeWidth="7"/>{Array.from({length:Math.max(2,c.shelves)},(_,i)=>{const n=Math.max(2,c.shelves),sw=W*(.62+.35*i/(n-1)),sx=X+(W-sw)/2,sy=Y+30+i*(H-35)/(n-1);return <g key={i}><Box x={sx} y={sy} w={sw} h={5} d={dx*.8}/>{accessory(sx+6,sy-H/n+5,sw-12,H/n-8,i)}</g>;})}</>;
  const grid=v.endsWith('grid'),base=v.endsWith('base'),bottom=base?H*.25:0;
  return <><Box x={X} y={Y} w={W} h={H}>{grid?[0,.38,.68].map((left,i)=><g key={i}><OpenShelves x={X+left*W+3} y={Y+3} w={W*[.38,.3,.32][i]-6} h={H-6} count={i===1?2:3}/>{i>0&&<rect x={X+left*W} y={Y} width="4" height={H} fill={fill}/>}</g>):<OpenShelves x={X+4} y={Y+4} w={W-8} h={H-bottom-8} count={Math.max(1,c.shelves)}/>} {base&&<>{door(X,Y+H-bottom,W/2,bottom)}{door(X+W/2,Y+H-bottom,W/2,bottom)}</>}</Box>{plinth(X,Y+H,W)}</>;
 }
 if(v.startsWith('office')){
  const low=v.endsWith('low'),files=v.endsWith('files'),cart=v.endsWith('cart'),grid=v.endsWith('grid'),credenza=v.endsWith('credenza'),tower=v.endsWith('tower');
  if(files||cart)return <><Box x={X} y={Y-8} w={W} h={H}>{drawers(X,Y-8,W,H,Math.max(1,c.drawers))}{files&&Array.from({length:Math.max(1,c.drawers)},(_,i)=><rect key={i} x={X+W*.15} y={Y-8+(i+.2)*H/Math.max(1,c.drawers)} width={W*.18} height={Math.min(7,H/Math.max(1,c.drawers)*.15)} fill="#ded5bf" stroke="#827b67"/>)}</Box>{cart?[.12,.86].map(t=><circle key={t} cx={X+W*t} cy={Y+H+1} r="6" fill="#44514c"/>):plinth(X,Y+H-8,W)}{accessory(X+6,Y-70,W-12,45)}</>;
  return <><Box x={X} y={Y} w={W} h={H}>{low?Array.from({length:4},(_,i)=><g key={i}>{door(X+i*W/4,Y,W/4,H)}</g>):credenza?<>{door(X,Y,W*.3,H)}{drawers(X+W*.3,Y,W*.4,H,Math.max(1,c.drawers))}{door(X+W*.7,Y,W*.3,H)}</>:tower?<><OpenShelves x={X+4} y={Y+4} w={W-8} h={H*.6-8} count={Math.max(1,c.shelves)}/>{door(X,Y+H*.6,W,H*.4)}</>:grid?Array.from({length:9},(_,i)=>{const col=i%3,row=Math.floor(i/3),x=X+col*W/3,y=Y+row*H/3;return <g key={i}>{i%2?door(x,y,W/3,H/3):<OpenShelves x={x+3} y={y+3} w={W/3-6} h={H/3-6} count={0}/>}</g>}):<><OpenShelves x={X+4} y={Y+4} w={W-8} h={H*.64-8} count={Math.max(1,c.shelves-1)}/>{door(X,Y,W/2,H*.64,true)}{door(X+W/2,Y,W/2,H*.64,true)}{door(X,Y+H*.64,W/2,H*.36)}{door(X+W/2,Y+H*.64,W/2,H*.36)}</>}</Box>{plinth(X,Y+H,W)}{(low||credenza)&&accessory(X+8,Y-60,W-16,42)}</>;
 }
 if(v.startsWith('kids')){
  const house=v.endsWith('house'),bins=v.endsWith('bins'),bodyH=house?H*.78:H,by=house?Y+H*.22:Y;
  const cells=kidsCells(p);
  const content=cells.map(cell=>{
   const x=X+cell.x*W,y=by+cell.y*bodyH,w=cell.w*W,h=cell.h*bodyH,front=cellFront(p,c,cell.id);
   return <g key={cell.id} data-front-cell={cell.id} data-front-kind={front.kind}>
    <OpenShelves x={x+4} y={y+4} w={w-8} h={h-8} count={0}/>
    {front.kind!=='open'&&<Panel x={x} y={y} w={w} h={h} index={kidsCells(p).slice(0,cell.id).filter(other=>cellFront(p,c,other.id).kind!=='open').length} paint={colorHex(front.color||c.color)} glass={front.kind==='glass'}/>}
   </g>;
  });
  return <>{house&&<path d={`M${X-4} ${by}L${X+W/2} ${Y}l${W/2+4} ${H*.22}`} stroke={edge} strokeWidth="7" fill="none"/>}{bins?<>{[0,1,2].map(col=><Box key={col} x={X+col*W/3} y={Y+H*col*.22} w={W/3} h={H*(1-col*.22)}/>)}{content}</>:<Box x={X} y={by} w={W} h={bodyH}>{content}</Box>}<Feet x={X} y={by+bodyH} w={W} height={12}/></>;
 }
 if(v.startsWith('tv')){
  const floating=v.endsWith('float'),asym=v.endsWith('asymmetric'),fy=Y-10;
  return <><Box x={X} y={fy} w={W} h={H}>{floating?drawers(X,fy,W,H,Math.max(1,c.drawers)):asym?<>{door(X,fy,W*.42,H)}<OpenShelves x={X+W*.42+3} y={fy+3} w={W*.58-6} h={H-6} count={1}/></>:<>{door(X,fy,W*.3,H)}<OpenShelves x={X+W*.3+4} y={fy+4} w={W*.4-8} h={H-8} count={1}/>{door(X+W*.7,fy,W*.3,H)}</>}</Box>{floating?null:<Feet x={X} y={fy+H} w={W} height={13}/>} {tv(X+W*.22,fy-95,W*.56,75)}{accessory(X+4,fy-60,W*.19,40,2)}</>;
 }
 if(v.startsWith('wall')){
  const bridge=v.endsWith('bridge'),asym=v.endsWith('asymmetric'),frame=v.endsWith('frame'),baseY=Y+H*.76;
  const column=(x:number,width:number,glazed=false)=><Box x={x} y={Y} w={width} h={H*.7} d={dx*.72}><OpenShelves x={x+4} y={Y+4} w={width-8} h={H*.7-8} count={Math.max(1,c.shelves)}/>{glazed&&door(x,Y,width,H*.7,true)}</Box>;
  return <><Box x={X} y={baseY} w={W} h={H*.24}>{Array.from({length:c.lowerDoors||3},(_,i)=><g key={i} data-wall-base-door={i}>{door(X+i*W/(c.lowerDoors||3),baseY,W/(c.lowerDoors||3),H*.24)}</g>)}</Box>{bridge?<>{column(X,W*.18,true)}{column(X+W*.82,W*.18,true)}<Box x={X+W*.19} y={Y} w={W*.62} h={H*.16} d={dx*.6}>{door(X+W*.19,Y,W*.31,H*.16)}{door(X+W*.5,Y,W*.31,H*.16)}</Box></>:asym?<><Box x={X+W*.75} y={Y} w={W*.25} h={H*.51} d={dx*.6}><OpenShelves x={X+W*.75+3} y={Y+3} w={W*.25-6} h={H*.51-6} count={2}/></Box><Box x={X} y={Y+H*.08} w={W*.23} h={H*.35} d={dx*.6}><OpenShelves x={X+3} y={Y+H*.08+3} w={W*.23-6} h={H*.35-6} count={1}/></Box><Box x={X+W*.27} y={Y} w={W*.35} h={5} d={dx*.55}/></>:<>{column(X,W*.2,frame)}<Box x={X+W*.27} y={Y} w={W*.67} h={5} d={dx*.6}/>{accessory(X+W*.3,Y-50,W*.6,34,3)}</>} {tv(X+W*(bridge?.25:asym?.28:.3),Y+H*.31,W*(bridge?.48:asym?.4:.56),H*.34)}{accessory(X+W*.78,baseY-45,W*.19,35,5)}</>;
 }
 if(v.startsWith('hall')){
  const arch=v.endsWith('arch'),locker=v.endsWith('locker'),cabW=W*(locker?.43:.3),mx=X+W*.04,mw=W*(locker?.26:.38),my=Y+H*.06,mh=H*.56;
  return <><Box x={X} y={Y} w={W} h={H} d={15}><rect x={mx} y={my} width={mw} height={mh} rx={arch?mw/2:2} fill={`url(#${id}-mirror)`} stroke={edge} strokeWidth="4"/><defs><clipPath id={`${id}-hall-glass`}><rect x={mx+2} y={my+2} width={mw-4} height={mh-4} rx={arch?mw/2:0}/></clipPath></defs><path clipPath={`url(#${id}-hall-glass)`} d={`M${mx+mw*.2} ${my+mh*.82}l${mw*.55} -${mh*.68}`} stroke="white" strokeWidth="4" opacity=".4"/>{[0,1,2].map(i=><path key={i} d={`M${X+W*.48+i*W*.055} ${Y+H*.24}v12q5 6 8 0`} fill="none" stroke="#4c5c56" strokeWidth="3"/>)}<Box x={X+W-cabW} y={Y} w={cabW} h={H} d={dx}>{door(X+W-cabW,Y,cabW,H)}</Box><Box x={X} y={Y+H*.78} w={Math.max(20,W-cabW-dx-10)} h={H*.22} d={dx}><OpenShelves x={X+4} y={Y+H*.78+4} w={Math.max(12,W-cabW-dx-18)} h={H*.22-8} count={0}/></Box><rect x={X+5} y={Y+H*.76} width={Math.max(14,W-cabW-dx-20)} height={H*.045} rx="4" fill="#b9ad96"/>{accessory(X+W*.43,Y+H*.39,W*.2,H*.19)}</Box></>;
 }
 if(v.startsWith('kitchen')){
  const pantry=v.endsWith('pantry'),island=v.endsWith('island'),sink=v.endsWith('sink');
  return <><Box x={X} y={Y} w={W} h={H}>{pantry?<>{door(X,Y,W,H*.4)}{door(X,Y+H*.4,W,H*.6)}</>:v.endsWith('drawers')?drawers(X,Y,W,H,Math.max(1,c.drawers)):island?<>{drawers(X,Y,W*.65,H,Math.max(1,c.drawers))}<OpenShelves x={X+W*.65+4} y={Y+4} w={W*.35-8} h={H-8} count={2}/></>:<>{door(X,Y,W/2,H)}{door(X+W/2,Y,W/2,H)}</>}</Box>{!pantry&&<Top x={X-5} y={Y-7} w={W+10} d={dx+5} paint="#e5dfd0"/>}{sink&&<><ellipse cx={X+W*.5+dx*.45} cy={Y-dx*.22-8} rx={W*.24} ry="11" fill="#a1b0ad" stroke="#dce0d7" strokeWidth="3"/><path d={`M${X+W*.65} ${Y-18}v-22q0-12-10-12h-9v11`} stroke={`url(#${id}-metal)`} strokeWidth="4" fill="none"/></>}{plinth(X,Y+H,W)}{!pantry&&!sink&&accessory(X+10,Y-70,W-20,45)}</>;
 }
 if(v.startsWith('bath')){
  if(v.endsWith('tower'))return <><Box x={X} y={Y} w={W} h={H}><OpenShelves x={X+4} y={Y+4} w={W-8} h={H*.62-8} count={3}/>{door(X,Y+H*.62,W,H*.38)}</Box>{plinth(X,Y+H,W)}</>;
  const legs=v.endsWith('legs'),by=Y+H*.38,bh=H*.58;
  return <><rect x={X+W*.15} y={Y-70} width={W*.73} height={H*.4+52} rx={legs?40:3} fill={`url(#${id}-mirror)`} stroke={edge} strokeWidth="5"/><Box x={X} y={by} w={W} h={bh}>{drawers(X,by,W,bh,Math.max(1,c.drawers))}</Box>{legs&&<Feet x={X} y={by+bh} w={W} height={15}/>}<Top x={X-3} y={by-6} w={W+6} paint="#f5f1e7"/><ellipse cx={X+W*.5+dx*.4} cy={by-dx*.2-8} rx={W*.27} ry="15" fill="#f7f5eb" stroke="#c3cfca" strokeWidth="2"/><ellipse cx={X+W*.5+dx*.4} cy={by-dx*.2-8} rx={W*.2} ry="9" fill="#d9e1dc"/><path d={`M${X+W*.65} ${by-23}v-20q0-9-10-9h-7v10`} stroke={`url(#${id}-metal)`} strokeWidth="4" fill="none"/>{accessory(X+6,by-62,W*.22,35)}</>;
 }
 if(v.startsWith('desk')){
  const y=Y+H*.16,bottom=Y+H,sh=bottom-y;
  return <>{v.endsWith('secretary')&&<Box x={X} y={Y} w={W} h={H*.24} d={dx*.45}><OpenShelves x={X+4} y={Y+3} w={W*.45} h={H*.24-6} count={0}/><rect x={X+W*.5} y={Y} width="4" height={H*.24} fill={fill}/>{accessory(X+W*.5,Y+3,W*.45,H*.22)}</Box>}<Box x={X-5} y={y} w={W+10} h={7} d={dx+12}/>{v.endsWith('trestle')?[.14,.83].map(t=><path key={t} d={`M${X+W*t} ${y+10}l-${W*.08} ${sh-8}m${W*.08} -${sh-8}l${W*.08} ${sh-8}m-${W*.14} -${sh*.3}h${W*.12}`} stroke={metal} strokeWidth="7" fill="none"/>):<><path d={`M${X+8} ${y+9}v${sh-8}h${W*.15}`} stroke={metal} strokeWidth="7" fill="none"/><Box x={X+W*.68} y={y+13} w={W*.28} h={sh*.85} d={Math.min(dx*.45,W*.04)}>{drawers(X+W*.68,y+13,W*.28,sh*.85,c.drawers)}</Box></>}{v.endsWith('return')&&<><Box x={X+W*.6} y={y+35} w={W*.38} h={7} d={dx+40}/><path d={`M${X+W*.94+dx+30} ${y+11}v${sh-15}`} stroke={metal} strokeWidth="6"/></>}{accessory(X+W*.13,y-70,W*.6,45)}</>;
 }
 if(v.startsWith('table')||v.startsWith('dining')){
  const cy=Y+30,bottom=Y+H,round=c.tableShape==='Кръгла',oval=c.tableShape==='Овална',depth=30+Math.min(55,c.d*.35),pedestal=v==='table-round'||v==='dining-pedestal',nesting=v==='table-nesting',legColor=v==='table-pebble'?'#c7b99e':metal;
  return <>{v==='table-storage'?<><Box x={X+W*.05} y={cy+10} w={W*.9} h={Math.max(35,H-40)}>{drawers(X+W*.05,cy+10,W*.54,Math.max(35,H-40),1)}<OpenShelves x={X+W*.59+3} y={cy+14} w={W*.36-6} h={Math.max(25,H-48)} count={0}/></Box><Feet x={X} y={bottom} w={W} height={8}/></>:pedestal?<><path d={`M${X+W*.4} ${cy+9}h${W*.2}l${W*.09} ${H-39}h-${W*.38}z`} fill={shade(color,-15)} stroke={edge} strokeWidth="2"/>{Array.from({length:9},(_,i)=><path key={i} d={`M${X+W*.41+i*W*.018} ${cy+13}l${(i-4)*2} ${H-46}`} stroke={shade(color,-37)} strokeWidth="1.5"/>)}</>:v==='dining-cross'?<><path d={`M${X+W*.15} ${cy+9}L${X+W*.75} ${bottom}M${X+W*.85} ${cy+9}L${X+W*.25} ${bottom}`} stroke={metal} strokeWidth="10"/><path d={`M${X+W*.25} ${bottom}h${W*.5}`} stroke={metal} strokeWidth="5"/></>:<>{[.15,.85].map(t=><path key={t} d={v==='table-metal'?`M${X+W*t} ${cy+7}v${H-39}h${W*.12}v-${H-39}`:`M${X+W*t} ${cy+8}l${t<.5?-8:8} ${H-38}`} fill="none" stroke={legColor} strokeWidth={v==='table-metal'?5:12}/>)}</>}{v==='table-pebble'?<path d={`M${X} ${cy}q${W*.12} -${depth*1.7} ${W*.55} -${depth}t${W*.42} ${depth*.75}q-${W*.05} ${depth} -${W*.55} ${depth*.9}T${X} ${cy}z`} fill={fill} stroke={edge} strokeWidth="3"/>:round||oval?<><ellipse cx={X+W/2} cy={cy+5} rx={W/2} ry={round?depth:depth*.67} fill={shade(color,-28)}/><ellipse cx={X+W/2} cy={cy} rx={W/2} ry={round?depth:depth*.67} fill={fill} stroke={edge} strokeWidth="1.4"/><ellipse cx={X+W/2} cy={cy-1} rx={Math.max(2,W/2-4)} ry={Math.max(2,(round?depth:depth*.67)-3)} fill="none" stroke="#ffffff" opacity=".22"/></>:<Box x={X-5} y={cy} w={W+10} h={8} d={depth}/>} {nesting&&<><path d={`M${X+W*.7} ${cy+43}v${H-40}m${W*.25} -${H-40}v${H-40}`} stroke={metal} strokeWidth="5"/><ellipse cx={X+W*.83} cy={cy+42} rx={W*.25} ry="21" fill={fill} stroke={edge} strokeWidth="2"/></>}{accessory(X+W*.3,cy-58,W*.43,37)}</>;
 }
 if(v.startsWith('sofa')){
  const curve=v.endsWith('curve'),chaise=v.endsWith('chaise'),sy=Y+12,seats=c.sofaSeats|| (chaise?3:2),seatH=H*.7;
  return <><Feet x={X} y={Y+H-5} w={W} height={12}/><rect x={X+8} y={sy} width={W-16} height={seatH} rx={curve?seatH*.48:20} fill={fabric} stroke={shade(color,-28)} strokeWidth="2"/>{Array.from({length:seats},(_,i)=><g key={i}><rect x={X+22+i*(W-44)/seats} y={sy+8+(curve?Math.abs(i-.5)*5:0)} width={(W-44)/seats-3} height={seatH*.55} rx={curve?25:12} fill={fabric} stroke={shade(color,-24)} strokeWidth="1.2"/><rect x={X+21+i*(W-42)/seats} y={sy+seatH*.65} width={(W-42)/seats-3} height={H*.26} rx="12" fill={fabric} stroke={shade(color,-30)} strokeWidth="1.4"/></g>)}<rect x={X} y={sy+H*.23} width={Math.min(W*.1,curve?35:25)} height={H*.68} rx={curve?20:10} fill={fabric} stroke={shade(color,-25)}/><rect x={X+W-Math.min(W*.1,curve?35:25)} y={sy+H*.23} width={Math.min(W*.1,curve?35:25)} height={H*.68} rx={curve?20:10} fill={fabric} stroke={shade(color,-25)}/>{chaise&&<rect x={X+W*(c.chaiseSide==='left'?.09:.65)} y={sy+H*.6} width={W*.26} height={H*.43} rx="12" fill={fabric} stroke={shade(color,-30)} strokeWidth="2"/>}{decor&&<g data-decoration="throw-pillow"><rect x={X+W*.18} y={sy+H*.15} width="34" height="29" rx="8" fill={shade(color,35)} stroke={shade(color,-12)} transform={`rotate(-10 ${X+W*.18} ${sy+H*.15})`}/><path d={`M${X+W*.2} ${sy+H*.19}l20 14m-22-2 21-13`} stroke={shade(color,-15)} opacity=".45"/></g>}</>;
 }
 if(v.startsWith('bed')){
  return <BedModel c={c} X={X} Y={Y} W={W} H={H} id={id} color={color} fill={fill} edge={edge} variant={v}/>;
 }
 if(v.startsWith('chair')){
  const cane=v.endsWith('cane'),swivel=v.endsWith('swivel'),arms=v.endsWith('arm'),seatY=Y+H*.6;
  return <>{swivel?<><path d={`M${X+W*.5} ${seatY+7}v${H*.34}`} stroke="#4e5c5a" strokeWidth="8"/>{[-.4,-.2,0,.25,.4].map((t,i)=><path key={i} d={`M${X+W*.5} ${Y+H*.94}l${W*t} ${i%2?8:-5}`} stroke="#4e5c5a" strokeWidth="5"/>)}</>:<path d={`M${X+8} ${seatY+6}l-8 ${H*.4}M${X+W-8} ${seatY+6}l8 ${H*.4}M${X+W*.3} ${seatY-4}v${H*.38}`} stroke={metal} strokeWidth="8"/>}<rect x={X} y={Y} width={W} height={H*.36} rx={arms?W*.3:swivel?15:7} fill={cane?'#c6b38b':fabric} stroke={edge} strokeWidth="3"/>{cane&&Array.from({length:11},(_,i)=><g key={i}><path d={`M${X+6+i*(W-12)/11} ${Y+5}v${H*.36-10}`} stroke="#8e7954" strokeWidth="1"/><path d={`M${X+4} ${Y+4+i*(H*.36-8)/11}h${W-8}`} stroke="#e1cda4" strokeWidth="1"/></g>)}<path d={`M${X+7} ${Y+H*.33}v${H*.25}m${W-14} -${H*.25}v${H*.25}`} stroke={metal} strokeWidth="6"/><ellipse cx={X+W/2} cy={seatY} rx={W*.55} ry="20" fill={fabric} stroke={edge} strokeWidth="2"/>{arms&&<path d={`M${X-7} ${Y+H*.4}v${H*.2}m0-${H*.2}q${W*.55} 12 ${W+14} 0v${H*.2}`} stroke={metal} strokeWidth="5" fill="none"/>}{decor&&<path data-decoration="chair-cushion" d={`M${X+W*.18} ${seatY-8}q${W*.3} -12 ${W*.64} 0q-15 15-${W*.64} 0z`} fill={shade(color,35)} stroke={shade(color,-12)}/>}</>;
 }
 if(v.startsWith('shoes')){
  const bench=v.endsWith('bench');
  return <><Box x={X} y={Y} w={W} h={H}>{bench?<>{door(X,Y,W/2,H)}{door(X+W/2,Y,W/2,H)}</>:drawers(X,Y,W,H,Math.max(2,c.drawers))}</Box>{bench&&<rect x={X-3} y={Y-12} width={W+6} height="13" rx="5" fill="#bfb29b" stroke={edge}/>} {plinth(X,Y+H,W)}{!bench&&accessory(X+10,Y-62,W-20,42)}</>;
 }
 return null;
}
