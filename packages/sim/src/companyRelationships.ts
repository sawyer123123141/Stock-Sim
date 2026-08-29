import type {
  AssetState,
  CompanyRelationship,
  CompanyRelationshipImportance,
  CompanyRelationshipSnapshot,
  MarketEvent,
  MarketExpectations,
  MarketState
} from "../../shared/src/index.js";
import { clamp, round } from "./math.js";

export const COMPANY_RELATIONSHIPS: readonly CompanyRelationship[] = [
  {
    id: "luma-nova-supplier",
    fromAssetId: "luma",
    toAssetId: "nova",
    kind: "supplier",
    influence: "meaningful"
  },
  {
    id: "nova-luma-customer",
    fromAssetId: "nova",
    toAssetId: "luma",
    kind: "customer",
    influence: "meaningful"
  }
];

const INFLUENCE_SCALE: Readonly<Record<CompanyRelationshipImportance, number>> = {
  limited: 0.08,
  meaningful: 0.14,
  important: 0.2
};

export interface RelationshipImpact {
  relationship: CompanyRelationship;
  targetAssetId: string;
  expectationDeltas: Partial<MarketExpectations>;
  reactionEffect: number;
}

function normalized(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, -1, 1) : undefined;
}

function addDelta(
  deltas: Partial<MarketExpectations>,
  dimension: keyof MarketExpectations,
  value: number | undefined
): void {
  if (value === undefined || value === 0) return;
  deltas[dimension] = (deltas[dimension] ?? 0) + value;
}

/**
 * Converts one already-public primary event into conservative, sparse target
 * expectations. It cannot inspect pending story information or mutate state.
 */
export function deriveRelationshipImpact(
  event: MarketEvent,
  relationship: CompanyRelationship
): RelationshipImpact | null {
  if (event.target.kind !== "asset" || event.target.value !== relationship.fromAssetId || !event.outcome) return null;
  const scale = INFLUENCE_SCALE[relationship.influence];
  const deltas: Partial<MarketExpectations> = {};

  switch (relationship.kind) {
    case "supplier":
      addDelta(deltas, "execution", mapped(event.outcome.execution, scale));
      addDelta(deltas, "growth", mapped(event.outcome.competitivePosition, scale * 0.56));
      break;
    case "customer":
      addDelta(deltas, "demand", mapped(event.outcome.demand, scale));
      addDelta(deltas, "growth", mapped(event.outcome.growth, scale * 0.56));
      break;
    case "competitor":
      addDelta(deltas, "demand", mapped(event.outcome.competitivePosition, -scale * 0.75));
      addDelta(deltas, "demand", mapped(event.outcome.demand, -scale * 0.7));
      addDelta(deltas, "demand", mapped(event.outcome.growth, -scale * 0.45));
      break;
    case "partner":
      addDelta(deltas, "execution", mapped(event.outcome.execution, scale * 0.8));
      addDelta(deltas, "growth", mapped(event.outcome.growth, scale * 0.56));
      break;
  }

  const total = Object.values(deltas).reduce((sum, value) => sum + (value ?? 0), 0);
  if (total === 0) return null;
  const reactionMagnitude = Math.abs(clamp(event.effect, -1, 1)) * scale * 0.8;
  return {
    relationship,
    targetAssetId: relationship.toAssetId,
    expectationDeltas: Object.fromEntries(Object.entries(deltas).map(([key, value]) => [key, round(clamp(value ?? 0, -1, 1), 6)])),
    reactionEffect: clamp(Math.sign(total) * reactionMagnitude, -0.16, 0.16)
  };
}

function mapped(value: unknown, scale: number): number | undefined {
  const outcome = normalized(value);
  return outcome === undefined ? undefined : outcome * scale;
}

/** Applies only public-belief changes; relationship spillovers never alter company reality. */
export function applyRelationshipExpectationImpact(state: MarketState, impact: RelationshipImpact): MarketState {
  let changed = false;
  const assets = state.assets.map((asset) => {
    if (asset.id !== impact.targetAssetId || asset.kind !== "stock" || !asset.expectations) return asset;
    const expectations = { ...asset.expectations };
    for (const [dimension, delta] of Object.entries(impact.expectationDeltas) as [keyof MarketExpectations, number][]) {
      expectations[dimension] = clamp(expectations[dimension] + delta, -1, 1);
    }
    changed = true;
    return { ...asset, expectations };
  });
  return changed ? { ...state, assets } : state;
}

export function relationshipInformationId(sourceUpdateId: string, relationship: CompanyRelationship): string {
  return `relationship:${sourceUpdateId}:${relationship.id}:${relationship.toAssetId}`;
}

/** Materializes a small ordinary event reaction so the existing tick pipeline remains the price authority. */
export function createRelationshipReactionEvent(source: MarketEvent, impact: RelationshipImpact): MarketEvent {
  return {
    id: relationshipInformationId(source.id, impact.relationship),
    title: source.title,
    summary: source.summary,
    effect: impact.reactionEffect,
    publishedAt: source.publishedAt,
    reactionStartsAt: source.reactionStartsAt,
    expiresAt: source.expiresAt,
    target: { kind: "asset", value: impact.targetAssetId },
    relationship: {
      sourceAssetId: impact.relationship.fromAssetId,
      sourceEventId: source.id,
      kind: impact.relationship.kind
    }
  };
}

/** Converts the static network into direction-aware, non-numeric company context. */
export function companyRelationshipSnapshots(
  asset: AssetState,
  assets: AssetState[],
  relationships: readonly CompanyRelationship[] = COMPANY_RELATIONSHIPS
): CompanyRelationshipSnapshot[] {
  if (asset.kind !== "stock") return [];
  const snapshots = relationships.flatMap((relationship) => {
    const isSource = relationship.fromAssetId === asset.id;
    const isTarget = relationship.toAssetId === asset.id;
    if (!isSource && !isTarget) return [];
    const other = assets.find((candidate) => candidate.id === (isSource ? relationship.toAssetId : relationship.fromAssetId));
    if (!other || other.kind !== "stock") return [];
    return [{
      assetId: other.id,
      name: other.name,
      symbol: other.symbol,
      kind: isSource ? inverseRelationshipKind(relationship.kind) : relationship.kind,
      importance: relationship.influence
    }];
  });
  return snapshots
    .filter((snapshot, index) => snapshots.findIndex((candidate) => candidate.assetId === snapshot.assetId && candidate.kind === snapshot.kind) === index)
    .sort((left, right) => left.name.localeCompare(right.name) || left.kind.localeCompare(right.kind));
}

function inverseRelationshipKind(kind: CompanyRelationship["kind"]): CompanyRelationship["kind"] {
  if (kind === "supplier") return "customer";
  if (kind === "customer") return "supplier";
  return kind;
}
