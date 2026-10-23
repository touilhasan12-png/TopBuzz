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
  SHOTS_20S,
  shotAt,
  rhubarbAt,
} from "../shared/story_helper.mjs";
import { stampCaptionRGBA } from "../shared/rgba_caption_overlay.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REV2D_ROOT = process.env.REV2D_ROOT || "/tmp/gh_engines/rev2d";
import ffmpegStatic from "ffmpeg-static";
const FFMPEG_BIN = process.env.FFMPEG_BIN || ffmpegStatic!;
const OUT_MP4 = process.env.OUT_MP4 || "/tmp/bench_out/01_Rev2D_20s.mp4";
const SMOKE_DIR = process.env.SMOKE_DIR || "";

const r = (v: number, digits = 1): number => {
  const k = 10 ** digits;
  const out = Math.round(v * k) / k;
  return Object.is(out, -0) ? 0 : out;
};
const p = (x: number, y: number) => `${r(x)} ${r(y)}`;

type Pt = [number, number];
type Rect = [number, number, number, number];

function warpOffsets(
  rect: Rect,
  cols: number,
  rows: number,
  field: (x: number, y: number, col: number, row: number) => Pt
): number[] {
  const flat: number[] = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const x = rect[0] + (rect[2] * col) / cols;
      const y = rect[1] + (rect[3] * row) / rows;
      const [dx, dy] = field(x, y, col, row);
      flat.push(r(dx), r(dy));
    }
  }
  return flat;
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  const kx = rx * 0.5523;
  const ky = ry * 0.5523;
  return [
    `M ${p(cx - rx, cy)}`,
    `C ${p(cx - rx, cy - ky)} ${p(cx - kx, cy - ry)} ${p(cx, cy - ry)}`,
    `C ${p(cx + kx, cy - ry)} ${p(cx + rx, cy - ky)} ${p(cx + rx, cy)}`,
    `C ${p(cx + rx, cy + ky)} ${p(cx + kx, cy + ry)} ${p(cx, cy + ry)}`,
    `C ${p(cx - kx, cy + ry)} ${p(cx - rx, cy + ky)} ${p(cx - rx, cy)} Z`,
  ].join(" ");
}

function roundRectPath(x: number, y: number, w: number, h: number, rad: number): string {
  const rr = Math.min(rad, w / 2, h / 2);
  return [
    `M ${p(x + rr, y)}`,
    `L ${p(x + w - rr, y)}`,
    `Q ${p(x + w, y)} ${p(x + w, y + rr)}`,
    `L ${p(x + w, y + h - rr)}`,
    `Q ${p(x + w, y + h)} ${p(x + w - rr, y + h)}`,
    `L ${p(x + rr, y + h)}`,
    `Q ${p(x, y + h)} ${p(x, y + h - rr)}`,
    `L ${p(x, y + rr)}`,
    `Q ${p(x, y)} ${p(x + rr, y)} Z`,
  ].join(" ");
}

function mouthKeyPath(cx: number, cy: number, openAmt: number, formAmt: number, scale = 1): string {
  const hw = (32 + formAmt * 9) * scale;
  const cornerLift = -formAmt * 7 * scale;
  const upDip = (4 + openAmt * 6) * scale;
  const loDrop = (5 + openAmt * 42) * scale;
  const lx = cx - hw;
  const rx = cx + hw;
  const ly = cy + cornerLift;
  return [
    `M ${p(lx, ly)}`,
    `C ${p(cx - hw * 0.45, cy - upDip)} ${p(cx + hw * 0.45, cy - upDip)} ${p(rx, ly)}`,
    `C ${p(cx + hw * 0.52, cy + loDrop)} ${p(cx - hw * 0.52, cy + loDrop)} ${p(lx, ly)} Z`,
  ].join(" ");
}

interface CharacterSpec {
  prefix: string;
  cx: number;
  footY: number;
  scale: number;
  zBase: number;
  role: "captain" | "sailor" | "fdr" | "mp";
  speaks: boolean;
}

/**
 * Adds a full Live2D-style rigged cartoon naval character to a Rev2D `.r2d.json` model:
 *  - Skeletal spine + head + dual articulated upper/lower arms & legs
 *  - 8x8 `faceWarp` with 3x3 AngleX x AngleY 2.5D sphere-parallax deformation lattice
 *  - Masked `eyeBallWarp` with irises, pupils, double catchlights & blinking lids
 *  - 2D `MouthOpen` x `MouthForm` cubic morph keyforms + teeth + tongue
 *  - Multi-segment spring-pendulum physics chain driving `HatSway` & `CoatSway`
 */
