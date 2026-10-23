// ═══════════════════════════════════════════════════════════════════════════
// TopBuzz Studio — Episode 01: "The Warship That Accidentally Torpedoed FDR"
// v2 Studio Composition: Hero Waist-Up Framing, Airbrush 3D Shading, Zero Clip
// ═══════════════════════════════════════════════════════════════════════════

function renderPeriscopeLoopState(loopPhase = 0, fireTorpedo = 0) {
  drawOceanWorld(loopPhase, { horizonY: 890, preset: 'atlantic', camX: 0 });
  drawWarship(555, 898, 1.08, {
    type: 'battleship',
    hullNum: '61',
    flip: 1,
    roll: Math.sin(loopPhase * TAU) * 0.012,
    smoke: 0.78,
    t: loopPhase,
  });

  if (fireTorpedo > 0.01) {
    const p = clamp(fireTorpedo, 0, 1);
    const ty = lerp(1560, 965, Math.pow(p, 0.72));
    const sc = lerp(1.55, 0.42, p);
    const wakeW = lerp(96, 16, p);
    const wg = ctx.createLinearGradient(540, 1600, 555, ty);
    wg.addColorStop(0, 'rgba(240, 250, 255, 0.85)');
    wg.addColorStop(1, 'rgba(215, 240, 255, 0.30)');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(540 - 95, 1620);
    ctx.lineTo(540 + 95, 1620);
    ctx.lineTo(555 + wakeW, ty);
    ctx.lineTo(555 - wakeW, ty);
    ctx.closePath();
    ctx.fill();

    drawTorpedo(550, ty, sc, -Math.PI / 2 + 0.03, p * 2.5, true);
    drawWaterColumn(540, 1480, Math.min(1, p * 2.2) * (1 - p * 0.4), 340, 210, false);
  }

  drawPeriscopeReticle(468, 0, 0);
}

// ── S01 [0.00 -> 3.85s]: "This American warship accidentally fired a live torpedo at its own president..."
scene('s01_periscope_hook', 0.00, 3.85, (lt, d, t) => {
  const fireProg = clamp((t - 1.62) / 1.95, 0, 1);
  dramaticZoom(1.0 + Math.pow(fireProg, 1.5) * 0.16, 555, 895, fireProg * 0.55, () => {
    renderPeriscopeLoopState((t / 3.85) % 1, fireProg);
    if (fireProg > 0.04) smearLines(555, 900, 0.30 * fireProg, 48);
  });
  impactFlash(lt, 1.66, 0.55);
});

// ── S02 [3.85 -> 7.50s]: "...and the Navy arrested every single sailor on board."
scene('s02_brig_arrest', 3.85, 7.50, (lt, d, t) => {
  const ct = onTwos(lt);
  dramaticZoom(1.0 + lt * 0.025, 540, 1080, 0.05, () => {
    drawNavalBulkhead({ wallTop: '#4A544E', wallBot: '#29302D', floorY: 1680, lampX: 540 });

    // Hero Medium Framing of arrested crew behind heavy iron brig bars!
    drawDoughboy({
      x: 245, y: 1475, scale: 1.06, role: 'sailor', facing: 1,
      mood: 'guilty', viseme: 'X', blink: autoBlink(ct, 2.9, 1.1),
      stress: 0.85, headTilt: 0.10, bob: Math.sin(ct * 3) * 2,
      leftHand: { x: -85, y: 115, pose: 'relax', bend: 1 },
      rightHand: { x: 95, y: 15, pose: 'grip', bend: -1 },
    });
    drawDoughboy({
      x: 835, y: 1475, scale: 1.06, role: 'sailor', facing: -1,
      mood: 'worried', viseme: 'X', blink: autoBlink(ct, 3.3, 0.4),
      stress: 0.75, headTilt: -0.09, bob: Math.sin(ct * 3 + 1) * 2,
      leftHand: { x: -95, y: 15, pose: 'grip', bend: 1 },
      rightHand: { x: 85, y: 115, pose: 'relax', bend: -1 },
    });
    drawDoughboy({
      x: 540, y: 1445, scale: 1.24, role: 'captain', facing: 1,
      mood: 'guilty', viseme: visemeAt(t), blink: autoBlink(ct, 3.6, 2.0),
      stress: 1.0, headTilt: 0.08, hatTilt: -0.09,
      leftHand: { x: -105, y: 20, pose: 'grip', bend: 1 },
      rightHand: { x: 105, y: 20, pose: 'grip', bend: -1 },
    });

    // Heavy Iron Brig Prison Bars slamming down across the cell!
    const slamY = lerp(-420, 0, Math.min(1, easeOutBack(clamp(lt / 0.35, 0, 1))));
    ctx.save();
    ctx.translate(0, slamY);
    ctx.fillStyle = '#1D222B';
    ctx.strokeStyle = '#0D1017';
    ctx.lineWidth = 4.5;
    ctx.fillRect(0, 290, W, 38); ctx.strokeRect(0, 290, W, 38);
    ctx.fillRect(0, 1650, W, 40); ctx.strokeRect(0, 1650, W, 40);
    for (let bx = 76; bx < W; bx += 118) {
      const bg = ctx.createLinearGradient(bx - 10, 0, bx + 12, 0);
      bg.addColorStop(0, '#637085');
      bg.addColorStop(0.5, '#2A313D');
      bg.addColorStop(1, '#141820');
      ctx.fillStyle = bg;
      ctx.fillRect(bx, 290, 24, 1390);
      ctx.strokeRect(bx, 290, 24, 1390);
    }
    ctx.restore();

    // Foreground Shore Patrol MP Guard watching closely
    drawDoughboy({
      x: 145, y: 1665, scale: 1.18, role: 'mp', facing: 1,
      mood: 'angry', viseme: 'X', blink: autoBlink(ct, 4.1, 0.7),
      leftHand: { x: -90, y: 90, pose: 'fist', bend: 1 },
      rightHand: { x: 95, y: 55, pose: 'fist', bend: -1 },
    });
  });
});

