import type { MovementContribution, MovementReason } from "../../shared/src/index.js";

const MIN_REASON_WEIGHT = 0.00005;
const MAX_REASONS = 3;
const INFORMATION_CODES = new Set<MovementContribution["code"]>(["news", "relationship"]);
const FOLLOW_THROUGH_CODES = new Set<MovementContribution["code"]>(["demand", "momentum"]);
const CODE_PRIORITY: Readonly<Record<MovementContribution["code"], number>> = {
  relationship: 0,
  news: 1,
  sector: 2,
  sentiment: 3,
  demand: 4,
  momentum: 5,
  company: 6,
  noise: 7
};

function sameDirection(left: MovementContribution, right: MovementContribution): boolean {
  return Math.sign(left.value) === Math.sign(right.value);
}

function isDuplicatedFollowThrough(
  contribution: MovementContribution,
  allContributions: MovementContribution[]
): boolean {
  if (!FOLLOW_THROUGH_CODES.has(contribution.code)) return false;
  return allContributions.some((candidate) => (
    INFORMATION_CODES.has(candidate.code)
    && sameDirection(candidate, contribution)
    && Math.abs(candidate.value) >= Math.abs(contribution.value) * 0.5
  ));
}

export function explainMovement(contributions: MovementContribution[]): MovementReason[] {
  const meaningful = contributions
    .filter((item) => Math.abs(item.value) >= MIN_REASON_WEIGHT)
    .filter((item, _index, items) => !isDuplicatedFollowThrough(item, items));

  return meaningful
    .sort((a, b) => (
      Math.abs(b.value) - Math.abs(a.value)
      || CODE_PRIORITY[a.code] - CODE_PRIORITY[b.code]
      || a.code.localeCompare(b.code)
    ))
    .slice(0, MAX_REASONS)
    .map((item) => ({
      code: item.code,
      label: item.label,
      direction: item.value >= 0 ? "up" : "down",
      weight: Math.abs(item.value),
      summary: item.value >= 0 ? item.summaryUp : item.summaryDown
    }));
}
