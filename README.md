<div align="center">
  <img src="assets/ember.png" width="100" alt="Ember logo">
  <h1>Ember Server Studio</h1>
  <p><strong>Your PC. Your world. Your server.</strong></p>
  <p>A free, local-first Minecraft Java Edition server manager for Windows, with integrated mods, backups, Java management, and optional tunnels through your own VPS.</p>
  <p><a href="https://github.com/Scotch13/Ember-Server-Studio/releases">Download for Windows</a> · <a href="docs/USER-GUIDE.md">User guide</a> · <a href="docs/TUNNELS.md">Set up a tunnel</a> · <a href="docs/BUILDING.md">Build from source</a></p>
</div>

## What is Ember?

Ember runs Minecraft servers **on your computer** and brings the usual management tasks into one desktop app. No terminal is needed for everyday use, and no Ember account is required.

Ember is **not a hosting provider**. You supply the computer, Internet connection and, if you choose the tunnel feature, your own VPS. There is no Ember-operated relay, remote administration service, subscription or central server-control account.

## Features

- **Seven server types:** Vanilla, Paper, Purpur, Fabric, Forge, NeoForge and Quilt.
- **Managed Java:** download the runtime required by the selected Minecraft version without replacing your system Java.
- **Integrated console:** server output, version-aware command suggestions, command history per server and player commands.
- **Mods and plugins:** search Modrinth, select compatible releases, check required dependencies and verify downloads. Import local JAR files, including drag-and-drop; enable, disable or recycle selected files.
- **Safer updates:** check tracked Modrinth projects for updates, with a backup before changes and rollback on failure.
- **Backups:** manual snapshots, scheduled backups while the server is stopped, configurable retention and pre-mod backups.
- **Server tools:** local crash-log hints, player lists, whitelist/operator/ban actions and local TCP connection checks.
- **Import and export:** copy an existing stopped server without modifying the original; export a portable ZIP.
- **Real Java RAM monitoring** and a compact usage graph.
- **Optional personal tunnels:** configure your VPS in the sidebar, then opt in separately for each server. Share a Minecraft address without requiring tunnel software on your friends' PCs.
- **Dark/light themes** and **English, Italian, Spanish, French and German** interfaces.
- **Hidden background processes:** no extra CMD windows for Java or the tunnel client.

## Download and run

