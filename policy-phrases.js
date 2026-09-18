// policy-phrases.js
// This is Person 4's file — phrases that typically show up in a privacy
// policy when a site is claiming it does NOT share or sell your data.
// If a pasted policy contains one of these AND background.js already
// caught real trackers on that site, that's the mismatch you're catching.
//
// Keep these lowercase — popup.js will lowercase the pasted text before
// checking, so casing won't matter.

const NO_SHARING_PHRASES = [
  "we do not sell your",
  "we do not sell any",
  "do not sell your personal",
  "we do not share your",
  "we do not share your personal",
  "we will never sell",
  "we will never share",
  "we never sell your",
  "not share your information with third parties",
  "not share your data with third parties",
  "do not disclose your personal information",
  "we do not rent or sell",
  "your privacy is our priority",
  "we respect your privacy"
];
