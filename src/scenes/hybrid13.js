// Hybrid V2/08 scene engine, preserved. Illustrated art is separate from the articulated cast.
const H13 = {};
const oldSetup13 = ENGINE.setup;
ENGINE.setup = async function(){
 if(oldSetup13)await oldSetup13();
 await document.fonts.load('900 72px Montserrat');
 const files={ocean:'assets/hybrid13/ocean.png',bridge:'assets/hybrid13/bridge.png',brig:'assets/hybrid13/brig.png',destroyer:'benchmarks/09_ai_puppet_20s/cutouts/destroyer_willie.png',iowa:'benchmarks/09_ai_puppet_20s/cutouts/battleship_iowa.png',torpedo:'benchmarks/09_ai_puppet_20s/cutouts/torpedo_live.png',anchor:'benchmarks/09_ai_puppet_20s/cutouts/giant_anchor.png',seal:'benchmarks/09_ai_puppet_20s/cutouts/presidential_seal.png',cuffs:'benchmarks/09_ai_puppet_20s/cutouts/handcuffs_badge.png',burst:'benchmarks/09_ai_puppet_20s/cutouts/explosion_burst.png'};
 await Promise.all(Object.entries(files).map(([k,url])=>new Promise((yes,no)=>{const im=new Image();im.onload=()=>{H13[k]=im;yes()};im.onerror=()=>no(Error(url));im.src=url})));
};
function bg13(key){const im=H13[key];const sc=Math.max(W/im.width,H/im.height);ctx.drawImage(im,(W-im.width*sc)/2,(H-im.height*sc)/2,im.width*sc,im.height*sc)}
function prop13(key,x,y,w,h,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(H13[key],-w/2,-h/2,w,h);ctx.restore()}
function badge13(key,label,x,y,t,start,rot=-.06){if(t<start)return;const u=t-start;const s=1-Math.exp(-u*11)*Math.cos(u*15);ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);ctx.fillStyle='#fff3ca';ctx.strokeStyle='#172433';ctx.lineWidth=7;ctx.beginPath();ctx.roundRect(-150,-113,300,226,22);ctx.fill();ctx.stroke();ctx.drawImage(H13[key],-94,-100,188,142);ctx.font='900 28px Montserrat';ctx.textAlign='center';ctx.fillStyle='#B02E28';ctx.fillText(label,0,83,275);ctx.restore()}
function actor13(cfg){
 // Fixed anchors and consistent side-specific arm chains. No free drifting root or idle arm oscillation.
 drawDoughboy({viseme:'X',blink:autoBlink(T,3.7,cfg.x/1000),bob:0,squash:1,castShadow:true,...cfg});
}
function rails13(y=1580){drawTeakDeck(y,y-330,'');}
// Hook remains an object-led periscope shot, as in 08. No unrelated standing character.
scene('h13_hook',0,4.4,(lt,d,t)=>{
 bg13('ocean');
 prop13('destroyer',260,920,470,165,-.025);
 prop13('iowa',780,780,540,175,.01);
 const p=ease(seg(t,1.72,3.92));
 if(t>1.72){const x=lerp(330,770,p),y=lerp(970,835,p);ctx.strokeStyle='#e9f5ee';ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(285,995);ctx.lineTo(x-45,y+12);ctx.stroke();prop13('torpedo',x,y,210,49,-.27)}
 // Visual targeting, without covering the typography or ships.
 ctx.strokeStyle='rgba(25,52,51,.65)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(550,950,430,0,TAU);ctx.stroke();
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){ctx.beginPath();ctx.moveTo(550+390*Math.cos(a),950+390*Math.sin(a));ctx.lineTo(550+450*Math.cos(a),950+450*Math.sin(a));ctx.stroke()}
 if(t<3.2)badge13('torpedo','LIVE ROUND',795,1430,t,.55);else badge13('seal','THE PRESIDENT',785,1420,t,3.24);
});
scene('h13_arrest',4.4,7.7,(lt,d,t)=>{
 bg13('brig');const react=ease(seg(lt,.15,.65));
 actor13({x:390,y:1330,scale:1.05,role:'sailor',facing:1,mood:'worried',lookX:.55,headTilt:.035*react,
 leftHand:{x:-115,y:40,pose:'relax',bend:1},rightHand:{x:120,y:lerp(45,-65,react),pose:'grip',bend:-1}});
 actor13({x:690,y:1340,scale:1.03,role:'captain',facing:-1,mood:'guilty',lookX:-.45,headTilt:-.035,
 leftHand:{x:-120,y:-65,pose:'grip',bend:1},rightHand:{x:115,y:40,pose:'relax',bend:-1}});
 // Bars are a depth layer, not random lines through every foreground prop.
 ctx.save();ctx.strokeStyle='#25313b';ctx.lineWidth=15;for(let x=170;x<970;x+=148){ctx.beginPath();ctx.moveTo(x,650);ctx.lineTo(x,1695);ctx.stroke()}ctx.restore();
 badge13('cuffs','ENTIRE CREW',820,530,t,4.95,.065);
});
scene('h13_bridge',7.7,12.4,(lt,d,t)=>{
 bg13('bridge');
 // Captain left, helmsman right. Hands remain attached to distinct shoulders and meet the prop.
 const point=ease(seg(lt,.55,1.12)),hold=1-.65*ease(seg(lt,3.5,4.3));
 actor13({x:340,y:1330,scale:1.16,role:'captain',facing:1,mood:'determined',lookX:.65,
 headTilt:-.035*point,bodyLean:-.015*point,
 leftHand:{x:-120,y:55,pose:'relax',bend:1},rightHand:{x:lerp(118,195,point*hold),y:lerp(40,-130,point*hold),pose:point>.5?'point':'relax',bend:-1}});
 actor13({x:785,y:1330,scale:1.05,role:'sailor',facing:-1,mood:'neutral',lookX:-.2,
 leftHand:{x:-115,y:-30,pose:'grip',bend:1},rightHand:{x:110,y:-30,pose:'grip',bend:-1}});
 drawShipWheel(785,1300,118,0);
 // A secondary time/mission graphic occupies the empty wall, never a face.
 ctx.save();ctx.translate(180,560);ctx.rotate(-.04);ctx.fillStyle='#ffda4b';ctx.strokeStyle='#172433';ctx.lineWidth=6;ctx.beginPath();ctx.roundRect(-118,-43,236,86,12);ctx.fill();ctx.stroke();ctx.fillStyle='#172433';ctx.font='900 45px Montserrat';ctx.textAlign='center';ctx.fillText('1943',0,17);ctx.restore();
});
scene('h13_escort',12.4,14.72,(lt,d,t)=>{
 bg13('ocean');prop13('destroyer',235,790,350,125);prop13('iowa',765,800,500,165);rails13(1660);
 actor13({x:355,y:1360,scale:1.10,role:'secret_service',facing:1,mood:'determined',lookX:.3,
 leftHand:{x:-115,y:55,pose:'relax',bend:1},rightHand:{x:110,y:55,pose:'fist',bend:-1}});
 actor13({x:715,y:1320,scale:1.10,role:'fdr',facing:-1,mood:'neutral',wheelchair:true,cigaretteHolder:true,
 leftHand:{x:-120,y:20,pose:'relax',bend:1},rightHand:{x:110,y:20,pose:'relax',bend:-1}});
 badge13('seal','PRESIDENT FDR',810,530,t,12.7);
});
scene('h13_anchor',14.72,20,(lt,d,t)=>{
 bg13('ocean');const drag=ease(seg(t,16.46,18)),hit=ease(seg(t,16.94,17.2));
 prop13('iowa',775,800,520,170);prop13('destroyer',285+drag*100,940,490,172);
 ctx.strokeStyle='#172433';ctx.lineWidth=7;ctx.setLineDash([12,7]);ctx.beginPath();ctx.moveTo(455+drag*70,900);ctx.lineTo(lerp(520,780,drag),850);ctx.stroke();ctx.setLineDash([]);
 prop13('anchor',lerp(520,780,drag),850,115,150,.2*drag);
 if(hit>0){prop13('burst',780,810,260,235);for(let i=0;i<6;i++){const age=seg(t,17,18);const ang=-2.6+i*.42;ctx.save();ctx.translate(780+Math.cos(ang)*age*210,820+Math.sin(ang)*age*170+age*age*90);ctx.rotate(i+age*4);ctx.fillStyle='#ae7954';ctx.fillRect(-18,-5,36,10);ctx.restore()}}
 rails13(1690);const recoil=ease(seg(t,16.94,17.18))*(1-.35*ease(seg(t,18.4,19.5)));
 actor13({x:330,y:1350,scale:1.12,role:'sailor',facing:1,mood:hit>.1?'shock':'neutral',lookX:.7,lookY:-.35,
 headTilt:-.07*recoil,bodyLean:-.025*recoil,
 leftHand:{x:-115,y:lerp(55,-95,recoil),pose:hit>.1?'open':'relax',bend:1},rightHand:{x:lerp(115,135,recoil),y:lerp(55,-150,recoil),pose:hit>.1?'open':'relax',bend:-1}});
 actor13({x:775,y:1370,scale:1.08,role:'captain',facing:-1,mood:hit>.1?'worried':'neutral',lookX:-.45,
 headTilt:.045*recoil,leftHand:{x:-120,y:lerp(55,-115,recoil),pose:'open',bend:1},rightHand:{x:110,y:50,pose:'relax',bend:-1}});
});
// Restore expressive kinetic words, measured to fit an upper safe area. No separate caption strip.
window.overlayHook=(out,t)=>{
 G=out;let active=CAPTION_PHRASES.find(g=>t>=g.start-.025&&t<g.end);if(!active)return;
 const age=Math.max(0,t-active.start),pop=1-Math.exp(-age*18)*Math.cos(age*17);
 const text=active.words.map(w=>w.word.toUpperCase());
 ctx.save();ctx.translate(540,300);ctx.rotate(-.018);ctx.scale(.94+.06*pop,.94+.06*pop);
 ctx.font='900 67px Montserrat';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 const widths=text.map(s=>ctx.measureText(s).width),gap=20,total=widths.reduce((a,b)=>a+b,0)+gap*(text.length-1),fit=Math.min(1,900/total);ctx.scale(fit,fit);
 let x=-total/2;active.words.forEach((w,i)=>{const hot=t>=w.start&&t<w.end,sc=hot?1.09:1;ctx.save();ctx.translate(x+widths[i]/2,hot?-5:0);ctx.scale(sc,sc);ctx.strokeStyle='#111923';ctx.lineWidth=15;ctx.strokeText(text[i],3,6);ctx.lineWidth=11;ctx.strokeText(text[i],0,0);ctx.fillStyle=/LIVE|FIRED|ARRESTED|TORE|APART/.test(text[i])?'#ff6355':/PRESIDENT|WARSHIP|1943|WILLIE|DEE|ANCHOR/.test(text[i])?'#ffe04c':hot?'#8ce8ed':'#fff8ec';ctx.fillText(text[i],0,0);ctx.restore();x+=widths[i]+gap});ctx.restore();
};
