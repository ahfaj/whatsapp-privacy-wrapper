# WhatsApp Privacy Wrapper

A Windows desktop app that loads WhatsApp Web inside a private window and blurs all message content by default. Hover over any message, chat, or name to reveal it. Press `Alt+W` to toggle blur on or off for your whole session.

Free. No server. No account. Fully open source.

---

## Download

Download the latest `.exe` installer from the [GitHub Releases page](../../releases).

> **Only download from this page.** Do not download from any other source.

---

## Installation

1. Download `WhatsApp-Privacy-Wrapper-Setup-x.x.x.exe` from Releases.
2. Run it. Windows will show a SmartScreen warning — see below.
3. Log in to WhatsApp by scanning the QR code once. You'll stay logged in.

### SmartScreen warning

Because this app is unsigned (no paid code-signing certificate), Windows will show:

> **"Windows protected your PC"**

This is expected. To proceed:

1. Click **"More info"**
2. Click **"Run anyway"**

This warning appears on first install only.

---

## Usage

| Action | Result |
|---|---|
| Launch app | Blur is **ON** — all messages and names are blurred |
| Hover over a message / chat | That item is revealed while hovered |
| `Alt+W` | Toggle blur **off** for the whole window |
| `Alt+W` again | Toggle blur **back on** |
| System tray → Toggle blur | Same as `Alt+W` |
| Quit and relaunch | Blur resets to **ON** — toggle state is never saved |
| Quit and relaunch | Session persists — no QR code scan needed |

---

## Known limitations

- **CSS selector drift** — WhatsApp may rename its internal CSS classes after an update. If blur stops working, the selectors in `privacy/inject.css` need to be updated. Check the [Releases page](../../releases) for a fix.
- **Voice/video calls** — may or may not work. WhatsApp Web calls depend on browser-specific behaviour. Not guaranteed.
- **Single account only** — one WhatsApp account per install.
- **No auto-updates** — when a new version is available, download it from the Releases page and run it over the existing install.
- **Windows only** — this build targets Windows. Mac/Linux support may come later.

---

## Building from source

```bash
git clone https://github.com/yourname/whatsapp-privacy-wrapper.git
cd whatsapp-privacy-wrapper
npm install
npm start          # run in development
npm run build      # build the Windows installer to dist/
```

Requires Node.js 20+.

### Releasing a new version

Push a version tag — GitHub Actions will build and publish automatically:

```bash
git tag v1.0.1
git push origin v1.0.1
```

---

## Security

- WhatsApp's code runs in a sandboxed Chromium renderer with no access to Node.js.
- The injected privacy layer only toggles a CSS class — it does not read or transmit your messages.
- No analytics, no telemetry, no network calls beyond loading `web.whatsapp.com`.
- Session data is stored locally in your user profile. It never leaves your machine.

---

## Risk & Data Control

This section explains every risk this app carries, how serious it is, and exactly what you can do about it. Read this before installing, and share it with anyone else you give the app to.

---

### Risk matrix

| # | Risk | Level | What it means in plain English | What you should do |
|---|---|---|---|---|
| 1 | Session data stored unencrypted on your PC | ⚠️ Medium | Your WhatsApp login and message cache sit in a folder on your hard drive. Anyone with access to your PC could read it. | Use a strong Windows login password. Enable Windows disk encryption (BitLocker). Delete the data folder when uninstalling — see below. |
| 2 | App is unsigned (no certificate) | ℹ️ Low | Windows can't verify who made the app, so it shows a warning on first run. | Only ever download from **your own GitHub Releases page**. Never install a copy sent to you by someone else. |
| 3 | Your GitHub account could be compromised | ⚠️ Medium | If someone gains access to your GitHub account, they could push a modified version of the app. | Enable **two-factor authentication (2FA)** on your GitHub account immediately — GitHub → Settings → Password and authentication. |
| 4 | WhatsApp Web inherits WhatsApp's own risks | ℹ️ Low | This app loads the real WhatsApp Web. Any vulnerability in WhatsApp Web affects this app too. | Nothing extra — this is the same risk as using WhatsApp Web in a browser. |
| 5 | Blur may stop working silently after a WhatsApp update | ℹ️ Low | WhatsApp occasionally renames its internal code. If blur breaks, the app still works — it just shows messages unblurred. | Check the Releases page after any WhatsApp Web update. A fix will be posted when needed. |
| 6 | No automatic updates | ℹ️ Low | Security fixes won't reach you automatically. | Revisit the Releases page occasionally and reinstall if a new version is posted. |
| 7 | App reads and injects code into WhatsApp Web | ℹ️ Very low | The injected code only adds and removes a CSS class for blur. It does not read, copy, or transmit messages. | You can verify this yourself — open `privacy/inject.js` and `privacy/inject.css` in Notepad. The full source is readable plain text. |

---

### Where your data is stored

When you use the app, WhatsApp session data (your login, cache, and media) is saved here on your PC:

```
C:\Users\YourName\AppData\Roaming\whatsapp-privacy-wrapper\
```

This folder is created automatically when you first log in. It is **not deleted** when you uninstall the app.

---

### How to delete your data (before or after uninstalling)

Do this any time you want to fully wipe your session — for example before giving away your PC, or to force a fresh WhatsApp login.

1. Press `Windows key + R`
2. Type `%appdata%` and press Enter — a folder window opens
3. Find the folder called `whatsapp-privacy-wrapper`
4. Right-click it → **Delete**
5. Empty your Recycle Bin to permanently remove it

After deleting, the next time you open the app it will ask you to scan the WhatsApp QR code again.

---

### How to fully uninstall

1. Go to Windows **Settings → Apps → Installed apps**
2. Find **WhatsApp Privacy Wrapper** → Uninstall
3. Then follow the data deletion steps above — the uninstaller does not remove your session data automatically

---

### Recommended one-time security actions

These take less than 5 minutes and significantly reduce your risk:

- [ ] Enable 2FA on your GitHub account — github.com → Settings → Password and authentication
- [ ] Make sure your Windows account has a strong password
- [ ] Consider enabling BitLocker disk encryption — Windows Settings → Privacy & Security → Device encryption
- [ ] Bookmark your own Releases page as the only trusted download source

---

## License

MIT
