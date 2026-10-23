import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

import {
  W,
  H,
  FPS,
  TOTAL_FRAMES,
  AUDIO_20S_WAV,
  shotAt,
  rhubarbAt,
} from "../shared/story_helper.mjs";
import { stampCaptionRGBA } from "../shared/rgba_caption_overlay.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDIO25D_ROOT = process.env.STUDIO25D_ROOT || "/tmp/gh_engines/studio25d";
import ffmpegStatic from "ffmpeg-static";
const FFMPEG_BIN = process.env.FFMPEG_BIN || ffmpegStatic!;
const OUT_MP4 = process.env.OUT_MP4 || "/tmp/bench_out/02_Studio25D_20s.mp4";
const SMOKE_DIR = process.env.SMOKE_DIR || "";

type Vec3 = [number, number, number];

/**
 * Builds an authentic `ai-agent-animation-studio` `AssetRigContract` (`renderMode: 'planar'`)
 * with full 12-bone skeleton (`pelvis`, `torso`, `head`, arms, legs, `coat_tail`),
 * real `CANONICAL_BIPED_MORPH_TARGETS` mouth morph topology, `secondaryMotion` springs,
 * and expressive WWII cartoon character geometry (+Y is UP in Studio25D world space!).
 */
function buildNaval25DRig(
  id: string,
  role: "captain" | "sailor" | "fdr" | "mp",
  baseSegments: any[],
  morphTargets: any[]
): any {
  const skin = role === "fdr" ? "#F7D9C4" : role === "mp" ? "#EAC0A2" : "#F5CFAF";
  const skinShade = role === "fdr" ? "#DFB499" : "#D9A684";
  const uniform =
    role === "sailor"
      ? "#1B3556"
      : role === "fdr"
      ? "#142238"
      : role === "mp"
      ? "#243B55"
      : "#172A46";
  const ink = "#0D131D";

  const solid = (color: string, strokeColor = ink, strokeW = 1.6, lit = true) => ({
    fill: { kind: "solid" as const, color },
    stroke: strokeW > 0 ? { paint: { kind: "solid" as const, color: strokeColor }, width: strokeW } : undefined,
    opacity: 1,
    lit,
  });

  const parts: any[] = [
    // Dynamic secondary-motion Naval Coat Tail / Cloak Sweep
    {
      id: "coat_tail_flap",
      jointId: "coat_tail",
      localOffset2D: [0, -14],
      shape: {
        kind: "polygon",
        points: [
          [-24, 16],
          [24, 16],
          [32, -26],
          [-32, -26],
        ],
      },
      style: solid(role === "fdr" ? "#0D192B" : "#102038", ink, 1.8, true),
    },
    // Left & Right Upper/Lower Legs + Naval Boots
    {
      id: "leg_l_thigh",
      jointId: "leg_l_upper",
      localOffset2D: [0, -16],
      shape: { kind: "rect", size: [14, 34], rx: 6, ry: 6 },
      style: solid(uniform),
    },
    {
      id: "leg_l_shin",
      jointId: "leg_l_lower",
      localOffset2D: [0, -15],
      shape: { kind: "rect", size: [13, 32], rx: 5, ry: 5 },
      style: solid(uniform),
    },
    {
      id: "boot_l",
      jointId: "leg_l_lower",
      localOffset2D: [-2, -31],
      shape: { kind: "rect", size: [19, 11], rx: 5, ry: 5 },
      style: solid("#141923", ink, 1.6, false),
    },
    {
      id: "leg_r_thigh",
      jointId: "leg_r_upper",
      localOffset2D: [0, -16],
      shape: { kind: "rect", size: [14, 34], rx: 6, ry: 6 },
      style: solid(uniform),
    },
    {
      id: "leg_r_shin",
      jointId: "leg_r_lower",
      localOffset2D: [0, -15],
      shape: { kind: "rect", size: [13, 32], rx: 5, ry: 5 },
      style: solid(uniform),
    },
    {
      id: "boot_r",
      jointId: "leg_r_lower",
      localOffset2D: [2, -31],
      shape: { kind: "rect", size: [19, 11], rx: 5, ry: 5 },
      style: solid("#141923", ink, 1.6, false),
    },
    // Left Arm + Sleeve Cuff + Hand
    {
      id: "arm_l_bicep",
      jointId: "arm_l_upper",
      localOffset2D: [0, -13],
      shape: { kind: "rect", size: [13, 28], rx: 6, ry: 6 },
      style: solid(uniform),
    },
    {
      id: "arm_l_fore",
      jointId: "arm_l_lower",
      localOffset2D: [0, -12],
      shape: { kind: "rect", size: [12, 26], rx: 5, ry: 5 },
      style: solid(uniform),
    },
    {
      id: "cuff_l",
      jointId: "arm_l_lower",
      localOffset2D: [0, -19],
      shape: { kind: "rect", size: [12.5, 4], rx: 1, ry: 1 },
      style: solid(role === "sailor" ? "#FFFFFF" : "#FBBF24", ink, 1.0, false),
    },
    {
      id: "hand_l",
      jointId: "arm_l_lower",
      localOffset2D: [0, -26],
      shape: { kind: "ellipse", radius: [6.8, 6.2] },
      style: solid(skin),
    },
    // Torso Jacket + White Shirt V-Collar + Buttons / Cross-Belt
    {
      id: "torso_jacket",
      jointId: "torso",
      localOffset2D: [0, 16],
      shape: {
        kind: "polygon",
        points: [
          [-24, -18],
          [24, -18],
          [27, 22],
          [-27, 22],
        ],
      },
      style: solid(uniform, ink, 2.0, true),
    },
    {
      id: "shirt_collar_v",
      jointId: "torso",
      localOffset2D: [0, 27],
      shape: {
        kind: "polygon",
        points: [
          [-10, 11],
          [10, 11],
          [0, -9],
        ],
      },
      style: solid("#FFFFFF", ink, 1.3, false),
    },
    // Right Arm + Sleeve Cuff + Hand (+ MP Baton if MP)
    {
      id: "arm_r_bicep",
      jointId: "arm_r_upper",
      localOffset2D: [0, -13],
      shape: { kind: "rect", size: [13, 28], rx: 6, ry: 6 },
      style: solid(uniform),
    },
    {
      id: "arm_r_fore",
      jointId: "arm_r_lower",
      localOffset2D: [0, -12],
      shape: { kind: "rect", size: [12, 26], rx: 5, ry: 5 },
      style: solid(uniform),
    },
    {
      id: "cuff_r",
      jointId: "arm_r_lower",
      localOffset2D: [0, -19],
      shape: { kind: "rect", size: [12.5, 4], rx: 1, ry: 1 },
      style: solid(role === "sailor" ? "#FFFFFF" : "#FBBF24", ink, 1.0, false),
    },
    {
      id: "hand_r",
      jointId: "arm_r_lower",
      localOffset2D: [0, -26],
      shape: { kind: "ellipse", radius: [6.8, 6.2] },
      style: solid(skin),
    },
    // Neck + Expressive Cartoon Head & Facial Features
    {
      id: "neck_cyl",
      jointId: "head",
      localOffset2D: [0, 0],
      shape: { kind: "rect", size: [13, 14], rx: 4, ry: 4 },
      style: solid(skinShade),
    },
    {
      id: "ears_pair",
      jointId: "head",
      localOffset2D: [0, 22],
      shape: { kind: "ellipse", radius: [25.5, 6.2] },
      style: solid(skinShade),
    },
    {
      id: "head_face",
      jointId: "head",
      localOffset2D: [0, 23],
      shape: { kind: "ellipse", radius: [22, 24] },
      style: solid(skin, ink, 2.0, true),
    },
    // Expressive Cartoon Eyes (auto-blink supported natively by `SceneCompositor` via `eye` id!)
    {
      id: "eye_white_l",
      jointId: "head",
      localOffset2D: [-8.5, 25],
      shape: { kind: "ellipse", radius: [5.6, 6.4] },
      style: solid("#FFFFFF", ink, 1.3, false),
    },
    {
      id: "eye_white_r",
      jointId: "head",
      localOffset2D: [8.5, 25],
      shape: { kind: "ellipse", radius: [5.6, 6.4] },
      style: solid("#FFFFFF", ink, 1.3, false),
    },
    {
      id: "eye_pupil_l",
      jointId: "head",
      localOffset2D: [-8.2, 24.8],
      shape: { kind: "ellipse", radius: [3.1, 3.6] },
      style: solid("#0F172A", "#1D4ED8", 1.1, false),
    },
    {
      id: "eye_pupil_r",
      jointId: "head",
      localOffset2D: [8.8, 24.8],
      shape: { kind: "ellipse", radius: [3.1, 3.6] },
      style: solid("#0F172A", "#1D4ED8", 1.1, false),
    },
    {
      id: "brow_l",
      jointId: "head",
      localOffset2D: [-8.5, 34.5],
      shape: { kind: "rect", size: [11.5, 2.8], rx: 1.2, ry: 1.2 },
      style: solid(role === "fdr" ? "#64748B" : "#1E293B", ink, 0.8, false),
    },
    {
      id: "brow_r",
      jointId: "head",
      localOffset2D: [8.5, 34.5],
      shape: { kind: "rect", size: [11.5, 2.8], rx: 1.2, ry: 1.2 },
      style: solid(role === "fdr" ? "#64748B" : "#1E293B", ink, 0.8, false),
    },
    // Genuine `shape: { kind: 'morph' }` viseme mouth driven by `CANONICAL_BIPED_MORPH_TARGETS`!
    {
      id: "mouth_morph",
      jointId: "head",
      localOffset2D: [0, 12.5],
      shape: { kind: "morph" },
      style: solid("#6B1D1D", ink, 1.2, false),
    },
  ];

  // Role-specific Naval Headgear & Props (keeping parts clean & modular)
  if (role === "captain") {
    parts.push(
      {
        id: "officer_cap_top",
        jointId: "head",
        localOffset2D: [0, 48],
        shape: {
          kind: "polygon",
          points: [
            [-24, -7],
            [24, -7],
            [28, 7],
            [0, 11],
            [-28, 7],
          ],
        },
        style: solid("#F8FAFC", ink, 1.8, true),
      },
      {
        id: "officer_cap_visor",
        jointId: "head",
        localOffset2D: [0, 40],
        shape: { kind: "rect", size: [48, 6], rx: 2, ry: 2 },
        style: solid("#0F172A", ink, 1.4, false),
      },
      {
        id: "officer_badge",
        jointId: "head",
        localOffset2D: [0, 47],
        shape: { kind: "ellipse", radius: [3.8, 3.8] },
        style: solid("#FBBF24", ink, 1.0, false),
      }
    );
  } else if (role === "sailor") {
    parts.push(
      {
        id: "dixie_cup",
        jointId: "head",
        localOffset2D: [0, 46],
        shape: {
          kind: "polygon",
          points: [
            [-23, -6],
            [23, -6],
            [21, 9],
            [-21, 9],
          ],
        },
        style: solid("#FFFFFF", ink, 1.8, true),
      },
      {
        id: "sailor_tie",
        jointId: "torso",
        localOffset2D: [0, 15],
        shape: {
          kind: "polygon",
          points: [
            [-4, 8],
            [4, 8],
            [6, -9],
            [-6, -9],
          ],
        },
        style: solid("#090D16", ink, 1.0, false),
      }
    );
  } else if (role === "mp") {
    parts.push(
      {
        id: "mp_helmet",
        jointId: "head",
        localOffset2D: [0, 42],
        shape: { kind: "ellipse", radius: [25, 13] },
        style: solid("#F8FAFC", ink, 1.8, true),
      },
      {
        id: "mp_stripe",
        jointId: "head",
        localOffset2D: [0, 39],
        shape: { kind: "rect", size: [49, 4.5], rx: 1.5, ry: 1.5 },
        style: solid("#DC2626", ink, 1.0, false),
      },
      {
        id: "mp_baton",
        jointId: "arm_r_lower",
        localOffset2D: [8, -32],
        shape: { kind: "rect", size: [5.5, 36], rx: 2.5, ry: 2.5 },
        style: solid("#78350F", ink, 1.5, true),
      }
    );
  } else {
    parts.push(
      {
        id: "fdr_hair",
        jointId: "head",
        localOffset2D: [0, 43],
        shape: { kind: "ellipse", radius: [22, 8] },
        style: solid("#CBD5E1", ink, 1.4, true),
      },
      {
        id: "fdr_holder",
        jointId: "head",
        localOffset2D: [14, 15],
        shape: {
          kind: "polygon",
          points: [
            [-9, -3],
            [10, 5],
            [9, 7.5],
            [-10, -1],
          ],
        },
        style: solid("#FEF3C7", ink, 1.1, false),
      }
    );
  }

  return {
    id,
    name: `Naval Character (${id})`,
    type: "character",
    facingDirection: "right",
    renderMode: "planar",
    baseTransform: {
      position: [0, 0, 0],
      rotationZDegrees: 0,
      scale: [2.2, 2.2],
    },
    skeleton: {
      rootJointId: "pelvis",
      joints: [
        { id: "pelvis", parentId: null, localOffset2D: [0, 62], rotationZDegrees: 0, length: 16 },
        { id: "coat_tail", parentId: "pelvis", localOffset2D: [0, 2], rotationZDegrees: 0, length: 20 },
        { id: "torso", parentId: "pelvis", localOffset2D: [0, 4], rotationZDegrees: 0, length: 38 },
        { id: "head", parentId: "torso", localOffset2D: [0, 38], rotationZDegrees: 0, length: 24 },
        { id: "arm_l_upper", parentId: "torso", localOffset2D: [-24, 34], rotationZDegrees: -25, length: 26 },
        { id: "arm_l_lower", parentId: "arm_l_upper", localOffset2D: [0, -24], rotationZDegrees: -20, length: 24 },
        { id: "arm_r_upper", parentId: "torso", localOffset2D: [24, 34], rotationZDegrees: 25, length: 26 },
        { id: "arm_r_lower", parentId: "arm_r_upper", localOffset2D: [0, -24], rotationZDegrees: 20, length: 24 },
        { id: "leg_l_upper", parentId: "pelvis", localOffset2D: [-11, -2], rotationZDegrees: -4, length: 30 },
        { id: "leg_l_lower", parentId: "leg_l_upper", localOffset2D: [0, -28], rotationZDegrees: 4, length: 30 },
        { id: "leg_r_upper", parentId: "pelvis", localOffset2D: [11, -2], rotationZDegrees: 4, length: 30 },
        { id: "leg_r_lower", parentId: "leg_r_upper", localOffset2D: [0, -28], rotationZDegrees: -4, length: 30 },
      ],
    },
    morphTopology: {
      baseSegments,
      targets: morphTargets,
    },
    parts,
    secondaryMotion: [
      {
        jointId: "coat_tail",
        spring: { zeta: 0.35, omega: 16.0 },
        drive: "audio.bands.bass",
        gainDegrees: 14,
        maxDeflectionDeg: 22,
      },
    ],
    svgAsset: { idNamespace: id },
  };
}

