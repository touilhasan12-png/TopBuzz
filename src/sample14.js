import * as T from '../vendor/three.module.js';
// New-reference study: real perspective set; jointed ink limbs; dynamic face atlas.
// Fixed-length analytic 2-link IK, foot-target posing inspired by Stick Motion's
// documented architecture (MIT attribution in docs/sample14). No video generation.
const W=1080,H=1920,DUR=8.5,canvas=document.querySelector('#out'),ctx=canvas.getContext('2d');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#8fd5f1');scene.fog=new T.Fog('#9cdde5',38,140);
const camera=new T.PerspectiveCamera(40,W/H,.1,220);
scene.add(new T.HemisphereLight('#e2f4ff','#b78353',2.1));const sun=new T.DirectionalLight('#ffe8bb',3.0);sun.position.set(-7,13,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:45});sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;scene.add(sun);scene.add(sun.target);
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z), clamp=(a,l=0,h=1)=>Math.max(l,Math.min(h,a)),mix=T.MathUtils.lerp,sm=(a,b,t)=>{let u=clamp((t-a)/(b-a));return u*u*(3-2*u)},ink='#292132';
const mats=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshToonMaterial({color:c,gradientMap:gradient}));return mats.get(c)}
const gradient=new T.DataTexture(new Uint8Array([105,184,237,255]),4,1,T.RedFormat);gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.needsUpdate=true;
function mesh(g,c,p=scene,outline=true){const m=new T.Mesh(g,typeof c==='string'?mat(c):c);m.castShadow=m.receiveShadow=true;p.add(m);if(outline){const shell=new T.Mesh(g,new T.MeshBasicMaterial({color:ink,side:T.BackSide}));shell.scale.setScalar(1.018);m.add(shell)}return m}
function box(x,y,z,c,p=scene){return mesh(new T.BoxGeometry(x,y,z),c,p)}
function ball(r,c,p=scene){return mesh(new T.SphereGeometry(r,24,16),c,p)}
function cyl(r1,r2,h,c,p=scene){return mesh(new T.CylinderGeometry(r1,r2,h,32),c,p)}
function at(m,x,y,z){m.position.set(x,y,z);return m}
function line(a,b,r,c,p=scene){const m=mesh(new T.CylinderGeometry(r,r,1,10),c,p,false);placeSegment(m,a,b);return m}
function placeSegment(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize())}
function curve(points,r,c,p=scene){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(12,points.length*5),r,6,false),c,p,false)}
const loader=new T.TextureLoader();const tex=await loader.loadAsync('../assets/sample14/island_horizon.png');tex.colorSpace=T.SRGBColorSpace;const backdrop=mesh(new T.PlaneGeometry(175,98.5),new T.MeshBasicMaterial({map:tex,fog:false}),scene,false);at(backdrop,0,29,-92);backdrop.castShadow=backdrop.receiveShadow=false;
function rng(n){return (Math.sin(n*137.13+12.45)*43758.5453)%1}function rand(n){return Math.abs(rng(n))}
function canvasTex(w,h,draw){let c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);let tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;return tx}
const wood=canvasTex(256,1024,(c,w,h)=>{c.fillStyle='#d8aa72';c.fillRect(0,0,w,h);for(let i=0;i<100;i++){let x=rand(i)*w;c.strokeStyle=i%3?'#b78755':'#ead0a0';c.globalAlpha=.16+rand(i+50)*.2;c.lineWidth=1+rand(i+2)*2;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+20,300,x-15,600,x+7,h);c.stroke()}c.globalAlpha=1});
const waterTex=canvasTex(1024,1024,(c,w,h)=>{c.fillStyle='#259daa';c.fillRect(0,0,w,h);for(let i=0;i<1000;i++){let x=rand(i+300)*w,y=rand(i+500)*h;c.strokeStyle=i%3?'#7ddbd8':'#147a99';c.globalAlpha=.25;c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+6,y-3,x+15+rand(i)*20,y);c.stroke()}c.globalAlpha=1});waterTex.wrapS=waterTex.wrapT=T.RepeatWrapping;waterTex.repeat.set(16,16);
let water=mesh(new T.PlaneGeometry(240,240,1,1),new T.MeshToonMaterial({map:waterTex,color:'#8ee5de'}),scene,false);water.rotation.x=-Math.PI/2;water.position.y=-1.3;water.receiveShadow=false;
// World set. Deck planks are actual meshes, with grain; perspective/occlusion is real.
const deck=new T.Group();scene.add(deck);
for(let ix=0;ix<17;ix++)for(let iz=0;iz<3;iz++){let m=mesh(new T.BoxGeometry(.47,.13,3.95),new T.MeshToonMaterial({map:wood,color:new T.Color().setHSL(.095,.42,.58+rand(ix*3+iz)*.09)}),deck);at(m,(ix-8)*.48,-.08,(iz-1)*4);for(let j of [-1,1]){let nail=cyl(.016,.016,.008,'#574336',deck);at(nail,(ix-8)*.48,.001,(iz-1)*4+j*1.76)}}
// Broadside bulwark, open gunport at center.
for(let x of [-2.55,2.55]){at(box(2.8,.92,.18,'#be492d',deck),x,.45,-2.8);at(box(2.92,.12,.27,'#e6ac60',deck),x,.96,-2.8);for(let y of [.2,.43,.66])at(box(2.77,.018,.025,'#8a3829',deck),x,y,-2.695)}
at(box(1.32,.18,.18,'#b64b2c',deck),0,.09,-2.8);at(box(1.32,.11,.27,'#e5ae66',deck),0,.96,-2.8);
for(let x of [-3.99,3.99]){at(box(.16,1.0,11.7,'#b95532',deck),x,.48,2.3);at(box(.26,.12,11.8,'#e7b170',deck),x,1.0,2.3)}
function barrel(x,z,s=1){let g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);deck.add(g);let pts=[V(.32,0),V(.37,.08),V(.43,.35),V(.45,.6),V(.42,.9),V(.34,1.12)];let b=mesh(new T.LatheGeometry(pts.map(v=>new T.Vector2(v.x,v.y)),32),new T.MeshToonMaterial({map:wood,color:'#b1783c'}),g);for(let y of [.12,.9]){let t=mesh(new T.TorusGeometry(y<.2?.39:.42,.045,8,32), '#657080',g);t.rotation.x=Math.PI/2;t.position.y=y;for(let i=0;i<8;i++)at(ball(.018,'#bbc4c6',g),Math.cos(i*Math.PI/4)*.43,y,Math.sin(i*Math.PI/4)*.43)}at(cyl(.335,.335,.04,'#926033',g),0,1.115,0);for(let i=0;i<14;i++){let a=i/14*Math.PI*2;curve([V(Math.cos(a)*.34,.04,Math.sin(a)*.34),V(Math.cos(a)*.452,.58,Math.sin(a)*.452),V(Math.cos(a)*.35,1.1,Math.sin(a)*.35)],.006,'#634429',g)}return g}
barrel(2.65,-.5,1.05);barrel(3.22,-1.55,.85);barrel(-3.15,1.45,.9);
// Rope coil and a mast/rigging occupy foreground edges, not character faces.
for(let j=0;j<7;j++){let t=mesh(new T.TorusGeometry(.27+j*.028,.021,6,64),'#b69565',deck,false);t.rotation.x=Math.PI/2;at(t,2.1,.04+j*.012,2.45)}
at(cyl(.12,.17,9,'#ac713a',deck),3.4,4.5,1.9);for(let x of [2.3,2.7,3.1])line(V(x,0,-1.5),V(3.4,8,1.9),.018,'#4c3e38',deck);
const sail=mesh(new T.PlaneGeometry(7,5),new T.MeshToonMaterial({color:'#f8e4bf',side:T.DoubleSide}),deck,false);at(sail,.1,7.8,1.9);sail.rotation.y=-.15;for(let i=0;i<9;i++)line(V(-3.25+i*.8,5.3,1.88),V(-3.25+i*.8,10.3,1.88),.005,'#cbb994',deck);
// Cannon carriage, rolling wheels, lathed barrel with hollow bore.
const gun=new T.Group();deck.add(gun);gun.position.set(.25,0,-.65);
at(box(1.12,.22,1.8,'#b65b31',gun),0,.35,0);for(let x of [-.49,.49]){at(box(.16,.48,1.25,'#ce713b',gun),x,.63,.2);for(let z of [-.53,.65]){let w=cyl(.29,.29,.14,'#a97845',gun);w.rotation.z=Math.PI/2;at(w,x*1.28,.3,z);let h=cyl(.09,.09,.155,'#48515b',gun);h.rotation.z=Math.PI/2;at(h,x*1.29,.3,z)}}
const barrelPivot=new T.Group();gun.add(barrelPivot);at(barrelPivot,0,1.08,.1);barrelPivot.rotation.x=-Math.PI/2+.045;
const profile=[[0,-.9],[.12,-.9],[.24,-.8],[.29,-.58],[.27,-.2],[.24,.5],[.27,1.28],[.26,1.4],[.16,1.4],[.15,1.25],[.15,-.5],[0,-.59]].map(([x,y])=>new T.Vector2(x,y));mesh(new T.LatheGeometry(profile,48),new T.MeshPhongMaterial({color:'#89939e',shininess:45,specular:'#c4d1e0'}),barrelPivot);
for(let y of [-.55,.05,1.25]){let m=mesh(new T.TorusGeometry(y>1?.267:.278,.018,8,48),'#444857',barrelPivot);m.rotation.x=Math.PI/2;m.position.y=y}at(ball(.105,'#616c7c',barrelPivot),0,-1,0);
// Barrel local +Y is world -Z; breech local -Y is world +Z.
const fuse=curve([V(.25,1.35,.12),V(.29,1.45,.25),V(.28,1.40,.38)],.018,'#5a4538',deck);
// 3D ember is fixed to fuse tip until ignition. Lit torch is parented to solved hand.
const ember=ball(.04,'#ffbe45',deck);at(ember,.28,1.4,.38);const emberLight=new T.PointLight('#ffad31',0,3);ember.add(emberLight);
function makeFace(bandana){let c=document.createElement('canvas');c.width=c.height=512;const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;let m=new T.Mesh(new T.PlaneGeometry(1.18,1.18),new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.03,side:T.DoubleSide}));m.castShadow=false;return {c,tx,m,bandana}}
function drawFace(f,emotion,t){const c=f.c.getContext('2d');c.clearRect(0,0,512,512);c.lineJoin='round';c.lineCap='round';c.lineWidth=15;c.strokeStyle=ink;let gr=c.createLinearGradient(110,80,390,450);gr.addColorStop(0,'#fffdf0');gr.addColorStop(1,'#eadbe2');c.fillStyle=gr;c.beginPath();c.arc(256,267,225,0,Math.PI*2);c.fill();c.stroke();
 c.save();c.beginPath();c.arc(256,267,219,0,Math.PI*2);c.clip();c.fillStyle=f.bandana;c.fillRect(0,0,512,153);c.strokeStyle=ink;c.lineWidth=12;c.beginPath();c.moveTo(0,153);c.quadraticCurveTo(260,137,512,153);c.stroke();c.fillStyle='#ffe9c9';for(let y of [64,110])for(let x=55;x<500;x+=70){c.beginPath();c.arc(x+(y===110?25:0),y,8,0,7);c.fill()}c.restore();
 c.strokeStyle=ink;c.fillStyle=ink;c.lineWidth=13;const blink=(Math.abs(t-1.05)<.055||Math.abs(t-2.78)<.05||Math.abs(t-7.9)<.055);
 if(emotion==='brace'){for(let x of [185,325]){c.beginPath();c.moveTo(x-25,235);c.lineTo(x+6,255);c.lineTo(x-25,275);c.stroke()}c.beginPath();c.moveTo(218,347);c.quadraticCurveTo(257,305,294,347);c.stroke()}
 else if(emotion==='shock'){for(let x of [183,328]){c.fillStyle='#fffdf0';c.beginPath();c.ellipse(x,254,39,45,0,0,7);c.fill();c.stroke();c.fillStyle=ink;c.beginPath();c.arc(x+7,260,13,0,7);c.fill()}c.fillStyle=ink;c.beginPath();c.ellipse(257,355,24,30,0,0,7);c.fill()}
 else {for(let x of [184,326]){if(blink){c.beginPath();c.moveTo(x-23,260);c.lineTo(x+23,260);c.stroke()}else{c.beginPath();c.ellipse(x,261,13,23,0,0,7);c.fill();c.beginPath();c.moveTo(x-32,225);c.lineTo(x+26,emotion==='focus'?235:222);c.stroke()}}c.beginPath();c.moveTo(224,340);c.quadraticCurveTo(262,emotion==='smile'?382:357,296,336);c.stroke()}
 f.tx.needsUpdate=true;
}
function torsoTexture(color){return canvasTex(256,512,(c,w,h)=>{c.fillStyle='#f6f1dc';c.fillRect(0,0,w,h);c.fillStyle=color;for(let y=0;y<h;y+=100)c.fillRect(0,y,w,52);c.fillStyle='#2c2638';c.fillRect(0,430,w,44);c.fillStyle='#dfbc62';c.fillRect(103,435,50,34);c.fillStyle='#2c2638';c.fillRect(113,441,30,22)})}
const limbGeo=new T.CylinderGeometry(.024,.024,1,10),limbMat=new T.MeshToonMaterial({color:ink});
function makeActor(x,z,color){const root=new T.Group();scene.add(root);root.position.set(x,0,z);const a={root,x,z,color};a.body=mesh(new T.CapsuleGeometry(.28,.64,6,20),new T.MeshToonMaterial({map:torsoTexture(color)}),root);a.body.scale.z=.66;
 a.head=new T.Group();root.add(a.head);a.face=makeFace(color);a.head.add(a.face.m);a.limbs=[];for(let i=0;i<8;i++){let m=new T.Mesh(limbGeo,limbMat);m.castShadow=true;root.add(m);a.limbs.push(m)}a.hands=[ball(.054,ink,root),ball(.054,ink,root)];a.feet=[line(V(),V(.15,0,0),.025,ink,root),line(V(),V(.15,0,0),.025,ink,root)];
 a.torch=new T.Group();scene.add(a.torch);a.stick=line(V(),V(.43,-.28,-.02),.023,'#775337',a.torch);a.flame=ball(.09,'#ffc54f',a.torch);a.flame.scale.set(.6,1.6,.6);a.flame.position.set(.43,-.28,-.02);a.fireLight=new T.PointLight('#ffb947',1,2);a.flame.add(a.fireLight);a.torch.visible=false;
 // Contact ellipsoid is world-grounded; actual cast shadows add directional weight.
 const tx=canvasTex(128,128,(c)=>{let g=c.createRadialGradient(64,64,2,64,64,64);g.addColorStop(0,'rgba(32,25,32,.40)');g.addColorStop(1,'rgba(32,25,32,0)');c.fillStyle=g;c.fillRect(0,0,128,128)});a.shadow=new T.Mesh(new T.PlaneGeometry(1.3,.8),new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));a.shadow.rotation.x=-Math.PI/2;at(a.shadow,x,.007,z);scene.add(a.shadow);return a}
