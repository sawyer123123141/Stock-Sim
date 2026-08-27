import type { MovementContribution, MovementReason } from "../../shared/src/index.js";

const MIN_REASON_WEIGHT = 0.00005;
const MAX_REASONS = 3;

export function explainMovement(contributions: MovementContribution[]): MovementReason[] {
  return contributions
    .filter((item) => Math.abs(item.value) >= MIN_REASON_WEIGHT)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, MAX_REASONS)
    .map((item) => ({
      code: item.code,
      label: item.label,
      direction: item.value >= 0 ? "up" : "down",
      weight: Math.abs(item.value),
      summary: item.value >= 0 ? item.summaryUp : item.summaryDown
    }));
}
