# Publishing and release checklist

## Repository versus release files

Keep source, documentation, tests, lockfile and license notices in Git. Keep generated Windows bundles/ZIPs in **GitHub Releases**, not Git history. GitHub blocks ordinary Git files above 100 MiB; each release asset must be below 2 GiB. Neither limit makes a large binary appropriate for source control.

Generated FRP and RAM-helper EXEs are ignored; their pinned origin/manifest or source is tracked. Users who want the app should download the named Windows ZIP asset, not the automatically generated source archives.

## Before pushing

- Inspect `git status`, `git diff --cached` and the full staged path list. `.gitignore` does not protect files already tracked and is not a secret scanner.
- Never include `Dati`, worlds, backups, logs, server exports, `vps.json`, exported `frps.toml`, `.env`, private keys, TLS certificates from real deployments or local test-path records.
- Review screenshots and documentation for personal IPs, paths, player data, hostnames and credentials. Use reserved example names/addresses only.
- Check licenses and retain Electron/Chromium, FRP and other required notices.
- Use a GitHub-provided noreply email if you do not want a personal email in commit metadata.
- Preserve existing history; do not force-push just to import a project.
- Pin GitHub Actions to reviewed commit SHAs, grant minimum permissions and never run untrusted pull-request code with publishing secrets.

## Validation

```powershell
npm ci
npm run prepare-assets
npm test
npm audit --omit=dev
npm audit
npm run package
```

Run relevant UI checks in isolated fixtures, then packaged checks on a clean test account/VM. Build warnings, known dependency advisories and unexecuted checks must be disclosed rather than hidden. Do not apply `npm audit fix --force` blindly.

As of the initial public release, updating Packager to 20.3.0 removed the reported high-severity build-tool advisories. The dependency audit still reports **five moderate development-only entries** through ASAR/glob/minimatch; they are not five independent production vulnerabilities. Production-dependency audit reports zero. Review upstream fixes and rerun audits on every release; this is a dated result, not a permanent guarantee.

The personal tunnel's complete forwarding test remains unverified because the local test relay was blocked by antivirus. Keep that caveat in the README and release notes until an authorized, controlled VPS test actually succeeds.

## Release artifact safety

1. Stop test instances normally. Never kill production servers to overwrite an EXE.
2. Build the Windows app from the reviewed commit with the locked dependencies.
3. Inspect the app folder: no user data, configs with secrets or screenshots.
4. Preserve all Electron/Chromium license files and include project/FRP notices and setup documentation.
5. Run `node tools/create-release.js`; inspect the ZIP entry list and verify its SHA-256 manifest.
6. Publish a version tag and a GitHub Release with English notes, the Windows ZIP and its checksum manifest. Do not claim the build is signed or independently audited.
7. Verify the public release links, artifact sizes/checksums and CI result after publishing.
8. Enable dependency alerts, secret scanning/push protection and private vulnerability reporting where available. These supplement, not replace, manual checks. Never rotate or change the user's real credentials as a side effect of publishing.

If a secret is ever published, **revoke/rotate it first**, then coordinate cleanup of Git history and any release assets. Deleting a file in a later commit is not enough.

## Official references consulted

- [Adding locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [Ignoring files](https://docs.github.com/en/get-started/git-basics/ignoring-files)
- [Large files on GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [Releases and asset limits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning)
- [Secure use of GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
