import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { W, H, FONT_EXTRABOLD, captionAt } from "./story_helper.mjs";

GlobalFonts.registerFromPath(FONT_EXTRABOLD, "MontserratExtraBold");

const overlayCanvas = createCanvas(W, H);
const octx = overlayCanvas.getContext("2d");
let cachedText = null;
let cachedData = null;

export function stampCaptionRGBA(rgbaBuf, t) {
  const txt = captionAt(t);
  if (!txt) return rgbaBuf;
  if (txt !== cachedText) {
    octx.clearRect(0, 0, W, H);
    octx.save();
    octx.font = '800 39px "MontserratExtraBold", sans-serif';
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.lineJoin = "round";
    octx.miterLimit = 2;

    // Subtle soft dark drop shadow + crisp 5.5px black outline + pure white fill at Y = 70% (1344px)
    const y = Math.round(H * 0.705);
    octx.strokeStyle = "rgba(0,0,0,0.45)";
    octx.lineWidth = 10;
    octx.strokeText(txt, W / 2, y + 4);

    octx.strokeStyle = "#080B10";
    octx.lineWidth = 6;
    octx.strokeText(txt, W / 2, y);

    octx.fillStyle = "#FFFFFF";
    octx.fillText(txt, W / 2, y);
    octx.restore();
    cachedText = txt;
    cachedData = octx.getImageData(0, Math.round(H * 0.65), W, Math.round(H * 0.11)).data;
  }

  const y0 = Math.round(H * 0.65);
  const rows = Math.round(H * 0.11);
  const src = cachedData;
  for (let i = 0, n = rows * W * 4; i < n; i += 4) {
    const sa = src[i + 3];
    if (sa === 0) continue;
    const dstIdx = y0 * W * 4 + i;
    if (sa === 255) {
      rgbaBuf[dstIdx] = src[i];
      rgbaBuf[dstIdx + 1] = src[i + 1];
      rgbaBuf[dstIdx + 2] = src[i + 2];
      rgbaBuf[dstIdx + 3] = 255;
    } else {
      const a = sa / 255;
      const ia = 1 - a;
      rgbaBuf[dstIdx] = Math.round(src[i] * a + rgbaBuf[dstIdx] * ia);
      rgbaBuf[dstIdx + 1] = Math.round(src[i + 1] * a + rgbaBuf[dstIdx + 1] * ia);
      rgbaBuf[dstIdx + 2] = Math.round(src[i + 2] * a + rgbaBuf[dstIdx + 2] * ia);
      rgbaBuf[dstIdx + 3] = 255;
    }
  }
  return rgbaBuf;
}
