# Building and testing

## Supported development target

Use **Windows x64**, **Node.js 24 LTS** and npm. A **JDK 17+** and **OpenSSL 1.1.1+ / 3.x** are required for the complete test suite. Set `JAVA_HOME` to the JDK directory, not a JRE. OpenSSL can be on `PATH`, provided by Git for Windows, or selected with `OPENSSL_PATH`.

The RAM helper is compiled with the Windows .NET Framework C# compiler at `%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe`. Ensure it is installed on your build machine. The app does not require users to install these development tools.

```powershell
git clone https://github.com/Scotch13/Ember-Server-Studio.git
cd Ember-Server-Studio
npm ci
npm run prepare-assets
npm test
npm start
```

`prepare-assets` downloads the official pinned FRP Windows client only if absent or mismatched, verifies its archive/client SHA-256 and compiles `assets/ram-reader.exe` from `assets/ram-reader.cs`. Generated EXEs and `node_modules` are deliberately ignored by Git. Never substitute a random FRP executable; `lib/tunnels.js` enforces the pinned client hash at runtime.

`tools/fetch-frp.js` downloads the official upstream archive and also records a local test-relay path in ignored `tools/.frp-test-path.json`. This is development-only, not a credential or a file to commit. The relay is not included in the desktop release. Do not disable antivirus if it is blocked.

## Tests and isolation

Unit tests use temporary fixtures, not real Ember data. `tools/test-env.js` resolves a temporary base under the OS temp directory, discovers a JDK and OpenSSL, and supports:

| Variable | Purpose |
| --- | --- |
| `JAVA_HOME` | JDK directory for process fixtures. |
| `OPENSSL_PATH` | Optional full path to OpenSSL. |
| `EMBER_TEST_TMP` | Optional development-test temporary directory. Never use the real Ember data folder. |
| `EMBER_TEST_DATA` | Isolated userData root for non-packaged Electron test launches. Ignored by packaged builds. |

The complete local unit suite currently contains **76 tests**. It includes real Java fixture processes, archive/path checks, mod/update safety, data handling, real TLS trust/name checks and official FRP client configuration validation. It does not prove production Minecraft connectivity or replace a security audit.

Selected isolated UI checks:

```powershell
node tools/qa-inputs.js
node tools/qa-server-search.js
node tools/qa-dropdowns.js
node tools/qa-languages.js
node tools/qa-theme.js
node tools/qa-tunnels-ui.js
node tools/qa-ui-server.js
```

Some catalog/install tests use live external APIs and require Internet access. Some scripts write local screenshots under `../Anteprime`; those are not publication assets and may contain local information. Do not commit them.

`node tools/qa-tunnel-relay.js` attempts a real local FRP relay/forwarding test. On the original Windows environment this is **blocked by antivirus**; end-to-end forwarding is not claimed as verified. The separate TLS/client-config tests still run without starting `frps`.

## Package the desktop app

```powershell
npm run package
node tools/qa-packaged.js
```

The package command prepares verified assets first and writes the app to:

```text
../App/Ember Server Studio-win32-x64/
```

The whole directory is required. Executable helpers are unpacked from ASAR so they can run with `windowsHide: true`. Dependencies used only for development are not the application runtime dependency set.

**Important:** `qa-packaged.js` opens the real packaged app and therefore uses the normal userData path, not `EMBER_TEST_DATA`. It temporarily checks UI preferences and restores them, but should run on a clean test Windows account/VM with no production worlds or running servers. The other listed UI scripts use isolated fixtures. Do not stop or kill someone's Java process to make a test pass.

Create distributable artifacts only after reviewing the generated app:

```powershell
node tools/create-release.js
```

This writes the Windows ZIP and a SHA-256 manifest under `../Releases/`. Follow the [release checklist](RELEASING.md) before publishing them.

## Architecture

- `main.js`: Electron main process, restricted IPC, safe integrated confirmations and close protection.
- `preload.js`: explicit bridge with context isolation and sandboxing.
- `lib/manager.js`: catalogs, Java/server lifecycle, profiles and files.
- `lib/modrinth.js`: compatible plans, verified downloads and tracked updates.
- `lib/workspace.js`: backup scheduling, imports/exports, diagnostics and player tools.
- `lib/tunnels.js`: direct user-VPS FRP lifecycle, TLS/token handling and integrity checks.
- `lib/metrics.js` / `assets/ram-reader.cs`: actual Java process memory readings.
- `ui/`: local five-language interface, themes and shared input styling.

The renderer does not have Node.js access. Renderer network access is restricted by CSP; validated main-process operations perform downloads. Original project source is MIT; retain third-party licenses when distributing binaries.
