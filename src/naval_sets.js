// ═══════════════════════════════════════════════════════════════════════════
// TopBuzz Studio — WWII Naval Environments, Warships, Gauges, & VFX Kit
// 100% Deterministic Multi-Layer Vector Artwork (reelmimic + OverSimplified)
// ═══════════════════════════════════════════════════════════════════════════

const SET_INK = '#131720';

// ── 1. LAYERED SKY & CHURNING OCEAN ───────────────────────────────────────
function drawOceanWorld(t, opts = {}) {
  const {
    horizonY = 920,
    preset = 'atlantic', // 'atlantic' | 'harbor' | 'storm' | 'deepsea'
    camX = 0,
    lightning = 0,
  } = opts;

  const P = {
    atlantic: { skyTop: '#3E5B78', skyMid: '#6E8BA6', skyBot: '#B6C7D4', seaTop: '#24415E', seaBot: '#102236', foam: '#D8E7F2' },
    harbor:   { skyTop: '#53789E', skyMid: '#8CB0CE', skyBot: '#DCE6EE', seaTop: '#2D5878', seaBot: '#18354C', foam: '#E6F2FA' },
    storm:    { skyTop: '#1E2736', skyMid: '#364459', skyBot: '#64748A', seaTop: '#182B3F', seaBot: '#0B1624', foam: '#AEBFD1' },
    deepsea:  { skyTop: '#0F2E47', skyMid: '#0A2136', skyBot: '#061524', seaTop: '#0B253C', seaBot: '#05111E', foam: '#7DC4E4' },
  }[preset] || { skyTop: '#3E5B78', skyMid: '#6E8BA6', skyBot: '#B6C7D4', seaTop: '#24415E', seaBot: '#102236', foam: '#D8E7F2' };

  // Painted gradient sky
  const sg = ctx.createLinearGradient(0, 0, 0, horizonY);
  sg.addColorStop(0.0, P.skyTop);
  sg.addColorStop(0.62, P.skyMid);
  sg.addColorStop(1.0, P.skyBot);
  ctx.fillStyle = sg;
  ctx.fillRect(-120, -120, W + 240, horizonY + 140);

  // Painted multi-lobe anime cumulus cloud banks (soft sunlit tops, periwinkle undersides, zero harsh wireframe!)
  const cloudDrift = (t * 14 - camX * 0.12) % 1500;
  for (let c = 0; c < 4; c++) {
    const cx = -220 + ((c * 420 + cloudDrift + 1500) % 1500);
    const cy = 205 + (c % 2) * 145;
    const s = 0.90 + (c % 3) * 0.22;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    const lobes = [[-130, 18, 56], [-68, -14, 74], [18, -28, 86], [96, -6, 68], [152, 20, 48]];
    // Underside shadow pass
    ctx.fillStyle = preset === 'storm' ? 'rgba(62, 76, 98, 0.72)' : 'rgba(176, 198, 224, 0.72)';
    ctx.beginPath();
    for (const [lx, ly, lr] of lobes) { ctx.moveTo(lx + lr, ly + 8); ctx.arc(lx, ly + 8, lr, 0, TAU); }
    ctx.fillRect(-175, 16, 360, 46);
    ctx.fill();
    // Bright sunlit upper lobes
    ctx.fillStyle = preset === 'storm' ? 'rgba(128, 145, 168, 0.80)' : 'rgba(250, 253, 255, 0.92)';
    ctx.beginPath();
    for (const [lx, ly, lr] of lobes) { ctx.moveTo(lx + lr, ly); ctx.arc(lx, ly, lr * 0.96, 0, TAU); }
    ctx.fill();
    ctx.restore();
  }

  // Lightning fork in storm preset
  if (lightning > 0.05) {
    ctx.save();
    ctx.globalAlpha = lightning;
    ctx.fillStyle = 'rgba(235, 246, 255, 0.35)';
    ctx.fillRect(-100, -100, W + 200, H + 200);
    const bolt = [[760, 40], [710, 210], [775, 235], [685, 450], [735, 470], [640, 740]];
    ink(bolt, [12, 9, 8, 6, 5, 2], '#FFFFFF');
    ctx.restore();
  }

  // Deep ocean gradient body
  const og = ctx.createLinearGradient(0, horizonY, 0, H + 100);
  og.addColorStop(0.0, P.seaTop);
  og.addColorStop(1.0, P.seaBot);
  ctx.fillStyle = og;
  ctx.fillRect(-120, horizonY - 4, W + 240, H - horizonY + 140);

  // Horizon atmospheric sheen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(-120, horizonY - 3, W + 240, 9);

  // 6 parallax wave bands with crisp cartoon foam crests
  for (let band = 0; band < 6; band++) {
    const frac = band / 5;
    const wy = horizonY + 35 + Math.pow(frac, 1.45) * (H - horizonY - 60);
    const amp = 7 + frac * (preset === 'storm' ? 34 : 18);
    const freq = 0.011 - frac * 0.004;
    const speed = (1.6 + band * 0.55) * (band % 2 ? 1 : -0.8);

    ctx.beginPath();
    ctx.moveTo(-140, H + 120);
    for (let x = -140; x <= W + 140; x += 36) {
      const y = wy + Math.sin((x + camX * (0.2 + frac * 0.7)) * freq + t * speed) * amp
                   + Math.cos(x * freq * 2.1 - t * speed * 1.3) * amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 140, H + 120);
    ctx.closePath();
    ctx.fillStyle = `rgba(9, 24, 42, ${0.14 + frac * 0.12})`;
    ctx.fill();

    // Crisp cartoon whitecap crest ribbons
    ctx.strokeStyle = `rgba(224, 240, 252, ${0.22 + frac * 0.24})`;
    ctx.lineWidth = 2.2 + frac * 3.0;
    ctx.beginPath();
    for (let x = -120; x <= W + 120; x += 170) {
      const segStart = x + ((t * 42 * (band + 1)) % 170);
      const y1 = wy + Math.sin((segStart + camX * (0.2 + frac * 0.7)) * freq + t * speed) * amp;
      ctx.moveTo(segStart, y1);
      ctx.quadraticCurveTo(segStart + 38, y1 - amp * 0.45, segStart + 76, y1 + 2);
    }
    ctx.stroke();
  }
}

