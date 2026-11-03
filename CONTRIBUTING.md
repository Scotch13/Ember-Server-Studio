# Contributing

Thank you for helping improve Ember Server Studio.

1. Read the [build/test guide](docs/BUILDING.md) and open an issue for substantial changes.
2. Work on a branch and keep changes focused. Preserve the five supported UI languages, both themes, keyboard access and integrated confirmations.
3. Test using an isolated temporary data directory. Never use someone else's real worlds as fixtures or kill their Java processes.
4. Run unit tests and the relevant isolated GUI tests. Report platform/tool requirements and any tests you could not run.
5. Submit a pull request describing the behavior, tests and limitations. Use sanitized fixtures/screenshots only.

Never commit user data, credentials, exported FRP configs, private keys, personal IP addresses, local test-path records, dependency folders or generated app packages. Keep external downloads pinned and verified where the upstream provider publishes hashes. Do not add telemetry, remote control or centrally operated hosting implicitly.

Security reports belong in the process described in [SECURITY.md](SECURITY.md), not public issues. Contributions are under the existing MIT license for original project code; preserve upstream attributions and licenses.
