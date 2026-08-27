# UI Reference Research

This document is a **design constraint**, not a mood board that gets forgotten once coding starts.

Market Era should not look like a generic AI-generated dashboard, a black trading terminal, or a mobile game covered in unrelated counters. Every major screen should be designed from concrete references and then adapted to the game's own visual identity.

## Reference set

### Robinhood — beginner-friendly financial hierarchy

References:
- https://robinhood.com/us/en/policy/design/
- https://robinhood.com/us/en/support/articles/viewing-stock-detail-pages/
- https://robinhood.com/us/en/support/articles/cortex-digests/

What to learn from it:
- Put the most important decision-making information first.
- Let a simple asset page work for beginners while deeper statistics remain available lower in the hierarchy.
- Explain market movement in plain language instead of forcing users to decode raw finance terminology.
- Keep the core buy/sell flow obvious.

What **not** to copy:
- Market Era should not inherit a sterile brokerage aesthetic.
- It should not turn every screen into a chart with text underneath.

### Coinbase — scalable financial UI and feature-sprawl warning

References:
- https://www.coinbase.com/blog/building-economic-freedom-one-pixel-at-a-time
- https://www.coinbase.com/blog/Coinbase-has-open-sourced-its-design-system
- https://cds.coinbase.com/
- https://www.coinbase.com/blog/landing/design

What to learn from it:
- Financial products accumulate complexity quickly, so related capabilities should be consolidated rather than scattered across separate entry points.
- A reusable design system should cover layout, typography, navigation, cards, data display, charts, motion, accessibility, and theming.
- Feature growth must not make the core tasks harder to understand.
- Accessibility and keyboard/focus behavior should be built into components rather than patched in later.

What **not** to copy:
- Market Era should not feel like a crypto exchange.
- Advanced tools should remain visually secondary until a player needs them.

### Duolingo — playful clarity, guided progression, and visual craft

References:
- https://design.duolingo.com/
- https://blog.duolingo.com/shape-language-duolingos-art-style/
- https://blog.duolingo.com/core-tabs-redesign/
- https://blog.duolingo.com/new-duolingo-home-screen-design/

What to learn from it:
- Bright colors, rounded shapes, friendly illustration, motion, and negative space can make an intimidating subject approachable.
- Simplicity must be balanced with clarity. Removing information is not useful if the player no longer knows what to do.
- Consistent headers, spacing, typography, cards, and navigation make many features feel like one product.
- Guided progression can teach complex material without forcing the user to choose from a giant menu before they understand it.
- Illustration and motion should direct attention and explain, not merely decorate.

What **not** to copy:
- Market Era should not look childish or educational-first.
- The visual tone is a polished **business-cartoon**, not a language-learning clone.

## Required visual direction

**Colorful business-cartoon**:
- bright/pastel palette with enough contrast for readability;
- rounded cards and controls;
- generous negative space;
- strong company and coin identities;
- friendly, legible charts;
- illustrated logos, sectors, products, CEOs, and news moments where useful;
- restrained but satisfying motion for trades, gains/losses, unlocks, and major events;
- clear type hierarchy;
- serious information can exist without making the product visually serious or gloomy.

## Anti-slop UI rules

1. **No screen begins from an AI-generated dashboard prompt.** Start from references and information hierarchy.
2. **Before implementing any major screen, collect 2–4 concrete visual references** for the exact problem that screen solves.
3. **Write down what each reference contributes**: hierarchy, navigation, spacing, interaction, chart treatment, motion, etc.
4. **Do not add a new top-level navigation item merely because a feature unlocks.** Prefer deeper states inside Market, Portfolio, Discover/Research, Trade, and Empire.
5. **One primary purpose per mobile screen.** Desktop may use multiple coordinated panels because it has the space.
6. **Charts are supporting visuals, not the game's visual identity.**
7. **Every icon-only control must be immediately understandable or labeled on hover/tap.**
8. **Every financial term must have a plain-language representation.**
9. **Do not solve complexity with smaller text.**
10. **New features must reuse established visual patterns before inventing another component style.**
11. **Empty space is a feature.** Do not fill a screen just because room exists.
12. **Polish review is mandatory before a screen is considered finished:** alignment, spacing, states, animation, empty/loading/error states, accessibility, desktop scaling, and mobile adaptation.

## Screen-design workflow

For every major screen later in development:

1. Define the single main job of the screen.
2. Decide what a brand-new player sees.
3. Decide what extra information an advanced player can reveal.
4. Gather 2–4 reference screenshots/products.
5. Produce a low-fidelity information hierarchy.
6. Produce a visual mockup in the Market Era style.
7. Review for crowding and terminology.
8. Only then implement it.

