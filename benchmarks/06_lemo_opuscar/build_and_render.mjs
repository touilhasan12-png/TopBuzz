import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import ffmpegPath from 'ffmpeg-static';

import { shotAt, rhubarbAt } from '../shared/story_helper.mjs';
import { stampCaptionRGBA } from '../shared/rgba_caption_overlay.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEMO_ROOT = process.env.LEMO_ROOT || '/tmp/gh_engines/lemo_opuscar';

const lemo = await import(pathToFileURL(path.join(LEMO_ROOT, 'core/lib.js')).href);
const { clamp, lerp, ss, eio, back, spring, mulberry, vnoise, TAU, monotone, track } = lemo;

const W = 1080;
const H = 1920;
const FPS = 30;
const TOTAL_FRAMES = 600;
const INK = '#121622';

// Fritsch–Carlson monotone cubic camera tracks per shot (`lemo-opuscar/core/lib.js`)
const CAM_SHOT = [
  track([[0, [0, 0, 1.00]], [2.2, [-14, -18, 1.05]], [4.8, [10, -28, 1.09]]]),
  track([[0, [0, -10, 1.04]], [1.2, [0, 8, 1.00]], [5.0, [-12, -16, 1.06]]]),
  track([[0, [-24, 0, 1.00]], [2.5, [8, -12, 1.04]], [5.0, [26, -20, 1.08]]]),
  track([[0, [0, 12, 1.00]], [2.0, [14, -16, 1.06]], [5.2, [-10, -26, 1.11]]]),
];

const TORPEDO_X = monotone([[0, 150], [1.6, 420], [3.4, 710], [4.8, 900]]);

function solveIK2D(sx, sy, tx, ty, l1, l2, bend = 1) {
  let dx = tx - sx;
  let dy = ty - sy;
  let d = Math.hypot(dx, dy) || 1;
  const maxD = (l1 + l2) * 0.99;
  const minD = Math.abs(l1 - l2) + 6;
  if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
  if (d < minD) { dx *= minD / d; dy *= minD / d; d = minD; }
  const a0 = Math.atan2(dy, dx);
  const ca = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a1 = a0 + bend * Math.acos(ca);
  return {
    ex: sx + Math.cos(a1) * l1,
    ey: sy + Math.sin(a1) * l1,
    wx: sx + dx,
    wy: sy + dy,
  };
}

function drawCapsuleLimb(ctx, x0, y0, x1, y1, w0, w1, fill, dark) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0 * 0.5, y0 + ny * w0 * 0.5);
  ctx.lineTo(x1 + nx * w1 * 0.5, y1 + ny * w1 * 0.5);
  ctx.arc(x1, y1, w1 * 0.5, ang + Math.PI * 0.5, ang - Math.PI * 0.5, true);
  ctx.lineTo(x0 - nx * w0 * 0.5, y0 - ny * w0 * 0.5);
  ctx.arc(x0, y0, w0 * 0.5, ang - Math.PI * 0.5, ang + Math.PI * 0.5, true);
  ctx.closePath();
  const g = ctx.createLinearGradient(x0 - 20, y0 - 20, x1 + 20, y1 + 20);
  g.addColorStop(0, fill);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