// General 3D two-bone IK, fixed lengths and fixed bend direction (pole).
function ik(start,end,L1,L2,pole){let dir=end.clone().sub(start),d=clamp(dir.length(),.0001,L1+L2-.00001);dir.normalize();let along=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-along*along));let perp=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();return start.clone().addScaledVector(dir,along).addScaledVector(perp,h)}
function actorPose(a,opts,t){const {x=a.x,z=a.z,hip=1.06,lean=0,handL=V(-.49,1.25,.1),handR=V(.48,1.25,.1),footL=V(x-.2,.035,z),footR=V(x+.2,.035,z),emotion='focus',torch=false}=opts;a.root.position.set(x,0,z);const local=p=>p.clone().sub(V(x,0,z));
 let pelvis=V(0,hip,0),chest=V(lean,hip+.54,0);a.body.position.copy(pelvis).add(chest).multiplyScalar(.5).add(V(0,.13,0));a.body.rotation.z=-lean*.9;a.head.position.set(lean,hip+1.37,0);a.head.quaternion.copy(camera.quaternion);drawFace(a.face,emotion,t);
 let shL=chest.clone().add(V(-.26,.23,0)),shR=chest.clone().add(V(.26,.23,0));let endpoints=[local(footL),local(footR),handL,handR],starts=[pelvis.clone().add(V(-.13,0,0)),pelvis.clone().add(V(.13,0,0)),shL,shR];
 for(let i=0;i<4;i++){let knee=ik(starts[i],endpoints[i],i<2?.59:.53,i<2?.59:.53,i<2?V(0,0,.8):V(i===2?-.6:.6,-.3,.5));placeSegment(a.limbs[i*2],starts[i],knee);placeSegment(a.limbs[i*2+1],knee,endpoints[i]);if(i>=2)a.hands[i-2].position.copy(endpoints[i]);else placeSegment(a.feet[i],endpoints[i],endpoints[i].clone().add(V(.13,0,.02)))}
 a.torch.visible=torch;a.torch.position.copy(a.root.position).add(handR);a.flame.scale.y=1.5+.25*Math.sin(t*35);a.shadow.position.set(x,.008,z);
}
const pirate=makeActor(-1.05,.65,'#d84a37');const mate=makeActor(2.0,-1.15,'#3977be');mate.torch.visible=false;
// Target vessel is actual 3D hull, sail, mast and a second deck, not a flat sticker.
const enemy=new T.Group();scene.add(enemy);enemy.position.set(0,0,-35);
const hullShape=new T.Shape();hullShape.moveTo(-2,-.1);hullShape.lineTo(-1.7,-1.3);hullShape.quadraticCurveTo(0,-2,1.7,-1.3);hullShape.lineTo(2,-.1);hullShape.closePath();const hull=mesh(new T.ExtrudeGeometry(hullShape,{depth:7,bevelEnabled:false}), '#763527',enemy);at(hull,0,0,-3.5);
at(box(3.9,.12,7.4,'#d7a064',enemy),0,.08,0);for(let x of [-1.95,1.95]){at(box(.12,.65,7.3,'#a9412e',enemy),x,.39,0);at(box(.2,.12,7.4,'#e4ae61',enemy),x,.75,0)}at(cyl(.09,.13,7,'#986235',enemy),0,3.5,0);let ensail=mesh(new T.PlaneGeometry(3.8,4.4),new T.MeshToonMaterial({color:'#f7dfb5',side:T.DoubleSide}),enemy);at(ensail,0,4,0);ensail.rotation.y=.22;line(V(-2,6.25,0),V(2,6.25,0),.045,'#835631',enemy);for(let x of [-1.9,1.9])line(V(x,.2,-2.7),V(0,7,0),.013,ink,enemy);
const target=makeActor(.65,-34.3,'#7c55ab');target.root.scale.setScalar(.8); // target pose maintained in a separate close shot
// Animated fire / smoke puffs, all deterministic and world-positioned.
const smoke=[];for(let i=0;i<16;i++){let s=ball(.22,'#eeeae0');s.material=new T.MeshToonMaterial({color:i%3?'#f5eee0':'#d3d2cf',transparent:true});s.children[0].material=new T.MeshBasicMaterial({color:'#777486',side:T.BackSide,transparent:true});smoke.push(s)}
const flash=new T.Group();scene.add(flash);for(let i=0;i<7;i++){let m=ball(.19,i%2?'#ff9c36':'#ffe88c',flash);at(m,(rand(i)-.5)*.55,(rand(i+9)-.5)*.55,-rand(i+3)*.7)}
const shot=ball(.115,new T.MeshPhongMaterial({color:'#222c3e',shininess:70}));
const sparks=[];for(let i=0;i<18;i++)sparks.push(line(V(),V(.06,.03,.02),.008,'#ffcf5c'));
const splinters=[];for(let i=0;i<32;i++){let g=new T.ConeGeometry(.035+rand(i)*.035,.22+rand(i+8)*.55,3);splinters.push(mesh(g,i%2?'#d8ac71':'#8e5431'))}
const trails=[];for(let i=0;i<9;i++)trails.push(line(V(),V(0,0,1),.006,'#dbfff5'));
const boomLight=new T.PointLight('#ffbf50',0,9);scene.add(boomLight);
let captions=[ [0,.9,'One spark.'],[.9,2.45,'One cannonball.'],[2.45,3.1,'But the real'],[3.1,4.2,'danger'],[4.2,5.25,"wasn’t the iron."],[5.25,6.1,'It was'],[6.1,8.5,'the flying wood.'] ];
// Phrase schedule adjusted to spoken track duration in build script; no generated video.
const cue=await fetch('../assets/sample14/cues.json').then(r=>r.json()).catch(()=>null);if(cue)captions=cue;
function text(t){let cap=captions.find(c=>t>=c[0]&&t<c[1]);if(!cap)return;ctx.save();let u=clamp((t-cap[0])/.13),s=1+.07*Math.sin(u*Math.PI)*Math.exp(-u);ctx.translate(W/2,H*.735);ctx.scale(s,s);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 59px Mont,Arial';ctx.lineJoin='round';ctx.lineWidth=12;ctx.strokeStyle='#251f32';ctx.strokeText(cap[2],0,0);ctx.fillStyle='#fffdf4';ctx.fillText(cap[2],0,0);ctx.restore()}
const FIRE=3.35,CHASE=4.65,HIT=6.35;
function update(t){t=clamp(t,0,DUR);const recoil=t>=FIRE?.38*Math.exp(-(t-FIRE)*2.5)*(1-Math.exp(-(t-FIRE)*45)):0;gun.position.z=-.65+recoil;
 // Main camera performs a constrained arc; the set, not a crop, supplies parallax.
 if(t<CHASE){let u=sm(0,4.4,t);camera.position.set(mix(4.6,2.8,u),mix(3.5,3.9,u),mix(7.5,6.7,u));camera.lookAt(-.05,1.35,-.35)}
 else if(t<HIT){let u=(t-CHASE)/(HIT-CHASE);camera.position.set(.85,2.2+u*.2,mix(-5,-26,u));camera.lookAt(.2,1.7,-35)}
 else {let u=sm(HIT,HIT+1.7,t);camera.position.set(mix(3.4,2.5,u),3.3,mix(-27,-28.2,u));camera.lookAt(.2,1.65,-34.7)}
 let shake=t>=FIRE&&t<FIRE+.35?Math.exp(-(t-FIRE)*10)*.07:0;camera.position.x+=Math.sin(t*110)*shake;camera.position.y+=Math.sin(t*87)*shake;camera.updateMatrixWorld();
 let reach=sm(.35,1.65,t)*(1-sm(2.15,2.65,t)),step1=sm(2.30,2.70,t),step2=sm(2.80,3.17,t);let x=-1.05-.2*step1-.2*step2,hip=1.06-.09*sm(2.8,3.2,t)+.04*sm(3.9,4.5,t);let fl=V(-1.25-.40*step1,.035+.14*Math.sin(step1*Math.PI),.65+.10*step1),fr=V(-.85-.4*step2,.035+.14*Math.sin(step2*Math.PI),.65+.1*step2);
 let hr=V(mix(.50,.90,reach),mix(1.35,1.68,reach),mix(.05,-.25,reach)); // torch tip reaches fuse at x .28 y1.40 z .38
 let ear=sm(2.6,3.2,t);hr.lerp(V(.42,2.46,.06),ear);let hl=V(-.48,1.3,.05).lerp(V(-.38,2.48,.05),ear);
 actorPose(pirate,{x,hip,lean:-.08*ear,handL:hl,handR:hr,footL:fl,footR:fr,emotion:t>=3.1&&t<3.95?'brace':t>=3.95?'smile':'focus',torch:t<2.55},t);
 // HandR local (.90,1.68,-.25) plus root(-1.05,0,.65) + torch tip(.43,-.28,-.02) = fuse(.28,1.4,.38).
 actorPose(mate,{handL:V(-.45,1.35,.02),handR:t>2.7?V(.35,2.45,0):V(.48,1.3,0),emotion:t>3&&t<3.9?'brace':'focus'},t+.3);
 actorPose(target,{x:.65,z:-34.3,hip:t>HIT?.92:1.06,handL:t>HIT?V(-.55,2.3,.1):V(-.45,1.3,0),handR:t>HIT?V(.55,2.3,.1):V(.45,1.3,0),footL:V(.4,.035,-34.3),footR:V(.9,.035,-34.3),emotion:t>HIT?'shock':'focus'},t+.6);
 target.root.scale.setScalar(1);target.root.position.y=.08;target.shadow.position.y=.15;
 // Main deck out of view in impact shot, target remains a separate grounded character.
 const burn=clamp((t-1.65)/(FIRE-1.65));ember.visible=t>1.65&&t<FIRE;ember.scale.setScalar(.7+.3*Math.sin(t*65));emberLight.intensity=ember.visible?2:0;fuse.visible=t<FIRE;
 flash.visible=t>=FIRE&&t<FIRE+.2;flash.position.set(.25,1.2,-2.13);flash.scale.setScalar(.3+sm(FIRE,FIRE+.09,t)*2.2);boomLight.position.copy(flash.position);boomLight.intensity=flash.visible?14*(1-clamp((t-FIRE)/.2)):0;
 for(let i=0;i<smoke.length;i++){let a=t-FIRE-i*.025,vis=a>0&&a<1.8;let s=smoke[i];s.visible=vis;s.position.set(.25+(rand(i)-.5)*a*1.5,1.2+a*(.35+rand(i+4)*.3),-2.2-a*(.7+rand(i+1)));s.scale.setScalar(.25+a*(1.4+rand(i+3)));s.material.opacity=clamp(1-a/1.8);s.children[0].material.opacity=s.material.opacity*.65}
 for(let i=0;i<sparks.length;i++){let a=t-1.7,show=t>1.7&&t<FIRE&&i<7||t>=FIRE&&t<FIRE+.25;sparks[i].visible=show;if(show){let phase=((t*8+i*.13)%1),center=t<FIRE?V(.28,1.4,.38):V(.25,1.2,-2.13);let d=V(Math.cos(i*2.3)*phase*.16,Math.sin(i*2.3)*phase*.18,0);placeSegment(sparks[i],center.clone().add(d),center.clone().add(d.clone().multiplyScalar(1.4)).add(V(.02,.02,0)))}}
 let a=t-FIRE;shot.visible=t>=FIRE&&t<HIT;let bz=t<CHASE?mix(-2.1,-5,clamp(a/(CHASE-FIRE))):mix(-5,-31.34,clamp((t-CHASE)/(HIT-CHASE)));shot.position.set(.25,mix(1.45,.55,sm(CHASE,HIT,t))+.18*Math.sin(clamp(a/3)*Math.PI),bz);
 if(t>=CHASE&&t<HIT){for(let i=0;i<trails.length;i++){trails[i].visible=true;let theta=i/9*Math.PI*2;placeSegment(trails[i],shot.position.clone().add(V(Math.cos(theta)*.15,Math.sin(theta)*.15,1)),shot.position.clone().add(V(Math.cos(theta)*.45,Math.sin(theta)*.45,3.5)))} }else trails.forEach(m=>m.visible=false);
 for(let i=0;i<splinters.length;i++){let dt=t-HIT;let s=splinters[i];s.visible=dt>=0&&dt<2.15;if(s.visible){let vx=(rand(i+70)-.5)*7,vy=1.8+rand(i+30)*3.5,vz=1.3+rand(i+90)*2.3;s.position.set(.25+vx*dt,.55+vy*dt-3.8*dt*dt,-31.34+vz*dt);s.rotation.set(i+dt*8,i*.4+dt*7,dt*9)} }
 // A broken plank opens at impact; not a full-deck random particle overlay.
 enemy.children.filter(m=>m.userData.breakaway).forEach(m=>m.visible=t<HIT);
 waterTex.offset.x=t*.004;waterTex.offset.y=t*.006;renderer.render(scene,camera);ctx.clearRect(0,0,W,H);ctx.drawImage(renderer.domElement,0,0);text(t);
 // Discreet illustration-style impact annotation, tied to the event, not a title card.
 if(t>=HIT&&t<HIT+.28){let p=V(.2,1.6,-31.5).project(camera);ctx.save();ctx.translate((p.x+1)*W/2,(1-p.y)*H/2);ctx.rotate(-.13);ctx.font='900 58px Mont,Arial';ctx.strokeStyle='#342537';ctx.lineWidth=12;ctx.fillStyle='#ffdf65';ctx.strokeText('CRACK!',-120,0);ctx.fillText('CRACK!',-120,0);ctx.restore()}
}
// Flag part of target broadside as breakaway, with thin planks initially blocking opening.
for(let i=0;i<3;i++){let m=at(box(1.05,.16,.08,'#bc603a',enemy),.25,.2+i*.17,3.66);m.userData.breakaway=true}
await document.fonts.ready;window.DUR=DUR;window.PROJECT={audio:'assets/sample14/mix.wav'};window.renderAt=(t,type='image/jpeg',q=.94)=>{update(t);return canvas.toDataURL(type,q)};window.ready=true;
if(!location.search.includes('render')){const a=new Audio('assets/sample14/mix.wav');let start=null;function frame(ms){if(start===null)start=ms;update(((ms-start)/1000)%DUR);requestAnimationFrame(frame)}requestAnimationFrame(frame);document.body.addEventListener('click',()=>{start=performance.now();a.currentTime=0;a.play()})}
