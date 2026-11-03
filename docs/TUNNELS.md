# Personal VPS tunnels

> **Experimental:** Ember's UI, TLS checks and official FRP client configuration have been tested, but a full end-to-end relay test has not been completed. Windows antivirus blocked the local `frps` test process. No antivirus exclusions or security bypasses were used. Verify forwarding with your own VPS and a player on another network before relying on it.

## How it works

```text
Friend's Minecraft client → your public VPS → authenticated TLS tunnel → Ember PC → local Minecraft server
```

Only the VPS owner needs to install/configure the relay. Friends enter `public-host:public-port` directly in Minecraft Java; they need no FRP client. Ember includes the official **FRP 0.71.1 Windows x64 client (`frpc`)** and manages a hidden client process per enabled online server.

Ember does not provide a relay, provision a VPS, SSH into it, open its firewall, register accounts or charge for hosting. **You pay for and administer your own VPS.** The PC, Minecraft server, Ember, relay and Internet connections must stay running. Home router port forwarding is not required for this outbound tunnel, but outbound access and the VPS firewall still matter.

## Requirements

- A Linux VPS with a public address, sufficient bandwidth and administrator access.
- FRP **0.71.1** server (`frps`), built for that VPS's architecture.
- A public DNS name pointing to the VPS, or a stable public IP.
- A TLS certificate with a matching **Subject Alternative Name (SAN)** and its private key kept on the VPS.
- A public certificate/CA PEM file transferred to the Ember PC through a trusted channel.
- A strong shared token: Ember accepts 32–128 characters using letters, digits, `-` and `_`, and can generate one for you.
- One TCP control port (example `7000`) and one distinct public TCP game port per server (examples `25565`, `25566`). Public game ports must be 1024–65535.

All domains and ports in this guide are examples, not live project infrastructure. Replace `tunnel.example.net` with your own name. Use IPv4 for the sample configuration; IPv6-only deployments require appropriate bind addresses, DNS and firewall changes on the VPS.

## 1. Install the official relay

