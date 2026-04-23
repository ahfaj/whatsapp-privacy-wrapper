'use strict';

const {
  app,
  BrowserWindow,
  BrowserView,
  globalShortcut,
  session,
  shell,
  ipcMain,
} = require('electron');
const path = require('path');
const fs = require('fs');

const WHATSAPP_ORIGIN = 'https://web.whatsapp.com';

let mainWindow = null;
let whatsappView = null;

// ─── Read injection files once at startup ────────────────────────────────────
// Files are read from disk in the main process — never fetched over the network.
const injectCSS = fs.readFileSync(path.join(__dirname, 'privacy', 'inject.css'), 'utf8');
const injectJS  = fs.readFileSync(path.join(__dirname, 'privacy', 'inject.js'),  'utf8');

// ─── Helper: is a URL on the trusted origin? ─────────────────────────────────
function isWhatsAppURL(url) {
  try {
    return new URL(url).origin === WHATSAPP_ORIGIN;
  } catch {
    return false;
  }
}

// ─── Create window ────────────────────────────────────────────────────────────
function createWindow() {
  // Persistent session — keeps the user logged in across launches.
  const whatsappSession = session.fromPartition('persist:whatsapp');

  // Spoof a real Chrome user agent so WhatsApp Web doesn't reject the browser.
  // Electron's default UA includes the word "Electron" which WhatsApp blocks.
  whatsappSession.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/124.0.0.0 Safari/537.36'
  );

  // Permission handler: allow media (camera/mic for calls), deny everything else.
  whatsappSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media'];
    callback(allowed.includes(permission));
  });

  // Shell BrowserWindow — holds no web content itself.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'WhatsApp Privacy Wrapper',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      // The BrowserWindow itself has no web content; lock it down anyway.
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false,        // <webview> tag is disabled — we use BrowserView
    },
  });

  // ─── BrowserView — the actual WhatsApp renderer ───────────────────────────
  whatsappView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,               // ✓ Security non-negotiable #1
      contextIsolation: true,               // ✓ Security non-negotiable #2
      sandbox: true,                        // Chromium sandbox
      webSecurity: true,                    // ✓ Security non-negotiable #3
      allowRunningInsecureContent: false,   // No mixed content
      webviewTag: false,                    // Belt-and-suspenders
      navigateOnDragDrop: false,            // Drag-drop can't trigger navigation
      session: whatsappSession,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setBrowserView(whatsappView);

  // Fill the window with the BrowserView, accounting for the menu bar (if any).
  resizeView();
  mainWindow.on('resize', resizeView);

  // ─── Navigation lockdown ──────────────────────────────────────────────────
  const wc = whatsappView.webContents;

  // Block navigation away from WhatsApp — open in system browser instead.
  wc.on('will-navigate', (event, url) => {
    if (!isWhatsAppURL(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Block new windows — open external URLs in the system browser.
  wc.setWindowOpenHandler(({ url }) => {
    if (!isWhatsAppURL(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };   // Always deny — we never want a new Electron window
  });

  // ─── Inject privacy layer after every page load ───────────────────────────
  wc.on('did-finish-load', async () => {
    try {
      await wc.insertCSS(injectCSS);
      await wc.executeJavaScript(injectJS);
    } catch (err) {
      console.error('Injection failed:', err);
    }
  });

  // ─── Global shortcut: Alt+W toggles blur ─────────────────────────────────
  globalShortcut.register('Alt+W', () => {
    wc.send('toggle-blur');
  });

  // ─── IPC: tray "Toggle blur" button ──────────────────────────────────────
  ipcMain.on('tray-toggle-blur', () => {
    wc.send('toggle-blur');
  });

  // ─── Load WhatsApp ────────────────────────────────────────────────────────
  wc.loadURL(WHATSAPP_ORIGIN);

  // ─── Tray ─────────────────────────────────────────────────────────────────
  const { initTray } = require('./tray');
  initTray(mainWindow, app);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Resize BrowserView to fill the window ───────────────────────────────────
function resizeView() {
  if (!mainWindow || !whatsappView) return;
  const bounds = mainWindow.getContentBounds();
  whatsappView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
  whatsappView.setAutoResize({ width: true, height: true });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