// ── 2. RIVETED WWII STEEL BULKHEAD ROOM (BRIDGE / TORPEDO / BRIEFING) ─────
function drawNavalBulkhead(opts = {}) {
  const {
    wallTop = '#586765',     // authentic OverSimplified olive-slate military steel!
    wallBot = '#343F3E',
    floorCol = '#2A3136',
    floorY = 1490,
    alarmRed = 0,            // 0..1 battle-stations red emergency lamp pulse!
    lampX = 540,
  } = opts;

  // Main painted steel bulkhead gradient
  const wg = ctx.createLinearGradient(0, 0, 0, floorY);
  wg.addColorStop(0, wallTop);
  wg.addColorStop(1, wallBot);
  ctx.fillStyle = wg;
  ctx.fillRect(-120, -120, W + 240, floorY + 140);

  // Vertical riveted armor plate seams + bevel highlights
  for (let px = 90; px < W + 60; px += 290) {
    ctx.strokeStyle = 'rgba(15, 20, 26, 0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(px, -80); ctx.lineTo(px, floorY); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px + 6, -80); ctx.lineTo(px + 6, floorY); ctx.stroke();

    // Double row of steel rivets
    for (let ry = 40; ry < floorY - 20; ry += 64) {
      for (const dx of [-14, 18]) {
        ctx.fillStyle = 'rgba(18, 24, 30, 0.55)';
        ctx.beginPath(); ctx.arc(px + dx, ry + 2, 5.2, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(205, 220, 224, 0.35)';
        ctx.beginPath(); ctx.arc(px + dx - 1, ry, 4.4, 0, TAU); ctx.fill();
      }
    }
  }

  // Overhead Steam & Hydraulic Conduit Pipes + Brass Valve Wheel
  const drawPipe = (y, h, col1, col2) => {
    const pg = ctx.createLinearGradient(0, y, 0, y + h);
    pg.addColorStop(0, col1);
    pg.addColorStop(0.35, '#9DB0AE');
    pg.addColorStop(1, col2);
    ctx.fillStyle = pg;
    ctx.fillRect(-100, y, W + 200, h);
    ctx.strokeStyle = SET_INK;
    ctx.lineWidth = 4;
    ctx.strokeRect(-100, y, W + 200, h);
    for (let fx = 160; fx < W; fx += 340) {
      ctx.fillStyle = '#4B5958';
      ctx.fillRect(fx, y - 7, 22, h + 14);
      ctx.strokeRect(fx, y - 7, 22, h + 14);
    }
  };
  drawPipe(96, 36, '#5A6B69', '#2B3534');
  drawPipe(154, 24, '#7D5C43', '#443022'); // copper pressure pipe!

  // Red Valve Handwheel on pipe
  ctx.save();
  ctx.translate(235, 166);
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 11;
  ctx.beginPath(); ctx.arc(0, 0, 42, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#B83B35';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, 42, 0, TAU); ctx.stroke();
  for (let a = 0; a < 4; a++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a * Math.PI / 2) * 40, Math.sin(a * Math.PI / 2) * 40);
    ctx.stroke();
  }
  ctx.fillStyle = '#E5B951';
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
  ctx.restore();

  // Steel Deck Plating Floor
  const fg = ctx.createLinearGradient(0, floorY, 0, H + 100);
  fg.addColorStop(0, floorCol);
  fg.addColorStop(1, '#15191E');
  ctx.fillStyle = fg;
  ctx.fillRect(-120, floorY, W + 240, H - floorY + 120);
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 5.5;
  ctx.beginPath(); ctx.moveTo(-120, floorY); ctx.lineTo(W + 120, floorY); ctx.stroke();

  // Overhead Caged Bulkhead Lamp + Soft Volumetric Light Cone!
  ctx.save();
  const coneG = ctx.createRadialGradient(lampX, 215, 20, lampX, 920, 760);
  if (alarmRed > 0.05) {
    coneG.addColorStop(0, `rgba(255, 82, 68, ${0.34 * alarmRed + 0.12})`);
    coneG.addColorStop(1, 'rgba(255, 40, 30, 0)');
  } else {
    coneG.addColorStop(0, 'rgba(255, 244, 208, 0.24)');
    coneG.addColorStop(1, 'rgba(255, 244, 208, 0)');
  }
  ctx.fillStyle = coneG;
  ctx.beginPath();
  ctx.moveTo(lampX - 75, 215);
  ctx.lineTo(lampX + 75, 215);
  ctx.lineTo(lampX + 640, floorY + 80);
  ctx.lineTo(lampX - 640, floorY + 80);
  ctx.closePath();
  ctx.fill();

  // Lamp fixture housing
  ctx.fillStyle = '#2A3336';
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(lampX - 42, 178, 84, 26, 8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = alarmRed > 0.2 ? '#FF5E4D' : '#FFF5CC';
  ctx.beginPath();
  ctx.arc(lampX, 222, 28, 0, Math.PI);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ── 3. BRASS GAUGE / COMPASS WITH MOTION-SMEAR NEEDLE (frame_22 match!) ───
function drawBrassGauge(cx, cy, r, needleAng, opts = {}) {
  const {
    label = 'PSI',
    dangerZone = true,
    spinSmear = 0, // 0..1 draws cartoon smear wedge when spinning wildly!
  } = opts;

  ctx.save();
  ctx.translate(cx, cy);

  // Drop shadow on bulkhead
  ctx.fillStyle = 'rgba(10, 14, 20, 0.35)';
  ctx.beginPath(); ctx.arc(8, 12, r * 1.12, 0, TAU); ctx.fill();

  // Outer brass bezel with specular metallic gradient
  const bg = ctx.createLinearGradient(-r, -r, r, r);
  bg.addColorStop(0, '#F5D57A');
  bg.addColorStop(0.5, '#C59638');
  bg.addColorStop(1, '#6E5019');
  ctx.fillStyle = bg;
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, r * 1.12, 0, TAU); ctx.fill(); ctx.stroke();

  // Cream vintage dial face
  const dg = ctx.createRadialGradient(0, -r * 0.2, r * 0.1, 0, 0, r);
  dg.addColorStop(0, '#FFFDF5');
  dg.addColorStop(0.82, '#EDE6D2');
  dg.addColorStop(1, '#C8BFA6');
  ctx.fillStyle = dg;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.94, 0, TAU); ctx.fill(); ctx.stroke();

  // Red danger arc
  if (dangerZone) {
    ctx.strokeStyle = '#D94136';
    ctx.lineWidth = r * 0.13;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.76, -0.55, 0.65);
    ctx.stroke();
  }

  // Degree tick marks around dial
  ctx.strokeStyle = SET_INK;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    const major = i % 3 === 0;
    ctx.lineWidth = major ? 3.4 : 1.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * (major ? 0.68 : 0.77), Math.sin(a) * r * (major ? 0.68 : 0.77));
    ctx.lineTo(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88);
    ctx.stroke();
  }

  // Gauge face label
  ctx.fillStyle = '#2B313E';
  ctx.font = `800 ${Math.round(r * 0.20)}px "Montserrat", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, r * 0.42);

  // Cartoon Motion Smear Fan behind spinning needle!
  if (spinSmear > 0.05) {
    const sweep = spinSmear * 1.65;
    const smG = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 0.76);
    smG.addColorStop(0, 'rgba(220, 58, 48, 0.48)');
    smG.addColorStop(1, 'rgba(220, 58, 48, 0.16)');
    ctx.fillStyle = smG;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.76, needleAng - sweep, needleAng);
    ctx.closePath();
    ctx.fill();
  }

  // Crisp crimson-and-black needle + brass center cap
  ctx.save();
  ctx.rotate(needleAng);
  ctx.fillStyle = '#C9302C';
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, -6);
  ctx.lineTo(r * 0.78, 0);
  ctx.lineTo(-r * 0.22, 6);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#E5B951';
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.13, 0, TAU); ctx.fill(); ctx.stroke();

  // Diagonal curved glass reflection highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, -2.45, -1.65);
  ctx.stroke();

  ctx.restore();
}

// ── 4. WOODEN & BRASS SHIP HELM WHEEL (`drawShipWheel`) ───────────────────
function drawShipWheel(cx, cy, r, rot = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  // Cast pedestal base
  ctx.fillStyle = '#3B464B';
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-42, 0, 84, 340, 10);
  ctx.fill(); ctx.stroke();

  ctx.rotate(rot);
  // 8 turned mahogany spokes + outer handles
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = '#6E3F24';
    ctx.strokeStyle = SET_INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-8, -r * 1.28, 16, r * 1.28, 6);
    ctx.fill(); ctx.stroke();
    // Handle bulb
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.28, 12, 18, 0, 0, TAU);
    ctx.fillStyle = '#8A5130';
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // Outer mahogany wheel ring
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 30;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#7A472A';
  ctx.lineWidth = 20;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();

  // Brass center hub
  ctx.fillStyle = '#E5B951';
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ── 5. FLETCHER-CLASS DESTROYER `DD-579` & BATTLESHIP `USS IOWA BB-61` ────
function drawWarship(cx, cy, scale = 1.0, opts = {}) {
  const {
    type = 'destroyer', // 'destroyer' (DD-579) | 'battleship' (BB-61 USS Iowa)
    hullNum = type === 'battleship' ? '61' : '579',
    flip = 1,
    roll = 0,
    smoke = 0.7,
    t = 0,
  } = opts;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(roll);
  ctx.scale(scale * flip, scale);

  const isBB = type === 'battleship';
  const L = isBB ? 430 : 320;

  // Smoke puffs billowing from twin funnels
  if (smoke > 0) {
    for (let p = 0; p < 6; p++) {
      const age = ((t * 0.85 + p * 0.17) % 1);
      const sx = -20 - age * 210;
      const sy = -145 - age * 95 + Math.sin(age * 8 + p) * 10;
      const sr = (18 + age * 44) * smoke;
      ctx.fillStyle = `rgba(54, 62, 74, ${(1 - age) * 0.45})`;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    }
  }

  // Superstructure + Raked Twin Funnels + Mast/Radar
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 4;

  // Funnels
  for (const fx of [-68, 4]) {
    ctx.save();
    ctx.translate(fx, -72);
    ctx.transform(1, 0, -0.18, 1, 0, 0);
    ctx.fillStyle = '#4B5B70';
    ctx.fillRect(-20, -68, 40, 68);
    ctx.strokeRect(-20, -68, 40, 68);
    ctx.fillStyle = '#181E28';
    ctx.fillRect(-20, -68, 40, 14);
    ctx.strokeRect(-20, -68, 40, 14);
    ctx.restore();
  }

  // Bridge Tower & Radar Mast
  ctx.fillStyle = '#5B6D84';
  ctx.beginPath();
  ctx.roundRect(44, -128, isBB ? 105 : 78, 82, 6);
  ctx.fill(); ctx.stroke();
  // Armored slit bridge windows
  ctx.fillStyle = '#162231';
  ctx.fillRect(88, -114, isBB ? 52 : 30, 12);

  // Lattice Radar Mast
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(72, -128); ctx.lineTo(66, -205);
  ctx.moveTo(50, -178); ctx.lineTo(88, -178);
  ctx.stroke();

  // Naval Gun Turrets (`5-inch` twins on DD-579; massive `16-inch` triples on USS Iowa BB-61!)
  const turrets = isBB
    ? [[175, -62, 1.35], [120, -86, 1.25], [-165, -58, -1.35]]
    : [[155, -55, 1.0], [105, -76, 0.95], [-150, -52, -1.0]];
  for (const [tx, ty, dir] of turrets) {
    ctx.save();
    ctx.translate(tx, ty);
    const sgn = Math.sign(dir), mag = Math.abs(dir);
    // Gun barrels elevated at 14 degrees
    ctx.strokeStyle = SET_INK;
    ctx.lineWidth = isBB ? 8 : 5.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(sgn * 54 * mag, -20 * mag);
    ctx.stroke();
    // Armored turret house
    ctx.fillStyle = '#435368';
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(-24 * mag, 8);
    ctx.lineTo(-18 * mag, -14 * mag);
    ctx.lineTo(22 * mag, -12 * mag);
    ctx.lineTo(26 * mag, 8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Quintuple Mark 15 Torpedo Tube Mount midships on DD-579!
  if (!isBB) {
    ctx.fillStyle = '#384659';
    ctx.beginPath();
    ctx.roundRect(-48, -60, 66, 22, 5);
    ctx.fill(); ctx.stroke();
  }

  // Sleek Flared WWII Measure-22 Navy Warship Hull
  const hullPts = [
    [-L * 0.92, -38],
    [-L * 0.35, -44],
    [L * 0.45, -52],
    [L * 0.98, -72],   // sharp raked Atlantic bow!
    [L * 0.86, 14],
    [-L * 0.84, 14],
    [-L * 0.95, -14],
  ];
  poly(hullPts, true);
  const hg = ctx.createLinearGradient(0, -72, 0, 16);
  hg.addColorStop(0.0, '#6A7D96');
  hg.addColorStop(0.58, '#41526B');
  hg.addColorStop(0.60, '#1D2B42'); // Navy Measure 22 dark sea blue lower band!
  hg.addColorStop(1.0, '#141E30');
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.lineWidth = 4.6;
  ctx.strokeStyle = SET_INK;
  ctx.stroke();

  // Crisp White Painted Navy Hull Number on Bow (`579` / `61`)
  ctx.save();
  ctx.scale(flip < 0 ? -1 : 1, 1); // keep digits readable regardless of ship heading!
  const numX = (flip < 0 ? -1 : 1) * L * 0.72;
  ctx.fillStyle = '#F2F6FC';
  ctx.font = `900 ${isBB ? 30 : 25}px "Montserrat", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(hullNum, numX, -28);
  ctx.restore();

  // White Foaming Bow Wave & Wake Ribbon
  const wake = crPts([
    [-L * 1.02, 14], [-L * 0.5, 19], [0, 16], [L * 0.65, 17], [L * 0.96, 8], [L * 0.80, 24], [-L * 0.95, 24]
  ], 10, true);
  poly(wake);
  ctx.fillStyle = 'rgba(235, 246, 255, 0.88)';
  ctx.fill();

  ctx.restore();
}