1. Open [Releases](https://github.com/Scotch13/Ember-Server-Studio/releases).
2. Download the **Windows x64 ZIP asset**, not GitHub's automatically generated “Source code” archive.
3. Extract the **entire ZIP** to a writable folder. Do not run it from inside the archive or move only the EXE.
4. Run `Ember Server Studio.exe`.
5. If needed, choose **English** under the language setting in Preferences.

The packaged app does not require Node.js, npm, Python or a separately installed Java runtime. An Internet connection is needed for first-time server/Java downloads and online catalogs. Windows x64 is the supported desktop target; macOS, Linux desktops and Bedrock hosting are not supported by this release.

**Release safety:** this is an independently distributed, unsigned desktop build, not a Microsoft Store installer. Verify the published SHA-256 checksum. Windows or antivirus software may warn about unsigned apps or tunneling tools. Do not disable your antivirus or add broad exclusions; stop and investigate any detection. See [Security](SECURITY.md).

## Create your first server

1. Click **Create server** and choose the server software and Minecraft version.
2. Configure RAM, port, player limit and game rules. Leave memory available for Windows and your Minecraft client.
3. Read and accept the [Minecraft EULA](https://www.minecraft.net/eula) only if you agree to it.
4. Wait for installation, then click **Start server** and wait for **Online**.
5. On the same PC, connect from Minecraft Java to `localhost:25565`, or the configured port.

For a modded server, clients may also need the same loader and matching mods. Server-side plugin compatibility differs from mod-loader compatibility. See the [user guide](docs/USER-GUIDE.md).

## Play with friends

| Connection | What you need |
| --- | --- |
| Same computer | `localhost` and the server port. |
| Same LAN/Wi-Fi | Your PC's LAN address, the server port and appropriate Windows Firewall rules. |
| Direct Internet access | Router port forwarding and firewall rules; CGNAT may prevent this. |
| Personal VPS tunnel | Your own public VPS running FRP, a trusted TLS certificate and an enabled tunnel for that server. |

### Personal VPS tunnels

**[Read the complete tunnel setup guide →](docs/TUNNELS.md)**

Configure **VPS and tunnels** in the sidebar, then open a server's **Tunnel** tab and choose its public port. Ember connects directly to **your VPS** using the bundled official FRP client. Friends join with `your-public-host:port` in Minecraft, without installing a tunnel client.

- You install and maintain `frps` on the VPS; Ember does not SSH into it, provision it or change its firewall.
- The tunnel starts only when the Minecraft server is online and stops with the server or Ember.
- TLS certificate/name verification is mandatory. VPS tokens are stored using Windows account protection and passed to the client through its environment, not plaintext config files.
- Exporting `frps.toml` is an explicit exception: **the exported file contains the secret token**. Never upload it to GitHub or share it with players.
- **Verify TLS checks only TLS**, not token authentication or public Minecraft reachability.
- TCP Minecraft traffic only; UDP voice chat is not forwarded. This is not DDoS protection.

**Testing status:** unit tests, real TLS checks, official client configuration validation and isolated UI tests have passed locally. A full FRP forwarding test was blocked by Windows antivirus detecting the local `frps` test relay as potentially unwanted software. No antivirus bypass was applied. **End-to-end forwarding on a production VPS is not yet verified**; treat personal tunnels as experimental and test from another network before relying on them.

## Your data and privacy

Server data is separate from the application, normally under:

```text
%APPDATA%\ember-server-studio\Dati
```

Use **Open data folder** in Preferences to confirm the actual location. Updating or moving the application folder does not intentionally delete worlds. Back up your data before updating; do not run two copies against the same data directory.

Detected network addresses are read from **each user's own Windows network interfaces**, not embedded developer IP addresses. They are displayed locally, including possible VPN/virtual adapters, and displaying them does not publish them online or open ports. Screenshots, screen sharing, logs and exported server ZIPs can nevertheless reveal private information: review them before sharing.

Online downloads contact Mojang/Microsoft, server-loader providers, Adoptium, Modrinth and their relevant download hosts. Those services can see the public IP making requests. An enabled tunnel contacts your configured VPS. “Local-first” does not mean “never uses the Internet.” Read [Privacy and network behavior](docs/PRIVACY.md).

## Important limitations

- The PC must stay awake and connected. Ember is not a Windows background hosting service.
- Scheduled backups require Ember to be open and wait for the server to stop. A local backup is not an off-site backup.
- Mods, plugins, imported launchers and loader installers execute code on your PC. Install only trusted projects.
- Crash diagnostics are suggestions, not a definitive diagnosis. Local connection checks do not prove Internet access.
- Keep Minecraft authentication enabled, use a whitelist and avoid exposing administrative ports.
- No automated app updater, automatic CurseForge/Modrinth modpack-archive import, free hosted relay or cloud hosting is included.
- VPS costs, bandwidth limits, TLS renewal, firewall rules and server maintenance belong to the VPS owner.

## Development and contributions

See [Building and testing](docs/BUILDING.md) and [Contributing](CONTRIBUTING.md). Use Node.js 24 LTS, a JDK 17+ and OpenSSL for the complete Windows test suite. Dependencies are locked in `package-lock.json`; FRP is downloaded from a pinned official release with checksum verification, not stored as a large binary in Git.

```powershell
npm ci
npm run prepare-assets
npm test
npm start
```

Report ordinary bugs through [Issues](https://github.com/Scotch13/Ember-Server-Studio/issues). Do not include tokens, private keys, world archives or unredacted personal logs. For vulnerabilities, follow [SECURITY.md](SECURITY.md).

## License and acknowledgements

Ember's original source is available under the [MIT License](LICENSE). Third-party components keep their own licenses: see [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt), the FRP Apache-2.0 license and the licenses shipped with the Windows release, including Electron/Chromium notices. Minecraft server files, Java runtimes and mods are downloaded when requested, not bundled as part of this repository.

**Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.** Minecraft is a trademark of its respective owners. Each user must comply with the Minecraft EULA and applicable third-party terms.
