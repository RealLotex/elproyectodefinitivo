// Authored protagonist sprite renderer.
// Canonical drawings: assets/sprites/nico_poses.png and vera_poses.png.
// Runtime sheets are 256x256, arranged as a 4x4 grid of 64x64 poses.
// Smooth downscaling preserves the hand-drawn source without artificial blockiness.

(() => {
  const sheets = { m: new Image(), f: new Image() };
  sheets.m.src = 'assets/sprites/nico_poses.png';
  sheets.f.src = 'assets/sprites/vera_poses.png';

  const CELL = 64;
  const DRAW = 92;
  const ANCHOR_Y = 69;

  const POSE = Object.freeze({
    IDLE: 0, WALK: 1, RUN: 2, JUMP: 3,
    WAVE: 4, POINT: 5, HANDS_HIPS: 6, SHOCKED: 7,
    ANGRY: 8, SIT: 9, CROUCH: 10, LOOK_UP: 11,
    THINK: 12, CELEBRATE: 13, LEAN: 14, RELAXED: 15
  });

  function sourceRect(index) {
    return { sx: (index % 4) * CELL, sy: Math.floor(index / 4) * CELL };
  }

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
    if (!img.complete || !img.naturalWidth) return false;
    const { sx, sy } = sourceRect(index);
    const dx = Math.round(px - DRAW / 2);
    const dy = Math.round(py - ANCHOR_Y);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (flipLeft) {
      ctx.translate(Math.round(px) * 2, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, sy, CELL, CELL, dx, dy, DRAW, DRAW);
    ctx.restore();
    return true;
  }

  drawResident = function(px, py, gender, now, { backpack = true, selected = false, step = 0 } = {}) {
    const img = sheets[gender === 'f' ? 'f' : 'm'];
    drawSheetPose(img, pickPose(now, { selected, step }), px, py, shouldFlipLeft(step));
    if (selected && blink(now, 330)) rect(Math.round(px - 3), Math.round(py - 75), 6, 8, '#ffd400');
    void backpack;
  };

  window.PROTAGONIST_POSES = POSE;
  window.PROTAGONIST_SHEETS = sheets;
})();