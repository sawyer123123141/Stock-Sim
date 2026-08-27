# Market Era current UI direction checkpoint

This document records the latest reviewed visual direction before production UI begins. It supplements `docs/ui-reference-research.md`; it does not replace the master design spec.

## Core visual rule

**The market core should feel credible; the surrounding experience should feel like a game.**

Use the information grammar of real investing software for asset details, charts, positions, and trading. Use Market Era's fictional-company identity, events, progression, motion, framing, and navigation to create the game feel.

Do not solve “make it feel like a game” by covering every panel in neon, adding fake currencies, or turning every feature into a permanent widget.

## Current direction

The strongest explored direction is a cleaner **command-center / arcade hybrid**:

- dark navy base with controlled bright accents;
- strong game framing and navigation;
- readable, realistic price charts at the center of asset decisions;
- chunky, satisfying interaction targets without literal arcade-machine gimmicks everywhere;
- fictional company branding and illustrated events for personality;
- organized hierarchy rather than a grid of equally loud cards.

The theme is promising but **not permanently locked**. Structure and information hierarchy matter more than preserving any specific neon treatment.

## Screen split

### Home / Market Overview: game-forward

Its job is to answer:

1. How am I doing?
2. What is happening?
3. What should I look at next?

Keep it compact. Portfolio summary, a small watchlist/market view, one important story, and one next goal are enough for an early player.

### Asset Detail: market-forward

Its job is to let the player understand and act on one asset. Mature versions can contain:

- company/coin identity and ticker;
- current price and change;
- a large readable price chart;
- timeframe controls;
- event markers;
- Buy / Sell;
- the player's position;
- plain-language movement reasons;
- recent news/research.

The chart and trade flow should remain believable even if all progression decoration is removed.

## Progressive disclosure is a hard rule

The latest dense stock-detail prototype should be treated as **midgame UI, not minute-one UI**.

### Stage 1: first sessions

Show only what is necessary to understand the loop:

- portfolio value/cash;
- roughly 3–5 available assets;
- one simple chart, initially 1D;
- current price and up/down movement;
- one clear Buy / Sell path;
- one simple story/news explanation;
- one next goal.

Do not initially expose a wall of Top Movers, detailed movement breakdowns, many event markers, advanced chart controls, order types, sector metadata, or large progression panels.

### Stage 2

Deepen familiar screens with:

- more assets;
- watchlist;
- Top Movers;
- additional chart timeframes.

### Stage 3

Add:

- chart event markers;
- richer “Why it moved” explanations;
- company information;
- position/return breakdowns.

### Stage 4

Add advanced tools only after the player understands the base loop:

- alerts;
- additional order controls where justified;
- deeper research;
- more advanced market tools.

Unlocks should usually reveal depth **inside an existing screen** rather than creating another permanent navigation destination.

## Things to reject

- generic AI/SaaS dashboard layouts;
- article/news-homepage structure as the main play space;
- professional-terminal density for new players;
- fake mobile-game clutter such as gems, shards, energy bars, or multiple spendable currencies;
- decorative charts that do not behave like credible market charts;
- oversized progression UI competing with the actual market decision;
- every panel glowing equally;
- burying closely related market information behind unnecessary clicks.

## Next UI implementation target

After the authoritative server slice is reviewed, build a **small early-game playable vertical slice**, not the full dense mockup:

1. a minimal market/home shell;
2. Nova Motors asset detail;
3. live simulated chart from authoritative snapshots;
4. simple fictional-money Buy / Sell;
5. cash + holdings;
6. one plain-language movement/news explanation.

Only add later-stage UI once this loop is understandable and satisfying.
