(function () {
  // Enable native iPhone Safari background extension by default; retain an explicit opt-out.
  var query = new URLSearchParams(location.search);
  if (query.get('safariBleed') === '0') return;
  var ua = navigator.userAgent;
  if (!/iPhone|iPod/.test(ua) || !/Safari/.test(ua) || /CriOS|FxiOS|EdgiOS/.test(ua)) return;
  if (navigator.standalone || matchMedia('(display-mode: standalone)').matches) return;
  var stack = document.querySelector('[data-debuginn-site]');
  if (!stack) return;
  var root = document.documentElement;
  var backdrop = document.createElement('div');
  backdrop.className = 'safari-edge-background';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(backdrop, document.body.firstChild);
  var mosaic = stack.querySelector('.cta-mosaic');
  if (mosaic) {
    var extendedMosaic = mosaic.cloneNode(true);
    extendedMosaic.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });
    backdrop.appendChild(extendedMosaic);
  }
  root.classList.add('safari-edge-bleed');
  var topBleed = 100;
  var frame = 0;
  function sync() {
    var active = stack.querySelector('[data-section-rail] a.is-active');
    var screen = document.getElementById(active ? active.dataset.sectionDot : 'home');
    if (!screen) return;
    stack.querySelectorAll('[data-safari-shared-background]').forEach(function (node) {
      node.removeAttribute('data-safari-shared-background');
    });
    // Plural's outer section is only a fallback; the mounted hero owns its paint.
    var paintSource = screen.querySelector('.pa-hero') || screen;
    var background = screen.querySelector('.page-bg') || (paintSource !== screen ? paintSource : null);
    var image = background && background.matches('.page-bg') && background.querySelector('img');
    var src = image && (image.currentSrc || image.src);
    var originalStyle = getComputedStyle(paintSource);
    var paint = originalStyle.background;
    ['--iassets-mosaic-center', '--iassets-mosaic-edge'].forEach(function (name) {
      backdrop.style.setProperty(name, originalStyle.getPropertyValue(name));
    });
    var before = background ? getComputedStyle(background, '::before') : null;
    var after = background ? getComputedStyle(background, '::after') : null;
    if (paintSource !== screen) {
      ['top', 'right', 'width', 'height', 'border', 'border-radius', 'transform', 'opacity'].forEach(function (name) {
        backdrop.style.setProperty('--safari-plural-before-' + name, before.getPropertyValue(name));
      });
      backdrop.style.setProperty('--safari-plural-after-mask', after.getPropertyValue('mask-image'));
      backdrop.style.setProperty('--safari-plural-after-opacity', after.opacity);
    }
    backdrop.style.setProperty('--safari-overlay-before', before && before.content !== 'none' ? before.background : 'none');
    backdrop.style.setProperty('--safari-overlay-after', after && after.content !== 'none' ? after.background : 'none');
    backdrop.dataset.photo = src ? 'true' : 'false';
    backdrop.dataset.section = screen.id;
    backdrop.style.background = paint;
    screen.setAttribute('data-safari-shared-background', '');
    if (src) {
      backdrop.style.backgroundImage = 'url(' + JSON.stringify(src) + ')';
      backdrop.style.backgroundSize = 'cover';
      backdrop.style.backgroundPosition = 'center';
      backdrop.style.backgroundRepeat = 'no-repeat';
    }
    window.scrollTo({ top: topBleed, left: 0, behavior: 'instant' });
  }
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  }
  var rail = stack.querySelector('[data-section-rail]');
  if (rail) new MutationObserver(schedule).observe(rail, {subtree:true,attributes:true,attributeFilter:['class']});
  new MutationObserver(schedule).observe(root, {attributes:true,attributeFilter:['data-theme']});
  new MutationObserver(function (records) {
    if (records.some(function (record) {
      return record.type === 'attributes' || Array.from(record.addedNodes).some(function (node) {
        return node.nodeType === 1 && (node.matches('.pa-hero') || node.querySelector('.pa-hero'));
      });
    })) schedule();
  }).observe(stack, {subtree:true,childList:true,attributes:true,attributeFilter:['data-theme']});
  stack.querySelectorAll('.page-bg img').forEach(function (image) {
    image.addEventListener('load', schedule);
    new MutationObserver(schedule).observe(image, {attributes:true,attributeFilter:['src']});
  });
  window.addEventListener('resize', schedule);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  schedule();
})();
