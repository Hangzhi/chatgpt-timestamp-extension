document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleTimestamp');
  const userOnlyToggle = document.getElementById('toggleUserOnly');

  // Get current state by injecting a script to read localStorage
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.url?.includes('chat.openai.com') || tab.url?.includes('chatgpt.com')) {
    // Get current state from the page
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        use24HourFormat: localStorage.getItem('chatgpt-timestamps-24h-format') !== 'false',
        useUserOnlyTimestamps: localStorage.getItem('chatgpt-timestamps-user-only') === 'true'
      })
    });
    toggle.checked = result[0]?.result?.use24HourFormat ?? true;
    userOnlyToggle.checked = result[0]?.result?.useUserOnlyTimestamps ?? false;
  } else {
    // Default to true (24-hour format) if not on ChatGPT
    toggle.checked = true;
    userOnlyToggle.checked = false;
  }

  // Handle all toggle events
  document.addEventListener('change', async (e) => {
    if (e.target.id !== 'toggleTimestamp' && e.target.id !== 'toggleUserOnly') return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.url?.includes('chat.openai.com') || tab.url?.includes('chatgpt.com')) {
      const key = e.target.id === 'toggleTimestamp' ? 'chatgpt-timestamps-24h-format' : 'chatgpt-timestamps-user-only';
      const value = e.target.checked;

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (storageKey, storageValue) => {
          localStorage.setItem(storageKey, storageValue);
          // Trigger storage event manually for same-page update
          window.dispatchEvent(new StorageEvent('storage', {
            key: storageKey,
            newValue: String(storageValue),
            url: window.location.href
          }));
        },
        args: [key, value]
      });
    }
  });
});
