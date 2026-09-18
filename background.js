// ConsentGap background service worker
// ------------------------------------------------------------
// Simple idea:
// 1. Watch network requests.
// 2. Identify third-party / known-tracker requests.
// 3. Look at request data when Chrome makes it available.
// 4. Store only DATA TYPES (email, phone, etc.), never the actual values.
// 5. Compare those observations with the privacy policy.
// ------------------------------------------------------------

importScripts("tracker-list.js");

const MAX_EVENTS_PER_TAB = 100;
let activityByTab = {};
let policyByTab = {};

function safeUrl(value) {
  try {
    return new URL(value);
  } catch (_) {
    return null;
  }
}

function getHost(url) {
  const parsed = safeUrl(url);
  return parsed ? parsed.hostname : "";
}

function getSiteOrigin(details) {
  // initiator is normally the page origin that started the request.
  // documentUrl is a useful fallback.
  return details.initiator || details.documentUrl || "";
}

function isThirdParty(details) {
  const site = safeUrl(getSiteOrigin(details));
  const destination = safeUrl(details.url);

  if (!site || !destination) return false;

  return site.origin !== destination.origin;
}

function isKnownTracker(url) {
  const parsed = safeUrl(url);
  if (!parsed) return false;

  const hostname = parsed.hostname.toLowerCase();
  return KNOWN_TRACKER_DOMAINS.some((domain) =>
    hostname === domain || hostname.endsWith("." + domain)
  );
}

function addEvent(tabId, event) {
  if (!activityByTab[tabId]) activityByTab[tabId] = [];

  // Keep the popup small and fast.
  activityByTab[tabId].unshift(event);
  activityByTab[tabId] = activityByTab[tabId].slice(0, MAX_EVENTS_PER_TAB);

  chrome.storage.local.set({ activityByTab });
}

function bytesToText(bytes) {
  try {
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  } catch (_) {
    return "";
  }
}

// Turn a request body into harmless searchable text.
// IMPORTANT: we do not save this text anywhere.
function getRequestText(requestBody) {
  if (!requestBody) return "";

  const pieces = [];

  if (requestBody.formData) {
    for (const [key, values] of Object.entries(requestBody.formData)) {
      pieces.push(key);
      for (const value of values) pieces.push(String(value));
    }
  }

  if (requestBody.raw) {
    for (const item of requestBody.raw) {
      if (item.bytes) pieces.push(bytesToText(item.bytes));
    }
  }

  return pieces.join(" ").slice(0, 20000);
}

function detectDataTypes(details) {
  const pieces = [details.url || ""];

  // Request body is available only for some request types/content types.
  pieces.push(getRequestText(details.requestBody));

  const text = pieces.join(" ").toLowerCase();
  const types = [];

  // We detect the TYPE of data, not its actual value.
  const rules = [
    {
      type: "Email",
      patterns: [
        /\bemail\b/,
        /\be[-_ ]?mail\b/,
        /email_address/,
        /emailaddress/
      ]
    },
    {
      type: "Phone number",
      patterns: [
        /\bphone\b/,
        /\bmobile\b/,
        /\btelephone\b/,
        /\bphone_number\b/
      ]
    },
    {
      type: "Location",
      patterns: [
        /\blatitude\b/,
        /\blongitude\b/,
        /\bgeolocation\b/,
        /\blocation\b/,
        /\bgps\b/
      ]
    },
    {
      type: "User / device ID",
      patterns: [
        /\buser[_-]?id\b/,
        /\bdevice[_-]?id\b/,
        /\bclient[_-]?id\b/,
        /\badvertising[_-]?id\b/,
        /\bvisitor[_-]?id\b/
      ]
    },
    {
      type: "Name",
      patterns: [
        /\bfirst[_-]?name\b/,
        /\blast[_-]?name\b/,
        /\bfull[_-]?name\b/,
        /\busername\b/
      ]
    },
    {
      type: "Search / product activity",
      patterns: [
        /\bsearch[_-]?query\b/,
        /\bquery\b/,
        /\bproduct[_-]?id\b/,
        /\bproduct\b/,
        /\bsku\b/,
        /\bcart\b/
      ]
    }
  ];

  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      types.push(rule.type);
    }
  }

  return types;
}

function getCategory(details, knownTracker) {
  if (knownTracker) return "Known tracker";
  if (isThirdParty(details)) return "Third-party";
  return "First-party";
}

function clearTab(tabId) {
  delete activityByTab[tabId];
  delete policyByTab[tabId];

  chrome.storage.local.set({
    activityByTab,
    policyByTab
  });
}

// Observe requests. "requestBody" lets Chrome provide POST/form data
// when it is available. We only keep detected categories.
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;

    const knownTracker = isKnownTracker(details.url);
    const thirdParty = isThirdParty(details);
    const dataTypes = detectDataTypes(details);

    // We show requests when they are interesting:
    // a known tracker, a third party, or a request carrying recognizable data.
    if (!knownTracker && !thirdParty && dataTypes.length === 0) return;

    const destination = getHost(details.url);

    addEvent(details.tabId, {
      time: new Date().toISOString(),
      destination,
      category: getCategory(details, knownTracker),
      method: details.method || "GET",
      dataTypes,
      knownTracker,
      thirdParty,
      hasData: dataTypes.length > 0
    });

    console.log("[ConsentGap]", {
      destination,
      category: getCategory(details, knownTracker),
      dataTypes
    });
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Reset data when the main page changes.
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    clearTab(details.tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete activityByTab[tabId];
  delete policyByTab[tabId];
  chrome.storage.local.set({ activityByTab, policyByTab });
});

// Receive a privacy-policy URL from content.js and fetch its text.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== "PRIVACY_POLICY_FOUND" || !sender.tab) return;

  const tabId = sender.tab.id;
  const url = message.url;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    })
    .then((html) => {
      // Beginner-friendly HTML-to-text conversion.
      const plainText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ")
        .trim();

      policyByTab[tabId] = {
        url,
        text: plainText.slice(0, 500000)
      };

      chrome.storage.local.set({ policyByTab });
    })
    .catch((error) => {
      console.log("[ConsentGap] Policy fetch failed:", error.message);
    });
});