// ── S03 [7.50 -> 11.20s]: "In 1943, the brand new destroyer Willie Dee set sail on a top secret mission..."
scene('s03_willie_dee_bridge', 7.50, 11.20, (lt, d, t) => {
  const ct = onTwos(lt);
  dramaticZoom(1.0 + lt * 0.03, 540, 1020, 0.03, () => {
    drawNavalBulkhead({ wallTop: '#536668', wallBot: '#2E3B3D', floorY: 1740, lampX: 480 });

    // Armored Bridge Window looking out over harbor & USS William D. Porter (579)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(75, 250, 930, 445, 14);
    ctx.clip();
    drawOceanWorld(t, { horizonY: 515, preset: 'harbor', camX: lt * 60 });
    drawWarship(595, 540, 0.74, { type: 'destroyer', hullNum: '579', flip: 1, t });
    ctx.restore();
    ctx.strokeStyle = '#131720';
    ctx.lineWidth = 11;
    ctx.strokeRect(75, 250, 930, 445);

    drawBrassGauge(175, 865, 84, -0.65 + Math.sin(t * 2) * 0.08, { label: 'KNOTS', dangerZone: false });
    drawBrassGauge(905, 865, 84, 0.42 + Math.cos(t * 1.7) * 0.06, { label: 'HEADING', dangerZone: false });
    drawShipWheel(805, 1435, 165, Math.sin(t * 1.4) * 0.24);

    // Hero Waist-Up Sailors & Captain commanding the vertical frame!
    drawDoughboy({
      x: 805, y: 1465, scale: 1.18, role: 'sailor', facing: -1,
      mood: 'proud', viseme: 'X', blink: autoBlink(ct, 3.1, 0.5),
      leftHand: { x: -115, y: -25, pose: 'grip', bend: 1 },
      rightHand: { x: 85, y: -25, pose: 'grip', bend: -1 },
    });

    const armRaise = Math.min(1, easeOutBack(clamp(lt / 0.55, 0, 1)));
    drawDoughboy({
      x: 355, y: 1430, scale: 1.38, role: 'captain', facing: 1,
      mood: 'determined', viseme: visemeAt(t), blink: autoBlink(ct, 3.7, 1.3),
      headTilt: -0.04, bob: Math.sin(ct * 4) * 3,
      leftHand: { x: 165, y: lerp(55, -80, armRaise), pose: 'point', bend: 1 },
      rightHand: { x: 118, y: 55, pose: 'grip', bend: -1 },
      propRender: (c) => {
        c.save();
        c.translate(132, 42);
        c.rotate(0.14);
        c.fillStyle = '#EAD090';
        c.strokeStyle = '#131720';
        c.lineWidth = 4;
        c.beginPath(); c.roundRect(-64, -48, 128, 96, 6); c.fill(); c.stroke();
        c.strokeStyle = '#B82E28';
        c.lineWidth = 3.4;
        c.strokeRect(-50, -15, 100, 30);
        c.fillStyle = '#B82E28';
        c.font = '900 13px "Montserrat", sans-serif';
        c.textAlign = 'center';
        c.fillText('TOP SECRET', 0, 5);
        c.restore();
      }
    });
  });
});

// ── S04 [11.20 -> 14.55s]: "...to escort Franklin Roosevelt across the Atlantic."
scene('s04_fdr_atlantic_escort', 11.20, 14.55, (lt, d, t) => {
  const ct = onTwos(lt);
  dramaticZoom(1.0 + lt * 0.032, 540, 1080, 0.03, () => {
    drawOceanWorld(t, { horizonY: 790, preset: 'atlantic', camX: lt * 95 });
    drawWarship(790, 815, 0.68, {
      type: 'destroyer', hullNum: '579', flip: 1,
      roll: Math.sin(t * 2.2) * 0.025, t,
    });

    // Planked Teak Battleship Promenade Deck + Lifebuoy Ring!
    drawTeakDeck(1520, 1015, 'U.S.S. IOWA');

    drawDoughboy({
      x: 235, y: 1355, scale: 1.24, role: 'secret_service', facing: 1,
      mood: 'determined', viseme: 'X', lookX: 0.65, blink: autoBlink(ct, 4.2, 0.8),
      leftHand: { x: 65, y: 65, pose: 'fist', bend: 1 },
      rightHand: { x: -75, y: 85, pose: 'relax', bend: -1 },
    });

    drawDoughboy({
      x: 645, y: 1385, scale: 1.36, role: 'fdr', facing: 1,
      mood: 'proud', viseme: visemeAt(t), blink: autoBlink(ct, 3.5, 2.1),
      wheelchair: true, cigaretteHolder: true,
      headTilt: -0.05 + Math.sin(ct * 2) * 0.02,
      leftHand: { x: 145, y: -45, pose: 'open', bend: 1 },
      rightHand: { x: 85, y: 55, pose: 'grip', bend: -1 },
    });
  });
});

