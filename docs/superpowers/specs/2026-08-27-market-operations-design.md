# Market Operations progression design

**Date:** 2026-08-27  
**Status:** Approved product direction, planned post-core progression system  
**Scope:** Long-term delegation, research, monitoring, and automation as the player's financial empire scales

## 1. Purpose

Market Operations is the system that prevents late-game growth from turning Market Era into a chore simulator.

Early in the game, the player personally reads news, checks companies, interprets risk, and decides what to buy or sell. As wealth, holdings, and market coverage expand, the player should not be forced to repeat the same low-level work across dozens of assets.

Instead, progression changes the player's role:

> **Do the analysis yourself → build systems that help analyze → manage specialists and departments → make higher-level capital decisions.**

The core rule is:

> **As the player's empire grows, complexity moves from doing more work to managing better systems.**

Supporting rule:

> **Automation reduces attention cost, not decision-making.**

This system directly supports the existing product principle that more wealth should create more abstraction and delegation rather than more chores.

## 2. What this system is not

Market Operations is **not**:

- an idle-money generator;
- an automatic "best stock" finder;
- a hidden-truth reveal system;
- an HR or office-management simulator;
- a second company-management tycoon layered on top of the market game;
- a collection of unrelated minigames;
- a reason to add extra currencies;
- a replacement for the player's investment decisions.

A powerful late-game operation should make a large portfolio manageable. It should not make the player unnecessary.

## 3. Structural model: departments first, specialists second

The scalable unit is a **department**. Named specialists improve, specialize, or lead those departments.

This hybrid structure gives the empire personality without forcing the player to individually manage dozens of employees.

The player should never need to hire generic filler workers one by one, assign desks, manage schedules, or perform routine staff administration.

### 3.1 Departments

Departments represent persistent capabilities of the player's financial operation.

Initial planned department families:

### Market Intelligence

Primary job: notice what deserves attention.

Possible capabilities:

- monitor public market news;
- flag important events affecting owned or watched assets;
- surface unusual momentum or sentiment changes;
- prioritize stories by likely relevance;
- reduce information overload as the number of followed assets grows.

Market Intelligence answers:

> **"What should I look at?"**

### Research

Primary job: help interpret companies, sectors, and events.

Possible capabilities:

- summarize company health in plain language;
- interpret whether public news is likely positive, negative, mixed, or uncertain;
- compare companies in the same sector;
- produce deeper reports over time;
- improve coverage of chosen sectors;
- reveal advanced public information as the player's Research progression grows.

Research answers:

> **"What does this probably mean?"**

### Risk

Primary job: notice dangerous portfolio conditions before the player has to manually inspect every position.

Possible capabilities:

- flag unusually volatile holdings;
- warn about over-concentration;
- identify correlated exposure across sectors;
- flag deteriorating conditions around a large position;
- surface large portfolio drawdowns or rapidly rising risk.

Risk answers:

> **"What could hurt me?"**

### Trading Desk

Primary job: reduce repetitive execution and monitoring work after the player understands the underlying mechanics.

Possible later capabilities:

- execute player-authored rules;
- manage simple rebalancing instructions;
- monitor conditions for orders or alerts;
- carry out repetitive actions within explicit player constraints.

Trading Desk answers:

> **"Handle this rule for me."**

Trading Desk must unlock later than basic research/monitoring because execution automation can remove too much gameplay if introduced early.

## 4. Named specialists

Named specialists are meaningful people inside the department system, not the primary unit of scale.

A specialist can have:

- name and portrait/identity;
- role;
- sector or market specialty;
- competence level;
- one or two meaningful strengths/weaknesses;
- salary;
- department assignment;
- a small number of traits that affect how they interpret or prioritize information.

Example:

> **Maya Chen — Technology Analyst**  
> Strong technology-news interpretation  
> High confidence on product/industry events  
> Weak crypto coverage

The player should care who leads an important function, but should not manage a spreadsheet of 40 interchangeable analysts.

### 4.1 Specialists do not reveal hidden truth

No employee, regardless of quality, receives direct access to hidden simulation weights, RNG state, exact future returns, or otherwise unknowable information.

Specialists analyze the same fictional-world information that is legitimately available to the player's operation.

Their output is an estimate.

Possible output language:

- Likely positive
- Slightly positive
- Mixed
- Uncertain
- Slightly negative
- Likely negative

paired where useful with:

- Low confidence
- Medium confidence
- High confidence

Example:

> **Likely positive · High confidence**  
> Strong product demand is helping the outlook, but production risk remains.

A good specialist is more useful, not omniscient.

## 5. Accuracy model

Accuracy should improve through several dimensions rather than one universal percentage stat.

### 5.1 Accuracy

How often the specialist/department interprets available evidence well.

Higher accuracy should reduce bad conclusions but never remove uncertainty.

### 5.2 Confidence calibration

High-quality analysts should also become better at knowing when evidence is weak.

A mediocre analyst may confidently overinterpret ambiguous news.

A strong analyst may correctly say:

> **Mixed · Low confidence**

That is often more valuable than an unjustifiably certain directional call.

### 5.3 Speed

