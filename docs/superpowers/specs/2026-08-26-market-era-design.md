# Market Era — Master Game Design Spec

**Date:** 2026-08-26  
**Status:** Approved concept, pre-development design freeze  
**Working title:** Market Era

## 1. Product vision

Market Era is a colorful, beginner-friendly market strategy game in which players trade stocks and crypto inside a living fictional economy, gradually learn why markets move, build a career reputation, compete in a shared global market, and eventually gain strategic influence over companies.

The game is deliberately designed so that a player can begin with almost no knowledge of stocks. Financial realism exists underneath the experience, while the interface translates it into simple language, visual cues, and progressively revealed depth.

The intended player journey is:

> “That company has good news, so I might buy it.”  
> → “I think this price is going up.”  
> → “I understand why this sector is moving.”  
> → “I can connect news, sentiment, company strength, and market behavior.”  
> → “I own enough of companies to influence major decisions.”  
> → “I run a financial empire without manually operating every company.”

## 2. Non-negotiable design principles

### 2.1 Game first, finance underneath
The player is never required to understand real financial jargon before they can make a reasonable decision.

### 2.2 Simple outside, deep inside
Beginner-facing information is qualitative and understandable. Advanced numerical data is progressively revealed for players who want it.

### 2.3 Progression adds depth, not clutter
Unlocking a feature expands an existing flow. It does not automatically add another permanent button, tab, currency, panel, or notification category.

### 2.4 More wealth means more abstraction
As the player's holdings grow, automation, delegation, filtering, screeners, executives, and management abstractions reduce busywork.

### 2.5 One spendable currency
Money is the only general-purpose spendable currency. Reputation, skill levels, career level, and Management Capacity are progression/state values rather than alternate shops.

### 2.6 Finance is taught in context
Every advanced financial mechanic has:
1. a plain-language gameplay explanation;
2. the real financial term;
3. an optional deeper explanation.

### 2.7 Reference-driven visual design
The UI must use researched references before implementation. Generic AI-dashboard aesthetics are explicitly rejected. See `docs/ui-reference-research.md`.

### 2.8 Protect the MVP
Future features are documented, but they do not enter the first playable unless they are necessary to validate the core loop.

## 3. Core gameplay loop

1. **Discover** an asset, company, event, trend, or opportunity.
2. **Understand** it through beginner-friendly information or deeper research.
3. **Predict** what might happen.
4. **Invest/trade** using game money.
5. **Observe and react** as the global economy changes.
6. **Profit or lose** meaningfully.
7. **Progress** through career goals, relevant skills, reputation, and wealth.
8. **Unlock deeper opportunities** rather than unrelated side systems.

Activities outside direct buying/selling remain market-centered: research tasks, rumors, IPO scouting, startup opportunities, portfolio challenges, timed competitions, crises, and other events that feed back into investment decisions.

## 4. Market structure

### 4.1 Global market
There is one shared fictional global economy. All players experience the same active companies, coins, major news, economic trends, booms, crashes, and Era history.

The fictional exchange operates **24/7** so the game does not disadvantage players based on real-world market hours.

### 4.2 Stocks
Stocks are the slower strategic layer.

Primary drivers in the first playable:
- company strength;
- sector trend;
- sentiment/hype;
- volatility;
- recent news/events;
- momentum;
- simulated investor demand;
- bounded real-player demand.

Meaningful stock simulation ticks occur roughly every 30–60 seconds. Smaller visual movement may occur between major ticks so assets do not feel frozen.

Future drivers can include products, leadership quality, deeper financial statements, competitors, supply chains, acquisitions, and macroeconomic relationships.

### 4.3 Crypto
Crypto is the faster action layer.

It updates continuously/every few seconds and reacts more strongly to:
- momentum;
- hype/community sentiment;
- volume;
- whales;
- utility/adoption;
- listings/events;
- risk appetite;
- bounded player demand.

Coins have meaningful traits and lifecycles rather than being reskinned fast stocks.

### 4.4 Finite shares
Companies have a real finite share count within an Era. Ownership percentages are therefore meaningful and globally consistent.

A player who owns 20% of a company genuinely owns 20% of that Era's company. Large-company control is naturally difficult; smaller companies become more realistic early takeover targets.

## 5. Explainable price simulation

Price movement is not arbitrary random noise. The simulation combines understandable drivers, with uncertainty and volatility layered on top.

Beginner example:

