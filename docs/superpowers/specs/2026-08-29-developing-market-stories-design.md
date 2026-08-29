# Developing Market Stories Design

## Goal

Turn selected market events into staged, deterministic public stories. Information is released on the authoritative canonical clock, changes the existing event/expectation pipeline only when it becomes public, survives recovery, and appears as a compact relevant story plus neutral chart annotations.

## Scope

This slice adds persistent Market Stories, safe public story snapshots, staged company-story templates, chart markers, and a compact Developing Stories interface. It does not add a story archive, navigation, alerts, research screens, new trading rules, new market authority, generated copy, or additional player-facing simulation data.

## Internal model

`MarketState` gains `stories: MarketStory[]`. A story contains an ID, title, target, `developing | resolved` status, and ordered internal updates. Every update stores its stable ID, title, summary, canonical `publishedAt`, pending/published state, and optionally its pre-authored sparse outcome, significance, and fundamental delta.

Pending updates may retain future truth on the server because the deterministic runtime must recover them, but they have no computed `expectedOutcome`, `surprise`, or `effect`. Those values are created only at publication against the asset expectations that exist at that canonical time. Publishing materializes one ordinary internal `MarketEvent` reaction record so the current effect decay, investor interpretation, movement explanation, and expectation repricing paths remain the only price-reaction system.

Simple events are represented as a story with one immediate update. Selected stock templates use two staged updates: NOVA launch, NOVA supplier review, LUMA battery breakthrough, LUMA timetable revision, and Harvest Grid contract. Sector, global, crypto, and routine templates remain one-update stories. Each staged update reveals a distinct sparse outcome and applies only its own conservative persistent consequences.

## Canonical scheduling and ordering

The runtime is the sole scheduler. It never uses browser timers or wall-clock globals inside simulation code. Its persisted five-second clock invokes the existing runtime recovery path, including dormant catch-up.

For a canonical instant, the runtime performs these operations in order:

1. publish every already-planned due update, ordered by `publishedAt`, then update ID;
2. for each update, snapshot current expectations, calculate surprise/effect, append its reaction event, apply its update consequences, and record its applied information ID exactly once;
3. generate any newly due event/story after those previously pending updates; if the new story has an update due at that instant, publish it through the same path;
4. calculate pressure and perform the ordinary market tick.

This means a follow-up released at the same time as the next generated event changes expectations before that new event snapshots them. It also means direct continuous execution, restart recovery, and persistent dormant catch-up replay the same plans, reactions, RNG state, prices, fundamentals, expectations, priced expectations, sequence, and markers.

## Exactly-once and legacy recovery

Recovery stores `appliedInformationIds`, covering both legacy event consequences and published story updates. Hydration accepts an old `appliedEventIds` array as its initial compatible value and emits the broader marker name going forward. Hydration only normalizes persisted data; it consumes neither RNG nor market time.

Existing active events stay ordinary legacy event reactions. They are never reconstructed as new multi-stage stories and acquire no future headlines. Existing state without `stories` hydrates to an empty story list. The existing public `events` field remains available for compatibility while new UI selects `stories`; legacy events can simply age out through their current path.

## Public boundary

`MarketSnapshot` gains `stories: MarketStorySnapshot[]`. A public story has only ID, title, target, status, and its published updates. A public update has only ID, title, summary, and ISO publication time. The projection filters pending updates before creating the snapshot and excludes future-update counts/times, outcome vectors, expected outcomes, surprise, effects, significance, fundamental changes, fundamentals, expectations, priced expectations, pressure, and RNG state.

## Client presentation

`marketEventSelection.ts` evolves to select the most relevant recent public story: asset target first, matching sector second, global third, then most recently published update. `NewsStory` becomes the compact Developing Stories card. A developing multi-update story renders its public timeline and restrained status; resolved stories use quieter copy; one-update stories retain a compact single-story treatment. The component does not use good/bad, bullish/bearish, buy, or sell labels.

`PriceChart` receives public updates for the selected relevant stories. It renders a small neutral focusable marker only when the update timestamp is inside the actual session sample range. X position is proportional to timestamp, not array index. Hover/focus/tap exposes title and publication time through accessible marker text; no hidden truth or directional coloring is used.

The existing desktop hierarchy remains: chart center, trade ticket right, stories in the market-information strip. Mobile retains the same content without overflow or a permanent text wall.

## Verification

Tests prove deterministic story generation, simple/staged selection, unique ordered IDs, publication timing, surprise-at-publication, same-time ordering, exactly-once application, safe public projection, restart/dormancy equivalence, legacy recovery, story relevance/rendering, marker visibility/range/coordinates/accessibility, and absence of positive/negative recommendation labels. Deterministic traces measure NOVA launch, NOVA supplier review, and LUMA breakthrough at initial publication, before/after follow-up, and later repricing without retuning coefficients to force a reversal.

