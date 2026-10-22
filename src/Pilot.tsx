import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, Img, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
const C={bg:'#060D16',ink:'#EEEAE2',muted:'#A4B1BD',amber:'#E3B16E',red:'#ED8B7C',line:'#294052',sea:'#0B1C2B'};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const heading:React.CSSProperties={fontFamily:'Barlow Condensed',fontWeight:700,letterSpacing:-1.2};
const Frame:React.FC<{children:React.ReactNode}>=({children})=><div style={{position:'absolute',left:96,top:300,width:1100,height:530,overflow:'hidden',borderRadius:22,border:`1px solid ${C.line}`,background:C.sea}}>{children}</div>;
function Hero({p,t}:{p:number;t:number}) {
 // AI-generated illustrative cutaway; frame-driven punch-ins create a brisk edit without misrepresenting it as archival footage.
 const beat=Math.floor(t*1.35)%4;
 const scale=[1.08,1.48,1.28,1.62][beat]+clamp((t*1.35)%1)*.025;
 const x=[0,-118,72,-62][beat], y=[0,-18,24,-30][beat];
 return <Frame>
  <Img src={staticFile('tanker-hero.png')} style={{width:1100,height:530,objectFit:'cover',transform:`translate(${x}px,${y}px) scale(${scale})`,filter:'saturate(.86) contrast(1.08)',transition:'none'}}/>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(5,12,20,.12),transparent 60%),linear-gradient(0deg,rgba(4,11,18,.78),transparent 34%)'}}/>
  <div style={{position:'absolute',left:24,top:20,fontSize:16,letterSpacing:2,color:'#E4EAF0',textShadow:'0 2px 8px #000'}}>AI-GENERATED ILLUSTRATION · NOT ARCHIVAL</div>
  <div style={{position:'absolute',left:24,bottom:22,fontSize:20,color:'#F2EAE0',fontWeight:700}}>CRUDE OIL CARRIER / UNDERWAY</div>
  <div style={{position:'absolute',right:24,bottom:22,fontSize:16,color:'#D5DEE5',letterSpacing:2}}>CUT {String(beat+1).padStart(2,'0')} / 04</div>
 </Frame>;
}
function MapView({t}:{t:number}) {return <Frame>
 <Img src={staticFile('map.svg')} style={{width:1100,height:530,transform:`scale(${1.05+((Math.floor(t*1.6)%3)*.075)+clamp((t*1.6)%1)*.035}) translate(${Math.sin(t*7)*18}px,${Math.cos(t*6)*12}px)`}}/>
 <div style={{position:'absolute',left:24,top:20,fontSize:16,letterSpacing:2,color:C.muted}}>REGIONAL CONTEXT / STRAIT OF HORMUZ</div>
 <div style={{position:'absolute',left:24,bottom:20,fontSize:15,color:C.muted}}>SCHEMATIC CORRIDOR · NOT AIS · NOT A NAVIGATION CHART</div>
 </Frame>;}
