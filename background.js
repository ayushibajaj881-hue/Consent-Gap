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
  }
});

// NEXT STEPS FOR THE TEAM (not built yet):
// 1. Person 3: replace KNOWN_TRACKERS with the full EasyPrivacy/blocklist data
// 2. Person 4: scrape the current site's privacy policy text, keyword-match
//    it for phrases like "we do not share your data", save that result too
// 3. Combine tracker count + policy mismatch into a real 0-100 score
// 4. popup.js reads chrome.storage.local to show the score for the active tab
