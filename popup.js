// popup.js
// Runs when you click the extension icon.
// Part 1: shows trackers background.js already caught on this tab.
// Part 2: lets you paste in the site's privacy policy text and checks
//         it for "we don't share your data" style phrases. If the site
//         claims that AND trackers were caught -> that's the mismatch.

let caughtTrackers = [];

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTabId = tabs[0].id;

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
  });
});

// --- Part 2: the Consent Gap check ---
document.getElementById("check-button").addEventListener("click", function() {
  const policyText = document.getElementById("policy-input").value.toLowerCase();
  const resultEl = document.getElementById("result");

  if (!policyText.trim()) {
    resultEl.textContent = "Paste some policy text first.";
    resultEl.className = "neutral";
    return;
  }

  // Does the pasted policy contain a "we don't share/sell" style phrase?
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
      caughtTrackers.length + " tracker(s) were caught, but the pasted policy " +
      "doesn't clearly claim \"no data sharing\" - so this isn't a contradiction, " +
      "just tracking without a specific promise against it.";
  } else {
    resultEl.className = "neutral";
    resultEl.textContent =
      "No mismatch found - no trackers caught and no relevant claim in the policy.";
  }
});
