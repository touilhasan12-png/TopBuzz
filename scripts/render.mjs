import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';
const meta=JSON.parse(fs.readFileSync('public/pilot-meta.json','utf8'));
const inputProps={meta};
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx')});
const chromiumOptions={gl:'swangle'};
const composition=await selectComposition({serveUrl,id:'HormuzPilot',inputProps,chromiumOptions,timeoutInMilliseconds:120000});
if(composition.width!==1920||composition.height!==1080||composition.fps!==30)throw new Error('Composition format mismatch');
const fractions=[.04,.16,.27,.38,.50,.62,.74,.85,.96];
for(let i=0;i<fractions.length;i++){
 const frame=Math.min(composition.durationInFrames-1,Math.round(fractions[i]*composition.durationInFrames));
 await renderStill({serveUrl,composition,inputProps,frame,output:path.resolve(`out/proof-${String(i+1).padStart(2,'0')}.png`),imageFormat:'png',chromiumOptions,timeoutInMilliseconds:120000});
 console.log('Proof frame',i+1,'of',fractions.length,'rendered');
}
let step=-1;
await renderMedia({serveUrl,composition,inputProps,outputLocation:path.resolve('out/hormuz-pilot-1080p.mp4'),codec:'h264',crf:18,pixelFormat:'yuv420p',x264Preset:'medium',audioCodec:'aac',audioBitrate:'192k',audioSampleRate:48000,imageFormat:'png',concurrency:2,chromiumOptions,timeoutInMilliseconds:120000,onProgress:({progress})=>{const s=Math.floor(progress*10);if(s!==step){step=s;console.log('Render progress:',Math.min(100,s*10)+'%');}}});
console.log('Remote pilot render completed. Human factual, visual, and audio approval is still pending.');
