'use strict';

const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  globalShortcut,
  shell,
  screen,
  session,
  Notification,
} = require('electron');
const path = require('path');
const fs   = require('fs');

const settings = require('./settings');
const tray     = require('./tray');
const updater  = require('./updater');

// ─── Constants ────────────────────────────────────────────────────────────────

const WHATSAPP_URL = 'https://web.whatsapp.com';
const CHROME_UA    = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const PRELOAD_PATH = path.join(__dirname, 'preload.js');

// ─── App state ────────────────────────────────────────────────────────────────

let mainWindow   = null;
let whatsappView = null;

let currentLocale           = {};
let currentBlurMode         = 1;
let prePresentationBlurMode = 1;

// ─── Locale helper ────────────────────────────────────────────────────────────

function t(key, vars) {
  let str = currentLocale[key] || key;
  if (vars) Object.keys(vars).forEach(k => { str = str.replace('{' + k + '}', vars[k]); });
  return str;
}

function loadLocale() {
  currentLocale = settings.getLocale();
  updater.setLocale(currentLocale);
}

// ─── BrowserView security preferences ────────────────────────────────────────

function secureWebPrefs(preload) {
  return {
    nodeIntegration:            false,
    contextIsolation:           true,
    sandbox:                    true,
    webSecurity:                true,
    allowRunningInsecureContent:false,
    webviewTag:                 false,
    navigateOnDragDrop:         false,
    preload:                    preload || undefined,
  };
}

// ─── WhatsApp BrowserView ─────────────────────────────────────────────────────

function createWhatsAppView() {
  const wa = session.fromPartition('persist:whatsapp');
  wa.setUserAgent(CHROME_UA);
  wa.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(['media', 'notifications'].includes(permission));
  });

  whatsappView = new BrowserView({
    webPreferences: { ...secureWebPrefs(PRELOAD_PATH), session: wa },
  });
  mainWindow.addBrowserView(whatsappView);
  fitWhatsAppView();

  // Navigation lockdown — whatsapp.com only
  whatsappView.webContents.on('will-navigate', (event, url) => {
    try {
      if (new URL(url).hostname !== 'web.whatsapp.com') {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch { event.preventDefault(); }
  });

  whatsappView.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  whatsappView.webContents.on('did-finish-load', () => {
    injectPrivacyLayer();
    whatsappView.webContents.send('locale-ready', currentLocale);
  });

  whatsappView.webContents.loadURL(WHATSAPP_URL);
}

function fitWhatsAppView() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height } = mainWindow.getContentBounds();
  if (whatsappView) whatsappView.setBounds({ x: 0, y: 0, width, height });
}

// ─── Privacy injection ────────────────────────────────────────────────────────

function injectPrivacyLayer() {
  if (!whatsappView || whatsappView.webContents.isDestroyed()) return;
  try {
    const css = fs.readFileSync(path.join(__dirname, 'privacy', 'inject.css'), 'utf8');
    const js  = fs.readFileSync(path.join(__dirname, 'privacy', 'inject.js'),  'utf8');
    whatsappView.webContents.insertCSS(css);
    whatsappView.webContents.executeJavaScript(js);
  } catch (err) {
    console.error('Failed to inject privacy layer:', err);
  }
}

// ─── Blur cycle ───────────────────────────────────────────────────────────────

function cycleBlur() {
  currentBlurMode = (currentBlurMode % 4) + 1;
  if (whatsappView && !whatsappView.webContents.isDestroyed()) {
    whatsappView.webContents.send('cycle-blur', currentBlurMode);
  }
  tray.updateBlurMode(currentBlurMode);
}

// ─── Presentation mode ────────────────────────────────────────────────────────

function activatePresentationMode() {
  if (!settings.get('presentationModeAuto')) return;
  prePresentationBlurMode = currentBlurMode;
  currentBlurMode = 1;
  if (whatsappView && !whatsappView.webContents.isDestroyed()) {
    whatsappView.webContents.send('presentation-mode-active');
  }
  tray.updateBlurMode(1);
  new Notification({ title: 'SiWhatsapp', body: t('presentation.active') }).show();
}

function deactivatePresentationMode() {
  if (!settings.get('presentationModeAuto')) return;
  currentBlurMode = prePresentationBlurMode;
  if (whatsappView && !whatsappView.webContents.isDestroyed()) {
    whatsappView.webContents.send('cycle-blur', currentBlurMode);
  }
  tray.updateBlurMode(currentBlurMode);
  new Notification({ title: 'SiWhatsapp', body: t('presentation.ended') }).show();
}

// ─── Main window ──────────────────────────────────────────────────────────────

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width:  1200,
    height: 800,
    minWidth:  480,
    minHeight: 320,
    title: 'SiWhatsapp',
    show:  false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true,
      webviewTag: false,
    },
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL('about:blank');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    createWhatsAppView();
  });

  mainWindow.on('resize',     fitWhatsAppView);
  mainWindow.on('maximize',   fitWhatsAppView);
  mainWindow.on('unmaximize', fitWhatsAppView);
  mainWindow.on('closed', () => { mainWindow = null; app.quit(); });
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

function registerIpcHandlers() {
  // Renderer → main: blur mode updated after cycle
  // Validated in preload.js; double-checked here
  ipcMain.on('blur-mode-changed', (_e, mode) => {
    if ([1, 2, 3, 4].includes(mode)) {
      currentBlurMode = mode;
      tray.updateBlurMode(mode);
    }
  });
}

// ─── Global shortcuts ─────────────────────────────────────────────────────────

function registerShortcuts() {
  globalShortcut.register('Alt+W', cycleBlur);
}

// ─── Tray action router ───────────────────────────────────────────────────────

function handleTrayAction(action, payload) {
  switch (action) {
    case 'toggle-blur':
      cycleBlur();
      break;
    case 'check-updates':
      updater.checkForUpdates(mainWindow);
      break;
    case 'setting-changed':
      // presentationModeAuto toggle is already persisted in tray.js
      break;
    case 'language-changed':
      loadLocale();
      tray.update(currentLocale, currentBlurMode);
      if (whatsappView && !whatsappView.webContents.isDestroyed()) {
        whatsappView.webContents.send('locale-ready', currentLocale);
      }
      break;
    case 'show-window':
      if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
      break;
    case 'quit':
      app.quit();
      break;
  }
}

// ─── Display events ───────────────────────────────────────────────────────────

function registerDisplayEvents() {
  screen.on('display-added',   activatePresentationMode);
  screen.on('display-removed', deactivatePresentationMode);
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  loadLocale();
  createMainWindow();
  registerIpcHandlers();
  registerShortcuts();
  registerDisplayEvents();
  tray.create(currentLocale, handleTrayAction);
  currentBlurMode = 1; // always start at all-blur
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => app.quit());
