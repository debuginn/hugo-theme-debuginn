(function () {
  'use strict';

  var response = 0.35;
  var frequency = 2 * Math.PI / response;
  var closedScale = 0.72;

  function axis(value) {
    return { value: value, velocity: 0 };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(value) {
    var progress = clamp(value, 0, 1);
    return progress * progress * (3 - 2 * progress);
  }

  function spring(value, target, delta, tolerance, velocityTolerance) {
    if (Math.abs(value.value - target) < tolerance && Math.abs(value.velocity) < velocityTolerance) {
      value.value = target;
      value.velocity = 0;
      return true;
    }
    // Exact critically damped motion preserves position and velocity on reversal.
    var distance = value.value - target;
    var momentum = value.velocity + frequency * distance;
    var decay = Math.exp(-frequency * delta);
    value.value = target + (distance + momentum * delta) * decay;
    value.velocity = (value.velocity - frequency * momentum * delta) * decay;
    return false;
  }

  function initialize() {
    document.querySelectorAll('[data-closing-section]').forEach(function (section) {
      var hub = section.querySelector('[data-closing-contact-hub]');
      if (!hub || hub.dataset.closingContactInitialized === 'true') return;
      var trigger = hub.querySelector('.hub-trigger');
      var options = hub.querySelector('[data-closing-contact-options]');
      var hint = hub.querySelector('.hub-hint');
      if (!trigger || !options) return;
      hub.dataset.closingContactInitialized = 'true';

      var nodes = Array.from(options.querySelectorAll('.contact-node')).map(function (element, index) {
        return {
          element: element,
          index: index,
          originalTabindex: element.getAttribute('tabindex') === '-1' ? '0' : element.getAttribute('tabindex'),
          offsetX: 0,
          offsetY: 0,
          revealAt: 0,
          x: axis(0),
          y: axis(0),
          scale: axis(closedScale),
          opacity: axis(0)
        };
      });
      var hoverHint = hint && (hint.getAttribute('data-closed-hint') || hint.textContent.trim()) || '移至 Logo';
      var touchHint = hint && hint.getAttribute('data-touch-hint') || '轻触 Logo';
      var openHint = hint && hint.getAttribute('data-open-hint') || '联系我';
      var hintOpacity = axis(1);
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      var hoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
      var expanded = false;
      var sectionVisible = true;
      var pointerPressed = false;
      var lastPointerType = '';
      var hoverActive = false;
      var frame = 0;
      var lastFrame = 0;
      var dialogs = Array.from(section.querySelectorAll('[data-closing-dialog]'));

      function closedHint() {
        return lastPointerType === 'touch' || (!hoverInput.matches && lastPointerType !== 'mouse' && lastPointerType !== 'pen') ? touchHint : hoverHint;
      }

      function showCue() {
        if (hub.dataset.contactCueShown === 'true') return;
        hub.dataset.contactCueShown = 'true';
        hub.classList.add('has-contact-cue');
      }

      function readOffsets() {
        var count = nodes.length;
        options.dataset.contactCount = String(count);
        var radius = parseFloat(window.getComputedStyle(hub).getPropertyValue('--contact-radius')) || 142;
        radius *= count === 1 ? 0.86 : count === 3 ? 1.06 : count >= 4 ? 1.15 : 1;
        var spread = count === 1 ? 0 : count === 2 ? 28 : count === 3 ? 48 : 60;
        var bridgeWidth = 0;
        var bridgeHeight = 0;
        nodes.forEach(function (node, index) {
          var angle = (count === 1 ? 0 : -spread + index * spread * 2 / (count - 1)) * Math.PI / 180;
          node.offsetX = Math.sin(angle) * radius;
          node.offsetY = -Math.cos(angle) * radius;
          node.element.style.setProperty('--dx', node.offsetX.toFixed(2) + 'px');
          node.element.style.setProperty('--dy', node.offsetY.toFixed(2) + 'px');
          bridgeWidth = Math.max(bridgeWidth, Math.abs(node.offsetX) + node.element.offsetWidth / 2 + 18);
          bridgeHeight = Math.max(bridgeHeight, Math.abs(node.offsetY) + node.element.offsetHeight / 2 + 36);
        });
        hub.style.setProperty('--contact-bridge-width', (bridgeWidth * 2).toFixed(2) + 'px');
        hub.style.setProperty('--contact-bridge-height', bridgeHeight.toFixed(2) + 'px');
      }

      function semantics() {
        trigger.setAttribute('aria-expanded', String(expanded));
        trigger.setAttribute('aria-label', expanded ? '收起联系方式' : '展开联系方式');
        if (options.id) trigger.setAttribute('aria-controls', options.id);
        options.inert = !expanded;
        options.setAttribute('aria-hidden', String(!expanded));
        hub.classList.toggle('is-open', expanded);
        hub.dataset.expanded = String(expanded);
        nodes.forEach(function (node) {
          if (expanded) {
            if (node.originalTabindex === null) node.element.removeAttribute('tabindex');
            else node.element.setAttribute('tabindex', node.originalTabindex);
          } else {
            node.element.setAttribute('tabindex', '-1');
          }
          node.element.style.pointerEvents = expanded ? 'auto' : 'none';
        });
      }

      function render() {
        nodes.forEach(function (node) {
          node.element.style.transform = 'translate(calc(-50% + ' + node.x.value.toFixed(3) + 'px), calc(-50% + ' + node.y.value.toFixed(3) + 'px)) scale(' + clamp(node.scale.value, closedScale, 1.01).toFixed(4) + ')';
          node.element.style.opacity = clamp(node.opacity.value, 0, 1).toFixed(4);
        });
        if (hint) hint.style.opacity = clamp(hintOpacity.value, 0, 1).toFixed(4);
      }

      function snap() {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        lastFrame = 0;
        nodes.forEach(function (node) {
          node.x.value = expanded ? node.offsetX : 0;
          node.y.value = expanded ? node.offsetY : 0;
          node.scale.value = expanded ? 1 : closedScale;
          node.opacity.value = expanded ? 1 : 0;
          node.x.velocity = node.y.velocity = node.scale.velocity = node.opacity.velocity = 0;
        });
        hintOpacity.value = 1;
        hintOpacity.velocity = 0;
        if (hint) hint.textContent = expanded ? openHint : closedHint();
        render();
      }

      function animate(now) {
        frame = 0;
        var delta = lastFrame ? clamp((now - lastFrame) / 1000, 0.001, 0.05) : 1 / 60;
        lastFrame = now;
        var settled = true;
        var waiting = false;

        nodes.forEach(function (node) {
          var delayed = expanded && now < node.revealAt;
          var visible = expanded && !delayed;
          waiting = waiting || delayed;
          var xSettled = spring(node.x, visible ? node.offsetX : 0, delta, 0.08, 0.35);
          var ySettled = spring(node.y, visible ? node.offsetY : 0, delta, 0.08, 0.35);
          var scaleSettled = spring(node.scale, visible ? 1 : closedScale, delta, 0.001, 0.015);
          var opacitySettled = spring(node.opacity, visible ? 1 : 0, delta, 0.002, 0.02);
          settled = settled && xSettled && ySettled && scaleSettled && opacitySettled;
        });

        if (hint) {
          var caption = expanded ? openHint : closedHint();
          var captionChanged = hint.textContent !== caption;
          var progress = nodes.length ? nodes.reduce(function (sum, node) { return sum + clamp(node.opacity.value, 0, 1); }, 0) / nodes.length : Number(expanded);
          var hintTarget = captionChanged ? 0 : expanded ? smoothstep((progress - 0.6) / 0.35) : smoothstep((0.35 - progress) / 0.35);
          var hintSettled = spring(hintOpacity, hintTarget, delta, 0.002, 0.02);
          if (captionChanged && hintOpacity.value < 0.04) {
            hint.textContent = caption;
            hintSettled = false;
          }
          settled = settled && hintSettled;
        }

        render();
        if (!settled || waiting) frame = window.requestAnimationFrame(animate);
        else lastFrame = 0;
      }

      function start() {
        if (reducedMotion.matches) snap();
        else if (!frame) frame = window.requestAnimationFrame(animate);
      }

      function setExpanded(next, restoreFocus) {
        if (next === expanded) return;
        if (!next && (restoreFocus || options.contains(document.activeElement))) {
          if (sectionVisible) trigger.focus({ preventScroll: true });
          else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        }
        expanded = next;
        if (!expanded) hoverActive = false;
        readOffsets();
        var now = performance.now();
        nodes.forEach(function (node) {
          var startsClosed = node.opacity.value < 0.005 && Math.abs(node.opacity.velocity) < 0.02;
          node.revealAt = expanded && startsClosed ? now + node.index * 30 : now;
        });
        semantics();
        start();
      }

      trigger.addEventListener('pointerenter', function (event) {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        lastPointerType = event.pointerType;
        hoverActive = true;
        setExpanded(true, false);
      });
      trigger.addEventListener('pointerdown', function (event) {
        pointerPressed = true;
        lastPointerType = event.pointerType;
      });
      trigger.addEventListener('pointerup', function () { pointerPressed = false; });
      trigger.addEventListener('pointercancel', function () { pointerPressed = false; });
      trigger.addEventListener('focus', function () {
        if (pointerPressed) return;
        var keyboardFocus = true;
        try { keyboardFocus = trigger.matches(':focus-visible'); } catch (_) {}
        if (keyboardFocus) setExpanded(true, false);
      });
      trigger.addEventListener('click', function (event) {
        if (event.detail === 0) setExpanded(true, false);
        else if (lastPointerType === 'touch' || !hoverInput.matches) setExpanded(!expanded, false);
      });
      hub.addEventListener('pointerleave', function (event) {
        if (!hoverActive || event.pointerType === 'touch' || section.querySelector('dialog[open]')) return;
        setExpanded(false, false);
      });
      hub.addEventListener('focusout', function () {
        Promise.resolve().then(function () {
          if (hub.contains(document.activeElement) || section.querySelector('dialog[open]') || (hoverActive && hub.matches(':hover'))) return;
          setExpanded(false, false);
        });
      });
      section.addEventListener('pointermove', function (event) {
        if (!expanded || !hoverActive || event.pointerType === 'touch' || hub.contains(event.target) || section.querySelector('dialog[open]')) return;
        setExpanded(false, false);
      });
      section.addEventListener('click', function (event) {
        if (!expanded || trigger.contains(event.target)) return;
        if (section.querySelector('dialog[open]')) return;
        if (nodes.some(function (node) { return node.element.contains(event.target); })) return;
        setExpanded(false, false);
      });
      section.addEventListener('keydown', function (event) {
        if (expanded && event.key === 'Escape' && !event.defaultPrevented) {
          if (section.querySelector('dialog[open]')) return;
          event.preventDefault();
          setExpanded(false, true);
        }
      });

      dialogs.forEach(function (dialog) {
        var invoker = null;
        function returnFocus() {
          if (sectionVisible && expanded && invoker) invoker.focus({ preventScroll: true });
          invoker = null;
        }
        function closeDialog() {
          if (typeof dialog.close === 'function') dialog.close();
          else {
            dialog.removeAttribute('open');
            returnFocus();
          }
        }
        section.querySelectorAll('[data-closing-dialog-open]').forEach(function (button) {
          if (button.getAttribute('data-closing-dialog-open') !== dialog.id) return;
          button.addEventListener('click', function () {
            if (dialog.hasAttribute('open')) return;
            invoker = button;
            if (typeof dialog.showModal === 'function') dialog.showModal();
            else dialog.setAttribute('open', '');
          });
        });
        var closeButton = dialog.querySelector('[data-closing-dialog-close]');
        if (closeButton) closeButton.addEventListener('click', closeDialog);
        dialog.addEventListener('close', returnFocus);
        dialog.addEventListener('click', function (event) {
          event.stopPropagation();
          if (event.target !== dialog) return;
          var bounds = dialog.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
        });
        dialog.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && typeof dialog.showModal !== 'function') {
            event.preventDefault();
            closeDialog();
          }
        });
      });

      if ('IntersectionObserver' in window) {
        var stack = section.closest('[data-debuginn-site]');
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            sectionVisible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
            if (sectionVisible) { showCue(); return; }
            setExpanded(false, false);
            dialogs.forEach(function (dialog) {
              if (dialog.hasAttribute('open') && typeof dialog.close === 'function') dialog.close();
              else dialog.removeAttribute('open');
            });
            snap();
          });
        }, { root: stack || null, threshold: [0, 0.2, 0.5] }).observe(section);
      } else showCue();

      function resize() {
        readOffsets();
        if (expanded) start();
      }
      window.addEventListener('resize', resize, { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hub);
      if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', start);
      else reducedMotion.addListener(start);
      if (hoverInput.addEventListener) hoverInput.addEventListener('change', start);
      else hoverInput.addListener(start);

      readOffsets();
      semantics();
      if (hint) hint.textContent = closedHint();
      render();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
