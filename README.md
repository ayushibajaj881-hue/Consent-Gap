# ConsentGap — Starter Extension

This is the bare-minimum working Chrome extension. It doesn't detect
anything yet — it just proves the extension loads and the popup works.
Build everything else on top of this.

## What's in here

- `manifest.json` — the config file. Tells Chrome the extension's name,
  version, and what permissions it needs. Every extension must have this.
- `popup.html` — the small window that appears when you click the
  extension's icon in the Chrome toolbar.
- `popup.js` — the script that runs inside that popup. Right now it just
  changes the text to prove it works.

## How to load this in Chrome (do this first)

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (toggle, top-right corner)
3. Click **Load unpacked**
4. Select this folder (`consentgap-extension`)
5. You should see "ConsentGap" appear in your extensions list
6. Click the puzzle-piece icon in your Chrome toolbar, then pin ConsentGap
7. Click the ConsentGap icon — the popup should say "Hello, ConsentGap is live!"

If you see that message, the skeleton works. From here, the team builds:

- `background.js` — watches network requests (Person 2)
- tracker-domain matching (Person 3)
- privacy-policy keyword matching (Person 4)
- combining it all into a real score shown in `popup.html` (Person 1)

## Next step

Once this loads correctly for everyone on the team, add a
`background.js` file and register it in `manifest.json` under a
`"background"` key — that's where request-watching logic will live.
