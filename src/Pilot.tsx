import React, {useEffect,useMemo,useState} from 'react';
import {AbsoluteFill,Audio,Img,cancelRender,continueRender,delayRender,interpolate,staticFile,useCurrentFrame} from 'remotion';
const C={bg:'#07111B',ink:'#F2F2ED',muted:'#9EB0BE',amber:'#F3B965',red:'#F36B62',line:'#294355',sea:'#0B2433',cyan:'#65D3D2'};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v)};
const display:React.CSSProperties={fontFamily:'Barlow Condensed',fontWeight:700,letterSpacing:-1.6};
const mono:React.CSSProperties={fontFamily:'Manrope',fontVariantNumeric:'tabular-nums'};
const mapBox={position:'absolute' as const,left:88,top:267,width:1100,height:552,borderRadius:18,overflow:'hidden',border:`1px solid ${C.line}`,background:C.sea};
function DataMap({t,mode}:{t:number;mode:number}){
 const pulse=(t*1.8)%1;
 const progress=clamp((t*1.35)%1);
 const lineA=`M80 ${320+Math.sin(t*1.2)*12} C340 250 465 280 700 220 S930 260 1080 205`;
 const lineB=`M20 400 C280 360 420 400 620 350 S930 390 1100 310`;
 return <div style={mapBox}>
  <Img src={staticFile('map.svg')} style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.82,filter:'saturate(.82)'}}/>
  <svg viewBox="0 0 1100 530" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
   <defs><linearGradient id="routeGlow"><stop stopColor={C.cyan} stopOpacity=".08"/><stop offset=".45" stopColor={C.cyan} stopOpacity=".95"/><stop offset="1" stopColor={C.amber} stopOpacity=".1"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <path d={lineA} fill="none" stroke={C.cyan} strokeOpacity=".18" strokeWidth="2"/><path d={lineB} fill="none" stroke={C.amber} strokeOpacity=".14" strokeWidth="1.5"/>
   <path d={lineA} fill="none" stroke="url(#routeGlow)" strokeWidth="3" strokeDasharray="14 11" strokeDashoffset={-t*95}/>
   {[0,1,2,3,4].map(i=>{const x=160+i*190+Math.sin(t*1.2+i)*14,y=320-i*19+Math.cos(t*1.1+i)*9;return <g key={i}><circle cx={x} cy={y} r={6+(i%2)*2} fill={i===2?C.amber:C.cyan} filter="url(#glow)"/><circle cx={x} cy={y} r={13+((pulse+i*.18)%1)*24} fill="none" stroke={i===2?C.amber:C.cyan} strokeOpacity={1-((pulse+i*.18)%1)} strokeWidth="1.5"/></g>})}
   <circle cx="730" cy="275" r={30+pulse*42} fill="none" stroke={mode===1?C.red:C.amber} strokeOpacity={1-pulse} strokeWidth="2"/>
   <text x="44" y="474" fill="#D6E1E7" fontSize="14" letterSpacing="3">SCHEMATIC TRANSIT CORRIDOR · NOT AIS</text>
   <text x="847" y="72" fill="#D6E1E7" fontSize="13" letterSpacing="2">FRAME {String(Math.floor(t*30)).padStart(4,'0')}</text>
  </svg>
  <div style={{position:'absolute',left:22,top:17,fontSize:14,letterSpacing:2,color:'#D5E2EA'}}>STRAIT OF HORMUZ / REGIONAL CONTEXT</div>
 </div>
}
function SignalPanel({phase,t}:{phase:number;t:number}){
 const reveal=smooth(((t*1.35)%1));
 return <div style={{position:'absolute',right:88,top:267,width:560,height:552,padding:30,boxSizing:'border-box',border:`1px solid ${C.line}`,borderRadius:18,background:'linear-gradient(145deg,#142A38,#0A1824)',overflow:'hidden'}}>
  <div style={{fontSize:14,letterSpacing:2.4,color:C.amber,fontWeight:700}}>{['TRACKING THE CLAIM','RESTRICTION CLAIM','SOURCE ATTRIBUTION','CONFLICTING CLAIM','COMMAND STATEMENT','SEVEN-DAY AGGREGATE','EDITORIAL SUMMARY'][phase]}</div>
  {phase===0&&<><div style={{...display,fontSize:106,lineHeight:.86,marginTop:58}}>ONE<br/>WATERWAY</div><div style={{height:2,background:C.line,marginTop:34}}><div style={{height:'100%',width:`${reveal*100}%`,background:C.cyan}}/></div><div style={{...mono,fontSize:17,color:C.muted,marginTop:14}}>TRAFFIC CORRIDOR · 26.55° N / 56.25° E</div></>}
  {phase===1&&<><div style={{...display,fontSize:114,lineHeight:.88,color:C.red,marginTop:53,transform:`translateX(${(1-reveal)*90}px)`,opacity:reveal}}>CLOSED</div><div style={{fontSize:24,lineHeight:1.4,marginTop:18,color:C.ink}}>“Passage is prohibited.”</div><svg width="500" height="210" viewBox="0 0 500 210" style={{marginTop:36}}><path d="M28 105 H470" stroke={C.red} strokeWidth="7" strokeDasharray="470" strokeDashoffset={470*(1-reveal)}/><circle cx="250" cy="105" r="52" fill="none" stroke={C.red} strokeOpacity=".25" strokeWidth="2"/></svg><div style={{fontSize:15,color:C.muted,letterSpacing:1}}>RESTRICTION DECLARATION ≠ TRAFFIC COUNT</div></>}
  {phase===2&&<><div style={{...display,fontSize:47,lineHeight:1.02,marginTop:52}}>WHO SAID IT?</div><div style={{fontSize:25,lineHeight:1.42,marginTop:24,color:C.ink}}>Iran’s state news agency</div><div style={{...display,fontSize:83,color:C.amber,marginTop:12}}>IRNA</div><div style={{height:1,background:C.line,marginTop:22}}/><div style={{fontSize:18,color:C.muted,marginTop:18}}>ATTRIBUTED STATEMENT<br/>17 OCTOBER</div></>}
  {phase===3&&<><div style={{...display,fontSize:52,lineHeight:.95,marginTop:54}}>THE DAY BEFORE</div><div style={{fontSize:20,color:C.muted,marginTop:16}}>A second official account enters</div><div style={{display:'flex',gap:8,alignItems:'center',marginTop:60}}>{[0,1,2,3,4,5,6].map(i=><div key={i} style={{height:8,width:52,background:i<Math.floor(reveal*7)?C.amber:C.line,transform:`scaleY(${i===Math.floor(reveal*7)?1.8:1})`}}/>)}</div><div style={{fontSize:16,color:C.muted,marginTop:14}}>16 OCT · CENTCOM</div></>}
  {phase===4&&<><div style={{...display,fontSize:47,lineHeight:1.02,marginTop:51}}>“CONTROLLED BY<br/>THE UNITED STATES”</div><div style={{fontSize:23,color:C.ink,lineHeight:1.4,marginTop:25}}>and regional partners,<br/>not Iran.</div><div style={{height:3,background:C.line,marginTop:37}}><div style={{height:'100%',width:`${reveal*100}%`,background:C.amber}}/></div><div style={{fontSize:16,color:C.muted,marginTop:15}}>ADMIRAL BRAD COOPER · AS QUOTED</div></>}
  {phase===5&&<><div style={{fontSize:15,color:C.muted,letterSpacing:2,marginTop:42}}>CLAIMED MERCHANT SHIP TRANSITS</div><div style={{...display,fontSize:158,color:C.amber,lineHeight:1,marginTop:8}}>{Math.round(400*reveal)}</div><div style={{display:'flex',gap:4,alignItems:'end',height:97,marginTop:20}}>{[36,62,47,84,52,72,100].map((h,i)=><div key={i} style={{height:`${h*reveal}%`,flex:1,background:i===6?C.amber:'#527287',opacity:.45+reveal*.55}}/>)}</div><div style={{fontSize:16,color:C.muted,marginTop:13}}>SEVEN-DAY TOTAL · NOT DAILY SERIES</div></>}
  {phase===6&&<><div style={{...display,fontSize:58,lineHeight:.96,marginTop:70}}>TWO OFFICIAL<br/>STATEMENTS.</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:44}}><div style={{padding:18,border:`1px solid ${C.red}`,color:C.red,fontSize:20,fontWeight:700}}>CLOSED</div><div style={{padding:18,border:`1px solid ${C.cyan}`,color:C.cyan,fontSize:20,fontWeight:700}}>CONTROLLED</div></div><div style={{fontSize:17,color:C.muted,marginTop:25}}>Different claims. Different measures.</div></>}
  <div style={{position:'absolute',right:26,bottom:23,fontSize:12,letterSpacing:2,color:C.muted}}>CUT {String(phase+1).padStart(2,'0')} / 07</div>
 </div>
}
export const Pilot:React.FC<{meta:any}>=({meta})=>{
 const f=useCurrentFrame(),t=f/30;
 const [handle]=useState(()=>delayRender('Waiting for local fonts'));
 useEffect(()=>{Promise.all([document.fonts.load('700 82px "Barlow Condensed"'),document.fonts.load('400 34px Manrope')]).then(()=>continueRender(handle)).catch(cancelRender);},[handle]);
 const sentences=meta.sentences;
 const phase=Math.max(0,sentences.findIndex((s:any,i:number)=>t>=s.start&&(i===sentences.length-1||t<sentences[i+1].start)));
 const cue=meta.captions.find((c:any)=>t>=c.start&&t<c.end);
 const local=clamp((t-(sentences[phase]?.start||0))/Math.max(.01,(sentences[phase]?.end||t+1)-(sentences[phase]?.start||0)));
 const fade=interpolate(f,[0,12,meta.durationFrames-12,meta.durationFrames-1],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{background:C.bg,color:C.ink,fontFamily:'Manrope',overflow:'hidden'}}>
 <style>{`@font-face{font-family:Manrope;src:url('${staticFile('Manrope.ttf')}') format('truetype');font-weight:200 800;font-display:block}@font-face{font-family:'Barlow Condensed';src:url('${staticFile('BarlowCondensed-Bold.ttf')}') format('truetype');font-weight:700;font-display:block}*{box-sizing:border-box}`}</style>
 <Audio src={staticFile('master.wav')}/>
 <AbsoluteFill style={{opacity:fade}}>
  <div style={{position:'absolute',left:88,right:88,top:43,display:'flex',justifyContent:'space-between',fontSize:15,letterSpacing:2.5,color:C.muted}}><span style={{color:C.amber,fontWeight:800}}>TOPBUZZ / HORMUZ</span><span>THE CLAIMS · 17 OCT 2026</span></div>
  <div style={{position:'absolute',left:88,top:94,width:1744,height:110,display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{...display,fontSize:66,lineHeight:.9}}>{['ONE NARROW WATERWAY','A CLOSURE CLAIM','SOURCE: IRNA','THE DAY BEFORE','A COUNTERCLAIM','≈400 / SEVEN DAYS','TWO OFFICIAL STATEMENTS'][phase]}</div><div style={{fontSize:16,letterSpacing:2,color:C.amber}}>0{phase+1} — 07</div></div>
  <DataMap t={t} mode={phase}/><SignalPanel phase={phase} t={t}/>
  <div style={{position:'absolute',left:88,top:855,width:1744,fontSize:15,color:C.muted,letterSpacing:.2}}>SOURCE NOTE · Claims are attributed to the supplied script; not independently reverified. Map is schematic, not AIS.</div>
  <div style={{position:'absolute',left:145,top:908,width:1630,height:100,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',fontSize:34,lineHeight:1.2,fontWeight:600,whiteSpace:'pre-line',textShadow:'0 3px 18px #000'}}>{cue?.text||''}</div>
  <div style={{position:'absolute',left:88,right:88,bottom:31,height:2,background:'#233746'}}><div style={{height:2,width:`${100*f/(meta.durationFrames-1)}%`,background:C.amber}}/></div>
 </AbsoluteFill>
 </AbsoluteFill>;
};
