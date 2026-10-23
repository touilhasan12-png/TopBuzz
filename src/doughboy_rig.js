// ═══════════════════════════════════════════════════════════════════════════
// TopBuzz Studio — OverSimplified / Sakamaki 2D Vector Puppet Rig Engine v2
// Authentic 3D Airbrush Sphere Shading + Weighted Ink + 2-Bone IK + Rhubarb
// ═══════════════════════════════════════════════════════════════════════════

const RIG_INK = '#12151E';

function solveIK2(sx, sy, tx, ty, L1, L2, bendDir = 1) {
  let dx = tx - sx, dy = ty - sy;
  let dist = Math.hypot(dx, dy);
  const maxReach = (L1 + L2) * 0.992;
  const minReach = Math.abs(L1 - L2) + 8;
  if (dist > maxReach) {
    const k = maxReach / dist;
    dx *= k; dy *= k;
    tx = sx + dx; ty = sy + dy;
    dist = maxReach;
  } else if (dist < minReach) {
    const k = minReach / (dist || 1);
    dx = (dx || 1) * k; dy *= k;
    tx = sx + dx; ty = sy + dy;
    dist = minReach;
  }
  const baseAng = Math.atan2(dy, dx);
  const cosA = clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1);
  const angA = Math.acos(cosA);
  const elbowAng = baseAng + bendDir * angA;
  const ex = sx + Math.cos(elbowAng) * L1;
  const ey = sy + Math.sin(elbowAng) * L1;
  return {
    ex, ey, wx: tx, wy: ty,
    elbowAng,
    foreAng: Math.atan2(ty - ey, tx - ex),
  };
}

// Rich 3D Airbrush Form Shading matching Reference Doughboy Heads (`#FFFFFF -> #B4BECE`)!
function fillDoughboySkin(cx, cy, r, lightX = -0.30, lightY = -0.34) {
  const gx = cx + lightX * r, gy = cy + lightY * r;
  const g = ctx.createRadialGradient(gx, gy, r * 0.06, cx + lightX * -0.10 * r, cy + r * 0.08, r * 1.08);
  g.addColorStop(0.00, '#FFFFFF');
  g.addColorStop(0.38, '#FAFBFD');
  g.addColorStop(0.68, '#E1E7F2');
  g.addColorStop(0.90, '#BAC3D4');
  g.addColorStop(1.00, '#CBD3E2'); // subtle bounce rim light on shadow edge!
  return g;
}

