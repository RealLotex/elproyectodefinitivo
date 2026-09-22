// Real protagonist sprite renderer.
// Source of truth: assets/sprites/nico_poses.png and vera_poses.png.
// Each sheet is 128x128, arranged as a 4x4 grid of 32x32 poses.
// Runtime rendering uses integer 2x scaling and disables interpolation.

(() => {
  const sheets = { m: new Image(), f: new Image() };
  sheets.m.src = 'assets/sprites/nico_poses.png';
  sheets.f.src = 'assets/sprites/vera_poses.png';

  const CELL = 32;
  const DRAW = 64;

  const POSE = Object.freeze({
    IDLE: 0,
    WALK: 1,
    RUN: 2,
    JUMP: 3,
    WAVE: 4,
    POINT: 5,
    HANDS_HIPS: 6,
    SHOCKED: 7,
    ANGRY: 8,
    SIT: 9,
    CROUCH: 10,
    LOOK_UP: 11,
    THINK: 12,
    CELEBRATE: 13,
    LEAN: 14,
    RELAXED: 15
  });

  function sourceRect(index) {
    return {
      sx: (index % 4) * CELL,
      sy: Math.floor(index / 4) * CELL
    };
  }

  function pickPose(now, { selected = false, step = 0 } = {}) {
    if (step) {
      // Alternate the supplied neutral/walk/run drawings instead of
      // synthesizing body movement procedurally.
      const frame = Math.floor(now / 130) % 4;
      return frame === 0 ? POSE.IDLE : frame === 2 ? POSE.RUN : POSE.WALK;
    }

    if (selected) {
      return Math.floor(now / 520) % 2 ? POSE.HANDS_HIPS : POSE.IDLE;
    }

    // Small diegetic idle variation using only authored poses.
    const idle = Math.floor(now / 1500) % 10;
    if (idle === 8) return POSE.THINK;
    if (idle === 9) return POSE.RELAXED;
    return POSE.IDLE;
  }

  function drawSheetPose(img, index, px, py) {
    if (!img.complete || !img.naturalWidth) return false;
    const { sx, sy } = sourceRect(index);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      sx, sy, CELL, CELL,
      Math.round(px - DRAW / 2),
      Math.round(py - 45),
      DRAW, DRAW
    );
    ctx.restore();
    return true;
  }

  drawResident = function(px, py, gender, now, { backpack = true, selected = false, step = 0 } = {}) {
    const img = sheets[gender === 'f' ? 'f' : 'm'];
    const pose = pickPose(now, { selected, step });

    drawSheetPose(img, pose, px, py);

    // Selection cursor remains UI, not part of the character art.
    if (selected && blink(now, 330)) {
      rect(Math.round(px - 3), Math.round(py - 52), 6, 8, '#ffd400');
    }

    // `backpack` remains in the API because existing scenes pass it.
    // The protagonist body is NEVER rebuilt with procedural primitives.
    // Backpack/keyboard will become authored sprite layers in the same style.
    void backpack;
  };

  window.PROTAGONIST_POSES = POSE;
  window.PROTAGONIST_SHEETS = sheets;
})();