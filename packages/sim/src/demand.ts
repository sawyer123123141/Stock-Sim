import type { MarketPressure } from "../../shared/src/index.js";
import { clamp } from "./math.js";

const PLAYER_MAX_CONTRIBUTION = 0.25;

export function calculateDemandPressure(input: MarketPressure): number {
  const simulated = clamp(input.simulated, -1, 1);
  const player = Math.tanh(input.player) * PLAYER_MAX_CONTRIBUTION;
  return clamp(simulated + player, -1, 1);
}
