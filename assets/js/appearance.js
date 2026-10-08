(function () {
  'use strict';

  var root = document.documentElement;
  var storageKey = 'debuginn-theme';
  var scheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var preference = 'system';
  var resolved = 'light';

  function savedPreference(value) {
    return value === 'light' || value === 'dark' ? value : 'system';
  }

  try { preference = savedPreference(window.localStorage.getItem(storageKey)); } catch (_) {}

  function apply() {
    resolved = preference === 'system' ? scheme && scheme.matches ? 'dark' : 'light' : preference;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0d1015' : '#faf9f6');
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      var label = resolved === 'dark' ? '切换浅色模式' : '切换暗黑模式';
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(resolved === 'dark'));
      var caption = button.querySelector('[data-theme-label]');
      if (caption) caption.textContent = label;
    });
    document.dispatchEvent(new CustomEvent('debuginn:themechange', { detail: { theme: resolved, preference: preference } }));
  }

  // Runs in the head before stylesheets so the first painted palette is correct.
  apply();

  function initializeControls() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        preference = resolved === 'dark' ? 'light' : 'dark';
        try { window.localStorage.setItem(storageKey, preference); } catch (_) {}
        apply();
      });
    });
    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeControls, { once: true });
  else initializeControls();

  if (scheme) {
    var updateSystem = function () { if (preference === 'system') apply(); };
    if (scheme.addEventListener) scheme.addEventListener('change', updateSystem);
    else if (scheme.addListener) scheme.addListener(updateSystem);
  }
  window.addEventListener('storage', function (event) {
    if (event.key === storageKey || event.key === null) {
      preference = savedPreference(event.newValue);
      apply();
    }
  });
})();
