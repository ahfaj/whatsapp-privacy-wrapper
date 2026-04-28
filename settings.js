'use strict';

const { app } = require('electron');
const path    = require('path');
const fs      = require('fs');

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

const DEFAULTS = {
  language:             'en',
  presentationModeAuto: true,
};

function load() {
  let raw = {};
  try {
    raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    // Fresh install or unreadable — use defaults
  }

  const s = Object.assign({}, DEFAULTS, raw);

  // Validate language
  if (!['id', 'en'].includes(s.language)) s.language = 'en';

  return s;
}

function save(s) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write settings.json:', err);
  }
}

function get(key) {
  return load()[key];
}

function set(key, value) {
  const s = load();
  s[key]  = value;
  save(s);
}

function getLocale() {
  const lang      = load().language;
  const localePath = path.join(__dirname, 'locales', `${lang}.json`);
  try {
    return JSON.parse(fs.readFileSync(localePath, 'utf8'));
  } catch {
    try {
      return JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', 'en.json'), 'utf8'));
    } catch {
      return {};
    }
  }
}

module.exports = { load, save, get, set, getLocale };
