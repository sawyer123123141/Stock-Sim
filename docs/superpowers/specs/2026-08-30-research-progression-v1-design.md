# Research Progression V1 Design

## Status and decision

**Status:** Revised design for independent review. No production implementation has begun.

**Goal:** turn Research from an automatic, global readout into a small, durable player capability. A player chooses which stock to understand more deeply; the game supplies broad, current qualitative interpretation for that one focus without answering the trade for them.

The governing rule from Market Operations remains unchanged:

> Automation reduces attention cost, not decision-making.

Research Progression V1 is the first-person foundation for that rule. It is not a specialist, department, ownership, or automated-trading system.

## 1. Actual starting point

This design is based on the post-Story Lifecycle V1 game, not an older roadmap assumption.

Today, a player receives the following without any progression state:

* a selected asset's identity, price, latest move, live session chart, Buy/Sell ticket, position, cash, and portfolio value;
* Market Read's two server-classified current-state sentences;
* the compact Why the Move explanation;
* public Developing Stories, recent public stories, and public archive history on demand;
* stock Company profiles, including public business-connection names and broad role labels;
* every stock's complete qualitative Company Outlook and Market Expectations in the normal shared `MarketSnapshot` today;
* no stock-company Research tab for crypto.

The authoritative runtime already keeps the following private: raw fundamentals, raw expectations, priced expectations, expectation gaps, outcomes and expected outcomes before/after publication as appropriate, surprise/effect values, investor readings, relationship coefficients, active private story plans, applied markers, and RNG/recovery state. The current portfolio and market are persisted in the canonical locked game state, but the current objective is only browser-session memory.

The free experience is already good enough to make a first imperfect decision. V1 must retain that property.

## 2. Player-facing information contract

### Free from minute one

The following remains visible to every player without coverage. It is public market information or necessary trading context, not a reward to withhold:

* asset identity, company description, sector, public business-connection identity/role, price, chart, latest move, Market Read, Why the Move, and trade/position controls;
* all already-public Developing, Recent, and Archive Stories through the existing bounded history path;
* public chart markers and their published title, timestamp, summary, and related-company label;
* the distinction between stocks and crypto, including no invented corporate profile for crypto;
* a compact Research-tab explanation of what focused research can add once the player has access to it.

This means a beginner can still see a headline, notice the price reaction, inspect their portfolio, and act. The game does not conceal obvious public facts just to create a lock.

### Requires active company coverage

For the one stock the player is actively covering, Research shows a **current research brief** with three compact sections:

1. **Company outlook** — broad labels for growth, profitability, financial health, competitive position, and reputation.
2. **Market expectations** — broad labels for growth, profitability, demand, and execution, plus short neutral learning copy explaining that high expectations can make merely good news unremarkable.
3. **Research context** — short, relationship-aware prose that explains why a known public connection can matter and links the player back to already-public relevant stories.

The player compares Company outlook and Market expectations themselves. The brief never resolves the comparison into Buy, Sell, fair value, target price, future return, a hidden expectation gap, or a prediction.

An unfocused stock has no Company Outlook or Market Expectations rows in the player-facing snapshot. It may still show the unobstructed free Company and Stories surfaces above.

## 3. Chosen mechanic: personal active coverage

V1 uses **coverage**, not money, an energy meter, timed jobs, or a generic experience bar.

After the player's first successful **stock** purchase, they may choose one stock as their **Research Focus**. Starting coverage is the core player action. The focused stock receives the current brief described above. Choosing another stock deliberately moves the single focus; it does not mutate the market, make a trade, or expose an unbounded data set.

Early capacity is exactly **one active stock coverage slot**. This is an attention limit: the player chooses the company whose deeper context they want available while they decide what to do next. It is not a charge, cooldown, or paid service.

Coverage has these V1 properties:

* **Coverage:** yes. One current stock can receive a complete, broad qualitative brief.
* **Depth:** one useful level in V1. The brief deliberately combines the existing two research sections with relationship context rather than splitting nine rows into repetitive unlock chores.
* **Freshness:** active coverage is always projected against the latest canonical market state. It does not decay on a timer and never asks the player to click refresh. Moving the focus simply changes which single company has a current brief.
* **History:** Stories remain public. Coverage adds interpretation and connection context; it does not lock or duplicate the public archive.

