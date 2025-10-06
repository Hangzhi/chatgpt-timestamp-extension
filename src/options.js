(function() {
  const PREF_KEY = 'chatgpt_timestamp_preferences_v1';
  const form = document.getElementById('prefsForm');
  const statusEl = document.getElementById('status');

  function load() {
    chrome.storage.local.get(PREF_KEY, data => {
      const prefs = data[PREF_KEY] || { timeFormat: 'auto' };
      const el = form.querySelector(`input[name=timeFormat][value=${prefs.timeFormat}]`);
      if (el) el.checked = true;
    });
  }

  function save() {
    const value = form.querySelector('input[name=timeFormat]:checked')?.value || 'auto';
    chrome.storage.local.set({ [PREF_KEY]: { timeFormat: value } }, () => {
      statusEl.classList.add('visible');
      setTimeout(() => statusEl.classList.remove('visible'), 1200);
    });
  }

  form.addEventListener('change', save);
  load();
})();
