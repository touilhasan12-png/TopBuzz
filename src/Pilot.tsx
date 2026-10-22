import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, Img, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
const C={bg:'#060D16',ink:'#EEEAE2',muted:'#A4B1BD',amber:'#E3B16E',red:'#ED8B7C',line:'#294052',sea:'#0B1C2B'};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const heading:React.CSSProperties={fontFamily:'Barlow Condensed',fontWeight:700,letterSpacing:-1.2};
const Frame:React.FC<{children:React.ReactNode}>=({children})=><div style={{position:'absolute',left:96,top:300,width:1100,height:530,overflow:'hidden',borderRadius:22,border:`1px solid ${C.line}`,background:C.sea}}>{children}</div>;
function CameraRig({p}:{p:number}) {const {camera}=useThree();useLayoutEffect(()=>{camera.position.set(10.4+p*0.5,7.0,11.5-p*0.4);camera.lookAt(0,0.4,0);camera.updateProjectionMatrix();},[camera,p]);return null;}
function Tanker({p}:{p:number}) {
 const hull=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-4.9,-.7);s.lineTo(3.6,-.8);s.quadraticCurveTo(5.5,-.6,5.6,0);s.quadraticCurveTo(5.5,.6,3.6,.8);s.lineTo(-4.9,.7);s.closePath();return s;},[]);
 return <group rotation={[0,-.12+p*.12,0]}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.05,0]}><extrudeGeometry args={[hull,{depth:.62,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:3,steps:1}]}/><meshStandardMaterial color="#33515E" metalness={.45} roughness={.33}/></mesh>
  <mesh position={[0,.76,0]}><boxGeometry args={[8.8,.14,1.34]}/><meshStandardMaterial color="#C9B69A" metalness={.22} roughness={.58}/></mesh>
  {[-2.7,-1.45,-.2,1.05,2.3,3.55].map((x,i)=><group key={i}>
    <mesh position={[x,.91,0]}><cylinderGeometry args={[.25,.25,.16,24]}/><meshStandardMaterial color="#D7D9D4" metalness={.65} roughness={.26}/></mesh>
    {[-.43,.43].map(z=><mesh key={z} position={[x,.98,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.045,.045,.85,10]}/><meshStandardMaterial color="#E3C78E" metalness={.65} roughness={.3}/></mesh>)}
  </group>)}
  {[-.51,.51].map(z=><mesh key={z} position={[.7,1.04,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.028,.028,7.3,10]}/><meshStandardMaterial color="#D6D7CE" metalness={.72} roughness={.25}/></mesh>)}
  <mesh position={[-3.9,1.15,0]}><boxGeometry args={[1.3,.63,1.2]}/><meshStandardMaterial color="#E2E0D6" roughness={.65}/></mesh>
  <mesh position={[-4.0,1.62,0]}><boxGeometry args={[.92,.30,1.16]}/><meshStandardMaterial color="#DBDCD3" roughness={.6}/></mesh>
  <mesh position={[-4.0,1.66,.59]}><boxGeometry args={[.76,.10,.025]}/><meshStandardMaterial color="#294D64" metalness={.5} roughness={.2}/></mesh>
  <mesh position={[-4.6,1.85,0]}><boxGeometry args={[.26,.65,.32]}/><meshStandardMaterial color="#323B42" roughness={.5}/></mesh>
  <mesh position={[-3.65,2.02,0]}><cylinderGeometry args={[.025,.025,.8,8]}/><meshStandardMaterial color="#D8DAD5"/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[-5.9,.005,0]}><planeGeometry args={[2.1,.6]}/><meshBasicMaterial color="#A7CDD3" transparent opacity={.12}/></mesh>
 </group>;
}
function Hero({p}:{p:number}) {return <Frame>
 <ThreeCanvas width={1100} height={530} camera={{fov:39,position:[10.4,7,11.5]}} gl={{antialias:true}}>
  <color attach="background" args={[C.sea]}/><fog attach="fog" args={[C.sea,18,70]}/>
  <ambientLight intensity={1.5}/><directionalLight position={[4,10,6]} color="#F5E8D4" intensity={3.6}/><directionalLight position={[-7,4,-5]} color="#8CC0D8" intensity={2}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.13,0]}><planeGeometry args={[200,200]}/><meshStandardMaterial color="#102838" roughness={.26} metalness={.25}/></mesh>
  <Tanker p={p}/><CameraRig p={p}/>
 </ThreeCanvas>
 <div style={{position:'absolute',left:24,top:20,fontSize:16,letterSpacing:2,color:C.muted}}>ILLUSTRATIVE 3D · NOT A RECORDED SCENE</div>
 <div style={{position:'absolute',left:24,bottom:20,fontSize:18,color:C.muted}}>MERCHANT VESSEL / CONCEPT MODEL</div>
 </Frame>;}