> **Nova Motors +5.8%**  
> Strong product news is attracting investors.

Advanced example:

> Product/news effect: +2.7%  
> Sector strength: +1.2%  
> Buying pressure: +0.8%  
> Momentum: +1.1%

The player gradually gains access to more of this breakdown through research progression.

The system should be **learnable but not perfectly solvable**. If every movement is fully exposed as a deterministic formula, the market becomes an optimization puzzle rather than a market game.

## 6. Simulated investors and liquidity

The economy remains active even with few real players online.

The first playable models broad investor groups rather than attempting to simulate millions of individual portfolios:
- ordinary investors;
- long-term/value investors;
- growth investors;
- active/day traders;
- institutional-style investors;
- momentum traders;
- panic sellers;
- crypto whales/speculators.

These groups react differently to news, valuation, momentum, volatility, and sector conditions.

Real-player order flow contributes to market pressure but is bounded. Simulated liquidity ensures a coordinated group of players can create a noticeable rally or selloff without generating absurd price movements.

The MVP economy does **not** need to conserve every dollar perfectly. Simulated counterparties can create liquidity; rewards can introduce money; small fees/spreads can remove money. A more closed monetary simulation is a future possibility, not an MVP requirement.

## 7. Dynamic fictional world

The world is fictional rather than populated with real companies.

A hybrid procedural approach is used:
- designers define sectors, economic rules, archetypes, event logic, quality constraints, products, company traits, CEO traits, coin traits, and relationships;
- the simulation combines these systems into companies, coins, events, and histories.

Over the long term, companies may:
- form;
- IPO;
- launch products;
- grow;
- struggle;
- change leadership;
- enter/leave industries;
- compete;
- merge;
- be acquired;
- split/spin off;
- go bankrupt.

Coins may launch, gain utility, attract communities, become dominant, stagnate, collapse, or die.

Failed and historical assets remain visible in Era archives instead of disappearing without context.

## 8. Progression and onboarding

### 8.1 Guided career
The game teaches through small goals embedded in actual play instead of a long forced tutorial.

Early examples:
- buy the first stock;
- sell an investment;
- make a profitable trade;
- own multiple companies;
- buy the first coin;
- react to a news event;
- make the first fictional-money prediction.

The player should usually have:
- one clear main career objective;
- at most a small number of optional challenges.

### 8.2 Progression sources
Progress comes from a combination of:
- wealth;
- career milestones;
- relevant skill experience;
- accomplishments;
- reputation.

Account level exists as an overall progress indicator rather than a universal gate.

### 8.3 Skill tracks
Potential tracks:
- Trading;
- Research;
- Risk;
- Ownership;
- Management.

Tools should unlock when their context becomes relevant. For example, company-control systems become meaningful after the player reaches significant ownership rather than at an arbitrary account level.

### 8.4 Behavior-based specialties
Players do not choose a permanent class. Their reputation reflects what they actually do well.

Possible identities include:
- active trader;
- long-term/value investor;
- crypto specialist;
- analyst/researcher;
- venture/startup investor;
- corporate strategist.

A player may develop multiple specialties over time.

## 9. Beginner-first financial language

The product must support a player who barely knows what a stock is.

Example beginner company view:

> **Nova Motors**  
> Price: $42.18 ▲ 3.2%  
> Company health: Strong  
> Public excitement: Very high  
> Risk: Medium  
> Recent news: Positive

Advanced data can later reveal revenue growth, debt, valuation, volume, volatility, market cap, and other metrics.

Terms are introduced through plain-language actions:

> **Automatically sell if it falls too far**  
> Protect yourself by selling if the price reaches a limit you choose.  
> *Also called a stop-loss.*

Important terms are tappable/hoverable and explained in 1–2 sentences without requiring navigation to a separate dictionary.

A Learn/Glossary area may exist as a reference, but it is never the primary teaching mechanism.

## 10. Research

Research depth grows with the player.

### Beginner layer
- company health;
- public excitement;
- risk;
- simple news summary.

### Intermediate layer
- revenue direction;
- debt quality;
- product events;
- sector performance;
- competitor relationships;
- sentiment.

### Advanced/future layer
- detailed statements/metrics;
- valuation measures;
- supply relationships;
- forecasts;
- deeper competitor analysis;
- broader economic relationships.

The player should never have to stare at unexplained raw metrics merely because they have unlocked them.

## 11. Predictions

