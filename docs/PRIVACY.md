# Privacy and network behavior

Ember is a local desktop manager, not a central hosting/control service. It does not require an Ember account or connect to an Ember-operated relay.

## Local information

The main process reads Windows network interfaces to display detected IPv4 addresses. These are collected at runtime on the current user's machine, not hardcoded developer addresses. The list can include LAN, VPN and virtual adapters. Displaying it inside the app does not publish it online, open ports or prove that an address is reachable from the Internet.

The UI currently displays these addresses without a “hide IPs” privacy mode. **Avoid sharing unredacted screenshots or livestreams of connection pages.** This repository deliberately does not include screenshots from a real user's network.

Worlds, profiles, backups, command history and settings are saved locally. Logs, crash reports, plugin configuration, player names and exported ZIPs may contain private information. Local storage is not a promise of anonymity.

## External connections

Features that download or search content use external providers, including Mojang/Microsoft, Adoptium, Paper, Purpur, Fabric, Quilt, Forge, NeoForge, Modrinth and relevant CDNs or Maven hosts. The development asset downloader fetches official FRP release assets from GitHub. External links open in your browser.

Those providers receive ordinary network request information, including the requesting public IP, subject to their policies. Ember does not make their services private or anonymous.

When enabled for an online server, a personal tunnel connects directly to the VPS host you configured. The VPS can see your connection's source IP. Players see/use the public game address you share. No Ember-operated intermediary is involved.

## Credentials and trust boundaries

VPS tokens are encrypted using Electron `safeStorage` under the current Windows account. This protects storage; it does not protect against malware or another process already controlling your account. At runtime the token must be available to the FRP child process and is supplied via its environment.

Temporary client config files refer to an environment-variable template and a public certificate, not a plaintext token. Tunnel logs redact the configured token. Do not assume this automatically removes secrets inserted by other applications or every kind of personal information.

**Exported `frps.toml` contains the token in plaintext by design.** The app warns before exporting it. Keep it private and use a trusted channel to transfer it to the VPS. Never import the VPS's private TLS key into Ember.

TLS authenticates/encrypts the PC-to-VPS transport. The VPS terminates this tunnel and its administrator can observe forwarded traffic. Ember does not guarantee end-to-end secrecy between players and the PC for arbitrary Minecraft configurations.

## Safe support reports

Share only the minimum relevant excerpt. Remove tokens, passwords, private keys, public/private IPs, hostnames you want kept private, usernames and paths, player identifiers, webhooks and other plugin credentials. Never attach an entire `Dati` folder or server export to a public issue.
