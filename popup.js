// popup.js
// Runs when you click the extension icon.
// Part 1: shows trackers background.js already caught on this tab.
// Part 2: checks for an AUTO-DETECTED privacy policy (found by content.js
//         and fetched by background.js). If found, runs the check
//         automatically. If not found, falls back to the manual paste box.

let caughtTrackers = [];

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTabId = tabs[0].id;

  // --- Load trackers caught on this tab ---
  chrome.storage.local.get("trackersByTab", (data) => {
    const trackersByTab = data.trackersByTab || {};
    caughtTrackers = trackersByTab[currentTabId] || [];

    const messageEl = document.getElementById("message");
    const listEl = document.getElementById("tracker-list");

    if (caughtTrackers.length === 0) {
      messageEl.textContent = "No known trackers caught yet";
    } else {
      messageEl.textContent = caughtTrackers.length + " tracker(s) caught";
      listEl.innerHTML = caughtTrackers.map(function(t) {
        return "<li>" + t + "</li>";
      }).join("");
    }

    // --- Load any auto-fetched privacy policy for this tab ---
    chrome.storage.local.get("policyTextByTab", (policyData) => {
      const policyTextByTab = policyData.policyTextByTab || {};
      const policyEntry = policyTextByTab[currentTabId];
      const statusEl = document.getElementById("policy-status");
      const manualBox = document.getElementById("manual-section");

      if (policyEntry && policyEntry.text) {
        // Found a policy automatically - run the check right away
        statusEl.textContent = "Privacy policy auto-detected: " + policyEntry.url;
        statusEl.className = "neutral";
        manualBox.style.display = "none"; // hide manual paste box, not needed

        runCheck(policyEntry.text.toLowerCase());
      } else {
        // Nothing auto-detected - show the manual paste box instead
        statusEl.textContent = "No privacy policy auto-detected on this page. Paste it manually below:";
        statusEl.className = "neutral";
        manualBox.style.display = "block";
      }
    });
  });
});

// --- The actual Consent Gap check, shared by both auto and manual paths ---
function runCheck(policyText) {
  const resultEl = document.getElementById("result");

  if (!policyText || !policyText.trim()) {
    resultEl.textContent = "No policy text to check.";
    resultEl.className = "neutral";
    return;
  }

  const claimsNoSharing = NO_SHARING_PHRASES.some(function(phrase) {
    return policyText.includes(phrase);
  });

  if (claimsNoSharing && caughtTrackers.length > 0) {
    resultEl.className = "warning";
    resultEl.textContent =
      "Consent Gap detected: this policy claims it doesn't share your data, " +
      "but " + caughtTrackers.length + " tracker(s) were caught sending requests " +
      "in the background (" + caughtTrackers.slice(0, 3).join(", ") + ").";
  } else if (claimsNoSharing && caughtTrackers.length === 0) {
    resultEl.className = "safe";
    resultEl.textContent =
      "No mismatch found. The policy claims no data sharing, and no known " +
      "trackers were caught on this page.";
  } else if (!claimsNoSharing && caughtTrackers.length > 0) {
    resultEl.className = "neutral";
    resultEl.textContent =
      caughtTrackers.length + " tracker(s) were caught, but the policy doesn't " +
      "clearly claim \"no data sharing\" - so this isn't a contradiction, just " +
      "tracking without a specific promise against it.";
  } else {
    resultEl.className = "neutral";
    resultEl.textContent =
      "No mismatch found - no trackers caught and no relevant claim in the policy.";
  }
}

// --- Manual paste button, used only when nothing was auto-detected ---
document.getElementById("check-button").addEventListener("click", function() {
  const policyText = document.getElementById("policy-input").value.toLowerCase();
  runCheck(policyText);
});
