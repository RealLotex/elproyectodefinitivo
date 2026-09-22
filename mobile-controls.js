(() => {
  const controls = document.getElementById('mobileControls');
  if (!controls) return;

  const dispatch = (type, key) => {
    document.dispatchEvent(new KeyboardEvent(type, {
      key,
      bubbles: true,
      cancelable: true
    }));
  };

  const vibrate = (ms = 9) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  function bindHold(button, key) {
    let down = false;

    const press = (event) => {
      event.preventDefault();
      if (down) return;
      down = true;
      button.classList.add('pressed');
      button.setPointerCapture?.(event.pointerId);
      dispatch('keydown', key);
      vibrate();
    };

    const release = (event) => {
      event.preventDefault();
      if (!down) return;
      down = false;
      button.classList.remove('pressed');
      dispatch('keyup', key);
    };

    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }

  function bindTap(button, key) {
    const press = (event) => {
      event.preventDefault();
      button.classList.add('pressed');
      vibrate();

      // START confirms the name-entry form as well as behaving like Enter.
      if (key === 'Enter' && !document.getElementById('nameEntry')?.classList.contains('hidden')) {
        document.getElementById('nameEntry')?.requestSubmit();
        return;
      }

      dispatch('keydown', key);
    };

    const release = (event) => {
      event.preventDefault();
      button.classList.remove('pressed');
      dispatch('keyup', key);
    };

    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }

  controls.querySelectorAll('[data-hold]').forEach(button => {
    bindHold(button, button.dataset.hold);
  });

  controls.querySelectorAll('[data-key]').forEach(button => {
    bindTap(button, button.dataset.key);
  });
})();