export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
  // chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  //   if (!tab.url) return;
  //   console.log("tabId", tabId);

  //   await chrome.sidePanel.setOptions({
  //     tabId,
  //     path: "sidepanel.html",
  //     enabled: true,
  //   });
  //   await chrome.sidePanel.open({
  //     tabId,
  //   });
  // });

  // chrome.action.onClicked.addListener((tab) => {
  //   console.log("Extension icon clicked!");
  //   console.log("You’re on URL:", tab.url);
  //   // e.g. open the side panel, send a message to a content script, etc.
  // });
  chrome.action.onClicked.addListener((tab) => {
    const { id: tabId, windowId } = tab;
    // this click is a valid gesture
    chrome.sidePanel.open({ tabId, windowId });
  });

  chrome.runtime.onMessage.addListener((message, sender) => {
    // The callback for runtime.onMessage must return falsy if we're not sending a response
    (async () => {
      if (message.type === "open_side_panel") {
        // This will open a tab-specific side panel only on the current tab.
        const { id: tabId } = sender?.tab || {};
        if (tabId === undefined) return;
        await chrome.sidePanel.open({ tabId });
        await chrome.sidePanel.setOptions({
          tabId: tabId,
          path: "sidepanel.html",
          enabled: true,
        });
      }
    })();
  });
});
