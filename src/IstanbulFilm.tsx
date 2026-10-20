import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useLoader, useFrame} from '@react-three/fiber';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Color, Group, Material, Mesh, Vector3} from 'three';
import {TimelineGraphic} from './TimelineGraphic';

const chapters = [
  {at:0, year:'c. 657 BCE', title:'A Strait Writes the First Chapter', tag:'BYZANTIUM', note:'A sheltered inlet and two continents made this crossing a natural meeting point.'},
  {at:35, year:'330 CE', title:'A New Rome on the Bosporus', tag:'CONSTANTINOPLE', note:'Constantine refounds the city as an imperial capital at the hinge of two seas.'},
  {at:80, year:'447–537', title:'Walls, Water, and Survival', tag:'THE FORTIFIED CITY', note:'Land walls, harbors, and layered defenses shape the city for centuries.'},
  {at:125, year:'1204 / 1261', title:'A City Under Pressure', tag:'SACKED — THEN RESTORED', note:'The Fourth Crusade and the Byzantine restoration mark distinct turning points.'},
  {at:170, year:'1453', title:'A New Imperial Era', tag:'OTTOMAN ISTANBUL', note:'The Ottoman conquest begins a new chapter; the old city is remade, not erased.'},
  {at:225, year:'16TH CENTURY', title:'A Skyline of Domes and Minarets', tag:'THE IMPERIAL CITY', note:'Mosques, palaces, courtyards, and markets recast the peninsula’s skyline.'},
  {at:280, year:'19TH CENTURY', title:'An Old City Meets a New Age', tag:'TRANSFORMATION', note:'Steam, rail, and new districts reshape a city still organized by its waterways.'},
  {at:325, year:'1923', title:'The Capital Moves — The City Remains', tag:'THE REPUBLIC', note:'Ankara becomes the capital; Istanbul remains the country’s largest historic metropolis.'},
  {at:370, year:'1973', title:'The Shores Are Connected', tag:'ACROSS THE BOSPORUS', note:'A suspension bridge creates a new daily link between Europe and Asia.'},
  {at:405, year:'TODAY', title:'A City Between Two Continents', tag:'ISTANBUL', note:'The strait remains the city’s oldest organizing line—and its most visible one.'},
];
const cameraKeys:[number,number[],number[]][]=[
  [0,[2,24,30],[-1,0,0]],[35,[1,15,20],[-4,0,1]],[80,[-2,13,18],[-5,0,1]],
  [125,[-5,12,16],[-6,0,0]],[170,[-7,13,18],[-4,0,-2]],[225,[-3,15,20],[-4,0,-4]],
  [280,[3,23,28],[0,0,-3]],[325,[6,24,31],[1,0,-1]],[370,[4,25,34],[1,0,0]],
  [405,[1,31,40],[0,0,0]],[420,[1,31,40],[0,0,0]],
];
const smooth=(t:number)=>t*t*(3-2*t);
const ramp=(t:number,a:number,b:number)=>smooth(Math.max(0,Math.min(1,(t-a)/(b-a))));

const LayeredCity:React.FC<{seconds:number}> = ({seconds}) => {
  const gltf=useLoader(GLTFLoader,staticFile('istanbul-landmarks.glb'));
  const model=useMemo(()=>gltf.scene.clone(true),[gltf.scene]);
  const controlled=useMemo(()=>{
    const found=new Map<string,{group:Group;mats:Material[]}>();
    model.traverse((o)=>{
      if(o.name.startsWith('LAYER_')){
        const mats:Material[]=[];
        o.traverse((child)=>{
          const mesh=child as Mesh;
          if(mesh.isMesh&&mesh.material){
            const cloned=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();
            const list=Array.isArray(cloned)?cloned:[cloned];
            list.forEach((m)=>{m.opacity=1;mats.push(m);});
            mesh.material=Array.isArray(cloned)?cloned:cloned;
          }
        });
        found.set(o.name,{group:o as Group,mats});
      }
    });
    return found;
  },[model]);
  useFrame(()=>{
    const a:Record<string,number>={
      LAYER_EARLY_SETTLEMENT:1-ramp(seconds,25,42),
      LAYER_BYZANTINE_CITY:ramp(seconds,22,72)*(1-ramp(seconds,158,178)),
      LAYER_OTTOMAN_CITY:ramp(seconds,158,178)*(1-.25*ramp(seconds,325,380)),
      LAYER_MODERN_CITY:ramp(seconds,316,395),
      LAYER_LANDMARKS:1,
      LAYER_BRIDGES:ramp(seconds,365,405),
    };
    controlled.forEach(({group,mats},name)=>{
      const alpha=a[name]??1; group.visible=alpha>.002;
      mats.forEach((m)=>{
        const fading=alpha<.999;
        if(m.transparent!==fading){m.transparent=fading;m.needsUpdate=true;}
        m.depthWrite=!fading;
        m.opacity=alpha;
      });
    });
  });
  return <primitive object={model} />;
};

