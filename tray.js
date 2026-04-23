'use strict';

const { Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let tray = null;

/**
 * Initialise the system tray icon.
 * @param {import('electron').BrowserWindow} mainWindow
 * @param {import('electron').App} app
 */
function initTray(mainWindow, app) {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.ico'));
  tray.setToolTip('WhatsApp Privacy Wrapper');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle blur',
      click: () => {
        // Route through ipcMain so main.js owns the toggle logic.
        ipcMain.emit('tray-toggle-blur');
      },
    },
    { type: 'separator' },
    {
      label: 'Open window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Left-click raises the window.
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

module.exports = { initTray };
