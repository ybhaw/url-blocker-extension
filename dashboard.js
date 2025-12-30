document.addEventListener('DOMContentLoaded', () => {
  // State
  let patterns = [];
  let whitelist = [];
  let currentTab = 'patterns';
  let searchQuery = '';

  // DOM Elements - Tabs
  const patternsTab = document.getElementById('patterns-tab');
  const whitelistTab = document.getElementById('whitelist-tab');
  const patternsSection = document.getElementById('patterns-section');
  const whitelistSection = document.getElementById('whitelist-section');

  // DOM Elements - Patterns
  const patternsList = document.getElementById('patterns-list');
  const addPatternInput = document.getElementById('add-pattern-input');
  const addPatternBtn = document.getElementById('add-pattern-btn');
  const patternSearch = document.getElementById('pattern-search');
  const patternCount = document.getElementById('pattern-count');

  // DOM Elements - Whitelist
  const whitelistList = document.getElementById('whitelist-list');
  const addWhitelistInput = document.getElementById('add-whitelist-input');
  const addWhitelistBtn = document.getElementById('add-whitelist-btn');
  const whitelistSearch = document.getElementById('whitelist-search');
  const whitelistCount = document.getElementById('whitelist-count');

  // DOM Elements - Actions
  const importBtn = document.getElementById('import-btn');
  const exportBtn = document.getElementById('export-btn');
  const importFile = document.getElementById('import-file');
  const statusMsg = document.getElementById('status-msg');

  // ReDoS detection patterns
  const dangerousPatterns = [
    /\([^)]*\+[^)]*\)\+/,
    /\([^)]*\*[^)]*\)\+/,
    /\([^)]*\+[^)]*\)\*/,
    /\([^)]*\*[^)]*\)\*/,
    /\([^)]*\|[^)]*\)\+/,
    /\.[\*\+]\.\*[\*\+]/,
    /\([^)]+\)\{[\d,]+\}\+/,
  ];

  // Initialize
  loadData();

  // Tab switching
  patternsTab.addEventListener('click', () => switchTab('patterns'));
  whitelistTab.addEventListener('click', () => switchTab('whitelist'));

  function switchTab(tab) {
    currentTab = tab;
    if (tab === 'patterns') {
      patternsTab.classList.add('active');
      whitelistTab.classList.remove('active');
      patternsSection.style.display = 'block';
      whitelistSection.style.display = 'none';
    } else {
      whitelistTab.classList.add('active');
      patternsTab.classList.remove('active');
      whitelistSection.style.display = 'block';
      patternsSection.style.display = 'none';
    }
  }

  // Load data from storage
  function loadData() {
    chrome.storage.sync.get(['patterns', 'whitelist'], (result) => {
      // Normalize patterns to object format
      patterns = (result.patterns || []).map(p => {
        if (typeof p === 'string') {
          return { pattern: p, enabled: true };
        }
        return { pattern: p.pattern, enabled: p.enabled !== false };
      });

      whitelist = (result.whitelist || []).map(p => {
        if (typeof p === 'string') {
          return { pattern: p, enabled: true };
        }
        return { pattern: p.pattern, enabled: p.enabled !== false };
      });

      renderPatterns();
      renderWhitelist();
    });
  }

  // Validate pattern
  function validatePattern(pattern) {
    if (!pattern || pattern.trim().length === 0) {
      return { valid: false, error: 'Pattern cannot be empty' };
    }

    // Check for dangerous patterns (ReDoS)
    for (const dangerous of dangerousPatterns) {
      if (dangerous.test(pattern)) {
        return {
          valid: false,
          error: 'Pattern may cause performance issues (catastrophic backtracking)'
        };
      }
    }

    // Check nesting depth
    let depth = 0;
    let maxDepth = 0;
    for (const char of pattern) {
      if (char === '(' || char === '[') depth++;
      if (char === ')' || char === ']') depth--;
      maxDepth = Math.max(maxDepth, depth);
    }
    if (maxDepth > 5) {
      return { valid: false, error: 'Pattern is too complex (nesting depth > 5)' };
    }

    // Check length
    if (pattern.length > 500) {
      return { valid: false, error: 'Pattern is too long (max 500 characters)' };
    }

    // Try to compile
    try {
      new RegExp(pattern);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  // Render patterns list
  function renderPatterns() {
    const filtered = patterns.filter(p =>
      !searchQuery || p.pattern.toLowerCase().includes(searchQuery.toLowerCase())
    );

    patternCount.textContent = `${filtered.length} of ${patterns.length} patterns`;

    if (filtered.length === 0) {
      patternsList.innerHTML = `
        <div class="empty-state">
          ${searchQuery ? 'No patterns match your search' : 'No patterns yet. Add one above!'}
        </div>
      `;
      return;
    }

    patternsList.innerHTML = filtered.map((p, idx) => {
      const originalIdx = patterns.indexOf(p);
      const validation = validatePattern(p.pattern);
      const hasWarning = !validation.valid;

      return `
        <div class="pattern-item ${!p.enabled ? 'disabled' : ''} ${hasWarning ? 'has-warning' : ''}" data-index="${originalIdx}">
          <div class="pattern-toggle">
            <input type="checkbox" class="toggle-checkbox" ${p.enabled ? 'checked' : ''} data-action="toggle" data-index="${originalIdx}">
          </div>
          <div class="pattern-content">
            <code class="pattern-text">${escapeHtml(p.pattern)}</code>
            ${hasWarning ? `<span class="pattern-warning" title="${escapeHtml(validation.error)}">Warning: ${escapeHtml(validation.error)}</span>` : ''}
          </div>
          <div class="pattern-actions">
            <button class="btn-icon" data-action="edit" data-index="${originalIdx}" title="Edit">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.5 9.5a.5.5 0 0 1-.168.11l-4 1.5a.5.5 0 0 1-.65-.65l1.5-4a.5.5 0 0 1 .11-.168l9.5-9.5zM11.207 2L2 11.207V12h.793L12.5 2.293 11.207 2z"/>
              </svg>
            </button>
            <button class="btn-icon btn-danger" data-action="delete" data-index="${originalIdx}" title="Delete">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render whitelist
  function renderWhitelist() {
    const filtered = whitelist.filter(p =>
      !searchQuery || p.pattern.toLowerCase().includes(searchQuery.toLowerCase())
    );

    whitelistCount.textContent = `${filtered.length} of ${whitelist.length} entries`;

    if (filtered.length === 0) {
      whitelistList.innerHTML = `
        <div class="empty-state">
          ${searchQuery ? 'No entries match your search' : 'No whitelist entries yet. Add one above!'}
        </div>
      `;
      return;
    }

    whitelistList.innerHTML = filtered.map((p, idx) => {
      const originalIdx = whitelist.indexOf(p);
      const validation = validatePattern(p.pattern);
      const hasWarning = !validation.valid;

      return `
        <div class="pattern-item ${!p.enabled ? 'disabled' : ''} ${hasWarning ? 'has-warning' : ''}" data-index="${originalIdx}">
          <div class="pattern-toggle">
            <input type="checkbox" class="toggle-checkbox" ${p.enabled ? 'checked' : ''} data-action="toggle-whitelist" data-index="${originalIdx}">
          </div>
          <div class="pattern-content">
            <code class="pattern-text">${escapeHtml(p.pattern)}</code>
            ${hasWarning ? `<span class="pattern-warning" title="${escapeHtml(validation.error)}">Warning: ${escapeHtml(validation.error)}</span>` : ''}
          </div>
          <div class="pattern-actions">
            <button class="btn-icon" data-action="edit-whitelist" data-index="${originalIdx}" title="Edit">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.5 9.5a.5.5 0 0 1-.168.11l-4 1.5a.5.5 0 0 1-.65-.65l1.5-4a.5.5 0 0 1 .11-.168l9.5-9.5zM11.207 2L2 11.207V12h.793L12.5 2.293 11.207 2z"/>
              </svg>
            </button>
            <button class="btn-icon btn-danger" data-action="delete-whitelist" data-index="${originalIdx}" title="Delete">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Save patterns to storage
  function savePatterns() {
    chrome.storage.sync.set({ patterns }, () => {
      showStatus('Patterns saved', 'success');
    });
  }

  // Save whitelist to storage
  function saveWhitelist() {
    chrome.storage.sync.set({ whitelist }, () => {
      showStatus('Whitelist saved', 'success');
    });
  }

  // Add pattern
  function addPattern(pattern, list) {
    const validation = validatePattern(pattern);

    if (!validation.valid) {
      showStatus(validation.error, 'error');
      return false;
    }

    // Check for duplicates
    const exists = list.some(p => p.pattern === pattern);
    if (exists) {
      showStatus('Pattern already exists', 'warning');
      return false;
    }

    list.push({ pattern, enabled: true });
    return true;
  }

  // Event delegation for pattern actions
  patternsList.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const index = parseInt(e.target.closest('[data-index]')?.dataset.index, 10);

    if (action === 'toggle') {
      patterns[index].enabled = e.target.checked;
      savePatterns();
      renderPatterns();
    } else if (action === 'delete') {
      if (confirm('Delete this pattern?')) {
        patterns.splice(index, 1);
        savePatterns();
        renderPatterns();
      }
    } else if (action === 'edit') {
      const newPattern = prompt('Edit pattern:', patterns[index].pattern);
      if (newPattern !== null && newPattern !== patterns[index].pattern) {
        const validation = validatePattern(newPattern);
        if (!validation.valid) {
          showStatus(validation.error, 'error');
          return;
        }
        patterns[index].pattern = newPattern;
        savePatterns();
        renderPatterns();
      }
    }
  });

  // Event delegation for whitelist actions
  whitelistList.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const index = parseInt(e.target.closest('[data-index]')?.dataset.index, 10);

    if (action === 'toggle-whitelist') {
      whitelist[index].enabled = e.target.checked;
      saveWhitelist();
      renderWhitelist();
    } else if (action === 'delete-whitelist') {
      if (confirm('Delete this whitelist entry?')) {
        whitelist.splice(index, 1);
        saveWhitelist();
        renderWhitelist();
      }
    } else if (action === 'edit-whitelist') {
      const newPattern = prompt('Edit whitelist entry:', whitelist[index].pattern);
      if (newPattern !== null && newPattern !== whitelist[index].pattern) {
        const validation = validatePattern(newPattern);
        if (!validation.valid) {
          showStatus(validation.error, 'error');
          return;
        }
        whitelist[index].pattern = newPattern;
        saveWhitelist();
        renderWhitelist();
      }
    }
  });

  // Add pattern button
  addPatternBtn.addEventListener('click', () => {
    const pattern = addPatternInput.value.trim();
    if (addPattern(pattern, patterns)) {
      savePatterns();
      renderPatterns();
      addPatternInput.value = '';
    }
  });

  // Add pattern on Enter
  addPatternInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPatternBtn.click();
    }
  });

  // Add whitelist button
  addWhitelistBtn.addEventListener('click', () => {
    const pattern = addWhitelistInput.value.trim();
    if (addPattern(pattern, whitelist)) {
      saveWhitelist();
      renderWhitelist();
      addWhitelistInput.value = '';
    }
  });

  // Add whitelist on Enter
  addWhitelistInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWhitelistBtn.click();
    }
  });

  // Search patterns
  patternSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderPatterns();
  });

  // Search whitelist
  whitelistSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderWhitelist();
  });

  // Export data
  exportBtn.addEventListener('click', () => {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      patterns,
      whitelist
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `url-blocker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showStatus(`Exported ${patterns.length} patterns and ${whitelist.length} whitelist entries`, 'success');
  });

  // Import data
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!data.patterns && !data.whitelist) {
          showStatus('Invalid backup file format', 'error');
          return;
        }

        // Merge or replace?
        const action = confirm(
          'How do you want to import?\n\n' +
          'OK = Merge with existing patterns\n' +
          'Cancel = Replace all patterns'
        );

        if (action) {
          // Merge
          const newPatterns = (data.patterns || []).filter(p => {
            const pattern = typeof p === 'string' ? p : p.pattern;
            return !patterns.some(existing => existing.pattern === pattern);
          }).map(p => typeof p === 'string' ? { pattern: p, enabled: true } : p);

          const newWhitelist = (data.whitelist || []).filter(p => {
            const pattern = typeof p === 'string' ? p : p.pattern;
            return !whitelist.some(existing => existing.pattern === pattern);
          }).map(p => typeof p === 'string' ? { pattern: p, enabled: true } : p);

          patterns = [...patterns, ...newPatterns];
          whitelist = [...whitelist, ...newWhitelist];

          showStatus(`Imported ${newPatterns.length} new patterns and ${newWhitelist.length} whitelist entries`, 'success');
        } else {
          // Replace
          patterns = (data.patterns || []).map(p =>
            typeof p === 'string' ? { pattern: p, enabled: true } : p
          );
          whitelist = (data.whitelist || []).map(p =>
            typeof p === 'string' ? { pattern: p, enabled: true } : p
          );

          showStatus(`Replaced with ${patterns.length} patterns and ${whitelist.length} whitelist entries`, 'success');
        }

        savePatterns();
        saveWhitelist();
        renderPatterns();
        renderWhitelist();
      } catch (err) {
        showStatus('Failed to parse backup file: ' + err.message, 'error');
      }
    };

    reader.readAsText(file);
    importFile.value = ''; // Reset for next import
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save (though auto-save is on)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      savePatterns();
      saveWhitelist();
    }

    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportBtn.click();
    }

    // Ctrl/Cmd + I to import
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      importBtn.click();
    }
  });

  // Helper functions
  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = 'status-msg ' + type;
    setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
    }, 3000);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
