# Story Lifecycle / Market History V1 Design

## Goal

Keep the living market understandable and its normal live payload bounded without deleting useful public company history. The lifecycle separates active private story plans, compact persisted public history, and the small set of stories sent with ordinary market updates.

## Lifecycle and ownership

### Runtime stories

`MarketState.stories` continues to contain the full internal `MarketStory` only while it is needed for deterministic simulation:

- a story has a pending update; or
- a resolved story still has an active primary reaction or relationship reaction sourced from one of its published update IDs.

Those records may contain private planned outcomes and publication-time calculations. They remain server-only.

### Compact persisted history

`MarketState.storyHistory` is an optional, backward-compatible collection of compact public records. A record has only a stable story ID, title, target, and already-published public updates: update ID, title, summary, canonical publication timestamp, and published `relatedAssetIds` when applicable. It cannot contain outcomes, expected outcomes, surprise/effect values, reaction timing, fundamental impacts, private plans, or exact-once markers.

During canonical advancement, after ordinary event expiration has been applied, the runtime atomically moves an eligible resolved story from `stories` to `storyHistory`. A story ID must be in exactly one collection. The compactor never copies a pending update and never changes `appliedInformationIds`.

Eligibility is deterministic: every update is published and no primary event or relationship event sourced from any update remains active. This preserves staged publication, primary/relationship reaction semantics, exact-once consequences, continuous execution, restart recovery, and dormant catch-up equivalence. Legacy states without `storyHistory` hydrate it as an empty collection.

## Public transport boundary

There are three distinct projections:

1. Runtime stories are persisted internally and are never exposed with private fields.
2. Compact history remains in the existing persisted game-state JSON for V1. It is deliberately shaped so it can later move to dedicated history storage without changing the public record meaning.
3. A normal `MarketSnapshot` contains developing stories and a bounded time-based recent resolved set only. It never carries the full archive, so HTTP polling and WebSocket updates cannot grow indefinitely with market age.

The server provides an asset-scoped public history endpoint for the Stories tab. It returns a deterministic page of at most 50 relevant compact/public stories with the final story ID as an opaque continuation cursor when another page exists. Optional `from` and `to` canonical-millisecond query values return only already-public updates overlapping that inclusive time range; a story with no overlapping update is omitted. The same 50-story bound and cursor apply to range queries, so a chart never downloads the full archive. Invalid partial or inverted ranges return an empty page. It exposes no private simulation information and keeps direct, sector, global, and already-public related-company relevance rules consistent with the live projection.

Chart markers continue to receive only the selected asset's relevant public updates. They use live/recent story data in the normal snapshot and request one bounded archive page only when the actual visible session range reaches older than the server-projected recent-story window. Chart requests round the visible bounds outward to one-minute buckets, preventing a new archive request on every five-second market update while never excluding a visible marker. Live and archive updates merge by stable update ID before existing marker relevance/range selection; the live copy wins during a lifecycle-boundary overlap. The full archive is never required by the live market snapshot.

## Public lifecycle classification

Classification is derived at projection time from canonical market time and the latest published update timestamp; it is never persisted as a mutable flag.

- **Developing:** a public story with an unresolved update.
- **Recent:** a resolved story whose latest public update is within `RECENT_STORY_WINDOW_MS` of canonical market time.
- **Archive:** a resolved story older than that window.

`RECENT_STORY_WINDOW_MS` is a named server-owned 30-minute window. At the current roughly two-minute story cadence this provides useful short-term context across several distinct developments, while preventing the main market payload and Overview from turning into a running newspaper. It is a time rule, not a raw-count rule.

The Overview selects developing relevant information first, then at most one relevant recent resolved story. It never renders archive history. The Stories tab groups its fetched relevant records as Developing, Recent, and Archive without duplicating a story between sections. Company-specific stories retain higher relevance than sector/global/related context. Crypto uses the same generic target and lifecycle behavior.

## Ordering and recovery

Compaction runs after the existing canonical tick removes expired events and before persistence snapshots the recovery state. Publishing and relationship spillovers always occur first, in their existing deterministic order. The exact same initial recovery state and canonical time must produce the same runtime/history partition for uninterrupted advancement, restart recovery, and dormant catch-up.

`appliedInformationIds` remains intentionally unbounded technical debt in this slice. It is not pruned, inferred, or reconstructed from history.

## Boundaries

- Do not change event values, volatility, expectations, relationship influence, trading, persistence locking, or canonical tick cadence.
- Do not expose hidden outcomes, expected outcomes, surprise/effect values, raw fundamentals, expectation data, reaction windows, RNG, or marker IDs to browser history.
- Do not add a Supabase history table unless the existing JSON state is proven technically unsafe; this V1 keeps compact records in the existing locked game state.
- Do not implement research progression, specialists, ownership, notifications, or a newspaper-style UI.

## Verification

Tests must cover eligibility and deterministic compaction, private-field stripping, lifecycle classification, bounded normal snapshot transport, archived relevance/timestamps/related metadata, pending-public isolation, restart and dormancy equivalence, crypto compatibility, non-duplication across lifecycle sections, and archive chart-history requests. Run the full test/typecheck/diff/build gates and inspect the deployed preview at desktop and approximately 390px.
