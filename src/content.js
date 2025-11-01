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
    const formatted = `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} - ${format(date.getHours())}:${format(date.getMinutes())}:${format(date.getSeconds())}`;

    const span = document.createElement('span');
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const color = isDark ? '#ccc' : '#555';
    span.textContent = formatted;
    span.style.cssText = `
      font-size: 11px;
      color: ${color};
      font-weight: 600;
      margin-right: 8px;
      margin-bottom: 4px;
      display: inline-block;
      font-family: ui-monospace, 'SF Mono', Monaco, monospace;
    `;
    div.insertBefore(span, div.firstChild);

    // Mark as processed
    div.dataset.timestampAdded = 'true';
  });
}

// Wait for page to fully load
setTimeout(() => {
  addTimestamps();
}, 3000);

const observer = new MutationObserver(() => {
  setTimeout(addTimestamps, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Also run periodically to catch any missed messages
setInterval(addTimestamps, 5000);