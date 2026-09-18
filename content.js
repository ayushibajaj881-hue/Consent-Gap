// content.js
// Finds a privacy-policy link on the current page.
// We intentionally keep this simple so the team can explain it easily.

function findPrivacyPolicyLink() {
  const links = Array.from(document.querySelectorAll("a"));

  // Prefer links whose visible text clearly says "privacy policy".
  const exact = links.find((link) => {
    const text = (link.textContent || "").trim().toLowerCase();
    const href = (link.getAttribute("href") || "").toLowerCase();
    return (
      text.includes("privacy policy") ||
      href.includes("privacy-policy") ||
      href.includes("privacy_policy")
    );
  });

  if (exact && exact.href) return exact.href;

  // Fallback: any privacy-related link.
  const broad = links.find((link) => {
    const text = (link.textContent || "").trim().toLowerCase();
    const href = (link.getAttribute("href") || "").toLowerCase();
    return text.includes("privacy") || href.includes("privacy");
  });

  return broad && broad.href ? broad.href : null;
}

function sendPolicyLink() {
  const policyUrl = findPrivacyPolicyLink();

  if (policyUrl) {
    chrome.runtime.sendMessage({
      type: "PRIVACY_POLICY_FOUND",
      url: policyUrl
    });
  }
}

// Some websites build their footer after the first page load.
sendPolicyLink();
setTimeout(sendPolicyLink, 1500);