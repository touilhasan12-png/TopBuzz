import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import ffmpegStatic from "ffmpeg-static";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { W, H, FPS, TOTAL_FRAMES, AUDIO_20S_WAV, FONT_EXTRABOLD, captionAt } from "../shared/story_helper.mjs";

GlobalFonts.registerFromPath(FONT_EXTRABOLD, "MontserratExtraBold");

const args = process.argv.slice(2);
const getArg = (k) => args[args.indexOf(k) + 1];
const mode = getArg("--mode");
const framesDir = getArg("--framesDir");
const outPath = getArg("--out");
const FFMPEG_BIN = process.env.FFMPEG_BIN || ffmpegStatic;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

function drawCaption(txt) {
  if (!txt) return;
  const y = Math.round(H * 0.705);
  ctx.save();
  ctx.font = '800 39px "MontserratExtraBold", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 10;
  ctx.strokeText(txt, W / 2, y + 4);
  ctx.strokeStyle = "#080B10";
  ctx.lineWidth = 6;
  ctx.strokeText(txt, W / 2, y);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(txt, W / 2, y);
  ctx.restore();
}

function findSynfigPng(f) {
  const candidates = [
    path.join(framesDir, `frame.${String(f).padStart(4, "0")}.png`),
    path.join(framesDir, `frame.${String(f).padStart(3, "0")}.png`),
    path.join(framesDir, `frame.${f}.png`),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(`Missing Synfig PNG for frame ${f} in ${framesDir}`);
}

async function run() {
  if (mode === "smoke") {
    fs.mkdirSync(outPath, { recursive: true });
    for (const f of [60, 225, 375, 525]) {
      const img = await loadImage(findSynfigPng(f));
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      drawCaption(captionAt(f / FPS));
      fs.writeFileSync(path.join(outPath, `synfig_f${f}.png`), canvas.toBuffer("image/png"));
    }
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
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
      outPath,
    ],
    { stdio: ["pipe", "inherit", "inherit"] }
  );

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const img = await loadImage(findSynfigPng(f));
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    drawCaption(captionAt(f / FPS));
    const rgba = Buffer.from(ctx.getImageData(0, 0, W, H).data);
    if (!ff.stdin.write(rgba)) {
      await new Promise((r) => ff.stdin.once("drain", r));
    }
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on("exit", (c) => (c === 0 ? res() : rej(new Error(`FFmpeg ${c}`)))));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
