(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var blurMode = 1; // 1–4, starts at all-blur
  var locale   = {};

  var BLUR_CLASSES = ['blur-all', 'blur-list', 'blur-chat'];

  function modeClass(mode) {
    if (mode === 1) return 'blur-all';
    if (mode === 2) return 'blur-list';
    if (mode === 3) return 'blur-chat';
    return null; // mode 4 — no class
  }

  function modeLabel(mode) {
    var keys = ['blur.all', 'blur.list', 'blur.chat', 'blur.none'];
    var key  = keys[mode - 1] || 'blur.all';
    return locale[key] || key;
  }

  // ─── Apply blur class to <body> ────────────────────────────────────────────
  function applyBlur(mode) {
    BLUR_CLASSES.forEach(function (cls) { document.body.classList.remove(cls); });
    var cls = modeClass(mode);
    if (cls) document.body.classList.add(cls);
  }

  // ─── Toast ────────────────────────────────────────────────────────────────
  function showToast(text) {
    var existing = document.getElementById('siwa-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id          = 'siwa-toast';
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('fade-out');
      setTimeout(function () { toast.remove(); }, 450);
    }, 1500);
  }

  // ─── IPC: cycle blur (Alt+W) ──────────────────────────────────────────────
  if (window.privacyBridge && window.privacyBridge.onCycleBlur) {
    window.privacyBridge.onCycleBlur(function (newMode) {
      blurMode = newMode;
      applyBlur(blurMode);
      showToast(modeLabel(blurMode));
      if (window.privacyBridge.sendBlurMode) {
        window.privacyBridge.sendBlurMode(blurMode);
      }
    });
  }

  // ─── IPC: presentation mode forces mode 1 ────────────────────────────────
  if (window.privacyBridge && window.privacyBridge.onPresentationMode) {
    window.privacyBridge.onPresentationMode(function () {
      blurMode = 1;
      applyBlur(blurMode);
      showToast(modeLabel(1));
      if (window.privacyBridge.sendBlurMode) {
        window.privacyBridge.sendBlurMode(blurMode);
      }
    });
  }

  // ─── IPC: receive locale strings for toast ────────────────────────────────
  if (window.privacyBridge && window.privacyBridge.onLocaleReady) {
    window.privacyBridge.onLocaleReady(function (strings) {
      locale = strings || {};
    });
  }

  // ─── Apply initial blur on load ───────────────────────────────────────────
  applyBlur(blurMode);

})();
