import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { ImageData } from '@napi-rs/canvas';

import {
  captionAt,
  rhubarbAt as visemeAt,
  shotAt,
} from '../shared/story_helper.mjs';

function audioRmsAt(t) {
  const v = visemeAt(t);
  return v.open ?? 0.45;
}
import { stampCaptionRGBA } from '../shared/rgba_caption_overlay.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLAUDE_LIB_DIR =
  process.env.CLAUDE_ANIM_LIB ||
  '/tmp/gh_engines/claude_anim/plugins/claude-animation/skills/claude-animation/lib';

const coreMod = await import(pathToFileURL(path.join(CLAUDE_LIB_DIR, 'core.mjs')).href);
const texMod = await import(pathToFileURL(path.join(CLAUDE_LIB_DIR, 'textures.mjs')).href);
const penMod = await import(pathToFileURL(path.join(CLAUDE_LIB_DIR, 'pen.mjs')).href);
const fxMod = await import(pathToFileURL(path.join(CLAUDE_LIB_DIR, 'fx.mjs')).href);
const chibiMod = await import(pathToFileURL(path.join(CLAUDE_LIB_DIR, 'rigs/chibi.mjs')).href);

const {
  createCanvas,
  clamp,
  lerp,
  eOut,
  ellipse,
  stroke,
  fill,
  line,
  poly,
  smooth,
  rrect,
  hatch: coreHatch,
  INK,
} = coreMod;
const { fibrePaper, lightBands, nightSky, moon, sun, filmFinish } = texMod;
const { Pen } = penMod;
const { shake, burstParticles, ring, landDust } = fxMod;
const { chibi } = chibiMod;

function hatch(ctx, pts, { step = 18, a = 0.25, color = 'rgba(20,30,45,0.25)', w = 1.6 } = {}) {
  coreHatch(ctx, () => poly(ctx, pts), a, step, color, w, 1.0, [-300, -300, 1400, 2200]);
}

function penFillPoly(g, pts, color, nameSeed, over = true) {
  const pen = new Pen(g);
  pen.begin(`wash_${nameSeed}`, 1);
  pen.wash(pts, color, { alpha: 0.92, over });
  pen.end();
}

function penPath(g, pts, { w = 4.5, seed = 1, color = INK, boil = 0, t = 0 } = {}) {
  const pen = new Pen(g);
  pen.begin(`ink_${seed}`, 1, { boil, t });
  pen.stroke(pts, { w, color, taper: 0.45, jit: 1.4, smooth: false });
  pen.end();
}

const W = 1080;
const H = 1920;
const FPS = 30;
const TOTAL_FRAMES = 600;

function mapVisemeToChibiMouth(v) {
  switch (v) {
    case 'A':
    case 'X':
      return 'M';
    case 'B':
      return 'flat';
    case 'C':
      return 'E';
    case 'D':
      return 'open';
    case 'E':
      return 'O';
    case 'F':
      return 'U';
    case 'G':
      return 'A';
    case 'H':
      return 'A';
    default:
      return 'rest';
  }
}

/**
 * Hand-inked editorial WWII Naval Headgear using claude-animation-skill's `smooth`, `hatch`, & `pen`
 * seated seamlessly on top of `chibi()`'s head coordinate space.
 */
