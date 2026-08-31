# Early Player Progression V1 Design

**Status:** Approved design, amended before implementation.  
**Scope:** the first durable player-progression loop after Research Progression V1.  
**Prerequisite:** merged `main` at `056619d15002d7ad32e82bc71f2c6eac4ec07649` (PR #29).

## 1. Decision

Early Player Progression V1 uses a **small guided objective chain followed by one durable career-stage milestone**. It does not use investor XP, levels, a checklist that lasts forever, or return-based gates.

The player begins as a **New Investor**. The header gives a small number of concrete next steps only until the player has:

1. made a successful stock investment;
2. selected a Research Focus; and
3. held two distinct stocks at the same time at least once.

Completing those conditions records the durable **Independent Investor** stage. Guided onboarding then ends: the header changes from a task command to a quiet stage label, and it does not invent another perpetual tutorial objective.

The first meaningful capability reward remains the existing **Research Focus** unlock on the first successful stock purchase. That is intentional: the stage-completion milestone must not invent a premature dashboard, analyst, or passive bonus merely to make a number go up. It establishes a truthful record that the player has completed the personal-investor loop and is eligible for a later, genuinely useful operations capability when information scale makes that capability necessary.

This is a hybrid of a finite objective chain and a career-stage model:

> Learn the public market -> make a stock investment -> gain personal research -> build a small portfolio -> become an Independent Investor.

The system rewards intentional participation and understanding. It never rewards luck, predicted returns, or trade volume.

## 2. Actual merged starting point

This design is based on the game now on `main`, not the earlier browser-only Stage 1.1 flow.

### 2.1 What a new player sees

The persisted demo player starts with exactly `$10,000.00`, no positions, and a locked `PlayerResearchState`. The default asset is NOVA when available. Before any progression action, the player can already:

* select stocks or crypto;
* inspect the current price, latest move, live session-only chart, Market Read, compact Why the Move, and public chart markers;
* read public Developing Stories, recent stories, and bounded public archive history;
* inspect a stock's public Company profile and basic public business connections;
* buy or sell whole units with server-authoritative cash, holdings, fills, and bounded player-pressure consequences; and
* use crypto normally, without fake company analysis.

The header currently derives its compact objective from `ResearchProgressionSnapshot`:

| Current condition | Current objective | Current behavior |
| --- | --- | --- |
| No successful stock purchase | `make-first-stock-investment` | “Make your first stock investment.” |
| First stock purchase, no valid focus | `choose-research-focus` | “Choose a company to research.” |
| Valid stock focus | `broaden-investing` | “Explore more than one investment.” |

The first successful stock Buy writes `firstStockPurchaseComplete` inside the same authoritative portfolio mutation as the position and cash update. Crypto purchases, rejected trades, and later sales do not alter it. Focus is one immediate, stock-only, player-owned coverage slot. It can be moved without owning the target stock, but it cannot change market time, RNG, prices, stories, relationships, portfolio state, or trade execution.

Focused Research currently provides server-classified qualitative Company Outlook, Market Expectations, and compact public relationship context. The shared `MarketSnapshot` deliberately excludes that deep research projection.

### 2.2 Where direction stops today

`broaden-investing` is returned whenever a valid focus exists. It has no recorded completion condition, no career stage, no capability registry, and no transition out of the objective chip. A player can hold multiple stocks, sell them, trade crypto, read stories, or use Research, but none of that turns the current broad instruction into a durable progression outcome.

That leaves the post-focus player with a credible market interface but no calm answer to “what am I working toward now?” This V1 closes that specific gap; it does not design the full career, specialist, department, ownership, or Era systems.

## 3. Progression models considered

### A. Permanent objective chain

The game would continually issue sequential commands such as buy a stock, research it, own another stock, inspect a story, sell, and repeat with larger quotas.

**Advantages:** direct, readable, easy to introduce one system at a time, and consistent with the existing compact header chip.

**Problems:** a chain that never ends becomes tutorial checklist behavior. Objectives such as open three stories, switch focus twice, or trade ten times reward compliance rather than market judgment. It also supplies no durable identity or clean bridge to later operations.

**Decision:** retain only the short opening chain, then stop it.

### B. Investor level / XP

Trades, research actions, clicks, or time in the market would grant XP toward investor levels and unlock tools at fixed thresholds.

**Advantages:** familiar long-term feedback and easy future expansion.

**Problems:** it encourages grinding trade count or low-value clicks, confuses activity with informed play, and looks like a generic mobile-game layer. It cannot distinguish a good process from lucky returns without becoming an opaque scoring system. A “Level 5 analyst” would also make specialists feel arbitrary rather than useful.

**Decision:** reject. No XP, level bar, streak, daily task, or hidden experience counter enters V1.

### C. Career-stage milestones only

The game would show a small number of durable stages, each reached through meaningful milestones. Stages would unlock contextually relevant capabilities.

**Advantages:** advancement has a clear meaning, makes later organization tools easier to place, and avoids an infinite objective list.

**Problems:** stages alone can be opaque for a new player: “Independent Investor” does not tell a beginner what to do next. Too many hidden milestone requirements would become achievement soup.

**Decision:** use the stage as the durable outcome, but pair it with a short visible opening objective chain.

### Recommended model: finite objectives + durable milestone stage

The player sees exactly one actionable objective during onboarding. Every objective maps to a real moment in the core loop. Completing the final objective records a stage, ends guided commands, and leaves the player with the tools they have learned to use.

This model is the smallest structure that provides direction now and a stable capability boundary later without pretending that progress is a universal number.

## 4. Exact guided sequence

### Objective 1 — Make your first stock investment

**Entry:** fresh player; `firstStockPurchaseComplete` is false.  
**Completion:** a successful authoritative Buy creates a positive position in any stock.  
**Does not complete:** crypto Buy, rejected Buy, Sell, price movement, cash balance, time online, public-story clicks, or profit/loss.

**Reward:** unlock the existing one-slot Research Focus capability. The Research tab changes from its compact locked explanation to the actionable coverage state. The objective advances immediately from the authoritative trade result, not browser memory.

### Objective 2 — Choose a company to research

**Entry:** Research is unlocked and there is no valid active stock focus.  
**Completion:** the player successfully selects any valid stock as Research Focus through the server-owned focus action. The player does not need to own that stock.

**Does not complete:** selecting an asset locally, opening the Research tab, selecting crypto, a rejected focus request, a research refresh, or switching focus repeatedly after a focus already exists.

**Reward:** the selected company receives its current qualitative Research brief: Company Outlook, Market Expectations, and bounded public Market Connections. This is the first meaningful new ability, not merely objective text.

### Objective 3 — Build a small stock portfolio

**Entry:** Research Focus is valid and early onboarding has not completed.  
**Header wording:** “Build a small stock portfolio.”

**Completion:** at the end of one successful authoritative portfolio mutation, the player holds positive positions in at least two distinct stock asset IDs. This is observed once and retained as a durable milestone. It can happen in either natural order:

* buy a first stock -> choose focus -> buy a second stock; or
* buy two stocks -> choose focus.

Crypto does not count toward this particular portfolio foundation because the objective is deliberately linked to the stock/company Research loop. The player may still trade crypto at every point.

**Does not complete:** two buys of the same stock, buying crypto, story clicks, research-focus shuffling, time online, a return percentage, profit, a winning sale, number of total trades, cash balance, or market direction.

**Result:** record `Independent Investor`, end guided onboarding, and replace the imperative header objective with a calm stage treatment.

### When guidance ends

There is no Objective 4 in V1. Once the portfolio-foundation milestone is complete, the header must no longer behave as a permanent taskmaster. In the same compact header location it shows:

```
INVESTOR STAGE
Independent Investor
```

It is a status, not a clickable assignment, notification source, XP bar, modal, badge grid, or next-feature tease. The player remains free to research, trade, sell, hold cash, read Stories, and use crypto without trying to satisfy another hidden checklist.

## 5. Early stages and meaningful reward

V1 has only two player-visible stages:

| Stage | Meaning | How it is reached | V1 effect |
| --- | --- | --- | --- |
| **New Investor** | The player is learning the core public-market and personal-research loop. | Default. | Shows the short objective chain; Research Focus unlocks at the first stock purchase. |
| **Independent Investor** | The player has used personal research and established a small multi-company stock portfolio. | Valid Research Focus plus the durable two-distinct-stock portfolio milestone. | Ends onboarding commands; records an eligibility boundary for future operations. |

The real, immediate capability reward is **Research Focus**. Independent Investor deliberately does not grant a second focus slot, prediction edge, portfolio buff, hidden market data, analyst, or automatic action. Those would either redesign Research Progression V1 or create fake complexity before the market has enough scale to justify them.

The stage itself matters because it is a durable, server-owned declaration that the player has completed the initial loop. Later capability designs can require this stage *and* their own context-specific scale condition. The stage is not a numeric account level and never alters market odds.

## 6. Minimal persistence and authority design

### 6.1 Canonical state and legacy reconciliation

The existing private persisted portfolio record remains the player-owned home for early progression. No state belongs in the shared market runtime, `MarketSnapshot`, polling/WebSocket traffic, or browser-only memory.

Research keeps its existing single unlock source of truth:

```ts
interface PlayerResearchState {
  firstStockPurchaseComplete: boolean;
  activeStockAssetId?: string;
}
```

Early Player Progression adds only one semantic, monotonic completion record beside it:

```ts
interface PlayerEarlyProgressionState {
  independentInvestorComplete: boolean;
}
```

Missing legacy state hydrates as `{ independentInvestorComplete: false }`. The server may then reconcile that false/missing value **only** when the current authoritative player state already proves every final condition:

1. `firstStockPurchaseComplete` is true;
2. the persisted focus resolves to a currently valid stock Research Focus; and
3. the current portfolio has positive positions in at least two distinct stocks.

When all three are true, the existing player-state transaction atomically writes `independentInvestorComplete: true`. This is not inferred historical progress: the present state proves the player is already at the final guided condition. The reconciliation changes only the player-owned milestone; it must not advance canonical time, call simulation code, change the runtime recovery state, prices, stories, pressure, portfolio balances/positions, or public market projection.

If the player currently holds fewer than two stocks, holds one stock plus crypto, has a malformed/stale/crypto focus, or lacks the first-stock milestone, the server must leave the completion record false. It must never infer completion from trade history, profit, account age, crypto holdings, browser state, or an earlier unrecorded portfolio.

`independentInvestorComplete` is not a duplicate Research-unlock flag and is not a collection of transient UI booleans. It is the one historical fact that cannot be derived after the player later sells positions: they successfully completed the early two-stock portfolio foundation while Research was available.

### 6.2 Derived projection

Stage, current guided objective, and onboarding completion are server-derived from:

* `firstStockPurchaseComplete` from player Research state;
* whether the active focus is valid against the current runtime;
* `independentInvestorComplete`; and
* the current portfolio only while deciding whether a successful mutation completes the milestone.

No `unlocked`, `stage`, or objective booleans are separately persisted. A later implementation may nest this in the existing player-owned research response so the header retains one request path, conceptually:

```ts
type GuidedObjective =
  | "make-first-stock-investment"
  | "choose-research-focus"
  | "build-small-stock-portfolio";

interface PlayerProgressionSnapshot {
  stage: "new-investor" | "independent-investor";
  onboardingComplete: boolean;
  guidedObjective?: GuidedObjective;
}
```

Research Focus remains derived from the same first-stock flag used by existing Research. It is never independently written, duplicated in a progression record, or represented in a generalized capability array. The currently focused brief remains in the player-specific Research projection, not in the shared market snapshot.

### 6.3 Atomic completion

The existing Postgres row-lock transaction remains the only authority boundary.

* After a successful Buy mutates the working portfolio, the server determines whether there are two distinct positive stock positions and an already-valid focus. If so, it writes `independentInvestorComplete` in that same portfolio transaction.
* After a successful focus mutation, the server evaluates the existing portfolio. If it already contains two distinct positive stock positions, it writes the completion record in that same transaction.
* While resolving a legacy/current player projection, the server may make the stricter present-state reconciliation described above in that same player transaction. It does not inspect historical trades or change market/runtime state.
* Rejected trades/focus changes cannot mutate progression. Sells, losses, withdrawal to cash, and later invalid/stale focus sanitation cannot remove the completion record.

This permits either valid play order without a second loose write. It preserves restart recovery, concurrent-trade serialization, and future per-account ownership because the state is stored beside the same player portfolio record.

### 6.4 Shared-market isolation

Progression state, stages, and objectives are player-owned. They must never modify or leak through shared market state:

* no change to canonical time, sequence, RNG, prices, momentum, events, stories, public relationships, Market Read, Why the Move, or player-pressure calculations;
* no progression fields in `MarketSnapshot`, WebSocket messages, public story history, or chart context;
* no client authority to claim objective or stage completion; and
* no account, authentication, database table, migration, or new dependency in V1.

## 7. Loss, cash, and failure behavior

Early progression recognizes durable participation, not financial success.

* A first stock purchase unlocks Research even if its price immediately falls.
* Selling at a loss never relocks Research or removes Independent Investor.
* A player may become mostly cash again and still retain earned capability/stage state.
* A poor portfolio does not require a profitable recovery, a winning trade, or a positive P/L before guidance can complete.
* The two-stock milestone is satisfied once after holding two positive stock positions simultaneously; selling one later does not regress it.

Financial losses remain meaningful because the canonical cash/portfolio changes remain unchanged. Progression simply cannot soft-lock learning because a rational decision met an unlucky market path.

## 8. Research, stories, crypto, and market interaction

### Research

Research Progression V1 remains unchanged:

* first successful stock Buy unlocks one immediate Research Focus;
* focus is one stock, can move immediately, costs no money, time, XP, energy, or research points;
* focused output stays qualitative, current, server-classified, and non-predictive; and
* ownership is not required to focus a valid stock.

Early Progression consumes only the existing unlock/focus facts. It does not increase coverage capacity, add topic jobs, create freshness, or turn focus movement into a repetitive objective.

### Stories and public information

All public Stories, archive history, Market Read, Why the Move, Company information, public relationships, and chart markers remain free. V1 does not force the player to open a story, wait for a follow-up, or correctly interpret an event to advance. Story reading remains valuable because it informs an actual investment decision, not because a click fills a quest counter.

### Crypto

Crypto stays fully tradable and visible from first load. It neither unlocks stock Research nor counts toward the two-stock portfolio foundation. It has no fake corporate Research, no special early objective, and no penalty for being the player's first transaction. A crypto-first player simply continues to see “Make your first stock investment” until they choose to engage with a stock.

### Market and trade semantics

V1 does not change the simulation, market cadence, event catalog, investor behavior, relationship effects, pricing, story lifecycle, persistence/recovery, trade validation, cash, starting balance, fill receipts, or bounded player-pressure mechanism. Progression receives the result of an already-authoritative trade; it is never a trade input or market driver.

## 9. UI treatment

The UI uses the existing header location and the existing stock Research tab. It does not add a progression page, tree, sidebar, quest log, achievement grid, or operation dashboard.

### Guided state

While onboarding is active, the header continues to use the compact `NEXT OBJECTIVE` chip. Copy is simple and action-based:

1. Make your first stock investment
2. Choose a company to research
3. Build a small stock portfolio

The appropriate stock Research state provides the contextual explanation/action. The trade ticket remains the place to trade; the objective chip does not become a second button.

### Completion state

After the milestone, replace command copy with the quiet `INVESTOR STAGE / Independent Investor` label. A small restrained transition is allowed once at completion, respecting reduced-motion preferences; no confetti, fanfare, score increment, progress bar, or lock wall is appropriate.

On desktop, the header preserves the current Portfolio / center chip / Cash rhythm. At approximately 390px, its existing wrap behavior remains sufficient: the stage label is short, does not introduce horizontal controls, and should never push trade controls or asset tabs off-screen.

The visual principle remains: **the market looks real; the surrounding experience feels like a calm game.** The stage offers game identity through context and language, not through mobile-game spectacle.

## 10. Future capability bridge and specialist compatibility

Research Focus is the only current capability and already derives from the canonical first-stock Research milestone. V1 therefore introduces **no** capability registry, persisted capability array, generic capability database, or abstraction whose only member would be Research Focus. The player projection exposes only the minimal derived research/progression fields that the header and Research tab need.

Later slices may introduce a generalized capability model only when a second real capability exists and its design proves that shared abstraction useful. Examples might eventually include maintained research coverage, Market Intelligence filtering, risk monitoring, or player-authored execution rules. Each must be a server-owned permission to expose or operate a real, bounded product behavior, not an invisible modifier, score, or promise of future access.

The first specialist/dept bridge is deliberately **not** “reach a level, receive an analyst.” A later Market Operations slice should require both:

1. this Independent Investor foundation; and
2. a separately designed real scale/attention condition, such as managing more research-relevant companies than one personal coverage slot makes convenient.

Only then can a specialist honestly reduce attention cost: maintain coverage, filter public information, or summarize relevant public context. It must not receive hidden future truth, make investment decisions, alter prices, or guarantee outcomes. Exact threshold, money cost, department family, specialist identity, confidence, and UI are deferred.

This also remains compatible with future company ownership. Ownership can later add governance or shareholder context at meaningful stake thresholds, but it must not replace Research Focus, retroactively rewrite early progression, or create compulsory company-management chores.

## 11. What does not count

V1 explicitly rejects the following as progression credit:

* profit, return percentage, net-worth growth, price direction, winning streaks, or correct predictions;
* trade count, turnover, repeated Buy/Sell actions, repeated focus moves, or buying many units of one stock;
* opening tabs, clicking stories, waiting for story updates, time online, or refreshing the page;
* buying crypto for stock-company objectives;
* money payments, research points, gems, energy, tokens, XP, skill points, or cooldown completions; and
* hidden server measurements, investor scores, story surprises, outcomes, relationship weights, RNG, or future market information.

## 12. V1 boundary and deferrals

This design authorizes only the durable early progression model, one finite objective sequence, two player-visible stages, a derived capability-unlock projection, and the future-operations eligibility bridge.

It does **not** authorize:

* additional Research slots, levels, topics, freshness, timers, costs, accuracy, confidence, or recommendations;
* specialists, departments, analysts, salaries, alerts, scanners, risk tools, automation, watchlists, or trading rules;
* company ownership, management capacity, shareholder governance, company control, or an office/empire UI;
* achievements, daily quests, streaks, battle passes, seasons, Market Era progression, prestige, social ranking, monetization, or a second currency;
* portfolio analytics, rebalancing requirements, diversification score, forced sells, advanced orders, or predictions; or
* changes to the shared market, persistence schema, simulation tuning, transport architecture, or public/private market information boundary.

## 13. Later implementation acceptance criteria

A later implementation plan must prove at minimum that:

1. a fresh/legacy player starts as New Investor with the first-stock objective and no invented historical milestones;
2. a successful stock Buy unlocks Research atomically as it does today, while crypto/rejected trades do not;
3. a valid focus advances to the small-portfolio objective, and an invalid/stale/crypto focus cannot do so;
4. holding two distinct stocks once, together with a valid focus, completes Independent Investor atomically in either natural action order;
5. same-stock buys, crypto, loss, return, story clicks, time, and trade volume cannot complete it;
6. later sales, cash drawdown, poor performance, and restart recovery never regress Research or Independent Investor;
7. objective/stage derive from one canonical player state without duplicate persisted unlock flags or a generic capability registry;
8. malformed legacy progression/research state sanitizes safely without auto-completing a milestone, while a legacy player whose current valid focus and two current stocks prove completion reconciles atomically;
9. concurrent trades/focus changes cannot fork or double-advance the milestone under the existing row lock;
10. changing progression cannot affect shared prices, canonical time, RNG, stories, relationships, pressure, portfolio accounting, or public `MarketSnapshot` content;
11. the compact header moves from guided objective to stage status without desktop or 390px overflow; and
12. no hidden/private market data, recommendation, predicted return, or new currency is exposed.

## 14. Self-review

**Grind/chore risk:** the chain has three real actions and ends. It does not ask for repeated focus movement, story clicks, waits, or trade count.

**Luck dependence:** no result, price, or profit/loss condition exists. A losing player keeps Research and stage progress.

**Duplicate-state risk:** the existing first-stock research milestone remains its only source of truth. V1 persists one semantic final-completion fact, deriving objective, stage, and onboarding completion from it and existing validated state. It deliberately does not create a one-member capability registry or a second Research unlock flag.

**Over-tutorialization risk:** guidance disappears after the small portfolio foundation. The completed header is status, not an endless assignment engine.

**Mobile-game feel:** no XP, bars, streaks, reward claims, confetti, currencies, timers, or achievement grid. The only UI addition uses the existing compact header space.

**Fake complexity risk:** no premature specialist, slot expansion, portfolio score, or analytics screen is presented. The meaningful capability is Research Focus, already connected to the market's actual company data.

**Too-shallow risk:** the system turns an otherwise terminal objective into a durable player history and a clear boundary between learning one company and building a multi-company portfolio. It also gives future operations a truthful eligibility anchor without manufacturing friction in the small current market.

**Market-odds risk:** progression is not an input to prices, events, trade fills, player pressure, simulation timing, or hidden data access. Reconciliation only writes player state when present conditions prove it and cannot alter the runtime. V1 adds understanding/progression organization only.

**Specialist compatibility:** later specialists must solve demonstrated attention scale beyond this one personal focus slot, not replace player judgment or unlock from an arbitrary level.

## 15. Open questions for later slices

No unresolved decision blocks this design-only V1. The following are intentionally deferred to their own product designs:

* the first real scale threshold and exact behavior for Market Intelligence or Research support;
* whether a future larger stock universe requires a public watchlist before specialist coverage is meaningful;
* future stage names beyond Independent Investor;
* specialist/dept costs, hiring, confidence, and capacity; and
* ownership-specific progression once finite ownership and governance are actually introduced.
