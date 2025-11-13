let use24HourFormat = localStorage.getItem('chatgpt-timestamps-24h-format') !== 'false';

function addTimestamps() {
  document.querySelectorAll('div[data-message-id]').forEach(div => {
    // Skip if already has timestamp
    if (div.dataset.timestampAdded) return;

    const reactKey = Object.keys(div).find(k => k.startsWith('__reactFiber$'));
    if (!reactKey) return;

    const fiber = div[reactKey];
    const messages = fiber?.return?.memoizedProps?.messages;
    const timestamp = messages?.[0]?.create_time;
    if (!timestamp) return;

    const date = new Date(timestamp * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const format = n => n.toString().padStart(2, '0');

    let formatted;
    if (use24HourFormat) {
      formatted = `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} - ${format(date.getHours())}:${format(date.getMinutes())}:${format(date.getSeconds())}`;
    } else {
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      formatted = `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} - ${hours}:${format(date.getMinutes())}:${format(date.getSeconds())} ${ampm}`;
    }

    const span = document.createElement('span');
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const color = isDark ? '#ccc' : '#555';
    span.textContent = formatted;
    span.className = 'chatgpt-timestamp';
    span.style.cssText = `
      font-size: 11px;
      color: ${color};
      font-weight: 600;
      margin-right: 8px;
      margin-bottom: 4px;
      display: inline-block;
      font-family: ui-monospace, 'SF Mono', Monaco, monospace;
      user-select: text;
    `;
    div.insertBefore(span, div.firstChild);

    // Mark as processed
    div.dataset.timestampAdded = 'true';
  }

function updateTimestamps() {
  // Remove all existing timestamps
  document.querySelectorAll('.chatgpt-timestamp').forEach(span => span.remove());
  document.querySelectorAll('div[data-message-id]').forEach(div => {
    delete div.dataset.timestampAdded;
  });
  // Re-add with new format
  addTimestamps();
}

// Listen for storage changes
window.addEventListener('storage', (e) => {
  if (e.key === 'chatgpt-timestamps-24h-format') {
    use24HourFormat = e.newValue !== 'false';
    updateTimestamps();
  }
});

// Wait for page to fully load
setTimeout(() => {
  addTimestamps();
}, 3000);

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