# Security

Goyo is a client-only app. There are no accounts, no server and no database: study progress lives in
the browser's `localStorage` and moves between devices only as a JSON file the learner exports and
imports. The only third-party services are ElevenLabs (audio generated ahead of time and committed)
and Vercel's cookieless analytics on the website.

## In scope

- The web app served at `https://goyo.bahbi.net`, including the `/mobile` route.
- The Content Security Policy and other response headers in `vercel.json`.
- Import handling: parsing and validating an uploaded progress file (the 5 MB limit, the save-format
  checks and the newer-save guard).

## How to report

GitHub private vulnerability reporting is currently disabled on this repository. Please open a
public issue titled **"Security contact request"** with **no details** about the problem. The
maintainer will reply there and arrange a private channel; send the details only after that.

Do not post exploit details, proof-of-concept code or personal data in a public issue.
