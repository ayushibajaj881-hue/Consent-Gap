// ConsentGap uses simple, explainable rules instead of a black-box model.
// Each rule looks for a clear privacy-policy statement.

const POLICY_RULES = [
  {
    id: "no_third_party_sharing",
    label: "No third-party sharing",
    phrases: [
      "we do not share your personal information with third parties",
      "we do not share your information with third parties",
      "we do not share your data with third parties",
      "we do not disclose your personal information to third parties",
      "we do not disclose your information to third parties",
      "we will never share your personal information"
    ]
  },
  {
    id: "no_selling",
    label: "No selling of personal data",
    phrases: [
      "we do not sell your personal information",
      "we do not sell your information",
      "we do not sell your data",
      "we never sell your personal information",
      "we will never sell your personal information"
    ]
  },
  {
    id: "email_collection",
    label: "Email collection",
    phrases: [
      "email address",
      "email addresses",
      "email information"
    ]
  },
  {
    id: "location_collection",
    label: "Location collection",
    phrases: [
      "location data",
      "geolocation",
      "precise location",
      "location information"
    ]
  },
  {
    id: "device_identifier",
    label: "Device/identifier collection",
    phrases: [
      "device identifier",
      "device id",
      "unique identifier",
      "advertising id",
      "ip address"
    ]
  }
];

function analyzePolicy(text) {
  const lower = (text || "").toLowerCase();
  const claims = [];

  for (const rule of POLICY_RULES) {
    const matchedPhrase = rule.phrases.find((phrase) => lower.includes(phrase));
    if (matchedPhrase) {
      claims.push({
        id: rule.id,
        label: rule.label,
        phrase: matchedPhrase
      });
    }
  }

  return claims;
}