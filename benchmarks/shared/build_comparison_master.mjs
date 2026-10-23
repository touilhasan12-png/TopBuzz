import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { FONT_EXTRABOLD } from './story_helper.mjs';

const ffprobePath = ffprobeInstaller.path;
GlobalFonts.registerFromPath(FONT_EXTRABOLD, 'MontserratExtraBold');

const args = process.argv.slice(2);
const dir = args[args.indexOf('--dir') + 1] || '/tmp/all_videos';

const ENGINES = [
  { id: '00_reelmimic', file: '00_ReelMimic_Baseline_20s.mp4', title: '00 · ReelMimic (Baseline)' },
  { id: '01_rev2d', file: '01_Rev2D_Live2DMesh_20s.mp4', title: '01 · RevStudio / Rev2D (Live2D Warp)' },
  { id: '02_studio25d', file: '02_Studio25D_Parallax_20s.mp4', title: '02 · Studio 2.5D (Z-Parallax)' },
  { id: '03_synfig', file: '03_SynfigStudio_CppVector_20s.mp4', title: '03 · Synfig 1.5.5 (C++ Vector)' },
  { id: '04_claude_anim', file: '04_ClaudeAnimationSkill_HandDrawn_20s.mp4', title: '04 · Claude-Anim (Hand-Inked)' },
  { id: '05_anidoodle', file: '05_Anidoodle_VolumetricCel_20s.mp4', title: '05 · Anidoodle (3D Cel Anatomy)' },
];

function probeVideo(p) {
  const raw = execFileSync(
    ffprobePath,
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', p],
    { encoding: 'utf8' }
  );
  const info = JSON.parse(raw);
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  return {
    file: path.basename(p),
    bytes: fs.statSync(p).size,
    width: Number(v.width),
    height: Number(v.height),
    fps: v.r_frame_rate,
    frames: Number(v.nb_frames || 0),
    duration: Number(info.format.duration),
    hasAudio: Boolean(a),
    audioCodec: a ? a.codec_name : null,
  };
}

