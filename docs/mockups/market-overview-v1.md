# Market Overview Mockup v1

Status: **visual review candidate, not production UI**.

The matching visual is `market-overview-v1.svg`.

## Screen job

A beginner should answer, in order:

1. How am I doing?
2. What is happening in the market?
3. What is interesting enough to inspect next?

The screen deliberately does not expose order entry, candlesticks, advanced ratios, company-control systems, leaderboards, or a grid of unlocked mechanics.

## Reference decisions

### Robinhood asset-detail hierarchy
Reference: https://robinhood.com/us/en/support/articles/viewing-stock-detail-pages/

Borrowed:
- identity/value before deeper statistics;
- plain-language context around movement;
- progressive disclosure after choosing an asset.

Rejected:
- brokerage styling;
- chart-first identity;
- dense financial statistics on the overview.

### Coinbase Design System
References:
- https://cds.coinbase.com/components/cards/DataCard/
- https://cds.coinbase.com/components/layout/Grid/

Borrowed:
- a small reusable card vocabulary;
- consistent spacing/radius hierarchy;
- data cards that keep value, context, and visualization together;
- responsive-grid thinking rather than one-off positioning.

Rejected:
- exchange/dashboard density;
- making every number its own card.

### Duolingo design principles
References:
- https://blog.duolingo.com/core-tabs-redesign/
- https://blog.duolingo.com/new-duolingo-home-screen-design/

Borrowed:
- one obvious next step;
- bright surfaces and generous whitespace;
- progression embedded in the main experience;
- simplicity without hiding the meaning of the interface.

Rejected:
- lesson-path navigation;
- character-heavy educational framing.

### Two Point Hospital management UI philosophy
References:
- https://mcvuk.com/development-news/when-we-made-two-point-hospital/
- https://www.pcgamer.com/two-point-hospital-hands-on-theme-hospital-fans-are-getting-the-exact-game-they-want-with-a-few-twists/

Borrowed:
- chunky, readable controls that do not intimidate new players;
- deeper simulation information available only when someone wants to dig into it;
- colorful game identity despite serious management systems.

Rejected:
- permanent HUD panels around every edge;
- icon accumulation as systems grow.

## Visual hierarchy in v1

1. Stable top navigation: Market, Portfolio, Discover.
2. Portfolio hero: current value, Era return, one friendly interpretation, simple visual trend.
3. Next Goal: one progression objective and one action.
4. What's Happening: one dominant market story with a market-mood label and illustration.
5. Explore the Market: Stocks/Crypto toggle and compact asset rows containing identity, price, direction, tiny trend, and one plain-language reason.

## Style decisions

- Canvas: bright near-white lavender rather than finance-black.
- Surfaces: pastel lavender, mint, sky, peach, and warm yellow.
- Geometry: 22-30px radii for major surfaces; smaller pills inside them.
- Typography: few strong sizes rather than many tiny labels.
- Company identity: large colored logo marks rather than ticker text alone.
- Charts: supporting sparklines only; no giant chart dominates the screen.
- Gains: direction symbol + text + color, never color alone.
- Illustration: used for the dominant news story so the page feels like a game rather than accounting software.

## V1 self-review

### Working well
- The screen has four understandable regions instead of a dashboard mosaic.
- The eye reaches portfolio -> goal -> market story -> assets naturally.
- The news illustration adds game personality without becoming a mascot-heavy UI.
- Financial meaning remains readable without finance knowledge.
- There is enough empty space that future systems do not need to occupy every gap.

### Risks to watch
- The top navigation and large cards can still drift toward a generic polished SaaS look if future screens lose the illustrated/company-identity layer.
- Do not respond to that risk by adding decorative widgets. Strengthen art direction, company branding, motion, and typography instead.
- The first viewport only needs a few market rows. More assets should scroll; shrinking rows to fit more would violate the crowding rule.
- `Continue` is intentionally the only strong task action on this screen. Asset rows become interactive, but trading actions belong inside asset detail.

## Review gate

Do **not** begin production React implementation until this mockup has been visually reviewed and either approved or revised.