function drawSweatDrop(x, y, s = 1, rot = 0.12) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.bezierCurveTo(10, -3, 11, 8, 0, 13);
  ctx.bezierCurveTo(-11, 8, -10, -3, 0, -17);
  ctx.closePath();
  const g = ctx.createLinearGradient(-5, -14, 6, 11);
  g.addColorStop(0, '#EEFAFF');
  g.addColorStop(0.55, '#86D2FF');
  g.addColorStop(1, '#449BE0');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = RIG_INK;
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-2.8, 1.5, 2.3, 4.5, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawRhubarbMouth(cx, cy, scale, viseme, mood = 'neutral', openBoost = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const isPanic = mood === 'panic' || mood === 'shock' || mood === 'scream';
  const isAngry = mood === 'angry' || mood === 'shout' || mood === 'determined';
  const isHappy = mood === 'proud' || mood === 'smug' || mood === 'relief';
  const isSad   = mood === 'guilty' || mood === 'sad' || mood === 'worried';

  if ((viseme === 'X' || viseme === 'A') && !isPanic && openBoost < 0.15) {
    ctx.beginPath();
    if (isHappy) {
      ctx.moveTo(-22, -3);
      ctx.quadraticCurveTo(0, 14, 24, -6);
    } else if (isSad) {
      ctx.moveTo(-21, 8);
      ctx.quadraticCurveTo(0, -5, 21, 8);
    } else if (isAngry) {
      ctx.moveTo(-24, 5);
      ctx.bezierCurveTo(-8, -4, 8, -4, 24, 4);
    } else {
      ctx.moveTo(-18, 2);
      ctx.quadraticCurveTo(0, -2, 18, 2);
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = 4.4;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(isHappy ? 26 : -21, isHappy ? -7 : 3, 4.2, 0.3, 1.9);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  let w = 25, h = 16, showTopTeeth = true, showBotTeeth = false, pucker = false;
  switch (viseme) {
    case 'B': w = 27; h = 10; showTopTeeth = true; showBotTeeth = true; break;
    case 'C': w = 29; h = 17; showTopTeeth = true; break;
    case 'D': w = 32; h = 27; showTopTeeth = true; break;
    case 'E': w = 20; h = 21; pucker = true; showTopTeeth = false; break;
    case 'F': w = 15; h = 16; pucker = true; showTopTeeth = false; break;
    case 'G': w = 26; h = 12; showTopTeeth = true; break;
    case 'H': w = 26; h = 19; showTopTeeth = true; break;
    default:  w = 24; h = 15; break;
  }
  if (isPanic) { w = Math.max(w, 32); h = Math.max(h + 11, 30); showTopTeeth = true; showBotTeeth = true; }
  if (isAngry && viseme === 'B') { w = 30; h = 13; showBotTeeth = true; }
  h += openBoost * 16;

  ctx.beginPath();
  if (pucker && !isPanic) {
    ctx.ellipse(0, 2, w * 0.72, h * 0.78, 0, 0, TAU);
  } else if (isHappy) {
    ctx.moveTo(-w, -h * 0.28);
    ctx.quadraticCurveTo(0, -h * 0.12, w, -h * 0.32);
    ctx.bezierCurveTo(w * 0.95, h * 0.88, -w * 0.95, h * 0.88, -w, -h * 0.28);
  } else {
    ctx.moveTo(-w, -h * 0.15);
    ctx.bezierCurveTo(-w * 0.5, -h * 0.75, w * 0.5, -h * 0.75, w, -h * 0.15);
    ctx.bezierCurveTo(w * 1.06, h * 0.80, w * 0.42, h * 0.95, 0, h * 0.78);
    ctx.bezierCurveTo(-w * 0.42, h * 0.95, -w * 1.06, h * 0.80, -w, -h * 0.15);
  }
  ctx.closePath();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#261015';
  ctx.fillRect(-w * 1.4, -h * 1.4, w * 2.8, h * 2.8);

  const tyOff = viseme === 'H' ? h * 0.05 : h * 0.34;
  const tg = ctx.createLinearGradient(0, tyOff - 8, 0, h);
  tg.addColorStop(0, '#F07683');
  tg.addColorStop(1, '#B33B49');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.ellipse(2, tyOff + h * 0.28, w * 0.74, h * 0.52, 0, 0, TAU);
  ctx.fill();

  if (showTopTeeth) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-w * 1.1, -h * 0.85, w * 2.2, h * 0.56);
    ctx.strokeStyle = '#C5CDDC';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-w * 1.1, -h * 0.30);
    ctx.lineTo(w * 1.1, -h * 0.30);
    ctx.stroke();
  }
  if (showBotTeeth) {
    ctx.fillStyle = '#F5F7FB';
    ctx.fillRect(-w * 1.1, h * 0.38, w * 2.2, h * 0.65);
  }
  ctx.restore();

  ctx.lineWidth = 4.2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = RIG_INK;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-w * 0.32, h * 0.98);
  ctx.quadraticCurveTo(0, h * 1.09, w * 0.32, h * 0.98);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(18,21,30,0.42)';
  ctx.stroke();

  ctx.restore();
}

