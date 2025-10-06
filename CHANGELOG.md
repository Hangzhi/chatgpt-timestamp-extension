# Changelog

## 0.2.1
- Security: Removed `world: "MAIN"` from Chrome MV3 manifest to run in isolated world and reduce attack surface.
- Version bump across manifests (Chrome & Firefox) to reflect security hardening.

## 0.2.0
- Added options page with selectable time format: Auto (locale-based), 12h, 24h.
- Implemented locale detection for default hour cycle.
- Added privacy & security documentation (`PRIVACY.md`, `SECURITY.md`).
- Reduced polling frequency and added debounced MutationObserver for performance.
- Hardened DOM traversal with defensive checks.
- Added Firefox (Manifest V2) variant manifest.
- Added storage permission (for preferences only).

## 0.1.0
- Initial release adding timestamps to ChatGPT messages.