function drawNavalCap(ctx, x, groundY, scale, headTilt, kind = 'captain', flip = false) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale * (flip ? -1 : 1), scale);
  ctx.translate(0, -176);
  ctx.rotate(headTilt || 0);
  ctx.translate(0, -58);

  if (kind === 'dixie') {
    const crown = [
      [-62, -46],
      [-74, -92],
      [0, -104],
      [74, -92],
      [62, -46],
    ];
    smooth(ctx, crown);
    fill(ctx, '#FBF9F2');
    hatch(ctx, crown, { step: 11, a: 0.65, color: 'rgba(65,85,115,0.22)', w: 1.5 });
    smooth(ctx, crown);
    stroke(ctx, 4.0);
    const band = rrect(-64, -56, 128, 16, 5);
    poly(ctx, band);
    fill(ctx, '#ECE6D6');
    stroke(ctx, 3.4);
  } else {
    const isMP = kind === 'mp';
    const crown = [
      [-64, -54],
      [-86, -96],
      [0, -112],
      [86, -96],
      [64, -54],
    ];
    smooth(ctx, crown);
    fill(ctx, isMP ? '#F7F5EE' : '#F4F1E6');
    hatch(ctx, crown, { step: 12, a: -0.6, color: 'rgba(30,45,75,0.18)', w: 1.5 });
    smooth(ctx, crown);
    stroke(ctx, 4.0);

    // Band + gold/crimson insignia
    const band = rrect(-66, -60, 132, 18, 4);
    poly(ctx, band);
    fill(ctx, isMP ? '#C93838' : '#192338');
    stroke(ctx, 3.6);

    // Visor
    const visor = [
      [-64, -44],
      [64, -44],
      [54, -26],
      [0, -21],
      [-54, -26],
    ];
    smooth(ctx, visor);
    fill(ctx, '#121824');
    stroke(ctx, 3.6);

    if (!isMP) {
      ellipse(ctx, 0, -82, 11, 12);
      fill(ctx, '#E5B23A');
      stroke(ctx, 2.8);
    }
  }
  ctx.restore();
}

/**
 * Pre-bake four cold-press editorial paper + cross-hatched watercolor backdrops (100% pure code)
 * using upstream `fibrePaper(W, H)` + `hatch()` + `penFillPoly()` + `penPath()`!
 */
const PAPER_BASE = fibrePaper(W, H, '#F4ECD8');
const applyFilmFinish = filmFinish(W, H, { grain: 0.10, flicker: 0.015, vignette: 0.16 });