The intentional trade-off is simultaneous attention, not the ability to inspect a fact forever. A player may move focus at any time, but only one company gets live deep interpretation in the compact day-to-day experience. Later capability can add maintained coverage slots without changing the meaning of a coverage record.

## 4. Early loop and onboarding

The current first-session goal is `Own 2 assets`, held only in browser memory. Research needs durable player state, so V1 moves only the minimal objective/progression needed for this sequence into the existing server-owned demo-player record. It does not build accounts, a broad achievement system, or a new currency.

The first-session path is:

1. **Explore the public market** — price, stories, Market Read, Why the Move, Company, and normal trading are enough to make a first imperfect decision.
2. **Make the first successful stock purchase** — this unlocks the one personal Research Focus. A crypto purchase leaves the market fully playable but does not unlock invented company research.
3. **Choose a company to research** — the header's next compact objective invites the player to select a stock and start coverage. The action completes this introduction; it is not a recurring quest.
4. **Return to broader investing** — a later compact objective can ask the player to own or investigate multiple assets. That later objective is not a prerequisite for learning Research.

There is no quota such as “read five stories,” no timer, and no reward loop for changing focus. The strategy is deciding where the player's limited live attention belongs.

V1's progression is intentionally small: the first stock purchase leads to one personal coverage capability. Expanding capacity is a later progression decision, not an invisible level meter in this slice.

## 5. Qualitative interpretation and limits

The server remains responsible for classification. It may reuse the existing broad deterministic research bands, but those labels move behind the player-specific coverage projection.

Player-facing language stays broad and current, for example:

* “Growth outlook is strong.”
* “Profitability remains mixed.”
* “Investors expect strong demand.”
* “Investors remain cautious on execution.”
* “LUMA's public battery developments can affect expectations around NOVA's execution.”

The same raw labels must never leak. The client must not calculate bands from raw values, combine private values into an apparent recommendation, or infer a future event.

Research may use the current authoritative state to form broad interpretation, but it must not include:

* normalized fundamentals, expectations, priced expectations, or expectation gaps;
* future story updates, hidden outcomes, expected outcomes, surprise, event effects, reaction data, or event timing not already public;
* investor-group readings, player-pressure values, relationship weights/deltas, coefficients, RNG, recovery state, or applied markers;
* exact valuation, price targets, return forecasts, or Buy/Sell recommendations.

The wording must not suggest an omniscient analyst. A brief describes the company and what investors currently expect; it does not say what will happen next.

## 6. Stories, public history, and Market Network

Story Lifecycle V1 remains the source of public history. Research does not alter story publication, lifecycle, archive pagination, chart-marker range requests, relevance, or private/public stripping.

For a covered stock, Research Context may:

* summarize the *public* economic role of an existing connection;
* point to a published direct, sector, global, or actual-spillover related-company story already eligible for the selected stock;
* help the player understand the difference between a public result and the market's broad expectations without revealing the unpublished truth or the numeric surprise.

It may not promote a pending story, surface a connection with no actual public spillover, state a relationship coefficient, or use an archived story outside the normal bounded history mechanisms.

The Stories tab remains the full public record. Overview remains tiny. Research is a reading aid rather than another news feed.

## 7. Crypto

Research Progression V1 is specifically **company coverage**. Stocks can be focused because the simulation has company fundamentals and market expectations that support a safe qualitative research brief.

Crypto remains fully playable with its free price/chart, Market Read, Why the Move, public stories, and trading surfaces. It receives neither fabricated company fundamentals nor a meaningless locked Research panel. A crypto-focused market-context capability is deferred to a later Market Intelligence/crypto research slice, when it has non-fictional meaningful information to provide.

The future coverage model should use a generic subject identifier rather than a stock-only database shape, so a later crypto or sector capability can be added without rewriting player progression. V1 validates the active focus as a stock.

## 8. Server authority and persistence design

Research state is per player, not global market state. The architecture has two deliberate ownership layers:

