# Security policy

## Supported versions

Security maintenance currently targets the latest published source/release only. No guaranteed response time, commercial support, security audit or long-term support commitment is provided.

## Reporting a vulnerability

Do **not** disclose exploitable details, live credentials, private keys or personal server data in a public issue. Use the repository's **Security → Report a vulnerability** feature when available:

https://github.com/Scotch13/Ember-Server-Studio/security/advisories/new

If private reporting is unavailable, open a minimal public request asking for a private reporting channel **without reproduction details or secrets**. Ordinary UI bugs can use Issues.

Include the version, Windows version, affected feature, impact and a minimal sanitized reproduction. Rotate exposed credentials immediately; deleting a GitHub comment or commit is not enough once a secret has been public.

## Safety expectations

- Use only trusted server loaders, mods, plugins and imported launchers. They execute code on your PC.
- Enable Minecraft authentication, use a whitelist, keep software updated and keep offline/off-site backups.
- Do not expose RCON, console, file management or FRP administration ports to the public Internet.
- Public Minecraft ports can attract abuse. Ember and FRP are not DDoS protection.
- Do not turn off antivirus or add broad exclusions for the app or FRP. Verify official download origin and hashes, investigate detections and use an isolated environment when appropriate.
- Downloads are not code-signed by this project. SHA-256 checksums detect mismatches, but checksums hosted alongside a release are not an independent proof of publisher identity.
- The Windows ZIP ships Electron/Chromium and official FRP components; retain their licenses and keep the whole app folder together.

## Tunnel verification status

Personal tunnels are experimental. Local unit/UI tests, real TLS verification and official `frpc` config validation pass, but the local `frps` relay test was blocked by Windows antivirus. End-to-end forwarding on a production VPS has not yet been verified. This limitation is documented, not bypassed.

## Dependencies

Production and development dependencies are separate. Run both `npm audit --omit=dev` and `npm audit` before publishing, review advisories rather than blindly running `npm audit fix --force`, and rerun tests after upgrades. Automated dependency alerts are not a substitute for review.
