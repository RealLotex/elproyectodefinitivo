// Responsive HiDPI presentation layer.
// 854x480 remains only the logical design coordinate system.
// The real canvas backing store always matches the available screen area * devicePixelRatio.

(() => {
  const DESIGN_W = 854;
  const DESIGN_H = 480;
  const stage = document.getElementById('stage');
  if (!stage || !canvas || !ctx) return;

  function resizeCanvas() {
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const dpr = window.devicePixelRatio || 1;
    const physicalW = Math.max(1, Math.round(bounds.width * dpr));
    const physicalH = Math.max(1, Math.round(bounds.height * dpr));

    if (canvas.width !== physicalW || canvas.height !== physicalH) {
      canvas.width = physicalW;
      canvas.height = physicalH;
    }

    // Existing world code keeps using the 854x480 design space, while the
    // browser rasterizes it directly into the device's full-resolution buffer.
    ctx.setTransform(physicalW / DESIGN_W, 0, 0, physicalH / DESIGN_H, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    window.RENDER_METRICS = Object.freeze({
      designWidth: DESIGN_W,
      designHeight: DESIGN_H,
      cssWidth: bounds.width,
      cssHeight: bounds.height,
      physicalWidth: physicalW,
      physicalHeight: physicalH,
      dpr
    });
  }

  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(stage);
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 50), { passive: true });
  resizeCanvas();
})();