function MapView({t}:{t:number}) {return <Frame>
 <Img src={staticFile('map.svg')} style={{width:1100,height:530,transform:`scale(${1+clamp(t/60)*.018})`}}/>
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
 {phase==='us'?<Hero p={p}/>:<MapView t={t}/>}
 <Card>
  <div style={{fontSize:19,color:C.amber,letterSpacing:2,fontWeight:700}}>{phase==='iran'?'IRAN / 17 OCT':phase==='us'||phase==='count'?'UNITED STATES / 16 OCT':'THE EXPLAINER'}</div>
  {phase==='iran'?<><div style={{...heading,fontSize:114,color:C.red,lineHeight:1.1,marginTop:42}}>CLOSED</div><div style={{fontSize:33,lineHeight:1.4,marginTop:25}}>“Passage is prohibited.”</div><div style={{position:'absolute',left:30,bottom:42,fontSize:20,color:C.muted,lineHeight:1.5}}>A declaration of restriction.<br/>Not a traffic measurement.</div></>:phase==='us'?<><div style={{...heading,fontSize:61,lineHeight:.98,marginTop:38,color:C.ink}}>CONTROL OF<br/>THE WATERWAY</div><div style={{fontSize:31,lineHeight:1.36,marginTop:28}}>“controlled by the United States and our regional partners, not Iran.”</div><div style={{position:'absolute',left:30,bottom:35,fontSize:19,color:C.muted}}>Claim attributed to Admiral Brad Cooper.</div></>:phase==='count'?<><div style={{fontSize:19,letterSpacing:1.2,color:C.muted,marginTop:23}}>CLAIMED MERCHANT-SHIP TRANSITS</div><div style={{...heading,fontSize:142,lineHeight:1.08,color:C.amber,marginTop:8}}>≈400</div><Img src={staticFile('chart.svg')} style={{width:524,height:126,display:'block',marginTop:8,clipPath:`inset(0 ${100*(1-clamp((t-count)/1.1))}% 0 0)`}}/><div style={{fontSize:23,color:C.muted,lineHeight:1.35,marginTop:17}}>Previous seven days.<br/>No day-by-day breakdown supplied.</div></>:<><div style={{...heading,fontSize:85,lineHeight:.95,marginTop:42}}>TWO<br/>STATEMENTS.</div><div style={{fontSize:29,lineHeight:1.5,color:C.muted,marginTop:40}}>Definitions, windows,<br/>and methods matter.</div></>}
 </Card>
 <div style={{position:'absolute',left:96,top:860,width:1728,height:50,fontSize:20,lineHeight:1.2,color:C.muted,display:'flex',flexDirection:'column',justifyContent:'center'}}><div>{source}</div><div style={{fontSize:16,color:'#7D909E',marginTop:4}}>Technical preview only · Claims not independently reverified · Natural Earth map, public domain.</div></div>
 <div style={{position:'absolute',left:140,top:940,width:1640,height:90,display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,fontWeight:500,lineHeight:1.23,textAlign:'center',whiteSpace:'pre-line'}}>{cue?.text||''}</div>
 <div style={{position:'absolute',left:96,top:1048,width:1728,height:20,display:'flex',alignItems:'center',gap:22}}><div style={{fontSize:13,color:C.muted,letterSpacing:2}}>HORMUZ / PILOT 01</div><div style={{height:2,background:'#213646',flex:1}}><div style={{height:2,width:`${100*f/(meta.durationFrames-1)}%`,background:C.amber}}/></div><div style={{fontSize:13,color:C.muted}}>1920 × 1080 / 30 FPS</div></div>
 </AbsoluteFill></AbsoluteFill>;
};