If a screen cannot pass this process, it is not ready to be built.

---

## First-screen reference brief — Market Overview

This is the first production screen to design after the simulation foundation. **No production React implementation should begin until this brief becomes a visual mockup.**

### Main job

Let a beginner open the game and answer three questions almost immediately:

1. **How am I doing?**
2. **What is happening in the market?**
3. **What looks interesting enough to inspect?**

The Market Overview is not a trading terminal. It is a welcoming doorway into the economy.

### Concrete references for this screen

#### 1. Robinhood stock/detail hierarchy
Reference: https://robinhood.com/us/en/support/articles/viewing-stock-detail-pages/

Use:
- prominent identity and current price before advanced metrics;
- progressive detail rather than showing every statistic at once;
- clear time/context around price movement;
- obvious actions only when the user has chosen an asset.

Do not copy:
- the brokerage look;
- chart-first identity;
- dense financial-stat sections on the overview screen.

#### 2. Duolingo core-tab redesign
Reference: https://blog.duolingo.com/core-tabs-redesign/

Use:
- deliberate whitespace instead of wrapping every section in another card;
- consistent header, type, spacing, and navigation rules;
- each section keeping its own purpose while still feeling like one system;
- the explicit lesson that **simplicity must not reduce clarity**.

Do not copy:
- character-heavy educational framing;
- oversized decoration with no information purpose.

#### 3. Duolingo guided home screen
Reference: https://blog.duolingo.com/new-duolingo-home-screen-design/

Use:
- one obvious next step for a beginner;
- guided progression embedded in the main experience rather than a separate tutorial maze;
- optional depth living around the primary path instead of competing with it.

Do not copy:
- a literal lesson path;
- game-map navigation for financial assets.

#### 4. Coinbase Design System
References:
- https://cds.coinbase.com/
- https://www.coinbase.com/blog/Coinbase-has-open-sourced-its-design-system

Use:
- reusable spacing/type/navigation primitives;
- accessible focus/keyboard behavior from the component level;
- responsive layout rules rather than one-off screen hacks;
- a small coherent component vocabulary that can scale as financial features expand.

Do not copy:
- exchange-style visual density;
- crypto-dashboard conventions merely because this game contains crypto.

### Beginner-visible information hierarchy

Desktop first-pass hierarchy:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Market Era     Era status                    Alerts   Profile     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  YOUR PORTFOLIO                                                   │
│  $12,480                    +2.4% this Era                        │
│  Short friendly status sentence                                  │
│                                                                  │
├──────────────────────────────────────┬───────────────────────────┤
│                                      │                           │
│  WHAT'S HAPPENING                    │  YOUR NEXT GOAL           │
│  One strong market/news story        │  One career objective     │
│  + simple market mood                │  + progress               │
│                                      │                           │
├──────────────────────────────────────┴───────────────────────────┤
│                                                                  │
│  EXPLORE THE MARKET                                               │
│  [Stocks] [Crypto]                                                │
│                                                                  │
│  Logo  Nova Motors        $42.18     ▲ 3.2%   simple reason      │
│  Logo  Luma Labs          $78.40     ▲ 1.1%   simple reason      │
│  Logo  Harvest Grid       $31.75     ▼ 0.8%   simple reason      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### What is deliberately absent

The first screen does **not** permanently show:
- candlesticks;
- P/E, EPS, RSI, or other unexplained finance metrics;
- order forms;
- company-control systems;
- a grid of every available feature;
- multiple currencies/resources;
- five simultaneous news feeds;
- giant leaderboards;
- advanced chart controls;
- every alert condition;
- a separate card for every unlocked mechanic.

### Progressive disclosure

Selecting an asset opens its detail flow. That flow may reveal:

1. identity + price + simple movement reason;
2. friendly chart;
3. buy/sell action;
4. recent news;
5. beginner research labels;
6. increasingly advanced data only after the player has reason to use it.

### Visual identity for the mockup

The eventual mockup should test:
- a bright light background rather than finance-black;
- pastel/soft accent surfaces with strong contrast;
- rounded but not toy-like geometry;
- distinctive fictional company logos/colors;
- strong typography with few sizes;
- sparklines only where they improve scanning;
- gains/losses communicated by icon/direction/text as well as color;
- subtle animation for live price changes without making the screen twitch constantly;
- generous whitespace as an explicit design element.

### Crowding rule

At ordinary desktop size, a beginner should be able to describe the purpose of **every visible region** without opening help. If a region exists only because there was empty space, remove it.

The next UI step is a visual mockup of this exact hierarchy. Production UI code remains blocked until that mockup is reviewed.