function drawLemoCharacter(ctx, cfg, t) {
  const {
    x, y, scale = 1.0, role = 'captain', facing = 1,
    mood = 'shock', viseme = { code: 'A', open: 0.1 },
    lh = [-125, 40], rh = [125, 40], walkPhase = 0, hatBounce = 0,
  } = cfg;

  const pal = {
    captain: { coat: '#24385A', dark: '#152238', trim: '#E8BD54', cap: '#F7F9FC' },
    sailor:  { coat: '#2B4674', dark: '#192B49', trim: '#FFFFFF', cap: '#F7F9FC' },
    mp:      { coat: '#4D5940', dark: '#303827', trim: '#F2F5FA', cap: '#D9534F' },
    fdr:     { coat: '#1E2940', dark: '#111827', trim: '#A93843', cap: '#C6CFDE' },
  }[role] || { coat: '#24385A', dark: '#152238', trim: '#E8BD54', cap: '#F7F9FC' };

  const bounce = Math.sin(t * 5.2) * 3.5 + (viseme.open || 0) * -5.0;
  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.scale(scale, scale);

  // Ground contact shadow
  ctx.fillStyle = 'rgba(8, 12, 22, 0.30)';
  ctx.beginPath();
  ctx.ellipse(0, 252, 118, 24, 0, 0, TAU);
  ctx.fill();

  // Animated legs
  for (const s of [-1, 1]) {
    const stride = Math.sin(walkPhase + (s > 0 ? Math.PI : 0)) * (walkPhase ? 34 : 0);
    const lift = Math.max(0, Math.cos(walkPhase + (s > 0 ? Math.PI : 0))) * (walkPhase ? -18 : 0);
    drawCapsuleLimb(ctx, s * 40, 108, s * 44 + stride, 238 + lift, 34, 26, pal.coat, pal.dark);
    ctx.fillStyle = '#141821';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.ellipse(s * 44 + stride + facing * 12, 244 + lift, 30, 15, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  // Back arm
  const armBack = solveIK2D(-84, -96, lh[0], lh[1], 92, 86, 1);
  drawCapsuleLimb(ctx, -84, -96, armBack.ex, armBack.ey, 32, 27, pal.coat, pal.dark);
  drawCapsuleLimb(ctx, armBack.ex, armBack.ey, armBack.wx, armBack.wy, 26, 22, pal.coat, pal.dark);
  ctx.fillStyle = '#FAFBFD';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(armBack.wx, armBack.wy, 18, 0, TAU);
  ctx.fill();
  ctx.stroke();

  // Torso coat with painterly cel gradient
  const tg = ctx.createLinearGradient(-85, -135, 85, 120);
  tg.addColorStop(0, pal.coat);
  tg.addColorStop(0.7, pal.coat);
  tg.addColorStop(1, pal.dark);
  ctx.fillStyle = tg;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.8;
  ctx.beginPath();
  ctx.roundRect(-86, -132, 172, 248, 36);
  ctx.fill();
  ctx.stroke();

  // Collar + brass buttons
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-34, -132);
  ctx.lineTo(0, -62);
  ctx.lineTo(34, -132);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    for (const bx of [-24, 24]) {
      ctx.fillStyle = pal.trim;
      ctx.beginPath();
      ctx.arc(bx, -30 + i * 42, 6.5, 0, TAU);
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
  }

  // Front arm
  const armFront = solveIK2D(84, -96, rh[0], rh[1], 92, 86, -1);
  drawCapsuleLimb(ctx, 84, -96, armFront.ex, armFront.ey, 32, 27, pal.coat, pal.dark);
  drawCapsuleLimb(ctx, armFront.ex, armFront.ey, armFront.wx, armFront.wy, 26, 22, pal.coat, pal.dark);
  ctx.fillStyle = '#FAFBFD';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(armFront.wx, armFront.wy, 18, 0, TAU);
  ctx.fill();
  ctx.stroke();

  // Round cartoon head with airbrush sphere shading
  const hy = -224;
  const R = 88;
  const hg = ctx.createRadialGradient(-26 * facing, hy - 30, 8, 0, hy, R * 1.08);
  hg.addColorStop(0, '#FFFFFF');
  hg.addColorStop(0.62, '#EAEEF7');
  hg.addColorStop(1, '#B8C3D6');
  ctx.fillStyle = hg;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.arc(0, hy, R, 0, TAU);
  ctx.fill();
  ctx.stroke();

  // Eyes + blink + gaze
  const blink = (t % 3.3) < 0.11 ? 0.12 : 1.0;
  for (const ex of [-29, 29]) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.ellipse(ex + facing * 5, hy - 10, 21, 24 * blink, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (blink > 0.3) {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(ex + facing * 9, hy - 9, 8.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex + facing * 6, hy - 13, 3.2, 0, TAU);
      ctx.fill();
    }
    // Expressive brow
    const tilt = mood === 'panic' ? (ex < 0 ? -0.28 : 0.28) : mood === 'angry' ? (ex < 0 ? 0.26 : -0.26) : -0.06;
    ctx.save();
    ctx.translate(ex + facing * 5, hy - 42 - (viseme.open || 0) * 6);
    ctx.rotate(tilt);
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-19, 0);
    ctx.lineTo(19, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Rhubarb mouth
  const openH = Math.max(5, (viseme.open || 0.12) * 34 + (mood === 'panic' ? 8 : 0));
  const openW = viseme.code === 'E' || viseme.code === 'F' ? 16 : 27;
  ctx.fillStyle = '#6B1D26';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.ellipse(facing * 6, hy + 36, openW, openH * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (openH > 10) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(facing * 6 - openW * 0.65, hy + 36 - openH * 0.48, openW * 1.3, 7);
    ctx.fillStyle = '#D96B78';
    ctx.beginPath();
    ctx.ellipse(facing * 6, hy + 36 + openH * 0.28, openW * 0.55, openH * 0.22, 0, 0, TAU);
    ctx.fill();
  }

  // Naval cap with lemo-opuscar `spring()` rebound
  if (role !== 'fdr') {
    ctx.save();
    ctx.translate(0, hy - R * 0.78 - hatBounce * 26);
    ctx.rotate(hatBounce * 0.14);
    ctx.fillStyle = pal.cap;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.ellipse(0, -16, 86, 26, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#182338';
    ctx.fillRect(-62, -6, 124, 18);
    ctx.strokeRect(-62, -6, 124, 18);
    ctx.fillStyle = pal.trim;
    ctx.beginPath();
    ctx.ellipse(facing * 12, 12, 74, 11, 0, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawFrame(ctx, f) {
  const t = f / FPS;
  const shot = shotAt(t);
  const { index: si, localT, u } = shot;
  const vis = rhubarbAt(t);
  const [camX, camY, camZ] = CAM_SHOT[si](localT);

  ctx.save();
  ctx.translate(W * 0.5, H * 0.5);
  ctx.scale(camZ, camZ);
  ctx.translate(-W * 0.5 + camX, -H * 0.5 + camY);

  // Sky / room background gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (si === 1) {
    sky.addColorStop(0, '#1B2538');
    sky.addColorStop(1, '#2D3A52');
  } else if (si === 2) {
    sky.addColorStop(0, '#0D1B36');
    sky.addColorStop(1, '#23406E');
  } else {
    sky.addColorStop(0, '#5E97CE');
    sky.addColorStop(0.56, '#A8CBEB');
    sky.addColorStop(0.57, '#1D4D7A');
    sky.addColorStop(1, '#123252');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(-120, -120, W + 240, H + 240);

  // Organic `vnoise` ocean waves or deck planks
  if (si !== 1) {
    for (let r = 0; r < 6; r++) {
      const wy = 980 + r * 54;
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = -80; x <= W + 80; x += 40) {
        const off = (vnoise(x * 0.02 + t * 2.2 + r * 3.1) - 0.5) * 18;
        if (x === -80) ctx.moveTo(x, wy + off);
        else ctx.lineTo(x, wy + off);
      }
      ctx.stroke();
    }
  }

  // Steel ship deck foreground
  const deckGrad = ctx.createLinearGradient(0, 1280, 0, H + 120);
  deckGrad.addColorStop(0, si === 2 ? '#5C4028' : '#5F6C7E');
  deckGrad.addColorStop(1, si === 2 ? '#3B2818' : '#3C4654');
  ctx.fillStyle = deckGrad;
  ctx.fillRect(-120, 1290, W + 240, 760);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-120, 1290);
  ctx.lineTo(W + 120, 1290);
  ctx.stroke();

  if (si === 0) {
    // Periscope reticle + USS Iowa + racing live torpedo
    ctx.save();
    ctx.strokeStyle = 'rgba(18, 22, 34, 0.82)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(540, 520, 340, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(180, 520); ctx.lineTo(900, 520);
    ctx.moveTo(540, 160); ctx.lineTo(540, 880);
    ctx.stroke();

    // Battleship silhouette
    ctx.fillStyle = '#465468';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(270, 545);
    ctx.lineTo(810, 545);
    ctx.lineTo(775, 595);
    ctx.lineTo(305, 595);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillRect(455, 470, 155, 75);
    ctx.strokeRect(455, 470, 155, 75);

    // Live torpedo wake (`monotone` curve from `lemo-opuscar`)
    const tx = TORPEDO_X(localT);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(tx - 180, 700);
    ctx.lineTo(tx, 700);
    ctx.stroke();
    ctx.fillStyle = '#C93B3B';
    ctx.beginPath();
    ctx.ellipse(tx + 24, 700, 34, 12, 0, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    const spr = 1 - spring(localT, 8, 0.28);
    drawLemoCharacter(ctx, {
      x: 540, y: 1320, scale: 1.15, role: 'sailor', facing: 1, mood: 'panic', viseme: vis,
      lh: [-155, -135 - Math.sin(t * 9) * 18],
      rh: [155, -135 + Math.sin(t * 9) * 18],
      hatBounce: Math.abs(spr) * 0.9 + Math.abs(Math.sin(t * 6)) * 0.22,
    }, t);
  } else if (si === 1) {
    // Brig porthole + slamming iron cell bars (`spring` impact!)
    ctx.fillStyle = '#5BB5F5';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(650, 390, 95, 0, TAU);
    ctx.fill(); ctx.stroke();

    drawLemoCharacter(ctx, {
      x: 345, y: 1330, scale: 1.05, role: 'sailor', facing: 1, mood: 'panic', viseme: vis,
      lh: [-115, -30], rh: [120, -45],
    }, t);
    drawLemoCharacter(ctx, {
      x: 745, y: 1330, scale: 1.05, role: 'mp', facing: -1, mood: 'angry', viseme: { code: 'B', open: 0.15 },
      lh: [-145, -20 + Math.sin(t * 4) * 16], rh: [110, 60],
    }, t);

    const drop = (1 - clamp(back(clamp(localT / 0.55), 1.4), 0, 1.15)) * -900;
    ctx.save();
    ctx.translate(0, drop);
    ctx.fillStyle = '#738296';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    for (let i = 0; i < 6; i++) {
      const bx = 135 + i * 74;
      ctx.fillRect(bx, 430, 18, 1130);
      ctx.strokeRect(bx, 430, 18, 1130);
    }
    ctx.fillRect(110, 440, 460, 28);
    ctx.strokeRect(110, 440, 460, 28);
    ctx.restore();
  } else if (si === 2) {
    // Sweeping searchlights + Captain + FDR on deck
    const sweep = Math.sin(t * 1.7) * 150;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 238, 162, 0.24)';
    ctx.beginPath();
    ctx.moveTo(260, 980); ctx.lineTo(70 + sweep, -80); ctx.lineTo(360 + sweep, -80); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(820, 980); ctx.lineTo(640 - sweep, -80); ctx.lineTo(930 - sweep, -80); ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawLemoCharacter(ctx, {
      x: 340 + u * 55, y: 1330, scale: 1.05, role: 'captain', facing: 1, mood: 'shock', viseme: vis,
      walkPhase: t * 5.4,
      lh: [-110, 40 + Math.sin(t * 5.4) * 35], rh: [125, -45],
    }, t);
    drawLemoCharacter(ctx, {
      x: 760, y: 1345, scale: 1.05, role: 'fdr', facing: -1, mood: 'neutral', viseme: { code: 'C', open: 0.2 },
      lh: [-115, 35], rh: [125, -20],
    }, t);
  } else {
    // Swinging giant iron anchor + sparks + panicked Captain
    const swing = Math.sin(t * 4.2) * 0.28;
    ctx.save();
    ctx.translate(540, 110);
    ctx.rotate(swing);
    ctx.fillStyle = '#334154';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(-22, 0, 44, 430, 10);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-125, 85, 250, 34, 10);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-210, 340);
    ctx.lineTo(0, 480);
    ctx.lineTo(210, 340);
    ctx.lineTo(168, 302);
    ctx.lineTo(0, 412);
    ctx.lineTo(-168, 302);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    const rng = mulberry(1000 + f);
    for (let i = 0; i < 12; i++) {
      const sx = 320 + rng() * 440;
      const sy = 560 + rng() * 240;
      ctx.strokeStyle = i % 2 ? '#FFD34E' : '#FF6B2B';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (rng() - 0.5) * 48, sy + (rng() - 0.5) * 48);
      ctx.stroke();
    }

    drawLemoCharacter(ctx, {
      x: 540, y: 1345, scale: 1.15, role: 'captain', facing: 1, mood: 'panic', viseme: vis,
      lh: [-150, -150 - Math.sin(t * 8) * 20],
      rh: [150, -150 + Math.sin(t * 8) * 20],
      hatBounce: 0.35 + Math.abs(Math.sin(t * 7)) * 0.35,
    }, t);
  }

  ctx.restore();
}

async function main() {
  const outMp4 = process.env.OUT_MP4 || '/tmp/out_video/06_LemoOpuscar_FilmEngine_20s.mp4';
  const audioPath = process.env.AUDIO_WAV || path.resolve(__dirname, '../shared/audio_20s.wav');
  fs.mkdirSync(path.dirname(outMp4), { recursive: true });

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const ff = spawn(ffmpegPath, [
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
    await new Promise((resolve, reject) => {
      const ok = ff.stdin.write(rgba, (err) => (err ? reject(err) : undefined));
      if (ok) resolve();
      else ff.stdin.once('drain', resolve);
    });
  }
  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg exited ${c}`))));
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
