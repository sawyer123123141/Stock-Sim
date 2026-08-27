# Stage 1 Web Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable Market Era desktop web client: a small, credible live market view with a short asset list, Nova Motors detail, an authoritative live chart, fictional-money Buy/Sell, cash/holdings, one movement explanation, and one next objective.

**Architecture:** Add a focused React + Vite client under `apps/web/` that treats the Fastify server as authoritative. HTTP loads market/portfolio state and submits trade intent; the existing WebSocket stream updates live prices. Client modules stay small: transport, session state hook, chart renderer, trade ticket, and the single Stage-1 screen. The chart keeps only session-local authoritative snapshots so no fake historical data is invented.

**Tech Stack:** TypeScript, React, React DOM, Vite, existing Fastify HTTP/WebSocket server, Node built-in test runner.

**Spec:** `docs/mockups/2026-08-27-current-ui-direction.md`

## Global Constraints

- Market core credible; surrounding experience game-like.
- Stage 1 shows portfolio value/cash, roughly 3–5 assets, one simple live chart, current price/movement, one Buy/Sell path, one explanation, and one next goal.
- No extra spendable currencies, advanced orders, top-movers wall, detailed research, event-marker wall, alerts, or permanent progression clutter.
- Client never supplies canonical prices, balances, holdings, or arbitrary player identity.
- Server remains authoritative for prices and portfolio accounting.
- Node.js 24 LTS preferred; minimum Node 22.12.
- No UI framework or client state library in this slice.
- Accessible keyboard/focus behavior and reduced-motion support are required.

---

### Task 1: Web app scaffold and verification boundary

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/index.html`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/styles.css`
- Create: `tests/web-static.test.mjs`

**Interfaces:**
- Consumes: root npm scripts and Node test runner.
- Produces: `npm run build:web`, `npm run dev:web`, and a mountable React application at `apps/web/src/App.tsx`.

- [ ] **Step 1:** Add a failing static-boundary test that requires `#root`, React mounting, exported `App`, and root `build:web`/`dev:web` scripts.
- [ ] **Step 2:** Run `npm test`; expected RED because client files/scripts do not exist.
- [ ] **Step 3:** Add React/Vite dependencies and `dev:web` / `build:web` scripts while keeping existing server/test scripts.
- [ ] **Step 4:** Keep root server/shared TypeScript compilation separate and create `apps/web/tsconfig.json` using DOM libs, `jsx: react-jsx`, Bundler resolution, strict mode, and no emit.
- [ ] **Step 5:** Scaffold Vite at `apps/web`, production output `dist-web`, with dev proxies for `/api` and `/ws` to `127.0.0.1:3000`.
- [ ] **Step 6:** Run `npm test && npm run typecheck && npm run build:web`; all PASS.
- [ ] **Step 7:** Commit `feat: scaffold stage 1 web client`.

---

### Task 2: Authoritative browser transport and session state

**Files:**
- Create: `apps/web/src/api.ts`
- Create: `apps/web/src/useMarketSession.ts`
- Create: `apps/web/src/format.ts`
- Modify: `tests/web-static.test.mjs`

**Interfaces:**
- Consumes: shared market/trading contracts; `/api/market`, `/api/portfolio`, `/api/trades`, `/ws/market`.
- Produces: `fetchMarket()`, `fetchPortfolio()`, `submitTrade(intent)`, `openMarketSocket(onSnapshot)`, and `useMarketSession()`.

- [ ] **Step 1:** Extend tests to require authority-safe transport. Trade POST body may contain only `assetId`, `side`, and `quantity`, never canonical price/cash/player/holdings.
- [ ] **Step 2:** Run `npm test`; expected RED.
- [ ] **Step 3:** Implement typed same-origin HTTP transport and stable non-2xx error parsing.
- [ ] **Step 4:** Implement `ws:`/`wss:` market socket with cleanup and bounded reconnect behavior.
- [ ] **Step 5:** Implement `useMarketSession`: parallel initial market/portfolio load, Nova default, live socket updates, maximum 120 authoritative session-local samples per asset, duplicate-timestamp suppression, and immediate portfolio replacement from successful trade response.
- [ ] **Step 6:** Add `Intl.NumberFormat` helpers for money, signed percent, and quantities.
- [ ] **Step 7:** Run `npm test && npm run build:web`; commit `feat: connect web client to authoritative market`.