function drawDoughboyEyes(cx, cy, R, opts = {}) {
  const {
    lookX = 0, lookY = 0, blink = 0, mood = 'neutral',
    pupilScale = 1.0, facing = 1, glasses = false,
  } = opts;

  const sep = R * 0.30;
  const exShift = facing * R * 0.14;
  const eyeY = cy - R * 0.10;
  const ew = R * 0.20;
  const eh = R * (mood === 'panic' || mood === 'shock' ? 0.26 : 0.22);

  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    const wScale = (side * facing < 0) ? 0.88 : 1.05;
    const ex = cx + exShift + side * sep;
    const rx = ew * wScale, ry = eh;

    ctx.save();
    ctx.translate(ex, eyeY);

    // Subtle soft airbrush eye-socket shadow on doughboy face
    ctx.fillStyle = 'rgba(150, 162, 184, 0.36)';
    ctx.beginPath();
    ctx.ellipse(0, 3, rx * 1.16, ry * 1.16, 0, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, side * -0.05, 0, TAU);
    ctx.save();
    ctx.clip();

    const eg = ctx.createLinearGradient(0, -ry, 0, ry);
    eg.addColorStop(0.0, '#CBD5E6');
    eg.addColorStop(0.28, '#FFFFFF');
    eg.addColorStop(1.0, '#F4F7FC');
    ctx.fillStyle = eg;
    ctx.fillRect(-rx * 1.4, -ry * 1.4, rx * 2.8, ry * 2.8);

    const px = clamp(lookX, -1, 1) * rx * 0.42;
    const py = clamp(lookY, -1, 1) * ry * 0.40;
    const pr = R * 0.072 * pupilScale * (mood === 'panic' ? 0.58 : 1.0);

    ctx.fillStyle = '#12151E';
    ctx.beginPath();
    ctx.ellipse(px, py, pr, pr * 1.15, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(px - pr * 0.32, py - pr * 0.34, Math.max(1.9, pr * 0.32), 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + pr * 0.28, py + pr * 0.26, Math.max(1.1, pr * 0.14), 0, TAU);
    ctx.fill();

    let topShut = blink;
    let botShut = 0;
    if (mood === 'angry' || mood === 'determined' || mood === 'squint') {
      topShut = Math.max(topShut, 0.28);
      botShut = 0.14;
    } else if (mood === 'smug') {
      topShut = Math.max(topShut, i === 0 ? 0.36 : 0.12);
    } else if (mood === 'guilty' || mood === 'exhausted') {
      topShut = Math.max(topShut, 0.26);
      botShut = 0.12;
    }

    if (topShut > 0.01) {
      ctx.fillStyle = '#E6ECF5';
      ctx.beginPath();
      ctx.moveTo(-rx * 1.5, -ry * 1.5);
      ctx.lineTo(rx * 1.5, -ry * 1.5);
      const lidY = lerp(-ry, ry * 0.95, topShut);
      const tilt = (mood === 'angry' || mood === 'determined') ? (-side * rx * 0.30) : 0;
      ctx.lineTo(rx * 1.5, lidY - tilt);
      ctx.lineTo(-rx * 1.5, lidY + tilt);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = RIG_INK;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-rx * 1.3, lidY + tilt);
      ctx.lineTo(rx * 1.3, lidY - tilt);
      ctx.stroke();
    }
    if (botShut > 0.01 && blink < 0.8) {
      ctx.fillStyle = '#DEE5F0';
      const blidY = lerp(ry, -ry * 0.2, botShut);
      ctx.fillRect(-rx * 1.4, blidY, rx * 2.8, ry * 1.5);
      ctx.strokeStyle = RIG_INK;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-rx * 1.2, blidY);
      ctx.lineTo(rx * 1.2, blidY);
      ctx.stroke();
    }
    ctx.restore();

    ctx.lineWidth = 3.8;
    ctx.strokeStyle = RIG_INK;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, side * -0.05, 0, TAU);
    ctx.stroke();

    if (mood === 'panic' || mood === 'shock' || mood === 'guilty' || mood === 'exhausted' || mood === 'determined' || mood === 'shout') {
      ctx.strokeStyle = 'rgba(18, 21, 30, 0.55)';
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, ry * 0.24, rx * 0.92, 0.35, Math.PI - 0.35);
      ctx.stroke();
    }

    let innerY = -ry * 1.32, outerY = -ry * 1.22, archY = -ry * 1.48;
    if (mood === 'angry' || mood === 'determined' || mood === 'shout') {
      innerY = -ry * 0.72; archY = -ry * 1.05; outerY = -ry * 1.30;
    } else if (mood === 'panic' || mood === 'shock') {
      innerY = -ry * 1.62; archY = -ry * 1.94; outerY = -ry * 1.45;
    } else if (mood === 'guilty' || mood === 'sad' || mood === 'worried') {
      innerY = -ry * 1.68; archY = -ry * 1.45; outerY = -ry * 1.02;
    } else if (mood === 'smug') {
      if (i === 1) { innerY = -ry * 1.55; archY = -ry * 1.85; outerY = -ry * 1.42; }
      else { innerY = -ry * 0.98; archY = -ry * 1.12; outerY = -ry * 1.15; }
    }
    const bxIn = -side * rx * 0.85, bxOut = side * rx * 1.05;
    const browPts = crPts([[bxIn, innerY], [bxIn * 0.1 + bxOut * 0.2, archY], [bxOut, outerY]], false, 10);
    ink(browPts, [3.4, 6.2, 3.0], RIG_INK);

    ctx.restore();
  }

  if (glasses) {
    ctx.save();
    ctx.strokeStyle = '#C9A24B';
    ctx.lineWidth = 3.4;
    const lx = cx + exShift - sep, rx2 = cx + exShift + sep;
    for (const gx of [lx, rx2]) {
      ctx.beginPath();
      ctx.ellipse(gx, eyeY + 2, ew * 1.18, eh * 1.05, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.68)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(gx - ew * 0.55, eyeY - eh * 0.45);
      ctx.lineTo(gx - ew * 0.1, eyeY + eh * 0.45);
      ctx.stroke();
      ctx.strokeStyle = '#C9A24B';
      ctx.lineWidth = 3.4;
    }
    ctx.beginPath();
    ctx.moveTo(lx + ew * 1.15, eyeY - 2);
    ctx.quadraticCurveTo((lx + rx2) / 2, eyeY - 10, rx2 - ew * 1.15, eyeY - 2);
    ctx.stroke();
    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(rx2 + ew * 1.15, eyeY + 4);
    ctx.bezierCurveTo(rx2 + ew * 1.45, eyeY + R * 0.45, rx2 + ew * 1.05, eyeY + R * 0.85, rx2 + ew * 0.65, eyeY + R * 1.15);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCartoonHand(wx, wy, ang, scale = 1, pose = 'relax', flip = 1) {
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(ang);
  ctx.scale(scale, scale * flip);

  const skinFill = () => {
    const g = ctx.createRadialGradient(-4, -6, 3, 4, 4, 34);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.65, '#E4EAF4');
    g.addColorStop(1, '#B8C2D4');
    return g;
  };

  const fingerCapsule = (x1, y1, x2, y2, r1, r2) =>
    tubePts([[x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2], [x2, y2]], [r1, (r1 + r2) * 0.52, r2], 8);

  const blobs = [];
  if (pose === 'point') {
    blobs.push(crPts([[-8, -13], [12, -14], [18, -3], [14, 12], [-8, 12], [-14, 0]], true, 8));
    blobs.push(fingerCapsule(10, -9, 45, -9, 7.4, 5.8));
    blobs.push(fingerCapsule(10, -1, 23, 0, 6.2, 5.4));
    blobs.push(fingerCapsule(9, 6, 21, 7, 5.8, 5.0));
    blobs.push(fingerCapsule(2, -11, 17, -21, 6.4, 5.2));
  } else if (pose === 'salute') {
    blobs.push(crPts([[-8, -11], [35, -10], [43, -3], [36, 8], [-8, 10], [-14, 0]], true, 8));
    blobs.push(fingerCapsule(4, 5, 22, 12, 5.8, 4.8));
  } else if (pose === 'clutch') {
    blobs.push(crPts([[-10, -14], [14, -15], [18, 0], [14, 15], [-10, 14], [-15, 0]], true, 8));
    blobs.push(fingerCapsule(10, -11, 35, -22, 6.2, 4.8));
    blobs.push(fingerCapsule(13, -3, 40, -6, 6.4, 4.8));
    blobs.push(fingerCapsule(12, 5, 37, 10, 6.2, 4.8));
    blobs.push(fingerCapsule(2, -13, 12, -32, 6.4, 5.0));
  } else if (pose === 'open') {
    blobs.push(crPts([[-9, -13], [15, -13], [19, 0], [15, 13], [-9, 13], [-14, 0]], true, 8));
    blobs.push(fingerCapsule(12, -9, 36, -13, 6.0, 4.8));
    blobs.push(fingerCapsule(14, -1, 39, -1, 6.2, 4.9));
    blobs.push(fingerCapsule(12, 7, 34, 10, 5.8, 4.6));
    blobs.push(fingerCapsule(2, -11, 18, -26, 6.2, 5.0));
  } else {
    blobs.push(crPts([[-9, -13], [16, -13], [22, -2], [18, 13], [-8, 13], [-14, 0]], true, 8));
    blobs.push(fingerCapsule(6, -11, 22, -16, 6.2, 5.2));
  }

  drawGroup(blobs, skinFill(), 7.4, RIG_INK);

  ctx.strokeStyle = 'rgba(18, 21, 30, 0.38)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (pose === 'point') {
    ctx.moveTo(12, -3); ctx.lineTo(22, -3);
    ctx.moveTo(11, 4);  ctx.lineTo(20, 4);
  } else {
    ctx.arc(10, 1, 8, -0.8, 1.2);
  }
  ctx.stroke();
  ctx.restore();
}