function bakeBackgrounds() {
  return [0, 1, 2, 3].map((shotIdx) => {
    const c = createCanvas(W, H);
    const g = c.getContext('2d');
    g.drawImage(PAPER_BASE, 0, 0);

    if (shotIdx === 0) {
      // SHOT 0: editorial sea wash + USS Iowa distant silhouette + inked wooden bridge deck
      const wash = g.createLinearGradient(0, 0, 0, 1320);
      wash.addColorStop(0, 'rgba(20, 62, 102, 0.78)');
      wash.addColorStop(0.55, 'rgba(42, 108, 152, 0.58)');
      wash.addColorStop(1, 'rgba(218, 232, 238, 0.35)');
      g.fillStyle = wash;
      g.fillRect(0, 0, W, 1320);

      // Sea horizon + USS Iowa inked silhouette
      const seaBox = [
        [0, 930],
        [W, 930],
        [W, 1320],
        [0, 1320],
      ];
      poly(g, seaBox);
      fill(g, 'rgba(18, 58, 92, 0.55)');
      hatch(g, seaBox, { step: 18, a: 0.12, color: 'rgba(12, 32, 54, 0.28)', w: 1.8 });

      const iowaHull = [
        [130, 930],
        [950, 930],
        [910, 868],
        [175, 868],
      ];
      penFillPoly(g, iowaHull, '#485A6E', 901);
      penPath(g, [...iowaHull, iowaHull[0]], { w: 4.5, seed: 902, color: INK });
      const iowaSuper = [
        [360, 868],
        [720, 868],
        [680, 775],
        [410, 775],
      ];
      penFillPoly(g, iowaSuper, '#5D7086', 903);
      penPath(g, [...iowaSuper, iowaSuper[0]], { w: 4.0, seed: 904, color: INK });

      // Cross-hatched teak wood deck stage
      const deck = [
        [0, 1290],
        [W, 1290],
        [W, H],
        [0, H],
      ];
      poly(g, deck);
      fill(g, '#D7C3A3');
      hatch(g, deck, { step: 26, a: 0.02, color: 'rgba(85, 60, 35, 0.24)', w: 2.0 });
      penPath(g, [[0, 1290], [W, 1290]], { w: 6.5, seed: 905, color: INK });
    } else if (shotIdx === 1) {
      // SHOT 1: Naval Base Brig — moody slate wash + riveted steel bulkhead + brass porthole
      const wash = g.createLinearGradient(0, 0, 0, H);
      wash.addColorStop(0, 'rgba(36, 48, 66, 0.86)');
      wash.addColorStop(0.68, 'rgba(64, 78, 98, 0.72)');
      wash.addColorStop(1, 'rgba(30, 38, 50, 0.90)');
      g.fillStyle = wash;
      g.fillRect(0, 0, W, H);

      const wall = [
        [40, 120],
        [W - 40, 120],
        [W - 40, 1340],
        [40, 1340],
      ];
      hatch(g, wall, { step: 22, a: -0.72, color: 'rgba(15, 22, 34, 0.26)', w: 1.8 });

      // Porthole window
      ellipse(g, 540, 420, 128, 128);
      fill(g, '#52657C');
      stroke(g, 6.0);
      ellipse(g, 540, 420, 96, 96);
      fill(g, '#7FAAD0');
      stroke(g, 4.5);

      const floor = [
        [0, 1340],
        [W, 1340],
        [W, H],
        [0, H],
      ];
      poly(g, floor);
      fill(g, '#8D95A2');
      hatch(g, floor, { step: 24, a: 0.4, color: 'rgba(20,26,36,0.25)', w: 2.0 });
      penPath(g, [[0, 1340], [W, 1340]], { w: 6.5, seed: 910, color: INK });
    } else if (shotIdx === 2) {
      // SHOT 2: North Atlantic Night — native claude-animation-skill `nightSky` + `moon` + flagship convoy
      const ns = nightSky(W, 1320, 17);
      g.drawImage(ns, 0, 0);
      moon(g, 835, 250, 74);

      const ship = [
        [100, 920],
        [980, 920],
        [930, 845],
        [150, 845],
      ];
      penFillPoly(g, ship, '#2C3D55', 921);
      penPath(g, [...ship, ship[0]], { w: 4.8, seed: 922, color: INK });
      const bridge = [
        [340, 845],
        [730, 845],
        [690, 735],
        [390, 735],
      ];
      penFillPoly(g, bridge, '#3B4F6B', 923);
      penPath(g, [...bridge, bridge[0]], { w: 4.2, seed: 924, color: INK });

      const deck = [
        [0, 1320],
        [W, 1320],
        [W, H],
        [0, H],
      ];
      poly(g, deck);
      fill(g, '#9AA8B8');
      hatch(g, deck, { step: 24, a: -0.15, color: 'rgba(18, 30, 48, 0.28)', w: 2.0 });
      penPath(g, [[0, 1320], [W, 1320]], { w: 6.5, seed: 925, color: INK });
    } else {
      // SHOT 3: Sister Ship Anchor Scrape — bright daylight wash + cross-hatched sun + angled gray steel bow
      const wash = g.createLinearGradient(0, 0, 0, 800);
      wash.addColorStop(0, 'rgba(42, 118, 208, 0.80)');
      wash.addColorStop(1, 'rgba(186, 222, 248, 0.55)');
      g.fillStyle = wash;
      g.fillRect(0, 0, W, 800);
      sun(g, 895, 215, 76);

      const sisterHull = [
        [0, 620],
        [W, 710],
        [W, 1340],
        [0, 1340],
      ];
      poly(g, sisterHull);
      fill(g, '#8FA0B4');
      hatch(g, sisterHull, { step: 22, a: 0.78, color: 'rgba(30, 45, 65, 0.22)', w: 1.8 });
      penPath(g, [[0, 620], [W, 710]], { w: 6.5, seed: 931, color: INK });

      const scar = [
        [150, 830],
        [920, 910],
        [890, 955],
        [185, 868],
      ];
      penFillPoly(g, scar, '#231F20', 932);
      penPath(g, [...scar, scar[0]], { w: 5.0, seed: 933, color: '#E86F1C' });

      // Life buoy
      ellipse(g, 790, 650, 64, 64);
      fill(g, '#E54B3C');
      stroke(g, 5.0);
      ellipse(g, 790, 650, 32, 32);
      fill(g, '#8FA0B4');
      stroke(g, 4.5);

      const deck = [
        [0, 1340],
        [W, 1340],
        [W, H],
        [0, H],
      ];
      poly(g, deck);
      fill(g, '#D9C7AA');
      hatch(g, deck, { step: 24, a: 0.04, color: 'rgba(70, 52, 32, 0.25)', w: 2.0 });
      penPath(g, [[0, 1340], [W, 1340]], { w: 6.5, seed: 935, color: INK });
    }
    return c;
  });
}

