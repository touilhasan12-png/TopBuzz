import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useLoader} from '@react-three/fiber';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CatmullRomCurve3, Color, TubeGeometry, Vector3} from 'three';
import {TimelineGraphic} from './TimelineGraphic';

const chapters = [
  {at:0, year:'c. 657 BCE', title:'A Strait Writes the First Chapter', tag:'BYZANTIUM'},
  {at:35, year:'330 CE', title:'A New Rome on the Bosporus', tag:'CONSTANTINOPLE'},
  {at:80, year:'447–537', title:'Walls, Water, and Survival', tag:'THE FORTIFIED CITY'},
  {at:125, year:'1204 / 1261', title:'A City Under Pressure', tag:'SACKED — THEN RESTORED'},
  {at:170, year:'1453', title:'A New Imperial Era', tag:'OTTOMAN ISTANBUL'},
  {at:225, year:'16TH CENTURY', title:'A Skyline of Domes and Minarets', tag:'THE IMPERIAL CITY'},
  {at:280, year:'19TH CENTURY', title:'An Old City Meets a New Age', tag:'TRANSFORMATION'},
  {at:325, year:'1923', title:'The Capital Moves — The City Remains', tag:'THE REPUBLIC'},
  {at:370, year:'1973', title:'The Shores Are Connected', tag:'ACROSS THE BOSPORUS'},
  {at:405, year:'TODAY', title:'A City Between Two Continents', tag:'ISTANBUL'},
];
const seeded = (n:number) => {const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const buildings = Array.from({length:260},(_,i)=>({
  id:i,
  x:(seeded(i+4)-.5)*28,
  z:(seeded(i+91)-.5)*23,
  h:.5+seeded(i+213)*1.5,
  w:.35+seeded(i+511)*.48,
})).filter(b=>Math.abs(b.x-1.5*Math.sin(b.z*.24))>1.65);
const riverCurve = new CatmullRomCurve3([
  new Vector3(-1.7,.04,-14),new Vector3(-1.0,.04,-9),new Vector3(.3,.04,-5),
  new Vector3(1.8,.04,-1),new Vector3(1.2,.04,3),new Vector3(2.6,.04,7),new Vector3(1.5,.04,13),
]);

const BlenderLandmarks: React.FC<{progress:number}> = ({progress}) => {
  const gltf=useLoader(GLTFLoader,staticFile('istanbul-landmarks.glb'));
  return <primitive object={gltf.scene} position={[-3.4,0,-1.3]} scale={[.72,.72,.72]} />;
};

const City: React.FC<{frame:number;fps:number}> = ({frame,fps}) => {
  const progress=interpolate(frame,[0,420*fps],[.08,1],{extrapolateRight:'clamp',easing:Easing.inOut(Easing.quad)});
  const waterGeometry=useMemo(()=>new TubeGeometry(riverCurve,100,.72,10,false),[]);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.15,0]}><planeGeometry args={[40,34]}/><meshStandardMaterial color="#465b48" roughness={1}/></mesh>
    <mesh geometry={waterGeometry} scale={[1,.12,1]}><meshStandardMaterial color="#25869b" roughness={.25} metalness={.12}/></mesh>
    {buildings.map((b)=>{
      const dist=Math.hypot((b.x+3)/17,b.z/13);
      const appear=interpolate(progress,[Math.max(0,dist*.34),Math.min(1,dist*.34+.18)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
      const h=b.h*(.35+appear*.8+progress*.28);
      const color=new Color(b.id%4===0?'#c29b6b':'#d8cdb9').lerp(new Color(b.id%6===0?'#6d8294':'#d2d3cd'),progress);
      return <mesh key={b.id} position={[b.x,h/2,b.z]} scale={[b.w,h,b.w*.9]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color={color} roughness={.88}/></mesh>;
    })}
    <BlenderLandmarks progress={progress} />
    <group scale={[progress,progress,progress]} position={[0,.08,7]}>
      <mesh><boxGeometry args={[12,.12,.34]}/><meshStandardMaterial color="#e4b75d"/></mesh>
      {[-4.5,4.5].map(x=><mesh key={x} position={[x,1,0]}><boxGeometry args={[.12,2,.12]}/><meshStandardMaterial color="#e9e1cf"/></mesh>)}
    </group>
  </group>;
};

export const IstanbulFilm: React.FC = () => {
  const frame=useCurrentFrame();
  const {fps,width,height}=useVideoConfig();
  const seconds=frame/fps;
  let chapter=chapters[0];
  for (const c of chapters) if(seconds>=c.at) chapter=c;
  const next=chapters.find(c=>c.at>seconds);
  const fade=next?Math.min(1,(seconds-chapter.at)/2,(next.at-seconds)/2):1;
  return <AbsoluteFill style={{background:'#13242f',color:'#f7f0e2',fontFamily:'Arial,Helvetica,sans-serif'}}>
    <ThreeCanvas width={width} height={height} camera={{position:[0,17,28],fov:43}} style={{width:'100%',height:'100%'}}>
      <color attach="background" args={['#13242f']}/><fog attach="fog" args={['#13242f',23,62]}/>
      <ambientLight intensity={1.2}/><directionalLight position={[8,18,10]} intensity={2.1}/><directionalLight position={[-12,10,-8]} intensity={.55} color="#80bac7"/>
      <group rotation={[0,Math.sin(seconds*.05)*.08,0]}><City frame={frame} fps={fps}/></group>
    </ThreeCanvas>
    <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(5,14,20,.55),transparent 30%,transparent 66%,rgba(5,12,18,.78))'}}/>
    <div style={{position:'absolute',top:58,left:82,letterSpacing:5,fontSize:20,color:'#e9c77e',fontWeight:700}}>A CITY THROUGH TIME</div>
    <div style={{position:'absolute',top:112,left:82,fontSize:64,fontWeight:700,lineHeight:1.05,maxWidth:1300,opacity:fade}}>{chapter.title}</div>
    <div style={{position:'absolute',left:84,bottom:125,fontSize:26,letterSpacing:5,color:'#e9c77e',fontWeight:700}}>{chapter.year}</div>
    <div style={{position:'absolute',left:84,bottom:75,fontSize:17,letterSpacing:4,opacity:.85}}>{chapter.tag}</div>
    <div style={{position:'absolute',right:78,bottom:70,width:600,height:120}}><TimelineGraphic frame={frame} fps={fps}/></div>
    {seconds>=25&&seconds<40&&<div style={{position:'absolute',right:82,top:250,width:760,height:430,border:'1px solid rgba(233,199,126,.55)',borderRadius:14,overflow:'hidden',boxShadow:'0 18px 55px rgba(0,0,0,.38)'}}><OffthreadVideo src={staticFile('strait-map.mp4')} startFrom={0} endAt={15*24} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
    {seconds<4&&<AbsoluteFill style={{display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(6,15,22,.78)',textAlign:'center'}}><div><div style={{fontSize:20,letterSpacing:8,color:'#e9c77e'}}>A CINEMATIC HISTORY</div><div style={{fontSize:78,fontWeight:700,marginTop:18}}>ISTANBUL</div><div style={{fontSize:23,letterSpacing:5,marginTop:16}}>THE CITY BETWEEN TWO CONTINENTS</div></div></AbsoluteFill>}
    <Audio src={staticFile('audio/narration_en.mp3')} volume={1} />
  </AbsoluteFill>;
};
