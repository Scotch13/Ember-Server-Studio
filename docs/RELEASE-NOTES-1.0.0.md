# Ember Server Studio 1.0.0 — Your PC. Your world. Your server.

The first public Windows x64 release of Ember Server Studio: a free, local-first Minecraft Java server manager with seven server types, managed Java, a built-in console, Modrinth integration, backups and optional user-owned VPS tunnels.

## Download

Download **`Ember-Server-Studio-1.0.0-windows-x64.zip`** and **`SHA256SUMS.txt`** from the assets below. The automatically generated “Source code” archives are for developers, not a ready-to-run app.

Verify the ZIP with PowerShell:

```powershell
Get-FileHash .\Ember-Server-Studio-1.0.0-windows-x64.zip -Algorithm SHA256
```

Compare the result with `SHA256SUMS.txt`, extract the complete ZIP and run `Ember Server Studio.exe` inside the application folder. Keep all application files together. No Node.js, npm or separate Java installation is required for the packaged app.

## Highlights

- Vanilla, Paper, Purpur, Fabric, Forge, NeoForge and Quilt.
- Verified downloads, compatible Modrinth releases/dependencies and backup-backed tracked mod updates.
- Integrated console with suggestions/history, player tools and Java-process RAM monitoring.
- Manual/scheduled/pre-mod backups, local diagnostics, JAR drag-and-drop and portable server import/export.
- Dark/light themes and English, Italian, Spanish, French and German interfaces.
- Consistent data-entry styling and a clearer server search beside Import.
- Optional per-server FRP tunnels through your own VPS; no Ember relay/account, with verified TLS and Windows-protected token storage.

## Read first

- [User guide](https://github.com/Scotch13/Ember-Server-Studio/blob/main/docs/USER-GUIDE.md)
- [Complete VPS/tunnel setup](https://github.com/Scotch13/Ember-Server-Studio/blob/main/docs/TUNNELS.md)
- [Privacy and network behavior](https://github.com/Scotch13/Ember-Server-Studio/blob/main/docs/PRIVACY.md)
- [Security policy](https://github.com/Scotch13/Ember-Server-Studio/blob/main/SECURITY.md)

## Important limitations and precautions

**Personal tunnels are experimental.** Unit/UI tests, real TLS checks and official client config validation passed locally, but full forwarding on a production VPS is not yet verified. Windows antivirus blocked the local `frps` test relay; no protection was disabled. You must install and administer FRP 0.71.1 on your own VPS, manage its firewall and certificate, and test player access from another network. TLS verification alone does not prove token authentication or Minecraft reachability. TCP only; no UDP voice chat or DDoS protection.

This Windows build is **unsigned**. Verify checksums and investigate warnings; do not disable antivirus or add broad exclusions. A checksum is not a code-signing certificate or independent security audit.

Keep authentication and a whitelist enabled. Mods, plugins and imported launchers execute code. Back up worlds off-site and stop servers normally before updating. Local data normally lives under `%APPDATA%\ember-server-studio\Dati`, separate from the app. This project does not upload your worlds or provide automatic application updates.

**Never publish exported `frps.toml`: it contains a secret token in plaintext.** Also review screenshots, logs and portable exports before sharing.

Validation: 76 local unit tests and selected isolated GUI/package smoke tests passed. Production dependency audit reported zero vulnerabilities at publication time; five moderate development-tool entries remain through ASAR/glob/minimatch after high-severity build-tool advisories were removed. See the source release checklist for details; future audit results may change.

Original project source: MIT. Upstream components retain their licenses, including FRP Apache-2.0 and Electron/Chromium notices. Not an official Minecraft product; not affiliated with Mojang or Microsoft.
