# StadiaAI — GenAI-Powered Smart Stadium Companion for FIFA World Cup 2026


## Overview

**StadiaAI** is a web-based, GenAI-powered smart stadium companion that enhances the FIFA World Cup 2026 experience for **fans, organizers, volunteers, and venue staff**. It uses the Gemini API to deliver real-time multilingual assistance, AI-powered navigation, crowd intelligence, transportation planning, accessibility support, and operational decision-making — all through a stunning, premium dark-themed UI.

---

## User Review Required

> [!IMPORTANT]
> **Gemini API Key**: The AI chat and intelligent features require a Gemini API key. You'll need to provide yours (from [Google AI Studio](https://aistudio.google.com/)) so we can wire up the GenAI features. I'll add a settings modal where you can paste it in at runtime — no `.env` file needed for the demo.

> [!IMPORTANT]
> **Scope for Hackathon**: This is designed as a **polished, deployable prototype** — not a production backend. Real-time data (crowd density, wait times, alerts) will be **simulated with realistic mock data** and animated in the UI. The GenAI chat assistant will be fully functional via the Gemini API.

---

## Open Questions

> [!NOTE]
> **Venue Focus**: I'll default to **MetLife Stadium (New York/New Jersey)** as the showcase venue since it hosts the FIFA World Cup 2026 Final. Want me to use a different stadium?

> [!NOTE]
> **Role Selection**: The app will have a role switcher (Fan / Volunteer / Staff / Organizer) that changes the dashboard context. All four roles will be built. Let me know if you want to prioritize one.

---

## Core Features

| # | Feature | GenAI Role | Target Users |
|---|---------|-----------|-------------|
| 1 | **AI Stadium Assistant** | Gemini-powered multilingual chatbot for venue Q&A, food recommendations, rules, emergencies | All |
| 2 | **Interactive Stadium Map** | AI-suggested optimal routes based on crowd density | Fans, Volunteers |
| 3 | **Crowd Intelligence Heatmap** | Real-time density visualization with AI-predicted bottlenecks | Staff, Organizers |
| 4 | **Smart Navigation** | Turn-by-turn wayfinding to seats, restrooms, food, medical, exits | Fans, Accessibility |
| 5 | **Transport Planner** | AI-powered transit/parking/rideshare recommendations | Fans |
| 6 | **Accessibility Hub** | Wheelchair routes, sensory accommodations, AI-assisted requests | Fans with disabilities |
| 7 | **Sustainability Tracker** | Carbon footprint, waste stats, eco-tips powered by GenAI | All |
| 8 | **Ops Command Center** | AI-generated alerts, resource allocation, emergency decision support | Staff, Organizers |

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Structure** | HTML5 (single `index.html`) | Hackathon simplicity, easy to deploy |
| **Styling** | Vanilla CSS | Premium dark theme, glassmorphism, animations |
| **Logic** | Vanilla JavaScript (ES modules) | No framework overhead, fast load |
| **GenAI** | Gemini API (REST via `fetch`) | Multilingual chat, smart recommendations, decision support |
| **Maps** | SVG-based stadium layout | Custom interactive map, no external dependency |
| **Charts** | Canvas API / CSS | Crowd heatmap, sustainability gauges |
| **Fonts** | Google Fonts (Inter + Outfit) | Premium, modern typography |
| **Icons** | Lucide Icons (CDN) | Clean, consistent iconography |

---

## Proposed Changes

### Project Structure

```
C:\Users\NIPUN\.gemini\antigravity\scratch\stadia-ai\
├── index.html          # Main SPA shell
├── css/
│   ├── index.css       # Design system, variables, base styles
│   ├── components.css  # Reusable component styles (cards, buttons, modals)
│   ├── layout.css      # Sidebar, header, page grid
│   ├── pages.css       # Page-specific styles (map, chat, crowd, transport, etc.)
│   └── animations.css  # Micro-animations, transitions, keyframes
├── js/
│   ├── app.js          # Main app controller, routing, initialization
│   ├── gemini.js       # Gemini API integration (chat, recommendations, decisions)
│   ├── stadium-map.js  # SVG stadium map rendering and interaction
│   ├── crowd.js        # Crowd heatmap simulation and visualization
│   ├── navigation.js   # Wayfinding and route calculation
│   ├── transport.js    # Transport planner logic
│   ├── accessibility.js # Accessibility features and routing
│   ├── sustainability.js # Sustainability tracker and gauges
│   ├── ops.js          # Operations command center logic
│   ├── data.js         # Mock data (stadium zones, schedules, venues)
│   └── utils.js        # Shared utilities (formatters, DOM helpers)
└── assets/
    └── (generated images if needed)
```

---

### Component Breakdown

#### [NEW] `index.html`
- SPA shell with sidebar navigation, header bar, and content area
- Role switcher (Fan / Volunteer / Staff / Organizer)
- API key input modal on first launch
- All 8 page sections as hidden/shown divs

#### [NEW] `css/index.css`
- CSS custom properties (design tokens): colors, spacing, radii, shadows
- Dark theme palette: `--bg-primary: #0a0e1a`, `--accent-gold: #d4a853`, `--accent-teal: #00c9a7`
- Typography scale using Inter + Outfit
- Global resets and base element styles

#### [NEW] `css/components.css`
- Glassmorphism cards (`.glass-card`)
- Stat tiles, badges, alert banners
- Buttons (primary, secondary, ghost, icon)
- Form inputs, toggles, dropdowns
- Chat message bubbles (user/AI)
- Loading spinners, skeleton screens