function drawRoleHat(role, cx, cy, R, facing = 1, hatLift = 0, hatTilt = 0) {
  ctx.save();
  ctx.translate(cx, cy - hatLift);
  ctx.rotate(hatTilt);

  if (role === 'captain' || role === 'officer' || role === 'admiral') {
    const crownY = -R * 0.72;
    const crownPts = crPts([
      [-R * 0.92, crownY + R * 0.14],
      [-R * 1.14, crownY - R * 0.30],
      [0, crownY - R * 0.49],
      [R * 1.16, crownY - R * 0.30],
      [R * 0.92, crownY + R * 0.14],
    ], true, 12);
    const cg = ctx.createLinearGradient(-R, crownY - R * 0.5, R, crownY + R * 0.22);
    cg.addColorStop(0.0, '#FFFFFF');
    cg.addColorStop(0.62, '#E8EEF8');
    cg.addColorStop(1.0, '#B5C0D4');
    cel(crownPts, cg, '#AEB9CE', 0.52, [0.3, -0.8]);
    ctx.lineWidth = 4.4;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(-R * 0.90, crownY + R * 0.03, R * 1.80, R * 0.22, 6);
    ctx.fillStyle = '#182132';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E5B951';
    ctx.fillRect(-R * 0.86, crownY + R * 0.13, R * 1.72, R * 0.065);
    ctx.strokeRect(-R * 0.86, crownY + R * 0.13, R * 1.72, R * 0.065);

    ctx.beginPath();
    ctx.moveTo(-R * 0.86, crownY + R * 0.23);
    ctx.bezierCurveTo(
      -R * 0.4 + facing * R * 0.25, crownY + R * 0.48,
      R * 0.55 + facing * R * 0.35, crownY + R * 0.48,
      R * 0.92 + facing * R * 0.18, crownY + R * 0.22
    );
    ctx.closePath();
    ctx.fillStyle = '#111520';
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-R * 0.55, crownY + R * 0.29);
    ctx.quadraticCurveTo(facing * R * 0.2, crownY + R * 0.40, R * 0.65, crownY + R * 0.28);
    ctx.stroke();

    // Detailed Navy Officer Gold Shield & Wings Badge
    const bx = facing * R * 0.10, by = crownY - R * 0.04;
    ctx.fillStyle = '#F3C85F';
    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.ellipse(bx, by, R * 0.17, R * 0.19, 0, 0, TAU);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFF5CC';
    ctx.beginPath();
    ctx.arc(bx - 3, by - R * 0.05, R * 0.06, 0, TAU);
    ctx.fill();

  } else if (role === 'sailor' || role === 'torpedoman') {
    const hy = -R * 0.78;
    const cupPts = crPts([
      [-R * 0.86, hy + R * 0.20],
      [-R * 0.96, hy - R * 0.24],
      [0, hy - R * 0.30],
      [R * 0.96, hy - R * 0.24],
      [R * 0.86, hy + R * 0.20],
      [0, hy + R * 0.08],
    ], true, 12);
    const dg = ctx.createLinearGradient(-R * 0.8, hy - R * 0.32, R * 0.8, hy + R * 0.24);
    dg.addColorStop(0.0, '#FFFFFF');
    dg.addColorStop(0.65, '#E4EBF6');
    dg.addColorStop(1.0, '#B8C3D6');
    cel(cupPts, dg, '#B0BCD0', 0.5, [0.3, -0.8]);
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-R * 0.88, hy - R * 0.02);
    ctx.quadraticCurveTo(0, hy - R * 0.13, R * 0.88, hy - R * 0.02);
    ctx.stroke();

  } else if (role === 'secret_service') {
    const fy = -R * 0.70;
    const crown = crPts([
      [-R * 0.78, fy + R * 0.08],
      [-R * 0.66, fy - R * 0.42],
      [-R * 0.12, fy - R * 0.36],
      [R * 0.56, fy - R * 0.44],
      [R * 0.80, fy + R * 0.08],
    ], true, 10);
    cel(crown, '#383E4C', '#222630', 0.65, [0.4, -0.7]);
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();
    ctx.fillStyle = '#181B22';
    ctx.fillRect(-R * 0.77, fy - R * 0.05, R * 1.54, R * 0.13);
    ctx.strokeRect(-R * 0.77, fy - R * 0.05, R * 1.54, R * 0.13);
    ctx.beginPath();
    ctx.ellipse(facing * R * 0.08, fy + R * 0.10, R * 1.28, R * 0.19, facing * 0.04, 0, TAU);
    ctx.fillStyle = '#2A2F3A';
    ctx.fill();
    ctx.stroke();

  } else if (role === 'mp') {
    const my = -R * 0.58;
    ctx.beginPath();
    ctx.arc(0, my + R * 0.18, R * 1.06, Math.PI * 1.03, -0.03);
    ctx.quadraticCurveTo(0, my + R * 0.32, -R * 1.06, my + R * 0.14);
    ctx.closePath();
    const hg = ctx.createRadialGradient(-R * 0.3, my - R * 0.45, R * 0.1, 0, my, R * 1.15);
    hg.addColorStop(0, '#6F7C58');
    hg.addColorStop(0.65, '#4A553B');
    hg.addColorStop(1, '#2E3624');
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.lineWidth = 4.4;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();
    ctx.fillStyle = '#F5F7FA';
    ctx.font = `900 ${Math.round(R * 0.34)}px "Montserrat", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MP', facing * R * 0.10, my - R * 0.24);
    ctx.lineWidth = 1.8;
    ctx.strokeText('MP', facing * R * 0.10, my - R * 0.24);

  } else if (role === 'fdr') {
    const hy = -R * 0.78;
    const hair = crPts([
      [-R * 0.90, hy + R * 0.38],
      [-R * 0.94, hy - R * 0.06],
      [-R * 0.45, hy - R * 0.30],
      [R * 0.25, hy - R * 0.28],
      [R * 0.86, hy - R * 0.04],
      [R * 0.84, hy + R * 0.30],
      [R * 0.45, hy + R * 0.04],
      [-R * 0.25, hy + R * 0.02],
      [-R * 0.72, hy + R * 0.22],
    ], true, 12);
    cel(hair, '#C2CAD8', '#8D97A8', 0.6, [0.3, -0.8]);
    ctx.lineWidth = 4.0;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER ARTICULATED PUPPET DRAW FUNCTION (`drawDoughboy`)
// ═══════════════════════════════════════════════════════════════════════════
function drawDoughboy(cfg) {
  const {
    x = 540, y = 1420, scale = 1.35,
    role = 'captain', facing = 1, mood = 'neutral',
    viseme = 'X', openBoost = 0, lookX = 0, lookY = 0, blink = 0,
    headTilt = 0, bodyLean = 0, bob = 0, squash = 1.0,
    stress = 0, hatLift = 0, hatTilt = 0, castShadow = true,
    wheelchair = false, cigaretteHolder = false,
    leftHand  = { x: -135, y: 120, pose: 'relax', bend: 1 },
    rightHand = { x:  135, y: 120, pose: 'relax', bend: -1 },
    propRender = null,
    frontPropRender = null, // rendered ABOVE front hand (e.g. close-up radio microphone!)
  } = cfg;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);
  ctx.scale(2 - squash, squash);
  ctx.rotate(bodyLean);

  const R = 98;
  const torsoTopY = -185;
  const torsoBotY = 145;
  const headX = facing * 8;
  const headY = torsoTopY - R * 0.88;

  const PAL = {
    captain:        { main: '#253757', dark: '#152036', accent: '#E5B951', shirt: '#F5F7FA', tie: '#14171F' },
    officer:        { main: '#2D4163', dark: '#19263D', accent: '#E5B951', shirt: '#F5F7FA', tie: '#14171F' },
    sailor:         { main: '#233557', dark: '#142038', accent: '#FFFFFF', shirt: '#FFFFFF', tie: '#11131A' },
    torpedoman:     { main: '#4C6E8E', dark: '#2F475E', accent: '#FFFFFF', shirt: '#F1F5FA', tie: '#151821' },
    fdr:            { main: '#1F293F', dark: '#111726', accent: '#A83844', shirt: '#FFFFFF', tie: '#982B38' },
    secret_service: { main: '#3E4450', dark: '#252932', accent: '#9BA3B2', shirt: '#F3F5F8', tie: '#232730' },
    mp:             { main: '#5E6849', dark: '#3B422D', accent: '#F4F6FA', shirt: '#E5DEC9', tie: '#2E3324' },
  }[role] || { main: '#253757', dark: '#152036', accent: '#E5B951', shirt: '#F5F7FA', tie: '#14171F' };

  if (castShadow) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 20, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-20 * facing, 265, 142, 28, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Proper Attached Mahogany Wheelchair Backrest & Armrests (always on the BACK side `-facing`!)
  if (wheelchair) {
    const backSide = -facing;
    ctx.save();
    ctx.fillStyle = '#5E3A22';
    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 4.4;
    // Tall angled wooden backrest snug behind shoulders
    ctx.beginPath();
    ctx.roundRect(backSide * 88 - 18, -190, 36, 295, 10);
    ctx.fill(); ctx.stroke();
    // Wooden seat & footrest frame
    ctx.fillRect(-105, 102, 210, 26);
    ctx.strokeRect(-105, 102, 210, 26);
    ctx.restore();
  }

  // Legs
  for (const side of [-1, 1]) {
    const hipX = side * 46;
    const footX = side * 50 + facing * (wheelchair ? 34 : 6);
    const legTube = tubePts(
      [[hipX, 115], [hipX + facing * (wheelchair ? 22 : 4), 192], [footX, 258]],
      [36, 30, 26], 10
    );
    const lg = ctx.createLinearGradient(hipX - 25, 115, footX + 25, 258);
    lg.addColorStop(0, PAL.main);
    lg.addColorStop(1, PAL.dark);
    poly(legTube);
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.lineWidth = 4.4;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(footX + facing * 14, 264, 34, 17, 0, 0, TAU);
    ctx.fillStyle = '#141821';
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(footX + facing * 20, 259, 12, 5, -0.2, 0, TAU);
    ctx.fill();
  }

  const shY = torsoTopY + 34;
  const L1 = 108, L2 = 102;
  const renderArm = (handCfg, isFront) => {
    const shoulderX = handCfg === leftHand ? -92 : 92;
    const ik = solveIK2(shoulderX, shY, handCfg.x, handCfg.y, L1, L2, handCfg.bend ?? 1);
    const sleevePts = tubePts(
      [[shoulderX, shY], [ik.ex, ik.ey], [ik.wx, ik.wy]],
      [35, 29, 23], 12
    );
    const sg = ctx.createLinearGradient(shoulderX, shY - 30, ik.wx, ik.wy + 30);
    sg.addColorStop(0, PAL.main);
    sg.addColorStop(1, PAL.dark);
    cel(sleevePts, sg, PAL.dark, 0.55, [0.4, -0.7]);
    ctx.lineWidth = 4.4;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();

    if (role === 'captain' || role === 'officer' || role === 'sailor') {
      ctx.save();
      ctx.translate(ik.wx, ik.wy);
      ctx.rotate(ik.foreAng);
      ctx.strokeStyle = PAL.accent;
      ctx.lineWidth = role === 'sailor' ? 3.5 : 5.5;
      ctx.beginPath();
      ctx.moveTo(-14, -21); ctx.lineTo(-14, 21);
      ctx.stroke();
      if (role === 'captain') {
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-24, -21); ctx.lineTo(-24, 21);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(ik.ex, ik.ey, 10, ik.foreAng + 1.2, ik.foreAng + 2.5);
    ctx.stroke();

    drawCartoonHand(ik.wx, ik.wy, ik.foreAng, 1.0, handCfg.pose || 'relax', handCfg.flip || 1);
    if (typeof handCfg.prop === 'function') {
      ctx.save();
      ctx.translate(ik.wx, ik.wy);
      ctx.rotate(ik.foreAng);
      handCfg.prop(ctx);
      ctx.restore();
    }
  };

  const backHand = facing >= 0 ? rightHand : leftHand;
  const frontHand = facing >= 0 ? leftHand : rightHand;
  renderArm(backHand, false);

  // Tailored Multi-Tone Shaded Uniform Torso
  const torsoPts = crPts([
    [-98, torsoTopY + 18],
    [-46, torsoTopY - 8],
    [46,  torsoTopY - 8],
    [98,  torsoTopY + 18],
    [82,  15],
    [106, torsoBotY],
    [0,   torsoBotY + 12],
    [-106, torsoBotY],
    [-82, 15],
  ], true, 12);

  const tg = ctx.createLinearGradient(-95 * facing, torsoTopY, 95 * facing, torsoBotY);
  tg.addColorStop(0.0, PAL.main);
  tg.addColorStop(0.68, PAL.main);
  tg.addColorStop(1.0, PAL.dark);
  cel(torsoPts, tg, PAL.dark, 0.58, [0.45 * facing, -0.75]);
  ctx.lineWidth = 4.6;
  ctx.strokeStyle = RIG_INK;
  ctx.stroke();

  const midX = facing * 12;
  if (role === 'sailor' || role === 'torpedoman') {
    ctx.beginPath();
    ctx.moveTo(-58, torsoTopY - 4);
    ctx.lineTo(midX, torsoTopY + 92);
    ctx.lineTo(62, torsoTopY - 4);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3.6;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();

    ctx.strokeStyle = '#151821';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-42, torsoTopY + 6);
    ctx.quadraticCurveTo(midX, torsoTopY + 86, midX - 8, torsoTopY + 135);
    ctx.moveTo(46, torsoTopY + 6);
    ctx.quadraticCurveTo(midX, torsoTopY + 86, midX + 12, torsoTopY + 132);
    ctx.stroke();
    ctx.fillStyle = '#242938';
    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(midX, torsoTopY + 88, 13, 10, 0, 0, TAU);
    ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-36, torsoTopY - 5);
    ctx.lineTo(midX, torsoTopY + 96);
    ctx.lineTo(42, torsoTopY - 5);
    ctx.closePath();
    ctx.fillStyle = PAL.shirt;
    ctx.fill();
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = RIG_INK;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(midX - 8, torsoTopY + 6);
    ctx.lineTo(midX + 8, torsoTopY + 6);
    ctx.lineTo(midX + 12, torsoTopY + 68);
    ctx.lineTo(midX, torsoTopY + 92);
    ctx.lineTo(midX - 12, torsoTopY + 68);
    ctx.closePath();
    ctx.fillStyle = PAL.tie;
    ctx.fill(); ctx.stroke();

    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-36, torsoTopY - 4);
    ctx.lineTo(-68, torsoTopY + 42);
    ctx.lineTo(-48, torsoTopY + 50);
    ctx.lineTo(midX, torsoTopY + 96);
    ctx.lineTo(54, torsoTopY + 50);
    ctx.lineTo(74, torsoTopY + 42);
    ctx.lineTo(42, torsoTopY - 4);
    ctx.stroke();

    if (role === 'mp') {
      ctx.fillStyle = '#F2F5FA';
      ctx.fillRect(-84, 32, 168, 22);
      ctx.strokeRect(-84, 32, 168, 22);
      ctx.beginPath();
      ctx.moveTo(-68, torsoTopY + 4);
      ctx.lineTo(46, 32);
      ctx.lineTo(66, 32);
      ctx.lineTo(-48, torsoTopY + 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#E5B951';
      ctx.fillRect(midX - 16, 29, 32, 28);
      ctx.strokeRect(midX - 16, 29, 32, 28);
    } else {
      for (let row = 0; row < 3; row++) {
        for (const bx of [midX - 28, midX + 28]) {
          const by = torsoTopY + 114 + row * 42;
          ctx.fillStyle = PAL.accent;
          ctx.beginPath(); ctx.arc(bx, by, 7.2, 0, TAU); ctx.fill();
          ctx.lineWidth = 2.4; ctx.stroke();
        }
      }
      if (role === 'captain' || role === 'officer') {
        for (const sx2 of [-82, 82]) {
          ctx.save();
          ctx.translate(sx2, torsoTopY + 4);
          ctx.rotate(sx2 < 0 ? -0.22 : 0.22);
          ctx.fillStyle = '#E5B951';
          ctx.beginPath(); ctx.roundRect(-24, -8, 48, 16, 4); ctx.fill(); ctx.stroke();
          ctx.restore();
        }
        const rx0 = midX + 34, ry0 = torsoTopY + 72;
        const cols = ['#C93B3B', '#E5B951', '#3B6EC9'];
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = cols[c];
          ctx.fillRect(rx0 + c * 13, ry0, 13, 11);
        }
        ctx.strokeRect(rx0, ry0, 39, 11);
      }
    }
  }

  if (typeof propRender === 'function') propRender(ctx);

  // ── 3D AIRBRUSH SHADED DOUGHBOY HEAD ────────────────────────────────────
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(headTilt);

  // Shaded neck cylinder
  const ng = ctx.createLinearGradient(-28, R * 0.65, 28, R * 1.05);
  ng.addColorStop(0, '#DCE2EE');
  ng.addColorStop(1, '#AAB5C8');
  ctx.beginPath();
  ctx.roundRect(-28, R * 0.68, 56, 46, 16);
  ctx.fillStyle = ng;
  ctx.fill();
  ctx.lineWidth = 4.0;
  ctx.strokeStyle = RIG_INK;
  ctx.stroke();

  const headPts = crPts([
    [0, -R],
    [R * 0.72, -R * 0.70],
    [R * 1.02, -R * 0.04],
    [R * 0.96, R * 0.56],
    [R * 0.52, R * 0.94],
    [0, R * 1.00],
    [-R * 0.52, R * 0.94],
    [-R * 0.96, R * 0.56],
    [-R * 1.02, -R * 0.04],
    [-R * 0.72, -R * 0.70],
  ], true, 12);

  // CRITICAL: Pass our rich 3D airbrush gradient directly as `b` so BOTH soft sphere
  // form shading AND crisp cap-brim cel shadow render cleanly together!
  const skinGrad = fillDoughboySkin(0, 0, R, -0.28 * facing, -0.32);
  cel(headPts, skinGrad, '#BCC5D7', 0.42, [0.35 * facing, 0.78]);
  ctx.lineWidth = 4.8;
  ctx.strokeStyle = RIG_INK;
  ctx.stroke();

  if (stress > 0.05) {
    ctx.save();
    ctx.globalAlpha = clamp(stress, 0, 1);
    const hxBase = -facing * R * 0.52, hyBase = -R * 0.42;
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = 'rgba(28, 34, 48, 0.65)';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hxBase + k * 9, hyBase - 12);
      ctx.lineTo(hxBase + k * 9, hyBase + 10 + (k % 2) * 5);
      ctx.stroke();
    }
    drawSweatDrop(-facing * R * 0.74, -R * 0.12 + stress * 12, 0.98);
    if (stress > 0.55) {
      drawSweatDrop(facing * R * 0.78, R * 0.08 + stress * 16, 0.80, -0.15);
    }
    ctx.restore();
  }

  ctx.strokeStyle = RIG_INK;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(facing * R * 0.16, R * 0.08, R * 0.075, facing > 0 ? -1.1 : 2.0, facing > 0 ? 1.2 : 4.3);
  ctx.stroke();

  drawDoughboyEyes(0, 0, R, { lookX, lookY, blink, mood, facing, glasses: role === 'fdr' });
  drawRhubarbMouth(facing * R * 0.12, R * 0.42, R / 98, viseme, mood, openBoost);

  if (cigaretteHolder) {
    ctx.save();
    ctx.translate(facing * R * 0.36, R * 0.38);
    ctx.rotate(facing * -0.46);
    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 4.0;
    ctx.fillStyle = '#1C2029';
    ctx.beginPath(); ctx.roundRect(0, -4, 34, 8, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.roundRect(32, -5, 28, 10, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FF642E';
    ctx.beginPath(); ctx.arc(61, 0, 4.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawRoleHat(role, 0, 0, R, facing, hatLift, hatTilt);
  ctx.restore(); // end head

  renderArm(frontHand, true);
  if (typeof frontPropRender === 'function') frontPropRender(ctx);

  // Chrome Spoked Wheelchair Wheel centered cleanly on seat regardless of `facing`!
  if (wheelchair) {
    ctx.save();
    const wx2 = -22 * facing, wy2 = 165;
    // Wooden armrest above wheel
    ctx.fillStyle = '#6E4427';
    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(-92, 42, 165, 20, 8); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(wx2, wy2, 98, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#CFD7E6';
    ctx.lineWidth = 7.5;
    ctx.beginPath(); ctx.arc(wx2, wy2, 98, 0, TAU); ctx.stroke();
    ctx.lineWidth = 3.2;
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(wx2, wy2);
      ctx.lineTo(wx2 + Math.cos(a) * 94, wy2 + Math.sin(a) * 94);
      ctx.stroke();
    }
    ctx.fillStyle = '#E5B951';
    ctx.strokeStyle = RIG_INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(wx2, wy2, 16, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

window.drawDoughboy = drawDoughboy;
window.drawSweatDrop = drawSweatDrop;
