// ── Entry Point: Message Listener & Selection Detection ─────────

(function() {
  // Prevent duplicate injection
  if (window.__currencySgdExtLoaded) return;
  window.__currencySgdExtLoaded = true;

  // ── Auto-convert on new text selection ─────────────────────────

  var lastText = '';

  function setupSelectionListener() {
    document.addEventListener('mouseup', function() {
      var panel = CurrencyExt.getPanel();
      if (!panel || panel.classList.contains('hidden')) return;

      var autoTab = CurrencyExt.getAutoTab();
      if (!autoTab || !autoTab.classList.contains('active')) return;

      setTimeout(function() {
        var text = window.getSelection().toString().trim();
        if (text && text !== lastText) {
          lastText = text;
          CurrencyExt.setLastSelectedText(text);
          CurrencyExt.convert(text);
        }
      }, 50);
    });
  }

  // ── Listen for extension icon clicks ──────────────────────────

  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.action !== 'toggle') return;

    CurrencyExt.createPanel();

    var panel = CurrencyExt.getPanel();
    if (!panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');
    CurrencyExt.hideSettings();
    CurrencyExt.switchTab('auto');

    lastText = msg.selectedText || '';
    CurrencyExt.setLastSelectedText(lastText);
    CurrencyExt.convert(lastText);
  });

  setupSelectionListener();
})();
