'use strict';

// preload.js runs in an isolated context between the main process and the
// WhatsApp renderer. It exposes exactly ONE method through contextBridge.
// No Node APIs are reachable from the renderer side.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('privacyBridge', {
  // Registers a callback that fires whenever the main process sends 'toggle-blur'.
  // The renderer calls this once on load; the callback is invoked on each toggle.
  onToggleBlur: (callback) => {
    ipcRenderer.on('toggle-blur', () => callback());
  },
});

// Nothing else is exposed. No fs, no path, no process, no require.
