// Aspect-ratio independent UI layer.
// UI is positioned relative to the actually visible logical rectangle after
// cover/crop, not relative to the full 854x480 world bounds.

(() => {
  function view() {
    return window.RENDER_METRICS?.visibleRect || {
      left: 0, top: 0, right: 854, bottom: 480,
      width: 854, height: 480, cx: 427, cy: 240
    };
  }

  const clampNum = (v, min, max) => Math.max(min, Math.min(max, v));

  drawDialogue = function() {
    if (!game.dialogue) return;
    const v = view();
    const margin = clampNum(v.width * 0.025, 12, 24);
    const h = clampNum(v.height * 0.22, 82, 108);
    const x = v.left + margin;
    const y = v.bottom - margin - h;
    const w = v.width - margin * 2;

    panel(x, y, w, h);
    let ty = y + 14;
    if (game.dialogue.speaker) {
      text(game.dialogue.speaker, x + 20, ty, 12, '#86928a');
      ty += 20;
    }
    for (const line of game.dialogue.lines) {
      text(line, x + 20, ty, 15, '#e4ebe5');
      ty += 21;
    }
    text('▼', x + w - 18, y + h - 27, 11, '#79847b', 'right');
  };

  drawPrompt = function() {
    if (!game.prompt) return;
    const v = view();
    const margin = clampNum(v.width * 0.025, 12, 24);
    const w = Math.min(300, v.width - margin * 2);
    const h = Math.min(204, v.height - margin * 2);
    const x = v.right - margin - w;
    const y = v.top + margin;

    panel(x, y, w, h);
    text('PARCELA 14-B', x + 20, y + 18, 13, '#87938a');
    text('23 m² DISPONIBLES', x + 20, y + 39, 11, '#657068');
    game.prompt.options.forEach((o, i) => {
      text(`${i === game.prompt.selected ? '▶' : ' '} ${o}`,
        x + 30, y + 70 + i * 27, 15,
        i === game.prompt.selected ? '#eef3ef' : '#929c94');
    });
  };

  drawSelection = function(now) {
    const v = view();
    const elapsed = now - sel.started;

    if (sel.phase === 'intro') {
      rect(0, 0, 854, 480, '#050607');
      if (elapsed > 350) text('REGISTRO DE RESIDENTE', v.cx, v.cy - 52, 20, '#dce6dc', 'center');
      if (elapsed > 1050) text('PARCELA 14-B', v.cx, v.cy - 15, 16, '#87948b', 'center');
      if (elapsed > 1750) { sel.phase = 'choose'; sel.phaseAt = now; }
      return;
    }

    const d = sel.phase === 'glitch' ? now - sel.glitchAt : 9999;
    const pairVisible = sel.phase === 'choose' || sel.phase === 'confirm' || (sel.phase === 'glitch' && d < 520);
    drawRoomBase(pairVisible);

    // Keep both candidates near the visible center so crop never hides one.
    const separation = Math.min(194, v.width * 0.34);
    const baseY = clampNum(v.cy + 52, v.top + 150, v.bottom - 130);
    const a = { x: v.cx - separation / 2, y: baseY };
    const b = { x: v.cx + separation / 2, y: baseY };
    let ay = a.y, by = b.y;
    if (sel.phase === 'confirm' || sel.phase === 'glitch') {
      if (sel.selected === 0) ay -= 12; else by -= 12;
    }

    if (pairVisible) {
      drawResident(a.x, ay, 'm', now, { backpack: true, selected: sel.phase === 'choose' && sel.selected === 0 });
      drawResident(b.x, by, 'f', now, { backpack: true, selected: sel.phase === 'choose' && sel.selected === 1 });
    } else {
      const chosen = CHARACTERS[sel.selected];
      const pos = sel.selected === 0 ? a : b;
      drawResident(pos.x, pos.y - 12, chosen.gender, now, { backpack: true });
    }

    const margin = clampNum(v.width * 0.025, 12, 24);
    const panelY = v.bottom - margin - 92;

    if (sel.phase === 'choose') {
      const w = Math.min(372, v.width - margin * 2);
      const x = v.cx - w / 2;
      panel(x, panelY + 10, w, 82);
      text('¿QUIÉN VIVE ACÁ?', v.cx, panelY + 26, 18, '#edf2ed', 'center');
      text(sel.selected === 0 ? '◀  NICO     VERA' : 'NICO     VERA  ▶', v.cx, panelY + 57, 14, '#aeb9b0', 'center');
    } else if (sel.phase === 'confirm') {
      const w = Math.min(304, v.width - margin * 2);
      const x = v.cx - w / 2;
      panel(x, panelY, w, 92);
      text('¿ESTE SOS VOS?', v.cx, panelY + 15, 18, '#edf2ed', 'center');
      text(sel.confirm === 0 ? '▶ SÍ     NO' : 'SÍ     ▶ NO', v.cx, panelY + 52, 15, '#bec8c0', 'center');
    } else if (sel.phase === 'glitch') {
      if (d < 520) {
        for (let i = 0; i < 18; i++) {
          const y = v.top + Math.random() * v.height;
          rect(v.left + Math.random() * v.width, y, 40 + Math.random() * 180, 2 + Math.random() * 5, i % 2 ? '#dfe7df' : '#202422');
        }
      }
      if (d > 300 && d < 1100) {
        const w = Math.min(274, v.width - margin * 2);
        const x = v.cx - w / 2;
        panel(x, v.bottom - margin - 58, w, 58);
        text('RESIDENTE AUTORIZADO.', v.cx, v.bottom - margin - 39, 15, '#dce7dd', 'center');
      }
      if (d > 1150) {
        sel.phase = 'name';
        residentName.value = CHARACTERS[sel.selected].name;
        nameEntry.classList.remove('hidden');
        setTimeout(() => residentName.focus(), 0);
      }
    } else if (sel.phase === 'registered') {
      const rd = now - sel.registeredAt;
      const w = Math.min(332, v.width - margin * 2);
      const x = v.cx - w / 2;
      const y = v.bottom - margin - 70;
      panel(x, y, w, 70);
      text('REGISTRO ACTUALIZADO.', v.cx, y + 15, 15, '#dce7dd', 'center');
      if (rd > 650 && rd < 1030) text('ESTE REGISTRO SIEMPRE FUE ASÍ.', v.cx, y + 44, 12, '#7d887f', 'center');
      if (rd > 1450) startWorld();
    }
  };
})();
