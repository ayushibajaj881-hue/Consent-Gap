// popup.js
// This runs when you click the extension icon.
// It looks up which tab you're currently viewing, then reads the
// tracker list that background.js saved for that tab.

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTabId = tabs[0].id;

  chrome.storage.local.get("trackersByTab", (data) => {
    const trackersByTab = data.trackersByTab || {};
    const trackers = trackersByTab[currentTabId] || [];

    const messageEl = document.getElementById("message");
    const listEl = document.getElementById("tracker-list");

    if (trackers.length === 0) {
      messageEl.textContent = "No known trackers caught yet";
    } else {
      messageEl.textContent = trackers.length + " tracker(s) caught";
      listEl.innerHTML = trackers.map(function(t) {
        return "<li>" + t + "</li>";
      }).join("");
    }
  });
});
