# SiWhatsapp — Changelog

---

## v1.3.0
- **Blur cycle** — `Alt+W` now cycles 4 modes: All Blur → Chat List Only → Chat Window Only → No Blur. Toast appears on each cycle. Tray label updates to show current mode. Blur always resets to All Blur on launch.
- **Localisation** — English and Bahasa Indonesia. Change via tray → Settings → Language. Takes effect immediately, no restart needed.
- **Presentation mode** — Connecting an external display automatically switches to All Blur. Disconnecting restores the previous mode. Toggle in tray → Settings. Note: detects physical display connections only, not screen sharing in Teams/Zoom/Meet.
- **Manual update checker** — Tray → Check for Updates. Compares against latest GitHub release. Option to download only or download and install immediately.
- **Installer filename fix** — `SiWhatsapp-Setup-{version}.exe` enforced via `artifactName` in package.json.

## v1.2.0
- Enabled voice and video calls — added `notifications` permission and updated Chrome user agent to 131

## v1.1.0
- Renamed app from "WhatsApp Privacy Wrapper" to "SiWhatsapp"
- Fixed installer filename to reflect correct version number
- Updated app ID and productName in build config

## v1.0.3
- Fixed WhatsApp browser check — app now spoofs Chrome user agent so WhatsApp Web loads properly

## v1.0.2
- Fixed icon size — icon must be at least 256×256 pixels for electron-builder

## v1.0.1
- Added `package-lock.json` — required by GitHub Actions to run `npm ci`

## v1.0.0
- Initial release
- WhatsApp Web wrapped in Electron with privacy blur layer
- Blur on by default, hover to reveal, Alt+W to toggle
- System tray icon with toggle and quit
- Persistent login session across launches
- GitHub Actions build pipeline