// ── 6. MARK 15 TORPEDO & UNDERWATER WAKE (`drawTorpedo`) ──────────────────
function drawTorpedo(cx, cy, scale = 1.0, ang = 0, t = 0, liveWarhead = true) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.scale(scale, scale);

  // Churning white cavitation bubbles & speed lines behind tail
  for (let b = 0; b < 14; b++) {
    const prog = ((t * 3.4 + b * 0.08) % 1);
    const bx = -135 - prog * 280;
    const by = Math.sin(b * 2.7 + t * 14) * (10 + prog * 26);
    const br = (1 - prog) * 16 + 4;
    ctx.fillStyle = `rgba(225, 246, 255, ${(1 - prog) * 0.78})`;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
  }

  // Brass counter-rotating propellers + tail fins
  ctx.fillStyle = '#303B4A';
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-132, 0); ctx.lineTo(-158, -32); ctx.lineTo(-110, -18);
  ctx.moveTo(-132, 0); ctx.lineTo(-158, 32);  ctx.lineTo(-110, 18);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Sleek steel cylindrical body
  const bodyG = ctx.createLinearGradient(0, -30, 0, 30);
  bodyG.addColorStop(0, '#9AA8BA');
  bodyG.addColorStop(0.35, '#CBD5E2');
  bodyG.addColorStop(0.75, '#556478');
  bodyG.addColorStop(1, '#2D3746');
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.moveTo(-118, -24);
  ctx.lineTo(86, -28);
  ctx.quadraticCurveTo(158, -26, 162, 0);
  ctx.quadraticCurveTo(158, 26, 86, 28);
  ctx.lineTo(-118, 24);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 4.6;
  ctx.stroke();

  // Live Warhead Band (Crimson/Brass High-Explosive Nose!)
  if (liveWarhead) {
    ctx.save();
    ctx.clip();
    const wg = ctx.createLinearGradient(0, -30, 0, 30);
    wg.addColorStop(0, '#F06A4E');
    wg.addColorStop(0.45, '#C9382B');
    wg.addColorStop(1, '#6E1912');
    ctx.fillStyle = wg;
    ctx.fillRect(68, -35, 110, 70);
    // Yellow explosive stencil stripe
    ctx.fillStyle = '#F2C94C';
    ctx.fillRect(68, -35, 14, 70);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(68, -28); ctx.lineTo(68, 28);
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.restore();
}