// ── S05 [14.55 -> 20.05s]: "Before it even cleared the harbor, its anchor tore the deck apart on the friendly warship parked right next to it."
scene('s05_anchor_harbor_disaster', 14.55, 20.05, (lt, d, t) => {
  const crash = clamp((lt - 0.55) / 2.2, 0, 1);
  dramaticZoom(1.0 + crash * 0.06, 540, 960, 0.35 * crash, () => {
    drawOceanWorld(t, { horizonY: 730, preset: 'harbor', camX: lt * 120 });

    drawWarship(740, 800, 0.96, {
      type: 'destroyer', hullNum: '522', flip: -1,
      roll: Math.sin(lt * 16) * 0.055 * (crash > 0 ? 1 : 0), smoke: 0.35, t,
    });

    const shipX = 165 + lt * 88;
    drawWarship(shipX, 855, 1.0, {
      type: 'destroyer', hullNum: '579', flip: 1, roll: 0.03, smoke: 0.95, t,
    });

    const ax = lerp(520, 825, crash);
    ctx.strokeStyle = '#181C24';
    ctx.lineWidth = 11;
    ctx.setLineDash([16, 8]);
    ctx.beginPath();
    ctx.moveTo(shipX + 260, 805);
    ctx.quadraticCurveTo((shipX + 260 + ax) / 2, 845, ax, 748);
    ctx.stroke();
    ctx.setLineDash([]);

    if (crash > 0.05) {
      smearLines(ax, 755, 0.32, 42);
      for (let k = 0; k < 7; k++) {
        const ang = -2.4 + k * 0.34;
        const dist = ((lt * 2.1 + k * 0.19) % 1) * 260;
        const dx = ax + Math.cos(ang) * dist;
        const dy = 748 + Math.sin(ang) * dist + dist * dist * 0.0016;
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(lt * 8 + k);
        ctx.fillStyle = k % 2 ? '#D96B27' : '#8C6239';
        ctx.strokeStyle = '#131720';
        ctx.lineWidth = 3;
        ctx.fillRect(-20, -7, 40, 14);
        ctx.strokeRect(-20, -7, 40, 14);
        ctx.restore();
      }
    }

    drawTeakDeck(1640, 1180, 'DD-579');

    // Hero Medium Close-up of panicking Willie Dee crew clutching heads as hats pop up!
    const pop = Math.max(0, Math.sin(clamp((lt - 0.55) * 4, 0, Math.PI))) * 46;
    drawDoughboy({
      x: 275, y: 1515, scale: 1.25, role: 'sailor', facing: 1,
      mood: 'panic', viseme: visemeAt(t), openBoost: 0.4, stress: 1.0,
      hatLift: pop, hatTilt: -0.22, headTilt: -0.08, lookX: 0.7, lookY: -0.5,
      leftHand: { x: -86, y: -255, pose: 'clutch', bend: -1 },
      rightHand: { x: 96, y: -255, pose: 'clutch', bend: 1 },
    });
    drawDoughboy({
      x: 805, y: 1530, scale: 1.24, role: 'captain', facing: -1,
      mood: 'shock', viseme: 'D', openBoost: 0.35, stress: 1.0,
      hatLift: pop * 0.85, hatTilt: 0.20, lookX: -0.5, lookY: -0.5,
      leftHand: { x: -95, y: -250, pose: 'clutch', bend: -1 },
      rightHand: { x: 88, y: -250, pose: 'clutch', bend: 1 },
    });
  });
  impactFlash(lt, 0.62, 0.45);
});

