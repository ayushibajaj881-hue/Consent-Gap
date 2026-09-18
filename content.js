// content.js
// This runs automatically on every page you visit (that's what a
// "content script" means - it runs inside the actual webpage).
// Its only job: look through the page's links, find one that looks
// like a privacy policy, and tell background.js where it is.

function findPrivacyPolicyLink() {
  const links = document.querySelectorAll("a");

  for (const link of links) {
    const text = (link.textContent || "").toLowerCase();
    const href = (link.getAttribute("href") || "").toLowerCase();

    if (text.includes("privacy") || href.includes("privacy")) {
      // link.href (not getAttribute) gives the full resolved URL,
      // even if the site wrote it as a relative path like "/privacy"
      return link.href;
    }
  }

  return null;
}

const policyUrl = findPrivacyPolicyLink();

if (policyUrl) {
  chrome.runtime.sendMessage({
    type: "PRIVACY_POLICY_FOUND",
    url: policyUrl
  });
}