// ── 7. OPTICAL PERISCOPE / RANGEFINDER CROSSHAIR BEZEL (frame_00 & 36!) ───
function drawPeriscopeReticle(openRadius = 470, shakeX = 0, shakeY = 0) {
  const cx = W / 2 + shakeX, cy = H * 0.46 + shakeY;
  ctx.save();

  // Subtle green-cyan optical glass tint inside lens
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, openRadius, 0, TAU);
  ctx.clip();
  const lensTint = ctx.createRadialGradient(cx, cy, openRadius * 0.55, cx, cy, openRadius);
  lensTint.addColorStop(0, 'rgba(180, 235, 225, 0.0)');
  lensTint.addColorStop(0.85, 'rgba(92, 168, 160, 0.14)');
  lensTint.addColorStop(1.0, 'rgba(12, 34, 38, 0.52)');
  ctx.fillStyle = lensTint;
  ctx.fillRect(0, 0, W, H);

  // Crisp optical stadia rangefinder crosshair lines + ticks!
  ctx.strokeStyle = 'rgba(18, 26, 32, 0.78)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(cx - openRadius, cy); ctx.lineTo(cx - 28, cy);
  ctx.moveTo(cx + 28, cy);         ctx.lineTo(cx + openRadius, cy);
  ctx.moveTo(cx, cy - openRadius); ctx.lineTo(cx, cy - 28);
  ctx.moveTo(cx, cy + 28);         ctx.lineTo(cx, cy + openRadius);
  ctx.stroke();

  // Center targeting bracket + stadia ticks
  ctx.lineWidth = 2.2;
  for (let s = -6; s <= 6; s++) {
    if (s === 0) continue;
    const h = s % 2 === 0 ? 18 : 10;
    ctx.beginPath();
    ctx.moveTo(cx + s * 54, cy - h); ctx.lineTo(cx + s * 54, cy + h);
    ctx.moveTo(cx - h, cy + s * 54); ctx.lineTo(cx + h, cy + s * 54);
    ctx.stroke();
  }
  ctx.restore();

  // Heavy dark optical housing surrounding circular aperture (even-odd mask!)
  ctx.fillStyle = '#090C11';
  ctx.beginPath();
  ctx.rect(-100, -100, W + 200, H + 200);
  ctx.arc(cx, cy, openRadius, 0, TAU, true);
  ctx.fill();

  // Inner metallic bezel ring
  ctx.strokeStyle = '#2B3542';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(cx, cy, openRadius + 4, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(160, 215, 225, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, openRadius - 4, 0, TAU); ctx.stroke();

  ctx.restore();
}

