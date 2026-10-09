(function () {
  'use strict';

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  document.querySelectorAll('[data-social-ending]').forEach(function (section) {
    var page = section.querySelector('.social-page');
    var wordmark = section.querySelector('[data-social-wordmark]');
    var base = wordmark && wordmark.querySelector('.social-wordmark-base');
    var credit = section.querySelector('[data-social-credit]');
    if (!page || !wordmark || !base || section.dataset.socialEndingInitialized === 'true') return;
    section.dataset.socialEndingInitialized = 'true';
    var measureFrame = 0;
    var pointerFrame = 0;
    var pointer = null;
    var touchPointer = null;

    function measure() {
      measureFrame = 0;
      var bounds = page.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      var textWidth = parseFloat(getComputedStyle(base).width);
      var targetWidth = wordmark.getBoundingClientRect().width;
      var currentSize = parseFloat(getComputedStyle(wordmark).fontSize);
      if (textWidth > 0 && targetWidth > 0 && currentSize > 0) {
        var fullWidthSize = currentSize * targetWidth / textWidth;
        var fittedSize = Math.min(fullWidthSize * 1.24, bounds.height * .32);
        wordmark.style.fontSize = fittedSize.toFixed(2) + 'px';
        wordmark.style.setProperty('--social-wordmark-stretch', (fullWidthSize / fittedSize).toFixed(4));
        section.style.setProperty('--social-wordmark-font', fittedSize.toFixed(2) + 'px');
      }
      if (credit) {
        var maxSize = parseFloat(getComputedStyle(section).getPropertyValue('--social-credit-max')) || 13;
        credit.style.fontSize = maxSize + 'px';
        if (credit.scrollWidth > credit.clientWidth) {
          credit.style.fontSize = (maxSize * credit.clientWidth / credit.scrollWidth * .98).toFixed(2) + 'px';
        }
      }
    }

    function requestMeasure() {
      if (!measureFrame) measureFrame = requestAnimationFrame(measure);
    }
    requestMeasure();
    if ('ResizeObserver' in window) new ResizeObserver(requestMeasure).observe(page);
    else window.addEventListener('resize', requestMeasure, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestMeasure);

    function renderPointer() {
      pointerFrame = 0;
      if (!pointer) return;
      var bounds = wordmark.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      var x = clamp((pointer.x - bounds.left) / bounds.width, 0, 1) * 100;
      var y = clamp((pointer.y - bounds.top) / bounds.height, 0, 1) * 100;
      wordmark.style.setProperty('--social-light-x', x.toFixed(2) + '%');
      wordmark.style.setProperty('--social-light-y', y.toFixed(2) + '%');
      wordmark.style.setProperty('--social-ink-x', (20 + x * .6).toFixed(2) + '%');
      wordmark.style.setProperty('--social-sheen-opacity', '1');
    }

    function updatePointer(event) {
      pointer = { x: event.clientX, y: event.clientY };
      if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
    }

    function leave() {
      pointer = null;
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      wordmark.style.setProperty('--social-sheen-opacity', '0');
    }

    function releasePointer(event) {
      if (event && touchPointer !== event.pointerId) return;
      var captured = touchPointer;
      touchPointer = null;
      if (captured !== null && wordmark.hasPointerCapture && wordmark.hasPointerCapture(captured)) wordmark.releasePointerCapture(captured);
      leave();
    }

    wordmark.addEventListener('pointerenter', function (event) { if (event.pointerType === 'mouse' || event.pointerType === 'pen') updatePointer(event); });
    wordmark.addEventListener('pointermove', function (event) { if (event.pointerType === 'mouse' || event.pointerType === 'pen' || touchPointer === event.pointerId) updatePointer(event); });
    wordmark.addEventListener('pointerleave', function () { if (touchPointer === null) leave(); });
    wordmark.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'touch') {
        touchPointer = event.pointerId;
        wordmark.setPointerCapture(event.pointerId);
      }
      updatePointer(event);
    });
    wordmark.addEventListener('pointerup', releasePointer);
    wordmark.addEventListener('pointercancel', releasePointer);
    wordmark.addEventListener('lostpointercapture', function () { touchPointer = null; leave(); });
    window.addEventListener('blur', function () { releasePointer(); });
    document.addEventListener('debuginn:themechange', requestMeasure);
  });
})();
