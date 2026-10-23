import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts, ImageData, loadImage, type Image } from "@napi-rs/canvas";
import ffmpegStatic from "ffmpeg-static";

import {
  W,
  H,
  FPS,
  TOTAL_FRAMES,
  AUDIO_20S_WAV,
  TIMING_DATA,
  rhubarbAt,
} from "../shared/story_helper.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const REV2D_ROOT = process.env.REV2D_ROOT || "/tmp/gh_engines/rev2d";
const FFMPEG_BIN = process.env.FFMPEG_BIN || ffmpegStatic!;
const OUT_MP4 = process.env.OUT_MP4 || "/tmp/out_video/09_Rev2D_AI_Avatar_Kinetic_20s.mp4";

const FONT_BLACK = path.join(REPO_ROOT, "assets/fonts/Montserrat-Black.otf");
const FONT_EXTRABOLD = path.join(REPO_ROOT, "assets/fonts/Montserrat-ExtraBold.otf");
GlobalFonts.registerFromPath(FONT_BLACK, "MontserratBlack");
GlobalFonts.registerFromPath(FONT_EXTRABOLD, "MontserratExtraBold");

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

// Crisp Video #1 spring overshoot curve (0 -> 1.18 -> 0.97 -> 1.0)
function springPop(p: number): number {
  const x = clamp(p, 0, 1);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-6.5 * x) * Math.cos(11.5 * x);
}

