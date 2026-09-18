// popup.js
// Runs when you click the extension icon.
// 1. Shows trackers background.js already caught on this tab.
// 2. Checks for an auto-detected privacy policy (found by content.js,
//    fetched by background.js). Falls back to manual paste if not found.
// 3. Combines both into a single 0-100 "Consent Gap Score".

let caughtTrackers = [];

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTabId = tabs[0].id;

  chrome.storage.local.get("trackersByTab", (data) => {
    const trackersByTab = data.trackersByTab || {};
    caughtTrackers = trackersByTab[currentTabId] || [];

    const messageEl = document.getElementById("message");
    const listEl = document.getElementById("tracker-list");

    messageEl.textContent = "Trackers caught (" + caughtTrackers.length + ")";
    listEl.innerHTML = caughtTrackers.map(function(t) {
      return "<li>" + t + "</li>";
    }).join("");

    chrome.storage.local.get("policyTextByTab", (policyData) => {
      const policyTextByTab = policyData.policyTextByTab || {};
      const policyEntry = policyTextByTab[currentTabId];
      const statusEl = document.getElementById("policy-status");
      const manualBox = document.getElementById("manual-section");

      if (policyEntry && policyEntry.text) {
        statusEl.textContent = "Privacy policy auto-detected: " + policyEntry.url;
        manualBox.style.display = "none";
        runCheck(policyEntry.text.toLowerCase());
      } else {
        statusEl.textContent = "No privacy policy auto-detected on this page. Paste it manually below:";
        manualBox.style.display = "block";
        // Still show a score based on trackers alone while waiting for manual input
        updateScore(false, caughtTrackers.length);
      }
    });
  });
});

// --- Score calculation ---
// Base score comes from how many trackers were caught (capped at 60).
// A confirmed mismatch (policy says "no sharing" but trackers exist)
// adds a big flat 40-point penalty, since that's the "gotcha" that
// matters most - a lie is worse than just having ads.
function calculateScore(mismatchFound, trackerCount) {
  const trackerScore = Math.min(trackerCount * 6, 60);
  const mismatchScore = mismatchFound ? 40 : 0;
  return Math.min(trackerScore + mismatchScore, 100);
}

function updateScore(mismatchFound, trackerCount) {
  const score = calculateScore(mismatchFound, trackerCount);
  const circle = document.getElementById("score-circle");
  const label = document.getElementById("score-label");

  circle.textContent = score;

  circle.classList.remove("score-low", "score-medium", "score-high");
  if (score >= 60) {
    circle.classList.add("score-high");
    label.textContent = "High Consent Gap";
  } else if (score >= 30) {
    circle.classList.add("score-medium");
    label.textContent = "Moderate Consent Gap";
  } else {
    circle.classList.add("score-low");
    label.textContent = "Low Consent Gap";
  }
}

// --- The Consent Gap check itself, shared by auto and manual paths ---
function runCheck(policyText) {
  const resultEl = document.getElementById("result");

  if (!policyText || !policyText.trim()) {
    resultEl.textContent = "No policy text to check.";
    resultEl.className = "neutral";
    updateScore(false, caughtTrackers.length);
    return;
  }

  const claimsNoSharing = NO_SHARING_PHRASES.some(function(phrase) {
    return policyText.includes(phrase);
  });

  const mismatchFound = claimsNoSharing && caughtTrackers.length > 0;
  updateScore(mismatchFound, caughtTrackers.length);

  if (mismatchFound) {
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