Better operations can process and surface information sooner after it becomes public.

Speed must never mean seeing an event before it is public in the authoritative market.

### 5.4 Coverage

A department can only monitor or deeply analyze a limited amount of the market at once.

Progression expands coverage so the system becomes useful as the player's empire grows.

### 5.5 Specialization

Specialists and departments can perform better within chosen sectors or asset types.

This creates meaningful hiring choices without requiring dozens of staff-management systems.

## 6. Progression path

Market Operations should appear gradually inside existing gameplay.

### Stage A — Personal investor

The player:

- reads news manually;
- watches a small number of assets;
- uses simple Why It Moved / risk / outlook information;
- makes all investment decisions directly.

No department UI is needed yet.

### Stage B — First research support

When the player's holdings/watchlist become large enough to create genuine information pressure, unlock a small Market Intelligence or Research capability.

The first benefit should be simple, such as:

- "important news" filtering;
- basic news interpretation;
- watchlist monitoring.

The player still makes every trade.

### Stage C — Small operation

The player gains:

- multiple department functions;
- first meaningful named specialist hires;
- sector specialization;
- better risk monitoring;
- configurable alerts/scanners.

The player's role starts shifting toward deciding what deserves attention.

### Stage D — Professional operation

The player manages broader coverage through:

- stronger department leadership;
- more specialist slots;
- advanced screeners;
- portfolio-level monitoring;
- richer research reports;
- limited rule-based execution.

The player remains responsible for the strategy.

### Stage E — Financial empire

At very large scale:

- departments monitor large portions of the player's exposure;
- high-level alerts summarize what materially changed;
- teams handle routine monitoring and execution rules;
- executives/management structures can reduce Management Capacity pressure;
- the player concentrates on allocation, acquisitions, major ownership decisions, crises, and strategic bets.

Late-game success means **fewer low-value clicks**, not more.

## 7. Scanners and automation

Scanners are rule-based monitoring systems, not predictive money printers.

Good examples:

> Alert me when one of my holdings receives major negative news.

> Flag technology stocks with improving sentiment and strong momentum.

> Tell me when a position becomes much riskier than when I bought it.

> Show me sector-wide news affecting at least three companies I follow.

Poor design examples:

> Find the stock that will rise the most.

> Automatically buy before positive movement.

> Trade whatever is most profitable for me.

The player should define what the system watches for. Better departments improve coverage, interpretation, filtering, and execution quality, but do not create impossible foresight.

## 8. Rule-based execution

Execution automation is later progression and should only appear after the player has used the underlying trading mechanics manually.

Examples of acceptable automation:

- execute a player-defined rebalance;
- reduce a position when a player-defined risk condition is met;
- buy/sell within strict limits after a player-authored multi-condition rule triggers;
- maintain a target allocation range.

Rules must be transparent and inspectable.

The system should explain why it acted.

Example:

> **Trading Desk sold 10 NOVA**  
> Your rule triggered: portfolio exposure to Mobility exceeded 35%.

Automation should not secretly optimize itself into a black-box trading strategy.

## 9. Relationship to existing progression

Market Operations should deepen existing progression tracks instead of creating a separate leveling universe.

### Research

Can improve:

- report depth;
- analysis confidence;
- sector comparisons;
- interpretation tools;
- specialist effectiveness.

### Risk

Can improve:

- portfolio warnings;
- risk scanners;
- concentration analysis;
- advanced defensive rules.

### Trading

Can improve:

- scanner sophistication;
- execution tools;
- advanced order/rule capabilities where appropriate.

### Management

Can improve:

- department capacity;
- specialist slots;
- number of monitored assets/sectors;
- number or complexity of active automation rules;
- effective delegation at empire scale.

### Wealth

Wealth should create the need and ability to operate at larger scale, but raw money alone should not instantly grant perfect analysis.

## 10. Economy and costs

Money remains the only general spendable currency.

Possible costs:

- specialist salaries;
- department operating costs;
- research retainers/tools;
- upgrading office/operational capacity later if it serves gameplay;
- premium fictional data/research services purchased with normal game money if appropriate.

Do not introduce analyst tokens, automation points, research gems, staff energy, or similar currencies.

Costs should create trade-offs, not chores.

A player might choose between:

- putting another $100,000 into the market;
- hiring a strong specialist;
- expanding department coverage.

That is a meaningful empire decision because every option uses the same core economic resource.

## 11. Management Capacity integration

Market Operations should eventually connect to the existing Management Capacity concept.

Departments and specialists should generally **reduce the player's attention burden**.

However, highly customized direct-control systems can consume some management capacity or equivalent limits so the optimal late-game strategy is not to configure hundreds of hyper-specific rules.

Possible model:

- passive department monitoring: low/no capacity cost;
- specialized active research coverage: modest capacity cost;
- complex trading rules/direct intervention: higher capacity cost;
- strong department leaders/executives reduce effective cost.

Exact numbers are intentionally deferred until the core progression economy exists.

## 12. Interface philosophy

Do not create a permanent top-level tab for every department.

Progressive disclosure remains mandatory.

Possible integration:

