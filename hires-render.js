// Responsive HiDPI presentation layer.
// 854x480 is the logical world coordinate system only.
// The stage is always filled using a single uniform scale (cover), so the game
// is never stretched. Any excess is cropped symmetrically.

(() => {
  const DESIGN_W = 854;
  const DESIGN_H = 480;
  const stage = document.getElementById('stage');
  if (!stage || !canvas || !ctx) return;

  function resizeCanvas() {
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const physicalW = Math.max(1, Math.round(bounds.width * dpr));
    const physicalH = Math.max(1, Math.round(bounds.height * dpr));

    if (canvas.width !== physicalW || canvas.height !== physicalH) {
      canvas.width = physicalW;
      canvas.height = physicalH;
    }

    // COVER, never stretch: one scale for both axes.
    const scale = Math.max(physicalW / DESIGN_W, physicalH / DESIGN_H);
    const renderedW = DESIGN_W * scale;
    const renderedH = DESIGN_H * scale;
    const offsetX = (physicalW - renderedW) / 2;
    const offsetY = (physicalH - renderedH) / 2;

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Logical coordinates that are actually visible after the crop.
    const left = -offsetX / scale;
    const top = -offsetY / scale;
    const visibleWidth = physicalW / scale;
    const visibleHeight = physicalH / scale;

    window.RENDER_METRICS = {
      designWidth: DESIGN_W,
      designHeight: DESIGN_H,
      cssWidth: bounds.width,
      cssHeight: bounds.height,
      physicalWidth: physicalW,
      physicalHeight: physicalH,
      dpr,
      scale,
      offsetX,
      offsetY,
      visibleRect: {
        left,
        top,
        right: left + visibleWidth,
        bottom: top + visibleHeight,
        width: visibleWidth,
        height: visibleHeight,
        cx: left + visibleWidth / 2,
        cy: top + visibleHeight / 2
      }
    };
  }

  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(stage);
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 50), { passive: true });
  resizeCanvas();
})();
