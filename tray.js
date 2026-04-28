'use strict';

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const settings = require('./settings');

let tray            = null;
let currentLocale   = {};
let currentBlurMode = 1;
let onMenuAction    = null;

function t(key, vars) {
  let str = currentLocale[key] || key;
  if (vars) Object.keys(vars).forEach(k => { str = str.replace('{' + k + '}', vars[k]); });
  return str;
}

function blurModeName(mode) {
  const keys = ['blur.all', 'blur.list', 'blur.chat', 'blur.none'];
  return t(keys[mode - 1] || 'blur.all');
}

function buildMenu() {
  const s = settings.load();

  return Menu.buildFromTemplate([
    {
      label:   t('tray.blur_mode_label', { mode: blurModeName(currentBlurMode) }),
      enabled: false,
    },
    {
      label: t('tray.toggle_blur'),
      click: () => emit('toggle-blur'),
    },
    { type: 'separator' },
    {
      label: t('tray.check_updates'),
      click: () => emit('check-updates'),
    },
    {
      label:   t('tray.settings'),
      submenu: [
        {
          label:   t('tray.presentation_auto'),
          type:    'checkbox',
          checked: s.presentationModeAuto,
          click:   (item) => {
            settings.set('presentationModeAuto', item.checked);
            emit('setting-changed', { key: 'presentationModeAuto', value: item.checked });
          },
        },
        { type: 'separator' },
        {
          label:   t('tray.language'),
          submenu: [
            {
              label:   t('tray.lang_en'),
              type:    'radio',
              checked: s.language === 'en',
              click:   () => { settings.set('language', 'en'); emit('language-changed', 'en'); },
            },
            {
              label:   t('tray.lang_id'),
              type:    'radio',
              checked: s.language === 'id',
              click:   () => { settings.set('language', 'id'); emit('language-changed', 'id'); },
            },
          ],
        },
      ],
    },
    { type: 'separator' },
    {
      label: t('tray.quit'),
      click: () => emit('quit'),
    },
  ]);
}

function emit(action, payload) {
  if (onMenuAction) onMenuAction(action, payload);
}

function create(locale, actionCallback) {
  currentLocale  = locale || {};
  onMenuAction   = actionCallback;

  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('SiWhatsapp');
  tray.setContextMenu(buildMenu());
  tray.on('double-click', () => emit('show-window'));

  return tray;
}

function update(locale, blurMode) {
  if (locale    !== undefined) currentLocale   = locale;
  if (blurMode  !== undefined) currentBlurMode = blurMode;
  if (tray) tray.setContextMenu(buildMenu());
}

function updateBlurMode(mode) {
  if ([1, 2, 3, 4].includes(mode)) {
    currentBlurMode = mode;
    if (tray) tray.setContextMenu(buildMenu());
  }
}

module.exports = { create, update, updateBlurMode };
