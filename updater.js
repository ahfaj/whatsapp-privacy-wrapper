'use strict';

const { app, shell, dialog, Notification } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'ahfaj';
const REPO_NAME = 'whatsapp-privacy-wrapper';
const RELEASES_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

let locale = {};

function t(key, vars) {
  let str = locale[key] || key;
  if (vars) {
    Object.keys(vars).forEach(function (k) {
      str = str.replace('{' + k + '}', vars[k]);
    });
  }
  return str;
}

function setLocale(l) {
  locale = l || {};
}

function notify(body) {
  const n = new Notification({ title: 'SiWhatsapp', body });
  n.show();
}

function fetchJson(url) {
  return new Promise(function (resolve, reject) {
    const req = https.get(url, {
      headers: { 'User-Agent': 'SiWhatsapp-Updater' }
    }, function (res) {
      let data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, function () { req.destroy(); reject(new Error('timeout')); });
  });
}

function downloadFile(url, destPath, onProgress) {
  return new Promise(function (resolve, reject) {
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, function (res) {
      // Follow redirects (GitHub releases use redirects)
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.destroy();
        fs.unlink(destPath, function () {});
        downloadFile(res.headers.location, destPath, onProgress).then(resolve).catch(reject);
        return;
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;

      res.on('data', function (chunk) {
        downloaded += chunk.length;
        if (total > 0 && onProgress) {
          onProgress(Math.round((downloaded / total) * 100));
        }
      });

      res.pipe(file);
      file.on('finish', function () {
        file.close();
        resolve(destPath);
      });
      file.on('error', function (err) {
        fs.unlink(destPath, function () {});
        reject(err);
      });
    });
    req.on('error', reject);
  });
}

async function checkForUpdates(parentWindow) {
  try {
    const release = await fetchJson(RELEASES_API);
    const latestTag = (release.tag_name || '').replace(/^v/, '');
    const currentVersion = app.getVersion();

    if (latestTag === currentVersion || !latestTag) {
      notify(t('update.none'));
      return;
    }

    // Find the .exe asset
    const assets = release.assets || [];
    const exeAsset = assets.find(function (a) {
      return a.name && a.name.endsWith('.exe');
    });

    if (!exeAsset) {
      notify(t('update.none'));
      return;
    }

    // Show update dialog
    const { response } = await dialog.showMessageBox(parentWindow, {
      type: 'info',
      title: t('update.dialog_title'),
      message: t('update.dialog_message'),
      detail: t('update.available', { version: latestTag, current: currentVersion }),
      buttons: [
        t('update.download_only'),
        t('update.download_install'),
        'Cancel',
      ],
      defaultId: 0,
      cancelId: 2,
    });

    if (response === 2) return; // cancelled

    const downloadUrl = exeAsset.browser_download_url;
    const destPath = path.join(app.getPath('temp'), exeAsset.name);

    const notif = new Notification({
      title: 'SiWhatsapp',
      body: t('update.downloading', { percent: '0' }),
    });
    notif.show();

    await downloadFile(downloadUrl, destPath, function (percent) {
      // Update notification isn't easily patchable; progress shown in temp notification
    });

    if (response === 1) {
      // Download & Install
      notify(t('update.complete', { path: destPath }));
      await shell.openPath(destPath);
      app.quit();
    } else {
      // Download Only
      notify(t('update.complete', { path: destPath }));
      shell.showItemInFolder(destPath);
    }

  } catch (err) {
    console.error('Update check failed:', err);
    notify(t('update.failed'));
  }
}

module.exports = { checkForUpdates, setLocale };
