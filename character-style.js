// Authored protagonist sprite renderer.
// Canonical drawings: assets/sprites/nico_poses.png and vera_poses.png.
// Each sheet is interpreted as a 4x4 grid. Cell size is detected at runtime.
// Protagonists are rendered at 128px high with no smoothing.

(() => {
  const sheets = { m: new Image(), f: new Image() };
  sheets.m.src = 'assets/sprites/nico_poses.png?v=6';
  sheets.f.src = 'assets/sprites/vera_poses.png?v=6';

  const DRAW_W = 128;
  const DRAW_H = 128;
  const ANCHOR_Y = 96;

  const POSE = Object.freeze({
    IDLE: 0, WALK: 1, RUN: 2, JUMP: 3,
    WAVE: 4, POINT: 5, HANDS_HIPS: 6, SHOCKED: 7,
    ANGRY: 8, SIT: 9, CROUCH: 10, LOOK_UP: 11,
    THINK: 12, CELEBRATE: 13, LEAN: 14, RELAXED: 15
  });

  function pickPose(now, { selected = false, step = 0 } = {}) {
    if (step) return Math.floor(now / 150) % 2 ? POSE.WALK : POSE.RUN;
    if (selected) return Math.floor(now / 650) % 2 ? POSE.HANDS_HIPS : POSE.IDLE;
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
    const dx = Math.round(px - DRAW_W / 2);
    const dy = Math.round(py - ANCHOR_Y);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (flipLeft) {
      ctx.translate(Math.round(px) * 2, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(img, sx, sy, cellW, cellH, dx, dy, DRAW_W, DRAW_H);
    ctx.restore();
    return true;
  }

  drawResident = function(px, py, gender, now, { backpack = true, selected = false, step = 0 } = {}) {
    const img = sheets[gender === 'f' ? 'f' : 'm'];
    const drawn = drawSheetPose(img, pickPose(now, { selected, step }), px, py, shouldFlipLeft(step));

    // Fallback only while the image loads or if the path fails.
    if (!drawn) {
      rect(Math.round(px - 16), Math.round(py - 48), 32, 48, gender === 'f' ? '#ef55a8' : '#ff1515');
    }

    if (selected && blink(now, 330)) {
      rect(Math.round(px - 4), Math.round(py - 106), 8, 12, '#ffd400');
    }

    void backpack;
  };

  window.PROTAGONIST_POSES = POSE;
  window.PROTAGONIST_SHEETS = sheets;
})();