// ── S06 [20.05 -> 23.60s]: "24 hours later, an armed depth charge rolled off the stern and exploded..."
scene('s06_depth_charge_explosion', 20.05, 23.60, (lt, d, t) => {
  const boomT = 1.35;
  const postBoom = clamp((lt - boomT) / 1.9, 0, 1);
  dramaticZoom(1.0 + postBoom * 0.12, 610, 920, postBoom * 0.75, () => {
    drawOceanWorld(t, {
      horizonY: 860, preset: 'storm', camX: lt * 90,
      lightning: lt > 1.28 && lt < 1.55 ? 0.85 : 0,
    });

    drawWarship(335, 930 - postBoom * 18, 0.96, {
      type: 'destroyer', hullNum: '579', flip: 1,
      roll: -0.05 - postBoom * 0.08, smoke: 0.9, t,
    });

    if (lt < boomT) {
      const p = lt / boomT;
      const bx = lerp(615, 745, p);
      const by = 895 + p * p * 210;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(p * 7.5);
      ctx.fillStyle = '#43515E';
      ctx.strokeStyle = '#131720';
      ctx.lineWidth = 4.4;
      ctx.beginPath(); ctx.roundRect(-30, -40, 60, 80, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#D94136';
      ctx.fillRect(-30, -9, 60, 18);
      ctx.restore();
    } else {
      drawWaterColumn(755, 1015, postBoom, 780, 290, true);
      smearLines(755, 880, 0.35 * (1 - postBoom * 0.5), 48);
    }
  });
  impactFlash(lt, boomT, 0.85);
});

// ── S07 [23.60 -> 26.75s]: "...tricking the whole fleet into thinking German U-boats were attacking."
scene('s07_uboats_battle_stations', 23.60, 26.75, (lt, d, t) => {
  const pulse = 0.5 + 0.5 * Math.sin(lt * 11);
  dramaticZoom(1.02 + lt * 0.03, 540, 1020, 0.22, () => {
    drawNavalBulkhead({ wallTop: '#4A525D', wallBot: '#262B34', floorY: 1750, alarmRed: pulse, lampX: 540 });

    drawBrassGauge(215, 485, 124, t * 7.5, { label: 'SONAR', spinSmear: 0.92 });
    drawBrassGauge(540, 425, 140, -t * 9.2, { label: 'BEARING', spinSmear: 0.98 });
    drawBrassGauge(865, 485, 124, t * 6.4 + 1.2, { label: 'DEPTH', spinSmear: 0.88 });

    drawDoughboy({
      x: 330, y: 1455, scale: 1.36, role: 'captain', facing: 1,
      mood: 'shout', viseme: visemeAt(t), openBoost: 0.3, stress: 0.9,
      hatLift: 14 * pulse, headTilt: -0.06,
      leftHand: { x: 185, y: -95, pose: 'point', bend: 1 },
      rightHand: { x: -115, y: 40, pose: 'fist', bend: -1 },
    });
    drawDoughboy({
      x: 805, y: 1480, scale: 1.24, role: 'officer', facing: -1,
      mood: 'panic', viseme: visemeAt(t + 0.12), stress: 0.95,
      lookX: -0.8, lookY: -0.6,
      leftHand: { x: -135, y: -120, pose: 'open', bend: 1 },
      rightHand: { x: 95, y: -185, pose: 'clutch', bend: -1 },
    });
  });
});

// ── S08 [26.75 -> 31.60s]: "Then a monster wave smashed the hull, swept a sailor to sea, and knocked an engine offline."
scene('s08_monster_wave_boiler_out', 26.75, 31.60, (lt, d, t) => {
  const waveHit = clamp((lt - 0.7) / 1.8, 0, 1);
  dramaticZoom(1.0 + waveHit * 0.08, 520, 930, 0.55 * waveHit, () => {
    drawOceanWorld(t, {
      horizonY: 880, preset: 'storm', camX: lt * 160,
      lightning: lt > 0.65 && lt < 0.92 ? 0.9 : 0,
    });

    drawWarship(470, 975 + Math.sin(lt * 4) * 28, 1.06, {
      type: 'destroyer', hullNum: '579', flip: 1,
      roll: -0.17 * Math.sin(clamp(lt * 1.1, 0, Math.PI)) - 0.06,
      smoke: lt > 2.2 ? 0.15 : 0.85, t,
    });

    const wx = lerp(1180, 310, clamp(lt / 2.6, 0, 1));
    const wavePts = crPts([
      [wx + 420, 1180], [wx + 190, 820], [wx - 40, 560], [wx - 195, 640],
      [wx - 95, 790], [wx - 180, 1080], [wx + 420, 1260]
    ], true, 12);
    const wg = ctx.createLinearGradient(wx - 200, 560, wx + 250, 1180);
    wg.addColorStop(0, '#DCEBFA');
    wg.addColorStop(0.35, '#4A779E');
    wg.addColorStop(1, '#10243B');
    poly(wavePts, true);
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#131720';
    ctx.stroke();

    const psiAng = lerp(0.55, -2.35, clamp((lt - 2.1) / 1.1, 0, 1));
    drawBrassGauge(845, 420, 118, psiAng, {
      label: 'BOILER PSI', dangerZone: true, spinSmear: lt > 2.1 && lt < 3.2 ? 0.75 : 0,
    });
  });
  impactFlash(lt, 0.75, 0.5);
});

// ── S09 [31.60 -> 38.05s]: "On day three, the crew ran a harmless practice torpedo drill aimed straight at Roosevelt's battleship, the USS Iowa."
scene('s09_practice_drill_setup', 31.60, 38.05, (lt, d, t) => {
  const ct = onTwos(lt);
  dramaticZoom(1.0 + lt * 0.035, 560, 920, 0.03, () => {
    drawOceanWorld(t, { horizonY: 780, preset: 'atlantic', camX: lt * 55 });

    drawWarship(635, 790, 0.96, {
      type: 'battleship', hullNum: '61', flip: 1, smoke: 0.65, t,
    });

    ctx.fillStyle = '#3B4859';
    ctx.strokeStyle = '#131720';
    ctx.lineWidth = 5;
    ctx.fillRect(-100, 1340, W + 200, 640);
    ctx.strokeRect(-100, 1340, W + 200, 640);

    for (let k = 0; k < 3; k++) {
      ctx.save();
      ctx.translate(420 + k * 155, 1320);
      ctx.rotate(-0.34);
      const tg = ctx.createLinearGradient(-48, 0, 48, 0);
      tg.addColorStop(0, '#6B7E96');
      tg.addColorStop(0.5, '#9EB0C7');
      tg.addColorStop(1, '#313E4F');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.roundRect(-48, -310, 96, 350, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#161D28';
      ctx.beginPath(); ctx.ellipse(0, -310, 48, 18, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    drawDoughboy({
      x: 265, y: 1445, scale: 1.34, role: 'officer', facing: 1,
      mood: 'determined', viseme: visemeAt(t), blink: autoBlink(ct, 3.6, 1.0),
      leftHand: { x: 175, y: -125, pose: 'point', bend: 1 },
      rightHand: { x: -85, y: 75, pose: 'relax', bend: -1 },
    });
  });
});

// ── S10 [38.05 -> 42.35s]: "Except one terrified torpedo man forgot to pull the live explosive primer."
scene('s10_forgot_live_primer', 38.05, 42.35, (lt, d, t) => {
  const ct = onTwos(lt);
  const dread = clamp((lt - 0.65) / 2.6, 0, 1);
  // Keep camera centered so ZERO left-edge clipping occurs while dramatic punch-in frames both!
  dramaticZoom(1.0 + dread * 0.08, 540, 1080, dread * 0.22, () => {
    drawNavalBulkhead({ wallTop: '#4A5B63', wallBot: '#253036', floorY: 1740, alarmRed: dread * 0.45, lampX: 540 });

    // Detailed Mechanical WWII Mark 15 Circular Hinged Steel Torpedo Tube #3 Breech!
    ctx.save();
    ctx.translate(765, 1065);

    // Cylindrical steel tube barrel extending behind breech ring
    const barG = ctx.createLinearGradient(-220, -240, 220, 240);
    barG.addColorStop(0, '#6B7F94');
    barG.addColorStop(0.5, '#4A5B6E');
    barG.addColorStop(1, '#26313D');
    ctx.fillStyle = barG;
    ctx.strokeStyle = '#131720';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 238, 0, TAU); ctx.fill(); ctx.stroke();

    // 8 Radial Heavy Steel Dogging Lugs & Bolts around Breech Flange!
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = '#8598AD';
      ctx.fillRect(-20, -252, 40, 42);
      ctx.strokeRect(-20, -252, 40, 42);
      ctx.fillStyle = '#2B3642';
      ctx.beginPath(); ctx.arc(0, -230, 8, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // Inner dark recessed firing chamber + stencil plate "TUBE 3"
    ctx.fillStyle = '#18202B';
    ctx.beginPath(); ctx.arc(0, 0, 168, 0, TAU); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#CBD6E4';
    ctx.font = '900 22px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TORPEDO TUBE NO. 3', 0, -182);

    // Threaded Gleaming Brass LIVE EXPLOSIVE PRIMER Cartridge Locked Inside!
    const pg = ctx.createLinearGradient(-66, -88, 66, 88);
    pg.addColorStop(0, '#FFF4B8');
    pg.addColorStop(0.45, '#E3AB3B');
    pg.addColorStop(1, '#7D5614');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.roundRect(-64, -96, 128, 192, 16); ctx.fill(); ctx.stroke();
    // Threaded brass grooves at top
    ctx.lineWidth = 3;
    for (let gy = -78; gy <= -54; gy += 12) {
      ctx.beginPath(); ctx.moveTo(-62, gy); ctx.lineTo(62, gy); ctx.stroke();
    }

    // Danger red stencil band
    ctx.fillStyle = '#D9342B';
    ctx.fillRect(-62, -26, 124, 54);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px "Montserrat", sans-serif';
    ctx.fillText('LIVE', 0, 10);

    const pulse = 0.55 + 0.45 * Math.sin(lt * 10);
    ctx.fillStyle = `rgba(255, 75, 55, ${0.26 * pulse * dread})`;
    ctx.beginPath(); ctx.arc(0, 0, 185, 0, TAU); ctx.fill();
    ctx.restore();

    // Terrified Torpedoman FULLY framed on left clutching both cheeks as Dixie Cup pops up!
    drawDoughboy({
      x: 295, y: 1435, scale: 1.36, role: 'torpedoman', facing: 1,
      mood: 'panic', viseme: visemeAt(t), openBoost: 0.30 * dread,
      stress: Math.max(0.5, dread), hatLift: dread * 38, hatTilt: -0.18 * dread,
      lookX: 0.95, lookY: -0.10, blink: autoBlink(ct, 4.5, 0.2),
      leftHand: { x: 105, y: -225, pose: 'clutch', bend: 1 },
      rightHand: { x: -85, y: -225, pose: 'clutch', bend: -1 },
    });
  });
});

// ── S11 [42.35 -> 45.30s]: "A real torpedo rocketed straight toward the president."
scene('s11_live_torpedo_rockets', 42.35, 45.30, (lt, d, t) => {
  dramaticZoom(1.06 + lt * 0.06, 560, 960, 0.65, () => {
    drawOceanWorld(t, { horizonY: 420, preset: 'deepsea', camX: lt * 520 });

    for (let r = 0; r < 5; r++) {
      ctx.save();
      ctx.fillStyle = 'rgba(145, 215, 250, 0.08)';
      ctx.beginPath();
      const rx = 120 + r * 230 - ((lt * 140) % 230);
      ctx.moveTo(rx, 420); ctx.lineTo(rx + 95, 420);
      ctx.lineTo(rx - 140, 1920); ctx.lineTo(rx - 260, 1920);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    smearLines(560, 980, 0.45, 54);
    drawTorpedo(560 + Math.sin(lt * 24) * 6, 980 + Math.cos(lt * 19) * 5, 1.62, -0.04, t, true);
  });
  impactFlash(lt, 0.05, 0.75);
});

// ── S12 [45.30 -> 50.55s]: "Ordered to keep strict radio silence, the crew blinked frantic light signals and sent the wrong direction."
scene('s12_signal_lamp_fiasco', 45.30, 50.55, (lt, d, t) => {
  const lampOn = Math.sin(lt * 26) > 0.15 ? 1 : 0.08;
  dramaticZoom(1.0 + lt * 0.03, 540, 1050, 0.12, () => {
    drawOceanWorld(t, { horizonY: 840, preset: 'storm', camX: lt * 40 });
    drawTeakDeck(1600, 1140, 'DD-579');

    drawDoughboy({
      x: 285, y: 1445, scale: 1.24, role: 'sailor', facing: 1,
      mood: 'panic', viseme: visemeAt(t), stress: 0.95,
      hatLift: 18, headTilt: -0.05,
      leftHand: { x: 165, y: -95, pose: 'grip', bend: 1 },
      rightHand: { x: 155, y: -35, pose: 'grip', bend: -1 },
    });

    ctx.save();
    ctx.translate(545, 1150);
    if (lampOn > 0.5) {
      const bg = ctx.createLinearGradient(0, 0, 560, -180);
      bg.addColorStop(0, 'rgba(255, 253, 210, 0.92)');
      bg.addColorStop(1, 'rgba(255, 253, 210, 0.0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(35, -35); ctx.lineTo(620, -340); ctx.lineTo(620, 140); ctx.lineTo(35, 35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#2A3442';
    ctx.strokeStyle = '#131720';
    ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.roundRect(-48, -56, 100, 112, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = lampOn > 0.5 ? '#FFFDE0' : '#6A7B8C';
    ctx.beginPath(); ctx.ellipse(52, 0, 16, 50, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();

    const realize = clamp((lt - 2.3) / 0.6, 0, 1);
    drawDoughboy({
      x: 815, y: 1465, scale: 1.28, role: 'captain', facing: -1,
      mood: realize > 0.2 ? 'shock' : 'worried',
      viseme: visemeAt(t), openBoost: realize * 0.4,
      stress: 1.0, hatLift: realize * 44, hatTilt: 0.24 * realize,
      leftHand: { x: -95, y: lerp(-40, -250, realize), pose: 'clutch', bend: -1 },
      rightHand: { x: 88, y: lerp(-40, -250, realize), pose: 'clutch', bend: 1 },
    });
  });
});

// ── S13 [50.55 -> 54.95s]: "Finally, they broke protocol and screamed over the radio, Lion, hard right!"
scene('s13_scream_lion_hard_right', 50.55, 54.95, (lt, d, t) => {
  const scream = clamp((lt - 1.55) / 0.45, 0, 1);
  dramaticZoom(1.02 + scream * 0.10, 540, 1020, 0.30 + scream * 0.40, () => {
    drawNavalBulkhead({ wallTop: '#4A505E', wallBot: '#222630', floorY: 1760, alarmRed: 0.85, lampX: 480 });
    if (scream > 0.1) smearLines(480, 960, 0.35 * scream, 44);

    // Wall-mounted TBS Naval Radio Transmitter Unit
    ctx.fillStyle = '#384352';
    ctx.strokeStyle = '#131720';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(755, 620, 240, 355, 16); ctx.fill(); ctx.stroke();
    drawBrassGauge(875, 745, 66, Math.sin(t * 22) * 0.9, { label: 'RF OUT', spinSmear: 0.65 });

    // Hero Close-Up Captain gripping Bakelite Radio Mic RIGHT IN FRONT OF HIS MOUTH!
    drawDoughboy({
      x: 445, y: 1435, scale: 1.50, role: 'captain', facing: 1,
      mood: 'shout', viseme: visemeAt(t), openBoost: 0.35 * scream,
      stress: 1.0, hatLift: 20 * scream, headTilt: -0.05,
      leftHand: { x: 112, y: -215, pose: 'grip', bend: 1 },   // holds radio mic right to mouth!
      rightHand: { x: 225, y: -155, pose: 'point', bend: 1 }, // points straight HARD RIGHT!
      frontPropRender: (c) => {
        // Coiled radio cord leading cleanly from handset in front hand to TBS wall box!
        c.strokeStyle = '#131720';
        c.lineWidth = 6.5;
        c.beginPath();
        c.moveTo(118, -205);
        c.bezierCurveTo(165, -95, 200, -145, 225, -265);
        c.stroke();

        // Vintage Black Bakelite TBS Microphone + Push-to-Talk Handset held at mouth!
        c.save();
        c.translate(108, -225);
        c.rotate(-0.18);
        c.fillStyle = '#1F2430';
        c.strokeStyle = '#131720';
        c.lineWidth = 4.5;
        c.beginPath(); c.roundRect(-24, -46, 48, 92, 14); c.fill(); c.stroke();
        c.fillStyle = '#6C7A8E';
        c.beginPath(); c.arc(0, -18, 15, 0, TAU); c.fill(); c.stroke();

        // Golden comic audio shockwave arcs radiating from microphone!
        if (scream > 0.05) {
          c.strokeStyle = '#FFE066';
          c.lineWidth = 4.5;
          for (let w = 1; w <= 3; w++) {
            c.beginPath();
            c.arc(22, -18, 22 + w * 18, -0.7, 0.7);
            c.stroke();
          }
        }
        c.restore();
      }
    });
  });
  impactFlash(lt, 1.62, 0.45);
});

// ── S14 [54.95 -> 58.95s]: "Secret service agents drew their guns as Roosevelt calmly asked to watch over the railing..."
scene('s14_secret_service_fdr_watch', 54.95, 58.95, (lt, d, t) => {
  const ct = onTwos(lt);
  const drawGun = Math.min(1, easeOutBack(clamp(lt / 0.5, 0, 1)));
  dramaticZoom(1.0 + lt * 0.032, 540, 1080, 0.06, () => {
    drawOceanWorld(t, { horizonY: 790, preset: 'atlantic', camX: lt * 130 });
    drawTeakDeck(1520, 1015, 'U.S.S. IOWA');

    // Secret Service Agent in Fedora drawing Colt M1911 pistol (locked cleanly inside gloved hand via `prop`!)
    drawDoughboy({
      x: 245, y: 1365, scale: 1.25, role: 'secret_service', facing: 1,
      mood: 'angry', viseme: 'B', stress: 0.75, bodyLean: 0.04,
      leftHand: {
        x: lerp(85, 165, drawGun), y: lerp(-10, -105, drawGun), pose: 'grip', bend: 1,
        prop: (c) => {
          c.fillStyle = '#222834';
          c.strokeStyle = '#131720';
          c.lineWidth = 4;
          c.fillRect(6, -24, 62, 18); c.strokeRect(6, -24, 62, 18);
          c.fillRect(4, -8, 18, 28);  c.strokeRect(4, -8, 18, 28);
        }
      },
      rightHand: { x: 95, y: 35, pose: 'fist', bend: -1 },
    });

    // Unflappable FDR leaning happily in properly seated mahogany wheelchair pointing to watch!
    drawDoughboy({
      x: 695, y: 1390, scale: 1.36, role: 'fdr', facing: 1,
      mood: 'smug', viseme: visemeAt(t), blink: autoBlink(ct, 3.8, 0.9),
      wheelchair: true, cigaretteHolder: true, bodyLean: 0.05,
      leftHand: { x: 165, y: -85, pose: 'point', bend: 1 },
      rightHand: { x: 85, y: 55, pose: 'grip', bend: -1 },
    });
  });
});

// ── S15 [58.95 -> 62.45s]: "...while the battleship swerved and the torpedo blew up in its wake."
scene('s15_battleship_swerve_explosion', 58.95, 62.45, (lt, d, t) => {
  const boomT = 0.85;
  const blast = clamp((lt - boomT) / 2.2, 0, 1);
  dramaticZoom(1.0 + blast * 0.14, 480, 900, blast * 0.85, () => {
    drawOceanWorld(t, { horizonY: 790, preset: 'atlantic', camX: lt * 190 });

    const wakeArc = crPts([
      [120, 1340], [290, 1140], [450, 1020], [720, 955], [960, 945], [760, 995], [390, 1210]
    ], true, 12);
    poly(wakeArc, true);
    ctx.fillStyle = 'rgba(232, 246, 255, 0.75)';
    ctx.fill();

    drawWarship(675 + lt * 42, 910, 0.98, {
      type: 'battleship', hullNum: '61', flip: 1,
      roll: 0.115, smoke: 1.0, t,
    });

    if (lt >= boomT) {
      drawWaterColumn(335, 1065, blast, 820, 310, true);
      smearLines(335, 920, 0.40 * (1 - blast * 0.5), 50);
    } else {
      drawTorpedo(lerp(80, 325, lt / boomT), 1055, 0.76, -0.15, t, true);
    }
  });
  impactFlash(lt, boomT, 0.92);
});

// ── S16 [62.45 -> 67.40s]: "Sent to Okinawa in disgrace, friendly ships greeted it by shouting, don't shoot, we're Republicans!"
scene('s16_dont_shoot_republicans', 62.45, 67.40, (lt, d, t) => {
  const ct = onTwos(lt);
  dramaticZoom(1.0 + lt * 0.028, 540, 1060, 0.04, () => {
    drawOceanWorld(t, { horizonY: 780, preset: 'harbor', camX: lt * 45 });
    drawWarship(520, 805, 0.82, { type: 'destroyer', hullNum: '579', flip: 1, smoke: 0.45, t });
    drawTeakDeck(1560, 1080, 'PACIFIC FLEET');

    const waveAng = Math.sin(lt * 9) * 0.42;
    drawDoughboy({
      x: 295, y: 1415, scale: 1.28, role: 'sailor', facing: 1,
      mood: 'smug', viseme: visemeAt(t), openBoost: 0.22,
      blink: autoBlink(ct, 3.2, 0.6),
      leftHand: { x: 145, y: -215, pose: 'grip', bend: 1 },
      rightHand: { x: 115, y: -155, pose: 'open', bend: -1 },
      propRender: (c) => {
        c.save();
        c.translate(145, -215);
        c.rotate(waveAng);
        c.strokeStyle = '#131720';
        c.lineWidth = 5;
        c.beginPath(); c.moveTo(0, 20); c.lineTo(0, -150); c.stroke();
        c.fillStyle = '#FFFFFF';
        c.beginPath();
        c.moveTo(0, -146);
        c.quadraticCurveTo(58, -125 + Math.sin(lt * 12) * 18, 102, -135);
        c.lineTo(95, -72);
        c.quadraticCurveTo(45, -62, 0, -78);
        c.closePath();
        c.fill(); c.stroke();
        c.restore();
      }
    });

    drawDoughboy({
      x: 795, y: 1445, scale: 1.28, role: 'captain', facing: -1,
      mood: 'guilty', viseme: 'X', stress: 1.0,
      hatTilt: 0.16, headTilt: 0.14,
      leftHand: { x: -65, y: -185, pose: 'clutch', bend: -1 },
      rightHand: { x: 75, y: 75, pose: 'relax', bend: 1 },
    });
  });
});

// ── S17 [67.40 -> 73.65s]: "Until a kamikaze blast sank the ship beneath them and the captain saved every single man aboard without losing a single life."
scene('s17_okinawa_miracle_survival', 67.40, 73.65, (lt, d, t) => {
  const ct = onTwos(lt);
  dramaticZoom(1.0 + lt * 0.03, 540, 1040, 0.04, () => {
    const sg = ctx.createLinearGradient(0, 0, 0, 820);
    sg.addColorStop(0.0, '#232B42');
    sg.addColorStop(0.55, '#6E4758');
    sg.addColorStop(1.0, '#E08A4E');
    ctx.fillStyle = sg;
    ctx.fillRect(-100, -100, W + 200, 940);

    const og = ctx.createLinearGradient(0, 820, 0, H);
    og.addColorStop(0, '#2C3F59');
    og.addColorStop(1, '#101C2B');
    ctx.fillStyle = og;
    ctx.fillRect(-100, 820, W + 200, H - 720);

    drawWarship(540, 835 + lt * 12, 0.78, {
      type: 'destroyer', hullNum: '579', flip: 1,
      roll: -0.26 - lt * 0.025, smoke: 1.0, t,
    });
    ctx.fillStyle = '#23364F';
    ctx.fillRect(-100, 858, W + 200, 660);

    drawTeakDeck(1560, 1100, 'RESCUE VESSEL');

    drawDoughboy({
      x: 215, y: 1455, scale: 1.15, role: 'sailor', facing: 1,
      mood: 'proud', viseme: 'X', blink: autoBlink(ct, 3.4, 0.5),
      leftHand: { x: 115, y: -215, pose: 'open', bend: 1 },
      rightHand: { x: -85, y: 65, pose: 'relax', bend: -1 },
    });
    drawDoughboy({
      x: 865, y: 1455, scale: 1.15, role: 'torpedoman', facing: -1,
      mood: 'proud', viseme: 'X', blink: autoBlink(ct, 3.9, 1.4),
      leftHand: { x: -115, y: -215, pose: 'open', bend: -1 },
      rightHand: { x: 85, y: 65, pose: 'relax', bend: 1 },
    });

    drawDoughboy({
      x: 540, y: 1415, scale: 1.38, role: 'captain', facing: 1,
      mood: 'determined', viseme: visemeAt(t), blink: autoBlink(ct, 4.1, 2.2),
      leftHand: { x: 96, y: -262, pose: 'salute', bend: 1 },
      rightHand: { x: -98, y: 75, pose: 'fist', bend: -1 },
    });
  });
});

// ── S18 [73.65 -> 74.40s]: SEAMLESS PERISCOPE LOOP CONVERGING TO `t = 0.000s`!
scene('s18_seamless_loop_bridge', 73.65, 74.40, (lt, d, t) => {
  const u = clamp(lt / d, 0, 1);
  renderPeriscopeLoopState((1 - u) * 0.15, 0);
  if (u < 0.85) {
    ctx.save();
    ctx.fillStyle = `rgba(9, 12, 17, ${(1 - u / 0.85) * 0.18})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
});

// ── GLOBAL CINEMATIC POST-COMPOSITOR + REFERENCE CAPTION OVERLAY ──────────
window.overlayHook = (outCtx, t) => {
  G = outCtx;
  GRADE.bloom = 0.15;
  GRADE.vignette = 0.22;
  drawReferenceCaption(t);
};
