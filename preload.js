'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('privacyBridge', {

  // Main → renderer: fires on Alt+W, passes new mode number (1–4)
  onCycleBlur: function (callback) {
    ipcRenderer.on('cycle-blur', function (_event, mode) {
      callback(mode);
    });
  },

  // Renderer → main: reports current mode so tray label updates
  // Validates that mode is exactly 1, 2, 3, or 4 — anything else is silently dropped
  sendBlurMode: function (mode) {
    if (mode === 1 || mode === 2 || mode === 3 || mode === 4) {
      ipcRenderer.send('blur-mode-changed', mode);
    }
  },

  // Main → renderer: fires when presentation mode forces mode 1
  onPresentationMode: function (callback) {
    ipcRenderer.on('presentation-mode-active', function () {
      callback();
    });
  },

  // Main → renderer: delivers locale strings for toast localisation
  onLocaleReady: function (callback) {
    ipcRenderer.on('locale-ready', function (_event, locale) {
      callback(locale);
    });
  },

});