* **Shared market information:** prices, public stories/history, Market Read, public movement explanations, public company identity, and basic public business relationships. This remains the same for every client and stays in the normal `MarketSnapshot`/polling/WebSocket contract.
* **Player research information:** unlock state, active focus asset ID, focused qualitative Company Outlook, focused qualitative Market Expectations, and deeper interpretation of public relationships. This is returned only through a player-owned projection.

Player research belongs beside the persisted portfolio in the existing locked `PersistedGameState`, conceptually:

```ts
interface PlayerResearchState {
  firstStockPurchaseComplete: boolean;
  unlocked: boolean;
  activeStockAssetId?: string;
  coverageCapacity: 1;
}
```

This is intentionally a conceptual V1 shape, not a finalized production type. It must hydrate legacy states safely as locked/unfocused, and it must be updated under the existing Postgres row-lock transaction architecture. The successful purchase that first establishes a positive **stock** position records `firstStockPurchaseComplete` atomically with the portfolio mutation; a crypto-only purchase does not. Selecting coverage has no effect on canonical market simulation, market timing, stories, prices, trades, or another player's projection.

The normal shared `MarketSnapshot` and polling/WebSocket contract must stop carrying `AssetSnapshot.research` for every stock. A player-specific server path instead returns a safe `ResearchProgressionSnapshot`: the player's unlock/capacity/focus status plus a brief only for the valid focused stock. The authority computes the qualitative brief at the current canonical market state during the locked request; the browser renders it and cannot manufacture access for another asset. Selecting a Research Focus changes only this player-owned state; it never changes global prices, stories, relationships, trade outcomes, canonical time, or any other player's market snapshot.

This keeps shared traffic bounded, avoids leaking a player's progression into public market updates, and preserves the current public/private boundary. No new database table is required: the small player state lives in the existing persisted state for V1. No full account/auth system is introduced.

## 9. UI architecture

The existing selected-asset tabs remain the only local navigation. There is no top-level Research dashboard, skill tree, or second app shell.

For a stock:

* **Before Research unlock:** the Research tab explains in one compact empty state that company research becomes available after the first stock purchase. It does not show a giant locked panel.
* **Unlocked but not focused:** the tab explains the one-company focus, names the choice, and offers one labelled action: “Research this company.” It also clearly identifies which stock is currently focused before a deliberate move.
* **Focused:** the current brief replaces the old always-free panel. It uses the existing compact research-row visual vocabulary, then a small “Move research focus” action.

Company retains public identity and public connection labels. Stories retains public history. Overview retains the chart and trading surface. On mobile, the tab stays a single-column reading surface with one obvious focus action; it must not add horizontal controls, progress bars, or a persistent overlay.

The existing header objective chip remains the introduction point. Once Research Focus is introduced, it uses the game-layer chip rather than competing with Market Read, Why the Move, or Developing Stories.

The visual direction remains “Calm interface. Colorful companies. Living economy.” Existing Robinhood-style progressive hierarchy, Coinbase-style accessible component discipline, and Duolingo-style one clear next step/negative space inform the work; none imply brokerage density, exchange styling, a lesson path, or childish unlock spectacle.

## 10. Future compatibility

### Specialists and departments

Later Research and Market Intelligence systems can maintain additional coverage slots or scopes using the same server-owned coverage concept. A later specialist may keep a chosen company or sector brief current, filter what deserves attention, or offer a bounded qualitative interpretation of public information. That changes attention cost, not source information or decision authority.

V1 deliberately does not add employee entities, salaries, department levels, analyst accuracy, confidence scoring, monitoring alerts, or automated focus switching.

### Company ownership

Research is deliberately separate from positions and ownership. Owning a stock neither forces research work nor automatically reveals a deeper brief. Future shareholder/ownership systems may add ownership-specific public or governance context alongside this coverage model, but must not replace it or infer control from a research focus.

This keeps future business-health, expectation, operational-weakness, relationship, and history analysis compatible with company ownership without making research a hidden ownership prerequisite.

## 11. Alternatives considered

### A. Keep all qualitative Research free (current implementation)

This is beginner-friendly but offers no research gameplay, no prioritization, and no foundation for later coverage automation. It also makes the Research tab a passive presentation of every useful company interpretation.

