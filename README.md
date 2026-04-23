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

## License

MIT