- news cards gain analyst interpretation after Research support unlocks;
- watchlists gain scanner/filter options after Market Intelligence unlocks;
- portfolio screens gain risk summaries after Risk support unlocks;
- trade/portfolio tools gain automation rules after Trading Desk unlocks;
- a later Operations screen can exist when the player genuinely has enough departments/staff to justify centralized management.

Early players should not see empty locked department dashboards.

## 13. Failure, uncertainty, and specialist mistakes

Specialists should occasionally be wrong because the market itself is uncertain, but the system must avoid arbitrary-feeling failure.

Rules:

- specialists interpret available evidence rather than roll a pure "wrong answer" chance;
- weaker analysts can use worse weighting, narrower coverage, slower processing, or poorer confidence calibration;
- ambiguous events naturally produce more disagreement/error;
- strong evidence should generally be easier to interpret correctly;
- mistakes should be explainable in hindsight where possible.

The player should be able to learn:

> "My analyst over-weighted hype and missed the production risk."

not:

> "The game randomly decided my 95%-accurate employee lied this time."

## 14. Specialist personality without employee-sim bloat

Named staff can add world personality through:

- concise bios;
- sector preferences;
- professional traits;
- occasional short commentary;
- career history;
- relationships/rivalries later if they directly affect analysis or hiring.

Avoid:

- hunger/energy meters;
- office decoration requirements tied to performance;
- daily employee happiness chores;
- interpersonal-drama systems unrelated to markets;
- manual schedules;
- large employee rosters.

Market Operations exists to simplify empire scale, not create a second management game that requires its own management system.

## 15. Balance and anti-solver rules

The system must preserve uncertainty.

Therefore:

- no analyst exposes exact hidden event strength;
- no scanner accesses future events;
- no automation receives future authoritative ticks;
- no department outputs exact guaranteed return percentages;
- no specialist becomes permanently correct;
- overlapping tools should have diminishing value rather than stacking into certainty;
- late-game players gain information-processing advantages, not deterministic foresight.

A veteran should be able to process more information and respond more intelligently than a beginner while still being capable of making a bad investment.

## 16. Relationship to the living fictional world

Departments and specialists should increase the value of future company/world depth.

Examples:

- a Technology specialist becomes valuable because technology companies have products, competitors, leadership, and sector events worth interpreting;
- a Risk department becomes more useful when sectors correlate during crises;
- Market Intelligence becomes more useful as the event system becomes richer;
- analysts can develop recognizable opinions about recurring fictional companies and executives.

Do not build deep specialist systems before the underlying market supplies enough meaningful information for them to analyze.

## 17. Implementation order

This is a **planned post-core system**, not the next immediate production task solely because the design now exists.

Dependencies should mature first:

1. believable market simulation;
2. meaningful news/events;
3. simulated investor behavior and bounded player influence;
4. beginner-readable market information;
5. actual progression/account persistence;
6. sufficiently large watchlists/portfolios that information overload becomes a real gameplay problem.

Then Market Operations should be introduced in slices.

### Slice 1 — Intelligence filtering

- one lightweight Market Intelligence capability;
- important-news filtering for followed/owned assets;
- no named employees required yet;
- proves that delegation reduces information overload.

### Slice 2 — Analyst interpretation

- first Research department capability;
- qualitative positive/mixed/negative interpretation;
- confidence language;
- first specialist or specialist-slot concept;
- no hidden truth.

### Slice 3 — Risk operations

- portfolio-level risk monitoring;
- concentration/volatility alerts;
- specialist/department improvements.

### Slice 4 — Department management

- department levels/capacity;
- hiring meaningful named specialists;
- salaries and operating costs;
- specialization choices;
- Management progression integration.

### Slice 5 — Advanced scanners

- player-configured market conditions;
- filtering across larger asset sets;
- saved scanner rules;
- explain why something was surfaced.

### Slice 6 — Trading Desk automation

- limited player-authored execution rules;
- strict transparency;
- safety/balance limits;
- audit trail explaining each action.

Each slice requires its own design/implementation review when it becomes current work. This document fixes the product direction, not every future numeric constant or UI layout.

## 18. Success criteria

Market Operations succeeds if:

1. a beginner can completely ignore it until it becomes useful;
2. a midgame player notices materially less repetitive checking;
3. a late-game player can manage many assets without performing every low-level task;
4. specialists feel valuable without becoming clairvoyant;
5. departments scale better than hiring dozens of individual workers;
6. automation follows player strategy rather than replacing it;
7. market uncertainty remains intact;
8. normal money remains the only general spendable currency;
9. the system strengthens Research, Risk, Trading, and Management progression instead of competing with them;
10. owning more assets never automatically creates proportionally more chores.

## 19. Final design decision

Market Operations is promoted from a speculative idea to a planned long-term progression system.

The approved direction is:

> **Departments provide scalable capability. Named specialists provide expertise and personality. Better operations improve accuracy, confidence calibration, speed, coverage, filtering, and execution of player-defined rules, but never reveal hidden market truth or guarantee profitable outcomes.**

The late-game fantasy is not "the game trades for me."

It is:

> **"I built an organization that lets me understand and control a much larger financial empire without personally performing every small task."**
