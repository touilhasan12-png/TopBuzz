import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, ImageData } from '@napi-rs/canvas';
import ffmpegPath from 'ffmpeg-static';

import {
  rhubarbAt,
  shotAt,
} from '../shared/story_helper.mjs';
import { stampCaptionRGBA } from '../shared/rgba_caption_overlay.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANIDOODLE_SRC =
  process.env.ANIDOODLE_SRC ||
  '/tmp/gh_engines/anidoodle/skills/anidoodle/engine/src/canvas-core';

const coreMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'core.ts')).href);
const math3Mod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'character/math3.ts')).href);
const skelMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'character/human/skeleton.ts')).href);
const headMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'character/human/head.ts')).href);
const figMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'character/human/figure.ts')).href);
const clothMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'character/human/clothing.ts')).href);
const walkMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'character/human/walk.ts')).href);
const theoMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'characters/theo/index.ts')).href);
const wardMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'characters/theo/wardrobe.ts')).href);
const theoPoses: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'characters/theo/poses.ts')).href);
const markerMod: any = await import(pathToFileURL(path.join(ANIDOODLE_SRC, 'character/render/marker.ts')).href);

const { Gfx, PENCIL, oval } = coreMod;
const { camera, lensPx, project, add, mul } = math3Mod;
const { SIDES } = skelMod;
const { hairCap } = headMod;
const { build, assemble } = figMod;
const { trouserLeg } = clothMod;
const { planWalk, walkAt } = walkMod;
const { THEO_SPEC, QUIFF } = theoMod;
const { blouse, elbowMarks, kneeMarks, neckMarks, neckline, shorts, softSleeve } = wardMod;
const { THEO_DIMS, pointAtCamera, contra, reachUp, relaxed } = theoPoses;
const { renderMarker } = markerMod;

const W = 1080;
const H = 1920;
const FPS = 30;
const TOTAL_FRAMES = 600;

/**
 * Custom WWII US Navy 7.5-heads volumetric human character built directly on anidoodle's
 * 3D capsule anatomy (`THEO_SPEC` + full-length Navy sleeves + full-length Navy trousers)!
 */
const FACE_ROLES = {
  line: 'line',
  pupil: 'pupil',
  white: 'white',
  blush: 'blush',
  brow: 'hair',
  mouth: 'mouth',
  lip: 'lip',
};

const NAVY_SPEC = {
  ...THEO_SPEC,
  roles: {
    ...THEO_SPEC.roles,
    skin: 'skin',
    torso: 'shirt',
    hips: 'trousers',
    upperArm: 'shirt',
    foreArm: 'shirt',
    thigh: 'trousers',
    shin: 'trousers',
    foot: 'shoe',
  },
  inflate: {
    torso: 0.032,
    hips: 0.04,
    upperArm: 0.018,
    foreArm: 0.014,
    thigh: 0.024,
    shin: 0.02,
    foot: 0.03,
  },
};

function buildNavalOfficerScene(pose: any, cam: any) {
  const b = build(NAVY_SPEC, pose, cam);
  const r = b.rig;
  const B = NAVY_SPEC.body;

  const bl = blouse(r, { role: 'shirt', ease: 0.038 });
  const torso = b.parts.find((q: any) => q.id === 'torso')!;
  torso.groups.push({ blobs: [bl.ring], mode: 'each' });
  torso.marksFn = bl.marksFn;

  SIDES.forEach((s: 'L' | 'R') => {
    b.parts.push(
      softSleeve(r, B, s, { role: 'shirt', len: 0.94, ease: 0.036 }),
      trouserLeg(r, B, s, { role: 'trousers', to: 0.96, inflate: 0.048, flare: 0.03 })
    );
    const shin = b.parts.find((q: any) => q.id === 'shin' + s)!;
    const fore = b.parts.find((q: any) => q.id === 'foreArm' + s)!;
    shin.marksFn = (c: any) => kneeMarks(r, s, c);
    fore.marksFn = (c: any) => elbowMarks(r, s, c);
  });
  b.parts.push(shorts(r, B, { role: 'trousers', ease: 0.044 }));
  const neck = b.parts.find((q: any) => q.id === 'neck')!;
  neck.marksFn = (c: any) => neckMarks(r, b.head.M, c);

  const scene = assemble(cam, b, pose, FACE_ROLES, { character: 'naval_officer', version: '1.0.0' }, () => {
    const out = [hairCap(b.head, 'hair', { front: 0.82, side: 0.58, back: 0.3, lift: 0.035, sideburn: 0.12, volume: QUIFF })];
    const nl = neckline(r, cam, { skin: 'skin', spec: B, ease: 0.025 });
    if (nl) out.push(nl);
    return out;
  });

  return { scene, headMatrix: b.head.M };
}