function addNavalCharacterRig(
  doc: {
    parameters: any[];
    bones: any[];
    warps: any[];
    parts: any[];
    bindings: any[];
    physics: any[];
  },
  spec: CharacterSpec
) {
  const { prefix: P, cx, footY, scale: S, zBase: Z, role } = spec;
  const hipY = footY - 260 * S;
  const neckY = hipY - 210 * S;
  const headCY = neckY - 118 * S;

  const skin = role === "fdr" ? "#F7D9C4" : role === "mp" ? "#EAC0A2" : "#F5CFAF";
  const skinShade = role === "fdr" ? "#DFB499" : "#D9A684";
  const coatCol =
    role === "sailor"
      ? "#1B3556"
      : role === "fdr"
      ? "#142238"
      : role === "mp"
      ? "#243B55"
      : "#172A46";
  const coatShade =
    role === "sailor"
      ? "#10223A"
      : role === "fdr"
      ? "#0B1526"
      : role === "mp"
      ? "#162638"
      : "#0E1B30";
  const ink = "#0D131D";

  // Parameters
  doc.parameters.push(
    { id: `${P}_AngleX`, min: -30, max: 30, default: 0, group: P },
    { id: `${P}_AngleY`, min: -30, max: 30, default: 0, group: P },
    { id: `${P}_AngleZ`, min: -30, max: 30, default: 0, group: P },
    { id: `${P}_BodyLean`, min: -15, max: 15, default: 0, group: P },
    { id: `${P}_EyeOpen`, min: 0, max: 1, default: 1, group: P },
    { id: `${P}_GazeX`, min: -1, max: 1, default: 0, group: P },
    { id: `${P}_GazeY`, min: -1, max: 1, default: 0, group: P },
    { id: `${P}_BrowY`, min: -1, max: 1, default: 0, group: P },
    { id: `${P}_MouthOpen`, min: 0, max: 1, default: 0, group: P },
    { id: `${P}_MouthForm`, min: -1, max: 1, default: 0, group: P },
    { id: `${P}_ArmLRot`, min: -140, max: 140, default: 24, group: P },
    { id: `${P}_ForeLRot`, min: -140, max: 140, default: -28, group: P },
    { id: `${P}_ArmRRot`, min: -140, max: 140, default: -24, group: P },
    { id: `${P}_ForeRRot`, min: -140, max: 140, default: 28, group: P },
    { id: `${P}_HatSway`, min: -1, max: 1, default: 0, group: P },
    { id: `${P}_CoatSway`, min: -1, max: 1, default: 0, group: P }
  );

  // Bones (model space coordinates -> parent chain)
  doc.bones.push(
    { id: `${P}_root`, x: r(cx), y: r(footY), length: 0 },
    { id: `${P}_hips`, parent: `${P}_root`, x: 0, y: r(-260 * S), rotation: -90, length: r(210 * S) },
    { id: `${P}_neck`, parent: `${P}_hips`, x: r(210 * S), y: 0, length: r(34 * S) },
    { id: `${P}_head`, parent: `${P}_neck`, x: r(34 * S), y: 0, length: r(160 * S) },
    // Left arm (screen left — rest points outward-left at 205 deg)
    { id: `${P}_armL`, parent: `${P}_hips`, x: r(192 * S), y: r(-106 * S), rotation: 205, length: r(118 * S) },
    { id: `${P}_foreL`, parent: `${P}_armL`, x: r(118 * S), y: 0, rotation: 15, length: r(106 * S) },
    // Right arm (screen right — rest points outward-right at 155 deg)
    { id: `${P}_armR`, parent: `${P}_hips`, x: r(192 * S), y: r(106 * S), rotation: 155, length: r(118 * S) },
    { id: `${P}_foreR`, parent: `${P}_armR`, x: r(118 * S), y: 0, rotation: -15, length: r(106 * S) }
  );

  const faceRect: Rect = [r(cx - 190 * S), r(headCY - 235 * S), r(380 * S), r(380 * S)];
  const eyeRect: Rect = [r(cx - 95 * S), r(headCY - 48 * S), r(190 * S), r(68 * S)];
  const hatRect: Rect = [r(cx - 180 * S), r(headCY - 220 * S), r(360 * S), r(185 * S)];
  const coatRect: Rect = [r(cx - 160 * S), r(hipY - 225 * S), r(320 * S), r(285 * S)];

  doc.warps.push(
    { id: `${P}_coatWarp`, parent: `${P}_hips`, rect: coatRect, cols: 4, rows: 4 },
    { id: `${P}_faceWarp`, parent: `${P}_head`, rect: faceRect, cols: 8, rows: 8 },
    { id: `${P}_eyeWarp`, parent: `${P}_faceWarp`, rect: eyeRect, cols: 4, rows: 2 },
    { id: `${P}_hatWarp`, parent: `${P}_faceWarp`, rect: hatRect, cols: 4, rows: 3 }
  );

  // Ground cast shadow
  doc.parts.push({
    id: `${P}_shadow`,
    parent: `${P}_root`,
    shape: { type: "ellipse", cx: r(cx), cy: r(footY + 6 * S), rx: r(122 * S), ry: r(24 * S) },
    fill: "rgba(5, 10, 20, 0.42)",
    z: Z,
  });

  // Legs + Naval Boots
  for (const [side, dir] of [
    ["L", -1],
    ["R", 1],
  ] as const) {
    const lx = cx + dir * 48 * S;
    doc.parts.push(
      {
        id: `${P}_leg${side}`,
        parent: `${P}_root`,
        shape: {
          type: "path",
          d: roundRectPath(lx - 34 * S, hipY - 10 * S, 68 * S, 245 * S, 24 * S),
        },
        fill: {
          type: "linear",
          from: [r(lx - 34 * S), r(hipY)],
          to: [r(lx + 34 * S), r(hipY)],
          stops: [
            [0, coatCol],
            [0.7, coatCol],
            [1, coatShade],
          ],
        },
        stroke: { color: ink, width: r(4.2 * S) },
        z: Z + 2,
      },
      {
        id: `${P}_boot${side}`,
        parent: `${P}_root`,
        shape: {
          type: "path",
          d: roundRectPath(lx - 42 * S + dir * 6 * S, footY - 46 * S, 88 * S, 48 * S, 20 * S),
        },
        fill: "#161B24",
        stroke: { color: ink, width: r(4.2 * S) },
        z: Z + 3,
      }
    );
  }

  // Torso Uniform Jacket + Shading + Collar + Brass Buttons / Neckerchief
  const torsoPath = [
    `M ${p(cx - 114 * S, hipY - 196 * S)}`,
    `Q ${p(cx, hipY - 216 * S)} ${p(cx + 114 * S, hipY - 196 * S)}`,
    `L ${p(cx + 128 * S, hipY + 34 * S)}`,
    `Q ${p(cx, hipY + 52 * S)} ${p(cx - 128 * S, hipY + 34 * S)} Z`,
  ].join(" ");

  doc.parts.push({
    id: `${P}_torso`,
    parent: `${P}_coatWarp`,
    shape: { type: "path", d: torsoPath, detail: 8 },
    fill: {
      type: "linear",
      from: [r(cx - 115 * S), r(hipY - 200 * S)],
      to: [r(cx + 115 * S), r(hipY + 35 * S)],
      stops: [
        [0, coatCol],
        [0.68, coatCol],
        [1, coatShade],
      ],
    },
    stroke: { color: ink, width: r(4.5 * S) },
    z: Z + 5,
  });

  // White shirt V-neck & tie / Sailor neckerchief / MP brass belt
  doc.parts.push({
    id: `${P}_shirtV`,
    parent: `${P}_coatWarp`,
    shape: {
      type: "path",
      d: `M ${p(cx - 42 * S, hipY - 202 * S)} L ${p(cx, hipY - 108 * S)} L ${p(cx + 42 * S, hipY - 202 * S)} Z`,
    },
    fill: role === "sailor" ? "#F8FAFC" : "#FFFFFF",
    stroke: { color: ink, width: r(3.2 * S) },
    z: Z + 6,
  });

  if (role === "captain" || role === "fdr") {
    // Black necktie + gold double-breasted naval buttons / FDR cloak clasp
    doc.parts.push({
      id: `${P}_tie`,
      parent: `${P}_coatWarp`,
      shape: {
        type: "path",
        d: `M ${p(cx - 10 * S, hipY - 186 * S)} L ${p(cx + 10 * S, hipY - 186 * S)} L ${p(cx + 14 * S, hipY - 118 * S)} L ${p(cx, hipY - 104 * S)} L ${p(cx - 14 * S, hipY - 118 * S)} Z`,
      },
      fill: role === "fdr" ? "#7F1D1D" : "#111827",
      z: Z + 7,
    });
    for (let row = 0; row < 3; row++) {
      for (const sgn of [-1, 1]) {
        doc.parts.push({
          id: `${P}_btn_${row}_${sgn > 0 ? "R" : "L"}`,
          parent: `${P}_coatWarp`,
          shape: {
            type: "ellipse",
            cx: r(cx + sgn * 44 * S),
            cy: r(hipY - (92 - row * 42) * S),
            rx: r(8.5 * S),
            ry: r(8.5 * S),
          },
          fill: "#FBBF24",
          stroke: { color: ink, width: r(2.4 * S) },
          z: Z + 7,
        });
      }
    }
    if (role === "captain") {
      // Shoulder gold epistemes
      for (const sgn of [-1, 1]) {
        doc.parts.push({
          id: `${P}_epaulet_${sgn > 0 ? "R" : "L"}`,
          parent: `${P}_coatWarp`,
          shape: {
            type: "path",
            d: roundRectPath(cx + sgn * 86 * S - 28 * S, hipY - 210 * S, 56 * S, 20 * S, 7 * S),
          },
          fill: "#F59E0B",
          stroke: { color: ink, width: r(3 * S) },
          z: Z + 8,
        });
      }
    }
  } else if (role === "sailor") {
    // Sailor black silk neckerchief knot & blue jumper stripes
    doc.parts.push({
      id: `${P}_neckerchief`,
      parent: `${P}_coatWarp`,
      shape: {
        type: "path",
        d: `M ${p(cx - 16 * S, hipY - 135 * S)} L ${p(cx + 16 * S, hipY - 135 * S)} L ${p(cx + 26 * S, hipY - 52 * S)} L ${p(cx, hipY - 68 * S)} L ${p(cx - 26 * S, hipY - 52 * S)} Z`,
      },
      fill: "#0F172A",
      stroke: { color: ink, width: r(3 * S) },
      z: Z + 7,
    });
  } else if (role === "mp") {
    // White cross-belt + golden MP badge
    doc.parts.push({
      id: `${P}_crossbelt`,
      parent: `${P}_coatWarp`,
      shape: {
        type: "path",
        d: `M ${p(cx - 96 * S, hipY - 200 * S)} L ${p(cx - 68 * S, hipY - 200 * S)} L ${p(cx + 98 * S, hipY + 26 * S)} L ${p(cx + 70 * S, hipY + 26 * S)} Z`,
      },
      fill: "#F8FAFC",
      stroke: { color: ink, width: r(3.2 * S) },
      z: Z + 7,
    });
  }

  // Articulated Arms & Expressive Hands (bound directly to armL/foreL & armR/foreR bones!)
  for (const [side, sgn] of [
    ["L", -1],
    ["R", 1],
  ] as const) {
    const shX = cx + sgn * 98 * S;
    const shY = hipY - 192 * S;
    const elX = shX + sgn * 30 * S;
    const elY = shY + 114 * S;
    const wrX = elX + sgn * 14 * S;
    const wrY = elY + 98 * S;

    doc.parts.push(
      {
        id: `${P}_upperArm${side}`,
        parent: `${P}_arm${side}`,
        shape: {
          type: "path",
          d: roundRectPath(shX - 28 * S, shY - 18 * S, 56 * S, 134 * S, 24 * S),
        },
        fill: coatCol,
        stroke: { color: ink, width: r(4.2 * S) },
        z: side === "L" ? Z + 4 : Z + 14,
      },
      {
        id: `${P}_foreArm${side}`,
        parent: `${P}_fore${side}`,
        shape: {
          type: "path",
          d: roundRectPath(elX - 25 * S, elY - 32 * S, 50 * S, 134 * S, 22 * S),
        },
        fill: coatCol,
        stroke: { color: ink, width: r(4.2 * S) },
        z: side === "L" ? Z + 15 : Z + 16,
      },
      // Gold sleeve stripe for Captain / MP armband
      {
        id: `${P}_cuff${side}`,
        parent: `${P}_fore${side}`,
        shape: {
          type: "path",
          d: roundRectPath(elX - 26 * S, elY + 68 * S, 52 * S, 15 * S, 5 * S),
        },
        fill: role === "sailor" ? "#FFFFFF" : "#FBBF24",
        stroke: { color: ink, width: r(2.5 * S) },
        z: Z + 17,
      },
      // Expressive Cartoon Hand with Thumb
      {
        id: `${P}_hand${side}`,
        parent: `${P}_fore${side}`,
        shape: {
          type: "path",
          d: `${ellipsePath(wrX - 10 * S, wrY + 12 * S, 26 * S, 24 * S)} ${ellipsePath(wrX - sgn * 22 * S, wrY + 4 * S, 12 * S, 9 * S)}`,
        },
        fill: skin,
        stroke: { color: ink, width: r(3.8 * S) },
        z: Z + 18,
      }
    );

    if (role === "mp" && side === "R") {
      // Wooden MP Baton attached to right forearm!
      doc.parts.push({
        id: `${P}_baton`,
        parent: `${P}_foreR`,
        shape: {
          type: "path",
          d: roundRectPath(wrX - 12 * S, wrY - 145 * S, 22 * S, 175 * S, 10 * S),
        },
        fill: "#78350F",
        stroke: { color: ink, width: r(4 * S) },
        z: Z + 19,
      });
    }
  }

  // Neck + Chin cast shadow
  doc.parts.push(
    {
      id: `${P}_neckPart`,
      parent: `${P}_neck`,
      shape: {
        type: "path",
        d: roundRectPath(cx - 32 * S, neckY - 30 * S, 64 * S, 64 * S, 20 * S),
      },
      fill: skinShade,
      stroke: { color: ink, width: r(3.8 * S) },
      z: Z + 8,
    },
    // Ears inside faceWarp so they compress with 2.5D head turn!
    {
      id: `${P}_ears`,
      parent: `${P}_faceWarp`,
      shape: {
        type: "path",
        d: `${ellipsePath(cx - 106 * S, headCY + 8 * S, 22 * S, 30 * S)} ${ellipsePath(cx + 106 * S, headCY + 8 * S, 22 * S, 30 * S)}`,
      },
      fill: skinShade,
      stroke: { color: ink, width: r(3.8 * S) },
      z: Z + 9,
    },
    // Expressive Cartoon Head Silhouette (warm gradient fill + crisp clean linework)
    {
      id: `${P}_headShape`,
      parent: `${P}_faceWarp`,
      shape: {
        type: "path",
        d: [
          `M ${p(cx, headCY - 112 * S)}`,
          `C ${p(cx + 78 * S, headCY - 112 * S)} ${p(cx + 108 * S, headCY - 58 * S)} ${p(cx + 104 * S, headCY + 14 * S)}`,
          `C ${p(cx + 100 * S, headCY + 78 * S)} ${p(cx + 58 * S, headCY + 114 * S)} ${p(cx, headCY + 114 * S)}`,
          `C ${p(cx - 58 * S, headCY + 114 * S)} ${p(cx - 100 * S, headCY + 78 * S)} ${p(cx - 104 * S, headCY + 14 * S)}`,
          `C ${p(cx - 108 * S, headCY - 58 * S)} ${p(cx - 78 * S, headCY - 112 * S)} ${p(cx, headCY - 112 * S)} Z`,
        ].join(" "),
        detail: 10,
      },
      fill: {
        type: "linear",
        from: [r(cx - 60 * S), r(headCY - 105 * S)],
        to: [r(cx + 65 * S), r(headCY + 110 * S)],
        stops: [
          [0, skin],
          [0.74, skin],
          [1, skinShade],
        ],
      },
      stroke: { color: ink, width: r(4.5 * S) },
      z: Z + 10,
    }
  );

  // Subtle cheek warmth
  for (const sgn of [-1, 1]) {
    doc.parts.push({
      id: `${P}_cheek_${sgn > 0 ? "R" : "L"}`,
      parent: `${P}_faceWarp`,
      shape: {
        type: "ellipse",
        cx: r(cx + sgn * 62 * S),
        cy: r(headCY + 28 * S),
        rx: r(22 * S),
        ry: r(12 * S),
      },
      fill: "rgba(239, 108, 87, 0.24)",
      z: Z + 11,
    });
  }

  // Expressive Masked Cartoon Eyes + Irises + Pupils + Catchlights + Brows
  for (const [tag, sgn] of [
    ["L", -1],
    ["R", 1],
  ] as const) {
    const ex = cx + sgn * 42 * S;
    const ey = headCY - 10 * S;
    const whiteId = `${P}_eyeWhite_${tag}`;
    const openD = ellipsePath(ex, ey, 25 * S, 29 * S);
    const closedD = ellipsePath(ex, ey + 6 * S, 26 * S, 2.5 * S);

    doc.parts.push(
      {
        id: whiteId,
        parent: `${P}_faceWarp`,
        shape: { type: "path", d: openD, detail: 6 },
        fill: "#FFFFFF",
        stroke: { color: ink, width: r(3.8 * S) },
        z: Z + 12,
      },
      {
        id: `${P}_iris_${tag}`,
        parent: `${P}_eyeWarp`,
        shape: { type: "ellipse", cx: r(ex), cy: r(ey + 2 * S), rx: r(13.5 * S), ry: r(16.5 * S) },
        fill: role === "fdr" ? "#3B82F6" : role === "sailor" ? "#2563EB" : "#1E3A8A",
        mask: [whiteId],
        z: Z + 13,
      },
      {
        id: `${P}_pupil_${tag}`,
        parent: `${P}_eyeWarp`,
        shape: { type: "ellipse", cx: r(ex), cy: r(ey + 3 * S), rx: r(7 * S), ry: r(8.5 * S) },
        fill: "#090D16",
        mask: [whiteId],
        z: Z + 14,
      },
      {
        id: `${P}_glint_${tag}`,
        parent: `${P}_eyeWarp`,
        shape: { type: "ellipse", cx: r(ex - 4.5 * S), cy: r(ey - 5 * S), rx: r(4.5 * S), ry: r(4.5 * S) },
        fill: "#FFFFFF",
        mask: [whiteId],
        z: Z + 15,
      },
      {
        id: `${P}_brow_${tag}`,
        parent: `${P}_faceWarp`,
        shape: {
          type: "path",
          d: roundRectPath(ex - 28 * S, ey - 44 * S, 56 * S, 11 * S, 5 * S),
        },
        fill: role === "fdr" ? "#64748B" : "#1E293B",
        stroke: { color: ink, width: r(2 * S) },
        z: Z + 16,
      }
    );

    doc.bindings.push(
      {
        target: `part:${whiteId}.shape.d`,
        params: [`${P}_EyeOpen`],
        keys: [
          { at: [0], value: closedD },
          { at: [1], value: openD },
        ],
      },
      {
        target: `part:${P}_brow_${tag}.shape.d`,
        params: [`${P}_BrowY`],
        keys: [
          { at: [-1], value: roundRectPath(ex - 28 * S, ey - 33 * S, 56 * S, 11 * S, 5 * S) },
          { at: [0], value: roundRectPath(ex - 28 * S, ey - 44 * S, 56 * S, 11 * S, 5 * S) },
          { at: [1], value: roundRectPath(ex - 28 * S, ey - 58 * S, 56 * S, 11 * S, 5 * S) },
        ],
      }
    );
  }

  // Sculpted Cartoon Nose + FDR Pince-Nez Spectacles & Cigarette Holder
  doc.parts.push({
    id: `${P}_nose`,
    parent: `${P}_faceWarp`,
    shape: {
      type: "path",
      d: `M ${p(cx - 4 * S, headCY - 6 * S)} Q ${p(cx + 15 * S, headCY + 16 * S)} ${p(cx - 2 * S, headCY + 24 * S)}`,
    },
    fill: "transparent",
    stroke: { color: ink, width: r(3.8 * S) },
    z: Z + 16,
  });

  if (role === "fdr") {
    doc.parts.push(
      {
        id: `${P}_glasses`,
        parent: `${P}_faceWarp`,
        shape: {
          type: "path",
          d: `${ellipsePath(cx - 42 * S, headCY - 10 * S, 29 * S, 26 * S)} ${ellipsePath(cx + 42 * S, headCY - 10 * S, 29 * S, 26 * S)} M ${p(cx - 13 * S, headCY - 12 * S)} Q ${p(cx, headCY - 22 * S)} ${p(cx + 13 * S, headCY - 12 * S)}`,
        },
        fill: "rgba(255,255,255,0.12)",
        stroke: { color: "#F59E0B", width: r(3.5 * S) },
        z: Z + 18,
      },
      // Iconic angled FDR cigarette holder
      {
        id: `${P}_holder`,
        parent: `${P}_faceWarp`,
        shape: {
          type: "path",
          d: `M ${p(cx + 26 * S, headCY + 58 * S)} L ${p(cx + 96 * S, headCY + 24 * S)} L ${p(cx + 100 * S, headCY + 31 * S)} L ${p(cx + 29 * S, headCY + 64 * S)} Z`,
        },
        fill: "#FEF3C7",
        stroke: { color: ink, width: r(2.8 * S) },
        z: Z + 19,
      }
    );
  }

  // Mouth + Teeth + Tongue with 2D Keyform Morphing
  const my = headCY + 58 * S;
  doc.parts.push(
    {
      id: `${P}_mouth`,
      parent: `${P}_faceWarp`,
      shape: { type: "path", d: mouthKeyPath(cx, my, 0.05, 0, S), detail: 8 },
      fill: "#581C1C",
      stroke: { color: ink, width: r(3.8 * S) },
      z: Z + 17,
    },
    {
      id: `${P}_teeth`,
      parent: `${P}_faceWarp`,
      shape: {
        type: "path",
        d: roundRectPath(cx - 24 * S, my - 6 * S, 48 * S, 13 * S, 4 * S),
      },
      fill: "#FFFFFF",
      mask: [`${P}_mouth`],
      z: Z + 18,
    },
    {
      id: `${P}_tongue`,
      parent: `${P}_faceWarp`,
      shape: {
        type: "ellipse",
        cx: r(cx),
        cy: r(my + 26 * S),
        rx: r(20 * S),
        ry: r(12 * S),
      },
      fill: "#E11D48",
      mask: [`${P}_mouth`],
      z: Z + 18,
    }
  );

  doc.bindings.push({
    target: `part:${P}_mouth.shape.d`,
    params: [`${P}_MouthOpen`, `${P}_MouthForm`],
    keys: [
      { at: [0, -1], value: mouthKeyPath(cx, my, 0.03, -1, S) },
      { at: [1, -1], value: mouthKeyPath(cx, my, 1.0, -1, S) },
      { at: [0, 0], value: mouthKeyPath(cx, my, 0.03, 0, S) },
      { at: [1, 0], value: mouthKeyPath(cx, my, 1.0, 0, S) },
      { at: [0, 1], value: mouthKeyPath(cx, my, 0.03, 1, S) },
      { at: [1, 1], value: mouthKeyPath(cx, my, 1.0, 1, S) },
    ],
  });

  // Role-Authentic WWII Naval Headgear inside `hatWarp` (driven by spring pendulum physics!)
  if (role === "captain") {
    // Crisp White Officer Combination Cap + Black Visor + Gold Eagle Badge
    doc.parts.push(
      {
        id: `${P}_capCrown`,
        parent: `${P}_hatWarp`,
        shape: {
          type: "path",
          d: `M ${p(cx - 118 * S, headCY - 82 * S)} L ${p(cx - 134 * S, headCY - 146 * S)} Q ${p(cx, headCY - 188 * S)} ${p(cx + 134 * S, headCY - 146 * S)} L ${p(cx + 118 * S, headCY - 82 * S)} Z`,
        },
        fill: "#F8FAFC",
        stroke: { color: ink, width: r(4.5 * S) },
        z: Z + 20,
      },
      {
        id: `${P}_capBand`,
        parent: `${P}_hatWarp`,
        shape: { type: "path", d: roundRectPath(cx - 114 * S, headCY - 92 * S, 228 * S, 26 * S, 6 * S) },
        fill: "#111827",
        stroke: { color: ink, width: r(3.5 * S) },
        z: Z + 21,
      },
      {
        id: `${P}_capVisor`,
        parent: `${P}_hatWarp`,
        shape: {
          type: "path",
          d: `M ${p(cx - 108 * S, headCY - 68 * S)} Q ${p(cx, headCY - 38 * S)} ${p(cx + 108 * S, headCY - 68 * S)} Q ${p(cx, headCY - 58 * S)} ${p(cx - 108 * S, headCY - 68 * S)} Z`,
        },
        fill: "#090D16",
        stroke: { color: ink, width: r(3.5 * S) },
        z: Z + 22,
      },
      {
        id: `${P}_capBadge`,
        parent: `${P}_hatWarp`,
        shape: { type: "ellipse", cx: r(cx), cy: r(headCY - 118 * S), rx: r(18 * S), ry: r(18 * S) },
        fill: "#FBBF24",
        stroke: { color: ink, width: r(3 * S) },
        z: Z + 23,
      }
    );
  } else if (role === "sailor") {
    // White Enlisted USN "Dixie Cup" Gob Hat
    doc.parts.push(
      {
        id: `${P}_dixieBrim`,
        parent: `${P}_hatWarp`,
        shape: {
          type: "path",
          d: `M ${p(cx - 116 * S, headCY - 68 * S)} Q ${p(cx, headCY - 118 * S)} ${p(cx + 116 * S, headCY - 68 * S)} L ${p(cx + 102 * S, headCY - 134 * S)} Q ${p(cx, headCY - 166 * S)} ${p(cx - 102 * S, headCY - 134 * S)} Z`,
        },
        fill: "#FFFFFF",
        stroke: { color: ink, width: r(4.5 * S) },
        z: Z + 20,
      }
    );
  } else if (role === "mp") {
    // White Shore Patrol / MP Steel Helmet with bold black "MP" stripe
    doc.parts.push(
      {
        id: `${P}_mpHelmet`,
        parent: `${P}_hatWarp`,
        shape: {
          type: "path",
          d: `M ${p(cx - 122 * S, headCY - 48 * S)} C ${p(cx - 126 * S, headCY - 158 * S)} ${p(cx + 126 * S, headCY - 158 * S)} ${p(cx + 122 * S, headCY - 48 * S)} Z`,
        },
        fill: "#F1F5F9",
        stroke: { color: ink, width: r(4.5 * S) },
        z: Z + 20,
      },
      {
        id: `${P}_mpBand`,
        parent: `${P}_hatWarp`,
        shape: { type: "path", d: roundRectPath(cx - 118 * S, headCY - 76 * S, 236 * S, 22 * S, 6 * S) },
        fill: "#DC2626",
        stroke: { color: ink, width: r(3 * S) },
        z: Z + 21,
      }
    );
  } else {
    // FDR silver parted hair
    doc.parts.push({
      id: `${P}_fdrHair`,
      parent: `${P}_hatWarp`,
      shape: {
        type: "path",
        d: `M ${p(cx - 104 * S, headCY - 34 * S)} C ${p(cx - 112 * S, headCY - 128 * S)} ${p(cx + 112 * S, headCY - 128 * S)} ${p(cx + 104 * S, headCY - 34 * S)} C ${p(cx + 76 * S, headCY - 86 * S)} ${p(cx - 64 * S, headCY - 92 * S)} ${p(cx - 104 * S, headCY - 34 * S)} Z`,
      },
      fill: "#CBD5E1",
      stroke: { color: ink, width: r(3.8 * S) },
      z: Z + 20,
    });
  }

  // 3x3 Live2D Sphere-Parallax Head-Turn Grid (`AngleX` x `AngleY`)
  const sphere = { cx, cy: headCY, rx: 105 * S, ry: 120 * S };
  const turnKeys: any[] = [];
  for (const ay of [-30, 0, 30]) {
    for (const ax of [-30, 0, 30]) {
      const sx = ax / 30;
      const sy = ay / 30;
      turnKeys.push({
        at: [ax, ay],
        value:
          ax === 0 && ay === 0
            ? {}
            : warpOffsets(faceRect, 8, 8, (x, y) => {
                const u = (x - sphere.cx) / sphere.rx;
                const v = (y - sphere.cy) / sphere.ry;
                const depth = Math.sqrt(Math.max(0, 1 - u * u - v * v));
                const inFace = Math.min(1, Math.max(0, 1.6 - Math.hypot(u, v)));
                return [
                  (sx * (28 * depth + 6) - sy * u * v * 5 * inFace) * S,
                  (-sy * (18 * depth + 4) - sx * u * v * 6 * inFace) * S,
                ];
              }),
      });
    }
  }

  doc.bindings.push(
    { target: `warp:${P}_faceWarp.offsets`, params: [`${P}_AngleX`, `${P}_AngleY`], keys: turnKeys },
    {
      target: `bone:${P}_head.rotation`,
      params: [`${P}_AngleZ`],
      keys: [
        { at: [-30], value: -12 },
        { at: [30], value: 12 },
      ],
    },
    {
      target: `bone:${P}_hips.rotation`,
      params: [`${P}_BodyLean`],
      keys: [
        { at: [-15], value: -98 },
        { at: [15], value: -82 },
      ],
    },
    {
      target: `bone:${P}_armL.rotation`,
      params: [`${P}_ArmLRot`],
      keys: [
        { at: [-140], value: 185 },
        { at: [0], value: 205 },
        { at: [140], value: 325 },
      ],
    },
    {
      target: `bone:${P}_foreL.rotation`,
      params: [`${P}_ForeLRot`],
      keys: [
        { at: [-140], value: -110 },
        { at: [0], value: 15 },
        { at: [140], value: 120 },
      ],
    },
    {
      target: `bone:${P}_armR.rotation`,
      params: [`${P}_ArmRRot`],
      keys: [
        { at: [-140], value: 35 },
        { at: [0], value: 155 },
        { at: [140], value: 175 },
      ],
    },
    {
      target: `bone:${P}_foreR.rotation`,
      params: [`${P}_ForeRRot`],
      keys: [
        { at: [-140], value: -120 },
        { at: [0], value: -15 },
        { at: [140], value: 110 },
      ],
    },
    {
      target: `warp:${P}_eyeWarp.offsets`,
      params: [`${P}_GazeX`],
      keys: [
        { at: [-1], value: warpOffsets(eyeRect, 4, 2, () => [-8 * S, 0]) },
        { at: [0], value: {} },
        { at: [1], value: warpOffsets(eyeRect, 4, 2, () => [8 * S, 0]) },
      ],
    },
    {
      target: `warp:${P}_hatWarp.offsets`,
      params: [`${P}_HatSway`],
      keys: [
        { at: [-1], value: warpOffsets(hatRect, 4, 3, (_x, _y, _c, row) => [(3 - row) * -9 * S, -3 * S]) },
        { at: [0], value: {} },
        { at: [1], value: warpOffsets(hatRect, 4, 3, (_x, _y, _c, row) => [(3 - row) * 9 * S, -3 * S]) },
      ],
    },
    {
      target: `warp:${P}_coatWarp.offsets`,
      params: [`${P}_CoatSway`],
      keys: [
        { at: [-1], value: warpOffsets(coatRect, 4, 4, (_x, _y, _c, row) => [row * -6 * S, 0]) },
        { at: [0], value: {} },
        { at: [1], value: warpOffsets(coatRect, 4, 4, (_x, _y, _c, row) => [row * 6 * S, 0]) },
      ],
    }
  );

  // Authentic Spring-Pendulum Physics on Headgear & Uniform Coat!
  doc.physics.push(
    {
      id: `${P}_hatPhys`,
      inputs: [
        { param: `${P}_AngleX`, type: "x", weight: 0.7 },
        { param: `${P}_AngleZ`, type: "angle", weight: 0.45 },
        { param: `${P}_BodyLean`, type: "x", weight: 1.4 },
      ],
      outputs: [{ param: `${P}_HatSway`, type: "angle", scale: 0.07 }],
      segments: [
        { length: 28, mass: 1 },
        { length: 24, mass: 1 },
      ],
      damping: 0.08,
      stiffness: 26,
    },
    {
      id: `${P}_coatPhys`,
      inputs: [
        { param: `${P}_BodyLean`, type: "x", weight: 1.8 },
        { param: `${P}_AngleX`, type: "x", weight: 0.4 },
      ],
      outputs: [{ param: `${P}_CoatSway`, type: "angle", scale: 0.06 }],
      segments: [
        { length: 40, mass: 1.2 },
        { length: 42, mass: 1.0 },
      ],
      damping: 0.09,
      stiffness: 18,
    }
  );
}