**Rejected:** it cannot express the intended progression from personal investigation to managed coverage.

### B. Timed topic jobs or a per-company knowledge bar

The player would click “research profitability” or wait for an investigation to finish, unlocking many narrow rows one at a time. It could create topic choice, but at this market cadence it would mostly reward returning to click through timers. A player could also feel punished for failing to refresh research after every story.

**Rejected:** it is a chore-shaped XP/timer system, risks looking pay-to-skip later, and splits one useful brief into artificial micro-unlocks.

### C. Chosen active company coverage (recommended)

The player selects the company whose deeper qualitative context is available now. The early limit is one concurrent coverage slot; switching is deliberate but not charged or timed. Depth is useful immediately and stays current while focused. Later tools can expand or maintain coverage without changing what the player decides.

**Chosen:** it creates a real focus decision with the smallest UI/state model, preserves first-session clarity, and cleanly extends to future specialists and ownership without becoming an information-vending machine.

## 12. Non-goals and explicit deferrals

Research Progression V1 does not implement:

* specialists, departments, analyst hires, analyst confidence/accuracy, AI analysts, alerts, scanners, or automatic focus;
* company ownership, shareholder rights, governance, management capacity, or company control;
* money costs, research currency, energy, timers, skip mechanics, XP bars, skill trees, achievements, or monetization;
* stock comparisons, sector dashboards, financial statements, valuation ratios, target prices, forecasts, or advanced orders;
* crypto company research, fake crypto fundamentals, macroeconomics, or broad content expansion;
* changes to simulation values, event behavior, market cadence, persistence locks, trade execution, story lifecycle, or Market Network semantics.

## 13. Acceptance criteria for a later implementation plan

A subsequent implementation plan must prove all of the following:

1. a new player retains every free first-session market/trading surface listed in this spec;
2. an unfocused stock never serializes a qualitative brief through shared market traffic or a player-specific response;
3. a focused stock receives only the named broad labels and public-context prose;
4. raw/private state and all future information remain absent from serialized responses;
5. focus updates and objective/progression state persist across refresh/server restart and are isolated from the shared market;
6. the first successful stock purchase, but not a crypto purchase, unlocks Research Focus atomically with its portfolio mutation;
7. focus selection is server-authoritative, valid only for a current stock, and does not change simulation or trade state;
8. one active capacity is enforced deterministically without timers, money, or a new currency;
9. Stories/related-company relevance remain public, bounded, and unchanged for unfocused and focused stocks alike;
10. crypto remains compatible without fake company research;
11. keyboard, desktop, and approximately 390px mobile layouts preserve the existing calm hierarchy.

## 14. Self-review

**Repetition/chore risk:** no timed jobs, per-row unlocks, refill meters, or required refreshes. One focus changes only when the player has a real reason to inspect a different company.

**Pay-to-win risk:** no payment, premium data, or purchasable capacity. Future departments can reduce attention cost but must still analyze legitimate public information and remain non-predictive.

**Over-restriction risk:** first-session public information and full public history remain visible. The gate applies only to deep interpretation after the player's first stock purchase; the player can still make a meaningful initial trade.

**Information-leak risk:** the player-specific projection is server-owned and broad. It excludes raw state, future plans, outcomes, gaps, formulas, and recommendations. It does not move simulation authority or use browser classification.

**Ownership and account compatibility:** the market projection remains shared, while the small coverage record is keyed to the player alongside their portfolio. The current demo player therefore works now without making focus shared state; a future account key can replace the demo ID without changing the ownership boundary.

**Onboarding check:** the unlock follows the first successful stock purchase, so it can inform the second investment decision. It does not treat a crypto purchase as a reason to fabricate company research, and broader multi-asset guidance comes later.

**Specialist compatibility:** a later specialist or department can add/maintain coverage using the same player-owned records. It cannot alter the public market state or turn the research brief into a trading recommendation.

**Scope check:** this is one vertical foundation: persistent player focus, a safe focused brief, and a compact onboarding transition. Capacity expansion, topic jobs, specialists, ownership, and crypto analysis remain separate future slices.

There are no unresolved product decisions required before a later implementation plan. The implementation may choose exact prose and endpoint names while preserving the contracts and limits above.
