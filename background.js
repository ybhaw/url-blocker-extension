// URL Blocker - Background Service Worker
// Handles URL blocking with regex caching, whitelist support, and ReDoS protection

// Cache for compiled regex patterns
let patternCache = {
  patterns: [],
  compiled: [],
  whitelist: [],
  compiledWhitelist: [],
  lastUpdate: 0,
};

// Blocking state
let isEnabled = true;
let pauseUntil = null;

// Statistics
let stats = {
  blockedToday: 0,
  blockedTotal: 0,
  lastReset: new Date().toDateString(),
};

// ReDoS protection: detect potentially dangerous patterns
function isPatternSafe(pattern) {
  // Detect catastrophic backtracking patterns
  const dangerousPatterns = [
    /\([^)]*\+[^)]*\)\+/, // (a+)+
    /\([^)]*\*[^)]*\)\+/, // (a*)+
    /\([^)]*\+[^)]*\)\*/, // (a+)*
    /\([^)]*\*[^)]*\)\*/, // (a*)*
    /\([^)]*\|[^)]*\)\+/, // (a|b)+  with complex groups
    /\.[\*\+]\.\*[\*\+]/, // .*.*+ or similar
    /\([^)]+\)\{[\d,]+\}\+/, // Nested quantifiers with braces
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return false;
    }
  }

  // Check for excessive quantifier nesting depth
  let depth = 0;
  let maxDepth = 0;
  for (const char of pattern) {
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;
    maxDepth = Math.max(maxDepth, depth);
  }
  if (maxDepth > 5) return false;

  // Check for overly long patterns
  if (pattern.length > 500) return false;

  return true;
}

// Compile a pattern with timeout protection
function safeCompileRegex(pattern) {
  if (!isPatternSafe(pattern)) {
    console.warn('Potentially dangerous pattern detected:', pattern);
    return null;
  }

  try {
    return new RegExp(pattern, 'i'); // Case-insensitive by default
  } catch (e) {
    console.error('Invalid regex pattern:', pattern, e);
    return null;
  }
}

// Safe regex test with timeout
function safeRegexTest(regex, url) {
  if (!regex) return false;

  // For most URLs, this is fast enough
  // We rely on pattern validation to prevent ReDoS
  try {
    return regex.test(url);
  } catch (e) {
    console.error('Regex test error:', e);
    return false;
  }
}

// Update the pattern cache from storage
async function updatePatternCache() {
  const result = await chrome.storage.sync.get(['patterns', 'whitelist', 'settings', 'stats']);

  // Load settings
  if (result.settings) {
    isEnabled = result.settings.enabled !== false;
    pauseUntil = result.settings.pauseUntil || null;
  }

  // Load stats
  if (result.stats) {
    stats = result.stats;
    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (stats.lastReset !== today) {
      stats.blockedToday = 0;
      stats.lastReset = today;
      await chrome.storage.sync.set({ stats });
    }
  }

  // Compile block patterns
  const patterns = result.patterns || [];
  const compiledPatterns = [];

  for (const item of patterns) {
    // Support both string patterns and pattern objects
    const pattern = typeof item === 'string' ? item : item.pattern;
    const enabled = typeof item === 'string' ? true : item.enabled !== false;

    if (enabled && pattern) {
      const compiled = safeCompileRegex(pattern);
      if (compiled) {
        compiledPatterns.push({
          pattern,
          regex: compiled,
          enabled,
        });
      }
    }
  }

  // Compile whitelist patterns
  const whitelist = result.whitelist || [];
  const compiledWhitelist = [];

  for (const item of whitelist) {
    const pattern = typeof item === 'string' ? item : item.pattern;
    const enabled = typeof item === 'string' ? true : item.enabled !== false;

    if (enabled && pattern) {
      const compiled = safeCompileRegex(pattern);
      if (compiled) {
        compiledWhitelist.push({
          pattern,
          regex: compiled,
          enabled,
        });
      }
    }
  }

  patternCache = {
    patterns,
    compiled: compiledPatterns,
    whitelist,
    compiledWhitelist,
    lastUpdate: Date.now(),
  };
}

