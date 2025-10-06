# Security Policy

## Supported Versions
The project is in early development. Security-related fixes will be released as patch versions (e.g., 0.2.x).

## Reporting a Vulnerability
Please open a private security advisory or contact the maintainer via GitHub security advisories. Avoid publicly disclosing potential vulnerabilities before a fix is available.

## Threat Model
The extension runs as a content script scoped only to ChatGPT domains. Primary risks considered:
- DOM structure changes leading to errors (handled via defensive access and graceful returns).
- Potential escalation via prototype pollution or unexpected enumerable keys when scanning element properties (we only check keys starting with `__reactFiber$`).
- Performance degradation from excessive DOM polling (mitigated by debounced observer + reduced interval).

Out of scope:
- Network-level attacks (extension makes no outbound requests itself).
- Data exfiltration (no code for transmission exists; reviewable in `content.js`).

## Secure Development Practices
- No dynamic code execution (`eval`, `new Function`) is used.
- No external script injection or CDN dependencies.
- Minimal permission surface (only `storage`).
- Clear separation of user preference logic from DOM traversal.

## Future Improvements
- Add CSP documentation if migrating to MV3 service worker or adding UI pages beyond options.
- Add automated static analysis (e.g., ESLint security rules) in CI.
- Consider integrity hashing for any future bundled assets (currently none required).
