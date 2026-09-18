/**
 * ConsentGap scoring — fixed logic
 *
 * PROBLEM WITH THE OLD SCORE:
 * It blended "how many trackers fired" and "did the policy actually lie"
 * into one number, so a site with NO broken promise (The Hindu, 22 trackers,
 * no explicit "no sharing" claim) could out-score a site that DID break a
 * promise (Nykaa, 1 tracker, explicit "no sharing" claim broken).
 *
 * FIX:
 * Keep tracker count and consent-gap status as two SEPARATE outputs.
 * Only show a "gap" / violation when the policy made a checkable promise
 * AND that promise was broken. Otherwise it's just "tracking, undisclosed
 * in detail" — not a lie.
 */

/**
 * @param {Array<{domain: string, category?: string}>} trackersCaught
 *   List of trackers your background.js/content.js already detected.
 * @param {Object} policyClaims
 *   Output of your existing policy-phrases.js matching. Expected shape:
 *   {
 *     noSharingClaim: boolean,   // policy explicitly says "we don't share/sell data"
 *     claimText: string | null  // the actual sentence matched, for display
 *   }
 * @returns {Object} scoring result, ready to render in popup.js
 */
function calculateConsentGap(trackersCaught, policyClaims) {
  const trackerCount = trackersCaught.length;

  // No explicit promise was made in the policy → nothing to break.
  // This is "undisclosed tracking", not a consent violation.
  if (!policyClaims.noSharingClaim) {
    return {
      trackerCount,
      consentGapStatus: "NONE",
      label: "Undisclosed Tracking",
      severity: "neutral",
      explanation: trackerCount > 0
        ? `${trackerCount} tracker(s) caught. The policy doesn't make an explicit ` +
          `"no data sharing" claim, so this is tracking without a contradicted promise.`
        : `No trackers caught, and no explicit data-sharing claim to check.`,
    };
  }

  // A promise WAS made. Did the site break it?
  if (policyClaims.noSharingClaim && trackerCount > 0) {
    return {
      trackerCount,
      consentGapStatus: "VIOLATED",
      label: "Consent Violation",
      severity: "high",
      explanation:
        `Consent Gap detected: this policy claims "${policyClaims.claimText}", ` +
        `but ${trackerCount} tracker(s) were caught sending requests anyway.`,
    };
  }

  // Promise made, and genuinely kept (0 trackers caught).
  return {
    trackerCount: 0,
    consentGapStatus: "KEPT",
    label: "Promise Kept",
    severity: "good",
    explanation: `The policy's "no data sharing" claim held up — no third-party trackers caught.`,
  };
}

/**
 * Example: how to wire this into your existing popup.js
 * (replace your old single-score calculation with this)
 */
function renderPopup(trackersCaught, policyClaims) {
  const result = calculateConsentGap(trackersCaught, policyClaims);

  // Two separate UI elements instead of one blended score:
  document.getElementById("trackerCount").textContent = `${result.trackerCount} tracker(s) caught`;
  document.getElementById("gapLabel").textContent = result.label;
  document.getElementById("gapExplanation").textContent = result.explanation;

  // Color-code by severity, not by raw tracker count
  const colorMap = { high: "#d9364f", neutral: "#e0a800", good: "#2e9e4f" };
  document.getElementById("gapBadge").style.backgroundColor = colorMap[result.severity];
}

// If you're using this as a module elsewhere (e.g. popup.js via <script type="module">)
export { calculateConsentGap };
