// ═══════════════════════════════════════════════════════════════════════════
// TopBuzz Studio — Clean Engine Bridge over reelmimic `kit.js` + `anime.js`
// Connects scene/rig primitives directly to `G`, `SHOTS`, `Path2D` cel & ink!
// ═══════════════════════════════════════════════════════════════════════════

Object.defineProperty(window, 'ctx', { get: () => G, configurable: true });

// Scene scheduler adapter (`scene(name, t0, t1, (lt, dur, t) => ...)`)
window.scene = function (name, t0, t1, fn) {
  shots([[t0, (t, lt, dur) => fn(lt, t1 - t0, t)]]);
};

// Stepped hand-drawn pose hold (`onTwos`) & organic `autoBlink`
window.onTwos = function (t, fps = 12) {
  return Math.floor(t * fps) / fps;
};

window.autoBlink = function (t, period = 3.6, phase = 0) {
  const cyc = ((t + phase) % period + period) % period;
  if (cyc > 0.16) return 0;
  return Math.sin((cyc / 0.16) * Math.PI);
};

// Trace polygon point array into `G` so standard `ctx.fill()` / `ctx.stroke()` work cleanly
window.poly = function (pts, closed = true) {
  G.beginPath();
  if (!pts || !pts.length) return;
  G.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) G.lineTo(pts[i][0], pts[i][1]);
  if (closed) G.closePath();
};

// Support both `(P, closed, n)` and `(P, n, closed)` smoothly!
const _origCrPts = window.crPts;
window.crPts = function (P, a = false, b = 7) {
  if (typeof a === 'number') return _origCrPts(P, !!b, a);
  return _origCrPts(P, !!a, typeof b === 'number' ? b : 7);
};

// Support both `tubePts([[x,y,w],...], n, caps)` AND `tubePts([[x,y],...], [r0,r1,...], n)`!
const _origTubePts = window.tubePts;
window.tubePts = function (P, radiiOrN = 6, nOrCaps = true) {
  if (Array.isArray(radiiOrN)) {
    const withW = P.map((pt, idx) => {
      const r = radiiOrN[Math.min(idx, radiiOrN.length - 1)];
      return [pt[0], pt[1], r * 2];
    });
    return _origTubePts(withW, typeof nOrCaps === 'number' ? nOrCaps : 8, true);
  }
  return _origTubePts(P, radiiOrN, nOrCaps);
};

// Support variable width array `[wStart, wMid, wEnd]` in `ink(P, widths, col)`!
const _origInk = window.ink;
window.ink = function (P, w, col, prof = TAPER.both, o = {}) {
  if (Array.isArray(w)) {
    const wMax = Math.max(...w);
    const customProf = (s) => {
      if (w.length === 2) return lerp(w[0], w[1], s) / wMax;
      if (s < 0.5) return lerp(w[0], w[1], s * 2) / wMax;
      return lerp(w[1], w[2], (s - 0.5) * 2) / wMax;
    };
    return _origInk(P, wMax, col, customProf, { caps: true, ...o });
  }
  return _origInk(P, w, col, prof, o);
};

// Support polygon point array directly in `cel(pts, base, shade, amount, lightDir)`!
const _origCel = window.cel;
window.cel = function (pathOrPts, b, s, h, d = 0.08, r = 0) {
  if (Array.isArray(pathOrPts)) {
    const path = polyPath(ccw(pathOrPts), true);
    const dist = typeof h === 'number' ? h * 26 : 16;
    const prevL = _L;
    if (Array.isArray(d)) _L = d;
    G.save();
    G.clip(path);
    G.fillStyle = s;
    G.fill(path);
    G.clip(shifted(path, _L[0] * dist, _L[1] * dist));
    G.fillStyle = b;
    G.fill(path);
    G.restore();
    _L = prevL;
    // Restore path on `G` so subsequent `ctx.stroke()` outlines the outer silhouette cleanly!
    poly(pathOrPts, true);
    return;
  }
  return _origCel(pathOrPts, b, s, h, d, r);
};

// Support unified silhouette union for polygon blob arrays `[pts1, pts2, ...]` in `drawGroup`!
const _origDrawGroup = window.drawGroup;
window.drawGroup = function (partsOrBlobs, fillOrLine, lwOrNum, strokeCol) {
  if (Array.isArray(partsOrBlobs) && partsOrBlobs.length && Array.isArray(partsOrBlobs[0])) {
    const parts = partsOrBlobs.map((pts) => ({
      path: polyPath(ccw(pts), true),
      b: fillOrLine,
      s: '#C9D1DF',
      d: 9,
    }));
    return _origDrawGroup(parts, strokeCol || '#14171F', (lwOrNum || 7) * 0.52);
  }
  return _origDrawGroup(partsOrBlobs, fillOrLine, lwOrNum);
};

// Camera + Shake wrapper `dramaticZoom(zoom, cx, cy, shakeAmt, drawFn)`
const _origDramaticZoom = window.dramaticZoom;
window.dramaticZoom = function (zOrT, cxOrT0, cyOrAmt, shakeOrShake, fn) {
  if (typeof fn === 'function') {
    const [sx, sy] = shakeXY(T, (shakeOrShake || 0) * 18);
    camBegin(cxOrT0 + sx, cyOrAmt + sy, zOrT, 0);
    fn();
    camEnd();
    return;
  }
  return _origDramaticZoom(zOrT, cxOrT0, cyOrAmt, shakeOrShake);
};

// Radial anime action focus lines framing the outer border so center characters stay 100% clean!
const _origSmearLines = window.smearLines;
window.smearLines = function (x0, y0, a, b, ...rest) {
  if (rest.length === 0) {
    return focusLines(T, x0, y0, {
      r: 460,
      n: b || 44,
      w: 14,
      col: `rgba(255, 255, 255, ${clamp(a * 0.72, 0, 0.42)})`,
    });
  }
  return _origSmearLines(x0, y0, a, b, ...rest);
};

// Crisp anime flash decay after explosion impact time `boomT`
window.impactFlash = function (lt, boomT, peak = 0.75) {
  const dt = lt - boomT;
  if (dt < 0 || dt > 0.34) return;
  flash(peak * Math.exp(-dt * 11), '#FFFDF4');
};

// Grade helpers called from overlayHook
window.bloom = (v) => { GRADE.bloom = v; };
window.vignette = (v) => { GRADE.vignette = v; };
window.grain = () => {};
