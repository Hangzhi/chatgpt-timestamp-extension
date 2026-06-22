// Wrapped in an IIFE so the declarations below are function-scoped. If the
// script is injected more than once into the same page (duplicate install or
// SPA re-injection), top-level `let`s would otherwise collide in the shared
// MAIN world and throw "Identifier ... has already been declared".
(function () {
const initializationKey = Symbol.for('chatgpt-timestamp-extension.initialized');
if (window[initializationKey]) return;
window[initializationKey] = true;

let use24HourFormat = localStorage.getItem('chatgpt-timestamps-24h-format') !== 'false';
let useUserOnlyTimestamps = localStorage.getItem('chatgpt-timestamps-user-only') !== 'false';

function getMessageFromReactFiber(element) {
  const reactKey = Object.keys(element).find(key => key.startsWith('__reactFiber$'));
  if (!reactKey) return;

  let node = element[reactKey];
  for (let i = 0; i < 15 && node; i++) {
    const messages = node.memoizedProps?.messages;
    if (messages?.[0]?.create_time) return messages[0];
    node = node.return;
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const format = number => number.toString().padStart(2, '0');

  if (use24HourFormat) {
    return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} - ${format(date.getHours())}:${format(date.getMinutes())}:${format(date.getSeconds())}`;
  }

  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} - ${hours}:${format(date.getMinutes())}:${format(date.getSeconds())} ${ampm}`;
}

function createTimestampSpan(timestamp) {
  const span = document.createElement('span');
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const color = isDark ? '#ccc' : '#555';

  span.textContent = formatTimestamp(timestamp);
  span.className = 'chatgpt-timestamp';
  span.dir = 'ltr';
  span.style.cssText = `
    font-size: 11px;
    color: ${color};
    font-weight: 600;
    margin-inline-end: 8px;
    margin-bottom: 4px;
    display: inline-block;
    unicode-bidi: isolate;
    font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  `;
  return span;
}

function addTimestamp(container, messageDiv) {
  if (container.dataset.timestampAdded) return;

  const message = getMessageFromReactFiber(messageDiv);
  if (!message?.create_time) return;
  if (useUserOnlyTimestamps && message.author?.role !== 'user') return;

  messageDiv.insertBefore(createTimestampSpan(message.create_time), messageDiv.firstChild);
  container.dataset.timestampAdded = 'true';
}

function addTimestamps() {
  const turnContainers = document.querySelectorAll('section[data-turn-id]');

  if (turnContainers.length > 0) {
    turnContainers.forEach(section => {
      if (section.dataset.timestampAdded) return;

      const messageDiv = section.querySelector('div[data-message-id]');
      if (!messageDiv) return;

      addTimestamp(section, messageDiv);
    });
    return;
  }

  document.querySelectorAll('div[data-message-id]').forEach(div => {
    addTimestamp(div, div);
  });
}

function updateTimestamps() {
  document.querySelectorAll('.chatgpt-timestamp').forEach(span => span.remove());
  document.querySelectorAll('section[data-turn-id]').forEach(section => {
    delete section.dataset.timestampAdded;
  });
  document.querySelectorAll('div[data-message-id]').forEach(div => {
    delete div.dataset.timestampAdded;
  });
  addTimestamps();
}

// Listen for storage changes
window.addEventListener('storage', (e) => {
  if (e.key === 'chatgpt-timestamps-24h-format') {
    use24HourFormat = e.newValue !== 'false';
    updateTimestamps();
    return;
  }
  if (e.key === 'chatgpt-timestamps-user-only') {
    useUserOnlyTimestamps = e.newValue === 'true';
    updateTimestamps();
  }
});

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
})();