/** Builds all 4 genuine `.r2d.json` scene models covering 0.00s -> 20.00s */
function buildSceneModel(shotIdx: number) {
  const doc = {
    format: "rev2d",
    version: 1,
    meta: {
      name: `willie_dee_shot_${shotIdx}`,
      width: W,
      height: H,
      background: "#0B192C",
      fps: FPS,
      author: "TopBuzz Rev2D Engine Benchmark",
    },
    parameters: [
      { id: "SceneTime", min: 0, max: 1, default: 0, group: "Scene" },
      { id: "WaveSway", min: -1, max: 1, default: 0, group: "Scene" },
      { id: "ActionProp", min: 0, max: 1, default: 0, group: "Scene" },
      { id: "CamPanX", min: -80, max: 80, default: 0, group: "Camera" },
    ] as any[],
    bones: [
      { id: "worldRoot", x: 0, y: 0, length: 0 },
      { id: "seaBone", parent: "worldRoot", x: 540, y: 1220, length: 100 },
      { id: "propBone", parent: "worldRoot", x: 0, y: 0, length: 100 },
    ] as any[],
    warps: [] as any[],
    parts: [] as any[],
    bindings: [
      {
        target: "bone:worldRoot.x",
        params: ["CamPanX"],
        keys: [
          { at: [-80], value: -80 },
          { at: [80], value: 80 },
        ],
      },
      {
        target: "bone:seaBone.x",
        params: ["WaveSway"],
        keys: [
          { at: [-1], value: 505 },
          { at: [1], value: 575 },
        ],
      },
    ] as any[],
    physics: [] as any[],
    animations: [],
  };

  if (shotIdx === 0) {
    // SHOT 0: Optical Periscope Reticle + USS Willie Dee Firing Live Mark 15 Torpedo + Shocked Captain Walter
    doc.parts.push(
      {
        id: "sky",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 0, W + 240, 1020, 0) },
        fill: {
          type: "linear",
          from: [540, 0],
          to: [540, 1020],
          stops: [
            [0, "#102847"],
            [0.55, "#1E4B7A"],
            [1, "#5788B4"],
          ],
        },
        z: 1,
      },
      {
        id: "sea",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 960, W + 240, 980, 0) },
        fill: {
          type: "linear",
          from: [540, 960],
          to: [540, 1920],
          stops: [
            [0, "#0F4C6C"],
            [0.5, "#0B334D"],
            [1, "#061C2E"],
          ],
        },
        z: 2,
      },
      // Destroyer Hull DD-579 in Midground
      {
        id: "destroyerHull",
        parent: "seaBone",
        shape: {
          type: "path",
          d: "M 130 980 L 920 945 L 865 1065 L 185 1065 Z",
        },
        fill: "#475569",
        stroke: { color: "#0D131D", width: 5 },
        z: 4,
      },
      {
        id: "destroyerSuper",
        parent: "seaBone",
        shape: {
          type: "path",
          d: "M 360 855 L 610 855 L 640 960 L 330 960 Z M 460 790 L 505 790 L 515 855 L 450 855 Z",
        },
        fill: "#64748B",
        stroke: { color: "#0D131D", width: 4.5 },
        z: 5,
      },
      // Live Mark-15 Torpedo streaking across water with orange warhead + wake foam!
      {
        id: "torpedoWake",
        parent: "propBone",
        shape: { type: "path", d: roundRectPath(-160, 1054, 420, 26, 13) },
        fill: "rgba(224, 242, 254, 0.85)",
        z: 6,
      },
      {
        id: "torpedoBody",
        parent: "propBone",
        shape: { type: "path", d: roundRectPath(220, 1038, 225, 50, 25) },
        fill: "#334155",
        stroke: { color: "#0D131D", width: 4.5 },
        z: 7,
      },
      {
        id: "torpedoWarhead",
        parent: "propBone",
        shape: { type: "ellipse", cx: 432, cy: 1063, rx: 32, ry: 24 },
        fill: "#EA580C",
        stroke: { color: "#0D131D", width: 4 },
        z: 8,
      },
      // Foreground Destroyer Bridge Deck Rail
      {
        id: "bridgeDeck",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 1520, W + 240, 420, 0) },
        fill: "#1E293B",
        stroke: { color: "#0D131D", width: 6 },
        z: 9,
      }
    );

    doc.bindings.push({
      target: "bone:propBone.x",
      params: ["ActionProp"],
      keys: [
        { at: [0], value: -80 },
        { at: [1], value: 590 },
      ],
    });

    addNavalCharacterRig(doc, {
      prefix: "capt",
      cx: 540,
      footY: 1690,
      scale: 1.02,
      zBase: 20,
      role: "captain",
      speaks: true,
    });

    // Subtle Optical Periscope Crosshair HUD Ring (zero text badges!)
    doc.parts.push(
      {
        id: "periscopeCrossH",
        parent: "worldRoot",
        shape: { type: "path", d: "M 90 520 L 990 520 M 540 120 L 540 920" },
        fill: "transparent",
        stroke: { color: "rgba(16, 24, 36, 0.52)", width: 3 },
        z: 90,
      },
      {
        id: "periscopeRing",
        parent: "worldRoot",
        shape: { type: "ellipse", cx: 540, cy: 520, rx: 430, ry: 430 },
        fill: "transparent",
        stroke: { color: "#0B111B", width: 22 },
        z: 91,
      }
    );
  } else if (shotIdx === 1) {
    // SHOT 1: Brig Arrest — Iron Cell Bars Slamming Down on Shocked Sailor Dawson + Naval MP Guard
    doc.parts.push(
      {
        id: "brigWall",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 0, W + 240, 1460, 0) },
        fill: {
          type: "linear",
          from: [540, 0],
          to: [540, 1460],
          stops: [
            [0, "#1E293B"],
            [1, "#334155"],
          ],
        },
        z: 1,
      },
      {
        id: "porthole",
        parent: "worldRoot",
        shape: { type: "ellipse", cx: 540, cy: 360, rx: 120, ry: 120 },
        fill: "#38BDF8",
        stroke: { color: "#0F172A", width: 18 },
        z: 2,
      },
      {
        id: "brigFloor",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 1450, W + 240, 490, 0) },
        fill: "#0F172A",
        stroke: { color: "#090D16", width: 5 },
        z: 3,
      }
    );

    addNavalCharacterRig(doc, {
      prefix: "sailor",
      cx: 345,
      footY: 1665,
      scale: 0.92,
      zBase: 15,
      role: "sailor",
      speaks: true,
    });
    addNavalCharacterRig(doc, {
      prefix: "mp",
      cx: 760,
      footY: 1665,
      scale: 0.94,
      zBase: 40,
      role: "mp",
      speaks: false,
    });

    // Iron Brig Bars dropping from ceiling around Sailor on left side!
    let barsD = roundRectPath(70, 180, 520, 28, 6);
    for (let bx = 105; bx <= 555; bx += 90) {
      barsD += " " + roundRectPath(bx, 180, 20, 1490, 5);
    }
    doc.parts.push({
      id: "brigBars",
      parent: "propBone",
      shape: { type: "path", d: barsD },
      fill: "#64748B",
      stroke: { color: "#090D16", width: 4 },
      z: 35,
    });
    doc.bindings.push({
      target: "bone:propBone.y",
      params: ["ActionProp"],
      keys: [
        { at: [0], value: -900 },
        { at: [1], value: 0 },
      ],
    });
  } else if (shotIdx === 2) {
    // SHOT 2: Secret Atlantic Escort — Night Searchlights + Battleship USS Iowa + President Roosevelt (FDR)
    doc.parts.push(
      {
        id: "nightSky",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 0, W + 240, 1080, 0) },
        fill: {
          type: "linear",
          from: [540, 0],
          to: [540, 1080],
          stops: [
            [0, "#050B18"],
            [0.6, "#0F2547"],
            [1, "#1D4E78"],
          ],
        },
        z: 1,
      },
      // Sweeping Atlantic Convoy Spotlight Beams!
      {
        id: "spotlight1",
        parent: "propBone",
        shape: { type: "path", d: "M 180 980 L -60 40 L 290 40 Z" },
        fill: "rgba(254, 240, 138, 0.20)",
        z: 2,
      },
      {
        id: "spotlight2",
        parent: "propBone",
        shape: { type: "path", d: "M 780 980 L 640 40 L 980 40 Z" },
        fill: "rgba(186, 230, 253, 0.18)",
        z: 2,
      },
      // Battleship USS Iowa Silhouette on Horizon
      {
        id: "iowaHull",
        parent: "seaBone",
        shape: {
          type: "path",
          d: "M 95 975 L 985 955 L 940 1055 L 145 1055 Z M 355 835 L 685 835 L 725 962 L 315 962 Z",
        },
        fill: "#1E293B",
        stroke: { color: "#090D16", width: 4.5 },
        z: 3,
      },
      {
        id: "atlanticSea",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 1030, W + 240, 500, 0) },
        fill: "#082038",
        z: 4,
      },
      {
        id: "quarterDeck",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 1480, W + 240, 460, 0) },
        fill: "#27364B",
        stroke: { color: "#090D16", width: 5.5 },
        z: 5,
      }
    );

    doc.bindings.push({
      target: "bone:propBone.x",
      params: ["ActionProp"],
      keys: [
        { at: [0], value: -75 },
        { at: [1], value: 85 },
      ],
    });

    addNavalCharacterRig(doc, {
      prefix: "fdr",
      cx: 540,
      footY: 1685,
      scale: 1.04,
      zBase: 20,
      role: "fdr",
      speaks: true,
    });
  } else {
    // SHOT 3: Norfolk Harbor Anchor Chaos — Giant Heavy Fluke Anchor Tearing Sister Ship Railings!
    doc.parts.push(
      {
        id: "harborSky",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 0, W + 240, 960, 0) },
        fill: {
          type: "linear",
          from: [540, 0],
          to: [540, 960],
          stops: [
            [0, "#1D4ED8"],
            [0.65, "#60A5FA"],
            [1, "#DBEAFE"],
          ],
        },
        z: 1,
      },
      // Docked Sister Destroyer Hull Getting Ripped Open!
      {
        id: "sisterShipHull",
        parent: "worldRoot",
        shape: { type: "path", d: "M -80 560 L 1120 650 L 1120 1180 L -80 1120 Z" },
        fill: "#64748B",
        stroke: { color: "#0D131D", width: 5.5 },
        z: 3,
      },
      // Torn jagged scrape gash on sister ship!
      {
        id: "hullGash",
        parent: "worldRoot",
        shape: { type: "path", d: "M 140 760 L 890 830 L 840 875 L 180 795 Z" },
        fill: "#1E293B",
        stroke: { color: "#F97316", width: 4 },
        z: 4,
      },
      // Swinging Massive Heavy Iron Admiralty Anchor + Stock Crossbar + Curved Crescent Flukes!
      {
        id: "giantAnchorStock",
        parent: "propBone",
        shape: { type: "path", d: roundRectPath(195, 235, 225, 34, 14) },
        fill: "#334155",
        stroke: { color: "#090D16", width: 5.5 },
        z: 11,
      },
      {
        id: "giantAnchorRing",
        parent: "propBone",
        shape: { type: "ellipse", cx: 308, cy: 145, rx: 42, ry: 42 },
        fill: "transparent",
        stroke: { color: "#1E293B", width: 20 },
        z: 11,
      },
      {
        id: "giantAnchor",
        parent: "propBone",
        shape: {
          type: "path",
          d: "M 288 165 L 328 165 L 328 655 Q 430 650 485 555 L 520 595 Q 445 745 308 755 Q 170 745 96 595 L 132 555 Q 186 650 288 655 Z",
        },
        fill: "#1E293B",
        stroke: { color: "#090D16", width: 6 },
        z: 12,
      },
      // Flying Red/White Life Buoy
      {
        id: "lifeBuoy",
        parent: "propBone",
        shape: { type: "ellipse", cx: 520, cy: 560, rx: 58, ry: 58 },
        fill: "transparent",
        stroke: { color: "#EF4444", width: 24 },
        z: 13,
      },
      {
        id: "harborPier",
        parent: "worldRoot",
        shape: { type: "path", d: roundRectPath(-120, 1470, W + 240, 470, 0) },
        fill: "#334155",
        stroke: { color: "#090D16", width: 5.5 },
        z: 14,
      }
    );

    doc.bindings.push({
      target: "bone:propBone.x",
      params: ["ActionProp"],
      keys: [
        { at: [0], value: -140 },
        { at: [1], value: 470 },
      ],
    });

    addNavalCharacterRig(doc, {
      prefix: "capt2",
      cx: 560,
      footY: 1690,
      scale: 0.98,
      zBase: 25,
      role: "captain",
      speaks: true,
    });
  }

  return doc;
}

