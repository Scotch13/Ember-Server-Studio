# Changelog

## 1.0.0 — Initial public release

- Windows x64 local Minecraft Java server management for seven server types.
- Managed Java, integrated console, command suggestions/history and Java RAM monitoring.
- Modrinth catalog, compatible version/dependency checks, verified downloads and backup-backed updates.
- Local JAR import/drag-and-drop, enable/disable and Recycle Bin actions.
- Manual/scheduled/pre-mod backups, import/export and local diagnostic/player tools.
- Dark/light themes, five UI languages, integrated confirmations and keyboard/mouse navigation.
- Consistent search and data-entry styling; server search grouped beside Import.
- Opt-in per-server personal VPS tunnels using official FRP 0.71.1, mandatory verified TLS and Windows-protected token storage.
- English user, privacy, security, build and VPS setup documentation.

### Known limitations

Personal tunnels require an independently configured user-owned VPS. Production end-to-end forwarding is not yet verified because antivirus blocked the local `frps` test relay. No antivirus bypass was used. The app is unsigned, has no automatic updater, and does not provide a hosted relay or DDoS protection.
