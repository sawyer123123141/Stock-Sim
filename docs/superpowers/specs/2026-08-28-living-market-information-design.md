# Market Era: Living Market & Information Design

## Status

Design source of truth for the living-market/event-information direction.

This document defines product behavior and interface hierarchy. It is not an instruction to implement the entire system in one change. Implementation should be split into bounded slices and preserve the project's existing server-authoritative market architecture.

## Core Goal

The market should behave using recognizable real-stock logic, but at a faster pace appropriate for a game.

The player should not win simply by deciding whether a headline sounds good or bad. The interesting decision should be:

> **Is this information better or worse than the market currently thinks it is?**

The simulation underneath can be sophisticated, but the normal interface must remain simple, readable, and understandable without finance knowledge.

---

## 1. Company Fundamentals

Every company has persistent underlying qualities such as:

- Growth outlook
- Profitability
- Financial health
- Competitive position
- Reputation/confidence

These should change gradually under normal conditions.

Major events can permanently change them.

Example: a major manufacturing breakthrough may permanently improve NOVA's profitability and competitive position.

This means a stock can legitimately move from something like $42 to $60, $80, or even $100 over time if the company itself has become significantly more valuable.

The price should not simply return to $42 when an event expires.

---

## 2. Market Expectations

Investors have expectations about companies before events happen.

Examples:

- Expected vehicle demand
- Expected product quality
- Expected growth
- Expected profitability
- Expected launch performance

An event is interpreted partly based on:

> **Actual result compared with expected result.**

Example: NOVA sells 100,000 vehicles.

If investors expected 60,000, this may be excellent news.

If investors expected 150,000, the exact same result may disappoint the market.

This allows good results to cause falling prices and apparently bad results to sometimes cause rising prices.

---

## 3. Events

Events should contain real business consequences rather than simply being assigned a hidden `positive` or `negative` number.

Example:

**NOVA reports record vehicle deliveries**

Possible consequences:

- Sales: strongly improved
- Revenue: improved
- Brand reputation: improved
- Profit margin: weakened because of discounts
- Production capacity: strained

The headline sounds positive, but the complete event is mixed.

Important event concepts include:

- What actually happened
- How significant it is
- How uncertain the outcome is
- Which companies/sectors are affected
- What information is currently public

---

## 4. Public Information vs Reality

The player should not immediately receive every hidden consequence of an event.

They receive the information that would realistically be public at that moment.

Example:

### Initial headline

**NOVA reports record launch-day orders**

Later:

**Production analysts warn NOVA may struggle to meet demand**

Later:

**LUMA agrees to increase battery shipments to NOVA**

This lets the player continuously update their opinion instead of receiving one card containing the entire answer.

---

## 5. Investor Reaction

The stock price should not directly follow the true hidden impact of an event.

Simulated investors interpret the public information.

Different investors may:

- Correctly understand the event
- Underestimate it
- Overestimate it
- Disagree about its importance
- Change their opinion when new information appears

This can produce:

- Overreactions
- Underreactions
- Reversals
- Momentum
- Panic
- Hype
- Gradual repricing

The market is allowed to be temporarily wrong.

Investor perception should mostly emerge from investor behavior rather than being a fixed scripted event field.

---

## 6. Temporary Reaction vs Permanent Change

Events can affect the market in two separate ways.

### Temporary market reaction

Examples:

- Hype
- Panic
- Buying pressure
- Selling pressure
- Increased volatility
- Momentum
- Uncertainty

These effects eventually fade.

### Persistent fundamental change

Examples:

- Improved margins
- Higher debt
- Better technology
- Damaged reputation
- Higher long-term growth
- Stronger competitive position

These remain after the immediate story ends.

Example price behavior:

`$42 -> $55 -> $51 -> $62`

The initial spike may partially reverse, but the stock can settle much higher than where it started because the company's fundamentals actually improved.

---

## 7. Event Significance

Events can conceptually fall into broad significance levels:

- Minor
- Normal
- Major
- Transformative

These should guide balancing, not directly dictate percentage movements.

There should not be rules such as:

> Major event = exactly +15%.

A major event may produce a small move if investors already expected it.

Another major event may create a huge move because it completely surprises the market.

A transformative event can potentially create something like:

`NOVA: $42 -> $100+`

but this should happen gradually and only when the company's future genuinely changes.

---

## 8. Game-Speed Market

We should copy the logic of real markets without copying their slow timescale.

Real market developments that might take days or weeks can happen over minutes or hours of gameplay.