/** Builds multi-plane 3D world-space `SceneEnvironment` (polygons + perspective grid lines) per shot */
function build3DEnvironment(shotIdx: number, u: number, t: number) {
  const polygons: any[] = [];
  const lines: any[] = [];

  const rect3D = (x0: number, y0: number, x1: number, y1: number, z: number, fill: string, tier: number, opacity = 1) => {
    polygons.push({
      vertices: [
        [x0, y0, z],
        [x1, y0, z],
        [x1, y1, z],
        [x0, y1, z],
      ] as Vec3[],
      fill,
      opacity,
      tier,
      isTwoSided: true,
    });
  };

  if (shotIdx === 0) {
    // 3D Ocean Horizon + Destroyer DD-579 + Streaking Mark-15 Torpedo + Foreground Bridge Deck
    rect3D(-950, -120, 950, 980, -700, "#13325B", 1);
    rect3D(-950, -520, 950, 140, -520, "#0C4A6E", 1);
    // Perspective 3D ocean wake lines receding from z = +40 to z = -500!
    for (let x = -420; x <= 420; x += 84) {
      lines.push({
        p0: [x, -45, 40] as Vec3,
        p1: [x * 1.4, 120, -480] as Vec3,
        stroke: "#38BDF8",
        strokeWidth: 2.2,
        opacity: 0.35,
        tier: 1,
      });
    }
    // Midground 3D Destroyer Hull at z = -340
    const shipSway = Math.sin(t * 2.2) * 18;
    polygons.push({
      vertices: [
        [-280 + shipSway, 115, -340],
        [310 + shipSway, 140, -340],
        [265 + shipSway, 55, -340],
        [-245 + shipSway, 55, -340],
      ],
      fill: "#475569",
      opacity: 1,
      tier: 2,
      isTwoSided: true,
    });
    rect3D(-90 + shipSway, 130, 115 + shipSway, 215, -338, "#64748B", 2);
    // Live Torpedo racing through Z-space at z = -190!
    const torpX = -320 + u * 680;
    rect3D(torpX - 180, 62, torpX - 30, 78, -190, "#E0F2FE", 2, 0.85);
    rect3D(torpX - 35, 56, torpX + 68, 84, -188, "#334155", 2);
    rect3D(torpX + 65, 58, torpX + 92, 82, -187, "#EA580C", 2);
    // Foreground Bridge Deck at z = +20
    rect3D(-520, -480, 520, -18, 20, "#1E293B", 3);
    // Optical Periscope HUD Crosshairs in foreground z = +110
    lines.push(
      { p0: [-220, 210, 110], p1: [220, 210, 110], stroke: "#090D16", strokeWidth: 2.5, opacity: 0.55, tier: 4 },
      { p0: [0, -10, 110], p1: [0, 430, 110], stroke: "#090D16", strokeWidth: 2.5, opacity: 0.55, tier: 4 }
    );
  } else if (shotIdx === 1) {
    // 3D Quarterdeck Brig Cell + Porthole + Slamming Foreground Iron Bars at z = +65!
    rect3D(-800, -100, 800, 900, -480, "#1E293B", 1);
    rect3D(-95, 250, 95, 430, -460, "#38BDF8", 1);
    rect3D(-600, -480, 600, -18, 10, "#0F172A", 2);
    const barDrop = (1 - Math.min(1, u / 0.28)) * 340;
    for (let bx = -215; bx <= -5; bx += 42) {
      rect3D(bx - 5, -20 + barDrop, bx + 5, 380 + barDrop, 55, "#94A3B8", 4);
    }
    rect3D(-230, 365 + barDrop, 10, 382 + barDrop, 56, "#CBD5E1", 4);
  } else if (shotIdx === 2) {
    // 3D Atlantic Night Escort — Volumetric Searchlight Cones in Z-Depth + USS Iowa + Deck
    rect3D(-950, -80, 950, 980, -700, "#071329", 1);
    const sweep = Math.sin(t * 1.6) * 110;
    polygons.push(
      {
        vertices: [
          [-180, 80, -440],
          [-320 + sweep, 780, -440],
          [-60 + sweep, 780, -440],
        ],
        fill: "#FEF08A",
        opacity: 0.22,
        tier: 1,
        isTwoSided: true,
      },
      {
        vertices: [
          [190, 80, -440],
          [80 - sweep, 780, -440],
          [340 - sweep, 780, -440],
        ],
        fill: "#BAE6FD",
        opacity: 0.20,
        tier: 1,
        isTwoSided: true,
      }
    );
    // Battleship USS Iowa silhouette at z = -380
    rect3D(-340, 75, 340, 145, -380, "#1E293B", 2);
    rect3D(-130, 145, 140, 235, -378, "#334155", 2);
    rect3D(-620, -480, 620, -18, 15, "#1E293B", 3);
  } else {
    // 3D Norfolk Harbor Anchor Chaos — Docked Sister Ship at z = -260 + Swinging Giant Anchor at z = -80!
    rect3D(-950, -80, 950, 980, -680, "#2563EB", 1);
    rect3D(-580, 80, 580, 410, -260, "#64748B", 2);
    // Scraped orange hull tear on sister destroyer!
    rect3D(-280, 210, -260 + u * 540, 238, -252, "#EA580C", 2);
    // Swinging Giant Iron Anchor in midground z = -85!
    const ax = -190 + u * 380;
    rect3D(ax - 12, 235, ax + 12, 470, -85, "#0F172A", 2);
    rect3D(ax - 62, 415, ax + 62, 435, -85, "#1E293B", 2);
    polygons.push({
      vertices: [
        [ax - 95, 290, -84],
        [ax, 205, -84],
        [ax + 95, 290, -84],
        [ax + 68, 315, -84],
        [ax, 250, -84],
        [ax - 68, 315, -84],
      ],
      fill: "#1E293B",
      opacity: 1,
      tier: 2,
      isTwoSided: true,
    });
    rect3D(-600, -480, 600, -18, 15, "#334155", 3);
  }

  return { polygons, lines };
}

