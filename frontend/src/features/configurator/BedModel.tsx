import type {Config} from '../../data';
import {shade} from './model';

type Props={c:Config;X:number;Y:number;W:number;H:number;id:string;color:string;fill:string;edge:string;variant?:string};

/** All bed variants share a centered, one-point perspective and paired details. */
export default function BedModel({c,X,Y,W,H,id,color,fill,edge,variant='bed-panel'}:Props){
 const center=X+W/2,storage=variant.endsWith('storage'),arch=variant.endsWith('arch');
 const rearY=Y+H*.48,frontY=Y+H-19,depth=frontY-rearY;
 const rearHalf=W*.43,frontHalf=W*.5,frameHalf=W*.53;
 const mattressThickness=Math.max(5,Math.min(10,H*.055)),frameHeight=16;
 const headBottom=rearY+depth*.22,headHeight=headBottom-Y;
 const fabric=`url(#${id}-fabric)`,legColor=c.legs==='Метални крака'?'#34414a':shade(color,-32);
 const halfAt=(t:number)=>rearHalf+(frontHalf-rearHalf)*t;
 const surface=(a:number,b:number)=>`${center-halfAt(a)},${rearY+depth*a} ${center+halfAt(a)},${rearY+depth*a} ${center+halfAt(b)},${rearY+depth*b} ${center-halfAt(b)},${rearY+depth*b}`;
 const pillowW=rearHalf*.79,pillowH=Math.max(8,Math.min(24,depth*.25)),pillowGap=W*.045;
 return <g data-bed-model={variant} data-bed-center={center}>
  <defs><clipPath id={`${id}-bed-head`}><rect x={X-5} y={Y} width={W+10} height={headHeight} rx={arch?Math.min(W*.18,headHeight*.45):9}/></clipPath></defs>
  <rect x={X-5} y={Y} width={W+10} height={headHeight} rx={arch?Math.min(W*.18,headHeight*.45):9} fill={storage?fill:fabric} stroke={edge} strokeWidth="2.5"/>
  <g clipPath={`url(#${id}-bed-head)`}>
   {!storage&&[-3,-2,-1,0,1,2,3].map(i=><path key={i} d={`M${center+i*W/8} ${Y+8}V${headBottom-4}`} stroke={shade(color,-30)} strokeWidth="1.2" opacity=".4"/>)}
   <rect x={X-4} y={headBottom-18} width={W+8} height="18" fill="#000" opacity=".07"/>
  </g>
  <g data-bed-feet="true" stroke={legColor} strokeWidth={c.legs==='Метални крака'?5:7} strokeLinecap="round">
   {[-1,1].map(side=><path key={side} d={`M${center+side*frameHalf*.87} ${frontY+frameHeight-2}l${side*3} 10`}/>)}
  </g>
  <polygon points={`${center-rearHalf-7},${rearY+3} ${center+rearHalf+7},${rearY+3} ${center+frameHalf},${frontY+4} ${center-frameHalf},${frontY+4}`} fill={fill} stroke={edge} strokeWidth="2"/>
  <rect data-bed-frame="true" x={center-frameHalf} y={frontY+3} width={frameHalf*2} height={frameHeight} rx="2" fill={fill} stroke={edge} strokeWidth="1.5"/>
  {storage&&[-1,1].map(side=>{
   const drawerW=frameHalf-6,drawerX=side<0?center-frameHalf+3:center+3;
   return <g key={side} data-bed-drawer={side}><rect x={drawerX} y={frontY+6} width={drawerW} height={frameHeight-5} rx="1" fill={fill} stroke={edge}/>{c.handles!=='Без дръжки'&&<path d={`M${drawerX+drawerW/2-10} ${frontY+10}h20`} stroke={c.handleColor||'#34414a'} strokeWidth="2" strokeLinecap="round"/>}</g>;
  })}
  <path d={`M${center-frontHalf} ${frontY-mattressThickness}h${frontHalf*2}v${mattressThickness+3}h-${frontHalf*2}z`} fill="#ded7c8" stroke="#c9c0ad" strokeWidth="1"/>
  <g transform={`translate(0 -${mattressThickness})`}>
   <polygon data-bed-mattress="true" points={surface(0,1)} fill="#f3eee4" stroke="#cec6b6" strokeWidth="1.5"/>
   <path d={`M${center-rearHalf+4} ${rearY+3}H${center+rearHalf-4}`} stroke="#fffaf3" strokeWidth="2"/>
   {[-1,1].map(side=>{
    const px=side<0?center-pillowGap/2-pillowW:center+pillowGap/2;
    return <g key={side} data-bed-pillow={side}><rect x={px} y={rearY+depth*.1+2} width={pillowW} height={pillowH} rx="5" fill="#b9ad98" opacity=".15"/><rect x={px} y={rearY+depth*.1} width={pillowW} height={pillowH} rx="5" fill="#fffaf0" stroke="#d7cebd"/><path d={`M${px+7} ${rearY+depth*.1+4}h${Math.max(1,pillowW-14)}`} stroke="#fff" opacity=".7"/></g>;
   })}
   <polygon points={surface(.43,.98)} fill="#e8e0d1" stroke="#d4caba" strokeWidth=".8"/>
   <path d={`M${center-halfAt(.43)+3} ${rearY+depth*.43+3}H${center+halfAt(.43)-3}`} stroke="#fcf7ed" strokeWidth="2.5"/>
   {c.decorations!==false&&<g data-decoration="bed-throw"><polygon points={surface(.72,.93)} fill={shade(color,27)} stroke={shade(color,-5)} strokeWidth=".8"/>{[.77,.83,.89].map(t=><path key={t} d={`M${center-halfAt(t)+3} ${rearY+depth*t}H${center+halfAt(t)-3}`} stroke={shade(color,52)} strokeWidth="1" opacity=".5"/>)}</g>}
  </g>
  {c.led&&<g data-bed-led="true"><path d={`M${center-frameHalf+12} ${frontY+frameHeight+5}h${frameHalf*2-24}`} stroke="#ffd586" strokeWidth="5" opacity=".55" filter={`url(#${id}-led)`}/><path d={`M${center-frameHalf+12} ${frontY+frameHeight+4}h${frameHalf*2-24}`} stroke="#fff0bb" strokeWidth="1.5"/></g>}
 </g>;
}
