chrome.action.onClicked.addListener(async (tab) => {
  let selectedText = '';
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });
    selectedText = results[0]?.result?.trim() || '';
  } catch (e) {
    // Page may not be accessible (chrome://, extensions, etc.)
  }

  // Ensure content script is injected before sending message
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/constants.js', 'js/parser.js', 'js/panel.js', 'js/main.js']
    });
  } catch (e) {
    // Already injected or page not accessible
  }

  // Small delay to let the content script initialize
  setTimeout(() => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'toggle',
      selectedText
    }).catch(() => {
      // Ignore — page is not accessible
    });
  }, 100);
});
