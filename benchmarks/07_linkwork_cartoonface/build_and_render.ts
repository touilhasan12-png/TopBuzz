import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import ffmpegPath from 'ffmpeg-static';

import { shotAt, rhubarbAt } from '../shared/story_helper.mjs';
import { stampCaptionRGBA } from '../shared/rgba_caption_overlay.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINKWORK_ROOT = process.env.LINKWORK_ROOT || '/tmp/gh_engines/linkwork';
const CFACE_ROOT = process.env.CFACE_ROOT || '/tmp/gh_engines/cartoon_face';

const linkwork: any = await import(pathToFileURL(path.join(LINKWORK_ROOT, 'src/index.ts')).href);
const { place, solve, RIGS } = linkwork;
const figureRig = RIGS.figure;

// Load genuine 101-landmark emotion archetypes from `christophschuhmann/cartoon-face-generator`
function loadArchetype(slugFile: string) {
  const full = path.join(CFACE_ROOT, 'output/emonet/archetypes', slugFile);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const ARCH = {
  surprise: loadArchetype('13_surprise.json'),
  fear: loadArchetype('22_fear.json'),
  distress: loadArchetype('23_distress.json'),
  focus: loadArchetype('14_concentration.json'),
  pride: loadArchetype('10_pride.json'),
};

const W = 1080;
const H = 1920;
const FPS = 30;
const TOTAL_FRAMES = 600;
const INK = '#121622';
const TAU = Math.PI * 2;

function kpXY(a: any, b: any, blend: number, name: string, headR: number, facing: number): [number, number] {
  const pa = a.keypoints[name]?.xy || [0.5, 0.5];
  const pb = b.keypoints[name]?.xy || pa;
  const nx = pa[0] + (pb[0] - pa[0]) * blend;
  const ny = pa[1] + (pb[1] - pa[1]) * blend;
  // Map normalized [0..1] 1450x750 face landmark space onto cartoon head circle
  const lx = (nx - 0.5) * headR * 2.15 * facing;
  const ly = (ny - 0.44) * headR * 1.55;
  return [lx, ly];
}

function strokeChain(ctx: any, pts: [number, number][], close = false, fill?: string, lw = 4.2) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function drawCartoonFace101(ctx: any, archA: any, archB: any, blend: number, headR: number, facing: number, vis: any, t: number) {
  const P = (n: string) => kpXY(archA, archB, blend, n, headR, facing);
  const blink = (t % 3.2) < 0.11 ? 0.12 : 1.0;

  // Brows from 5 real landmarks per side
  for (const side of ['left', 'right']) {
    strokeChain(ctx, [
      P(`${side}_brow_outer`),
      P(`${side}_brow_outer_arch`),
      P(`${side}_brow_apex`),
      P(`${side}_brow_inner_arch`),
      P(`${side}_brow_inner`),
    ], false, undefined, 5.2);

    // Eye contour from 8 real landmarks
    const eyePts = [
      P(`${side}_eye_inner_corner`),
      P(`${side}_eye_upper_inner`),
      P(`${side}_eye_upper_center`),
      P(`${side}_eye_upper_outer`),
      P(`${side}_eye_outer_corner`),
      P(`${side}_eye_lower_outer_corner`),
      P(`${side}_eye_lower_center`),
      P(`${side}_eye_lower_inner_corner`),
    ];
    const cy = eyePts.reduce((s, q) => s + q[1], 0) / eyePts.length;
    const blinked = eyePts.map(([x, y]) => [x, cy + (y - cy) * blink] as [number, number]);
    strokeChain(ctx, blinked, true, '#FFFFFF', 3.6);

    if (blink > 0.3) {
      const pup = P(`${side}_pupil_center`);
      const hi = P(`${side}_highlight_center`);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(pup[0], pup[1], headR * 0.085, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(hi[0], hi[1], headR * 0.032, 0, TAU);
      ctx.fill();
    }
  }

  // Nose from 3 landmarks
  strokeChain(ctx, [P('nose_lower'), P('nose_center'), P('nose_tip')], false, undefined, 3.4);

  // Mouth + Rhubarb lip-sync opening mapped onto real mouth landmarks
  const openExtra = ((vis.open ?? 0.12) * 0.42) * headR;
  const upper = [
    P('mouth_right_corner'),
    P('mouth_upper_right'),
    P('mouth_upper_center'),
    P('mouth_upper_left'),
    P('mouth_left_corner'),
  ];
  const lower = [
    P('mouth_lower_left'),
    P('mouth_lower_center'),
    P('mouth_lower_right'),
  ].map(([x, y]) => [x, y + openExtra] as [number, number]);

  strokeChain(ctx, [...upper, ...lower], true, '#6E1E28', 3.8);
}

function drawCapsule(ctx: any, a: [number, number], b: [number, number], w: number, c0: string, c1: string) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const nx = -Math.sin(ang) * w * 0.5;
  const ny = Math.cos(ang) * w * 0.5;
  ctx.beginPath();
  ctx.moveTo(a[0] + nx, a[1] + ny);
  ctx.lineTo(b[0] + nx, b[1] + ny);
  ctx.arc(b[0], b[1], w * 0.5, ang + Math.PI * 0.5, ang - Math.PI * 0.5, true);
  ctx.lineTo(a[0] - nx, a[1] - ny);
  ctx.arc(a[0], a[1], w * 0.5, ang - Math.PI * 0.5, ang + Math.PI * 0.5, true);
  ctx.closePath();
  const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function drawLinkworkOfficer(ctx: any, opts: {
  hip: [number, number];
  scale: number;
  facing: 1 | -1;
  poseName: string;
  handLTarget: [number, number];
  handRTarget: [number, number];
  footLTarget?: [number, number];
  footRTarget?: [number, number];
  coat: [string, string];
  archA: any;
  archB: any;
  blend: number;
  vis: any;
  t: number;
  hatColor?: string;
}) {
  const { hip, scale, facing, poseName, handLTarget, handRTarget, coat, archA, archB, blend, vis, t } = opts;
  const basePose = figureRig.poses[poseName] || figureRig.poses.stand;
  // Linkwork's +Y points UP in maths coordinates; convert cleanly to screen Y-down
  const placed = place(figureRig, basePose, [0, 0], scale, 0, facing);
  const targets: any[] = [
    { joint: 'hand_l', at: [(handLTarget[0] - hip[0]), -(handLTarget[1] - hip[1])], chain: 2 },
    { joint: 'hand_r', at: [(handRTarget[0] - hip[0]), -(handRTarget[1] - hip[1])], chain: 2 },
  ];
  if (opts.footLTarget) targets.push({ joint: 'foot_l', at: [opts.footLTarget[0] - hip[0], -(opts.footLTarget[1] - hip[1])], chain: 2 });
  if (opts.footRTarget) targets.push({ joint: 'foot_r', at: [opts.footRTarget[0] - hip[0], -(opts.footRTarget[1] - hip[1])], chain: 2 });

  const solved = solve(figureRig, placed, targets, {}, 50);
  const J = (name: string): [number, number] => {
    const v = solved.joints.get(name)!;
    return [hip[0] + v[0], hip[1] - v[1]];
  };

  const pHip = J('hip');
  const pNeck = J('neck');
  const pCrown = J('crown');
  const pKneeR = J('knee_r'), pFootR = J('foot_r');
  const pKneeL = J('knee_l'), pFootL = J('foot_l');
  const pElbR = J('elbow_r'), pHandR = J('hand_r');
  const pElbL = J('elbow_l'), pHandL = J('hand_l');

  // Ground shadow
  ctx.fillStyle = 'rgba(10, 14, 24, 0.28)';
  ctx.beginPath();
  ctx.ellipse(pHip[0], Math.max(pFootL[1], pFootR[1]) + 14, 108, 22, 0, 0, TAU);
  ctx.fill();

  // Back leg & arm
  drawCapsule(ctx, pHip, pKneeR, 30, coat[0], coat[1]);
  drawCapsule(ctx, pKneeR, pFootR, 26, coat[0], coat[1]);
  drawCapsule(ctx, pNeck, pElbR, 27, coat[0], coat[1]);
  drawCapsule(ctx, pElbR, pHandR, 23, coat[0], coat[1]);

  // Naval coat torso around spine
  drawCapsule(ctx, [pNeck[0], pNeck[1] + 10], [pHip[0], pHip[1] + 12], 128, coat[0], coat[1]);

  // Brass buttons
  for (let i = 0; i < 3; i++) {
    const by = pNeck[1] + 55 + i * 38;
    for (const dx of [-20, 20]) {
      ctx.fillStyle = '#E8BE56';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(pHip[0] + dx, by, 6, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Front leg & arm + gloves
  drawCapsule(ctx, pHip, pKneeL, 30, coat[0], coat[1]);
  drawCapsule(ctx, pKneeL, pFootL, 26, coat[0], coat[1]);
  drawCapsule(ctx, pNeck, pElbL, 27, coat[0], coat[1]);
  drawCapsule(ctx, pElbL, pHandL, 23, coat[0], coat[1]);

  for (const hp of [pHandL, pHandR]) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.arc(hp[0], hp[1], 16, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  for (const fp of [pFootL, pFootR]) {
    ctx.fillStyle = '#141822';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.ellipse(fp[0] + facing * 12, fp[1], 28, 14, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  // Head anchored to Linkwork `neck -> crown` bone + real 101-landmark `cartoon-face-generator` rig!
  const headCenter: [number, number] = [(pNeck[0] + pCrown[0]) * 0.5, pNeck[1] - 74];
  const headR = 86;
  ctx.save();
  ctx.translate(headCenter[0], headCenter[1]);
  const hg = ctx.createRadialGradient(-24 * facing, -26, 8, 0, 0, headR * 1.05);
  hg.addColorStop(0, '#FFFFFF');
  hg.addColorStop(0.68, '#EAEFF8');
  hg.addColorStop(1, '#B8C3D6');
  ctx.fillStyle = hg;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.8;
  ctx.beginPath();
  ctx.arc(0, 0, headR, 0, TAU);
  ctx.fill();
  ctx.stroke();

  drawCartoonFace101(ctx, archA, archB, blend, headR, facing, vis, t);

  // Naval cap
  if (opts.hatColor !== 'none') {
    ctx.fillStyle = opts.hatColor || '#F7F9FC';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.ellipse(0, -headR * 0.92, 84, 24, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#18243A';
    ctx.fillRect(-60, -headR * 0.80, 120, 17);
    ctx.strokeRect(-60, -headR * 0.80, 120, 17);
  }
  ctx.restore();
}

function drawFrame(ctx: any, f: number) {
  const t = f / FPS;
  const { index: si, localT, u } = shotAt(t);
  const vis = rhubarbAt(t);

  // Clean layered vector naval backdrop
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (si === 1) { g.addColorStop(0, '#1B2436'); g.addColorStop(1, '#2D3A50'); }
  else if (si === 2) { g.addColorStop(0, '#0E1C38'); g.addColorStop(1, '#21406D'); }
  else { g.addColorStop(0, '#5B95CE'); g.addColorStop(0.56, '#A6CAEB'); g.addColorStop(0.57, '#1B4D7B'); g.addColorStop(1, '#123354'); }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = si === 2 ? '#593E27' : '#5D6A7C';
  ctx.fillRect(0, 1320, W, H - 1320);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 1320);
  ctx.lineTo(W, 1320);
  ctx.stroke();

  const blend = 0.5 + 0.5 * Math.sin(t * 2.6);

  if (si === 0) {
    // Periscope reticle + USS Iowa + racing torpedo
    ctx.strokeStyle = 'rgba(18,22,34,0.8)';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(540, 490, 320, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#435166';
    ctx.fillRect(310, 490, 460, 56);
    ctx.strokeRect(310, 490, 460, 56);
    const tx = 180 + u * 700;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(tx - 160, 640); ctx.lineTo(tx, 640); ctx.stroke();

    drawLinkworkOfficer(ctx, {
      hip: [540, 1260], scale: 3.2, facing: 1, poseName: 'cheer',
      handLTarget: [365, 980 - Math.sin(t * 8) * 35],
      handRTarget: [715, 980 + Math.sin(t * 8) * 35],
      coat: ['#2A4673', '#192B49'], archA: ARCH.surprise, archB: ARCH.fear, blend, vis, t,
    });
  } else if (si === 1) {
    ctx.fillStyle = '#60B7F7';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(650, 380, 90, 0, TAU); ctx.fill(); ctx.stroke();

    drawLinkworkOfficer(ctx, {
      hip: [345, 1270], scale: 3.0, facing: 1, poseName: 'shrug',
      handLTarget: [235, 1080], handRTarget: [465, 1060],
      coat: ['#2A4673', '#192B49'], archA: ARCH.fear, archB: ARCH.distress, blend, vis, t,
    });
    drawLinkworkOfficer(ctx, {
      hip: [745, 1270], scale: 3.0, facing: -1, poseName: 'point',
      handLTarget: [590, 1090 + Math.sin(t * 4) * 20], handRTarget: [860, 1180],
      coat: ['#4D5A40', '#2E3726'], archA: ARCH.focus, archB: ARCH.distress, blend, vis: { open: 0.1 }, t, hatColor: '#D9534F',
    });

    const dropY = Math.min(0, -850 + localT * 1900);
    ctx.fillStyle = '#738296';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(130 + i * 74, 430 + dropY, 18, 1120);
      ctx.strokeRect(130 + i * 74, 430 + dropY, 18, 1120);
    }
  } else if (si === 2) {
    const sw = Math.sin(t * 1.6) * 140;
    ctx.fillStyle = 'rgba(255,238,165,0.22)';
    ctx.beginPath(); ctx.moveTo(250, 960); ctx.lineTo(80 + sw, 0); ctx.lineTo(350 + sw, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(830, 960); ctx.lineTo(650 - sw, 0); ctx.lineTo(920 - sw, 0); ctx.closePath(); ctx.fill();

    const step = Math.sin(t * 5.6);
    const cx = 310 + u * 90;
    drawLinkworkOfficer(ctx, {
      hip: [cx, 1270 - Math.abs(step) * 14], scale: 3.0, facing: 1, poseName: step > 0 ? 'walk_a' : 'walk_b',
      handLTarget: [cx - 85 - step * 40, 1140], handRTarget: [cx + 95 + step * 40, 1070],
      footLTarget: [cx - step * 52, 1525], footRTarget: [cx + step * 52, 1525],
      coat: ['#24385A', '#152238'], archA: ARCH.focus, archB: ARCH.fear, blend, vis, t,
    });
    drawLinkworkOfficer(ctx, {
      hip: [770, 1280], scale: 3.0, facing: -1, poseName: 'stand',
      handLTarget: [655, 1150], handRTarget: [875, 1120],
      coat: ['#1E2940', '#111827'], archA: ARCH.pride, archB: ARCH.focus, blend, vis: { open: 0.16 }, t, hatColor: 'none',
    });
  } else {
    const ang = Math.sin(t * 4.0) * 0.26;
    ctx.save();
    ctx.translate(540, 110);
    ctx.rotate(ang);
    ctx.fillStyle = '#334154';
    ctx.fillRect(-20, 0, 40, 410); ctx.strokeRect(-20, 0, 40, 410);
    ctx.fillRect(-120, 80, 240, 32); ctx.strokeRect(-120, 80, 240, 32);
    ctx.beginPath();
    ctx.moveTo(-200, 330); ctx.lineTo(0, 465); ctx.lineTo(200, 330);
    ctx.lineTo(160, 295); ctx.lineTo(0, 400); ctx.lineTo(-160, 295);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    drawLinkworkOfficer(ctx, {
      hip: [540, 1280], scale: 3.2, facing: 1, poseName: 'leap',
      handLTarget: [365, 960 - Math.sin(t * 9) * 35],
      handRTarget: [715, 960 + Math.sin(t * 9) * 35],
      coat: ['#24385A', '#152238'], archA: ARCH.surprise, archB: ARCH.distress, blend, vis, t,
    });
  }
}

async function main() {
  const outMp4 = process.env.OUT_MP4 || '/tmp/out_video/07_Linkwork_CartoonFace_20s.mp4';
  const audioPath = process.env.AUDIO_WAV || path.resolve(__dirname, '../shared/audio_20s.wav');
  fs.mkdirSync(path.dirname(outMp4), { recursive: true });

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const ff = spawn(ffmpegPath!, [
    '-y',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-i', audioPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest',
    outMp4,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    drawFrame(ctx, f);
    const rgba = canvas.data();
    stampCaptionRGBA(rgba, f / FPS);
    await new Promise<void>((resolve, reject) => {
      const ok = ff.stdin.write(rgba, (err) => (err ? reject(err) : undefined));
      if (ok) resolve();
      else ff.stdin.once('drain', () => resolve());
    });
  }
  ff.stdin.end();
  await new Promise<void>((resolve, reject) => {
    ff.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg exited ${c}`))));
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