A short-term prediction mechanic provides fast activity while slower investments develop.

Predictions use **fictional in-game money only** and have no real-money wagering or cash-out connection.

Example:

> Will NOVA finish above $75 in the next 3 minutes?

Possible progression:
- simple up/down calls;
- multiple time windows;
- more nuanced targets later.

The feature remains secondary to the market game and cannot become the dominant optimal way to earn money.

## 12. Alerts and offline play

The economy continues while the player is offline.

Players gain tools to manage that reality:
- price alerts;
- percentage-move alerts;
- company-news alerts;
- portfolio drawdown alerts;
- major market event alerts;
- prediction-ending reminders;
- shareholder-decision alerts;
- unusual crypto activity alerts;
- later, stop-loss/take-profit/limit orders and automated portfolio rules.

Notification customization should be available both contextually and through a central Alerts area.

Beginner templates can include:
- Safe Investor;
- Active Trader;
- Crypto Watch.

Devoted players can gain a real **information/reaction advantage** by configuring alerts well, but not a paid statistical advantage.

## 13. Social multiplayer

The global economy is shared, but direct player-to-player asset transfer is excluded from the initial design.

Supported social features:
- friends;
- public profiles;
- reputation display;
- portfolio/net-worth comparison where allowed;
- timed investment challenges;
- friend competitions;
- Era rankings;
- global rankings;
- visible aggregate market activity.

Initially excluded:
- direct cash transfers;
- stock gifting;
- direct player asset sales;
- systems that make alt-account value transfer easy.

### 13.1 Leaderboards
A single “richest player” ranking is insufficient.

Potential rankings:
- net worth;
- return percentage;
- best trade;
- research performance;
- specialty-specific performance;
- friends;
- rookie/new-player divisions.

This allows newer or late-Era players to compete in meaningful categories.

## 14. Soft anti-manipulation protections

Normal trading should feel unrestricted, while abuse has limited system impact.

Protections can include:
- bounded player contribution to price movement;
- simulated liquidity absorbing extreme pressure;
- diminishing influence from extreme repeated activity;
- suspicious alt-account patterns receiving reduced market impact/reward eligibility;
- community boosts with hard stacking/duration rules;
- leaderboard invalidation for clearly manipulated results;
- new accounts having reduced influence until genuine progression is established.

These systems should be mostly invisible to ordinary players.

## 15. Company ownership and empire — post-MVP vision

Stock ownership eventually becomes strategic influence.

Possible milestones:
- small meaningful stake → richer shareholder information;
- larger stake → participation/proposals in major decisions;
- major stake → significant influence;
- controlling stake → strategic control.

Control concerns only major decisions:
- leadership;
- acquisitions;
- industry expansion;
- major R&D/projects;
- dividend policy;
- broad growth/risk strategy;
- spin-offs/divestment.

The player does **not** manually operate employees, factories, schedules, inventory, or routine corporate administration.

### 15.1 Management Capacity
Direct involvement consumes Management Capacity according to company size, complexity, instability, and desired control depth.

Possible autonomy settings:
- High autonomy → low capacity use;
- Balanced → moderate capacity use;
- Direct strategic control → high capacity use.

Executives, management teams, holding-company structures, and career progression can expand effective capacity.

**Owning an asset must never automatically create work.**

## 16. Failure and recovery

Losses matter. Players can suffer severe losses or bankruptcy.

Permanent account identity and learned/unlocked progression are not erased.

Recovery systems can include:
- asset liquidation;
- emergency starting capital;
- recovery objectives;
- reputation-based opportunities;
- Era transition recovery.

Failure should create a meaningful setback and story rather than making continued play pointless.

## 17. Market Eras

A Market Era is a chapter of the shared global economy, lasting approximately **4–8 real weeks**.

The timeframe is predictable enough for competition, while the simulation determines the Era's actual economic story.

Possible Era outcomes include:
- technology boom;
- recession;
- crypto collapse;
- acquisition/consolidation wave;
- energy shock;
- recovery.

The final period can become an **Era Finale**, with heightened attention, major events, and final ranking competition.

## 18. Era transition and Legacy conversion

At Era end, the active economy closes and accomplishments become permanent history rather than every active holding carrying forward unchanged.

Archived information can include:
- peak net worth;
- final net worth/rank;
- best trade;
- companies controlled;
- significant assets;
- specialties/reputation;
- major achievements.