Get the matching archive from the [official FRP 0.71.1 release](https://github.com/fatedier/frp/releases/tag/v0.71.1). Check `uname -m`: a typical x86_64 VPS uses `linux_amd64`; an ARM64 VPS uses `linux_arm64`. **Do not use an amd64 binary on ARM64.** Verify the SHA-256 of the correct upstream asset before extracting it.

For **Linux amd64 only**, the pinned archive checksum is:

```text
frp_0.71.1_linux_amd64.tar.gz
1d9875210972a5d1a62b2dc4c48df45ab0af05d3ca1b5e494a014428259df803
```

Example after downloading that specific archive into a trusted working directory:

```bash
printf '%s  %s\n' \
  '1d9875210972a5d1a62b2dc4c48df45ab0af05d3ca1b5e494a014428259df803' \
  'frp_0.71.1_linux_amd64.tar.gz' | sha256sum --check
tar -xzf frp_0.71.1_linux_amd64.tar.gz
sudo install -o root -g root -m 755 frp_0.71.1_linux_amd64/frps /usr/local/bin/frps
```

Stop if verification fails. Do not run an unverified archive or disable security software to make it run. For another architecture, use its own upstream checksum, not the one above.

## 2. Prepare TLS on the VPS

The following Debian/Ubuntu-style example creates a dedicated user and a self-signed certificate pinned by importing its public part into Ember. If the user already exists, reuse it. Other distributions may use a different `nologin` path.

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin frp
sudo install -d -o root -g frp -m 750 /etc/frp
sudo openssl req -x509 -newkey rsa:3072 -sha256 -days 365 -nodes \
  -keyout /etc/frp/server.key \
  -out /etc/frp/server.crt \
  -subj '/CN=tunnel.example.net' \
  -addext 'subjectAltName=DNS:tunnel.example.net'
sudo chown root:frp /etc/frp/server.key /etc/frp/server.crt
sudo chmod 640 /etc/frp/server.key /etc/frp/server.crt
```

For an IP instead of DNS, use `subjectAltName=IP:YOUR_ACTUAL_IP`; `DNS:IP` is not equivalent. A publicly trusted CA certificate is also possible: provide the correct public trust chain and keep its private key on the VPS.

Transfer **only `server.crt` or the public CA PEM** to your PC through an authenticated channel, such as SCP with a verified SSH host key. **Never transfer `server.key` to Ember or to players.** Check that the certificate belongs to the VPS you intended to trust. Plan for expiration, renewal and updating the trusted certificate in Ember.

## 3. Configure Ember

Open **VPS and tunnels** in the sidebar. UI names below refer to the English language setting.

| Field | Example / purpose |
| --- | --- |
| VPS host | `tunnel.example.net`, without `https://` or a port. |
| FRP control port | `7000`; must match `frps.toml`. |
| Public Minecraft host | Address players use, normally the VPS domain/IP. An optional separate DNS name must point to the same relay. |
| TLS certificate name | DNS name or IP covered by the certificate SAN, e.g. `tunnel.example.net`. |
| VPS token | Generate a new secret or enter the token configured on your relay. |
| Public PEM certificate | Import the public certificate/CA from step 2. No private keys. |

Click **Save VPS**. The token is protected using the current Windows account. Leave the token field blank on future saves to keep the stored token. Moving to another computer or account requires re-entering the token; copying the encrypted settings alone is not a portable credential backup.

Disable existing tunnels before changing VPS credentials/settings. Ember does not automatically change the VPS when you save locally.

## 4. Opt in for each server

Open a Minecraft server and select **Tunnel**:

1. Choose a unique **Public Minecraft port**, such as `25565`.
2. Enable **Enable tunnel for this server**, save and accept the exposure confirmation.
3. Leave other servers disabled unless you explicitly want them exposed.

Each enabled server needs a different public port, and it must not equal the control port. Local Minecraft ports can differ from public relay ports. If the server is offline, Ember saves the preference and waits; it does not start Java or the tunnel by itself.

## 5. Export and install `frps.toml`

Enable the desired per-server ports **before exporting**, so the allowlist contains them. Return to **VPS and tunnels → Export frps.toml** and accept the warning.

> **The exported file contains the shared token in plaintext.** Do not attach it to an issue, publish it on GitHub, put it in a public cloud folder or share it with players. Anyone with the token may attempt to use the relay's allowed ports.

Transfer the export through a trusted channel, then install it on the VPS:

```bash
sudo install -o root -g frp -m 640 /path/to/uploaded/frps.toml /etc/frp/frps.toml
sudo -u frp /usr/local/bin/frps verify -c /etc/frp/frps.toml
```

Use your real upload path. The generated configuration requires TLS, uses `/etc/frp/server.crt` and `/etc/frp/server.key`, limits public ports with `allowPorts`, limits each client to one public port and does not enable a web administration listener. Do not weaken it by enabling an admin dashboard or a wide public port range.

If there are no enabled servers at export time, the template defaults to `25565`; this is not a substitute for explicitly choosing allowed ports. Delete unnecessary export copies securely according to your storage policy. Regenerate the token if it has been exposed.

## 6. Run as a non-root service

Create `/etc/systemd/system/frps.service`:

```ini
[Unit]
Description=Personal FRP relay for Minecraft
After=network-online.target
Wants=network-online.target

[Service]
User=frp
Group=frp
ExecStart=/usr/local/bin/frps -c /etc/frp/frps.toml
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now frps
sudo systemctl status frps
sudo journalctl -u frps -n 100
```

Keep the private key/config readable by the dedicated service group but not other users. Do not run the relay as root merely to work around permissions. The example uses ports above 1023, so no privileged-port capability is needed.

## 7. Open only the necessary VPS ports

Allow the TCP control port and **only** the chosen public Minecraft ports in both the VPS OS firewall and the provider's security group/firewall. Preserve your existing SSH administration access. If your home public IP is stable, restrict access to the control port to that address. Keep the game ports reachable by the intended players.

Do not disable either firewall. Firewall syntax varies, so review your existing rules before changing them. Nothing in this guide requires publishing SSH keys, an RCON port, a web admin panel or the entire PC network.

Whenever you add/change a public game port, update the exported `allowPorts`, install the updated file, verify it, adjust the firewalls and restart `frps` manually:

```bash
sudo -u frp /usr/local/bin/frps verify -c /etc/frp/frps.toml
sudo systemctl restart frps
```

Restarting the relay can disconnect existing players. Plan changes accordingly.

## 8. Verify and invite friends

1. Save all Ember settings before testing.
2. **Verify TLS** confirms that the configured endpoint presents a trusted certificate with the expected name. **It does not verify the token, port allowlist or public Minecraft access.**
3. Start the Minecraft server in Ember and wait for **Online**.
4. Open **Tunnel** and wait for **Tunnel active**. An address can be displayed before the tunnel is ready.
5. Copy the public address and ask a friend on another network to connect from Minecraft Java with the correct version/mods.

For IPv6 addresses, the Minecraft host/port format is `[address]:port`. Public DNS/IPv4 is generally simpler for friends with varied connectivity.

### Status meanings

| Status | Meaning |
| --- | --- |
| Disabled | This server has not opted in. |
| VPS not configured | VPS settings/token are missing or unreadable. |
| Waiting for the server | Enabled, but local Minecraft is offline. |
| Connecting | The hidden client is starting/connecting. |
| Tunnel active | FRP reported successful proxy startup. Still test actual player access. |
| Reconnecting | The client reported a connection/proxy problem and is retrying. |
| Tunnel error | Startup/configuration/integrity/process failure; review logs. |

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| TLS probe fails | VPS host/control port, DNS, firewall, running relay, clock, certificate validity, SAN and trusted public certificate/CA. Do not bypass verification. |
| TLS works but tunnel does not | Matching token, FRP versions, relay logs, `allowPorts`, duplicated public port or a port already used on the VPS. |
| Tunnel waits indefinitely | Minecraft must actually reach Online, not merely Starting. Check its own console. |
| Active but players cannot join | Public DNS and game-port firewalls, provider rules, local Minecraft target, version/mod compatibility, whitelist/authentication and address/port shared with the friend. |
| Credentials stop working after moving the app/data | Re-enter the token under the new Windows account/computer. |
| Antivirus blocks a client or test relay | Stop, check the official origin/checksum and detection, and investigate through your security vendor. Do not disable protection or add broad exclusions. |

Use **Show tunnel logs** plus `journalctl -u frps` on the VPS. Redact hostnames/IPs and any secrets before sharing log excerpts. Ember redacts the configured token, but that is not a general-purpose anonymizer.

## Security and operational limits

- Keep `online-mode=true`, enable a whitelist and keep regular offline/off-site backups.
- TCP only; UDP voice-chat/mod ports are not forwarded by this feature.
- The VPS terminates the TLS tunnel. Its administrator can observe forwarded traffic.
- This is not DDoS protection or a guarantee of anonymity, uptime or unlimited bandwidth.
- An exposed Minecraft port is publicly reachable according to your firewall rules; a secret relay token is not player authentication.
- Closing Ember or stopping Minecraft stops its tunnel. There is no unattended Windows service.
- Update FRP intentionally on both sides and review upstream security notices. Do not replace the pinned client with an arbitrary executable; integrity checks will reject it.
- Manage costs, renew certificates, monitor the relay and keep your VPS OS patched. Ember performs none of these remote maintenance tasks.

FRP is an independent upstream project: [source](https://github.com/fatedier/frp), Apache-2.0 [license](../assets/frp/LICENSE.txt), pinned client [manifest](../assets/frp/manifest.json).