async function main() {
  const { loadModelFile } = await import(pathToFileURL(path.join(REV2D_ROOT, "src/node/load.ts")).href);
  const { Rig } = await import(pathToFileURL(path.join(REV2D_ROOT, "src/core/rig.ts")).href);
  const { renderPose } = await import(pathToFileURL(path.join(REV2D_ROOT, "src/api/frame.ts")).href);
  const { encodePNG } = await import(pathToFileURL(path.join(REV2D_ROOT, "src/render/png.ts")).href);

  const modelsDir = path.join(__dirname, "models");
  fs.mkdirSync(modelsDir, { recursive: true });

  const scenes = await Promise.all(
    [0, 1, 2, 3].map(async (idx) => {
      const filePath = path.join(modelsDir, `shot_${idx}.r2d.json`);
      fs.writeFileSync(filePath, JSON.stringify(buildSceneModel(idx), null, 2));
      const loaded = await loadModelFile(filePath);
      if (!loaded.model) {
        throw new Error(`Rev2D model validation failed on shot ${idx}: ${JSON.stringify(loaded)}`);
      }
      const rig = new Rig(loaded.model);
      return { idx, loaded, rig };
    })
  );
  console.log("[Rev2D] Validated & compiled all 4 native .r2d.json Live2D-warp + spring-physics scene rigs.");

  const evalFrameRGBA = (frameIdx: number, dt: number): Uint8Array => {
    const t = frameIdx / FPS;
    const shot = shotAt(t);
    const vis = rhubarbAt(t);
    const { loaded, rig } = scenes[shot.index];
    const u = shot.u;
    const blinkWindow = (t % 3.1) < 0.14 ? Math.sin(((t % 3.1) / 0.14) * Math.PI) : 0;
    const eyeOpen = r(1 - blinkWindow, 2);

    const params: Record<string, number> = {
      SceneTime: u,
      WaveSway: Math.sin(t * 2.4),
      CamPanX: Math.sin(u * Math.PI - 1.57) * 28,
    };

    if (shot.index === 0) {
      params.ActionProp = Math.min(1, Math.max(0, (u - 0.12) / 0.72));
      params.capt_AngleX = Math.sin(t * 2.1) * 18;
      params.capt_AngleY = Math.cos(t * 1.7) * 9 + (u > 0.3 ? 8 : 0);
      params.capt_AngleZ = Math.sin(t * 2.8) * 14;
      params.capt_BodyLean = Math.sin(t * 1.9) * 8;
      params.capt_EyeOpen = eyeOpen;
      params.capt_GazeX = u > 0.25 ? 0.75 : -0.3;
      params.capt_BrowY = u > 0.25 ? 0.9 : 0.2;
      params.capt_MouthOpen = Math.max(vis.open, u > 0.35 && u < 0.55 ? 0.85 : 0);
      params.capt_MouthForm = u > 0.25 ? -0.7 : vis.form;
      params.capt_ArmLRot = 85 + Math.sin(t * 3.2) * 18;
      params.capt_ForeLRot = 45;
      params.capt_ArmRRot = -85 - Math.sin(t * 3.0) * 18;
      params.capt_ForeRRot = -45;
    } else if (shot.index === 1) {
      params.ActionProp = Math.min(1, u / 0.28);
      params.sailor_AngleX = 16 + Math.sin(t * 3.4) * 10;
      params.sailor_AngleY = 8;
      params.sailor_AngleZ = -10 + Math.sin(t * 4.0) * 8;
      params.sailor_BodyLean = -6 + Math.sin(t * 2.5) * 5;
      params.sailor_EyeOpen = eyeOpen;
      params.sailor_GazeX = 0.8;
      params.sailor_BrowY = 1.0;
      params.sailor_MouthOpen = vis.open;
      params.sailor_MouthForm = -0.8;
      // Hands raised high outward behind Brig bars!
      params.sailor_ArmLRot = 128 + Math.sin(t * 4.2) * 10;
      params.sailor_ForeLRot = 25;
      params.sailor_ArmRRot = -128 - Math.sin(t * 4.2) * 10;
      params.sailor_ForeRRot = -25;

      params.mp_AngleX = -20;
      params.mp_AngleY = -6;
      params.mp_AngleZ = 6;
      params.mp_BodyLean = 5;
      params.mp_EyeOpen = eyeOpen;
      params.mp_GazeX = -0.8;
      params.mp_BrowY = -0.9;
      params.mp_MouthOpen = 0.12;
      params.mp_MouthForm = -0.6;
      params.mp_ArmLRot = 18;
      params.mp_ForeLRot = 30;
      params.mp_ArmRRot = -95 + Math.sin(t * 3.6) * 22;
      params.mp_ForeRRot = -35;
    } else if (shot.index === 2) {
      params.ActionProp = 0.5 + 0.5 * Math.sin(t * 1.5);
      params.fdr_AngleX = Math.sin(t * 1.4) * 16;
      params.fdr_AngleY = 5 + Math.cos(t * 1.2) * 7;
      params.fdr_AngleZ = Math.sin(t * 1.1) * 9;
      params.fdr_BodyLean = Math.sin(t * 1.0) * 5;
      params.fdr_EyeOpen = eyeOpen;
      params.fdr_GazeX = Math.sin(t * 1.3) * 0.5;
      params.fdr_BrowY = 0.35;
      params.fdr_MouthOpen = vis.open;
      params.fdr_MouthForm = Math.max(0.35, vis.form);
      params.fdr_ArmLRot = 24 + Math.sin(t * 1.6) * 12;
      params.fdr_ForeLRot = 28;
      params.fdr_ArmRRot = -72 + Math.sin(t * 2.1) * 16;
      params.fdr_ForeRRot = -42;
    } else {
      params.ActionProp = Math.min(1, u * 1.15);
      params.capt2_AngleX = -15 + Math.sin(t * 3.8) * 16;
      params.capt2_AngleY = 12;
      params.capt2_AngleZ = Math.sin(t * 4.5) * 16;
      params.capt2_BodyLean = Math.sin(t * 3.2) * 9;
      params.capt2_EyeOpen = eyeOpen;
      params.capt2_GazeX = -0.65;
      params.capt2_BrowY = 0.95;
      params.capt2_MouthOpen = vis.open;
      params.capt2_MouthForm = -0.75;
      params.capt2_ArmLRot = 115 + Math.sin(t * 4.0) * 14;
      params.capt2_ForeLRot = 52;
      params.capt2_ArmRRot = -115 - Math.sin(t * 4.0) * 14;
      params.capt2_ForeRRot = -52;
    }

    const pose = rig.pose({ params, dt });
    const rendered = renderPose(loaded, rig, pose, { supersample: 2 });
    return stampCaptionRGBA(rendered.image.data, t);
  };

  if (SMOKE_DIR) {
    fs.mkdirSync(SMOKE_DIR, { recursive: true });
    for (const f of [60, 225, 375, 525]) {
      const rgba = evalFrameRGBA(f, 1 / FPS);
      fs.writeFileSync(path.join(SMOKE_DIR, `rev2d_f${f}.png`), encodePNG({ width: W, height: H, data: rgba }));
    }
    console.log(`[Rev2D] Wrote 4 smoke frames to ${SMOKE_DIR}`);
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
    const rgba = evalFrameRGBA(f, 1 / FPS);
    if (!ff.stdin.write(rgba)) {
      await new Promise<void>((res) => ff.stdin.once("drain", () => res()));
    }
    if ((f + 1) % 100 === 0) console.log(`[Rev2D] Rendered ${f + 1}/${TOTAL_FRAMES} frames`);
  }
  ff.stdin.end();
  await new Promise<void>((resolve, reject) => {
    ff.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited ${code}`))));
  });
  console.log(`[Rev2D] Completed 20.00s master -> ${OUT_MP4}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