// ── 8. STUDIO BILLOWING CEL-SHADED NAVAL EXPLOSION & GEYSER (`drawWaterColumn`) ──
function drawWaterColumn(cx, baseY, progress, maxH = 680, width = 240, fiery = false) {
  if (progress <= 0) return;
  const p = clamp(progress, 0, 1);
  const rise = Math.min(1, p * 1.65);
  const h = easeOutBack(rise) * maxH * (1 - Math.max(0, p - 0.76) * 0.8);
  const w = width * (0.62 + p * 0.55);

  ctx.save();
  ctx.translate(cx, baseY);

  // 1) Expanding white shockwave ellipses on ocean surface
  for (let r = 0; r < 2; r++) {
    const rw = w * (1.28 + p * 1.45 + r * 0.48);
    ctx.strokeStyle = `rgba(235, 248, 255, ${(1 - p * 0.55) * (0.82 - r * 0.32)})`;
    ctx.lineWidth = 8 - r * 3;
    ctx.beginPath();
    ctx.ellipse(0, 16, rw, rw * 0.16, 0, 0, TAU);
    ctx.stroke();
  }

  // 2) Rolling dark smoke clouds behind blast
  if (fiery) {
    const smokeLobes = [
      [-w * 0.58, -h * 0.30, w * 0.38], [w * 0.60, -h * 0.34, w * 0.40],
      [-w * 0.36, -h * 0.56, w * 0.42], [w * 0.38, -h * 0.52, w * 0.40],
    ];
    ctx.fillStyle = '#2F3644';
    ctx.strokeStyle = SET_INK;
    ctx.lineWidth = 4.2;
    for (const [sx, sy, sr] of smokeLobes) {
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }

  // 3) Organic Billowing White-and-Ice-Blue Water Plume Cloud Clusters!
  const foamBlobs = [
    [0, -h * 0.90, w * 0.34],
    [-w * 0.24, -h * 0.74, w * 0.32], [w * 0.25, -h * 0.72, w * 0.31],
    [-w * 0.36, -h * 0.50, w * 0.36], [w * 0.38, -h * 0.48, w * 0.35],
    [0, -h * 0.56, w * 0.42],
    [-w * 0.52, -h * 0.24, w * 0.40], [w * 0.54, -h * 0.22, w * 0.40],
    [-w * 0.22, -h * 0.20, w * 0.44], [w * 0.22, -h * 0.18, w * 0.44],
    [-w * 0.72, -h * 0.04, w * 0.28], [w * 0.72, -h * 0.04, w * 0.28],
  ].map(([bx, by, br]) => ellPts(bx, by, br, br * 1.08, 16));

  const wg = ctx.createLinearGradient(-w * 0.5, -h, w * 0.6, 20);
  wg.addColorStop(0.0, '#FFFFFF');
  wg.addColorStop(0.60, '#E6F4FC');
  wg.addColorStop(1.0, '#9EC7E6');
  drawGroup(foamBlobs, wg, 7.5, SET_INK);

  // 4) Vivid Orange-Gold Detonation Fireball Core Erupting at Base IN FRONT OF water column!
  if (fiery) {
    const fireParts = [
      [-w * 0.30, -h * 0.14, w * 0.28],
      [w * 0.32, -h * 0.12, w * 0.26],
      [0, -h * 0.20, w * 0.36],
    ].map(([fx, fy, fr]) => ellPts(fx, fy, fr, fr, 16));
    const fg = ctx.createRadialGradient(0, -h * 0.22, w * 0.08, 0, -h * 0.14, w * 0.56);
    fg.addColorStop(0.0, '#FFFFE8');
    fg.addColorStop(0.48, '#FFC238');
    fg.addColorStop(0.86, '#F05024');
    fg.addColorStop(1.0, '#A82015');
    drawGroup(fireParts, fg, 6.8, SET_INK);
  }

  // 5) Scattered high-velocity spray droplets shooting outward into sky!
  const seeds = [[-1.25, -0.82, 13], [1.28, -0.78, 12], [-1.05, -0.48, 15], [1.12, -0.44, 14],
                 [-0.72, -1.06, 11], [0.76, -1.02, 12], [-1.42, -0.22, 10], [1.45, -0.20, 11]];
  for (const [sx, sy, sr] of seeds) {
    const dx = sx * w * (0.75 + p * 0.55);
    const dy = sy * h * 0.92 + p * p * 95;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = SET_INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(dx, dy, sr, sr * 0.62, Math.atan2(dy, dx), 0, TAU);
    ctx.fill(); ctx.stroke();
  }

  ctx.restore();
}

// ── 8B. PLANKED WWII BATTLESHIP PROMENADE TEAK DECK + LIFE RING ───────────
function drawTeakDeck(deckY = 1480, railTopY = 1015, label = 'U.S.S. IOWA') {
  // Rich shaded teak wood planking with perspective plank seams!
  const dg = ctx.createLinearGradient(0, deckY, 0, H);
  dg.addColorStop(0, '#8A6744');
  dg.addColorStop(1, '#583F28');
  ctx.fillStyle = dg;
  ctx.fillRect(-120, deckY, W + 240, H - deckY + 120);

  // Horizontal & perspective teak plank lines + nail rivets
  ctx.strokeStyle = 'rgba(28, 18, 10, 0.42)';
  ctx.lineWidth = 3;
  for (let py = deckY + 46; py < H; py += 52) {
    ctx.beginPath(); ctx.moveTo(-100, py); ctx.lineTo(W + 100, py); ctx.stroke();
  }
  for (let px = -120; px < W + 220; px += 155) {
    ctx.beginPath();
    ctx.moveTo(px, deckY);
    ctx.lineTo(px + (px - W / 2) * 0.38, H);
    ctx.stroke();
  }

  // Steel gunwale coaming curb
  ctx.fillStyle = '#4A5B70';
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 5;
  ctx.fillRect(-120, deckY - 26, W + 240, 30);
  ctx.strokeRect(-120, deckY - 26, W + 240, 30);

  // Naval steel lifeline stanchions & cables
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-100, railTopY); ctx.lineTo(W + 100, railTopY);
  ctx.moveTo(-100, (railTopY + deckY) * 0.5); ctx.lineTo(W + 100, (railTopY + deckY) * 0.5);
  for (let sx = 95; sx < W; sx += 220) {
    ctx.moveTo(sx, railTopY); ctx.lineTo(sx, deckY - 26);
  }
  ctx.stroke();
  ctx.strokeStyle = '#6D8099';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Iconic Red-and-White Naval Lifebuoy Ring hanging on rail!
  const lx = 935, ly = railTopY + 125, lr = 66;
  ctx.save();
  ctx.translate(lx, ly);
  ctx.fillStyle = '#F4F7FC';
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, lr, 0, TAU);
  ctx.arc(0, 0, lr * 0.50, 0, TAU, true);
  ctx.fill('evenodd');
  ctx.stroke();
  // 4 red quadrant bands
  for (let q = 0; q < 4; q++) {
    const a = q * Math.PI / 2 + 0.35;
    ctx.strokeStyle = '#C9382E';
    ctx.lineWidth = lr * 0.44;
    ctx.beginPath();
    ctx.arc(0, 0, lr * 0.75, a, a + 0.42);
    ctx.stroke();
  }
  ctx.strokeStyle = SET_INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.arc(0, 0, lr, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, lr * 0.50, 0, TAU); ctx.stroke();
  ctx.restore();
}