const Card:React.FC<{children:React.ReactNode}>=({children})=><div style={{position:'absolute',left:1240,top:300,width:584,height:530,borderRadius:22,overflow:'hidden',border:`1px solid ${C.line}`,background:'linear-gradient(145deg,#122131,#0A1522)',padding:30,boxSizing:'border-box'}}>{children}</div>;
export const Pilot:React.FC<{meta:any}>=({meta})=>{
 const f=useCurrentFrame(),t=f/30;
 const [handle]=useState(()=>delayRender('Waiting for local fonts'));
 useEffect(()=>{Promise.all([document.fonts.load('700 82px "Barlow Condensed"'),document.fonts.load('400 34px Manrope')]).then(()=>continueRender(handle)).catch(cancelRender);},[handle]);
 const us=meta.sentences.find((s:any)=>s.text.startsWith('The day before')).start;
 const count=meta.sentences.find((s:any)=>s.text.startsWith('He said about')).start;
 const last=meta.sentences.find((s:any)=>s.text.startsWith('One narrow')).start;
 const phase=t<us?'iran':t<count?'us':t<last?'count':'last';
 const p=clamp((t-us)/Math.max(1,count-us));
 const editBeat=Math.floor(t*1.35)%4;
 const cue=meta.captions.find((c:any)=>t>=c.start&&t<c.end);
 const inOpacity=interpolate(f,[0,16],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const endOpacity=interpolate(f,[meta.durationFrames-18,meta.durationFrames-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const source=phase==='iran'?'IRNA statement · 17 OCT 2026 · As attributed in supplied script':phase==='us'?'CENTCOM commander statement · 16 OCT 2026 · As attributed in supplied script':phase==='count'?'CENTCOM claim: approximately 400 merchant ships / previous 7 days · Not a daily AIS series':'Different statements are not equivalent measurements of normal traffic.';
 return <AbsoluteFill style={{background:C.bg,color:C.ink,fontFamily:'Manrope',overflow:'hidden'}}>
 <style>{`@font-face{font-family:Manrope;src:url('${staticFile('Manrope.ttf')}') format('truetype');font-weight:200 800;font-display:block}@font-face{font-family:'Barlow Condensed';src:url('${staticFile('BarlowCondensed-Bold.ttf')}') format('truetype');font-weight:700;font-display:block}*{box-sizing:border-box}`}</style>
 <Audio src={staticFile('master.wav')}/>
 <AbsoluteFill style={{opacity:Math.min(inOpacity,endOpacity)}}>
 <div style={{position:'absolute',left:96,top:48,width:1728,height:32,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:18,letterSpacing:3}}><span style={{color:C.amber,fontWeight:700}}>TOPBUZZ / MOTION LAB</span><span style={{fontSize:16,color:C.muted,letterSpacing:1.1}}>TECHNICAL DRAFT · SCRIPT SNAPSHOT 18 OCT 2026</span></div>
 <div style={{position:'absolute',left:96,top:104,width:1728,height:164,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
  <div style={{...heading,fontSize:82,lineHeight:.96,whiteSpace:'pre-line'}}>{phase==='iran'?'ONE NARROW\nWATERWAY.':phase==='us'?'TWO OFFICIAL\nSTATEMENTS.':phase==='count'?'ONE NUMBER.\nA SEVEN-DAY WINDOW.':'OPEN. CLOSED.\nWHAT IS BEING MEASURED?'}</div>
  <div style={{width:220,textAlign:'right',color:C.muted,fontSize:20,lineHeight:1.7}}><div style={{color:C.amber}}>01 / THE CLAIMS</div><div>26.55° N · 56.25° E</div></div>
 </div>
 {phase==='us'?<Hero p={p} t={t}/>:<MapView t={t}/>}
 <Card>
  <div style={{fontSize:19,color:C.amber,letterSpacing:2,fontWeight:700}}>{phase==='iran'?'IRAN / 17 OCT':phase==='us'||phase==='count'?'UNITED STATES / 16 OCT':'THE EXPLAINER'}</div>
  {phase==='iran'?<><div style={{...heading,fontSize:114,color:C.red,lineHeight:1.1,marginTop:42}}>CLOSED</div><div style={{fontSize:33,lineHeight:1.4,marginTop:25}}>“Passage is prohibited.”</div><div style={{position:'absolute',left:30,bottom:42,fontSize:20,color:C.muted,lineHeight:1.5}}>A declaration of restriction.<br/>Not a traffic measurement.</div></>:phase==='us'?<><div style={{...heading,fontSize:61,lineHeight:.98,marginTop:38,color:C.ink}}>CONTROL OF<br/>THE WATERWAY</div><div style={{fontSize:31,lineHeight:1.36,marginTop:28}}>“controlled by the United States and our regional partners, not Iran.”</div><div style={{position:'absolute',left:30,bottom:35,fontSize:19,color:C.muted}}>Claim attributed to Admiral Brad Cooper.</div></>:phase==='count'?<><div style={{fontSize:19,letterSpacing:1.2,color:C.muted,marginTop:23}}>CLAIMED MERCHANT-SHIP TRANSITS</div><div style={{...heading,fontSize:142,lineHeight:1.08,color:C.amber,marginTop:8}}>≈400</div><Img src={staticFile('chart.svg')} style={{width:524,height:126,display:'block',marginTop:8,clipPath:`inset(0 ${100*(1-clamp((t-count)/1.1))}% 0 0)`}}/><div style={{fontSize:23,color:C.muted,lineHeight:1.35,marginTop:17}}>Previous seven days.<br/>No day-by-day breakdown supplied.</div></>:<><div style={{...heading,fontSize:85,lineHeight:.95,marginTop:42}}>TWO<br/>STATEMENTS.</div><div style={{fontSize:29,lineHeight:1.5,color:C.muted,marginTop:40}}>Definitions, windows,<br/>and methods matter.</div></>}
 </Card>
 <div style={{position:'absolute',left:96,top:860,width:1728,height:50,fontSize:20,lineHeight:1.2,color:C.muted,display:'flex',flexDirection:'column',justifyContent:'center'}}><div>{source}</div><div style={{fontSize:16,color:'#7D909E',marginTop:4}}>Technical preview only · Claims not independently reverified · Natural Earth map, public domain.</div></div>
 <div style={{position:'absolute',left:140,top:940,width:1640,height:90,display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,fontWeight:500,lineHeight:1.23,textAlign:'center',whiteSpace:'pre-line'}}>{cue?.text||''}</div>
 <div style={{position:'absolute',left:96,top:1048,width:1728,height:20,display:'flex',alignItems:'center',gap:22}}><div style={{fontSize:13,color:C.muted,letterSpacing:2}}>HORMUZ / PILOT 01</div><div style={{height:2,background:'#213646',flex:1}}><div style={{height:2,width:`${100*f/(meta.durationFrames-1)}%`,background:C.amber}}/></div><div style={{fontSize:13,color:C.muted}}>1920 × 1080 / 30 FPS</div></div>
 </AbsoluteFill></AbsoluteFill>;
};
