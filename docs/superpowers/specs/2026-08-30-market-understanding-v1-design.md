# Market Understanding V1 Design

## Goal

Make the existing selected-asset overview easier to read without adding market mechanics or more default-screen information. The overview answers price, movement, current market state, one current explanation, current public information, ownership, and trade intent; deeper company, research, and story information remains in its existing tabs.

## Current-state decisions

`MarketReadSnapshot` already contains only server-classified `pressure` and `movement` states, and the existing Market Read renders two non-predictive sentences. It remains unchanged apart from regression coverage. The header already contains the compact Next Objective chip, so it remains separate from market information.

The existing chart already uses canonical timestamps and public-only focusable markers. Its marker detail will add the public update summary and an explicit related-company label when applicable; it will not reveal plans, outcomes, effects, or private state.

## Why the Move

The collapsed control shows the single strongest public movement reason and a clear “More context” affordance. Expanded state exposes at most three qualitative public reasons. It remains one accessible button with `aria-expanded` and `aria-controls`; click, touch, Enter, and Space use the browser’s normal button behavior.

The server-owned reason pipeline compresses explanation overlap before public projection. A currently meaningful direct-information reason (`news` or `relationship`) suppresses same-direction follow-through reasons (`demand` and `momentum`), because those are often the market mechanics of the same public information. Distinct information reasons remain distinct, and an opposite-direction demand or momentum reason remains visible so mixed causes are not hidden. Sector and sentiment remain separate context. Sorting stays deterministic: absolute contribution, then a fixed public code priority, then code.

Relationship explanations remain qualitative, using the existing related-company name and no coefficients, expected outcomes, relationship strengths, reaction effects, or hidden outcomes. Crypto has no relationship contribution and therefore receives no company-only explanation.

## Boundaries

No simulation timing, event/story values, relationship mappings, expectation updates, investor weights, trade behavior, or API fields change. Browser components render only `AssetSnapshot.reasons`, `MarketReadSnapshot`, and public story updates. Movement compression happens in the deterministic simulation explanation projection, never from browser-inferred prices or hidden inputs.

## Verification

Tests cover qualitative Market Read/public isolation, compact and expanded movement UI, deterministic overlap compression, opposing-cause preservation, safe relationship wording, story/marker public detail, objective separation, crypto compatibility, and stable public ordering. Manual browser checks cover desktop and a 390px viewport, keyboard and touch expansion, marker focus/tap, and absence of horizontal overflow or console errors.