async function main() {
  const report = [];
  for (const e of ENGINES) {
    const p = path.join(dir, e.file);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing required benchmark video: ${p}`);
    }
    const meta = probeVideo(p);
    if (meta.width !== 1080 || meta.height !== 1920) {
      throw new Error(`Invalid dimensions on ${e.file}: ${meta.width}x${meta.height}`);
    }
    if (!meta.hasAudio) {
      throw new Error(`Missing audio stream on ${e.file}`);
    }
    if (meta.duration < 19.8 || meta.duration > 20.3) {
      throw new Error(`Unexpected duration on ${e.file}: ${meta.duration}s`);
    }
    report.push({ ...e, ...meta });
    console.log(`[Verify] OK ${e.file}: ${meta.width}x${meta.height}, ${meta.frames}f, ${meta.duration.toFixed(3)}s, ${(meta.bytes / 1048576).toFixed(2)} MB`);
  }

  // 1. Build clean RGBA label overlay PNG (`1620x1920`) for 3x2 Side-by-Side Comparison MP4
  const cellW = 540;
  const cellH = 960;
  const gridW = cellW * 3;
  const gridH = cellH * 2;
  const ov = createCanvas(gridW, gridH);
  const octx = ov.getContext('2d');
  octx.clearRect(0, 0, gridW, gridH);

  ENGINES.forEach((e, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x0 = col * cellW;
    const y0 = row * cellH;

    // Subtle dark translucent top bar so white label never touches scene artwork below
    octx.fillStyle = 'rgba(8, 12, 20, 0.72)';
    octx.fillRect(x0, y0, cellW, 48);
    octx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    octx.lineWidth = 2;
    octx.strokeRect(x0 + 1, y0 + 1, cellW - 2, cellH - 2);

    octx.font = '800 20px "MontserratExtraBold", sans-serif';
    octx.fillStyle = '#FFFFFF';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(e.title, x0 + cellW / 2, y0 + 25);
  });

  const ovPng = path.join(dir, '_grid_overlay.png');
  fs.writeFileSync(ovPng, ov.toBuffer('image/png'));

  const sideBySideOut = path.join(dir, '06_SideBySide_6Engines_Comparison_20s.mp4');
  execFileSync(
    ffmpegPath,
    [
      '-y',
      '-i', path.join(dir, ENGINES[0].file),
      '-i', path.join(dir, ENGINES[1].file),
      '-i', path.join(dir, ENGINES[2].file),
      '-i', path.join(dir, ENGINES[3].file),
      '-i', path.join(dir, ENGINES[4].file),
      '-i', path.join(dir, ENGINES[5].file),
      '-i', ovPng,
      '-filter_complex',
      [
        `[0:v]scale=${cellW}:${cellH}[v0]`,
        `[1:v]scale=${cellW}:${cellH}[v1]`,
        `[2:v]scale=${cellW}:${cellH}[v2]`,
        `[3:v]scale=${cellW}:${cellH}[v3]`,
        `[4:v]scale=${cellW}:${cellH}[v4]`,
        `[5:v]scale=${cellW}:${cellH}[v5]`,
        `[v0][v1][v2][v3][v4][v5]xstack=inputs=6:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0[grid]`,
        `[grid][6:v]overlay=0:0[outv]`,
      ].join(';'),
      '-map', '[outv]',
      '-map', '1:a:0',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      sideBySideOut,
    ],
    { stdio: 'inherit' }
  );
  fs.unlinkSync(ovPng);

  const compMeta = probeVideo(sideBySideOut);
  console.log(`[Verify] Built 6-Engine Split-Screen Master: ${compMeta.width}x${compMeta.height}, ${compMeta.duration.toFixed(3)}s`);

  // 2. Build 6 Columns x 4 Beats High-Res Contact Sheet PNG (`2160 x 2680`)
  const times = [2.0, 7.5, 12.5, 17.5];
  const thumbW = 360;
  const thumbH = 640;
  const headerH = 68;
  const sheet = createCanvas(thumbW * 6, headerH + thumbH * 4);
  const sctx = sheet.getContext('2d');
  sctx.fillStyle = '#0B101B';
  sctx.fillRect(0, 0, sheet.width, sheet.height);

  for (let c = 0; c < ENGINES.length; c++) {
    const e = ENGINES[c];
    sctx.font = '800 18px "MontserratExtraBold", sans-serif';
    sctx.fillStyle = '#FFFFFF';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText(e.title, c * thumbW + thumbW / 2, headerH / 2);

    for (let r = 0; r < times.length; r++) {
      const tmpPng = path.join(dir, `_thumb_${c}_${r}.png`);
      execFileSync(ffmpegPath, [
        '-y',
        '-ss', String(times[r]),
        '-i', path.join(dir, e.file),
        '-frames:v', '1',
        '-vf', `scale=${thumbW}:${thumbH}`,
        tmpPng,
      ]);
      const img = await loadImage(tmpPng);
      sctx.drawImage(img, c * thumbW, headerH + r * thumbH, thumbW, thumbH);
      sctx.strokeStyle = 'rgba(255,255,255,0.18)';
      sctx.lineWidth = 2;
      sctx.strokeRect(c * thumbW, headerH + r * thumbH, thumbW, thumbH);
      fs.unlinkSync(tmpPng);
    }
  }

  const sheetOut = path.join(dir, '6_Engine_Contact_Sheet.png');
  fs.writeFileSync(sheetOut, sheet.toBuffer('image/png'));
  fs.writeFileSync(
    path.join(dir, 'Benchmark_QA_Report.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), engines: report, sideBySide: compMeta }, null, 2)
  );
  console.log(`[Verify] Wrote Contact Sheet (${sheetOut}) + QA Report!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
