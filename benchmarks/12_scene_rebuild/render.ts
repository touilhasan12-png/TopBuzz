import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createCanvas,ImageData,loadImage,GlobalFonts} from '@napi-rs/canvas';
import ffmpeg from 'ffmpeg-static';
const root=process.cwd(),engine=process.env.REV2D_ROOT!;
const {loadModelFile}=await import(pathToFileURL(path.join(engine,'src/node/load.ts')).href);
const {Rig}=await import(pathToFileURL(path.join(engine,'src/core/rig.ts')).href);
const {renderPose}=await import(pathToFileURL(path.join(engine,'src/api/frame.ts')).href);
const base=path.join(root,'benchmarks/09_ai_puppet_20s');
const body=await loadModelFile(path.join(root,'benchmarks/12_scene_rebuild/sailor.r2d.json'));
const rb=new Rig(body.model);
const bg=await loadImage(path.join(base,'raw/bg_01_ocean_battle.png'));
const [ship,target,torpedo,seal,cross]=await Promise.all(['destroyer_willie.png','battleship_iowa.png','torpedo_live.png','presidential_seal.png','crosshair_target.png'].map(n=>loadImage(path.join(base,'cutouts',n))));
GlobalFonts.registerFromPath(path.join(root,'assets/fonts/Montserrat-Black.otf'),'Black');
const c=createCanvas(1080,1920),ctx=c.getContext('2d');
const temp=createCanvas(800,1050),tc=temp.getContext('2d');
function image(im:any){temp.width=im.width;temp.height=im.height;tc.putImageData(new ImageData(new Uint8ClampedArray(im.data.buffer,im.data.byteOffset,im.data.byteLength),im.width,im.height),0,0);return temp}
const smooth=(a:number,b:number,t:number)=>{let u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u)};
const out='/tmp/out_video/12_Scene_Rebuilt_6s.mp4';fs.mkdirSync(path.dirname(out),{recursive:true});
const ff=spawn(ffmpeg!,['-y','-f','rawvideo','-pixel_format','rgba','-video_size','1080x1920','-framerate','30','-i','pipe:0','-i',path.join(root,'benchmarks/shared/audio_20s.wav'),'-t','6','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
const finished=new Promise<void>((res,rej)=>{ff.on('error',rej);ff.on('close',n=>n===0?res():rej(Error('ffmpeg '+n)))});
ff.stdin.on('error',e=>{console.error(e);process.exitCode=1});
for(let f=0;f<180;f++){
 let t=f/30,point=smooth(.85,2,t)*(1-.65*smooth(4.4,5.8,t)),lean=smooth(.65,1.7,t)*(1-.6*smooth(4.6,5.8,t));
 ctx.drawImage(bg,0,0,1080,1920);ctx.fillStyle='rgba(9,23,40,.35)';ctx.fillRect(0,0,1080,1920);
 // Integrated deck scene: railing and perspective planks establish a real floor.
 ctx.fillStyle='#394b57';ctx.beginPath();ctx.moveTo(0,1570);ctx.lineTo(1080,1480);ctx.lineTo(1080,1920);ctx.lineTo(0,1920);ctx.fill();
 ctx.strokeStyle='#172a38';ctx.lineWidth=5;
 for(let y=1600;y<1920;y+=65){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1080,y-90);ctx.stroke()}
 for(let x=-400;x<1500;x+=180){ctx.beginPath();ctx.moveTo(540+(x-540)*.6,1525);ctx.lineTo(x,1920);ctx.stroke()}
 ctx.strokeStyle='#a2b1ad';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(0,1510);ctx.lineTo(1080,1420);ctx.stroke();
 for(let x=30;x<1080;x+=210){ctx.beginPath();ctx.moveTo(x,1510-x/12);ctx.lineTo(x,1380-x/12);ctx.stroke()}
 ctx.fillStyle='rgba(4,12,25,.35)';ctx.beginPath();ctx.ellipse(275,1710,135,20,0,0,Math.PI*2);ctx.fill();
 // Story objects stay in their own sea lane, above and to the right of the performer.
 ctx.drawImage(ship,535,650,260,100);ctx.drawImage(target,760,850,290,110);
 const launch=smooth(1.55,3.65,t);if(t>1.55){
  const tx=650+launch*220,ty=770+launch*85;
  ctx.strokeStyle='#fff4bd';ctx.lineWidth=7;ctx.setLineDash([18,14]);ctx.beginPath();ctx.moveTo(650,760);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.translate(tx,ty);ctx.rotate(.35);ctx.drawImage(torpedo,-90,-19,180,38);ctx.restore();
  ctx.drawImage(cross,840,832,120,120);
 }
 // Anticipation precedes the gesture; chest leads, elbow follows and settles.
 const anticipate=smooth(.3,.65,t)*(1-smooth(.7,1.0,t));
 const lift=smooth(.75,1.4,t)*(1-.85*smooth(4.3,5.65,t));
 const elbow=smooth(.9,1.65,t)*(1-.75*smooth(4.45,5.9,t));
 const settle=t>1.4?Math.sin((t-1.4)*12)*Math.exp(-(t-1.4)*4)*.07:0;
 const blink=((t+.9)%3.2)<.13?1:0;
 const bp=rb.pose({params:{Chest:-.6*lift+.15*anticipate,Head:.7*smooth(.2,.75,t)-.2*lift,ShoulderR:lift+settle-.12*anticipate,ElbowR:elbow,ShoulderL:.18*lift,ElbowL:.28*lift,Blink:blink},time:t,dt:1/30});
 // One shared illustrated rig, fixed scale and root: feet remain planted.
 ctx.drawImage(image(renderPose(body,rb,bp,{supersample:1}).image),-15,615,630,1129);
 // Bold spring captions float inside the composition, not in a separate strip.
 const words=t<1.4?['THIS AMERICAN','WARSHIP']:t<3.5?['FIRED A LIVE','TORPEDO']:t<4.85?['AT ITS OWN','PRESIDENT!']:['EVERY SAILOR','ARRESTED!'];
 const start=t<1.4?0:t<3.5?1.4:t<4.85?3.5:4.85;
 words.forEach((w,i)=>{ctx.save();ctx.translate(540,300+i*110);const age=t-start;const pop=1-Math.exp(-age*14)*Math.cos(age*20);ctx.scale(Math.max(.05,pop),Math.max(.05,pop));ctx.rotate((i?1:-1)*.025);ctx.font='76px Black';ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#071322';ctx.lineWidth=18;ctx.strokeText(w,4,7,940);ctx.fillStyle=i?(t<3.5?'#ffdc35':'#ff6951'):'#fff';ctx.fillText(w,0,0,940);ctx.restore()});
 // Illustrated event badges, spring entrance and hand-drawn emphasis rays.
 const age=t-(t<3.5?.2:3.5),pop=Math.max(0,Math.min(1.12,1-Math.exp(-Math.max(0,age)*8)*Math.cos(Math.max(0,age)*14)));
 ctx.save();ctx.translate(825,1170);ctx.rotate(-.075);ctx.scale(pop,pop);
 ctx.fillStyle='#fff5d8';ctx.strokeStyle='#101e33';ctx.lineWidth=10;ctx.beginPath();ctx.roundRect(-185,-130,370,260,35);ctx.fill();ctx.stroke();
 ctx.drawImage(t<3.5?torpedo:seal,-125,-110,250,t<3.5?90:150);
 ctx.font='40px Black';ctx.textAlign='center';ctx.fillStyle=t<3.5?'#cb312b':'#183c61';ctx.fillText(t<3.5?'LIVE ROUND!':'THE PRESIDENT',0,95,335);ctx.restore();
 if(t>1.5&&t<3.3){ctx.strokeStyle='#ffdc35';ctx.lineWidth=8;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(440+i*35,680-i*12);ctx.lineTo(460+i*45,625-i*25);ctx.stroke()}}
 ctx.save();ctx.translate(250,140);ctx.rotate(-.04);ctx.fillStyle='#ffdb3d';ctx.beginPath();ctx.roundRect(-190,-42,380,84,15);ctx.fill();ctx.font='34px Black';ctx.textAlign='center';ctx.fillStyle='#13283b';ctx.fillText('USS WILLIE DEE',0,12);ctx.restore();
 const raw=ctx.getImageData(0,0,1080,1920).data;
 if(!ff.stdin.write(Buffer.from(raw.buffer,raw.byteOffset,raw.byteLength)))await new Promise<void>((r,j)=>{ff.stdin.once('drain',r);ff.stdin.once('error',j)});
}
ff.stdin.end();await finished;