// ── 9. REFERENCE-IDENTICAL SUBTLE PURE-WHITE SLOT CAPTIONS (Y = 70%) ──────
// Pre-groups `VOICE_WORDS` into natural 3–4 word phrases centered at Y = 1344
// with small crisp 40px white type + thin black outline (ZERO boxes/badges!).
const CAPTION_PHRASES = (() => {
  const words = window.VOICE_WORDS || [];
  const groups = [];
  let buf = [];
  for (let i = 0; i < words.length; i++) {
    buf.push(words[i]);
    const txt = words[i].word.trim();
    const punct = /[.!?,;:—]$/.test(txt);
    const charLen = buf.reduce((s, w) => s + w.word.length + 1, 0);
    if (buf.length >= 4 || (punct && buf.length >= 2) || charLen >= 24 || i === words.length - 1) {
      groups.push({
        start: buf[0].start,
        end: buf[buf.length - 1].end + 0.14,
        words: buf,
      });
      buf = [];
    }
  }
  return groups;
})();

function drawReferenceCaption(t) {
  let active = null;
  for (let i = 0; i < CAPTION_PHRASES.length; i++) {
    const g = CAPTION_PHRASES[i];
    const nextStart = i + 1 < CAPTION_PHRASES.length ? CAPTION_PHRASES[i + 1].start : g.end;
    const end = Math.min(g.end, nextStart);
    if (t >= g.start - 0.03 && t < end) {
      active = g;
      break;
    }
  }
  if (!active) return;

  ctx.save();
  ctx.font = '800 41px "Montserrat", "DejaVu Sans", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Pre-measure full phrase width so words appear cleanly in their true slot without shifting!
  const tokens = active.words.map((w, idx) => (idx < active.words.length - 1 ? w.word + ' ' : w.word));
  const widths = tokens.map(tok => ctx.measureText(tok).width);
  const totalW = widths.reduce((a, b) => a + b, 0);
  let curX = (W - totalW) / 2;
  const baseY = 1344; // Exact Y = 70.0% matching `Why Japan Wished This Pearl Harbor Sailor Had DIED.mp4`!

  for (let i = 0; i < active.words.length; i++) {
    const w = active.words[i];
    if (t >= w.start - 0.035) {
      const pop = Math.min(1, (t - (w.start - 0.035)) / 0.08);
      const yOff = (1 - easeOutBack(pop)) * 8;
      ctx.save();
      ctx.globalAlpha = clamp(pop * 1.35, 0, 1);

      // Subtle soft drop shadow for legibility over white uniforms & water foam
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;

      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = 7.5;
      ctx.strokeStyle = '#0D1017';
      ctx.strokeText(tokens[i], curX, baseY + yOff);

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(tokens[i], curX, baseY + yOff);
      ctx.restore();
    }
    curX += widths[i];
  }
  ctx.restore();
}

function easeOutBack(x) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

window.drawOceanWorld = drawOceanWorld;
window.drawNavalBulkhead = drawNavalBulkhead;
window.drawBrassGauge = drawBrassGauge;
window.drawShipWheel = drawShipWheel;
window.drawWarship = drawWarship;
window.drawTorpedo = drawTorpedo;
window.drawPeriscopeReticle = drawPeriscopeReticle;
window.drawWaterColumn = drawWaterColumn;
window.drawTeakDeck = drawTeakDeck;
window.drawReferenceCaption = drawReferenceCaption;
window.easeOutBack = easeOutBack;