const BGS = bakeBackgrounds();

const CAPTAIN_LOOK = {
  skin: '#FAD7B0',
  shirt: '#1E2F4D',
  pants: '#17243B',
  shoes: '#161922',
  hair: '#3A281C',
  pocket: '#2B426B',
  pen: '#E5B23A',
  glasses: false,
  spikes: 10,
  blinkOffset: 0.4,
};

const SAILOR_LOOK = {
  skin: '#FCE0BD',
  shirt: '#253D66',
  pants: '#1B2D4D',
  shoes: '#181B24',
  hair: '#4A3220',
  pocket: '#F4F1E6',
  glasses: false,
  spikes: 12,
  blinkOffset: 1.7,
};

const MP_LOOK = {
  skin: '#F0C79E',
  shirt: '#22334C',
  pants: '#1A263A',
  shoes: '#14171F',
  hair: '#241B15',
  pocket: '#C93838',
  glasses: false,
  spikes: 8,
  blinkOffset: 2.5,
};

function drawFrame(ctx, frame) {
  const t = frame / FPS;
  const shot = shotAt(t);
  const { index: shotIdx, localT, u } = shot;
  const vis = visemeAt(t);
  const mouth = mapVisemeToChibiMouth(vis.code);
  const rms = audioRmsAt(t);

  // Subtle camera shake on dramatic impacts
  const [sx, sy] = shake(
    t,
    [
      [2.6, 16],
      [7.6, 12],
      [17.2, 22],
    ],
    0.55
  );

  ctx.save();
  ctx.translate(sx, sy);

  // Slow editorial camera push-in
  const camZoom = 1 + 0.035 * u;
  ctx.translate(W / 2, H * 0.56);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-W / 2, -H * 0.56);

  ctx.drawImage(BGS[shotIdx], 0, 0);

  // Drifting warm paper light bands from claude-animation-skill `textures.mjs`
  lightBands(ctx, W, H, t, {
    alpha: shotIdx === 2 ? 0.14 : 0.22,
    color: shotIdx === 2 ? '#CBE3FF' : '#FFF4D4',
  });

  if (shotIdx === 0) {
    // Hand-inked torpedo streak + expanding shock ring on sea horizon
    const torpX = lerp(90, 960, clamp(u * 1.18, 0, 1));
    penPath(
      ctx,
      [
        [Math.max(40, torpX - 180), 965],
        [torpX, 955],
      ],
      { w: 7, seed: 31 + Math.floor(frame / 2), color: '#FFFDF7' }
    );
    const torpBody = rrect(torpX - 38, 942, 76, 22, 10);
    poly(ctx, torpBody);
    fill(ctx, '#4E5D6E');
    stroke(ctx, 3.8);
    ring(ctx, t, 2.6, 620, 910, 150, { dur: 0.65, w: 9, color: '#FFF3C4', squash: 0.45 });

    // Large circular binocular reticle framed cleanly behind upper deck
    ctx.save();
    ctx.globalAlpha = 0.34;
    ellipse(ctx, 540, 440, 300, 300);
    stroke(ctx, 8, '#142030');
    line(ctx, [[220, 440], [860, 440]], 2.5, '#142030');
    line(ctx, [[540, 120], [540, 760]], 2.5, '#142030');
    ctx.restore();

    // Panicked Captain on bridge holding brass binoculars
    const scale = 2.08;
    const headTilt = Math.sin(t * 5.0) * 0.06;
    const squash = 1 + rms * 0.05;
    chibi(
      ctx,
      540,
      1465,
      scale,
      {
        t,
        sq: squash,
        arms: 'cheer',
        eyes: 'wide',
        brows: 'worried',
        mouth,
        headTilt,
        look: [Math.sin(t * 2.6) * 5, -3],
        sweat: 0.92,
        holdR: (g) => {
          const b = rrect(-18, -12, 36, 22, 5);
          poly(g, b);
          fill(g, '#D49B38');
          stroke(g, 2.8);
        },
      },
      CAPTAIN_LOOK
    );
    drawNavalCap(ctx, 540, 1465, scale, headTilt, 'captain');
  } else if (shotIdx === 1) {
    // Sailor in brig on left + Military Police guard holding baton on right, with iron bars sliding shut over Sailor!
    const sailorScale = 1.82;
    const sailorTilt = Math.sin(t * 2.2) * 0.05;
    chibi(
      ctx,
      335,
      1475,
      sailorScale,
      {
        t,
        arms: 'shrug',
        eyes: 'wide',
        brows: 'worried',
        mouth: 'frown',
        headTilt: sailorTilt,
        sweat: 0.75,
      },
      SAILOR_LOOK
    );
    drawNavalCap(ctx, 335, 1475, sailorScale, sailorTilt, 'dixie');

    // Iron cell bars slamming down over Sailor (with landing dust puffs!)
    const slam = eOut(clamp(localT / 0.55, 0, 1));
    const barDrop = lerp(-900, 0, slam);
    ctx.save();
    ctx.translate(0, barDrop);
    for (const bx of [135, 235, 335, 435, 535]) {
      const bar = rrect(bx - 9, 250, 18, 1250, 4);
      poly(ctx, bar);
      fill(ctx, '#687688');
      stroke(ctx, 3.8);
    }
    const cross = rrect(105, 250, 460, 28, 5);
    poly(ctx, cross);
    fill(ctx, '#7B8A9E');
    stroke(ctx, 4.2);
    ctx.restore();
    landDust(ctx, t, shot.start + 0.45, 335, 1490, 1.35);

    // MP Officer narrating on right holding nightstick
    const mpScale = 1.92;
    const mpTilt = Math.sin(t * 2.8) * 0.035;
    chibi(
      ctx,
      760,
      1475,
      mpScale,
      {
        t,
        flip: true,
        arms: 'pointR',
        eyes: 'neutral',
        brows: 'furrowed',
        mouth,
        headTilt: mpTilt,
        holdR: (g) => {
          const stick = rrect(-8, -56, 16, 68, 6);
          poly(g, stick);
          fill(g, '#6D4226');
          stroke(g, 2.8);
        },
      },
      MP_LOOK
    );
    drawNavalCap(ctx, 760, 1475, mpScale, mpTilt, 'mp', true);
  } else if (shotIdx === 2) {
    // Sweeping golden convoy searchlights
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const sweep1 = Math.sin(t * 1.4) * 140;
    poly(ctx, [
      [250, 845],
      [70 + sweep1, 0],
      [340 + sweep1, 0],
    ]);
    fill(ctx, 'rgba(255, 235, 165, 0.26)');
    poly(ctx, [
      [790, 845],
      [620 - sweep1, 0],
      [890 - sweep1, 0],
    ]);
    fill(ctx, 'rgba(185, 226, 255, 0.24)');
    ctx.restore();

    const scale = 2.08;
    const headTilt = Math.sin(t * 2.1) * 0.04;
    chibi(
      ctx,
      540,
      1475,
      scale,
      {
        t,
        gait: u * Math.PI * 6,
        armR: [118 + Math.sin(t * 3.2) * 10, 24],
        eyes: 'neutral',
        brows: 'raised',
        mouth,
        headTilt,
        look: [4, -2],
        holdR: (g) => {
          // Brass spyglass telescope
          const scope = rrect(-10, -68, 20, 74, 4);
          poly(g, scope);
          fill(g, '#DFAA3C');
          stroke(g, 2.8);
        },
      },
      CAPTAIN_LOOK
    );
    drawNavalCap(ctx, 540, 1475, scale, headTilt, 'captain');
  } else {
    // SHOT 3: Swinging iron Admiralty anchor + metallic scrape sparks + shocked Captain!
    const anchorSwing = Math.sin(t * 3.8) * 0.20;
    ctx.save();
    ctx.translate(490, 190);
    ctx.rotate(anchorSwing);
    const shank = rrect(-18, 0, 36, 430, 8);
    poly(ctx, shank);
    fill(ctx, '#354152');
    stroke(ctx, 5.0);
    const stock = rrect(-110, 70, 220, 30, 8);
    poly(ctx, stock);
    fill(ctx, '#46556A');
    stroke(ctx, 4.5);
    const fluke = [
      [-185, 340],
      [0, 470],
      [185, 340],
      [148, 305],
      [0, 405],
      [-148, 305],
    ];
    poly(ctx, fluke);
    fill(ctx, '#354152');
    stroke(ctx, 5.0);
    ctx.restore();

    // Multi-burst metallic scrape sparks along the hull scar!
    for (const bt of [15.4, 16.3, 17.1, 18.0, 18.9]) {
      burstParticles(ctx, t, bt, 540, 875, {
        n: 20,
        speed: 620,
        life: 0.75,
        kind: 'spark',
        size: 11,
        colors: ['#FFD35A', '#FFF8DE', '#FF7B29'],
        seed: Math.round(bt * 10),
      });
    }

    const scale = 2.06;
    const headTilt = Math.sin(t * 6.0) * 0.075;
    chibi(
      ctx,
      540,
      1480,
      scale,
      {
        t,
        sq: 1 + rms * 0.06,
        arms: 'up',
        eyes: 'wide',
        brows: 'worried',
        mouth,
        headTilt,
        sweat: 1.0,
      },
      CAPTAIN_LOOK
    );
    drawNavalCap(ctx, 540, 1480, scale, headTilt, 'captain');
  }

  ctx.restore();
  applyFilmFinish(ctx, frame);
}

