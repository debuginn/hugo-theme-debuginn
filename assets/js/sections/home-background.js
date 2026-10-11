(function () {
  'use strict';

  var script = document.currentScript;
  var home = script && script.closest('.page-screen-home');
  if (!home) return;

  try {
    var backgrounds = JSON.parse(home.getAttribute('data-backgrounds') || '[]');
    var thumbs = JSON.parse(home.getAttribute('data-thumbs') || '[]');
    var img = home.querySelector('[data-home-bg]');
    if (!backgrounds.length || !img) return;

    var index = Math.floor(Math.random() * backgrounds.length);
    var src = backgrounds[index];
    if (!src) return;

    home.setAttribute('data-home-background-index', String(index));
    var placeholder = home.querySelector('.page-bg');
    if (placeholder && thumbs[index]) {
      placeholder.style.backgroundImage = 'url(' + JSON.stringify(thumbs[index]) + ')';
    }
    img.src = src;
    img.removeAttribute('hidden');
  } catch (error) {
    // The deferred site script can initialize the background if needed.
  }
})();
