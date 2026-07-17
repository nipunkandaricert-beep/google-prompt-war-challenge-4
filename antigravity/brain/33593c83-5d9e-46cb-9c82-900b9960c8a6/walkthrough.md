# StadiaAI — Web Application Walkthrough

## What Was Accomplished

We built **StadiaAI** — a complete, responsive, GenAI-enabled smart stadium companion web application designed specifically for the **FIFA World Cup 2026** at **MetLife Stadium (New York/New Jersey)**.

The solution enhances the matchday experience for **fans, organizers, volunteers, and staff** by integrating the following components:
1. 🤖 **Gemini-Powered AI Stadium Assistant:** A conversational assistant capable of answering venue questions (rules, food locations, schedules) in any language.
2. 🗺️ **Interactive Stadium Map:** An SVG rendering of MetLife Stadium color-coded dynamically based on crowd density levels (low/medium/high/critical).
3. 👥 **Crowd Flow & Intelligence:** Real-time occupancy analytics, table breakdowns, and alert generators, with AI-driven bottleneck predictions.
4. 🧭 **AI Wayfinding Navigation:** Map-drawn routes between points (e.g. stands, concessions, gates) with time estimation adjusted for current crowd density and an **accessibility-mode toggle** that avoids stairs.
5. 🚆 **Smart Transport Planner:** Multi-modal ETA grids (transit rail, bus, parking space meters, and rideshares with surge pricing counters) coupled with streaming AI travel plan recommenders.
6. ♿ **Accessibility Hub:** Dedicated wheelchair routing options, lists of services (sensory rooms, captioning, ALD), and a one-click emergency steward dispatch interface.
7. 🌱 **Sustainability Tracker:** Real-time metrics showing carbon saved, waste diversion rates, water savings, renewable energy usages, and AI eco-tips.
8. 📊 **Operations Command Center:** Role-restricted dashboards for staff/organizers detailing incidents, timeline phases (Warm-up, Kick-off, Egress), gate open status, and direct AI incident resolution support.

---

## File Structure & Code Highlights

All project files are written in the `stadia-ai` workspace directory:

### 1. Structure
* `index.html` — Single Page App containing the side navigation layout, headers, role switches, page container sections, and modal triggers.

### 2. Styles
* `css/index.css` — Custom properties, typography (Outfit & Inter), resets, scrollbar, selection style.
* `css/components.css` — Glassmorphism controls, stat tiles, badge types, buttons, inputs, circular SVG gauges, skeleton shimmers, and chat bubbles.
* `css/layout.css` — Collapsible desktop sidebar, horizontal bottom mobile nav, header panels, responsive queries.
* `css/pages.css` — Map overlay viewports, chat layouts, timeline paths, grid column layouts, table structures.
* `css/animations.css` — Page transition keyframes, glowing outlines, typing dots indicators, dashes route offsets.

### 3. Logic
* `js/utils.js` — DOM shortcuts, animate counter logic, formatters, localStorage, toast alerts.
* `js/data.js` — 16 World Cup host stadiums database, coordinate zones, concessions menu, transport parking options, alert simulators.
* `js/gemini.js` — Gemini API service. Handles request contents structures, SSE chunks parsing, history storage, system instructions mapping.
* `js/stadium-map.js` — Renders the interactive SVG layout, dynamically updates fill properties, triggers detail cards on click.
* `js/crowd.js` — Renders tables, updates stats, triggers bottleneck alerts, gathers AI suggestions.
* `js/navigation.js` — Coordinates calculations, step text structures, draws SVG dash paths on the map.
* `js/transport.js` — Tab renders, nj transit timers, triggers Gemini transport streams.
* `js/accessibility.js` — Renders features, manages global body style sheet overrides (accessibility-mode).
* `js/sustainability.js` — Sustainability dashboard, green score gauges.
* `js/ops.js` — Timeline milestones, command center resource status cards, triggers Gemini alert advice streams.
* `js/app.js` — SPA router, role bindings, score clocks, occupancy updates tick intervals (5 seconds).

---

## Code Highlight: Gemini API Streaming Service

Below is the chunk parsing implementation in `js/gemini.js` that handles REST requests and Server-Sent Events (SSE) stream decoding:

```js
chatStream: async function(userMessage, feature = 'chat', additionalContext = '', onChunk = () => {}) {
  const systemPrompt = this.getSystemPrompt(feature);
  const url = `${this.baseUrl}/${this.model}:streamGenerateContent?key=${this.apiKey}`;
  const contents = this._buildContents(userMessage, additionalContext);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullResponseText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    // Parse SSE chunk stream
    try {
      let cleanText = buffer.trim();
      if (cleanText.startsWith('[')) cleanText = cleanText.substring(1);
      if (cleanText.endsWith(']')) cleanText = cleanText.slice(0, -1);
      
      const parts = cleanText.split(/,\s*\n*/);
      for (const part of parts) {
        if (part.trim() === '') continue;
        const chunkObj = JSON.parse(part);
        const chunkText = chunkObj.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunkText) {
          fullResponseText += chunkText;
          onChunk(chunkText);
        }
      }
    } catch (e) {
      // Chunk incomplete, wait for buffer
    }
  }
}
```

---

## How to Run & Verify

1. **Verify Local Dev Server:**
   The server is currently running in the background on port **3000**.
   If it is not active, you can launch it manually by navigating to the directory and running:
   ```powershell
   npx serve -p 3000
   ```

2. **Open in Browser:**
   Open your preferred browser (Chrome, Edge, Firefox) and navigate to:
   ```
   http://localhost:3000
   ```

3. **Manual Verification Checklist:**
   - **Enter Gemini API Key:** The setup dialog will appear on first launch. If you want to test the full GenAI features, paste in your API Key and hit "Connect". Alternatively, you can click "Skip for now" to run the visual interface with static fallback responses.
   - **Click Around (SPA):** Click icons on the left sidebar navigation list. The pages will transition smoothly with slide-up micro-animations.
   - **Change Roles:** Tap the role switch badges in the top right header (Fan ➡️ Staff / Organizer). When switched to Staff, notice the **Ops Center** link dynamically appears in the sidebar list.
   - **Interactive Map:** Go to the "Stadium Map" page. Click on different colored sections. The side panel will animate to show current occupancy levels, food concessions, wait times, and direct wayfinding triggers.
   - **Wayfinding:** Go to the "Navigate" page. Choose Section 215 or Concession North and map out a route. It will compute step-by-step directions and draw a blinking route line directly on the SVG map!
   - **Check mobile responsive:** Shrink the browser window width. Notice the sidebar automatically moves to the bottom as a mobile navigation bar, and grids adjust seamlessly.
