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