async function main() {
  const smokeDir = process.env.SMOKE_DIR;
  const outMp4 =
    process.env.OUT_MP4 || '/tmp/bench_out/04_ClaudeAnimationSkill_HandDrawn_20s.mp4';
  const audioPath =
    process.env.AUDIO_WAV || path.resolve(__dirname, '../shared/audio_20s.wav');

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  if (smokeDir) {
    fs.mkdirSync(smokeDir, { recursive: true });
    for (const f of [60, 225, 375, 525]) {
      drawFrame(ctx, f);
      const rgba = canvas.data();
      stampCaptionRGBA(rgba, f / FPS);
      ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), W, H), 0, 0);
      fs.writeFileSync(
        path.join(smokeDir, `claude_anim_f${f}.png`),
        canvas.toBuffer('image/png')
      );
    }
    console.log(`[ClaudeAnimationSkill] Wrote 4 smoke frames to ${smokeDir}`);
    return;
  }

  fs.mkdirSync(path.dirname(outMp4), { recursive: true });
  const ff = spawn(
    ffmpegPath,
    [
      '-y',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-s',
      `${W}x${H}`,
      '-r',
      String(FPS),
      '-i',
      '-',
      '-i',
      audioPath,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-shortest',
      outMp4,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    drawFrame(ctx, f);
    const rgba = canvas.data();
    stampCaptionRGBA(rgba, f / FPS);
    if (!ff.stdin.write(rgba)) {
      await new Promise((r) => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))
    );
  });
  console.log(`[ClaudeAnimationSkill] Rendered 600 frames -> ${outMp4}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
