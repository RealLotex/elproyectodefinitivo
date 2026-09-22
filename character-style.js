// High-quality protagonist renderer.
// Canonical sheets committed by the author: boy.png and fem.png.
// Each sheet is a 4x4 grid. Frames are drawn from the original asset at native cell size.

(() => {
  const sheets = { m: new Image(), f: new Image() };
  sheets.m.src = 'boy.png?v=8';
  sheets.f.src = 'fem.png?v=8';

  const POSE = Object.freeze({
    IDLE: 0, WALK: 1, RUN: 2, JUMP: 3,
    WAVE: 4, POINT: 5, HANDS_HIPS: 6, SHOCKED: 7,
    ANGRY: 8, SIT: 9, CROUCH: 10, LOOK_UP: 11,
    THINK: 12, CELEBRATE: 13, LEAN: 14, RELAXED: 15
  });

  function pickPose(now, { selected = false, step = 0 } = {}) {
    if (step) return Math.floor(now / 145) % 2 ? POSE.WALK : POSE.RUN;
    if (selected) return Math.floor(now / 700) % 2 ? POSE.HANDS_HIPS : POSE.IDLE;
    return POSE.IDLE;
  }

  function shouldFlipLeft(step) {
    if (!step) return false;
    try { return typeof game !== 'undefined' && game.player && game.player.facingX < 0; }
    catch { return false; }
  }

  function drawSheetPose(img, index, px, py, flipLeft) {
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) return false;

    const cellW = img.naturalWidth / 4;
    const cellH = img.naturalHeight / 4;
    const sx = (index % 4) * cellW;
    const sy = Math.floor(index / 4) * cellH;

    // Native frame dimensions: no runtime downsampling.
    const drawW = cellW;
    const drawH = cellH;
    const anchorY = drawH * 0.78;
    const dx = px - drawW / 2;
    const dy = py - anchorY;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (flipLeft) {
      ctx.translate(px * 2, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(img, sx, sy, cellW, cellH, dx, dy, drawW, drawH);
    ctx.restore();
    return true;
  }

  drawResident = function(px, py, gender, now, { backpack = true, selected = false, step = 0 } = {}) {
    const img = sheets[gender === 'f' ? 'f' : 'm'];
    const pose = pickPose(now, { selected, step });
    const drawn = drawSheetPose(img, pose, px, py, shouldFlipLeft(step));

    if (!drawn) {
      ctx.save();
      ctx.fillStyle = gender === 'f' ? '#ef55a8' : '#ff2020';
      ctx.beginPath();
      ctx.arc(px, py - 48, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (selected && blink(now, 330)) {
      const h = img.naturalHeight ? img.naturalHeight / 4 : 256;
      rect(Math.round(px - 4), Math.round(py - h * 0.82), 8, 12, '#ffd400');
    }

    void backpack;
  };

  window.PROTAGONIST_POSES = POSE;
  window.PROTAGONIST_SHEETS = sheets;
})();
