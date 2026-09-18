// background.js
// This runs quietly in the background the whole time Chrome is open.
// Its job: watch every network request a website makes, check if it's
// going to a known ad/tracker company, and save that info so popup.js
// can show a score when you click the extension icon.

// --- STEP 1: Load the tracker list from Person 3's file ---
// KNOWN_TRACKERS is defined in tracker-list.js, loaded in below.
// importScripts only works in background scripts, not popup.js.
importScripts("tracker-list.js");

// --- STEP 2: Storage that resets per tab ---
// We keep a running list of trackers caught for each tab (each open website).
// Example shape: { 12: ["doubleclick.net", "hotjar.com"] }
let trackersByTab = {};

// --- STEP 3: Helper — check if a URL's domain matches a known tracker ---
function isTrackerDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return KNOWN_TRACKERS.some((tracker) => hostname.includes(tracker));
  } catch (e) {
    return false;
  }
}

// --- STEP 4: The actual "watching" ---
// This fires every single time ANY request happens on ANY tab you're viewing.
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const tabId = details.tabId;
    if (tabId < 0) return; // ignore requests not tied to a real tab

    if (isTrackerDomain(details.url)) {
      const hostname = new URL(details.url).hostname;

      if (!trackersByTab[tabId]) {
        trackersByTab[tabId] = [];
      }

      // avoid duplicate entries for the same tracker
      if (!trackersByTab[tabId].includes(hostname)) {
        trackersByTab[tabId].push(hostname);

        // Save to chrome.storage so popup.js can read it when opened
        chrome.storage.local.set({ trackersByTab });

        console.log(`[ConsentGap] Tracker caught on tab ${tabId}: ${hostname}`);
      }
    }
  },
  { urls: ["<all_urls>"] }
);

// --- STEP 5: Reset the list when a tab navigates to a new page ---
// Otherwise trackers from the last website would carry over.
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    // frameId 0 means the main page, not an iframe inside it
    trackersByTab[details.tabId] = [];
    chrome.storage.local.set({ trackersByTab });

    // Also clear any previously fetched privacy policy for this tab
    chrome.storage.local.get("policyTextByTab", (data) => {
      const policyTextByTab = data.policyTextByTab || {};
      delete policyTextByTab[details.tabId];
      chrome.storage.local.set({ policyTextByTab });
    });
  }
});

// --- STEP 6: Auto-detected privacy policy handling ---
// content.js runs on every page and, if it finds a link that looks like
// a privacy policy, sends its URL here. We fetch that page ourselves
// (the extension's host_permissions let us fetch cross-origin, which a
// normal webpage script can't always do) and strip it down to plain text.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "PRIVACY_POLICY_FOUND" && sender.tab) {
    const tabId = sender.tab.id;

    fetch(message.url)
      .then((response) => response.text())
      .then((html) => {
        // Very simple HTML-to-text: strip scripts/styles, then all tags,
        // then collapse extra whitespace. Not perfect, but good enough
        // for keyword matching.
        const plainText = html
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        chrome.storage.local.get("policyTextByTab", (data) => {
          const policyTextByTab = data.policyTextByTab || {};
          policyTextByTab[tabId] = {
            url: message.url,
            text: plainText
          };
          chrome.storage.local.set({ policyTextByTab });
        });
      })
      .catch((err) => {
        console.log("[ConsentGap] Could not fetch privacy policy:", err);
      });
  }
});

// NEXT STEPS FOR THE TEAM (not built yet):
// 1. Person 3: keep expanding KNOWN_TRACKERS in tracker-list.js
// 2. Combine tracker count + policy mismatch into a single 0-100 score
// 3. Handle sites where no privacy policy link is found (popup.js already
//    falls back to the manual paste box for these)

