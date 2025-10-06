# ChatGPT Timestamp Extension - Privacy & Security

## Overview
This browser extension augments the ChatGPT web interface by displaying human-readable timestamps for messages. It operates entirely within the user's browser process.

## Data Handling Principles
- No network requests are initiated by the extension beyond those already performed by the ChatGPT website itself.
- No telemetry, analytics, tracking pixels, or third-party scripts are used.
- No chat content, metadata, or identifiers are transmitted off-device.
- Only a single user preference (time format) is stored using `chrome.storage.local` / WebExtension storage.
- No personally identifiable information (PII) is collected, derived, or inferred.
- The extension does not use cookies, localStorage, or external storage beyond the preference key.

## Stored Data
| Key | Scope | Purpose | Contents |
| --- | ----- | ------- | -------- |
| `chatgpt_timestamp_preferences_v1` | Local (per-browser profile) | Remember user-selected time format | `{ timeFormat: "auto" | "12h" | "24h" }` |

## Permissions Justification
| Permission | Reason |
| ---------- | ------ |
| `storage` | Persist the user's chosen time format (12h/24h/auto). |

No other permissions (e.g., `tabs`, `activeTab`, `scripting`, `webRequest`) are required or requested.

## Security Considerations
- Operates as a `content_script` restricted to `https://chat.openai.com/*` and `https://chatgpt.com/*`.
- Does not inject remote code or eval arbitrary strings.
- Uses defensive checks when traversing internal page structures (React fiber keys) and fails silently if structure changes.
- Adds only a simple `<span>` element containing formatted time text.
- Avoids excessive DOM mutation by debouncing via `requestIdleCallback` or timeouts.
- Limits periodic scanning to every 10 seconds to reduce overhead.

## Future Hardening Recommendations
- Consider feature gating for any future added functionality (e.g., export) with explicit user consent dialogs.
- Maintain a clear changelog for any new permissions (none planned currently).
- Add unit tests for timestamp formatting logic (e.g., with Jest) if logic complexity grows.

## Contact
Issues or concerns can be raised via the repository's issue tracker.
