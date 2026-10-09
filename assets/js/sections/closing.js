(function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function photoKey(source) {
    try {
      return new URL(source, document.baseURI).href;
    } catch (_) {
      return source;
    }
  }

  function randomizePhotos(section, items, onChange) {
    var raw = section.getAttribute('data-closing-photo-pool');
    var pool = [];
    try {
      var parsed = raw && JSON.parse(raw);
      if (Array.isArray(parsed)) pool = parsed;
    } catch (_) {
      // Invalid pools still use the configured photos, without duplicates.
    }

    var seen = new Set();
    function uniqueSource(source) {
      if (typeof source !== 'string' || !source.trim()) return null;
      var value = source.trim();
      var key = photoKey(value);
      if (seen.has(key)) return null;
      seen.add(key);
      return { src: value, key: key };
    }

    var sources = pool.map(uniqueSource).filter(Boolean);

    for (var index = sources.length - 1; index > 0; index -= 1) {
      var target = Math.floor(Math.random() * (index + 1));
      var swapped = sources[index];
      sources[index] = sources[target];
      sources[target] = swapped;
    }

    var photos = items.filter(function (item) {
      return item.classList.contains('closing-item--photo');
    }).map(function (item) {
      return { item: item, image: item.querySelector('img'), assignment: null, cleanup: null };
    }).filter(function (photo) { return photo.image; });
    photos.forEach(function (photo) {
      var fallback = uniqueSource(photo.image.getAttribute('src'));
      if (fallback) sources.push(fallback);
    });

    var cursor = 0;
    var attempted = new Set();
    var failed = new Set();
    var reserved = new Map();

    function reserveSource() {
      while (cursor < sources.length) {
        var source = sources[cursor];
        cursor += 1;
        if (attempted.has(source.key) || failed.has(source.key) || reserved.has(source.key)) continue;
        var assignment = { src: source.src, key: source.key };
        attempted.add(source.key);
        reserved.set(source.key, assignment);
        return assignment;
      }
      return null;
    }

    function activate(photo, assignment) {
      if (photo.cleanup) photo.cleanup();
      photo.cleanup = null;
      photo.assignment = assignment;
      photo.item.hidden = !assignment;
      if (!assignment) {
        photo.item.style.setProperty('--closing-lens-scale', '1');
        onChange();
        return;
      }

      var image = photo.image;
      function checkFailure() {
        if (photo.assignment !== assignment || photoKey(image.getAttribute('src')) !== assignment.key) return;
        // A stale error for the previous src must not reject a pending or loaded image.
        if (!image.complete || image.naturalWidth > 0) return;
        failed.add(assignment.key);
        if (reserved.get(assignment.key) === assignment) reserved.delete(assignment.key);
        activate(photo, reserveSource());
      }
      function queueFailureCheck() {
        Promise.resolve().then(checkFailure);
      }

      image.addEventListener('error', queueFailureCheck);
      photo.cleanup = function () { image.removeEventListener('error', queueFailureCheck); };
      if (photoKey(image.getAttribute('src')) !== assignment.key) image.setAttribute('src', assignment.src);
      // Covers already-cached failures while preserving native lazy loading.
      queueFailureCheck();
      onChange();
    }

    // Reserve every initial slot before any cached load/error can replace a source.
    photos.forEach(function (photo) { photo.assignment = reserveSource(); });
    photos.forEach(function (photo) { activate(photo, photo.assignment); });
  }

  document.querySelectorAll('[data-closing-section]').forEach(function (section) {
    if (section.dataset.closingInitialized === 'true') return;
    section.dataset.closingInitialized = 'true';

    var page = section.querySelector('.closing-page');
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
    randomizePhotos(section, items, requestMeasure);

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

      itemMetrics = items.filter(function (item) {
        return !item.hidden && item.offsetWidth > 0 && item.offsetHeight > 0;
      }).map(function (item) {
        var itemBounds = item.getBoundingClientRect();
        var rotation = parseFloat(window.getComputedStyle(item).getPropertyValue('--closing-rotation')) || 0;
        item.style.setProperty('--closing-lens-scale', '1');
        return {
          item: item,
          x: itemBounds.left + itemBounds.width / 2 - bounds.left,
          y: itemBounds.top + itemBounds.height / 2 - bounds.top,
          width: item.offsetWidth,
          height: item.offsetHeight,
          cosine: Math.cos(rotation * Math.PI / 180),
          sine: Math.sin(rotation * Math.PI / 180)
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
    } else {
      window.addEventListener('resize', requestMeasure, { passive: true });
    }

    items.forEach(function (item) {
      var image = item.querySelector('img');
      if (image) image.addEventListener('load', requestMeasure);
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
        if (metric.item.hidden || !metric.width || !metric.height) return;
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
      wordmark.style.setProperty('--closing-sheen-opacity', '1');
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
