(function () {
  var rail = document.querySelector("[data-section-rail]");
  var filterImage = document.querySelector("#profile-liquid-glass feImage");
  var displace = document.querySelector("#profile-liquid-glass feDisplacementMap");
  if (!rail || !filterImage || !displace) return;

  var SCALE = 72;
  var PAD = 36;
  var mapKey = "";

  function roundedRectSDF(px, py, w, h, r) {
    var x = Math.abs(px - w / 2) - (w / 2 - r);
    var y = Math.abs(py - h / 2) - (h / 2 - r);
    return Math.min(Math.max(x, y), 0) + Math.hypot(Math.max(x, 0), Math.max(y, 0)) - r;
  }

  function outwardNormal(px, py, w, h, r) {
    var e = 1.25;
    var dx = roundedRectSDF(px + e, py, w, h, r) - roundedRectSDF(px - e, py, w, h, r);
    var dy = roundedRectSDF(px, py + e, w, h, r) - roundedRectSDF(px, py - e, w, h, r);
    var len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function encode(shift) {
    return Math.max(0, Math.min(255, Math.round((shift / SCALE + 0.5) * 255)));
  }

  function buildMap(w, h, pad) {
    var innerW = w - pad * 2;
    var innerH = h - pad * 2;
    var radius = Math.min(innerH / 2, 31);
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    var image = ctx.createImageData(w, h);
    var data = image.data;
    var bevel = Math.max(12, innerH * 0.30);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var px = x + 0.5 - pad;
        var py = y + 0.5 - pad;
        var sdf = roundedRectSDF(px, py, innerW, innerH, radius);
        var shiftX = 0;
        var shiftY = 0;
        if (sdf < bevel) {
          var depth = Math.max(0, -sdf);
          var edge = Math.pow(Math.max(0, 1 - depth / bevel), 1.2);
          var normal = outwardNormal(px, py, innerW, innerH, radius);
          var mag = edge * 12;
          shiftX = -normal.x * mag;
          shiftY = -normal.y * mag;
        }
        var i = (y * w + x) * 4;
        data[i] = encode(shiftX);
        data[i + 1] = encode(shiftY);
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  }

  function ensureLens() {
    var lens = rail.querySelector(".section-rail-lens");
    if (lens) return lens;
    lens = document.createElement("span");
    lens.className = "section-rail-lens";
    lens.setAttribute("aria-hidden", "true");
    lens.innerHTML = '<span class="section-rail-lens-scene"></span>';
    rail.insertBefore(lens, rail.firstChild);
    return lens;
  }

  function screenBehind(rect) {
    var screens = document.querySelectorAll(".page-screen");
    var midY = rect.top + rect.height / 2;
    for (var i = 0; i < screens.length; i++) {
      var box = screens[i].getBoundingClientRect();
      if (box.top <= midY && box.bottom >= midY) return screens[i];
    }
    return screens[0] || null;
  }

  function syncClone(rect) {
    var lens = ensureLens();
    var scene = lens.querySelector(".section-rail-lens-scene");
    var screen = screenBehind(rect);
    if (!screen || !scene) return;
    var screenBox = screen.getBoundingClientRect();
    var img = screen.querySelector(".page-bg img");
    var src = img && (img.currentSrc || img.src);
    scene.replaceChildren();
    scene.style.width = (rect.width + PAD * 2) + "px";
    scene.style.height = (rect.height + PAD * 2) + "px";
    scene.style.left = (-PAD) + "px";
    scene.style.top = (-PAD) + "px";
    var layer = document.createElement(src ? "img" : "span");
    layer.style.position = "absolute";
    layer.style.width = screenBox.width + "px";
    layer.style.height = screenBox.height + "px";
    layer.style.left = (screenBox.left - rect.left + PAD) + "px";
    layer.style.top = (screenBox.top - rect.top + PAD) + "px";
    if (src) {
      layer.alt = "";
      layer.src = src;
      layer.style.objectFit = "cover";
    } else {
      layer.style.display = "block";
      layer.style.background = getComputedStyle(screen).background;
    }
    scene.appendChild(layer);
  }

  function apply() {
    if (!window.matchMedia("(max-width: 768px)").matches) {
      rail.classList.remove("section-rail--liquid");
      return;
    }
    var rect = rail.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width + PAD * 2));
    var h = Math.max(1, Math.round(rect.height + PAD * 2));
    var key = w + "x" + h;
    if (key !== mapKey) {
      filterImage.setAttribute("href", buildMap(w, h, PAD));
      filterImage.setAttribute("width", String(w));
      filterImage.setAttribute("height", String(h));
      displace.setAttribute("scale", String(SCALE));
      mapKey = key;
    }
    rail.classList.add("section-rail--liquid");
    rail.classList.remove("section-rail--refract");
    var selection = rail.querySelector('.section-rail-selection');
    if (!selection) {
      selection = document.createElement('span');
      selection.className = 'section-rail-selection';
      selection.setAttribute('aria-hidden', 'true');
      rail.appendChild(selection);
    }
    var active = rail.querySelector('.section-rail-link.is-active');
    if (active) {
      selection.style.width = (active.offsetWidth - 4) + 'px';
      selection.style.transform = 'translateX(' + (active.offsetLeft + 2) + 'px)';
    }
    syncClone(rect);
  }

  var frame = 0;
  function schedule() {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(apply);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);
  document.querySelectorAll(".page-bg img").forEach(function (img) {
    img.addEventListener("load", schedule);
  });
  new MutationObserver(function (changes) {
    if (changes.some(function (change) { return change.target.matches('.section-rail-link'); })) schedule();
  }).observe(rail, { subtree: true, attributes: true, attributeFilter: ['class'] });
  document.querySelector(".page-stack")?.addEventListener("scroll", schedule, { passive: true });
})();