Stocks and crypto positions are settled from the active economy. The next Era starts from a normalized position so veterans cannot dominate through compounding old wealth forever.

Permanent progression can create **modest** starting advantages, such as earlier research access, slightly greater Management Capacity, cosmetics, reputation, titles, or limited starting-capital bonuses.

Major historic companies can remain in the player's Legacy/History even when no longer actively traded.

## 19. Visual and interaction direction

The visual identity is **colorful business-cartoon**.

Required qualities:
- bright/pastel palette;
- rounded forms;
- generous negative space;
- strong readable hierarchy;
- distinctive company/coin branding;
- friendly charts;
- illustrated identities and news moments where useful;
- satisfying but restrained animations;
- polished typography;
- clear interaction states;
- serious information without a gloomy trading-terminal aesthetic.

Explicitly rejected:
- black-screen finance-terminal default;
- green/red chart overload;
- tiny typography used to fit more data;
- unrelated feature cards filling every empty space;
- dozens of permanent tabs;
- generic AI-generated dashboard layouts;
- an interface in which the player cannot explain what each visible feature does.

See `docs/ui-reference-research.md` for concrete research references and the mandatory screen-design process.

## 20. Desktop and mobile philosophy

Technology is intentionally undecided until the product design is stable.

### Desktop
Desktop can use space for:
- coordinated multi-panel layouts;
- larger charts;
- deeper research;
- advanced portfolio management;
- richer comparisons.

### Mobile
Mobile is **not** the desktop UI compressed onto a phone.

Rules:
- one primary purpose per screen;
- progressive disclosure;
- small stable top-level navigation;
- large readable controls;
- advanced information lives behind drill-downs;
- no microscopic desktop tables.

The same account and economy are shared across devices.

## 21. Accounts and persistence

The game uses a server-authoritative model.

The server owns the canonical state for:
- account identity;
- cash;
- positions;
- orders/trades;
- progression;
- reputation;
- alerts;
- Era state;
- market state.

Clients cache/display state but do not become the source of truth.

This enables cross-device continuity, an always-running economy, and stronger anti-cheat guarantees.

A guest/tutorial experience may exist before account creation, but participation in the shared persistent economy requires an account.

## 22. Monetization constraints

Monetization must not sell individual financial power.

Allowed future categories:
- profile themes;
- cosmetic customization;
- badges;
- visual effects;
- office/empire presentation;
- chart/interface themes where they do not reveal extra information;
- community-wide convenience/progression boosts.

Examples of community boosts:
- temporary reputation-earning bonus for everyone;
- temporary career/skill progression bonus for everyone;
- temporary increase in bonus opportunity frequency.

Disallowed:
- buying market cash;
- buying better investment information unavailable to free players;
- buying better prediction odds;
- paying to alter stock/coin outcomes;
- buying skill levels or direct market influence;
- real-money wagering/cash-out systems.

Community boosts have duration/stacking caps and can also appear as earnable community rewards.

## 23. MVP / first playable

The MVP is a **focused first playable**, not the whole long-term vision.

### Required
- fictional stocks;
- fictional crypto;
- buy/sell;
- portfolio;
- moderate price simulation;
- simulated investor groups/liquidity;
- bounded player demand influence;
- explainable price movement;
- basic news/events;
- beginner-friendly terminology/explanations;
- guided Career Goals;
- basic progression;
- fictional-money predictions;
- alerts;
- simple social/leaderboard layer;
- one functioning Market Era;
- Era end/transition in a simplified but real form;
- server-authoritative accounts/state;
- polished colorful desktop UI;
- UI reference process and design-system foundations.

### Explicitly not required for MVP
- controlling companies;
- holding companies;
- acquisitions;
- deep supply chains;
- sophisticated macroeconomics;
- extremely deep procedural company generation;
- startup/venture ecosystem;
- sophisticated executives;
- advanced reputation specializations;
- direct player-to-player transfers;
- complete mobile client;
- perfectly closed monetary economy.

## 24. Post-MVP goals

Once the core loop is proven and understandable:
- richer company financials;
- advanced order types;
- deeper research;
- competitor relationships;
- stronger procedural events;
- behavioral specialties;
- startup/IPO systems;
- richer social challenges;
- more advanced Era generation;
- mobile client/adaptive layout;
- significant-shareholder mechanics;
- company strategic influence;
- Management Capacity;
- executives/delegation;
- holding-company abstractions.

