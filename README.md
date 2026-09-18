# ConsentGap — Beginner-Friendly Hackathon Version

## 1. What are we building?

ConsentGap is a Chrome extension that compares two things:

1. **What a website says in its privacy policy**
2. **What the browser actually sends to third parties**

Example:

> Policy: "We do not share your personal information with third parties."

Browser observation:

> Email field → third-party analytics/tracker

ConsentGap reports a **potential consent mismatch** and shows the evidence.

### Important wording

A tracker request does **not automatically prove** that a website violated its policy or the law.

Our extension uses the phrase **"potential consent mismatch"** because it is an evidence-based prototype.

---

# 2. Files — what each teammate needs to understand

### manifest.json
The configuration file.

It tells Chrome:
- this is a Manifest V3 extension
- which permissions we need
- which JavaScript files run
- which page URLs the extension can observe

### background.js
The "security camera".

It watches network requests and records:
- destination
- GET/POST method
- third-party or first-party
- known tracker or not
- recognizable data type

It stores only the **type of data**, not the actual value.

### tracker-list.js
A small list of known analytics/ad/tracking domains.

This is only a starter list. We also detect third-party requests.

### content.js
Looks at the webpage and finds a link to the privacy policy.

### policy-phrases.js
Contains simple rules for understanding common policy statements.

Example:
- "we do not share your personal information with third parties"

becomes:

`no_third_party_sharing = true`

### popup.js
The "brain" of the popup.

It combines:
- observed requests
- data types
- policy claims

and creates the score and explanation.

### popup.html
The visual interface.

---

# 3. How the extension works

```text
User opens website
       |
       v
content.js finds Privacy Policy
       |
       v
background.js fetches policy text
       |
       v
background.js watches network requests
       |
       v
Does a request go to a third party?
       |
       v
Is recognizable data being sent?
       |
       v
popup.js compares observation with policy claim
       |
       v
Consent Gap Score + evidence
```

---

# 4. How the score works

The score is intentionally simple so judges can understand it.

Maximum = 100

- Policy mismatch = 50 points
- Recognizable data exposure = up to 30 points
- Third-party requests = up to 20 points

The score is an **indicator**, not a legal judgement.

A high score means the extension found more evidence worth investigating.

---

# 5. How data detection works

We do not try to save personal information.

If a request contains:

`email=someone@example.com`

we only record:

`Email`

If it contains:

`user_id=12345`

we record:

`User / device ID`

This reduces the privacy risk created by our own extension.

---

# 6. How to install

1. Unzip the project.
2. Open Chrome.
3. Go to `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the `consentgap-extension` folder.
7. Pin ConsentGap.
8. Open a normal website.
9. Reload the website after installing/updating the extension.
10. Click ConsentGap.

After changing extension code, click Chrome's **Reload** button for ConsentGap on `chrome://extensions`, then reload the website.

---

# 7. Presentation explanation — memorize this

### 30-second explanation

"ConsentGap is a Chrome extension that checks the difference between a website's privacy promises and its real network activity. We monitor requests made by the browser, identify third-party and known tracker requests, and look for recognizable data types such as email, phone number, location and user IDs. We then compare these observations with simple claims extracted from the privacy policy. Instead of calling every tracker a violation, we only flag a potential mismatch when the evidence and policy statement conflict."

### If the judge asks: "How do you detect trackers?"

"We maintain a small list of known tracker domains and also compare the page's origin with the destination origin to identify third-party requests."

### "How do you know what data is being sent?"

"For requests where Chrome exposes the request body or URL parameters, we search for recognizable field names such as email, phone, user_id and location. We store the category, not the actual value."

### "How do you read the privacy policy?"

"We find the privacy-policy link on the page, fetch its text through the extension, and use explainable keyword rules to identify claims such as no third-party sharing or no selling."

### "Why not use AI?"

"For our first prototype, we chose deterministic rules because they are fast, transparent and easy to explain. AI/NLP can be added later to understand more complicated policy language."

### "Does a tracker mean the company is doing something wrong?"

"No. A tracker alone does not prove a policy violation. Our extension distinguishes tracking from a potential policy mismatch."

### "What is innovative?"

"Traditional privacy tools mostly block trackers. ConsentGap focuses on the relationship between the site's stated privacy policy and observable browser behavior."

---

# 8. Recommended demo

For a reliable hackathon demo, create a tiny controlled website that says:

> "We do not share your personal information with third parties."

Then make its **Buy/Submit** button send a test request to a different local server with:

`email`, `user_id`, or `product_id`.

ConsentGap should show:

- third-party request
- data type detected
- policy claim
- potential mismatch
- evidence

This is safer for judging than depending entirely on a real website whose network behavior can change.

---

# 9. Known limitations

This is a prototype.

It cannot:
- see every possible kind of browser data
- understand every privacy-policy sentence
- prove the legal meaning of a request
- decrypt arbitrary encrypted traffic
- detect data that is encoded/obfuscated in ways our simple rules do not recognize
- guarantee that every third-party request is a tracker

These limitations are good discussion points in the presentation because they show that the team understands the difference between a prototype and a production privacy auditor.

---

# 10. Future scope

1. Better NLP for privacy policies
2. Larger maintained tracker database
3. More data-type detection
4. Request timelines
5. Exportable privacy reports
6. Policy section highlighting
7. Better handling of encoded/structured payloads
8. User-controlled allow/ignore rules
