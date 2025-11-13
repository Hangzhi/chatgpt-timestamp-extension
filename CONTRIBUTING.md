# Contributing

## Development
1. Clone repository.
2. Load the `src/` directory as an unpacked extension in Chrome (MV3).
3. For Firefox, copy `build/firefox/manifest.json` into a temporary directory with `src/content.js`, `src/options.html`, `src/options.js`.

## Coding Guidelines
- Avoid introducing new permissions without updating `PRIVACY.md` and `SECURITY.md`.
- No analytics or telemetry libraries.
- Keep dependencies at zero unless a clear security/privacy benefit.
- Use semantic versioning: MAJOR.MINOR.PATCH.

## Pull Requests
- Reference any related issue.
- Describe security/privacy implications of changes.
- Update `CHANGELOG.md`.

## Reporting Security Issues
Use GitHub private security advisories.