#### [NEW] `css/layout.css`
- Collapsible sidebar (icon-only on mobile)
- Responsive header with venue selector + role switcher
- Main content grid with scrollable regions

#### [NEW] `css/pages.css`
- Stadium map container with zoom controls
- Chat panel layout (messages + input)
- Crowd heatmap overlay grid
- Transport cards and timeline
- Accessibility route overlays
- Sustainability dashboard gauges
- Ops command center table + alert feed

#### [NEW] `css/animations.css`
- Page transition (fade-slide)
- Card hover lift + glow
- Heatmap pulse animation
- Chat typing indicator
- Stat counter increment animation
- Alert slide-in from right
- Map zone highlight shimmer

#### [NEW] `js/app.js`
- SPA router (hash-based navigation)
- Role context management
- Theme initialization
- API key persistence (localStorage)
- Event delegation setup

#### [NEW] `js/gemini.js`
- `GeminiService` class
  - `chat(message, context)` → multilingual stadium Q&A
  - `getNavRecommendation(from, to, crowdData)` → optimal route suggestion
  - `getCrowdPrediction(zoneData)` → bottleneck predictions
  - `getTransportPlan(venue, userLocation, matchTime)` → transit recommendations
  - `getOpsDecision(alertData)` → emergency/operational decision support
  - `getSustainabilityTip(stats)` → eco recommendations
- System prompts tailored per feature (stadium-aware, multilingual)
- Streaming response rendering
- Conversation history management

#### [NEW] `js/stadium-map.js`
- SVG rendering of MetLife Stadium layout (top-down view)
- Interactive zones: stands, concourses, gates, concessions, restrooms, medical
- Color-coded crowd density overlay (green/yellow/orange/red)
- Click-to-navigate: tap a zone → get AI-powered directions
- Zoom & pan controls
- Accessibility overlay toggle (wheelchair routes highlighted)

#### [NEW] `js/crowd.js`
- Simulated real-time crowd data (updates every 5 seconds)
- Zone-by-zone density percentages
- Heatmap canvas overlay on stadium map
- AI-predicted congestion alerts
- Historical trend mini-charts
- Gate throughput visualization

#### [NEW] `js/navigation.js`
- Point-to-point wayfinding within the stadium
- "From" and "To" selectors (seat, gate, food, restroom, medical, exit)
- SVG path rendering on the stadium map
- Estimated walk time considering crowd density
- Accessibility-aware routing toggle

#### [NEW] `js/transport.js`
- Venue info cards (parking, transit, rideshare zones)
- AI-generated personalized transport plan
- Live (simulated) parking availability
- Transit schedule with countdown timers
- Post-match exit strategy recommendations

#### [NEW] `js/accessibility.js`
- Accessibility mode toggle (larger text, high contrast, screen-reader hints)
- Wheelchair-accessible route finder
- Sensory room locations
- AI chat with accessibility-specific context
- Emergency assistance request button

#### [NEW] `js/sustainability.js`
- Carbon footprint estimator (travel mode → match attendance)
- Waste diversion gauge (recycling vs landfill)
- Water & energy usage stats
- AI-powered eco-tips personalized to user behavior
- "Green Score" gamification element

#### [NEW] `js/ops.js`
- Staff/Organizer-only command center
- Real-time alert feed (medical, security, weather, crowd)
- AI-generated incident response recommendations
- Resource allocation dashboard (staff deployment, gate status)
- Match-day timeline with milestones

#### [NEW] `js/data.js`
- Stadium zone definitions with coordinates
- FIFA World Cup 2026 match schedule data
- Venue information (MetLife Stadium details, capacity, facilities)
- Mock crowd data generator
- Food/concession menus
- Transport options database

#### [NEW] `js/utils.js`
- DOM query helpers
- Number formatters (comma-separated, percentages)
- Time/date formatters
- Debounce/throttle utilities
- LocalStorage wrapper

---

## Design Philosophy

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0e1a` | Main background |
| `--bg-secondary` | `#111827` | Cards, sidebar |
| `--bg-glass` | `rgba(255,255,255,0.05)` | Glassmorphism surfaces |
| `--accent-gold` | `#d4a853` | FIFA branding, highlights |
| `--accent-teal` | `#00c9a7` | Success, navigation |
| `--accent-blue` | `#3b82f6` | Interactive elements |
| `--accent-red` | `#ef4444` | Alerts, high density |
| `--text-primary` | `#f1f5f9` | Main text |
| `--text-secondary` | `#94a3b8` | Muted text |

### Typography
- **Headings**: Outfit (600-800 weight)
- **Body**: Inter (400-500 weight)
- **Monospace**: JetBrains Mono (stats, codes)

### Micro-Animations
- Card hover: 4px lift + subtle gold glow
- Page transitions: 300ms fade-slide
- Heatmap zones: pulsing opacity for high-density areas
- Chat messages: slide-up entrance
- Stat counters: animated number increment
- Alerts: slide-in from right with bounce

---

## Verification Plan

### Manual Verification
1. **Visual QA**: Open in browser, verify all 8 pages render correctly with premium styling
2. **Responsiveness**: Test at desktop (1440px), tablet (768px), and mobile (375px)
3. **AI Chat**: Test multilingual queries (English, Spanish, French, Hindi, Arabic)
4. **Navigation**: Test all wayfinding routes on the stadium map
5. **Role Switching**: Verify each role shows appropriate features
6. **Accessibility**: Test with keyboard navigation and screen reader
7. **Performance**: Verify smooth animations at 60fps

### Deployment Test
- Serve locally with a simple HTTP server (`npx serve .`)
- Verify all assets load correctly
- Test Gemini API integration end-to-end
