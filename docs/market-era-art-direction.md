# Market Era art direction checkpoint

This document records the currently preferred visual/art direction. It supplements `docs/mockups/2026-08-27-current-ui-direction.md` and does not replace the product spec.

## Approved visual base

The preferred UI base is **soft dark navy**.

The interface should feel calm, spacious, premium, and approachable rather than like a professional trading terminal or a neon arcade dashboard. Dark navy is the canvas, not the personality by itself.

Core rule:

> **Calm interface. Colorful companies. Living economy.**

The market core stays credible and readable. Personality comes mainly from the fictional companies, products, executives, events, writing, illustration, motion, and progression.

Avoid:

- dense dark-card-on-dark-card terminal layouts;
- excessive neon, glow, cyberpunk treatment, or casino energy;
- cartoon mascots or joke-first company branding;
- generic stock photography / photorealistic corporate imagery as the main identity;
- constant animation or every panel demanding attention;
- redesigning the entire UI whenever a new company is selected.

## Personality model

The direction is a restrained blend of:

- **credible financial world** for charts, prices, positions, trade controls, and hierarchy;
- **quirky but believable corporate world** for company identities, products, leaders, rivalries, headlines, advertisements, and events.

Personality should appear at three intensities:

1. **Quiet, always present** — company colors, logos, typography, small copy details, icon treatment, subtle motion.
2. **Medium, event-driven** — product launches, earnings, CEO comments, competitor moves, story cards, chart markers.
3. **Large, rare** — major crashes, launches, market-wide events, acquisitions, and career milestones.

If everything is dramatic, nothing is dramatic.

## Global artwork direction

Artwork should feel like believable fictional brands from a slightly stylized world.

Target qualities:

- stylized commercial illustration;
- believable proportions and products;
- clean shapes and strong silhouettes;
- controlled lighting;
- simplified but premium materials;
- colorful enough to contrast with the navy UI;
- consistent rendering language across companies;
- more expressive than stock photography but less exaggerated than cartoon/game mascot art.

Do not drift into photorealism, anime, Pixar-like 3D, cyberpunk concept art, or hyper-futuristic glowing-product imagery unless a specific company/event genuinely calls for it.

## Artwork hierarchy

### Tier 1 — small UI art

Examples: logos, symbols, product thumbnails, small event thumbnails.

- simple;
- recognizable at small size;
- low detail;
- strong silhouette;
- should not compete with market information.

### Tier 2 — story art

Examples: company news, product reveals, executive announcements, facilities, ads.

- more detailed;
- strong company identity;
- composed to work inside UI cards;
- visually expressive without becoming hero art every time.

### Tier 3 — hero art

Examples: major launches, Era events, crashes, milestone moments.

- rare;
- dramatic;
- highest detail and strongest composition;
- reserved so major moments actually feel major.

## Company brand system

Each important fictional company should eventually have a compact brand kit:

- name and ticker;
- logo/symbol;
- primary and secondary colors;
- sector;
- personality and tone;
- product/design language;
- executive identity;
- advertising style;
- recurring products/services;
- competitors/rivalries;
- reputation traits;
- small UI thumbnail treatment;
- story/event art treatment.

The whole Market Era UI should not recolor itself for every company. Company identity should appear through restrained accent changes, artwork, logos, story cards, and details.

## First art-production milestone

Do not generate dozens of companies at once.

Start with one existing starter company, currently NOVA Motors unless the roster is revised first, and create a controlled identity pack:

1. logo;
2. color palette;
3. flagship product;
4. executive portrait;
5. headquarters/facility image;
6. advertisement;
7. major-news illustration;
8. small UI thumbnail variants.

Place that identity back into the soft-dark-navy interface and evaluate whether the company makes the screen feel like a living fictional market rather than a generic finance product.

If the artwork clashes with the interface, refine the **global art rules first** instead of individually patching every future company.

## Progression and art

Early screens remain visually simple. As the player progresses, personality and depth should reveal themselves inside familiar screens through richer company information, event markers, research, news, and artwork rather than adding permanent clutter or new navigation for every system.

## Market readability and event reaction

The market should be uncertain but **readable enough that trading is a decision, not a guess at a squiggly line**.

Do not make headlines map one-to-one to individual drops or spikes. Do not use a deterministic pattern such as “good news appears, then the stock rises exactly 20 seconds later.” That would turn trading into a reaction-time exploit rather than strategy.

Preferred model:

> **News/event becomes public → market participants react gradually → buying/selling pressure builds and decays → price responds over multiple ticks while other forces still matter.**

An event therefore contributes pressure rather than directly assigning a price move. Its effect can be offset or reinforced by normal market noise, sector conditions, sentiment, momentum, other events, and demand.

A useful event model can eventually include:

- direction;
- strength;
- confidence;
- reaction speed;
- duration.

This allows different events to behave differently. A major earnings surprise can create strong pressure that lasts, a weak rumor can create uncertain short-lived movement, and a major scandal can begin affecting the market quickly while continuing to matter afterward.

### News / event feed

The news feed tells the player **what happened**. It should appear early enough that the player can form a view before the full market reaction has played out, but it should not promise a guaranteed result or exact percentage move.

Example structure:

- headline;
- one-sentence explanation;
- affected company/sector;
- qualitative context where justified.

Avoid countdowns that imply a guaranteed future movement.

### Market Pulse

Market Pulse is forward-looking but intentionally approximate. It summarizes the current balance of forces rather than predicting an exact outcome.

Examples:

- `Short-term pressure: Slightly upward`
- `Positive launch news is attracting buyers, but recent momentum remains weak.`

For stocks, the initial target should be a calm, strategic horizon of roughly **the next minute**, not a stressful 10-second timer. The exact production timing should be tuned through playtesting rather than treated as a fixed promise.

For crypto, the same concept can operate on a much shorter horizon because crypto is intentionally faster, noisier, and more stressful than stocks.

Do not expose exact expected-return percentages to beginners. The goal is to support judgment, not reveal the simulation formula.

### Why It Moved

`Why It Moved` is backward-looking. It should summarize a **rolling recent period** rather than trying to attach a perfect explanation to every individual tick.

Example:

- Strong preorder news ↑
- Mobility sector strength ↑
- Selling pressure ↓
- Overall recent effect: moderately positive

The explanation should reflect the strongest actual contributors from the simulation, not fabricated flavor text.

### Beginner risk/readability

Early players should get simple decision support before advanced metrics are exposed. A future asset view can communicate ideas such as:

- qualitative risk level;
- current short-term outlook;
- a few plain-language reasons;
- current price/chart;
- one clear trade path.

Later progression can reveal deeper volatility, momentum, sentiment, company strength, sector conditions, event history, and investor activity inside the same familiar asset screen.

### Optional prediction-learning interaction

A future non-wager learning interaction may let the player make a simple short-horizon prediction such as **Rise / Roughly Flat / Fall**, then later compare that prediction with what happened and explain why.

This is educational/gameplay feedback only. It must not require staking currency, gambling, or provide a guaranteed trading signal.

## Design principle

The desired feeling is:

> **Information arrives early enough to think, but never early enough to make the outcome certain.**

Stocks should generally reward calm interpretation and give the player room to think. Crypto can legitimately be faster, noisier, and more stressful.
