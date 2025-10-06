// ChatGPT Timestamp Content Script
// Privacy & Security Considerations:
// - No network requests are made; all processing is local.
// - Only reads DOM elements already present; does not exfiltrate data.
// - Stores only minimal user preference (time format) via chrome.storage.local.
// - Does not log message contents.

(function() {
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const PREF_KEY = 'chatgpt_timestamp_preferences_v1';
  let userPrefs = { timeFormat: 'auto' }; // auto -> use locale
  let localeUses12h = null;

  function detectLocaleHourCycle() {
    try {
      // Use resolvedOptions hourCycle if available
      const dtf = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
      const opt = dtf.resolvedOptions();
      if (opt.hour12 !== undefined) {
        return opt.hour12; // true -> 12h
      }
      // Fallback heuristic: format a date and see if it contains AM/PM
      const sample = new Date(2000, 0, 1, 13, 0, 0);
      const s = dtf.format(sample).toLowerCase();
      return s.includes('pm');
    } catch (e) {
      return false; // default to 24h if uncertain
    }
  }

  function loadPrefs() {
    if (!chrome?.storage?.local) return Promise.resolve();
    return new Promise(resolve => {
      chrome.storage.local.get(PREF_KEY, data => {
        if (data && data[PREF_KEY]) {
          userPrefs = { ...userPrefs, ...data[PREF_KEY] };
        }
        resolve();
      });
    });
  }

  function savePrefs() {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.set({ [PREF_KEY]: userPrefs });
  }

  function formatTimestamp(epochSeconds) {
    const date = new Date(epochSeconds * 1000);

    const use12hDefault = (localeUses12h === null ? (localeUses12h = detectLocaleHourCycle()) : localeUses12h);
    let use12h;
    switch (userPrefs.timeFormat) {
      case '12h': use12h = true; break;
      case '24h': use12h = false; break;
      default: use12h = use12hDefault; break; // auto
    }

    if (use12h) {
      // 12h formatting with locale for month/day/year ordering but consistent style for time
      const datePart = `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const pad = n => n.toString().padStart(2, '0');
      return `${datePart} - ${hours}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${ampm}`;
    } else {
      const pad = n => n.toString().padStart(2, '0');
      return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
  }

  function processMessageDiv(div) {
    if (!div || div.dataset.timestampAdded) return;
    // Defensive: only operate on expected attribute
    if (!div.hasAttribute('data-message-id')) return;

    let timestamp;
    try {
      const reactKey = Object.keys(div).find(k => k.startsWith('__reactFiber$'));
      if (!reactKey) return;
      const fiber = div[reactKey];
      const messages = fiber?.return?.memoizedProps?.messages;
      timestamp = messages?.[0]?.create_time;
    } catch {
      return; // silently ignore
    }

    if (!timestamp) return;

    const span = document.createElement('span');
    span.textContent = formatTimestamp(timestamp);
    span.className = 'chatgpt-timestamp-label';
    span.style.cssText = `
      font-size: 11px; 
      color: #555; 
      font-weight: 600;
      margin-right: 8px; 
      margin-bottom: 4px;
      display: inline-block;
      font-family: ui-monospace, 'SF Mono', Monaco, monospace;
      user-select: text;
    `;
    div.insertBefore(span, div.firstChild);
    div.dataset.timestampAdded = 'true';
  }

  function addTimestamps() {
    document.querySelectorAll('div[data-message-id]').forEach(processMessageDiv);
  }

  function initObservers() {
    const observer = new MutationObserver(() => {
      // Debounce micro-bursts
      window.requestIdleCallback ? requestIdleCallback(addTimestamps) : setTimeout(addTimestamps, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Periodic catch-up (reduced frequency for efficiency)
    setInterval(addTimestamps, 10000);
  }

  // Initialize
  loadPrefs().then(() => {
    setTimeout(() => {
      addTimestamps();
      initObservers();
    }, 1500);
  });
})();