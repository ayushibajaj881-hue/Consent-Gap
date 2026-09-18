// A small beginner-friendly list of well-known tracking/analytics domains.
// This is NOT a complete blocklist. ConsentGap also looks for third-party
// requests, so the demo does not depend only on this list.

const KNOWN_TRACKER_DOMAINS = [
  // Google
  "google-analytics.com",
  "googletagmanager.com",
  "googlesyndication.com",
  "doubleclick.net",
  "googletagservices.com",

  // Meta
  "facebook.net",
  "facebook.com",

  // Analytics / product analytics
  "hotjar.com",
  "mixpanel.com",
  "segment.io",
  "segment.com",
  "amplitude.com",
  "clarity.ms",
  "chartbeat.com",

  // Advertising
  "adnxs.com",
  "criteo.com",
  "taboola.com",
  "outbrain.com",
  "pubmatic.com",
  "rubiconproject.com",
  "openx.net",
  "adform.net",
  "moatads.com",
  "adsrvr.org",
  "scorecardresearch.com",
  "quantserve.com",

  // Social / attribution
  "branch.io",
  "appsflyer.com",
  "adjust.com"
];