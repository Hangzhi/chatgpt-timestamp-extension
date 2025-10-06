# Build Artifacts

This folder (and subfolders) can host prepared manifests or packaged zips for different browsers.

## Firefox
Firefox currently requires Manifest V2. A compatible `manifest.json` is placed under `build/firefox/`. Copy the shared files (`content.js`, `options.html`, `options.js`, `PRIVACY.md`) and provide an `icon.png` when packaging.

## Chrome
Uses Manifest V3 from `src/manifest.json`. Load the `src/` directory as an unpacked extension.

## Packaging Steps
Manual quick steps:
1. Chrome: `zip -r chatgpt-timestamp-chrome.zip src/*`
2. Firefox: create a folder containing: `content.js`, `options.html`, `options.js`, `manifest.json`, `icon.png`, then zip it.

A future improvement could add a Node-based build script for hashing/version bumping.
