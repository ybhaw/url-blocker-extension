document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const blockedUrl = params.get('url') || 'Unknown';
  const pattern = params.get('pattern') || 'Unknown';

  document.getElementById('blocked-url').textContent = blockedUrl;
  document.getElementById('matched-pattern').textContent = pattern;

  document.getElementById('go-back').addEventListener('click', () => {
    history.back();
  });

  document.getElementById('manage-patterns').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