Desired feeling:

### 30-60 seconds

Small movement and occasional noticeable changes.

### Several minutes

Trends become visible.

### 10-20 minutes

A decision can meaningfully profit or lose money.

### Around an hour

A portfolio should usually look meaningfully different, especially if important events happened.

Stocks remain calmer than crypto, but neither should feel motionless.

The goal is not permanently faster upward growth. It is more meaningful movement in both directions, especially when information changes.

---

# Interface Design

## Core Rule

> **Do not display everything simply because the simulation knows everything.**

Information should be layered.

The default screen should answer only:

- What is this company?
- What is the price doing?
- What important thing is happening?
- Why might it be moving?
- What do I own?
- How do I buy or sell?

Deeper information should require deliberate exploration.

The interface should use normal-language wording first. Technical finance terminology can appear deeper in Research when useful, but the default market screen should be immediately understandable.

---

## 9. Main Layout

Keep the existing basic structure:

### Left

Watchlist / asset list

### Center

Selected company and market

### Right

Trading and current position

### Top

Portfolio value, cash, and game/progression access

The chart remains the visual center of the screen.

Do not add additional permanent panels merely because new simulation data exists.

---

## 10. Price Chart

Keep and heavily improve the existing chart.

Important public events should appear as small markers on the chart at the time the information became public.

Example:

```text
                      /----
                   /--
          *--------
        /
------*
      ^
 NOVA launch
```

Clicking or hovering a marker reveals a short explanation, such as:

**NOVA unveils Nova S**  
12 minutes ago  
Developing story

Later information can appear as additional markers.

This visually connects information with the market's reaction without permanently filling the screen with text.

Do not expose hidden event truth through chart markers. Markers represent public information only.

---

## 11. Market News -> Developing Stories

Do not remove news.

Evolve the current Market News system into **Developing Stories**.

Instead of several disconnected cards for one situation, related updates become one evolving timeline.

Example:

### NOVA'S NEW MODEL

**Developing**

```text
* Record launch-day orders
|
* Production concerns emerge
|
* LUMA expands battery supply
|
o Story developing
```

Only important or uncertain events need multi-stage stories.

Small events can remain simple single updates.

Do not automatically label headlines as `GOOD`, `BAD`, `BULLISH`, or `BEARISH` when that would reveal the intended interpretation.

The player should interpret the information.

---

## 12. Market Pulse -> Market Read

Keep the existing concept, but make the wording easier to understand.

A simple default version might show:

### MARKET READ

- Buyers have a slight edge
- Price movement is elevated

Avoid unclear labels such as simply `Risk: High`, because volatility, uncertainty, company health, and financial risk are different concepts.

Market Read describes what is currently happening.

It should never tell the player to Buy or Sell.

Avoid adding metrics merely because they can be calculated. Two highly useful lines are better than six weak ones.

---

## 13. Why It Moved

Keep this feature, but reduce its permanent screen space.

Collapsed version:

> **WHY THE MOVE?** New-model demand is creating buying pressure ->

Opening it can show more detail:

### Why NOVA moved

- Up: New-model demand - Strong
- Up: Buying pressure - Moderate
- Up: Recent momentum - Moderate
- Down: Production concerns - Small

Keep this qualitative.

Do not expose hidden formulas, exact simulation coefficients, future RNG, or anything that gives the player privileged access to authoritative hidden state.

---

## 14. Company Details

Opening a company should eventually provide deeper sections such as:

### Overview

The normal trading/chart screen.

### Company

- Company description
- Products
- CEO/executives
- Headquarters
- Industry
- Competitors
- Suppliers
- Company artwork and identity

### Research

- Growth outlook
- Profitability
- Financial health
- Competitive position
- Market expectations

### Stories

- Current developing story
- Previous significant stories
- Resolved company events

This creates depth without forcing all of it onto the main screen.

---

## 15. Research Wording

The simulation may use complex concepts internally.

Player-facing wording should be understandable first.

Prefer:

> **The company's outlook is improving**

rather than:

> Positive fundamental outlook

Prefer:

> **Investors aren't sure what this news means yet**

rather than:

> High market uncertainty

Prefer:

> **Buyers have a slight edge**

rather than:

> Short-term pressure: slightly upward

More technical terminology can appear deeper in Research as the player progresses.

Simple wording must not become misleading wording. If a complex concept cannot be simplified accurately, explain it briefly instead of disguising it.

---

## 16. Progressive Information

The interface should become more sophisticated as the player progresses.

### Early game

Show:

- Price
- Chart
- Buy/Sell
- Current position
- Simple Market Read
- Major headlines/stories
- Basic Why It Moved

### Later Research access

Add:

- Company fundamentals
- Expectations
- Story history
- Competitors
- Company relationships

### Later advanced systems

Potentially add:

- Sector analysis
- Supplier/customer relationships
- Deeper expectations
- Specialist interpretations
- Scenario analysis

The player should grow into the complexity.

They should not begin the game staring at a miniature Bloomberg terminal.

---

# Trading UX Improvement

## 17. Sell-Side Ownership Visibility

### Problem

The current sell screen technically displays the number of owned shares, but it is easy to overlook.

During fast price movement, the player should not need to remember their share count or calculate percentages manually.

### Sell Mode

When Sell is selected, make ownership prominent.

Example:

```text
SELL NOVA                         $47.82

You own
200 shares                        approx. $9,564

Quantity
[        100        ]

[ 25% ] [ 50% ] [ 75% ] [ ALL ]

Estimated sale
$4,782

              [ Sell 100 shares ]
```

Prefer `You own 200 shares` over a terse label such as `Owned: 200`.

---

## 18. Sell Percentage Buttons

Percentage buttons fill the existing quantity input.

For 200 shares:

- 25% -> 50
- 50% -> 100
- 75% -> 150
- ALL -> 200

For quantities that do not divide evenly:

- 25%, 50%, and 75% round down to a valid whole-share quantity.
- ALL always uses the exact owned quantity.

A percentage button should never produce an invalid zero-share trade. If the player owns too few shares for a percentage to produce at least one whole share, disable that percentage option or otherwise keep the existing quantity unchanged rather than submitting an invalid value.

These buttons should only appear while selling.

They should not clutter Buy mode.

### Buy Mode

Keep Buy mode simple:

- Quantity
- Estimated cost
- Cash available
- Confirm Buy

Sell-specific controls should disappear.

---

## 19. Game Progression vs Market Information

Do not visually mix progression guidance with market interpretation when avoidable.

The current `Next Objective` concept belongs to the game/progression layer, while Developing Stories and Why It Moved belong to the market-information layer.

Move objective access toward the header or another compact game-layer location rather than letting it compete with market information below the chart.

This reinforces the broader design rule:

> **The market itself should look real. The surrounding experience should look like a game.**

---

# Visual Identity

## 20. Calm Interface, Living Economy

Maintain the established visual direction:

> **Calm interface. Colorful companies. Living economy.**

The market interface stays restrained and professional.

Company identities and important stories provide personality.

Important events can use subtle animation:

- A marker appearing on the chart
- A Developing indicator
- A new timeline item sliding into a story
- A subtle notification

Avoid:

- Entire screen turning green/red
- Giant flashing profit numbers
- Constant alerts
- Excessive animation
- Casino-style celebration

The game should feel exciting because the market is alive, not because the interface is screaming.

---

# Information Hierarchy Summary

## Always Visible

### Header

- Portfolio value
- Cash
- Compact progression/objective access

### Left

- Watchlist

### Center

- Company identity
- Price
- Simple Market Read
- Chart with public event markers
- Compact Why It Moved

### Right

- Trade controls
- Current position
- Prominent owned shares while selling
- 25% / 50% / 75% / ALL sell shortcuts

## Contextually Visible

- Current Developing Story
- Important story updates

## On Demand

### Company

Company identity/worldbuilding.

### Research

Fundamentals and expectations.

### Stories

Full event history.

---

# Implementation Constraints

When implementing this design:

1. Preserve the server-authoritative market model.
2. Do not expose hidden simulation state, RNG, exact formulas, or future event truth to the browser.
3. Do not implement the entire design in one PR.
4. Prefer bounded vertical slices with tests and a clear user-facing outcome.
5. Keep the main screen simple even as the underlying simulation becomes deeper.
6. Preserve existing responsive behavior unless a slice explicitly redesigns it.
7. Do not make every event misleading. Straightforward events should remain common enough that information retains meaning.
8. Major price movement should emerge from expectations, information, investor reaction, and changing fundamentals rather than a scripted target price.
9. Keep stocks calmer than crypto while ensuring both move enough to be engaging at game speed.
10. Treat advanced Research as progressive disclosure, not default clutter.

---

# Final Product Principle

> **Real stock-market logic, compressed into game time, presented in normal language, and designed so the player can participate in the interesting parts.**

The simulation can be deep.

The interface should feel simple until the player chooses to look deeper.
