# Market Experience V1 Design

## Goal

Expose the living market's existing depth through one selected-asset experience without changing simulation behavior. The screen's main job is to help a beginner understand one asset, make a trade, and reveal deeper company/research/story context only when they ask for it.

## Scope and references

This vertical slice adds a safe server-owned Market Read and stock Research projection, local asset tabs, compact movement detail, public story history, and a compact objective chip. It does not alter pricing, events, investor behavior, canonical time, persistence, trade semantics, or hidden-state authority.

The visual approach applies the repository's existing reference research:

- Robinhood contributes a prominent asset identity and price before deeper information; it does not contribute brokerage styling.
- Coinbase contributes an understated accessible tab/control vocabulary and responsive layout discipline; it does not contribute exchange density.
- Duolingo contributes progressive disclosure and a single compact next objective; it does not contribute game-map or childlike treatment.
- The current Market Era direction keeps the chart central and the desktop asset detail market-forward, using the current navy palette and calm spacing.

## Information hierarchy and wireframe

Desktop retains the coordinated three-column workspace. The center is the selected asset and the right trade column remains visible across tabs.

```text
Portfolio / Cash / Objective chip

Watchlist | Asset identity, live price, tabs              | Trade / Position
          Overview | Company | Research | Stories
          Overview: Market Read, live chart, compact move
                    current public Developing Story
          Company: profile (stocks only)
          Research: company outlook + market expectations | Trade / Position
          Stories: relevant public history                | Trade / Position
```

On a narrow screen the identity/tabs/content/trade stack naturally. Tabs are horizontally scrollable only as a compact control row, not a new full-screen navigation system; no content row is allowed to overflow horizontally.

## Public contracts

`MarketReadSnapshot` is public semantic data, classified by the authoritative simulation layer:

```ts
interface MarketReadSnapshot {
  movement: "calm" | "active" | "elevated";
  pressure: "down" | "slightly-down" | "balanced" | "slightly-up" | "up";
}
```

The browser renders two non-predictive sentences from those states, for example “Buyers have a slight edge” and “Price movement is fairly calm.” It does not receive raw pressure or volatility.

Stocks additionally receive a `research` snapshot. Crypto omits it entirely.

```ts
interface StockResearchSnapshot {
  company: Record<"growth" | "profitability" | "financialHealth" | "competitivePosition" | "reputation", "challenged" | "mixed" | "solid" | "strong">;
  expectations: Record<"growth" | "profitability" | "demand" | "execution", "cautious" | "balanced" | "constructive" | "high">;
}
```

The server maps normalized values into broad deterministic bands. The browser owns only prose for those public labels. Raw fundamentals, expectations, pricing state, expectation gaps, investor outputs, event surprise, event effects, private stories, RNG, and contribution coefficients remain server-only.

Movement reasons cross the boundary as a public qualitative projection (`label`, `summary`, `direction`, `strength`) rather than a numeric contribution weight.

## Overview

Overview is the default tab and resets when another asset is selected. It holds the identity/quote, Market Read, chart with existing public story markers, a collapsed “Why the move?” control, and one relevant current/recent story. The chart stays the visual center.

Market Read replaces Market Pulse. It has no risk label or recommendation. Pressure copy is: clear buyers edge, slight buyers edge, balanced, slight sellers edge, or building selling pressure. Movement copy is calm, active, or elevated.

Why the move is a labelled button. Collapsed, it shows the strongest public reason and a disclosure cue. Expanded, it shows up to three public reasons with only qualitative small/moderate/strong language. Enter/Space and click/tap work; the height transition is short and reduced-motion safe.

The objective moves into the header as a compact labelled chip with current progress. It remains a browser-session guidance feature and gains no server state.

## Company, Research, and Stories

Stocks expose `Overview`, `Company`, `Research`, and `Stories`; crypto exposes only `Overview` and `Stories`.

Company is static public worldbuilding for NOVA, LUMA, and HGRD: name, symbol, sector, concise purpose, and a small identity paragraph. It is not presented as financial truth or a new simulation system.

Research uses compact two-section rows, not stat cards: Company Outlook (five qualities) and Market Expectations (four qualities). Labels are prose such as “The company’s growth outlook is strong” and “Investors remain cautious on execution.” No numeric bars, raw values, or hidden gaps are shown.

Stories lists every relevant public story for the asset: asset target, matching sector, and global. It reuses the established relevance rule, ranks developing stories before resolved, then uses relevance and latest published update. It renders only published updates and never creates placeholders for planned updates.

## Tests and verification

Tests cover deterministic Market Read/research classification boundaries, public serialization safety, reason projection safety, tab availability/reset/accessibility, natural-language copy, collapsed/expanded movement detail, objective placement, story-history relevance/ranking, and crypto research absence. Existing persistence, replay, pacing, trading, and Developing Stories tests remain unchanged and green.

Manual verification covers ordinary desktop and 390px mobile: chart prominence, tab usability, trade persistence in layout, readable research rows, compact story histories, expanding movement detail, and a non-crowded objective chip.
