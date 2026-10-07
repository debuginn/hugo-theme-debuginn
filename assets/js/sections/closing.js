(function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  document.querySelectorAll('[data-closing-section]').forEach(function (section) {
    if (section.dataset.closingInitialized === 'true') return;
    section.dataset.closingInitialized = 'true';

    var page = section.querySelector('.closing-page');
    var focus = section.querySelector('[data-closing-focus]');
    var items = Array.from(section.querySelectorAll('[data-closing-item]'));
    var wordmark = section.querySelector('[data-closing-wordmark]');
    var base = wordmark && wordmark.querySelector('.closing-wordmark-base');
    var measureFrame = 0;
    var pointerFrame = 0;
    var pendingPointer = null;
    var active = false;
    var touchPointer = null;
    var lensFrame = 0;
    var lensPointer = null;
    var itemMetrics = [];
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!page) return;

    function measure() {
      measureFrame = 0;
      var bounds = page.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      if (wordmark && base) {
        var textWidth = parseFloat(window.getComputedStyle(base).width);
        var targetWidth = wordmark.getBoundingClientRect().width;
        var currentSize = parseFloat(window.getComputedStyle(wordmark).fontSize);
        if (textWidth > 0 && targetWidth > 0 && currentSize > 0) {
          var fullWidthSize = currentSize * targetWidth / textWidth;
          var fittedSize = Math.min(fullWidthSize, bounds.height * 0.32);
          wordmark.style.fontSize = fittedSize.toFixed(2) + 'px';
          wordmark.style.setProperty('--closing-wordmark-stretch', (fullWidthSize / fittedSize).toFixed(4));
          page.style.setProperty('--closing-wordmark-font', fittedSize.toFixed(2) + 'px');
        }
      }

      if (!focus) return;
      var focusBounds = focus.getBoundingClientRect();
      var focusX = focusBounds.left + focusBounds.width / 2;
      var focusY = focusBounds.top + focusBounds.height / 2;

      itemMetrics = items.map(function (item) {
        var itemBounds = item.getBoundingClientRect();
        var dx = itemBounds.left + itemBounds.width / 2 - focusX;
        var dy = itemBounds.top + itemBounds.height / 2 - focusY;
        var distance = Math.hypot(dx, dy) / Math.hypot(bounds.width, bounds.height);
        // Photos and logos share one focal plane centred on the contact button.
        var depth = clamp((distance - 0.055) / 0.4, 0, 1);
        var blur = Math.pow(depth, 1.15) * 2.4;
        var rotation = parseFloat(window.getComputedStyle(item).getPropertyValue('--closing-rotation')) || 0;
        item.style.setProperty('--closing-blur', blur.toFixed(2) + 'px');
        item.style.setProperty('--closing-lens-scale', '1');
        return {
          item: item,
          x: itemBounds.left + itemBounds.width / 2 - bounds.left,
          y: itemBounds.top + itemBounds.height / 2 - bounds.top,
          width: item.offsetWidth,
          height: item.offsetHeight,
          cosine: Math.cos(rotation * Math.PI / 180),
          sine: Math.sin(rotation * Math.PI / 180),
          blur: blur
        };
      });
      if (lensPointer) requestLens();
    }

    function requestMeasure() {
      if (!measureFrame) measureFrame = window.requestAnimationFrame(measure);
    }

    requestMeasure();
    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(requestMeasure);
      observer.observe(page);
      if (focus) observer.observe(focus);
    } else {
      window.addEventListener('resize', requestMeasure, { passive: true });
    }

    items.forEach(function (item) {
      var image = item.querySelector('img');
      if (image && !image.complete) image.addEventListener('load', requestMeasure, { once: true });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestMeasure);

    function renderLens() {
      lensFrame = 0;
      if (!lensPointer) return;
      var bounds = page.getBoundingClientRect();
      var x = lensPointer.x - bounds.left;
      var y = lensPointer.y - bounds.top;
      if (!bounds.width || !bounds.height || x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
        clearLens();
        return;
      }
      var outerRadius = clamp(Math.min(bounds.width, bounds.height) * 0.22, 140, 200);
      var innerRadius = 30;

      itemMetrics.forEach(function (metric) {
        var dx = x - metric.x;
        var dy = y - metric.y;
        // Measure against the original rotated tile, never its enlarged bounds.
        var localX = dx * metric.cosine + dy * metric.sine;
        var localY = -dx * metric.sine + dy * metric.cosine;
        var edgeX = Math.max(Math.abs(localX) - metric.width / 2, 0);
        var edgeY = Math.max(Math.abs(localY) - metric.height / 2, 0);
        var edgeDistance = Math.hypot(edgeX, edgeY);
        var distance = clamp((edgeDistance - innerRadius) / (outerRadius - innerRadius), 0, 1);
        var strength = 1 - distance * distance * (3 - 2 * distance);
        var scale = reducedMotion && reducedMotion.matches ? 1 : 1 + strength * 0.1;
        metric.item.style.setProperty('--closing-blur', (metric.blur * (1 - strength)).toFixed(2) + 'px');
        metric.item.style.setProperty('--closing-lens-scale', scale.toFixed(4));
      });
    }

    function requestLens() {
      if (lensPointer && !lensFrame) lensFrame = window.requestAnimationFrame(renderLens);
    }

    function clearLens() {
      lensPointer = null;
      if (lensFrame) window.cancelAnimationFrame(lensFrame);
      lensFrame = 0;
      itemMetrics.forEach(function (metric) {
        metric.item.style.setProperty('--closing-blur', metric.blur.toFixed(2) + 'px');
        metric.item.style.setProperty('--closing-lens-scale', '1');
      });
    }

    function trackLens(event) {
      if ((event.pointerType === 'mouse' || event.pointerType === 'pen') && !event.buttons) {
        lensPointer = { x: event.clientX, y: event.clientY };
        requestLens();
      } else {
        clearLens();
      }
    }

    page.addEventListener('pointerenter', trackLens, { passive: true });
    page.addEventListener('pointermove', trackLens, { passive: true });
    page.addEventListener('pointerdown', clearLens, { passive: true });
    page.addEventListener('pointerup', trackLens, { passive: true });
    page.addEventListener('pointerleave', clearLens, { passive: true });
    page.addEventListener('pointercancel', clearLens, { passive: true });
    window.addEventListener('blur', clearLens);
    window.addEventListener('scroll', requestLens, { passive: true, capture: true });
    if (reducedMotion) {
      if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', requestLens);
      else if (reducedMotion.addListener) reducedMotion.addListener(requestLens);
    }

    if (!wordmark) return;

    function renderPointer() {
      pointerFrame = 0;
      if (!active || !pendingPointer) return;
      var bounds = wordmark.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      var x = clamp((pendingPointer.x - bounds.left) / bounds.width, 0, 1) * 100;
      var y = clamp((pendingPointer.y - bounds.top) / bounds.height, 0, 1) * 100;
      wordmark.style.setProperty('--closing-light-x', x.toFixed(2) + '%');
      wordmark.style.setProperty('--closing-light-y', y.toFixed(2) + '%');
      wordmark.style.setProperty('--closing-ink-x', (20 + x * 0.6).toFixed(2) + '%');
      wordmark.style.setProperty('--closing-sheen-opacity', '0.94');
    }

    function updatePointer(event) {
      active = true;
      pendingPointer = { x: event.clientX, y: event.clientY };
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(renderPointer);
    }

    function leave() {
      active = false;
      pendingPointer = null;
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      wordmark.style.setProperty('--closing-sheen-opacity', '0');
    }

    function releasePointer(event) {
      if (event && touchPointer !== event.pointerId) return;
      var pointer = touchPointer;
      touchPointer = null;
      if (pointer !== null && wordmark.hasPointerCapture && wordmark.hasPointerCapture(pointer)) {
        wordmark.releasePointerCapture(pointer);
      }
      leave();
    }

    wordmark.addEventListener('pointerenter', function (event) {
      if (event.pointerType === 'mouse') updatePointer(event);
    });
    wordmark.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'mouse' || touchPointer === event.pointerId) updatePointer(event);
    });
    wordmark.addEventListener('pointerleave', function () {
      if (touchPointer === null) leave();
    });
    wordmark.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse') {
        touchPointer = event.pointerId;
        if (wordmark.setPointerCapture) wordmark.setPointerCapture(event.pointerId);
      }
      updatePointer(event);
    });
    wordmark.addEventListener('pointerup', releasePointer);
    wordmark.addEventListener('pointercancel', releasePointer);
    wordmark.addEventListener('lostpointercapture', function () {
      touchPointer = null;
      leave();
    });
    window.addEventListener('blur', function () {
      releasePointer();
    });
  });
})();