## 25. Long-term vision

Possible long-term expansion, only after evidence that it strengthens the core game:
- deep company products/projects;
- supply chains;
- acquisitions and spin-offs;
- industry disruption;
- richer macroeconomic simulation;
- dynamic company families/histories across Eras;
- sophisticated simulated institutional behavior;
- highly customizable automated portfolio strategies;
- deeper empire management;
- richer Legacy systems;
- additional asset classes only if they create a genuinely different gameplay role.

Long-term ideas are **not promises** and do not bypass the feature gate below.

## 26. Feature gate — anti-slop rule

Any proposed feature must answer **yes** to the relevant questions before being accepted:

1. Does it strengthen the core discover → understand → predict → invest → react loop?
2. Can a beginner either understand it immediately or safely ignore it until relevant?
3. Can it fit naturally inside an existing information/navigation structure?
4. Does it avoid introducing another general-purpose currency or permanent resource meter?
5. Does it have a plain-language explanation?
6. Does it create meaningful decisions rather than more taps?
7. If the player becomes richer, does this feature scale without creating repetitive chores?
8. Is it required now, or can it remain a documented future goal?
9. Can the UI show it without becoming more crowded or less legible?
10. Is there a concrete visual/product reference for how this interaction problem is solved well elsewhere?

A feature failing this gate is rejected, simplified, merged into an existing system, or deferred.

## 27. UI implementation gate

Before implementation of any major screen:

1. Define the screen's main job in one sentence.
2. Define the beginner-visible information.
3. Define advanced information revealed progressively.
4. Gather 2–4 real visual references for the exact interaction/information problem.
5. Document what each reference contributes and what will **not** be copied.
6. Create an information hierarchy/wireframe.
7. Create a Market Era visual mockup.
8. Review crowding, terminology, navigation, motion, and accessibility.
9. Test desktop scaling and, where relevant, the mobile adaptation.
10. Only then build the production screen.

No major UI screen is considered complete until it passes a polish review for spacing, alignment, typography, empty/loading/error states, animation, focus/keyboard behavior where relevant, accessibility, and responsiveness.

## 28. Reference research summary

The design intentionally learns from established products without copying them:

- **Robinhood:** beginner accessibility, asset-detail hierarchy, and plain-language summaries of market drivers.
- **Coinbase:** scalable financial component systems and the documented danger of feature sprawl making core tasks harder to use.
- **Duolingo:** bright rounded visual language, negative space, guided progression, consistent tabs, and the principle that simplification must not sacrifice clarity.

Full references and links are recorded in `docs/ui-reference-research.md`.

## 29. Pre-development architecture decisions that must remain stable

The following are now considered frozen unless later evidence shows a serious flaw:

- one global fictional economy;
- 24/7 market availability;
- stocks + crypto as the first two asset categories;
- moderate explainable simulation for the first playable;
- simulated investor groups/liquidity;
- bounded player market influence;
- finite globally meaningful shares;
- server-authoritative state and cross-device account model;
- Market Eras with Legacy conversion;
- behavior-based reputation rather than fixed player classes;
- one spendable currency;
- controlled social competition with no direct asset transfers initially;
- soft anti-manipulation protections;
- company control as a post-MVP strategic layer using delegation/Management Capacity;
- colorful business-cartoon visual identity;
- reference-driven UI process;
- focused MVP scope.

## 30. Success criteria for the first playable

The first playable succeeds if:

1. A person with almost no stock knowledge can start playing without external explanation.
2. Buying and selling feels understandable within the first few minutes.
3. Stocks and crypto feel meaningfully different.
4. The player can explain at least roughly **why** an asset moved.
5. News, prices, and simulated investors create interesting decisions rather than obvious scripted answers.
6. There is something meaningful to do while waiting for slower investments.
7. The interface is visually inviting and does not resemble generic financial software.
8. The player never feels overwhelmed by visible features.
9. The player wants to check what happened in the market after leaving the game.
10. The architecture can support future depth without requiring the MVP UI or market model to be discarded.

## 31. Explicit non-goals

The first playable is not trying to be:
- a real brokerage;
- a real-money investing simulator;
- a professional trading terminal;
- a perfect economic model;
- a company-management tycoon;
- a casino;
- a finance textbook;
- a collection of unrelated minigames;
- a feature-count competition.

The product's identity is a **living, understandable market game with depth that reveals itself only when the player is ready for it**.