/**
 * Draw 3D-projected WWII Officer / Sailor / MP Cap directly from `head.M` into anidoodle's
 * brush-pen & cel-wash layer so the headgear tracks every 3D turn, nod, & tilt of the skull!
 */
function draw3DNavalCap(ctx: any, cam: any, M: (local: [number, number, number]) => [number, number, number], kind: 'captain' | 'sailor' | 'mp') {
  const P = (lx: number, ly: number, lz: number): [number, number] => {
    const q = project(cam, M([lx, ly, lz]));
    return [q.x, q.y];
  };

  if (kind === 'sailor') {
    const crownPoly = [
      P(-0.36, 0.68, 0.14),
      P(-0.44, 1.04, 0.22),
      P(0.0, 1.12, 0.30),
      P(0.44, 1.04, 0.22),
      P(0.36, 0.68, 0.14),
      P(0.0, 0.70, 0.34),
    ];
    ctx.save();
    ctx.fillStyle = '#F7F4EC';
    ctx.strokeStyle = '#15122A';
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    crownPoly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Captain / MP peaked service cap projected in true 3D head coordinates!
  const crown = [
    P(-0.38, 0.72, 0.10),
    P(-0.48, 1.06, 0.22),
    P(0.0, 1.15, 0.30),
    P(0.48, 1.06, 0.22),
    P(0.38, 0.72, 0.10),
  ];
  const band = [
    P(-0.37, 0.66, 0.16),
    P(-0.39, 0.78, 0.18),
    P(0.0, 0.80, 0.36),
    P(0.39, 0.78, 0.18),
    P(0.37, 0.66, 0.16),
    P(0.0, 0.67, 0.35),
  ];
  const visor = [
    P(-0.33, 0.67, 0.24),
    P(0.0, 0.68, 0.37),
    P(0.33, 0.67, 0.24),
    P(0.24, 0.56, 0.52),
    P(0.0, 0.54, 0.58),
    P(-0.24, 0.56, 0.52),
  ];
  const badge = P(0.0, 0.94, 0.31);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#15122A';
  ctx.lineWidth = 3.0;
  ctx.fillStyle = '#FAF7EE';
  ctx.beginPath();
  crown.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = kind === 'mp' ? '#C93838' : '#18243C';
  ctx.beginPath();
  band.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#111622';
  ctx.beginPath();
  visor.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (kind === 'captain') {
    ctx.fillStyle = '#EAB63E';
    ctx.beginPath();
    ctx.arc(badge[0], badge[1], 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  ctx.restore();
}

const CAPTAIN_PALETTE = {
  skin: { base: '#F2C39B', shade: '#CF956E' },
  shirt: { base: '#213558', shade: '#132038' },
  trousers: { base: '#1B2C4A', shade: '#101B2E' },
  shoe: { base: '#1B1F2A', shade: '#0E1017' },
  hair: { base: '#463226', shade: '#281B14' },
  hairLine: { base: '#241811', shade: '#150E0A' },
  pupil: { base: '#23395B', shade: '#121E33' },
  white: { base: '#FFFCF6', shade: '#DFD8CC' },
  blush: { base: '#E5988B', shade: '#C4776B' },
  mouth: { base: '#7B232B', shade: '#4D1419' },
  lip: { base: '#C86D68', shade: '#9E4E4A' },
  nail: { base: '#F7DCCC', shade: '#DEB49E' },
};

const SAILOR_PALETTE = {
  ...CAPTAIN_PALETTE,
  shirt: { base: '#2A4775', shade: '#192D4E' },
  trousers: { base: '#233C64', shade: '#142440' },
};

const MP_PALETTE = {
  ...CAPTAIN_PALETTE,
  shirt: { base: '#2A3950', shade: '#192334' },
  trousers: { base: '#212D40', shade: '#131B28' },
};

// Zero-foot-slip 3D walk plan for Shot 2 (Captain striding across USS Willie Dee bridge deck!)
const WALK_YAW = 28;
const WALK_DIR: [number, number, number] = [
  Math.sin((WALK_YAW * Math.PI) / 180),
  0,
  Math.cos((WALK_YAW * Math.PI) / 180),
];
const WALK_PLAN = planWalk({ t0: 0, s0: 0, step: 0.44, cycle: 30, n: 10, first: 'L', lateral: 0.065 });
const WALK_ORIGIN: [number, number, number] = [-0.55, 0, -1.35];

function applyVisemeExpression(baseEx: Record<string, number>, t: number, browBias = 0.25) {
  const vis = rhubarbAt(t);
  const blink = (t % 3.1) < 0.12 ? 1.0 : 0.0;
  return {
    ...baseEx,
    mouthOpen: Math.min(1.0, (vis.open ?? 0.2) * 1.15),
    smile: vis.code === 'C' ? 0.55 : vis.code === 'E' || vis.code === 'F' ? -0.15 : 0.15,
    browRaise: browBias + (vis.open ?? 0) * 0.25,
    lidUpper: blink,
  };
}

function drawFrameAnidoodle(ctx: any, env: any, frame: number) {
  const t = frame / FPS;
  const shot = shotAt(t);
  const { index: shotIdx, localT, u } = shot;

  const g = new Gfx(ctx, env, frame, PENCIL);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = shotIdx === 2 ? '#12223E' : '#FBF5E6';
  ctx.fillRect(0, 0, W, H);

  if (shotIdx === 0) {
    // 3D Pinhole Camera pushing in toward Captain pointing right at the lens!
    const eye: [number, number, number] = [0.10 - 0.12 * u, 1.38 - 0.04 * u, 2.75 - 0.28 * u];
    const target: [number, number, number] = [0.0, 1.05, 0.0];
    const cam = camera(eye, target, lensPx(42, W), W * 0.5, H * 0.52);
    const P = (v: [number, number, number]): [number, number] => {
      const q = project(cam, v);
      return [q.x, q.y];
    };
    const hzY = P([0, 0, -14])[1];

    g.group('paint', () => {
      // Cold-press watercolor sky + sea washes
      g.wash([[-40, -40], [W + 40, -40], [W + 40, hzY + 20], [-40, hzY + 20]], '#5B9BC9', {
        alpha: 0.72, seed: 11, dx: 0, dy: 0, shrink: 1, rim: false,
      });
      g.wash([[-40, hzY], [W + 40, hzY], [W + 40, P([0, 0, -2.8])[1] + 20], [-40, P([0, 0, -2.8])[1] + 20]], '#255E8E', {
        alpha: 0.82, seed: 12, dx: 0, dy: 0, shrink: 1, rim: false,
      });
      // USS Iowa battleship silhouette on the 3D horizon
      const hull = [P([-5.5, 0.0, -11]), P([5.5, 0.0, -11]), P([4.8, 1.15, -11]), P([-4.8, 1.15, -11])];
      g.wash(hull, '#45576C', { alpha: 0.90, seed: 13, rim: true });
      const tower = [P([-2.1, 1.15, -11]), P([2.1, 1.15, -11]), P([1.5, 2.55, -11]), P([-1.5, 2.55, -11])];
      g.wash(tower, '#5B7088', { alpha: 0.90, seed: 14, rim: true });

      // 3D perspective wooden ship bridge deck safely in front of lens (`z <= 1.35m < eye.z`)!
      const deckYTop = P([0, 0, -2.8])[1];
      g.wash([[-40, deckYTop], [W + 40, deckYTop], [W + 40, H + 40], [-40, H + 40]], '#DECAA8', {
        alpha: 0.94, seed: 15, rim: true,
      });
    });

    g.group('ink', () => {
      // Deck plank perspective lines converging cleanly from foreground (`z = 1.35`) to horizon (`z = -2.8`)!
      for (let x = -3.0; x <= 3.0; x += 0.6) {
        g.pen([P([x, 0, -2.8]), P([x, 0, 1.35])], { w: 1.8, color: '#6E5539', seed: 30 + Math.round(x * 10), opacity: 0.55 });
      }
      g.pen([[-20, P([0, 0, -2.8])[1]], [W + 20, P([0, 0, -2.8])[1]]], { w: 3.4, color: '#15122A', seed: 45 });

      // Live torpedo wake racing across the 3D sea plane!
      const tx = -4.8 + 9.6 * Math.min(1, u * 1.15);
      g.pen([P([tx - 2.6, 0.05, -7.5]), P([tx, 0.05, -7.5])], { w: 7.5, color: '#FFFFFF', seed: 55 });
      g.pen(oval(P([tx + 0.25, 0.08, -7.5])[0], P([tx + 0.25, 0.08, -7.5])[1], 32, 9, 3), { w: 3.0, color: '#15122A', seed: 56 });

      // Periscope optical crosshair in upper sky
      const ret = oval(W * 0.5, 360, 250, 250, 7);
      g.pen([...ret, ret[0]], { w: 3.8, color: '#1A2B42', seed: 60, opacity: 0.42 });
      g.pen([[W * 0.5 - 275, 360], [W * 0.5 + 275, 360]], { w: 1.8, color: '#1A2B42', seed: 61, opacity: 0.38 });
      g.pen([[W * 0.5, 85], [W * 0.5, 635]], { w: 1.8, color: '#1A2B42', seed: 62, opacity: 0.38 });
    });

    // 7.5-heads Captain pointing straight at the lens (`pointAtCamera` foreshortened 5-finger hand!)
    const basePose = pointAtCamera([0.08 + Math.sin(t * 3.0) * 0.06, 1.36 + Math.cos(t * 2.5) * 0.04, 1.35]);
    const pose = {
      ...basePose,
      joints: {
        ...basePose.joints,
        headTilt: Math.sin(t * 4.2) * 5,
        shoulderRaiseL: 28 + Math.sin(t * 3.4) * 8,
        elbowL: 45,
      },
      expression: applyVisemeExpression(basePose.expression ?? {}, t, 0.55),
    };
    const { scene, headMatrix } = buildNavalOfficerScene(pose, cam);
    renderMarker(g, scene, CAPTAIN_PALETTE, { weight: 1.15 });
    draw3DNavalCap(ctx, cam, headMatrix, 'captain');
  } else if (shotIdx === 1) {
    // SHOT 1: Two 7.5-heads volumetric adults in 3D space — Sailor behind 3D iron brig bars + MP Officer in contrapposto!
    const eye: [number, number, number] = [0.05 * u, 1.28, 3.25 - 0.22 * u];
    const target: [number, number, number] = [0.0, 0.98, 0.0];
    const cam = camera(eye, target, lensPx(40, W), W * 0.5, H * 0.53);
    const P = (v: [number, number, number]): [number, number] => {
      const q = project(cam, v);
      return [q.x, q.y];
    };

    const floorY = P([0, 0, -2.0])[1];
    g.group('paint', () => {
      g.wash([[-40, -40], [W + 40, -40], [W + 40, floorY + 20], [-40, floorY + 20]], '#5C6D84', {
        alpha: 0.86, seed: 101, rim: false,
      });
      g.wash(oval(W * 0.5, 360, 120, 120, 8), '#8AB6DB', { alpha: 0.90, seed: 103, rim: true });
      g.wash([[-40, floorY], [W + 40, floorY], [W + 40, H + 40], [-40, H + 40]], '#9CA5B4', {
        alpha: 0.94, seed: 104, rim: true,
      });
    });
    g.group('ink', () => {
      g.pen([...oval(W * 0.5, 360, 120, 120, 8), oval(W * 0.5, 360, 120, 120, 8)[0]], { w: 4.5, color: '#15122A', seed: 105 });
      g.pen([[-20, floorY], [W + 20, floorY]], { w: 3.8, color: '#15122A', seed: 106 });
    });

    // Sailor on Left (`x = -0.46m`) behind cell bars
    const pSailorBase = relaxed(16);
    const pSailor = {
      ...pSailorBase,
      root: [-0.46, pSailorBase.root[1], -0.22] as [number, number, number],
      joints: {
        ...pSailorBase.joints,
        shoulderRaiseL: 58,
        shoulderRaiseR: 58,
        elbowL: 65,
        elbowR: 65,
        headNod: 8,
        headTilt: Math.sin(t * 2.5) * 6,
      },
      expression: { browFurrow: 0.65, smile: -0.35, lidUpper: (t % 2.8) < 0.12 ? 1 : 0 },
    };
    const sailorBuilt = buildNavalOfficerScene(pSailor, cam);
    renderMarker(g, sailorBuilt.scene, SAILOR_PALETTE, { weight: 1.1 });
    draw3DNavalCap(ctx, cam, sailorBuilt.headMatrix, 'sailor');

    // 3D Iron Brig Bars sliding shut at `z = +0.25m` directly in front of the Sailor!
    const slam = Math.min(1, localT / 0.5);
    const dropY = (1 - slam * slam * (3 - 2 * slam)) * 1.6;
    ctx.save();
    for (const bx of [-0.92, -0.69, -0.46, -0.23, 0.0]) {
      const a = P([bx - 0.022, 0.0 + dropY, 0.25]);
      const b2 = P([bx + 0.022, 2.15 + dropY, 0.25]);
      const wBar = Math.max(11, b2[0] - a[0]);
      ctx.fillStyle = '#556377';
      ctx.fillRect(a[0], b2[1], wBar, a[1] - b2[1]);
      ctx.strokeStyle = '#15122A';
      ctx.lineWidth = 3.4;
      ctx.strokeRect(a[0], b2[1], wBar, a[1] - b2[1]);
    }
    const topL = P([-0.98, 2.12 + dropY, 0.25]);
    const topR = P([0.06, 2.18 + dropY, 0.25]);
    ctx.fillStyle = '#6A7B92';
    ctx.fillRect(topL[0], topR[1], topR[0] - topL[0], 24);
    ctx.strokeRect(topL[0], topR[1], topR[0] - topL[0], 24);
    ctx.restore();

    // MP Officer on Right (`x = +0.44m`) in classical Polykleitos contrapposto (`contra(-22)`) narrating!
    const pMPBase = contra(-24);
    const pMP = {
      ...pMPBase,
      root: [0.44, pMPBase.root[1], 0.08] as [number, number, number],
      joints: {
        ...pMPBase.joints,
        shoulderRaiseL: 68 + Math.sin(t * 3.4) * 10,
        shoulderSwingL: 42,
        elbowL: 34,
        headTurn: -10 + Math.sin(t * 2.2) * 4,
      },
      expression: applyVisemeExpression(pMPBase.expression ?? {}, t, 0.2),
    };
    const mpBuilt = buildNavalOfficerScene(pMP, cam);
    renderMarker(g, mpBuilt.scene, MP_PALETTE, { weight: 1.15 });
    draw3DNavalCap(ctx, cam, mpBuilt.headMatrix, 'mp');
  } else if (shotIdx === 2) {
    // SHOT 2: North Atlantic Night — ZERO-FOOT-SLIP 3D WALK CYCLE (`planWalk` + `walkAt`) across the flagship deck!!
    const walkFrame = Math.floor(localT * FPS);
    const eye: [number, number, number] = [0.42 - 0.16 * u, 1.34, 3.05 - 0.35 * u];
    const target: [number, number, number] = [0.0, 1.02, -0.25];
    const cam = camera(eye, target, lensPx(42, W), W * 0.5, H * 0.53);
    const P = (v: [number, number, number]): [number, number] => {
      const q = project(cam, v);
      return [q.x, q.y];
    };
    const hzY = P([0, 0, -12])[1];

    const deckY2 = P([0, 0, -3.2])[1];
    g.group('paint', () => {
      // Sweeping golden & ice-blue convoy searchlights in night sky
      const sw = Math.sin(t * 1.5) * 140;
      g.wash([[240, hzY], [60 + sw, -20], [340 + sw, -20]], '#FDE69E', { alpha: 0.34, seed: 201, rim: false });
      g.wash([[820, hzY], [620 - sw, -20], [900 - sw, -20]], '#BFE0FF', { alpha: 0.30, seed: 202, rim: false });

      // Night Atlantic sea + escort ship silhouette
      g.wash([[-40, hzY], [W + 40, hzY], [W + 40, deckY2 + 20], [-40, deckY2 + 20]], '#1C3F6E', {
        alpha: 0.85, seed: 203, rim: false,
      });
      const ship = [P([-5.5, 0, -10]), P([5.5, 0, -10]), P([4.7, 1.3, -10]), P([-4.7, 1.3, -10])];
      g.wash(ship, '#2B3E58', { alpha: 0.92, seed: 204, rim: true });

      // Moonlit ship bridge deck safely in front of lens (`z <= 1.35m`)
      g.wash([[-40, deckY2], [W + 40, deckY2], [W + 40, H + 40], [-40, H + 40]], '#8FA2B8', {
        alpha: 0.92, seed: 205, rim: true,
      });
    });

    g.group('ink', () => {
      for (let x = -3.0; x <= 3.0; x += 0.6) {
        g.pen([P([x, 0, -3.2]), P([x, 0, 1.35])], { w: 1.8, color: '#243449', seed: 220 + Math.round(x * 10), opacity: 0.55 });
      }
      g.pen([[-20, deckY2], [W + 20, deckY2]], { w: 3.4, color: '#0E1525', seed: 240 });
    });

    // Genuine 3D footstep-solved human walk (`walkAt`) with head turned toward camera & Rhubarb lip-sync!
    const baseWalk = relaxed(WALK_YAW);
    const w = walkAt(THEO_DIMS, WALK_PLAN, walkFrame, baseWalk, { origin: WALK_ORIGIN, dir: WALK_DIR });
    const pWalk = {
      ...w.pose,
      joints: {
        ...w.pose.joints,
        neckTwist: -18,
        headTurn: -8,
        shoulderRaiseR: 52 + Math.sin(t * 2.8) * 8,
        elbowR: 58,
      },
      expression: applyVisemeExpression({}, t, 0.35),
    };
    const captainBuilt = buildNavalOfficerScene(pWalk, cam);
    renderMarker(g, captainBuilt.scene, CAPTAIN_PALETTE, { weight: 1.15 });
    draw3DNavalCap(ctx, cam, captainBuilt.headMatrix, 'captain');
  } else {
    // SHOT 3: Harbor Anchor Scrape — Hogarth `reachUp` dynamic overhead panic pose + giant 3D swinging iron anchor!
    const eye: [number, number, number] = [-0.08 + 0.14 * u, 1.34, 2.95 - 0.25 * u];
    const target: [number, number, number] = [0.0, 1.12, 0.0];
    const cam = camera(eye, target, lensPx(40, W), W * 0.5, H * 0.55);
    const P = (v: [number, number, number]): [number, number] => {
      const q = project(cam, v);
      return [q.x, q.y];
    };

    const deckY3 = P([0, 0, -2.5])[1];
    g.group('paint', () => {
      g.wash([[-40, -40], [W + 40, -40], [W + 40, 660], [-40, 660]], '#5EA5EC', {
        alpha: 0.80, seed: 301, rim: false,
      });
      // Tower wall of sister ship hull + glowing orange anchor scrape scar!
      g.wash([[-40, 560], [W + 40, 650], [W + 40, deckY3 + 20], [-40, deckY3 + 20]], '#8C9EB2', {
        alpha: 0.92, seed: 302, rim: true,
      });
      g.wash([[140, 780], [930, 860], [900, 910], [175, 825]], '#2B2422', {
        alpha: 0.92, seed: 303, rim: true,
      });
      g.wash([[-40, deckY3], [W + 40, deckY3], [W + 40, H + 40], [-40, H + 40]], '#E0CEAE', {
        alpha: 0.94, seed: 304, rim: true,
      });
    });
    g.group('ink', () => {
      g.pen([[-20, 560], [W + 20, 650]], { w: 4.5, color: '#15122A', seed: 305 });
      g.pen([[140, 780], [930, 860], [900, 910], [175, 825], [140, 780]], { w: 4.2, color: '#E86C1A', seed: 306 });
      g.pen([[-20, deckY3], [W + 20, deckY3]], { w: 3.8, color: '#15122A', seed: 307 });
    });

    // Swinging giant Admiralty iron anchor + flying sparks over sister hull!
    const ang = Math.sin(t * 3.8) * 0.22;
    ctx.save();
    ctx.translate(540, 125);
    ctx.rotate(ang);
    ctx.fillStyle = '#334052';
    ctx.strokeStyle = '#15122A';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.roundRect(-18, 0, 36, 390, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-105, 65, 210, 28, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-175, 305);
    ctx.lineTo(0, 430);
    ctx.lineTo(175, 305);
    ctx.lineTo(140, 272);
    ctx.lineTo(0, 368);
    ctx.lineTo(-140, 272);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    for (let i = 0; i < 14; i++) {
      const ph = (t * 3.2 + i * 0.21) % 1;
      const sx = 520 + Math.cos(i * 1.9) * 280 * ph;
      const sy = 830 + Math.sin(i * 2.3) * 120 * ph + 90 * ph * ph;
      ctx.strokeStyle = i % 2 === 0 ? '#FFD452' : '#FF6B1A';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 22, sy - 12);
      ctx.stroke();
    }
    ctx.restore();

    // Dynamic Hogarth overhead `reachUp` pose with BOTH arms raised in alarm!
    const pReach = reachUp(-10);
    const pose = {
      ...pReach,
      joints: {
        ...pReach.joints,
        shoulderRaiseL: 138 + Math.sin(t * 5.0) * 10,
        shoulderSwingL: 36,
        elbowL: 28,
        shoulderRaiseR: 144 - Math.sin(t * 5.0) * 10,
        elbowR: 24,
        headNod: -6,
        headTilt: Math.sin(t * 5.5) * 6,
      },
      expression: applyVisemeExpression(pReach.expression ?? {}, t, 0.7),
    };
    const captainBuilt = buildNavalOfficerScene(pose, cam);
    renderMarker(g, captainBuilt.scene, CAPTAIN_PALETTE, { weight: 1.15 });
    draw3DNavalCap(ctx, cam, captainBuilt.headMatrix, 'captain');
  }

  // Signature anidoodle cold-press watercolor paper grain & warm vignette
  g.paper('paper', 0.11);
  g.vignette('rgba(45, 30, 25, 0.10)');
  g.paper('coldpress', 0.14);
}

async function main() {
  const smokeDir = process.env.SMOKE_DIR;
  const outMp4 =
    process.env.OUT_MP4 || '/tmp/bench_out/05_Anidoodle_VolumetricCel_20s.mp4';
  const audioPath =
    process.env.AUDIO_WAV || path.resolve(__dirname, '../shared/audio_20s.wav');

  const rootCanvas = createCanvas(W, H);
  const ctx = rootCanvas.getContext('2d');
  const makeEnv = () => ({
    W,
    H,
    scale: 1,
    cache: new Map<string, unknown>(),
    canvas: (w: number, h: number) => {
      const c = createCanvas(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)));
      return { canvas: c as any, ctx: c.getContext('2d') as any };
    },
  });
  const shotEnvs = [makeEnv(), makeEnv(), makeEnv(), makeEnv()];

  if (smokeDir) {
    fs.mkdirSync(smokeDir, { recursive: true });
    for (const f of [60, 225, 375, 525]) {
      drawFrameAnidoodle(ctx, shotEnvs[shotAt(f / FPS).index], f);
      const rgba = rootCanvas.data();
      stampCaptionRGBA(rgba, f / FPS);
      ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), W, H), 0, 0);
      fs.writeFileSync(
        path.join(smokeDir, `anidoodle_f${f}.png`),
        rootCanvas.toBuffer('image/png')
      );
    }
    console.log(`[Anidoodle] Wrote 4 volumetric cel-ink smoke frames to ${smokeDir}`);
    return;
  }

  fs.mkdirSync(path.dirname(outMp4), { recursive: true });
  const ff = spawn(
    ffmpegPath!,
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
    drawFrameAnidoodle(ctx, shotEnvs[shotAt(f / FPS).index], f);
    const rgba = rootCanvas.data();
    stampCaptionRGBA(rgba, f / FPS);
    if (!ff.stdin.write(rgba)) {
      await new Promise((r) => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end();
  await new Promise<void>((resolve, reject) => {
    ff.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))
    );
  });
  console.log(`[Anidoodle] Rendered 600 volumetric cel-ink frames -> ${outMp4}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
