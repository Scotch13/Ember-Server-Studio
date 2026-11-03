# User guide

## Installation and updates

Download the Windows x64 ZIP from [Releases](https://github.com/Scotch13/Ember-Server-Studio/releases), verify its checksum, extract all files and launch the EXE. Keep the entire app folder together. For an update, stop servers, close Ember, make a separate copy of your data directory and extract the new app into a separate folder. There is no automatic updater.

The application UI supports English, Italian, Spanish, French and German. Change language under Preferences. The theme button changes only Ember's dark/light appearance, not the Windows theme.

## Server software

| Software | Typical use |
| --- | --- |
| Vanilla | Official, unmodified Minecraft Java server. |
| Paper / Purpur | Plugin servers. Use compatible server-side plugins. |
| Fabric / Quilt | Modded servers with compatible mods and dependencies. |
| Forge / NeoForge | Modded servers with matching loader/game versions. |

Ember downloads Java appropriate to the selected server. Do not assign all RAM to Java: Windows, your Minecraft client, native libraries and other applications also need memory. Configure unique local ports when running multiple servers.

## Mods and plugins

Search the Modrinth library and click **Add to server**. Select the server and a compatible release, review required dependencies and confirm installation. Servers must be stopped before changing files. Downloads from the official Modrinth CDN are hash-verified.

You can also import trusted `.jar` files or drag them into the app. Local imports do not automatically resolve every dependency. Select files to enable, disable or move them to the Windows Recycle Bin. Disabling renames a JAR to `.jar.disabled`; it does not delete it.

The mod-update check applies to tracked, active Modrinth projects. Updates create a backup first; manually modified files are not silently replaced. Dependency removal is not automatic. A compatible server-side release does not guarantee that every client has the required mods.

If Modrinth search is unavailable, Ember may show a clearly marked, limited fallback from official project lookups/cache. This is not the complete catalog; retry later for full search.

## Console, players and RAM

The console sends commands to the selected running server. Suggestions depend on the Minecraft version; custom plugin/mod commands may not have completions. Command history is stored separately for each server and can be cleared from Tools.

Player tools expose whitelist, operator and ban actions through server commands with confirmation. Review the selected nickname carefully. Enable Minecraft authentication and use a whitelist before allowing Internet access.

RAM monitoring follows the Java process, not just a configured maximum. Memory values can differ from Java heap metrics because native memory is also used.

## Backups and recovery

- Create manual backups before major changes and test recovery on a separate copy.
- Scheduled backups run only with Ember open and the server stopped. They wait rather than interrupting a running world.
- Automatic retention moves excess automatic backups to the Recycle Bin; it does not rotate manual backups.
- Pre-mod backups are configurable; tracked mod updates require their safety backup.
- Keep copies on another disk or off-site. A backup on the same failed drive is not protection.

Stop servers normally to let Minecraft save worlds. Forced termination is a last resort and may lose data. The app asks before closing while a server is running.

## Import and portable export

Import copies a stopped server folder into Ember. The original folder is not intentionally modified. Confirm that the original server has stopped and that you accept the EULA. Treat imported launchers and JARs as executable code.

Portable export creates a ZIP containing the world, loader, mods and configuration while excluding managed Java, caches, logs and temporary runtime material. **The export may still contain personal information and secrets in plugins or server configuration. Review it before sharing.** It is not an anonymized support bundle.

## Connecting

Use `localhost:PORT` on the hosting PC. On the same network, use the appropriate LAN IP shown by Ember. The detected list can contain VPNs, virtual machines and other adapters; not every listed address is reachable by your friends.

For Internet access choose router port forwarding, an independently managed external service, or Ember's [personal VPS tunnel](TUNNELS.md). LAN success does not imply Internet access. Never share a localhost address with someone on another PC.

## Data and troubleshooting

Preferences contains **Open data folder**. The usual location is `%APPDATA%\ember-server-studio\Dati`; it contains worlds, server profiles, Java runtimes and backups. Keep data separate from Git repositories. The VPS token is Windows-account protected and must be re-entered when moving to another account/computer.

Local crash diagnostics suggest common causes such as an incompatible Java version, insufficient RAM, missing dependencies or an occupied port. Read the original log and review it for secrets before asking for help. Neither local TCP checks nor the TLS probe is a full public-connectivity test.
