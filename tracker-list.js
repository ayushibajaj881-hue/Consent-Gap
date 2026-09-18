// tracker-list.js
// This is Person 3's file — a bigger list of known ad/tracker/analytics
// domains, kept separate so it's easy to update without touching the
// core watching logic in background.js.
//
// This list is still not "complete" (a full EasyPrivacy list has
// thousands of entries), but it covers the trackers you're most likely
// to actually see during your demo — analytics, ad networks, and social
// tracking pixels.
//
// To go further later: search "EasyPrivacy list json" or
// "disconnect.me tracking protection lists" for full public blocklists,
// and merge their domains into this array.

const KNOWN_TRACKERS = [
  // Google
  "google-analytics.com",
  "googletagmanager.com",
  "googletagservices.com",
  "googlesyndication.com",
  "doubleclick.net",
  "adservice.google.com",
  "google.com/pagead",

  // Meta / Facebook
  "facebook.com",
  "facebook.net",
  "connect.facebook.net",

  // Analytics / heatmaps
  "hotjar.com",
  "mixpanel.com",
  "segment.io",
  "segment.com",
  "amplitude.com",
  "clarity.ms",
  "chartbeat.com",
  "newrelic.com",
  "nr-data.net",

  // Ad networks / programmatic
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
  "bluekai.com",
  "demdex.net",
  "adsafeprotected.com",
  "krxd.net",
  "scorecardresearch.com",
  "quantserve.com",

  // Social tracking pixels
  "linkedin.com/px",
  "twitter.com/i/adsct",
  "pinterest.com/ct",
  "tiktok.com",
  "snapchat.com",

  // Attribution / mobile tracking
  "branch.io",
  "appsflyer.com",
  "adjust.com"
];
