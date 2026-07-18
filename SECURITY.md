# Security Policy

StadiaAI is a static, client-side demo app (no backend server). This document
describes what protections are in place and what limitations are inherent to
that architecture.

## Mitigations in place

- **XSS prevention:** Every dynamic value rendered via `innerHTML` across the
  entire codebase — not just the chat box — is passed through
  `StadiaAI.Utils.escapeHtml()`. This includes: user-typed chat messages;
  streamed and non-streamed Gemini API responses (crowd insights, wayfinder
  tips, ops decision support, transport plans, eco-tips); and all
  data-driven text (zone names/types, alert messages/severity, concession
  names, transport names/status/routes, accessibility feature text, match
  schedule data, toast notifications). The codebase was audited file-by-file
  (`grep`-verified — see the final check in git history / PR diff) rather
  than fixing only the reported chat vulnerability. See
  `tests/utils.test.js` for the `escapeHtml` regression tests, including one
  that checks escaping still works when a payload is split across streamed
  chunks.
- **API key lifetime:** The Gemini API key defaults to `sessionStorage`
  (cleared automatically when the browser tab closes) rather than
  persisting indefinitely. It's only written to `localStorage` if the user
  explicitly checks "Remember this key on this device" in the connect
  modal. A "Forget stored key on this device" button is available any time
  the settings modal is reopened, wiping both storage backends and the
  in-memory copy. See `tests/gemini-storage.test.js` for the full lifecycle
  test coverage (default session-only behavior, opt-in persistence, init()
  restoring a remembered key, and explicit clearing).
- **Credential transport:** The Gemini API key is sent via the
  `x-goog-api-key` request header rather than a `?key=` query parameter, so
  it is not written into browser history, devtools network-request URLs, or
  typical access logs.
- **Content-Security-Policy:** `index.html` ships a CSP meta tag with:
  - `script-src 'self'` — blocks any inline or third-party script execution
  - `connect-src 'self' https://generativelanguage.googleapis.com` — the
    only network calls the page can make
  - `object-src 'none'` — blocks plugin-based content (Flash-style embeds)
  - `base-uri 'self'` — prevents a `<base>` tag injection from redirecting
    where relative URLs resolve
  - `form-action 'self'` — the app has no forms, so this is locked down
    entirely
  - `frame-ancestors 'none'` — clickjacking protection (browsers that honor
    CSP delivered via `<meta>` for this directive; see limitation below)
  - `worker-src 'none'`, `manifest-src 'self'`, `upgrade-insecure-requests`
- **Referrer-Policy:** `strict-origin-when-cross-origin` meta tag, so the
  full page URL (including any path/query) isn't sent as a `Referer` header
  to Google Fonts or the Gemini API — only the origin is.
- **External link hygiene:** the one external link in the app
  (`aistudio.google.com`) uses `rel="noopener noreferrer"` to prevent
  reverse-tabnabbing and referrer leakage.
- **Automated scanning:** GitHub Actions runs CodeQL static analysis on every
  push/PR and weekly on a schedule (`.github/workflows/codeql.yml`), and
  Dependabot (`.github/dependabot.yml`) tracks dependency and GitHub Actions
  updates.
- **Automated testing:** The unit test suite (`npm test`) runs in CI on every
  push and pull request (`.github/workflows/tests.yml`) across two Node LTS
  versions, alongside `npm run lint`, so a regression in `escapeHtml`, the
  storage lifecycle, or the data layer fails the build rather than shipping
  silently.
- **Input validation:** the chat box rejects empty/whitespace-only input and
  caps message length at 1000 characters before it's ever rendered or sent
  to the API.

## Known limitations (by design)

- **Client-side API key storage:** Even with the session-storage default,
  the Gemini API key the user enters is still held and sent directly from
  the browser (in `sessionStorage`, or `localStorage` if the user opts in
  via "Remember this key"). This is unavoidable in a pure static-site
  architecture with no backend. For a production deployment handling real
  user traffic, proxy Gemini calls through a minimal backend (e.g. a
  serverless function) so the key never reaches the browser, and apply
  per-user rate limiting server-side.
- **`style-src 'unsafe-inline'` in the CSP:** Several UI components set
  inline `style="..."` attributes directly (progress bars, gauges, dynamic
  colors). Removing `unsafe-inline` would require refactoring all of these
  to CSS custom properties or classes. Tracked as a follow-up; not a
  regression risk today since `script-src` (the higher-severity directive)
  is already locked to `'self'`.
- **No server-enforced headers:** GitHub Pages does not support custom HTTP
  response headers, so directives like `X-Frame-Options` or
  `frame-ancestors` (which browsers ignore when set via `<meta>`) cannot be
  enforced from this hosting setup. A reverse proxy (e.g. Cloudflare) in
  front of the site would be required to add those.

## Reporting a vulnerability

This is a hackathon/demo project. If you find an issue, please open a GitHub
issue with reproduction steps rather than a public PR containing exploit
details.
