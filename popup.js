document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const siteUrl = document.getElementById('site-url');
  const blockDomainBtn = document.getElementById('block-domain');
  const blockSubdomainBtn = document.getElementById('block-subdomain');
  const blockUrlBtn = document.getElementById('block-url');
  const whitelistBtn = document.getElementById('whitelist-btn');
  const domainPreview = document.getElementById('domain-preview');
  const subdomainPreview = document.getElementById('subdomain-preview');
  const urlPreview = document.getElementById('url-preview');
  const statusMsg = document.getElementById('status-msg');
  const openDashboardBtn = document.getElementById('open-dashboard');

  // Toggle and pause elements
  const enableToggle = document.getElementById('enable-toggle');
  const toggleLabel = document.getElementById('toggle-label');
  const pauseSelect = document.getElementById('pause-select');
  const pauseStatus = document.getElementById('pause-status');

  // Stats elements
  const statToday = document.getElementById('stat-today');
  const statTotal = document.getElementById('stat-total');
  const statPatterns = document.getElementById('stat-patterns');

  let currentUrl = null;
  let currentDomain = null;
  let currentSubdomain = null;
  let extensionStatus = null;

  // Extended list of two-part TLDs
  const twoPartTlds = new Set([
    // UK
    'co.uk',
    'org.uk',
    'me.uk',
    'ac.uk',
    'gov.uk',
    'ltd.uk',
    'plc.uk',
    'net.uk',
    'sch.uk',
    // Australia
    'com.au',
    'net.au',
    'org.au',
    'edu.au',
    'gov.au',
    'asn.au',
    'id.au',
    // New Zealand
    'co.nz',
    'net.nz',
    'org.nz',
    'govt.nz',
    'ac.nz',
    'school.nz',
    'geek.nz',
    'gen.nz',
    // Japan
    'co.jp',
    'or.jp',
    'ne.jp',
    'ac.jp',
    'ad.jp',
    'ed.jp',
    'go.jp',
    'gr.jp',
    'lg.jp',
    // Brazil
    'com.br',
    'net.br',
    'org.br',
    'gov.br',
    'edu.br',
    'art.br',
    'blog.br',
    // India
    'co.in',
    'net.in',
    'org.in',
    'gen.in',
    'firm.in',
    'ind.in',
    'ac.in',
    'edu.in',
    'res.in',
    'gov.in',
    // South Africa
    'co.za',
    'net.za',
    'org.za',
    'gov.za',
    'edu.za',
    'ac.za',
    // Russia
    'com.ru',
    'net.ru',
    'org.ru',
    'pp.ru',
    // Germany
    'com.de',
    // France
    'com.fr',
    // South Korea
    'co.kr',
    'ne.kr',
    'or.kr',
    'go.kr',
    're.kr',
    'pe.kr',
    // China
    'com.cn',
    'net.cn',
    'org.cn',
    'gov.cn',
    'edu.cn',
    'ac.cn',
    // Taiwan
    'com.tw',
    'net.tw',
    'org.tw',
    'edu.tw',
    'gov.tw',
    'idv.tw',
    // Hong Kong
    'com.hk',
    'net.hk',
    'org.hk',
    'edu.hk',
    'gov.hk',
    'idv.hk',
    // Singapore
    'com.sg',
    'net.sg',
    'org.sg',
    'edu.sg',
    'gov.sg',
    'per.sg',
    // Malaysia
    'com.my',
    'net.my',
    'org.my',
    'edu.my',
    'gov.my',
    // Indonesia
    'co.id',
    'or.id',
    'ac.id',
    'go.id',
    'web.id',
    'sch.id',
    // Thailand
    'co.th',
    'in.th',
    'ac.th',
    'go.th',
    'or.th',
    'net.th',
    // Vietnam
    'com.vn',
    'net.vn',
    'org.vn',
    'edu.vn',
    'gov.vn',
    'biz.vn',
    // Philippines
    'com.ph',
    'net.ph',
    'org.ph',
    'edu.ph',
    'gov.ph',
    // Mexico
    'com.mx',
    'net.mx',
    'org.mx',
    'edu.mx',
    'gob.mx',
    // Argentina
    'com.ar',
    'net.ar',
    'org.ar',
    'edu.ar',
    'gov.ar',
    'int.ar',
    // Colombia
    'com.co',
    'net.co',
    'org.co',
    'edu.co',
    'gov.co',
    // Chile
    'cl',
    // Peru
    'com.pe',
    'net.pe',
    'org.pe',
    'edu.pe',
    'gob.pe',
    // Turkey
    'com.tr',
    'net.tr',
    'org.tr',
    'edu.tr',
    'gov.tr',
    'biz.tr',
    // Israel
    'co.il',
    'net.il',
    'org.il',
    'ac.il',
    'gov.il',
    // UAE
    'ae',
    // Saudi Arabia
    'com.sa',
    'net.sa',
    'org.sa',
    'edu.sa',
    'gov.sa',
    // Egypt
    'com.eg',
    'net.eg',
    'org.eg',
    'edu.eg',
    'gov.eg',
    // Nigeria
    'com.ng',
    'net.ng',
    'org.ng',
    'edu.ng',
    'gov.ng',
    // Kenya
    'co.ke',
    'or.ke',
    'ne.ke',
    'go.ke',
    'ac.ke',
    // Pakistan
    'com.pk',
    'net.pk',
    'org.pk',
    'edu.pk',
    'gov.pk',
    // Bangladesh
    'com.bd',
    'net.bd',
    'org.bd',
    'edu.bd',
    'gov.bd',
    // European
    'co.at',
    'or.at',
    'co.it',
    'co.nl',
    'co.be',
    'co.no',
    'co.se',
    'co.dk',
    'co.fi',
    // Other common ones
    'com.ua',
    'com.pl',
    'com.gr',
    'com.pt',
    'com.es',
    'com.ro',
    'com.cz',
    'com.hu',
  ]);

  // Initialize popup
  init().catch((e) => console.error('Failed to initialize popup:', e));

  async function init() {
    // Get extension status
    try {
      extensionStatus = await chrome.runtime.sendMessage({ type: 'getStatus' });
      updateStatusUI();
    } catch (e) {
      console.error('Failed to get status:', e);
    }

    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = tabs[0].url;

        // Check if it's a valid URL we can block
        if (isInternalUrl(url)) {
          siteUrl.textContent = 'Cannot block browser pages';
          disableBlockButtons();
          return;
        }

        try {
          const urlObj = new URL(url);
          currentUrl = url;
          currentSubdomain = urlObj.hostname;
          currentDomain = extractRootDomain(urlObj.hostname);

          siteUrl.textContent = truncate(url, 50);
          domainPreview.textContent = currentDomain;
          subdomainPreview.textContent = currentSubdomain;
          urlPreview.textContent = truncate(url, 35);

          // Hide subdomain button if same as domain
          if (currentDomain === currentSubdomain) {
            blockSubdomainBtn.style.display = 'none';
          }

          // Check if URL is already blocked or whitelisted
          checkCurrentUrlStatus();
        } catch {
          siteUrl.textContent = 'Invalid URL';
          disableBlockButtons();
        }
      } else {
        siteUrl.textContent = 'No active tab';
        disableBlockButtons();
      }
    });
  }

  function updateStatusUI() {
    if (!extensionStatus) return;

    // Update toggle
    enableToggle.checked = extensionStatus.enabled;
    updateToggleLabel();

    // Update stats
    if (statToday) statToday.textContent = extensionStatus.stats?.blockedToday || 0;
    if (statTotal) statTotal.textContent = extensionStatus.stats?.blockedTotal || 0;
    if (statPatterns) statPatterns.textContent = extensionStatus.patternCount || 0;

    // Update pause status
    updatePauseStatus();
  }

  function updateToggleLabel() {
    if (extensionStatus?.pauseUntil && Date.now() < extensionStatus.pauseUntil) {
      toggleLabel.textContent = 'Paused';
      toggleLabel.className = 'toggle-label paused';
    } else if (enableToggle.checked) {
      toggleLabel.textContent = 'Active';
      toggleLabel.className = 'toggle-label active';
    } else {
      toggleLabel.textContent = 'Disabled';
      toggleLabel.className = 'toggle-label disabled';
    }
  }

  function updatePauseStatus() {
    if (!extensionStatus?.pauseUntil || Date.now() >= extensionStatus.pauseUntil) {
      pauseStatus.textContent = '';
      pauseStatus.style.display = 'none';
      pauseSelect.value = '';
      return;
    }

    const remaining = extensionStatus.pauseUntil - Date.now();
    const minutes = Math.ceil(remaining / 60000);

    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      pauseStatus.textContent = `Paused for ${hours}h ${minutes % 60}m`;
    } else {
      pauseStatus.textContent = `Paused for ${minutes}m`;
    }
    pauseStatus.style.display = 'block';
  }

  async function checkCurrentUrlStatus() {
    if (!currentUrl) return;

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'checkUrl',
        url: currentUrl,
      });

      if (result.whitelisted) {
        showStatus('This site is whitelisted', 'info');
        if (whitelistBtn) {
          whitelistBtn.textContent = 'Remove from Whitelist';
          whitelistBtn.classList.add('whitelisted');
        }
      }
    } catch (e) {
      console.error('Failed to check URL status:', e);
    }
  }

  // Event Listeners
  enableToggle.addEventListener('change', async () => {
    try {
      await chrome.runtime.sendMessage({
        type: 'toggleEnabled',
        enabled: enableToggle.checked,
      });
      extensionStatus.enabled = enableToggle.checked;
      updateToggleLabel();
      showStatus(enableToggle.checked ? 'Blocking enabled' : 'Blocking disabled', 'success');
    } catch (e) {
      console.error('Failed to toggle:', e);
      showStatus('Failed to toggle', 'error');
    }
  });

  pauseSelect.addEventListener('change', async () => {
    const value = pauseSelect.value;
    if (!value) return;

    try {
      if (value === 'resume') {
        await chrome.runtime.sendMessage({ type: 'resume' });
        extensionStatus.pauseUntil = null;
        showStatus('Blocking resumed', 'success');
      } else {
        const duration = parseInt(value, 10) * 60 * 1000; // Convert minutes to ms
        const result = await chrome.runtime.sendMessage({
          type: 'pauseFor',
          duration,
        });
        extensionStatus.pauseUntil = result.pauseUntil;
        showStatus(`Paused for ${value} minutes`, 'success');
      }
      updateToggleLabel();
      updatePauseStatus();
    } catch (e) {
      console.error('Failed to pause:', e);
      showStatus('Failed to pause', 'error');
    }

    // Reset select after a short delay
    setTimeout(() => {
      pauseSelect.value = '';
    }, 100);
  });

  blockDomainBtn.addEventListener('click', () => {
    if (currentDomain) {
      const pattern = `.*${escapeRegex(currentDomain)}.*`;
      addPattern(pattern, `Domain "${currentDomain}" blocked`);
    }
  });

  blockSubdomainBtn.addEventListener('click', () => {
    if (currentSubdomain) {
      const pattern = `.*${escapeRegex(currentSubdomain)}.*`;
      addPattern(pattern, `Subdomain "${currentSubdomain}" blocked`);
    }
  });

  blockUrlBtn.addEventListener('click', () => {
    if (currentUrl) {
      const pattern = `^${escapeRegex(currentUrl)}$`;
      addPattern(pattern, 'URL blocked');
    }
  });

  if (whitelistBtn) {
    whitelistBtn.addEventListener('click', () => {
      if (currentDomain) {
        const pattern = `.*${escapeRegex(currentDomain)}.*`;
        addWhitelistPattern(pattern, `Domain "${currentDomain}" whitelisted`);
      }
    });
  }

  openDashboardBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Helper Functions
  function addPattern(pattern, successMsg) {
    chrome.storage.sync.get(['patterns'], (result) => {
      const patterns = result.patterns || [];

      // Check for existing pattern (support both string and object format)
      const exists = patterns.some((p) => (typeof p === 'string' ? p : p.pattern) === pattern);

      if (exists) {
        showStatus('Pattern already exists', 'warning');
        return;
      }

      patterns.push(pattern);
      chrome.storage.sync.set({ patterns }, () => {
        showStatus(successMsg, 'success');
        // Update pattern count
        if (statPatterns && extensionStatus) {
          extensionStatus.patternCount++;
          statPatterns.textContent = extensionStatus.patternCount;
        }
      });
    });
  }

  function addWhitelistPattern(pattern, successMsg) {
    chrome.storage.sync.get(['whitelist'], (result) => {
      const whitelist = result.whitelist || [];

      const exists = whitelist.some((p) => (typeof p === 'string' ? p : p.pattern) === pattern);

      if (exists) {
        showStatus('Already whitelisted', 'warning');
        return;
      }

      whitelist.push(pattern);
      chrome.storage.sync.set({ whitelist }, () => {
        showStatus(successMsg, 'success');
        if (whitelistBtn) {
          whitelistBtn.textContent = 'Remove from Whitelist';
          whitelistBtn.classList.add('whitelisted');
        }
      });
    });
  }

  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = 'status ' + type;
    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status';
    }, 2500);
  }

  function disableBlockButtons() {
    blockDomainBtn.disabled = true;
    blockSubdomainBtn.disabled = true;
    blockUrlBtn.disabled = true;
    if (whitelistBtn) whitelistBtn.disabled = true;
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function extractRootDomain(hostname) {
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;

    // Check for two-part TLDs
    const lastTwo = parts.slice(-2).join('.');
    if (twoPartTlds.has(lastTwo)) {
      return parts.slice(-3).join('.');
    }

    return parts.slice(-2).join('.');
  }

  function truncate(str, maxLen) {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }

  function isInternalUrl(url) {
    return (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:') ||
      url.startsWith('edge://') ||
      url.startsWith('brave://') ||
      url.startsWith('moz-extension://')
    );
  }
});
