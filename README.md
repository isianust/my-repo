<div align="center">

# 🎮 G2048

**A Modern, Multi-Stage 2048 Game with Coin Economy System**

[![Auto Tag](https://github.com/isianust/G2048/actions/workflows/auto-tag.yml/badge.svg)](https://github.com/isianust/G2048/actions/workflows/auto-tag.yml)
![Version](https://img.shields.io/github/v/tag/isianust/G2048?label=version&sort=semver)
![License](https://img.shields.io/github/license/isianust/G2048)
![Language](https://img.shields.io/badge/language-JavaScript-yellow)
![No Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

*An enhanced 2048 puzzle game built with vanilla JavaScript — featuring 5 progressive stages, a coin economy, and a harvester mechanism.*

[Play Now](#getting-started) · [Features](#features) · [Architecture](#architecture) · [Roadmap](#roadmap)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Demo](#demo)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Version Comparison](#version-comparison)
- [Testing](#testing)
- [CI / CD](#ci--cd)
- [Roadmap](#roadmap)
- [Enterprise Expansion Plan](#enterprise-expansion-plan)
- [Recommended Tool Stack](#recommended-tool-stack)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

G2048 takes the classic [2048 puzzle game](https://en.wikipedia.org/wiki/2048_(video_game)) and expands it with a **multi-stage progression system**, a **coin economy**, and a **harvester mechanic** — transforming a simple tile-merging game into a deeper, more strategic experience.

The project ships two versions:

| Version | Description |
|---------|-------------|
| **V1** (Classic) | Faithful recreation of the original 2048 — single HTML file, keyboard & touch support |
| **V2** (Enhanced) | Modular architecture with 5 stages, 3 coin types, harvester, score breakdown, and responsive design |

> **Zero dependencies.** Pure HTML, CSS, and vanilla JavaScript — runs in any modern browser without a build step.

---

## Features

### 🧩 Core Gameplay
- 4×4 grid with smooth tile merging
- Keyboard controls (Arrow keys / WASD) and touch/swipe support
- Persistent best score via `localStorage`
- Win & game-over overlays

### 🏆 5-Stage Progression (V2)
| Stage | Unlock Threshold | Coins Available |
|-------|-----------------|-----------------|
| 1 | Start | — |
| 2 | Max tile ≥ 64 | 🟤 Bronze |
| 3 | Max tile ≥ 1024 | ⚪ Silver |
| 4 | Max tile ≥ 2048 | 🟡 Gold |
| 5 | Max tile ≥ 4096 | 🟤🟡⚪ All |

### 💰 Coin Economy (V2)
| Coin | Icon | Points per Coin |
|------|------|----------------|
| Bronze | 🟤 | 1 000 × count |
| Silver | ⚪ | 2 000 × count |
| Gold | 🟡 | 3 000 × count |

### 🌾 Harvester Mechanism (V2)
- Every **30 moves**, the harvester automatically collects all coins on the board
- Visual overlay with collection animation
- Collected coins contribute to the final score breakdown

### 📊 Score Breakdown (V2)
- Game-over screen shows detailed scoring: tile score + coin bonuses per type
- Transparent, strategy-rewarding scoring system

---

## Demo

Open **`index.html`** (V1) or **`v2/index.html`** (V2) directly in your browser — no server required.

```
# macOS
open v2/index.html

# Linux
xdg-open v2/index.html

# Windows
start v2/index.html
```

Or serve locally for a better development experience:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (npx)
npx serve .
```

Then visit `http://localhost:8080/v2/`.

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- **For testing:** [Node.js](https://nodejs.org/) ≥ 18

### Installation

```bash
git clone https://github.com/isianust/G2048.git
cd G2048
```

### Run Tests

```bash
node v2/game.test.js
```

---

## Project Structure

```
G2048/
├── index.html               # V1 — Classic 2048 (single-file)
├── v2/
│   ├── index.html           # V2 — HTML entry point
│   ├── style.css            # V2 — Responsive styles
│   ├── game.js              # V2 — Game engine (logic, state, scoring)
│   ├── ui.js                # V2 — UI controller (DOM, events, rendering)
│   └── game.test.js         # V2 — Unit tests (custom assert framework)
├── .github/
│   └── workflows/
│       └── auto-tag.yml     # Automatic semantic version tagging
└── README.md
```

---

## Architecture

V2 follows a **Model–View separation** pattern:

```
┌───────────────────────────────────────────────────┐
│                     Browser                       │
│  ┌─────────────┐    events     ┌───────────────┐  │
│  │   ui.js     │ ──────────── │   game.js     │  │
│  │  (View)     │              │  (Model)      │  │
│  │             │ ◄─────────── │               │  │
│  │ DOM updates │   state      │ Grid, Coins,  │  │
│  │ Events      │   changes    │ Stages, Score │  │
│  └─────────────┘              └───────────────┘  │
│         │                            │            │
│         ▼                            ▼            │
│   index.html                  game.test.js        │
│   style.css                   (Node.js tests)     │
└───────────────────────────────────────────────────┘
```

| Module | Responsibility |
|--------|---------------|
| **`game.js`** | Pure game logic — grid manipulation, movement, coin spawning, stage transitions, score calculation. Framework-agnostic and fully testable. |
| **`ui.js`** | DOM rendering, event binding (keyboard, touch, buttons), overlay management, score display. |
| **`game.test.js`** | Comprehensive unit tests using a custom assertion framework — runs on Node.js without browser dependencies. |

---

## Version Comparison

| Feature | V1 (Classic) | V2 (Enhanced) |
|---------|:---:|:---:|
| 4×4 Grid | ✅ | ✅ |
| Keyboard + Touch | ✅ | ✅ |
| Best Score Persistence | ✅ | ✅ |
| Modular Code | ❌ | ✅ |
| 5 Stages | ❌ | ✅ |
| Coin Economy | ❌ | ✅ |
| Harvester | ❌ | ✅ |
| Score Breakdown | ❌ | ✅ |
| Unit Tests | ❌ | ✅ |
| Responsive Design | Basic | ✅ |

---

## Testing

Tests are located in `v2/game.test.js` and cover:

- ✅ Constants validation (coin types, multipliers, stages)
- ✅ Stage definitions and unlock thresholds
- ✅ Tile styling configuration
- ✅ Grid operations (empty grid creation, tile spawning)
- ✅ Coin spawning logic per stage
- ✅ Movement mechanics (left, right, up, down)
- ✅ Coin tracking during tile merging
- ✅ Harvester functionality
- ✅ Score calculations and breakdowns

Run all tests:

```bash
node v2/game.test.js
```

---

## CI / CD

### Automatic Version Tagging

Every push to `main` triggers the **Auto Tag Generator** workflow (`.github/workflows/auto-tag.yml`):

- Uses [semantic versioning](https://semver.org/) (e.g., `v1.0.0` → `v1.0.1`)
- Default bump type: **patch**
- Controlled via commit message keywords:
  - `#major` — major version bump
  - `#minor` — minor version bump
  - `#patch` (default) — patch version bump
  - `#none` — skip tagging

---

## Roadmap

### Short-Term (v1.x)
- [ ] Add animations for tile movement and merging
- [ ] Add sound effects for key actions
- [ ] Implement undo/redo functionality
- [ ] Add a leaderboard with local storage
- [ ] PWA support (offline play, installable)

### Mid-Term (v2.x)
- [ ] Multiplayer mode (competitive / cooperative)
- [ ] Additional board sizes (5×5, 6×6)
- [ ] Custom themes and skins
- [ ] Achievement / badge system
- [ ] Internationalization (i18n)
- [ ] Accessibility improvements (ARIA, screen reader support)

### Long-Term (v3.x)
- [ ] Backend integration for cloud leaderboards
- [ ] User authentication and profiles
- [ ] Real-time multiplayer via WebSocket
- [ ] Daily / weekly challenges
- [ ] Analytics dashboard for gameplay statistics

---

## Enterprise Expansion Plan

Below is a proposed enterprise-grade strategy for scaling G2048 into a production-ready platform:

### 1. 🏗️ Architecture Redesign

| Area | Current | Proposed |
|------|---------|----------|
| **Frontend Framework** | Vanilla JS | **React** or **Vue 3** with TypeScript |
| **State Management** | In-memory variables | **Zustand** / **Pinia** or Redux Toolkit |
| **Build System** | None | **Vite** (fast HMR, optimized builds) |
| **Styling** | Plain CSS | **Tailwind CSS** or CSS Modules |
| **Testing** | Custom asserts | **Vitest** + **Playwright** (E2E) |
| **Package Manager** | None | **pnpm** (fast, disk-efficient) |

### 2. 📦 Recommended Tool Stack

| Category | Tool | Purpose |
|----------|------|---------|
| **Build** | [Vite](https://vite.dev/) | Lightning-fast dev server and optimized production builds |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type safety, better IDE support, refactoring confidence |
| **UI Framework** | [React](https://react.dev/) or [Vue](https://vuejs.org/) | Component-based architecture, large ecosystem |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS, design system consistency |
| **Unit Testing** | [Vitest](https://vitest.dev/) | Vite-native test runner, fast and compatible |
| **E2E Testing** | [Playwright](https://playwright.dev/) | Cross-browser end-to-end testing |
| **Linting** | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) | Code quality and formatting consistency |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | Automated testing, build, and deployment |
| **Hosting** | [Vercel](https://vercel.com/) / [Netlify](https://www.netlify.com/) | Zero-config static deployment with preview URLs |
| **Backend** | [Supabase](https://supabase.com/) or [Firebase](https://firebase.google.com/) | Auth, database, real-time features (BaaS) |
| **Analytics** | [PostHog](https://posthog.com/) | Open-source product analytics |
| **Monitoring** | [Sentry](https://sentry.io/) | Error tracking and performance monitoring |

### 3. 🔄 Migration Strategy

```
Phase 1 — Foundation (2–3 weeks)
  ├── Initialize Vite + TypeScript project
  ├── Migrate game.js → game.ts (add type annotations)
  ├── Set up Vitest, migrate existing tests
  ├── Configure ESLint + Prettier
  └── Set up CI pipeline (lint → test → build)

Phase 2 — UI Modernization (2–3 weeks)
  ├── Adopt React/Vue component architecture
  ├── Implement Tailwind CSS design system
  ├── Add animations (Framer Motion / Vue Transition)
  ├── Add PWA support (service worker, manifest)
  └── Responsive redesign for all breakpoints

Phase 3 — Feature Expansion (3–4 weeks)
  ├── Undo/redo system
  ├── Achievement system
  ├── Sound effects & haptic feedback
  ├── i18n (English, Chinese, Japanese)
  └── Accessibility audit (WCAG 2.1 AA)

Phase 4 — Backend Integration (3–4 weeks)
  ├── Set up Supabase/Firebase project
  ├── User authentication (OAuth, email)
  ├── Cloud leaderboards & score sync
  ├── Daily challenges system
  └── Real-time multiplayer (WebSocket)

Phase 5 — Production Hardening (2 weeks)
  ├── Playwright E2E test suite
  ├── Performance optimization (Lighthouse 95+)
  ├── Sentry error tracking
  ├── Analytics integration
  └── Deploy to Vercel/Netlify with preview environments
```

### 4. 📐 Proposed V3 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (SPA)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  React/  │  │  Game    │  │  State   │  │  Router    │  │
│  │  Vue     │  │  Engine  │  │  Store   │  │            │  │
│  │  Components│ │  (TS)   │  │(Zustand) │  │            │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Auth    │  │  Score   │  │  Match   │  │  Analytics │  │
│  │  Service │  │  Service │  │  Service │  │  Service   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   Backend (BaaS)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase / Firebase                                 │   │
│  │  • Auth  • Database  • Real-time  • Storage          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Commit Message Convention

This project uses semantic versioning via auto-tagging. Include these keywords in your commit messages:

- `#major` — Breaking changes
- `#minor` — New features
- `#patch` — Bug fixes (default)
- `#none` — No version bump

---

## License

This project is open source. See the repository for license details.

---

<div align="center">

**Built with ❤️ using vanilla JavaScript**

[⬆ Back to Top](#-g2048)

</div>
