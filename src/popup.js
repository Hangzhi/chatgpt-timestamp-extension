document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleTimestamp');

  // Get current state by injecting a script to read localStorage
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.url?.includes('chat.openai.com') || tab.url?.includes('chatgpt.com')) {
    // Get current state from the page
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => localStorage.getItem('chatgpt-timestamps-24h-format') !== 'false'
    });
    toggle.checked = result[0]?.result ?? true;
  } else {
    // Default to true (24-hour format) if not on ChatGPT
    toggle.checked = true;
  }

  // Handle toggle changes
  toggle.addEventListener('change', async (e) => {
    const use24Hour = e.target.checked;

    // Update only the current active tab (activeTab permission)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.url?.includes('chat.openai.com') || tab.url?.includes('chatgpt.com')) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (is24Hour) => {
          localStorage.setItem('chatgpt-timestamps-24h-format', is24Hour);
          // Trigger storage event manually for same-page update
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'chatgpt-timestamps-24h-format',
            newValue: String(is24Hour),
            url: window.location.href
          }));
        },
        args: [use24Hour]
      });
    }
  });
});