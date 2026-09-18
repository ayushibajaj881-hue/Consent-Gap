// popup.js
// This file turns raw observations into a simple explanation for the user.

let currentTabId = null;
let currentEvents = [];
let currentPolicy = null;

document.addEventListener("DOMContentLoaded", loadPage);

function loadPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    currentTabId = tabs[0].id;

    chrome.storage.local.get(["activityByTab", "policyByTab"], (data) => {
      const allActivity = data.activityByTab || {};
      const allPolicies = data.policyByTab || {};

      currentEvents = allActivity[currentTabId] || [];
      currentPolicy = allPolicies[currentTabId] || null;

      render();
    });
  });
}

function unique(list) {
  return [...new Set(list)];
}

function getObservedDataTypes() {
  return unique(
    currentEvents.flatMap((event) => event.dataTypes || [])
  );
}

function getTrackerEvents() {
  return currentEvents.filter((event) => event.knownTracker);
}

function getThirdPartyEvents() {
  return currentEvents.filter((event) => event.thirdParty);
}

function hasPolicyClaim(id) {
  return analyzePolicy(currentPolicy ? currentPolicy.text : "")
    .some((claim) => claim.id === id);
}

// Core comparison:
// We do NOT say "tracker = violation".
// We ask whether a relevant data type was observed and whether the
// policy contains a statement that conflicts with that observation.
function calculateAssessment() {
  const dataTypes = getObservedDataTypes();
  const trackers = getTrackerEvents();
  const thirdParty = getThirdPartyEvents();

  const noSharingClaim = hasPolicyClaim("no_third_party_sharing");
  const noSellingClaim = hasPolicyClaim("no_selling");

  // A "policy mismatch" needs both a restrictive policy claim and
  // a data-bearing third-party request.
  const dataBearingThirdParty = thirdParty.filter(
    (event) => event.hasData
  );

  let mismatch = false;
  let mismatchReason = "";

  if (noSharingClaim && dataBearingThirdParty.length > 0) {
    mismatch = true;
    mismatchReason =
      "The policy contains a no-third-party-sharing statement, but a third-party request contained a recognizable data field.";
  } else if (noSellingClaim && dataBearingThirdParty.length > 0) {
    mismatch = true;
    mismatchReason =
      "The policy contains a no-selling statement, but a data-bearing request to a third party was observed.";
  }

  // Score is intentionally simple and explainable.
  let score = 0;

  if (mismatch) score += 50;

  // Data exposure: maximum 30.
  const dataPoints = Math.min(dataTypes.length * 10, 30);
  score += dataPoints;

  // Third-party exposure: maximum 20.
  const thirdPartyPoints = Math.min(thirdParty.length * 2, 20);
  score += thirdPartyPoints;

  score = Math.min(score, 100);

  return {
    score,
    mismatch,
    mismatchReason,
    dataTypes,
    trackers,
    thirdParty,
    dataBearingThirdParty
  };
}

function render() {
  const assessment = calculateAssessment();

  renderScore(assessment);
  renderResult(assessment);
  renderStats(assessment);
  renderDataTypes(assessment);
  renderPolicy();
  renderEvents();
}

function renderScore(assessment) {
  const circle = document.getElementById("score-circle");
  const label = document.getElementById("score-label");

  circle.textContent = assessment.score;
  circle.className = "";

  if (assessment.score >= 60) {
    circle.classList.add("high");
    label.textContent = "High Consent Gap";
  } else if (assessment.score >= 30) {
    circle.classList.add("medium");
    label.textContent = "Moderate Consent Gap";
  } else {
    circle.classList.add("low");
    label.textContent = "Low Consent Gap";
  }
}

function renderResult(assessment) {
  const result = document.getElementById("result");

  if (assessment.mismatch) {
    result.className = "result warning";
    result.innerHTML =
      "<b>⚠ Potential consent mismatch</b><br>" +
      escapeHtml(assessment.mismatchReason);
    return;
  }

  if (assessment.thirdParty.length > 0) {
    result.className = "result neutral";
    result.innerHTML =
      "<b>Tracking observed</b><br>" +
      assessment.thirdParty.length +
      " third-party request(s) were observed. A tracker by itself is not treated as a policy contradiction.";
    return;
  }

  result.className = "result safe";
  result.innerHTML =
    "<b>No mismatch detected</b><br>" +
    "No evidence currently shows a conflict between the policy claims we found and the observed requests.";
}

function renderStats(assessment) {
  document.getElementById("tracker-count").textContent =
    assessment.trackers.length;

  document.getElementById("third-party-count").textContent =
    assessment.thirdParty.length;

  document.getElementById("data-count").textContent =
    currentEvents.filter((event) => event.hasData).length;
}

function renderDataTypes(assessment) {
  const el = document.getElementById("data-types");

  if (assessment.dataTypes.length === 0) {
    el.textContent = "None detected yet.";
    return;
  }

  el.innerHTML = assessment.dataTypes
    .map((type) => `<span class="pill">${escapeHtml(type)}</span>`)
    .join("");
}

function renderPolicy() {
  const status = document.getElementById("policy-status");
  const claimsEl = document.getElementById("policy-claims");
  const manual = document.getElementById("manual-section");

  if (!currentPolicy) {
    status.textContent =
      "No privacy policy was detected automatically.";
    manual.style.display = "block";
    claimsEl.textContent = "";
    return;
  }

  status.innerHTML =
    "Policy detected: <b>" +
    escapeHtml(currentPolicy.url) +
    "</b>";

  const claims = analyzePolicy(currentPolicy.text);

  if (claims.length === 0) {
    claimsEl.textContent =
      "No supported policy claim was found. This does not mean the site has no privacy disclosures.";
  } else {
    claimsEl.innerHTML =
      "<b>Claims found:</b><ul>" +
      claims.map((claim) =>
        `<li>${escapeHtml(claim.label)}</li>`
      ).join("") +
      "</ul>";
  }

  manual.style.display = "none";
}

function renderEvents() {
  const el = document.getElementById("events");

  if (currentEvents.length === 0) {
    el.innerHTML =
      '<div class="small" style="margin-top:7px;">No interesting requests observed yet. Interact with the page and reopen the popup.</div>';
    return;
  }

  el.innerHTML = currentEvents
    .slice(0, 30)
    .map((event) => {
      const data =
        event.dataTypes && event.dataTypes.length
          ? event.dataTypes.join(", ")
          : "No recognizable data field";

      const badges = [
        event.knownTracker ? "Known tracker" : "",
        event.thirdParty ? "Third-party" : "",
        event.method || "GET"
      ].filter(Boolean);

      return `
        <div class="event">
          <strong>${escapeHtml(event.destination)}</strong><br>
          ${badges.map((b) => `<span class="pill">${escapeHtml(b)}</span>`).join("")}
          <br>
          Data: ${escapeHtml(data)}
        </div>
      `;
    })
    .join("");
}

document.getElementById("check-button").addEventListener("click", () => {
  const text = document.getElementById("policy-input").value.trim();

  if (!text) return;

  currentPolicy = {
    url: "Manual input",
    text
  };

  render();
});

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Refresh while the popup is open so new requests can appear live.
setInterval(() => {
  if (!currentTabId) return;

  chrome.storage.local.get(["activityByTab", "policyByTab"], (data) => {
    const allActivity = data.activityByTab || {};
    const allPolicies = data.policyByTab || {};

    currentEvents = allActivity[currentTabId] || [];
    if (!currentPolicy && allPolicies[currentTabId]) {
      currentPolicy = allPolicies[currentTabId];
    }

    render();
  });
}, 1000);