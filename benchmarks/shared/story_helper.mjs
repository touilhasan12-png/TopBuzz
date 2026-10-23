import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SHARED_DIR = __dirname;
export const REPO_ROOT = path.resolve(__dirname, "../..");
export const AUDIO_20S_WAV = path.join(__dirname, "audio_20s.wav");
export const FONT_EXTRABOLD = path.join(REPO_ROOT, "assets/fonts/Montserrat-ExtraBold.otf");
export const TIMING_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "timing_20s.json"), "utf8"));

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const TOTAL_FRAMES = 600;
export const DURATION = 20.0;

// Build clean, subtle 2-3 word caption chunks (zero stickers, pure white + thin black outline at Y=70%)
function buildCaptions(words) {
  const chunks = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const charLen = cur.map((x) => x.word).join(" ").length;
    const endsPunct = /[.?!,;:]/.test(w.word);
    if (cur.length >= 3 || charLen >= 16 || endsPunct) {
      chunks.push({
        text: cur.map((x) => x.word).join(" "),
        start: cur[0].start,
        end: cur[cur.length - 1].end,
      });
      cur = [];
    }
  }
  if (cur.length > 0) {
    chunks.push({
      text: cur.map((x) => x.word).join(" "),
      start: cur[0].start,
      end: cur[cur.length - 1].end,
    });
  }
  return chunks;
}

export const CAPTIONS_20S = buildCaptions(TIMING_DATA.words);

export function captionAt(t) {
  for (const c of CAPTIONS_20S) {
    if (t >= c.start - 0.03 && t <= c.end + 0.06) return c.text;
  }
  return "";
}

const VISEME_SHAPES = {
  X: { open: 0.02, form: 0.10, chibi: "m", studio: "sil" },
  A: { open: 0.06, form: 0.00, chibi: "m", studio: "PP" },
  B: { open: 0.36, form: 0.35, chibi: "e", studio: "EE" },
  C: { open: 0.62, form: 0.25, chibi: "e", studio: "EH" },
  D: { open: 0.92, form: 0.10, chibi: "a", studio: "AA" },
  E: { open: 0.72, form: -0.45, chibi: "o", studio: "OH" },
  F: { open: 0.44, form: -0.75, chibi: "u", studio: "OO" },
  G: { open: 0.24, form: 0.20, chibi: "w", studio: "FF" },
  H: { open: 0.50, form: 0.15, chibi: "a", studio: "DD" },
};

export function rhubarbAt(t) {
  let code = "X";
  for (const cue of TIMING_DATA.rhubarb) {
    if (t >= cue.start && t < cue.end) {
      code = cue.value;
      break;
    }
  }
  return { code, ...(VISEME_SHAPES[code] || VISEME_SHAPES.X) };
}

// 4 Dramatic Story Beats covering 0.00s -> 20.00s (Frames 0..599)
// Shot 0 (0.00 - 5.20s): Optical periscope crosshair + USS Willie Dee firing live torpedo + shocked Captain Walter
// Shot 1 (5.20 - 9.80s): Quarterdeck Brig bars slamming down + arrested Sailor Dawson + Naval MP with baton
// Shot 2 (9.80 - 14.80s): Secret Atlantic Mission — Night convoy searchlights + USS Iowa + President Roosevelt (FDR)
// Shot 3 (14.80 - 20.00s): Norfolk Harbor Chaos — Giant anchor tearing sister ship railing + flying life buoy
export const SHOTS_20S = [
  { index: 0, id: "periscope_torpedo", start: 0.0, end: 5.2, startFrame: 0, endFrame: 156 },
  { index: 1, id: "brig_arrest", start: 5.2, end: 9.8, startFrame: 156, endFrame: 294 },
  { index: 2, id: "atlantic_fdr", start: 9.8, end: 14.8, startFrame: 294, endFrame: 444 },
  { index: 3, id: "harbor_anchor", start: 14.8, end: 20.0, startFrame: 444, endFrame: 600 },
];

export function shotAt(t) {
  const clamped = Math.max(0, Math.min(19.999, t));
  for (const s of SHOTS_20S) {
    if (clamped >= s.start && clamped < s.end) {
      const localT = clamped - s.start;
      const dur = s.end - s.start;
      return { ...s, localT, dur, u: localT / dur };
    }
  }
  return { ...SHOTS_20S[3], localT: 5.19, dur: 5.2, u: 1.0 };
}
