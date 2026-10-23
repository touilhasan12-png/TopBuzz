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
const body=await loadModelFile(path.join(root,'benchmarks/11_drawn_performance/sailor.r2d.json'));
const rb=new Rig(body.model);
const bg=await loadImage(path.join(base,'raw/bg_01_ocean_battle.png'));
GlobalFonts.registerFromPath(path.join(root,'assets/fonts/Montserrat-Black.otf'),'Black');
const c=createCanvas(1080,1920),ctx=c.getContext('2d');
const temp=createCanvas(800,1050),tc=temp.getContext('2d');
function image(im:any){temp.width=im.width;temp.height=im.height;tc.putImageData(new ImageData(new Uint8ClampedArray(im.data.buffer,im.data.byteOffset,im.data.byteLength),im.width,im.height),0,0);return temp}
const smooth=(a:number,b:number,t:number)=>{let u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u)};
const out='/tmp/out_video/11_Drawn_Character_Performance_6s.mp4';fs.mkdirSync(path.dirname(out),{recursive:true});
const ff=spawn(ffmpeg!,['-y','-f','rawvideo','-pixel_format','rgba','-video_size','1080x1920','-framerate','30','-i','pipe:0','-i',path.join(root,'benchmarks/shared/audio_20s.wav'),'-t','6','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
const finished=new Promise<void>((res,rej)=>{ff.on('error',rej);ff.on('close',n=>n===0?res():rej(Error('ffmpeg '+n)))});
ff.stdin.on('error',e=>{console.error(e);process.exitCode=1});
for(let f=0;f<180;f++){
 let t=f/30,point=smooth(.85,2,t)*(1-.65*smooth(4.4,5.8,t)),lean=smooth(.65,1.7,t)*(1-.6*smooth(4.6,5.8,t));
 ctx.drawImage(bg,0,0,1080,1920);ctx.fillStyle='rgba(9,23,40,.35)';ctx.fillRect(0,0,1080,1920);
 // Absolute safe layout: scene 250..1400; text 1480..1770; no character translation.
 ctx.save();ctx.beginPath();ctx.rect(30,240,1020,1210);ctx.clip();
 ctx.fillStyle='rgba(4,12,25,.35)';ctx.beginPath();ctx.ellipse(490,1432,155,20,0,0,Math.PI*2);ctx.fill();
 // Anticipation precedes the gesture; chest leads, elbow follows and settles.
 const anticipate=smooth(.3,.65,t)*(1-smooth(.7,1.0,t));
 const lift=smooth(.75,1.4,t)*(1-.85*smooth(4.3,5.65,t));
 const elbow=smooth(.9,1.65,t)*(1-.75*smooth(4.45,5.9,t));
 const settle=t>1.4?Math.sin((t-1.4)*12)*Math.exp(-(t-1.4)*4)*.07:0;
 const blink=((t+.9)%3.2)<.13?1:0;
 const bp=rb.pose({params:{Chest:-.6*lift+.15*anticipate,Head:.7*smooth(.2,.75,t)-.2*lift,ShoulderR:lift+settle-.12*anticipate,ElbowR:elbow,ShoulderL:.18*lift,ElbowL:.28*lift,Blink:blink},time:t,dt:1/30});
 // One shared illustrated rig, fixed scale and root: feet remain planted.
 ctx.drawImage(image(renderPose(body,rb,bp,{supersample:1}).image),150,245,690,1236);
 ctx.restore();
 ctx.fillStyle='#101e33';ctx.fillRect(0,1450,1080,470);
 const words=t<1.2?['THIS AMERICAN','WARSHIP']:t<3.6?['FIRED A LIVE','TORPEDO']:['AT ITS OWN','PRESIDENT'];
 words.forEach((w,i)=>{ctx.save();ctx.translate(540,1570+i*115);const age=t-(t<1.2?0:t<3.6?1.2:3.6);const pop=1+.06*Math.exp(-age*6)*Math.sin(age*15);ctx.scale(pop,pop);ctx.font='64px Black';ctx.textAlign='center';ctx.strokeStyle='#000';ctx.lineWidth=12;ctx.strokeText(w,0,0,940);ctx.fillStyle=i?'#ffda39':'#fff';ctx.fillText(w,0,0,940);ctx.restore()});
 ctx.fillStyle='#ffd640';ctx.font='36px Black';ctx.textAlign='center';ctx.fillText('LIVE TORPEDO',540,180);
 const raw=ctx.getImageData(0,0,1080,1920).data;
 if(!ff.stdin.write(Buffer.from(raw.buffer,raw.byteOffset,raw.byteLength)))await new Promise<void>((r,j)=>{ff.stdin.once('drain',r);ff.stdin.once('error',j)});
}
ff.stdin.end();await finished;