const CameraRig:React.FC<{seconds:number}> = ({seconds}) => {
  useFrame(({camera})=>{
    let i=0;while(i<cameraKeys.length-2&&seconds>cameraKeys[i+1][0])i++;
    const [ta,pa,la]=cameraKeys[i];const [tb,pb,lb]=cameraKeys[i+1];
    const u=smooth(Math.max(0,Math.min(1,(seconds-ta)/(tb-ta))));
    const tx=la[0]+(lb[0]-la[0])*u,ty=la[1]+(lb[1]-la[1])*u,tz=la[2]+(lb[2]-la[2])*u;
    const px=pa[0]+(pb[0]-pa[0])*u,py=pa[1]+(pb[1]-pa[1])*u,pz=pa[2]+(pb[2]-pa[2])*u;
    // Keep each authored target, but bring the camera closer for readable landmarks.
    const zoom=.76;
    camera.position.set(tx+(px-tx)*zoom,ty+(py-ty)*zoom,tz+(pz-tz)*zoom);
    camera.lookAt(new Vector3(tx,ty,tz));
  });
  return null;
};

const Locator:React.FC=()=> <div style={{width:184,height:128,border:'1px solid rgba(232,220,192,.28)',background:'rgba(11,24,29,.50)',borderRadius:6,padding:'9px 11px',boxSizing:'border-box',backdropFilter:'blur(6px)'}}>
  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,letterSpacing:2,color:'#d8c79f',fontWeight:700}}><span>ISTANBUL</span><span>41° N · 29° E</span></div>
  <svg viewBox="0 0 162 72" width="162" height="72" style={{display:'block',marginTop:5}} aria-label="Stylized Bosporus locator map">
    <path d="M0 4 C22 10 23 21 40 28 C50 34 56 38 76 36 C95 34 99 24 105 15 C114 2 133 2 162 6 L162 0 L0 0 Z" fill="#425b45"/>
    <path d="M0 72 L0 56 C22 56 34 50 45 42 C55 36 60 33 76 36 C94 40 102 53 119 57 C137 62 146 53 162 47 L162 72 Z" fill="#52614a"/>
    <path d="M78 -3 C70 9 86 17 78 28 C70 38 76 46 88 54 C98 62 88 68 85 76" fill="none" stroke="#65b4c0" strokeWidth="7"/>
    <path d="M79 29 C67 31 60 38 49 39 C37 40 33 47 24 50" fill="none" stroke="#65b4c0" strokeWidth="5"/>
    <path d="M26 45 L39 39 M38 39 L33 47" stroke="#e4c47b" strokeWidth="1.5"/>
    <circle cx="72" cy="31" r="3" fill="#f4d48b"/><circle cx="89" cy="45" r="2.5" fill="#f4d48b"/>
  </svg>
  <div style={{display:'flex',justifyContent:'space-between',fontSize:9,letterSpacing:1.5,color:'rgba(245,239,224,.72)'}}><span>EUROPE</span><span>ASIA</span></div>
</div>;