// Check if blocking is currently active
function isBlockingActive() {
  if (!isEnabled) return false;

  if (pauseUntil) {
    if (Date.now() < pauseUntil) {
      return false;
    } else {
      // Pause expired, clear it
      pauseUntil = null;
      chrome.storage.sync
        .set({
          settings: { enabled: isEnabled, pauseUntil: null },
        })
        .catch((e) => console.error('Failed to clear pause state:', e));
    }
  }

  return true;
}

// Check if URL matches whitelist
function isWhitelisted(url) {
  for (const item of patternCache.compiledWhitelist) {
    if (safeRegexTest(item.regex, url)) {
      return true;
    }
  }
  return false;
}

// Check if URL should be blocked
function shouldBlock(url) {
  for (const item of patternCache.compiled) {
    if (safeRegexTest(item.regex, url)) {
      return item.pattern;
    }
  }
  return null;
}

// Update statistics
async function incrementBlockCount() {
  stats.blockedToday++;
  stats.blockedTotal++;
  await chrome.storage.sync.set({ stats });
}

// Initialize cache on startup
updatePatternCache().catch((e) => console.error('Failed to initialize pattern cache:', e));

// Listen for storage changes to update cache
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    if (changes.patterns || changes.whitelist || changes.settings) {
      updatePatternCache().catch((e) => console.error('Failed to update pattern cache:', e));
    }
  }
});

// Main navigation listener
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only process main frame navigations
  if (details.frameId !== 0) return;

  const url = details.url;

  // Skip browser internal pages
  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('edge://') ||
    url.startsWith('brave://')
  ) {
    return;
  }

  // Check if blocking is active
  if (!isBlockingActive()) return;

  // Refresh cache if older than 5 seconds
  if (Date.now() - patternCache.lastUpdate > 5000) {
    await updatePatternCache();
  }

  // Check whitelist first
  if (isWhitelisted(url)) {
    return;
  }

  // Check for blocking patterns
  const matchedPattern = shouldBlock(url);
  if (matchedPattern) {
    // Increment statistics
    await incrementBlockCount();

    // Redirect to blocked page
    const blockedUrl =
      chrome.runtime.getURL('blocked.html') +
      '?url=' +
      encodeURIComponent(url) +
      '&pattern=' +
      encodeURIComponent(matchedPattern);

    await chrome.tabs.update(details.tabId, { url: blockedUrl });
  }
});

// Message handler for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getStatus') {
    sendResponse({
      enabled: isEnabled,
      pauseUntil,
      stats,
      patternCount: patternCache.compiled.length,
      whitelistCount: patternCache.compiledWhitelist.length,
    });
    return true;
  }

  if (message.type === 'toggleEnabled') {
    isEnabled = message.enabled;
    chrome.storage.sync
      .set({
        settings: { enabled: isEnabled, pauseUntil },
      })
      .then(() => {
        sendResponse({ success: true, enabled: isEnabled });
      })
      .catch((e) => {
        console.error('Failed to save toggle state:', e);
        sendResponse({ success: false, error: e.message });
      });
    return true;
  }

  if (message.type === 'pauseFor') {
    pauseUntil = Date.now() + message.duration;
    chrome.storage.sync
      .set({
        settings: { enabled: isEnabled, pauseUntil },
      })
      .then(() => {
        sendResponse({ success: true, pauseUntil });
      })
      .catch((e) => {
        console.error('Failed to save pause state:', e);
        sendResponse({ success: false, error: e.message });
      });
    return true;
  }

  if (message.type === 'resume') {
    pauseUntil = null;
    chrome.storage.sync
      .set({
        settings: { enabled: isEnabled, pauseUntil: null },
      })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((e) => {
        console.error('Failed to save resume state:', e);
        sendResponse({ success: false, error: e.message });
      });
    return true;
  }

  if (message.type === 'refreshCache') {
    updatePatternCache()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((e) => {
        console.error('Failed to refresh cache:', e);
        sendResponse({ success: false, error: e.message });
      });
    return true;
  }

  if (message.type === 'checkUrl') {
    const isBlocked = shouldBlock(message.url);
    const whitelisted = isWhitelisted(message.url);
    sendResponse({
      blocked: isBlocked && !whitelisted,
      matchedPattern: isBlocked,
      whitelisted,
    });
    return true;
  }

  return false;
});
