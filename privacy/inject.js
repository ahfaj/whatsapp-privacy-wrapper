(function () {
  'use strict';

  // Blur is always ON at load time. Remove .privacy-off if it somehow persists
  // (it shouldn't — state is in-memory only and resets on every page load).
  document.body.classList.remove('privacy-off');

  // Register the toggle listener through the context bridge.
  // privacyBridge is exposed by preload.js via contextBridge — it is the
  // only surface available from the main process.
  if (window.privacyBridge && typeof window.privacyBridge.onToggleBlur === 'function') {
    window.privacyBridge.onToggleBlur(function () {
      document.body.classList.toggle('privacy-off');
    });
  }

  // ── No eval(), no innerHTML, no window.require, no Electron/Node globals. ──
  // This IIFE only touches CSS class names on <body>. It does not read,
  // intercept, or modify WhatsApp's internal data structures or network calls.
})();