---

### Task 3: Credible beginner chart and asset rail

**Files:**
- Create: `apps/web/src/components/PriceChart.tsx`
- Create: `apps/web/src/components/AssetRail.tsx`
- Create: `apps/web/src/components/MarketHeader.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `tests/web-static.test.mjs`

**Interfaces:**
- Consumes: selected asset, authoritative session price samples, market assets, portfolio totals.
- Produces: accessible asset selection and responsive SVG line chart.

- [ ] **Step 1:** Add structural tests requiring header, 3–5 visible asset buttons, chart SVG `role="img"`, and rejecting `Shop`, `Gems`, `Energy`, `Limit Order`, `Margin`, `Top Movers`.
- [ ] **Step 2:** Run `npm test`; expected RED.
- [ ] **Step 3:** Implement dependency-free responsive SVG `PriceChart`, including one-point fallback, min/max labels, subtle grid, and descriptive aria label.
- [ ] **Step 4:** Implement native-button asset rail limited to first five assets with symbol/name/price/last-tick movement and a non-color-only selected state.
- [ ] **Step 5:** Implement compact header with `MARKET ERA`, `Market Live`, total portfolio value, and cash only.
- [ ] **Step 6:** Compose upper screen with the chart as visual focal point and explicit loading/error states.
- [ ] **Step 7:** Run `npm test && npm run build:web`; commit `feat: add live market detail view`.

---

### Task 4: Simple Buy/Sell and position feedback

**Files:**
- Create: `apps/web/src/components/TradeTicket.tsx`
- Create: `apps/web/src/components/PositionCard.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `tests/web-static.test.mjs`

**Interfaces:**
- Consumes: selected asset, selected position, cash, `trade(side, quantity)`, pending/error state.
- Produces: whole-unit Buy/Sell intent and compact position feedback.

- [ ] **Step 1:** Add tests requiring Buy/Sell modes, positive integer quantity input, display-only estimate, one confirm action, cash/owned quantity, and no advanced order controls.
- [ ] **Step 2:** Run `npm test`; expected RED.
- [ ] **Step 3:** Implement `TradeTicket` with quantity validation, client-side obvious affordability/holdings disablement, pending state, and visible authoritative server errors.
- [ ] **Step 4:** Implement `PositionCard`: units, average cost, market value, unrealized gain/loss when owned; beginner sentence when unowned.
- [ ] **Step 5:** Add restrained successful-trade pulse that respects `prefers-reduced-motion`; no confetti/casino reward effects.
- [ ] **Step 6:** Run `npm test && npm run build:web`; commit `feat: add beginner buy sell flow`.

---

### Task 5: Explanation, objective, responsive polish, and handoff

**Files:**
- Create: `apps/web/src/components/MovementStory.tsx`
- Create: `apps/web/src/components/NextObjective.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `tests/web-static.test.mjs`

**Interfaces:**
- Consumes: selected asset reasons, portfolio positions, final layout.
- Produces: one beginner explanation, one derived first objective, responsive playable, accurate docs.

- [ ] **Step 1:** Add tests requiring exactly one movement-story and next-objective composition, narrow-screen fallback, reduced-motion rule, and README web/server run instructions.
- [ ] **Step 2:** Run `npm test`; expected RED.
- [ ] **Step 3:** Implement `Why <symbol> moved` from the strongest reason only, with neutral fallback when no driver dominates.
- [ ] **Step 4:** Implement objective: no holdings → `Make your first investment`; otherwise → `Own 2 different assets` with progress. No extra currency reward.
- [ ] **Step 5:** Polish hierarchy: compact header, narrow asset rail, large market surface, right trade/position column, small explanation/objective strip; stack safely on narrow screens.
- [ ] **Step 6:** Update README and AGENTS, including correcting stale PR #2 status and recording Stage-1 files/verification/next task.
- [ ] **Step 7:** Run `npm install`, `npm test`, `npm run typecheck`, `npm run build:web`.
- [ ] **Step 8:** Compare branch against `main` and reject accidental database/auth/advanced-market scope or fake data/currencies.
- [ ] **Step 9:** Commit `feat: complete stage 1 playable client`.
- [ ] **Step 10:** Open PR; merge only after current-head PR CI passes.
