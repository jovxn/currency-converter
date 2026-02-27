// ── Currency Parsing, API, Cache & Storage ──────────────────────

CurrencyExt.parseCurrency = function(text) {
  if (!text) return null;

  var SYMBOL_MAP = CurrencyExt.SYMBOL_MAP;
  var CODES = CurrencyExt.CODES;
  var WORD_MAP = CurrencyExt.WORD_MAP;
  var CODE_TO_SYMBOL = CurrencyExt.CODE_TO_SYMBOL;
  var defaultCurrency = CurrencyExt.defaultCurrency;

  var clean = text.trim().replace(/\s+/g, ' ');
  var currency = null;
  var amountStr = null;

  // Multi-char symbols first
  var multiSymbols = ['US$', 'HK$', 'A$', 'S$', 'RM'];
  for (var i = 0; i < multiSymbols.length; i++) {
    if (clean.includes(multiSymbols[i])) {
      currency = SYMBOL_MAP[multiSymbols[i]];
      amountStr = clean.replace(multiSymbols[i], '').trim();
      break;
    }
  }

  // ISO codes
  if (!currency) {
    var codeMatch = clean.match(new RegExp('\\b(' + CODES.join('|') + ')\\b', 'i'));
    if (codeMatch) {
      currency = codeMatch[1].toUpperCase();
      amountStr = clean.replace(codeMatch[0], '').trim();
    }
  }

  // Single-char symbols
  if (!currency) {
    var singleSymbols = ['€', '£', '¥', '₩', '฿', '₹', '$'];
    for (var j = 0; j < singleSymbols.length; j++) {
      if (clean.includes(singleSymbols[j])) {
        currency = SYMBOL_MAP[singleSymbols[j]];
        amountStr = clean.replace(singleSymbols[j], '').trim();
        break;
      }
    }
  }

  // Word forms
  if (!currency) {
    var lower = clean.toLowerCase();
    for (var word in WORD_MAP) {
      if (lower.includes(word)) {
        currency = WORD_MAP[word];
        amountStr = lower.replace(word, '').trim();
        break;
      }
    }
  }

  if (!currency) return null;

  if (!amountStr) amountStr = clean;
  var numMatch = amountStr.match(/[\d,]+\.?\d*/);
  if (!numMatch) return null;

  var amount = parseFloat(numMatch[0].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be greater than zero.' };
  }

  if (currency === defaultCurrency) {
    var sym = CODE_TO_SYMBOL[defaultCurrency] || defaultCurrency;
    return { error: 'Already in ' + defaultCurrency + ': ' + sym + amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) };
  }

  return { amount: amount, currency: currency, original: clean };
};

// ── API Key Storage ─────────────────────────────────────────────

CurrencyExt.getApiKey = async function() {
  var data = await chrome.storage.local.get('apiKey');
  return data.apiKey || null;
};

CurrencyExt.saveApiKey = async function(key) {
  await chrome.storage.local.set({ apiKey: key.trim() });
};

// ── Rate Cache ──────────────────────────────────────────────────

CurrencyExt.getCachedRate = async function(from, to) {
  var key = 'rate_' + from + '_' + to;
  var data = await chrome.storage.local.get(key);
  var entry = data[key];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CurrencyExt.cacheTTL) return null;
  return entry;
};

CurrencyExt.setCachedRate = async function(from, to, rate, lastUpdated) {
  var key = 'rate_' + from + '_' + to;
  var obj = {};
  obj[key] = { rate: rate, lastUpdated: lastUpdated, cachedAt: Date.now() };
  await chrome.storage.local.set(obj);
};

// ── API Call ────────────────────────────────────────────────────

CurrencyExt.fetchConversion = async function(apiKey, from, to, amount) {
  var url = CurrencyExt.API_BASE + '/' + apiKey + '/pair/' + from + '/' + to + '/' + amount;
  var res = await fetch(url);
  var data = await res.json();

  if (data.result === 'error') {
    var messages = {
      'invalid-key': 'Invalid API key. Check your key in settings.',
      'quota-reached': 'API rate limit reached. Try again later.',
      'unsupported-code': 'Currency "' + from + '" is not supported.',
      'inactive-account': 'API account is inactive.'
    };
    throw new Error(messages[data['error-type']] || 'API error: ' + data['error-type']);
  }

  return {
    convertedAmount: data.conversion_result,
    rate: data.conversion_rate,
    lastUpdated: data.time_last_update_utc
  };
};