export const IstanbulFilm:React.FC=()=>{
  const frame=useCurrentFrame();const {fps,width,height}=useVideoConfig();const seconds=frame/fps;
  let chapter=chapters[0];for(const c of chapters)if(seconds>=c.at)chapter=c;
  const next=chapters.find(c=>c.at>seconds);
  const fade=next?Math.min(1,(seconds-chapter.at)/1.5,(next.at-seconds)/1.5):1;
  const titleFade=interpolate(seconds,[0,.8,3.3,4.2],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.quad)});
  return <AbsoluteFill style={{background:'#10232a',color:'#f2ecdc',fontFamily:'Arial,Helvetica,sans-serif'}}>
    <ThreeCanvas width={width} height={height} camera={{position:[2,29,37],fov:47,near:.1,far:180}} style={{width:'100%',height:'100%'}}>
      <color attach="background" args={['#a8b9b0']}/><fog attach="fog" args={['#a8b9b0',55,115]}/>
      <ambientLight intensity={1.15}/><directionalLight position={[-18,30,16]} intensity={2.55} color="#fff0d3"/>
      <directionalLight position={[12,18,-20]} intensity={.65} color="#8bb8c1"/>
      <LayeredCity seconds={seconds}/><CameraRig seconds={seconds}/>
    </ThreeCanvas>
    <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(10,21,25,.42),transparent 24%,transparent 70%,rgba(7,16,20,.70))'}}/>
    <div style={{position:'absolute',top:42,left:48}}><Locator/></div>
    <div style={{position:'absolute',top:54,right:54,textAlign:'right',fontSize:11,letterSpacing:2,color:'rgba(247,239,221,.88)',fontWeight:700}}>HISTORICAL RECONSTRUCTION<br/><span style={{fontSize:9,letterSpacing:1.5,fontWeight:400,color:'rgba(247,239,221,.68)'}}>ILLUSTRATIVE 3D — NOT ARCHIVAL FOOTAGE</span></div>
    <div style={{position:'absolute',left:62,bottom:112,opacity:fade,transition:'opacity .2s'}}>
      <div style={{fontSize:12,letterSpacing:3,color:'#e7c982',fontWeight:700}}>{chapter.tag}</div>
      <div style={{fontSize:36,fontWeight:700,lineHeight:1.12,maxWidth:800,marginTop:7,textShadow:'0 3px 14px rgba(0,0,0,.42)'}}>{chapter.title}</div>
      <div style={{fontSize:19,letterSpacing:1.5,color:'#e7c982',marginTop:8}}>{chapter.year}</div>
    </div>
    <div style={{position:'absolute',right:64,bottom:112,width:550,fontSize:15,lineHeight:1.45,color:'rgba(247,239,221,.90)',textAlign:'right',textShadow:'0 2px 12px rgba(0,0,0,.55)',opacity:fade}}>{chapter.note}</div>
    <div style={{position:'absolute',right:58,bottom:44,width:650,height:58}}><TimelineGraphic frame={frame} fps={fps}/></div>
    {seconds>=25&&seconds<40&&<div style={{position:'absolute',right:82,top:250,width:760,height:430,border:'1px solid rgba(233,199,126,.55)',borderRadius:8,overflow:'hidden',boxShadow:'0 18px 55px rgba(0,0,0,.38)'}}><OffthreadVideo src={staticFile('strait-map.mp4')} startFrom={0} endAt={15*24} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
    {seconds<4&&<AbsoluteFill style={{display:'flex',alignItems:'center',justifyContent:'center',background:`rgba(7,16,20,${.56*titleFade})`,textAlign:'center',pointerEvents:'none'}}>
      <div style={{opacity:titleFade,transform:`translateY(${(1-titleFade)*14}px)`}}><div style={{fontSize:16,letterSpacing:8,color:'#e7c982',fontWeight:700}}>A CINEMATIC HISTORY</div><div style={{fontSize:76,fontWeight:700,letterSpacing:5,marginTop:18,textShadow:'0 5px 22px rgba(0,0,0,.45)'}}>ISTANBUL</div><div style={{fontSize:19,letterSpacing:4,marginTop:16}}>THE CITY BETWEEN TWO CONTINENTS</div></div>
    </AbsoluteFill>}
    {seconds>412&&<div style={{position:'absolute',left:62,bottom:40,fontSize:10,letterSpacing:1.5,color:'rgba(245,238,223,.68)'}}>RECONSTRUCTION • SOURCES: UNESCO · BRITANNICA · ISTANBUL TARIHI</div>}
    <Audio src={staticFile('audio/narration_en.mp3')} volume={1}/>
  </AbsoluteFill>;
};
