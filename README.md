# StadiaAI — Smart Stadium Companion | FIFA World Cup 2026™

StadiaAI is a GenAI-enabled smart stadium companion web application designed for the **FIFA World Cup 2026** at **MetLife Stadium (New York/New Jersey)**. Built using vanilla HTML, CSS, and JavaScript, it integrates real-time crowd flow analysis, interactive SVG mapping, wayfinding navigation, transport schedules, accessibility support, and an operations dashboard.

It leverages the **Gemini API** for multilingual stadium assistance, dynamic routing advice, and operations decision-making.

---

## Features

- 🤖 **Gemini Multilingual AI Assistant:** Real-time conversational helper answering stadium questions (e.g. seats, concessions, gates) in the user's native language.
- 🗺️ **Interactive SVG Stadium Map:** Real-time color-coded crowd density overlays matching low, medium, high, and critical levels.
- 🧭 **AI Wayfinder:** Computes crowd-adjusted walking paths and overlays route paths on the SVG map. Includes an **accessibility mode** that avoids stairs.
- 🚆 **Multi-Modal Transport Planner:** parking spot counters, nj transit schedules, rideshare wait times, and streaming AI post-match exit recommendations.
- ♿ **Accessibility Hub:** Disabled services checklists, wheelchair routing, and a one-click stuart/volunteer dispatch system.
- 🌱 **Sustainability Tracker:** Tracks water savings, carbon offsets, and provides gamified fan challenges and AI-generated eco-tips.
- 📊 **Ops Command Center:** Incident logs, resources monitors, and AI incident advice for stadium organizers and volunteers.

---

## Project Structure

```
stadia-ai/
├── index.html          # SPA shell
├── .gitignore          # Git ignore configuration
├── README.md           # Documentation
├── css/
│   ├── index.css       # Variables and base resets
│   ├── components.css  # UI Cards, buttons, gauges, and chat bubbles
│   ├── layout.css      # Header, sidebar grid, responsive layouts
│   ├── pages.css       # Page styling (Map viewport, chat containers, tables)
│   └── animations.css  # Shimmer loaders, path dashes, transition keyframes
└── js/
    ├── utils.js        # DOM selectors, count animators, formats
    ├── data.js         # Venue databases and static mock logs
    ├── gemini.js       # Gemini API client (REST & SSE streaming parsing)
    ├── stadium-map.js  # SVG map layout triggers and click highlights
    ├── crowd.js        # Crowd stats calculations, live warnings
    ├── navigation.js   # Coordinate wayfinding, SVG path builders
    ├── transport.js    # Timers and schedules cards
    ├── accessibility.js# Global stylesheet helpers and layout toggles
    ├── sustainability.js# Eco gauges and stats
    ├── ops.js          # Operations timeline cards, resource counters
    └── app.js          # SPA router and main simulation thread loops (5s)
```

---

## Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd stadia-ai
   ```

2. **Run a local development server:**
   Since it uses standard HTTP fetch requests for the Gemini API, run a local web server:
   - **Using Node (npx):**
     ```bash
     npx serve -p 3000
     ```
   - **Using Python:**
     ```bash
     python -m http.server 3000
     ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`.
   - On the first load, enter your **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey) to connect the AI features.

---

## Testing

The project ships a zero-dependency unit test suite for the pure utility
functions in `js/utils.js` (including an XSS-regression test for the
`escapeHtml` helper), using Node's built-in test runner — no `npm install`
required.

```bash
npm test
# or directly:
node --test tests/*.test.js
```

Requires Node.js 18+.

---

## Security Notes

- **XSS protection:** All user-typed chat input and all AI-generated text are
  passed through `StadiaAI.Utils.escapeHtml()` before being inserted into the
  DOM, so neither a fan's message nor a manipulated model response can inject
  executable markup into the page.
- **API key transport:** The Gemini API key is sent as an `x-goog-api-key`
  request header rather than a `?key=` URL query parameter, so it isn't
  written into browser history or request-URL logs.
- **Content-Security-Policy:** `index.html` sets a CSP meta tag that limits
  script execution to same-origin files and restricts network calls to the
  Gemini API and Google Fonts.
- **Known limitation:** the Gemini API key is still held client-side (in
  `localStorage`) by design, since this is a static, backend-less demo app.
  For a production deployment, proxy Gemini calls through a small backend so
  the key never reaches the browser at all.

---

## Deploying to GitHub Pages (Resolving 404 Errors)

If you publish this website to GitHub Pages and get a **404 Page Not Found** error, it is usually caused by one of two common issues:

### Issue A: The repository was initialized in the parent folder
If your project files are inside a `stadia-ai/` folder within your repository rather than directly at the root:
* **Why it fails:** GitHub Pages looks for `index.html` at the **root** of the repository. If it's inside `stadia-ai/index.html`, visiting `https://<username>.github.io/<repo-name>/` will return a 404.
* **How to fix:**
  1. Open your repository in a terminal.
  2. Make sure the files (`index.html`, `css/`, `js/`) are moved to the root of the repository.
  3. Commit and push the changes.
  * *Alternative:* If you want to keep the folder structure, you can access the page at `https://<username>.github.io/<repo-name>/stadia-ai/index.html`.

### Issue B: The wrong deployment source is selected in GitHub settings
* **How to fix:**
  1. Go to your repository on GitHub.
  2. Click on **Settings** (gear icon) ➡️ **Pages** (on the left sidebar).
  3. Under **Build and deployment** ➡️ **Source**, make sure **Deploy from a branch** is selected.
  4. Under **Branch**, select `main` (or `master`) and change the folder dropdown from `/docs` to `/ (root)`.
  5. Click **Save** and wait 2-3 minutes for the build action to complete.
