# Market Network V1 Design

## Goal

Make the small fictional stock market feel economically connected without adding a second pricing system. Published information from one company can create a conservative, explainable expectation and short-lived market reaction for a directly connected company. The existing stock-event, investor, expectation-repricing, and canonical-tick machinery remains authoritative.

## Scope

This slice adds static directional stock relationships, public-safe relationship projections, one-hop publication consequences, and connected-story context in the existing Company, Research, Stories, chart-marker, and movement-explanation surfaces. It does not change primary event catalog outcomes, stock or crypto tuning, trade execution, persistence architecture, or the browser authority boundary.

The screen job remains unchanged: help a player understand and trade one selected asset. Relationship information appears as compact context only after the player opens Company, Research, or Stories.

## Relationship model

The server owns a small static `CompanyRelationship` catalog:

```ts
type CompanyRelationshipKind = "supplier" | "customer" | "competitor" | "partner";
type RelationshipInfluence = "limited" | "meaningful" | "important";

interface CompanyRelationship {
  id: string;
  fromAssetId: string;
  toAssetId: string;
  kind: CompanyRelationshipKind;
  influence: RelationshipInfluence;
}
```

Each record means that public information about `fromAssetId` may matter to `toAssetId`. Records are deliberately directional; the inverse is never inferred. The initial network has two individually authored directions:

* `luma -> nova`, supplier, meaningful: public LUMA technology/execution information can affect NOVA execution or growth expectations.
* `nova -> luma`, customer, meaningful: public NOVA demand/growth information can affect LUMA demand or growth expectations.

Harvest Grid has no forced direct relationship in V1. The model supports supplier, customer, competitor, and partner relationships; synthetic tests exercise the latter two without inventing an implausible production-company pair.

## Publication-only, one-hop consequences

Only a story update that has reached its canonical `publishedAt` can enter the relationship layer. Pending story plans, future outcomes, hidden fundamentals, hidden expectations, and RNG are never considered. At publication, the canonical runtime performs:

1. materialize the primary public update and its ordinary primary event, including the dimension-level comparison with then-current market expectations;
2. apply primary consequences exactly once;
3. find relationships sourced by the primary target asset, ordered by target asset ID, kind, then relationship ID;
4. calculate each direct target spillover from the published dimension-level surprise, not the absolute outcome value;
5. apply only target market-expectation deltas and, when nonzero, append a bounded relationship reaction event;
6. record the resulting public target marker on the published update;
7. proceed with subsequent scheduled publication and the ordinary market tick.

Relationship reaction events are never fed back into this publication handler. A primary update can cross one relationship edge only; secondary effects neither recurse nor create fresh company fundamentals. Prices remain the result of the existing investor-pressure, event-effect, repricing, and tick paths.

## Sparse mappings and conservative scale

The relationship interpreter maps only published dimensions with both an actual result and a directly comparable market expectation. A dimension contributes according to `(actual - expected) / 2`, matching the existing stock-event surprise semantics. This matters because a positive absolute result can still be disappointing when the market expected more. Dimensions without a direct expectation analogue are ignored by V1 relationship spillovers rather than being treated as inherently positive or negative.

| Source relationship | Published surprise | Target expectation | Direction |
| --- | --- | --- | --- |
| supplier | execution | execution | same |
| supplier | growth | growth | same, reduced |
| customer | demand | demand | same |
| customer | growth | growth | same, reduced |
| competitor | demand, growth | demand | opposite, reduced |
| partner | execution | execution | same, reduced |
| partner | growth | growth | same, reduced |

The internal influence classes translate to conservative bounded coefficients: limited `0.08`, meaningful `0.14`, important `0.20`. A spillover combines only applicable mapped surprises, clamps its expectation deltas to the existing normalized range, and caps its temporary reaction below a direct event's normal compatibility reaction. The temporary reaction uses the existing event timing and decays through the existing event helpers; it is an influence signal, not a target price or a percentage-return tier.

For example, a LUMA scaling update can report positive absolute growth or execution values yet still weaken NOVA expectations if those results miss LUMA's then-current market expectations. Conversely, a public NOVA demand beat may improve LUMA demand expectations. NOVA or LUMA fundamentals never change because of the connected-company spillover itself.

## Exactly-once and recovery

The persisted `appliedInformationIds` set is generalized to contain both primary event IDs and deterministic relationship IDs:

```text
relationship:<source-update-id>:<relationship-id>:<target-asset-id>
```

The runtime checks this marker before applying a target consequence and persists the same recovery object already stored by the locked Postgres authority. Legacy recovery arrays remain compatible. Hydration only restores state; it creates no marker, consumes no RNG, advances no market time, and never applies a newly introduced relationship consequence to old published information.

Continuous execution, restart recovery, and dormant catch-up therefore replay the same canonical ordering, state, active reactions, public target markers, prices, expectations, priced expectations, RNG state, and sequence.

## Public contract

The browser receives no raw relationship weights, mappings, deltas, outcome calculations, internal reaction values, markers, hidden state, or future story plans.

Stocks receive a public company relationship projection containing only the other public asset, its player-facing directional role, and a broad importance label. Crypto receives no company relationship projection.

Published story updates may include a public `relatedAssetIds` list only after a real spillover was applied. This safe, historical marker lets the selected asset show a connected company's published update as a related story and a neutral chart marker. Pending updates never project the list.

## Client behavior

* Company shows a compact **Business connections** list with direction-aware wording, such as “LUMA Labs — Battery technology supplier.”
* Research adds **Market connections**, using concise qualitative context rather than coefficients or hidden expectations.
* Story selection ranks direct developing stories above connected developing stories, then sector and global stories. Full history includes only connected-company stories with an actual published spillover for the selected asset.
* Chart markers include a connected-company update only when that exact published update caused a spillover. Markers stay neutral and identify related-company context on focus/hover/tap.
* The relationship reaction is represented by one qualitative **Related company** movement reason rather than duplicate near-identical news/repricing explanations.

## Verification

Tests cover directional supplier/customer/competitor/partner surprise mapping, a real staged LUMA case where positive absolute values miss expectations, sparse dimensions, bounded secondary effects, non-mutation of connected fundamentals, publication-only behavior, exactly-once markers, no recursion, restart and dormant-catch-up equivalence, raw public-boundary isolation, and deterministic LUMA/NOVA traces. Client tests cover Company and Research relationship text, connected-story relevance/ranking, marker eligibility, movement wording, crypto absence, and narrow rendering. Manual checks cover desktop and 390px layouts with no horizontal overflow.
