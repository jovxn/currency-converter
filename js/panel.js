// ── Panel UI, Events, Settings, Conversion ──────────────────────

(function() {
  var host = null;
  var shadow = null;
  var panel = null;
  var lastSelectedText = '';
  var manualDebounce = null;

  // ── DOM helpers ───────────────────────────────────────────────

  function $(id) {
    return shadow.getElementById(id);
  }

  var stateIds = ['state-setup', 'state-empty', 'state-loading', 'state-success', 'state-error'];

  function showState(id) {
    stateIds.forEach(function(s) {
      var el = $(s);
      if (el) el.classList.remove('active');
    });
    var target = $(id);
    if (target) target.classList.add('active');
  }

  // ── Dropdown Builder ──────────────────────────────────────────

  function buildDropdownOptions(selectedCode) {
    return CurrencyExt.CODES.map(function(code) {
      var name = CurrencyExt.CURRENCY_NAMES[code] || code;
      var sel = code === selectedCode ? ' selected' : '';
      return '<option value="' + code + '"' + sel + '>' + code + ' - ' + name + '</option>';
    }).join('');
  }

  // ── Panel Creation ────────────────────────────────────────────

  function createPanel() {
    if (host) return;

    host = document.createElement('div');
    host.id = 'currency-sgd-ext';
    shadow = host.attachShadow({ mode: 'closed' });

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles/panel.css');
    shadow.appendChild(link);

    panel = document.createElement('div');
    panel.className = 'panel hidden';
    panel.innerHTML =
      '<div class="title-bar" id="title-bar">' +
        '<span class="title-text">CURRENCY CONVERTER</span>' +
        '<button class="close-btn" id="close-btn">\u00d7</button>' +
      '</div>' +
      '<div class="tab-bar" id="tab-bar">' +
        '<button class="tab active" id="tab-btn-auto">Auto</button>' +
        '<button class="tab" id="tab-btn-manual">Manual</button>' +
      '</div>' +
      '<div class="content" id="main-content">' +
        '<div id="tab-auto" class="tab-content active">' +
          '<div id="state-setup" class="state">' +
            '<div class="icon-large">\ud83d\udd11</div>' +
            '<p>Enter your ExchangeRate-API key to get started.</p>' +
            '<input type="password" id="api-key-input" class="input-field" placeholder="Paste your API key">' +
            '<button id="save-key-btn" class="btn">Save Key</button>' +
            '<p class="hint">Get a free key at <a href="https://www.exchangerate-api.com" target="_blank">exchangerate-api.com</a></p>' +
          '</div>' +
          '<div id="state-empty" class="state">' +
            '<div class="icon-large">\ud83d\udccb</div>' +
            '<p>Highlight currency text on the page, then click the extension icon.</p>' +
          '</div>' +
          '<div id="state-loading" class="state">' +
            '<div class="spinner"></div>' +
            '<p>Converting\u2026</p>' +
          '</div>' +
          '<div id="state-success" class="state">' +
            '<div class="result-box">' +
              '<div class="result-original" id="result-original"></div>' +
              '<div class="result-converted" id="result-converted"></div>' +
              '<div class="result-rate" id="result-rate"></div>' +
              '<div class="cached-badge" id="cached-badge" style="display:none">cached rate</div>' +
            '</div>' +
            '<button id="copy-btn" class="btn btn-outline" style="margin-top:4px">Copy Result</button>' +
          '</div>' +
          '<div id="state-error" class="state">' +
            '<div class="icon-large">\u26a0\ufe0f</div>' +
            '<p class="error-msg" id="error-message"></p>' +
            '<button id="retry-btn" class="btn btn-outline">Try Again</button>' +
          '</div>' +
        '</div>' +
        '<div id="tab-manual" class="tab-content">' +
          '<div class="manual-form">' +
            '<input type="text" id="manual-amount" class="input-field" placeholder="Enter amount" autocomplete="off">' +
            '<div class="manual-row">' +
              '<label class="manual-label">From</label>' +
              '<select id="manual-from" class="select-field">' +
                buildDropdownOptions('USD') +
              '</select>' +
            '</div>' +
            '<button class="swap-btn" id="swap-btn" title="Swap currencies">\u21c5</button>' +
            '<div class="manual-row">' +
              '<label class="manual-label">To</label>' +
              '<select id="manual-to" class="select-field">' +
                buildDropdownOptions('SGD') +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div id="manual-result" class="manual-result" style="display:none">' +
            '<div class="result-box">' +
              '<div class="result-original" id="manual-result-original"></div>' +
              '<div class="result-converted" id="manual-result-converted"></div>' +
              '<div class="result-rate" id="manual-result-rate"></div>' +
              '<div class="cached-badge" id="manual-cached-badge" style="display:none">cached rate</div>' +
            '</div>' +
          '</div>' +
          '<div id="manual-loading" style="display:none; text-align:center; padding:10px 0;">' +
            '<div class="spinner" style="margin:0 auto"></div>' +
          '</div>' +
          '<div id="manual-error" style="display:none; text-align:center;">' +
            '<p class="error-msg" id="manual-error-msg"></p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="settings-view" id="settings-view">' +
        '<button class="settings-back" id="settings-back">\u2190 Settings</button>' +
        '<div class="settings-group">' +
          '<label class="settings-label">API Key</label>' +
          '<div class="input-with-icon">' +
            '<input type="password" id="settings-api-key" class="input-field" placeholder="Paste your API key">' +
            '<button class="eye-toggle" id="eye-toggle" title="Show/hide key">\ud83d\udc41</button>' +
          '</div>' +
          '<p class="hint">Get a free key at <a href="https://www.exchangerate-api.com" target="_blank">exchangerate-api.com</a></p>' +
        '</div>' +
        '<div class="settings-group">' +
          '<label class="settings-label">Default Currency</label>' +
          '<select id="settings-default-currency" class="select-field">' +
            buildDropdownOptions('SGD') +
          '</select>' +
        '</div>' +
        '<div class="settings-group">' +
          '<label class="settings-label">Cache Duration</label>' +
          '<select id="settings-cache-duration" class="select-field">' +
            '<option value="1800000">30 minutes</option>' +
            '<option value="3600000" selected>1 hour</option>' +
            '<option value="21600000">6 hours</option>' +
            '<option value="86400000">24 hours</option>' +
          '</select>' +
        '</div>' +
        '<div class="settings-group">' +
          '<label class="settings-label">Theme</label>' +
          '<select id="settings-theme" class="select-field">' +
            '<option value="dark" selected>Dark</option>' +
            '<option value="light">Light</option>' +
          '</select>' +
        '</div>' +
        '<button class="btn btn-save" id="save-settings-btn">Save Settings</button>' +
        '<p class="settings-saved" id="settings-saved">Settings saved!</p>' +
      '</div>' +
      '<div class="panel-footer">' +
        '<span class="footer-text" id="footer-text">Rates via ExchangeRate-API</span>' +
        '<button class="settings-btn" id="settings-btn" title="Settings">\u2699\ufe0f</button>' +
      '</div>';

    shadow.appendChild(panel);
    document.body.appendChild(host);

    setupDrag();
    setupEvents();
    setupManual();
    loadSettings();
  }

  // ── Tab Switching ─────────────────────────────────────────────

  function switchTab(tabName) {
    var autoBtn = $('tab-btn-auto');
    var manualBtn = $('tab-btn-manual');
    var autoContent = $('tab-auto');
    var manualContent = $('tab-manual');

    if (tabName === 'auto') {
      autoBtn.classList.add('active');
      manualBtn.classList.remove('active');
      autoContent.classList.add('active');
      manualContent.classList.remove('active');
    } else {
      manualBtn.classList.add('active');
      autoBtn.classList.remove('active');
      manualContent.classList.add('active');
      autoContent.classList.remove('active');
    }
  }

  // ── Settings View ─────────────────────────────────────────────

  function showSettings() {
    $('tab-bar').style.display = 'none';
    $('main-content').style.display = 'none';
    $('settings-view').classList.add('active');
    $('settings-saved').style.display = 'none';

    CurrencyExt.getApiKey().then(function(key) {
      if (key) $('settings-api-key').value = key;
    });
    $('settings-default-currency').value = CurrencyExt.defaultCurrency;
    $('settings-cache-duration').value = String(CurrencyExt.cacheTTL);
    $('settings-theme').value = CurrencyExt.currentTheme;
  }

  function hideSettings() {
    $('settings-view').classList.remove('active');
    $('tab-bar').style.display = '';
    $('main-content').style.display = '';
  }

  async function loadSettings() {
    var data = await chrome.storage.local.get(['defaultCurrency', 'cacheDuration', 'theme']);
    if (data.defaultCurrency) CurrencyExt.defaultCurrency = data.defaultCurrency;
    if (data.cacheDuration) CurrencyExt.cacheTTL = parseInt(data.cacheDuration, 10);
    if (data.theme) CurrencyExt.currentTheme = data.theme;
    applyTheme(CurrencyExt.currentTheme);
  }

  async function saveSettingsHandler() {
    var apiKey = $('settings-api-key').value.trim();
    var newDefault = $('settings-default-currency').value;
    var newCache = $('settings-cache-duration').value;
    var newTheme = $('settings-theme').value;

    var toSave = {
      defaultCurrency: newDefault,
      cacheDuration: parseInt(newCache, 10),
      theme: newTheme
    };
    if (apiKey) toSave.apiKey = apiKey;
    await chrome.storage.local.set(toSave);

    CurrencyExt.defaultCurrency = newDefault;
    CurrencyExt.cacheTTL = parseInt(newCache, 10);
    CurrencyExt.currentTheme = newTheme;
    applyTheme(newTheme);

    var saved = $('settings-saved');
    saved.style.display = 'block';
    setTimeout(function() { saved.style.display = 'none'; }, 2000);
  }

  function applyTheme(theme) {
    panel.classList.remove('theme-dark', 'theme-light');
    panel.classList.add('theme-' + theme);
  }

  // ── Dragging ──────────────────────────────────────────────────

  function setupDrag() {
    var titleBar = $('title-bar');
    var isDragging = false;
    var offsetX = 0;
    var offsetY = 0;

    titleBar.addEventListener('mousedown', function(e) {
      if (e.target.closest('.close-btn')) return;
      isDragging = true;
      var rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      panel.style.left = (e.clientX - offsetX) + 'px';
      panel.style.top = (e.clientY - offsetY) + 'px';
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', function() {
      isDragging = false;
    });
  }

  // ── Event Listeners ───────────────────────────────────────────

  function setupEvents() {
    $('close-btn').addEventListener('click', function() {
      panel.classList.add('hidden');
    });

    $('tab-btn-auto').addEventListener('click', function() { switchTab('auto'); });
    $('tab-btn-manual').addEventListener('click', function() { switchTab('manual'); });

    $('save-key-btn').addEventListener('click', async function() {
      var key = $('api-key-input').value.trim();
      if (!key) return;
      await CurrencyExt.saveApiKey(key);
      convert(lastSelectedText);
    });

    $('retry-btn').addEventListener('click', function() { convert(lastSelectedText); });

    $('settings-btn').addEventListener('click', function() { showSettings(); });
    $('settings-back').addEventListener('click', function() { hideSettings(); });

    $('eye-toggle').addEventListener('click', function() {
      var input = $('settings-api-key');
      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      $('eye-toggle').textContent = isPassword ? '\ud83d\ude48' : '\ud83d\udc41';
    });

    $('save-settings-btn').addEventListener('click', function() { saveSettingsHandler(); });

    $('copy-btn').addEventListener('click', async function() {
      var text = $('result-converted').textContent;
      await navigator.clipboard.writeText(text);
      $('copy-btn').textContent = 'Copied!';
      setTimeout(function() { $('copy-btn').textContent = 'Copy Result'; }, 1500);
    });
  }

  // ── Manual Converter ──────────────────────────────────────────

  function setupManual() {
    var amountInput = $('manual-amount');
    var fromSelect = $('manual-from');
    var toSelect = $('manual-to');
    var swapBtn = $('swap-btn');

    function triggerManual() {
      clearTimeout(manualDebounce);
      manualDebounce = setTimeout(function() { manualConvert(); }, 500);
    }

    amountInput.addEventListener('input', triggerManual);
    fromSelect.addEventListener('change', triggerManual);
    toSelect.addEventListener('change', triggerManual);

    swapBtn.addEventListener('click', function() {
      var fromVal = fromSelect.value;
      var toVal = toSelect.value;
      fromSelect.value = toVal;
      toSelect.value = fromVal;
      manualConvert();
    });
  }

  async function manualConvert() {
    var amountRaw = $('manual-amount').value.trim();
    var from = $('manual-from').value;
    var to = $('manual-to').value;

    var resultDiv = $('manual-result');
    var loadingDiv = $('manual-loading');
    var errorDiv = $('manual-error');

    resultDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    if (!amountRaw) return;

    var amount = parseFloat(amountRaw.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      $('manual-error-msg').textContent = 'Enter a valid positive number.';
      errorDiv.style.display = 'block';
      return;
    }

    if (from === to) {
      $('manual-result-original').textContent = from + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
      $('manual-result-converted').textContent = to + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      $('manual-result-rate').textContent = '1 ' + from + ' = 1 ' + to;
      $('manual-cached-badge').style.display = 'none';
      resultDiv.style.display = 'block';
      return;
    }

    var apiKey = await CurrencyExt.getApiKey();
    if (!apiKey) {
      switchTab('auto');
      showState('state-setup');
      return;
    }

    loadingDiv.style.display = 'block';

    try {
      var cached = await CurrencyExt.getCachedRate(from, to);
      if (cached) {
        var converted = amount * cached.rate;
        showManualResult(from, to, amount, converted, cached.rate, cached.lastUpdated, true);
        return;
      }

      var result = await CurrencyExt.fetchConversion(apiKey, from, to, amount);
      await CurrencyExt.setCachedRate(from, to, result.rate, result.lastUpdated);
      showManualResult(from, to, amount, result.convertedAmount, result.rate, result.lastUpdated, false);
    } catch (err) {
      loadingDiv.style.display = 'none';
      $('manual-error-msg').textContent = err.message || 'Conversion failed.';
      errorDiv.style.display = 'block';
    }
  }

  function showManualResult(from, to, amount, converted, rate, lastUpdated, isCached) {
    $('manual-loading').style.display = 'none';
    $('manual-result-original').textContent = from + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
    $('manual-result-converted').textContent = to + ' ' + converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    $('manual-result-rate').textContent = '1 ' + from + ' = ' + rate + ' ' + to;
    $('footer-text').textContent = 'Updated: ' + (lastUpdated || 'just now');

    $('manual-cached-badge').style.display = isCached ? 'inline-block' : 'none';
    $('manual-result').style.display = 'block';
  }

  // ── Display (auto mode) ───────────────────────────────────────

  function displayResult(original, currency, amount, convertedAmount, rate, lastUpdated, isCached) {
    var targetSym = CurrencyExt.CODE_TO_SYMBOL[CurrencyExt.defaultCurrency] || CurrencyExt.defaultCurrency + ' ';
    $('result-original').textContent = currency + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
    $('result-converted').textContent = targetSym + ' ' + convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    $('result-rate').textContent = '1 ' + currency + ' = ' + rate + ' ' + CurrencyExt.defaultCurrency;
    $('footer-text').textContent = 'Updated: ' + (lastUpdated || 'just now');

    $('cached-badge').style.display = isCached ? 'inline-block' : 'none';
    showState('state-success');
  }

  function displayError(msg) {
    $('error-message').textContent = msg;
    showState('state-error');
  }

  // ── Main Auto Conversion Flow ────────────────────────────────

  async function convert(selectedText) {
    var apiKey = await CurrencyExt.getApiKey();
    if (!apiKey) {
      showState('state-setup');
      return;
    }

    if (!selectedText) {
      showState('state-empty');
      return;
    }

    showState('state-loading');

    var parsed = CurrencyExt.parseCurrency(selectedText);
    if (!parsed) {
      displayError("Couldn't detect a currency \u2014 try highlighting just the amount and currency.");
      return;
    }
    if (parsed.error) {
      displayError(parsed.error);
      return;
    }

    var amount = parsed.amount;
    var currency = parsed.currency;
    var target = CurrencyExt.defaultCurrency;

    try {
      var cached = await CurrencyExt.getCachedRate(currency, target);
      if (cached) {
        var convertedAmount = amount * cached.rate;
        displayResult(selectedText, currency, amount, convertedAmount, cached.rate, cached.lastUpdated, true);
        return;
      }

      var result = await CurrencyExt.fetchConversion(apiKey, currency, target, amount);
      await CurrencyExt.setCachedRate(currency, target, result.rate, result.lastUpdated);
      displayResult(selectedText, currency, amount, result.convertedAmount, result.rate, result.lastUpdated, false);
    } catch (err) {
      displayError(err.message || 'Conversion failed. Check your connection.');
    }
  }

  // ── Expose to main.js ────────────────────────────────────────

  CurrencyExt.createPanel = createPanel;
  CurrencyExt.switchTab = switchTab;
  CurrencyExt.hideSettings = hideSettings;
  CurrencyExt.convert = convert;
  CurrencyExt.setLastSelectedText = function(text) { lastSelectedText = text; };
  CurrencyExt.getPanel = function() { return panel; };
  CurrencyExt.getAutoTab = function() { return $('tab-auto'); };

})();