async function main() {
  const { SceneCompositor } = await import(
    pathToFileURL(path.join(STUDIO25D_ROOT, "src/engine/compositor/scene-compositor.ts")).href
  );
  const { SvgRasterizer } = await import(
    pathToFileURL(path.join(STUDIO25D_ROOT, "src/renderer/rasterizer.ts")).href
  );
  const { createCanvas, ImageData } = await import("@napi-rs/canvas");
  const encodePNG = (w: number, h: number, rgba: Uint8Array) => {
    const c = createCanvas(w, h);
    c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
    return c.toBuffer("image/png");
  };
  const { BASE_MOUTH_REST_SEGMENTS, CANONICAL_BIPED_MORPH_TARGETS } = await import(
    pathToFileURL(path.join(STUDIO25D_ROOT, "src/engine/rigging/vocal-performance-solver.ts")).href
  );

  const scaleSegs = (segs: any[], k = 2.4) =>
    segs.map((s) => ({
      p0: [s.p0[0] * k, s.p0[1] * k],
      p1: [s.p1[0] * k, s.p1[1] * k],
      p2: [s.p2[0] * k, s.p2[1] * k],
      p3: [s.p3[0] * k, s.p3[1] * k],
    }));
  const scaledBase = scaleSegs(BASE_MOUTH_REST_SEGMENTS, 2.4);
  const scaledTargets = CANONICAL_BIPED_MORPH_TARGETS.map((mt: any) => ({
    name: mt.name,
    segments: scaleSegs(mt.segments, 2.4),
  }));

  const rigsMap = new Map<string, any>([
    ["captain", buildNaval25DRig("captain", "captain", scaledBase, scaledTargets)],
    ["sailor", buildNaval25DRig("sailor", "sailor", scaledBase, scaledTargets)],
    ["fdr", buildNaval25DRig("fdr", "fdr", scaledBase, scaledTargets)],
    ["mp", buildNaval25DRig("mp", "mp", scaledBase, scaledTargets)],
  ]);

  const compositor = new SceneCompositor({ width: W, height: H, fps: FPS });
  const rasterizer = new SvgRasterizer({ width: W, height: H, loadSystemFonts: false });

  const renderFrameRGBA = (frameIdx: number): Uint8Array => {
    const t = frameIdx / FPS;
    const shot = shotAt(t);
    const vis = rhubarbAt(t);
    const u = shot.u;
    const blink = (t % 3.0) < 0.14 ? Math.sin(((t % 3.0) / 0.14) * Math.PI) : 0;

    // Authentic 3D Camera Trajectory: dolly push-in, lateral parallax orbit, Dutch roll & impact shake!
    const shake =
      (shot.index === 0 && u > 0.22 && u < 0.48) || (shot.index === 3 && u > 0.18 && u < 0.65)
        ? Math.sin(frameIdx * 1.9) * 5.5
        : 0;

    const camZ = (shot.index === 1 ? 495 : 445) - u * 45;
    const camX = Math.sin(u * Math.PI - 1.57) * 24 + shake;
    const camY = 115 + Math.cos(t * 1.5) * 6 + shake * 0.5;
    const roll = shot.index === 3 ? Math.sin(t * 2.5) * 2.8 : Math.sin(t * 1.1) * 1.2;

    const morphWeights: Record<string, number> = {
      blink,
      mouthOpen: vis.open,
      mouth_wide_a: vis.studio === "AA" || vis.studio === "EH" ? 0.95 : 0.0,
      mouth_open_o: vis.studio === "OH" || vis.studio === "OO" ? 0.95 : 0.0,
      mouth_smile: shot.index === 2 ? 0.65 : 0.0,
    };

    const entities: any[] = [];
    if (shot.index === 0) {
      entities.push({
        rigId: "captain",
        worldPosition: [0, -18, 45],
        worldRotationZDegrees: Math.sin(t * 2.0) * 3,
        scale: [1.35, 1.35],
        jointAngles: {
          torso: Math.sin(t * 2.2) * 5,
          head: Math.sin(t * 2.7) * 9,
          arm_l_upper: -115 + Math.sin(t * 3.4) * 14,
          arm_l_lower: -35,
          arm_r_upper: 115 - Math.sin(t * 3.4) * 14,
          arm_r_lower: 35,
          coat_tail: Math.sin(t * 3.1) * 12,
        },
        jointOffsets: {},
        morphWeights,
        opacity: 1,
      });
    } else if (shot.index === 1) {
      entities.push(
        {
          rigId: "sailor",
          worldPosition: [-58, -18, 25],
          worldRotationZDegrees: -3,
          scale: [1.08, 1.08],
          jointAngles: {
            torso: -5 + Math.sin(t * 3.5) * 4,
            head: 10 + Math.sin(t * 4.0) * 7,
            arm_l_upper: -145 + Math.sin(t * 4.2) * 10,
            arm_l_lower: -15,
            arm_r_upper: 145 - Math.sin(t * 4.2) * 10,
            arm_r_lower: 15,
            coat_tail: Math.sin(t * 3.0) * 8,
          },
          jointOffsets: {},
          morphWeights,
          opacity: 1,
        },
        {
          rigId: "mp",
          worldPosition: [62, -18, 48],
          worldRotationZDegrees: 2,
          scale: [1.12, 1.12],
          jointAngles: {
            torso: 4,
            head: -10,
            arm_l_upper: -25,
            arm_l_lower: -35,
            arm_r_upper: 120 + Math.sin(t * 3.8) * 18,
            arm_r_lower: 25,
            coat_tail: Math.sin(t * 2.6) * 6,
          },
          jointOffsets: {},
          morphWeights: { blink },
          opacity: 1,
        }
      );
    } else if (shot.index === 2) {
      entities.push({
        rigId: "fdr",
        worldPosition: [0, -18, 45],
        worldRotationZDegrees: 0,
        scale: [1.38, 1.38],
        jointAngles: {
          torso: Math.sin(t * 1.2) * 3,
          head: Math.sin(t * 1.5) * 7,
          arm_l_upper: -35 + Math.sin(t * 1.6) * 10,
          arm_l_lower: -45,
          arm_r_upper: 95 + Math.sin(t * 2.1) * 15,
          arm_r_lower: 35,
          coat_tail: Math.sin(t * 2.2) * 14,
        },
        jointOffsets: {},
        morphWeights,
        opacity: 1,
      });
    } else {
      entities.push({
        rigId: "captain",
        worldPosition: [12, -18, 45],
        worldRotationZDegrees: Math.sin(t * 3.6) * 4,
        scale: [1.32, 1.32],
        jointAngles: {
          torso: Math.sin(t * 3.2) * 6,
          head: -8 + Math.sin(t * 4.4) * 11,
          arm_l_upper: -135 + Math.sin(t * 4.0) * 14,
          arm_l_lower: -45,
          arm_r_upper: 135 - Math.sin(t * 4.0) * 14,
          arm_r_lower: 45,
          coat_tail: Math.sin(t * 3.8) * 16,
        },
        jointOffsets: {},
        morphWeights,
        opacity: 1,
      });
    }

    const audioFeat = {
      frameIndex: frameIdx,
      timestamp: t,
      rms: 0.35 + vis.open * 0.4,
      rmsRelativeGlobal: 0.45 + vis.open * 0.35,
      rmsRelativeLocal: 0.5 + vis.open * 0.3,
      localWindowFrames: 30,
      spectralFlux: 0.3,
      onsetStrength: vis.open * 0.5,
      isOnset: false,
      bands: {
        subBass: 0.4,
        bass: 0.5 + 0.3 * Math.sin(t * 4),
        lowMid: 0.45,
        mid: vis.open,
        highMid: 0.3,
        presence: 0.35,
        brilliance: 0.25,
      },
    };

    const frameState = {
      frameIndex: frameIdx,
      timeSeconds: t,
      shotId: shot.id,
      camera: {
        projectionMode: "perspective" as const,
        position: [camX, camY, camZ] as Vec3,
        target: [0, 105, -120] as Vec3,
        up: [0, 1, 0] as Vec3,
        nearPlane: 0.1,
        farPlane: 3000,
        rollDegrees: roll,
        verticalFovDegrees: 54,
      },
      palette: {
        background: shot.index === 2 ? "#061124" : "#0B1E38",
        primary: "#1D4ED8",
        secondary: "#475569",
        accent: "#FBBF24",
        ambientLightColor: "#FFFBEB",
        ambientIntensity: 0.68,
        keyLightDirection: [-0.45, 0.75, 0.5] as Vec3,
        audioReactiveGain: 0.4,
      },
      audio: audioFeat,
      lyric: null,
      entities,
    };

    const env = build3DEnvironment(shot.index, u, t);
    const { svg } = compositor.renderFrame(frameState, rigsMap, env, [], () => audioFeat);
    const raw = new Uint8Array(rasterizer.rasterize(svg));
    return stampCaptionRGBA(raw, t);
  };

  if (SMOKE_DIR) {
    fs.mkdirSync(SMOKE_DIR, { recursive: true });
    for (const f of [60, 225, 375, 525]) {
      const rgba = renderFrameRGBA(f);
      fs.writeFileSync(path.join(SMOKE_DIR, `studio25d_f${f}.png`), encodePNG({ width: W, height: H, data: rgba }));
    }
    console.log(`[Studio25D] Wrote 4 native 2.5D Z-depth smoke frames to ${SMOKE_DIR}`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT_MP4), { recursive: true });
  const ff = spawn(
    FFMPEG_BIN,
    [
      "-y",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgba",
      "-s",
      `${W}x${H}`,
      "-r",
      String(FPS),
      "-i",
      "-",
      "-i",
      AUDIO_20S_WAV,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      OUT_MP4,
    ],
    { stdio: ["pipe", "inherit", "inherit"] }
  );

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const rgba = renderFrameRGBA(f);
    if (!ff.stdin.write(rgba)) {
      await new Promise<void>((res) => ff.stdin.once("drain", () => res()));
    }
    if ((f + 1) % 100 === 0) console.log(`[Studio25D] Rendered ${f + 1}/${TOTAL_FRAMES} frames`);
  }
  ff.stdin.end();
  await new Promise<void>((resolve, reject) => {
    ff.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited ${code}`))));
  });
  console.log(`[Studio25D] Completed 20.00s master -> ${OUT_MP4}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