// Smooth cubic ease
function easeOutCubic(p: number): number {
  const x = clamp(p, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

// ── BUILD KINETIC PHRASE CHUNKS WITH WORD-LEVEL TIMESTAMPS (VIDEO #1 STYLE!) ──
interface WordItem {
  word: string;
  start: number;
  end: number;
}
interface KineticPhrase {
  words: WordItem[];
  start: number;
  end: number;
}

const DANGER_WORDS = new Set([
  "ACCIDENTALLY", "FIRED", "LIVE", "TORPEDO", "ARRESTED", "TORE", "APART",
]);
const GOLD_WORDS = new Set([
  "AMERICAN", "WARSHIP", "PRESIDENT", "1943", "WILLIE", "DEE", "FRANKLIN", "ROOSEVELT", "ANCHOR",
]);
const CYAN_WORDS = new Set([
  "NAVY", "SAILOR", "TOP", "SECRET", "MISSION", "ATLANTIC", "HARBOR", "FRIENDLY", "DESTROYER",
]);

function wordColor(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (DANGER_WORDS.has(clean)) return "#FF3B30";
  if (GOLD_WORDS.has(clean)) return "#FFD60A";
  if (CYAN_WORDS.has(clean)) return "#38BDF8";
  return "#FFFFFF";
}

function buildKineticPhrases(words: WordItem[]): KineticPhrase[] {
  const out: KineticPhrase[] = [];
  let cur: WordItem[] = [];
  for (const w of words) {
    cur.push(w);
    const joined = cur.map((x) => x.word).join(" ");
    const hasPunct = /[.?!,;:]/.test(w.word);
    if (cur.length >= 3 || joined.length >= 15 || hasPunct) {
      out.push({
        words: cur,
        start: cur[0].start,
        end: cur[cur.length - 1].end,
      });
      cur = [];
    }
  }
  if (cur.length) {
    out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
  }
  return out;
}

const KINETIC_PHRASES = buildKineticPhrases(TIMING_DATA.words as WordItem[]);

function activePhraseAt(t: number): { phrase: KineticPhrase; idx: number } | null {
  for (let i = 0; i < KINETIC_PHRASES.length; i++) {
    const p = KINETIC_PHRASES[i];
    const nextStart = i + 1 < KINETIC_PHRASES.length ? KINETIC_PHRASES[i + 1].start : 20.1;
    const holdEnd = Math.min(p.end + 0.24, nextStart - 0.01);
    if (t >= p.start - 0.03 && t <= holdEnd) {
      return { phrase: p, idx: i };
    }
  }
  return null;
}

// ── DRAW VIDEO #1 LEGENDARY KINETIC TYPOGRAPHY ─────────────────────────────
function drawKineticCaptions(ctx: any, t: number) {
  const hit = activePhraseAt(t);
  if (!hit) return;
  const { phrase, idx } = hit;
  const enterP = (t - (phrase.start - 0.03)) / 0.22;
  const pop = springPop(enterP);
  const tilt = (idx % 2 === 0 ? -1 : 1) * 0.028 * (1 - clamp(enterP, 0, 1) * 0.45);

  const fontSize = 68;
  ctx.save();
  ctx.translate(W * 0.5, H * 0.70);
  ctx.rotate(tilt);
  ctx.scale(pop, pop);
  ctx.font = `900 ${fontSize}px MontserratBlack`;
  ctx.textBaseline = "middle";

  // Measure word widths with crisp spacing
  const gap = 22;
  const upperWords = phrase.words.map((w) => w.word.toUpperCase());
  const widths = upperWords.map((txt) => ctx.measureText(txt).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, widths.length - 1);

  // If wider than safe width (940px), scale smoothly to fit inside safe margins!
  const fitScale = totalW > 940 ? 940 / totalW : 1.0;
  ctx.scale(fitScale, fitScale);

  // Subtle dark pill backdrop behind kinetic phrase for ultra contrast
  const padX = 34;
  const padY = 24;
  ctx.fillStyle = "rgba(7, 11, 20, 0.62)";
  ctx.beginPath();
  ctx.roundRect(-totalW / 2 - padX, -fontSize * 0.62 - padY * 0.4, totalW + padX * 2, fontSize * 1.24 + padY * 0.8, 26);
  ctx.fill();

  let cursorX = -totalW / 2;
  for (let i = 0; i < phrase.words.length; i++) {
    const wObj = phrase.words[i];
    const txt = upperWords[i];
    const ww = widths[i];
    const cx = cursorX + ww / 2;

    const isSpeakingNow = t >= wObj.start - 0.02 && t <= wObj.end + 0.08;
    const wordAge = clamp((t - wObj.start) / 0.16, 0, 1);
    const wordBoost = isSpeakingNow ? 1.0 + 0.15 * Math.sin(wordAge * Math.PI * 0.5) : 1.0;
    const yBounce = isSpeakingNow ? -10 * Math.sin(wordAge * Math.PI) : 0;
    const col = wordColor(wObj.word);

    ctx.save();
    ctx.translate(cx, yBounce);
    ctx.scale(wordBoost, wordBoost);
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;

    // 3D hard comic block drop shadow
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 17;
    ctx.strokeText(txt, 5, 8);
    ctx.fillText(txt, 5, 8);

    // Crisp thick outer black ink border
    ctx.strokeStyle = "#080B12";
    ctx.lineWidth = 15;
    ctx.strokeText(txt, 0, 0);

    // Vibrant power-word fill
    ctx.fillStyle = col;
    ctx.fillText(txt, 0, 0);
    ctx.restore();

    cursorX += ww + gap;
  }
  ctx.restore();
}

// ── DRAW VIDEO #1 SPRING-POPPING DIE-CUT STICKERS & STAMPS ─────────────────
interface StickerBadgeOpts {
  x: number;
  y: number;
  rotDeg: number;
  t: number;
  start: number;
  end: number;
  bg: string;
  fg: string;
  border?: string;
  label: string;
  sublabel?: string;
  iconImg?: Image;
}

function drawStickerBadge(ctx: any, o: StickerBadgeOpts) {
  if (tOut(o.t, o.start, o.end)) return;
  const enter = springPop((o.t - o.start) / 0.26);
  const exit = o.end - o.t < 0.18 ? clamp((o.end - o.t) / 0.18, 0, 1) : 1.0;
  const s = enter * exit;
  if (s <= 0.01) return;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate((o.rotDeg * Math.PI) / 180 + Math.sin(o.t * 3.2) * 0.02);
  ctx.scale(s, s);

  ctx.font = "900 38px MontserratBlack";
  const mainW = ctx.measureText(o.label).width;
  let subW = 0;
  if (o.sublabel) {
    ctx.font = "800 24px MontserratExtraBold";
    subW = ctx.measureText(o.sublabel).width;
  }
  const iconSpace = o.iconImg ? 92 : 0;
  const boxW = Math.max(mainW, subW) + 64 + iconSpace;
  const boxH = o.sublabel ? 108 : 82;

  // Hard sticker shadow
  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.beginPath();
  ctx.roundRect(-boxW / 2 + 8, -boxH / 2 + 10, boxW, boxH, 22);
  ctx.fill();

  // White die-cut sticker rim
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(-boxW / 2 - 7, -boxH / 2 - 7, boxW + 14, boxH + 14, 26);
  ctx.fill();

  // Colored badge body + black ink stroke
  ctx.fillStyle = o.bg;
  ctx.strokeStyle = o.border || "#0B0F19";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 20);
  ctx.fill();
  ctx.stroke();

  if (o.iconImg) {
    const iw = 76;
    const ih = (o.iconImg.height / o.iconImg.width) * iw;
    ctx.drawImage(o.iconImg, -boxW / 2 + 18, -ih / 2, iw, ih);
  }

  const textCenterX = o.iconImg ? iconSpace * 0.42 : 0;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 38px MontserratBlack";
  ctx.strokeStyle = "#080B12";
  ctx.lineWidth = 8;
  const mainY = o.sublabel ? -16 : 2;
  ctx.strokeText(o.label, textCenterX, mainY);
  ctx.fillStyle = o.fg;
  ctx.fillText(o.label, textCenterX, mainY);

  if (o.sublabel) {
    ctx.font = "800 23px MontserratExtraBold";
    ctx.fillStyle = "#FFE8A3";
    ctx.fillText(o.sublabel, textCenterX, 26);
  }

  ctx.restore();
}

function tOut(t: number, start: number, end: number): boolean {
  return t < start || t > end;
}

// Helper to draw full-bleed cover image with smooth camera pan & zoom + shake
function drawCoverBG(
  ctx: any,
  img: Image,
  zoom: number,
  panX: number,
  panY: number,
  shakeX = 0,
  shakeY = 0
) {
  const baseScale = Math.max(W / img.width, H / img.height) * zoom;
  const dw = img.width * baseScale;
  const dh = img.height * baseScale;
  const dx = (W - dw) / 2 + panX + shakeX;
  const dy = (H - dh) / 2 + panY + shakeY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Draw Rev2D live-rendered RGBA buffer smoothly onto the 1080x1920 stage
function drawLiveAvatar(
  ctx: any,
  offCanvas: any,
  offCtx: any,
  renderedImage: { width: number; height: number; data: Uint8Array },
  cx: number,
  bottomY: number,
  targetHeight: number,
  flipX = false,
  rotRad = 0
) {
  if (offCanvas.width !== renderedImage.width || offCanvas.height !== renderedImage.height) {
    offCanvas.width = renderedImage.width;
    offCanvas.height = renderedImage.height;
  }
  const imgData = new ImageData(
    new Uint8ClampedArray(renderedImage.data.buffer, renderedImage.data.byteOffset, renderedImage.data.byteLength),
    renderedImage.width,
    renderedImage.height
  );
  offCtx.putImageData(imgData, 0, 0);

  const scale = targetHeight / renderedImage.height;
  const dw = renderedImage.width * scale;
  const dh = targetHeight;

  ctx.save();
  ctx.translate(cx, bottomY);
  ctx.rotate(rotRad);
  if (flipX) ctx.scale(-1, 1);
  // Subtle crisp drop shadow so character pops cleanly against background plate
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(offCanvas, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

async function runWorkerRange(startFrame: number, endFrame: number) {
  const { loadModelFile } = await import(pathToFileURL(path.join(REV2D_ROOT, "src/node/load.ts")).href);
  const { Rig } = await import(pathToFileURL(path.join(REV2D_ROOT, "src/core/rig.ts")).href);
  const { renderPose } = await import(pathToFileURL(path.join(REV2D_ROOT, "src/api/frame.ts")).href);

  // Load clean AI-illustrated plates & prop/sticker cutouts
  const rawDir = path.join(__dirname, "raw");
  const cutDir = path.join(__dirname, "cutouts");
  const avaDir = path.join(__dirname, "avatars");

  const [
    bgOcean,
    bgBrig,
    bgMap,
    bgHarbor,
    propDestroyer,
    propIowa,
    propTorpedo,
    propAnchor,
    stkExplosion,
    stkSeal,
    stkCuffs,
    stkCrosshair,
  ] = await Promise.all([
    loadImage(path.join(rawDir, "bg_01_ocean_battle.png")),
    loadImage(path.join(rawDir, "bg_02_navy_brig.png")),
    loadImage(path.join(rawDir, "bg_03_atlantic_map_night.png")),
    loadImage(path.join(rawDir, "bg_04_norfolk_harbor.png")),
    loadImage(path.join(cutDir, "destroyer_willie.png")),
    loadImage(path.join(cutDir, "battleship_iowa.png")),
    loadImage(path.join(cutDir, "torpedo_live.png")),
    loadImage(path.join(cutDir, "giant_anchor.png")),
    loadImage(path.join(cutDir, "explosion_burst.png")),
    loadImage(path.join(cutDir, "presidential_seal.png")),
    loadImage(path.join(cutDir, "handcuffs_badge.png")),
    loadImage(path.join(cutDir, "crosshair_target.png")),
  ]);

  // Load ALL 4 genuine Rev2D Live2D-warped + AI-variant avatars!
  async function loadAvatarRig(name: string) {
    const file = path.join(avaDir, name, `${name}.r2d.json`);
    const loaded = await loadModelFile(file);
    if (!loaded.model) throw new Error(`Failed loading Rev2D avatar ${name}`);
    const rig = new Rig(loaded.model);
    const offCanvas = createCanvas(loaded.model.canvas.width, loaded.model.canvas.height);
    const offCtx = offCanvas.getContext("2d");
    return { loaded, rig, offCanvas, offCtx };
  }

  const [avaCaptain, avaSailor, avaMP, avaFDR] = await Promise.all([
    loadAvatarRig("captain"),
    loadAvatarRig("sailor"),
    loadAvatarRig("mp_guard"),
    loadAvatarRig("fdr"),
  ]);

  const stage = createCanvas(W, H);
  const ctx = stage.getContext("2d");
  const outPipe = fs.createWriteStream("", { fd: 3 });

  // Warmup physics for frames before startFrame so spring/hair/body momentum matches seamlessly across chunk boundaries!
  const warmupStart = Math.max(0, startFrame - 18);
  for (let f = warmupStart; f < endFrame; f++) {
    const t = f / FPS;
    const dt = 1 / FPS;
    const vis = rhubarbAt(t);

    // Natural organic staggered blinks per character
    const blinkA = (t + 0.4) % 3.3 < 0.16 ? Math.sin((((t + 0.4) % 3.3) / 0.16) * Math.PI) : 0;
    const blinkB = (t + 1.9) % 3.7 < 0.16 ? Math.sin((((t + 1.9) % 3.7) / 0.16) * Math.PI) : 0;
    const eyeOpenA = clamp(1 - blinkA, 0, 1);
    const eyeOpenB = clamp(1 - blinkB, 0, 1);
    const breathA = 0.5 + 0.5 * Math.sin(t * 2.3);
    const breathB = 0.5 + 0.5 * Math.cos(t * 2.0);

    // 4 crisp story beats strictly matching exact spoken narration timing:
    // Beat 0: 0.00s .. 4.85s  ("This American warship accidentally fired a live torpedo at its own president")
    // Beat 1: 4.85s .. 7.65s  ("and the Navy arrested every single sailor on board.")
    // Beat 2: 7.65s .. 14.65s ("In 1943, the brand new destroyer Willie Dee set sail on a top secret mission to escort Franklin Roosevelt across the Atlantic.")
    // Beat 3: 14.65s .. 20.00s("Before it even cleared the harbor, its anchor tore the deck apart on the friendly warship parked right next to it.")

    if (f < startFrame) {
      // Advance Rev2D physics integrators without rasterizing pixels
      avaCaptain.rig.pose({ params: { AngleX: Math.sin(t * 2.2) * 18, Breath: breathA }, dt });
      avaSailor.rig.pose({ params: { AngleX: Math.cos(t * 2.5) * 16, Breath: breathB }, dt });
      avaMP.rig.pose({ params: { AngleX: -14, Breath: breathA }, dt });
      avaFDR.rig.pose({ params: { AngleX: Math.sin(t * 1.4) * 14, Breath: breathB }, dt });
      continue;
    }

    ctx.clearRect(0, 0, W, H);

    // ═══════════════════════════════════════════════════════════════════════
    // BEAT 0 (0.00s .. 4.85s): LIVE TORPEDO FIRED AT PRESIDENT ROOSEVELT!
    // ═══════════════════════════════════════════════════════════════════════
    if (t < 4.85) {
      const u = t / 4.85;
      const fireShock = t > 1.72 ? Math.exp(-(t - 1.72) * 3.5) * 22 : 0;
      const nearImpactShake = t > 2.82 ? Math.sin(t * 42) * 7 * clamp((t - 2.82) / 0.8, 0, 1) : 0;
      const sx = Math.sin(t * 35) * fireShock + nearImpactShake;
      const sy = Math.cos(t * 29) * fireShock * 0.7;

      drawCoverBG(ctx, bgOcean, 1.06 + u * 0.09, Math.sin(u * Math.PI) * -28, -20, sx, sy);

      // Upper ocean battle lane (Y = 390..660): USS Willie Dee left -> live torpedo -> USS Iowa right!
      const wave1 = Math.sin(t * 2.8) * 10;
      const wave2 = Math.cos(t * 2.3) * 8;
      ctx.save();
      ctx.translate(250 + u * 25 + sx, 515 + wave1 + sy);
      ctx.rotate(Math.sin(t * 2.2) * 0.035);
      ctx.drawImage(propDestroyer, -245, -80, 490, 156);
      ctx.restore();

      ctx.save();
      ctx.translate(845 - u * 20 + sx, 485 + wave2 + sy);
      ctx.rotate(Math.cos(t * 1.9) * 0.025);
      ctx.drawImage(propIowa, -260, -86, 520, 164);
      ctx.restore();

      // Torpedo launching at t = 1.65s ("fired a live torpedo") racing toward USS Iowa!
      if (t >= 1.60) {
        const tp = clamp((t - 1.60) / 2.65, 0, 1);
        const torpX = lerp(330, 765, easeOutCubic(tp));
        const torpY = lerp(555, 518, tp) + Math.sin(t * 18) * 3;

        // White foam wake bubble streak
        const grad = ctx.createLinearGradient(290, torpY, torpX, torpY);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,0.88)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 15;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(310, 555);
        ctx.lineTo(torpX - 50, torpY);
        ctx.stroke();

        ctx.save();
        ctx.translate(torpX, torpY);
        ctx.drawImage(propTorpedo, -110, -24, 220, 48);
        ctx.restore();

        // Pulsing tactical target crosshair locking onto USS Iowa!
        const pulse = 1 + 0.14 * Math.sin(t * 11);
        ctx.save();
        ctx.translate(820, 485 + wave2);
        ctx.rotate(t * 0.7);
        ctx.scale(pulse, pulse);
        ctx.drawImage(stkCrosshair, -92, -92, 184, 184);
        ctx.restore();
      }

      // Live Rev2D Captain Walter on left foreground watching through periscope -> panicking in horror!
      const panic = smoothStep(1.65, 2.35, t);
      const capPose = avaCaptain.rig.pose({
        params: {
          AngleX: lerp(-16, 26, panic) + Math.sin(t * 4.2) * (4 + panic * 9),
          AngleY: lerp(-4, 14, panic) + Math.cos(t * 3.1) * 5,
          AngleZ: lerp(-5, 11, panic) + Math.sin(t * 5.0) * (3 + panic * 7),
          EyeLOpen: eyeOpenA,
          EyeROpen: eyeOpenA,
          EyeBallX: lerp(-0.35, 0.9, panic),
          EyeBallY: lerp(0, 0.35, panic),
          BrowLY: lerp(0.1, 1.0, panic),
          BrowRY: lerp(0.1, 1.0, panic),
          MouthOpen: clamp(vis.open * 1.15 + panic * 0.22, 0, 1),
          MouthForm: lerp(vis.form, -0.6, panic),
          BodyAngleX: lerp(-3, 7, panic) + Math.sin(t * 2.6) * 4,
          Breath: breathA,
        },
        dt,
      });
      const capImg = renderPose(avaCaptain.loaded, avaCaptain.rig, capPose, { supersample: 1 });
      const capX = t > 3.55 ? lerp(540, 300, easeOutCubic((t - 3.55) / 0.45)) : 540;
      drawLiveAvatar(ctx, avaCaptain.offCanvas, avaCaptain.offCtx, capImg.image, capX, H + 40, 930);

      // At t = 3.55s ("at its OWN PRESIDENT!"), live Rev2D FDR springs onto right side reacting!
      if (t > 3.50) {
        const fdrIn = springPop((t - 3.50) / 0.35);
        const fdrPose = avaFDR.rig.pose({
          params: {
            AngleX: -22 + Math.sin(t * 3.2) * 8,
            AngleY: 8 + Math.cos(t * 2.5) * 5,
            AngleZ: -8 + Math.sin(t * 2.8) * 5,
            EyeLOpen: eyeOpenB,
            EyeROpen: eyeOpenB,
            EyeBallX: -0.85,
            EyeBallY: 0.2,
            BrowLY: 0.95,
            BrowRY: 0.95,
            MouthOpen: clamp(vis.open * 1.05, 0, 1),
            MouthForm: vis.form,
            BodyAngleX: -5 + Math.sin(t * 2.1) * 3,
            Breath: breathB,
          },
          dt,
        });
        const fdrImg = renderPose(avaFDR.loaded, avaFDR.rig, fdrPose, { supersample: 1 });
        drawLiveAvatar(ctx, avaFDR.offCanvas, avaFDR.offCtx, fdrImg.image, 790, H + 40, 860 * fdrIn);
      }

      // Video #1 Spring-Popping Stickers!
      drawStickerBadge(ctx, {
        x: 340, y: 215, rotDeg: -4.5, t, start: 0.25, end: 2.38,
        bg: "#0F294A", fg: "#FFD60A", label: "USS WILLIE DEE", sublabel: "DESTROYER DD-579",
      });
      drawStickerBadge(ctx, {
        x: 540, y: 225, rotDeg: 3.5, t, start: 2.42, end: 4.80,
        bg: "#B91C1C", fg: "#FFFFFF", label: "LIVE TORPEDO!", sublabel: "HEADING AT PRESIDENT FDR",
        iconImg: stkExplosion,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BEAT 1 (4.85s .. 7.65s): NAVY ARRESTS EVERY SINGLE SAILOR ON BOARD!
    // ═══════════════════════════════════════════════════════════════════════
    else if (t < 7.65) {
      const localT = t - 4.85;
      const u = localT / (7.65 - 4.85);
      // Heavy iron bars slam at t = 5.24s ("ARRESTED!")
      const barProg = clamp((t - 5.10) / 0.22, 0, 1);
      const slamShake = t >= 5.30 && t < 5.85 ? Math.exp(-(t - 5.30) * 7.5) * 28 : 0;
      const sx = Math.sin(t * 48) * slamShake;
      const sy = Math.cos(t * 40) * slamShake;

      drawCoverBG(ctx, bgBrig, 1.05 + u * 0.06, Math.sin(u * Math.PI) * 18, 0, sx, sy);

      // Left/Center: Panicked arrested Sailor (Rev2D Live2D mesh + AI variants!)
      const sailorPose = avaSailor.rig.pose({
        params: {
          AngleX: 18 + Math.sin(t * 4.5) * 11,
          AngleY: 10 + Math.cos(t * 3.6) * 6,
          AngleZ: -9 + Math.sin(t * 4.8) * 7,
          EyeLOpen: eyeOpenA,
          EyeROpen: eyeOpenA,
          EyeBallX: 0.78,
          EyeBallY: 0.25,
          BrowLY: 1.0,
          BrowRY: 1.0,
          MouthOpen: clamp(vis.open * 1.2 + 0.15, 0, 1),
          MouthForm: -0.75,
          BodyAngleX: -5 + Math.sin(t * 3.4) * 4,
          Breath: breathA,
        },
        dt,
      });
      const sailorImg = renderPose(avaSailor.loaded, avaSailor.rig, sailorPose, { supersample: 1 });
      drawLiveAvatar(ctx, avaSailor.offCanvas, avaSailor.offCtx, sailorImg.image, 335 + sx, H + 36 + sy, 900);

      // Iron Brig Jail Bars SLAMMING down IN FRONT OF SAILOR, BEHIND MP GUARD!
      if (barProg > 0) {
        const barBottom = lerp(0, H, easeOutCubic(barProg));
        ctx.save();
        ctx.strokeStyle = "#1E2430";
        ctx.lineWidth = 22;
        for (let bx = 68; bx <= 640; bx += 92) {
          ctx.beginPath();
          ctx.moveTo(bx + sx, 0);
          ctx.lineTo(bx + sx, barBottom);
          ctx.stroke();
          // Metallic highlight strip on each bar
          ctx.save();
          ctx.strokeStyle = "rgba(185, 205, 235, 0.38)";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(bx - 5 + sx, 0);
          ctx.lineTo(bx - 5 + sx, barBottom);
          ctx.stroke();
          ctx.restore();
        }
        // Horizontal steel crossbeam
        for (const cyBar of [420, 960, 1520]) {
          if (barBottom >= cyBar) {
            ctx.fillStyle = "#161B24";
            ctx.strokeStyle = "#07090E";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.rect(30 + sx, cyBar - 22, 650, 44);
            ctx.fill();
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // Foreground Right: Stern Shore Patrol MP Officer barking arrest orders!
      const mpPose = avaMP.rig.pose({
        params: {
          AngleX: -20 + Math.sin(t * 2.6) * 8,
          AngleY: -5 + Math.cos(t * 2.2) * 4,
          AngleZ: 6 + Math.sin(t * 2.4) * 4,
          EyeLOpen: eyeOpenB,
          EyeROpen: eyeOpenB,
          EyeBallX: -0.8,
          EyeBallY: -0.1,
          BrowLY: -0.95,
          BrowRY: -0.95,
          MouthOpen: clamp(vis.open * 1.1, 0, 1),
          MouthForm: -0.5,
          BodyAngleX: 4 + Math.sin(t * 2.0) * 3,
          Breath: breathB,
        },
        dt,
      });
      const mpImg = renderPose(avaMP.loaded, avaMP.rig, mpPose, { supersample: 1 });
      drawLiveAvatar(ctx, avaMP.offCanvas, avaMP.offCtx, mpImg.image, 785 + sx, H + 40 + sy, 930);

      // Spring-Popping ARRESTED! Rubber Stamp + Steel Handcuffs Sticker!
      drawStickerBadge(ctx, {
        x: 540, y: 235, rotDeg: -6.5, t, start: 5.20, end: 7.60,
        bg: "#DC2626", fg: "#FFFFFF", label: "ARRESTED!", sublabel: "ENTIRE SHIP CREW LOCKED UP",
        iconImg: stkCuffs,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BEAT 2 (7.65s .. 14.65s): 1943 TOP-SECRET MISSION ESCORTING FDR!
    // ═══════════════════════════════════════════════════════════════════════
    else if (t < 14.65) {
      const localT = t - 7.65;
      const u = localT / (14.65 - 7.65);
      drawCoverBG(ctx, bgMap, 1.04 + u * 0.10, lerp(-25, 25, u), lerp(-15, 15, u));

      // Animated red tactical Atlantic mission trajectory line (Norfolk -> North Atlantic!)
      const routeProg = clamp((t - 8.2) / 5.2, 0, 1);
      const pts: [number, number][] = [
        [150, 740],
        [330, 650],
        [540, 585],
        [755, 540],
        [930, 495],
      ];
      ctx.save();
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 11;
      ctx.setLineDash([26, 18]);
      ctx.lineDashOffset = -t * 60;
      ctx.beginPath();
      const totalSegs = 48;
      for (let i = 0; i <= totalSegs; i++) {
        const p = (i / totalSegs) * routeProg;
        const scaled = p * (pts.length - 1);
        const idx0 = Math.min(Math.floor(scaled), pts.length - 2);
        const frac = scaled - idx0;
        const px = lerp(pts[idx0][0], pts[idx0 + 1][0], frac);
        const py = lerp(pts[idx0][1], pts[idx0 + 1][1], frac);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Escort warships steaming along trajectory!
      const shipP = routeProg;
      const shipX = lerp(210, 815, shipP);
      const shipY = lerp(700, 520, shipP) + Math.sin(t * 2.9) * 8;
      ctx.save();
      ctx.translate(shipX - 95, shipY + 42);
      ctx.rotate(-0.12 + Math.sin(t * 2.5) * 0.03);
      ctx.drawImage(propDestroyer, -165, -54, 330, 108);
      ctx.restore();

      ctx.save();
      ctx.translate(shipX + 95, shipY - 22);
      ctx.rotate(-0.12 + Math.cos(t * 2.1) * 0.025);
      ctx.scale(-1, 1); // flip battleship so both steam eastward across Atlantic!
      ctx.drawImage(propIowa, -195, -62, 390, 124);
      ctx.restore();

      // Foreground Star: Live Rev2D President Franklin D. Roosevelt (FDR) + Captain escort!
      const fdrDominant = smoothStep(11.6, 12.4, t);
      const capPose = avaCaptain.rig.pose({
        params: {
          AngleX: 16 + Math.sin(t * 1.9) * 10,
          AngleY: 5 + Math.cos(t * 1.6) * 5,
          AngleZ: 4 + Math.sin(t * 1.7) * 4,
          EyeLOpen: eyeOpenA,
          EyeROpen: eyeOpenA,
          EyeBallX: 0.45,
          EyeBallY: 0.1,
          BrowLY: 0.35,
          BrowRY: 0.35,
          MouthOpen: clamp(vis.open * (1 - fdrDominant * 0.5), 0, 1),
          MouthForm: vis.form,
          BodyAngleX: Math.sin(t * 1.5) * 4,
          Breath: breathA,
        },
        dt,
      });
      const capImg = renderPose(avaCaptain.loaded, avaCaptain.rig, capPose, { supersample: 1 });
      drawLiveAvatar(
        ctx,
        avaCaptain.offCanvas,
        avaCaptain.offCtx,
        capImg.image,
        lerp(540, 285, fdrDominant),
        H + 42,
        lerp(910, 820, fdrDominant)
      );

      if (t >= 11.45) {
        const fdrPop = springPop((t - 11.45) / 0.38);
        const fdrPose = avaFDR.rig.pose({
          params: {
            AngleX: Math.sin(t * 1.8) * 18,
            AngleY: 6 + Math.cos(t * 1.5) * 8,
            AngleZ: Math.sin(t * 1.4) * 8,
            EyeLOpen: eyeOpenB,
            EyeROpen: eyeOpenB,
            EyeBallX: Math.sin(t * 1.6) * 0.65,
            EyeBallY: 0.12 * Math.cos(t * 1.9),
            BrowLY: 0.55,
            BrowRY: 0.55,
            MouthOpen: clamp(vis.open * 1.15, 0, 1),
            MouthForm: Math.max(0.35, vis.form),
            BodyAngleX: Math.sin(t * 1.2) * 5,
            Breath: breathB,
          },
          dt,
        });
        const fdrImg = renderPose(avaFDR.loaded, avaFDR.rig, fdrPose, { supersample: 1 });
        drawLiveAvatar(ctx, avaFDR.offCanvas, avaFDR.offCtx, fdrImg.image, 745, H + 42, 920 * fdrPop);
      }

      // Spring-Popping Stickers for 1943 + TOP SECRET + PRESIDENT F.D.R.!
      drawStickerBadge(ctx, {
        x: 330, y: 215, rotDeg: -4.0, t, start: 7.72, end: 11.32,
        bg: "#1E293B", fg: "#FFD60A", label: "NOVEMBER 1943", sublabel: "USS WILLIAM D. PORTER",
      });
      drawStickerBadge(ctx, {
        x: 540, y: 225, rotDeg: -5.5, t, start: 11.36, end: 14.60,
        bg: "#991B1B", fg: "#FFD60A", label: "TOP SECRET", sublabel: "VIP ESCORT: PRESIDENT F.D.R.",
        iconImg: stkSeal,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BEAT 3 (14.65s .. 20.00s): GIANT ANCHOR TEARS FRIENDLY WARSHIP DECK!
    // ═══════════════════════════════════════════════════════════════════════
    else {
      const localT = t - 14.65;
      const u = localT / (20.0 - 14.65);
      // Anchor smash impact right at t = 16.90s ("anchor TORE the deck apart")!
      const impact = t >= 16.85 ? Math.exp(-(t - 16.85) * 3.2) * 34 : 0;
      const sx = Math.sin(t * 46) * impact;
      const sy = Math.cos(t * 39) * impact;

      drawCoverBG(ctx, bgHarbor, 1.05 + u * 0.08, Math.sin(u * Math.PI) * 24, 0, sx, sy);

      // Parked friendly warship next to pier tilting violently when struck by Willie Dee's anchor!
      const hitTilt = t >= 16.85 ? -0.14 * Math.exp(-(t - 16.85) * 1.4) + Math.sin((t - 16.85) * 14) * 0.05 : 0;
      ctx.save();
      ctx.translate(650 + sx, 560 + sy + (t >= 16.85 ? 18 : 0));
      ctx.rotate(hitTilt);
      ctx.drawImage(propDestroyer, -310, -100, 620, 198);
      ctx.restore();

      // Swinging giant steel Navy anchor on chain pendulum tearing across the sister ship's deck!
      const swingP = clamp((t - 15.80) / 1.45, 0, 1);
      const anchorAng = lerp(0.85, -0.58, easeOutCubic(swingP)) + (t > 17.25 ? Math.sin((t - 17.25) * 5) * 0.08 : 0);
      const pivotX = 520;
      const pivotY = 80;
      const chainLen = 470;
      const ax = pivotX + Math.sin(anchorAng) * chainLen + sx;
      const ay = pivotY + Math.cos(anchorAng) * chainLen + sy;

      // Heavy iron anchor chain line
      ctx.save();
      ctx.strokeStyle = "#1E2430";
      ctx.lineWidth = 18;
      ctx.setLineDash([22, 10]);
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(ax, ay - 90);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(-anchorAng * 0.8);
      ctx.drawImage(propAnchor, -155, -135, 310, 270);
      ctx.restore();

      // Fiery comic crash burst & flying deck planks on anchor smash!
      if (t >= 16.85) {
        const boomPop = springPop((t - 16.85) / 0.25);
        ctx.save();
        ctx.translate(635 + sx, 520 + sy);
        ctx.scale(boomPop, boomPop);
        ctx.drawImage(stkExplosion, -175, -130, 350, 260);
        ctx.restore();

        // Flying cartoon wood & steel deck splinters
        const dtImp = t - 16.85;
        for (let k = 0; k < 10; k++) {
          const vx = (k % 2 === 0 ? 1 : -1) * (95 + k * 34);
          const vy = -340 - (k % 4) * 90;
          const px = 635 + vx * dtImp;
          const py = 520 + vy * dtImp + 490 * dtImp * dtImp;
          if (py < H) {
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(dtImp * (5 + k));
            ctx.fillStyle = k % 2 === 0 ? "#92400E" : "#475569";
            ctx.strokeStyle = "#090D16";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.rect(-24, -8, 48, 16);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Foreground Double Reaction: Shocked Captain (left) + Panicked Sailor (right) in full Rev2D mesh motion!
      const crashPanic = smoothStep(16.6, 17.0, t);
      const capPose = avaCaptain.rig.pose({
        params: {
          AngleX: lerp(12, -24, crashPanic) + Math.sin(t * 5.2) * 11,
          AngleY: 14,
          AngleZ: Math.sin(t * 5.6) * 12,
          EyeLOpen: eyeOpenA,
          EyeROpen: eyeOpenA,
          EyeBallX: 0.75,
          EyeBallY: 0.45,
          BrowLY: 1.0,
          BrowRY: 1.0,
          MouthOpen: clamp(vis.open * 1.2 + crashPanic * 0.28, 0, 1),
          MouthForm: -0.8,
          BodyAngleX: Math.sin(t * 4.2) * 6,
          Breath: breathA,
        },
        dt,
      });
      const capImg = renderPose(avaCaptain.loaded, avaCaptain.rig, capPose, { supersample: 1 });
      drawLiveAvatar(ctx, avaCaptain.offCanvas, avaCaptain.offCtx, capImg.image, 295 + sx, H + 42 + sy, 875);

      const sailorPose = avaSailor.rig.pose({
        params: {
          AngleX: lerp(-14, 24, crashPanic) + Math.cos(t * 5.5) * 12,
          AngleY: 14,
          AngleZ: -Math.sin(t * 5.8) * 12,
          EyeLOpen: eyeOpenB,
          EyeROpen: eyeOpenB,
          EyeBallX: -0.75,
          EyeBallY: 0.45,
          BrowLY: 1.0,
          BrowRY: 1.0,
          MouthOpen: clamp(vis.open * 1.2 + crashPanic * 0.30, 0, 1),
          MouthForm: -0.85,
          BodyAngleX: -Math.sin(t * 4.4) * 6,
          Breath: breathB,
        },
        dt,
      });
      const sailorImg = renderPose(avaSailor.loaded, avaSailor.rig, sailorPose, { supersample: 1 });
      drawLiveAvatar(ctx, avaSailor.offCanvas, avaSailor.offCtx, sailorImg.image, 785 + sx, H + 42 + sy, 865);

      drawStickerBadge(ctx, {
        x: 540, y: 225, rotDeg: 4.5, t, start: 16.50, end: 19.96,
        bg: "#B91C1C", fg: "#FFD60A", label: "DECK TORN APART!", sublabel: "FRIENDLY WARSHIP SMASHED IN HARBOR",
        iconImg: stkExplosion,
      });
    }

    // Top layer: Video #1 Legendary Multi-Color Spring Kinetic Captions!
    drawKineticCaptions(ctx, t);

    const raw = ctx.getImageData(0, 0, W, H).data;
    const buf = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
    if (!outPipe.write(buf)) {
      await new Promise<void>((resolve) => outPipe.once("drain", resolve));
    }
  }

  await new Promise<void>((resolve) => outPipe.end(resolve));
}

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

async function main() {
  if (process.env.WORKER_RANGE) {
    const [s, e] = process.env.WORKER_RANGE.split(":").map(Number);
    await runWorkerRange(s, e);
    return;
  }

  fs.mkdirSync(path.dirname(OUT_MP4), { recursive: true });
  const ff = spawn(
    FFMPEG_BIN,
    [
      "-y",
      "-f", "rawvideo",
      "-pix_fmt", "rgba",
      "-s", `${W}x${H}`,
      "-r", String(FPS),
      "-i", "-",
      "-i", AUDIO_20S_WAV,
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      OUT_MP4,
    ],
    { stdio: ["pipe", "inherit", "inherit"] }
  );

  // Run in 5 crisp 120-frame isolated worker processes so native Skia arena stays < 380 MB!
  const CHUNK = 120;
  for (let s = 0; s < TOTAL_FRAMES; s += CHUNK) {
    const e = Math.min(TOTAL_FRAMES, s + CHUNK);
    console.log(`[Rev2D-AI-Avatar] Rendering frames ${s}..${e - 1} / ${TOTAL_FRAMES}...`);
    await new Promise<void>((resolve, reject) => {
      const tsxBin = path.join(REPO_ROOT, "node_modules/.bin/tsx");
      const child = spawn(
        tsxBin,
        [fileURLToPath(import.meta.url)],
        {
          env: { ...process.env, WORKER_RANGE: `${s}:${e}` },
          stdio: ["ignore", "inherit", "inherit", "pipe"],
        }
      );
      const stream = child.stdio[3] as NodeJS.ReadableStream;
      stream.on("data", (chunk: Buffer) => {
        if (!ff.stdin.write(chunk)) {
          stream.pause();
          ff.stdin.once("drain", () => stream.resume());
        }
      });
      child.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Worker ${s}:${e} exited with code ${code}`));
      });
    });
  }

  ff.stdin.end();
  await new Promise<void>((resolve, reject) => {
    ff.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited ${code}`))));
  });
  console.log(`[Rev2D-AI-Avatar] Wrote ${OUT_MP4}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
