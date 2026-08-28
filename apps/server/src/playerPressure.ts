import type { TradeSide } from "../../../packages/shared/src/index.js";

const MAX_PLAYER_PRESSURE = 0.5;
const IMPULSE_DECAY_MS = 120_000;
const MAX_IMPULSE = 0.04;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface TradeImpulse {
  value: number;
  recordedAtMs: number;
}

export interface PlayerPressureBook {
  recordTrade(assetId: string, side: TradeSide, quantity: number, recordedAtMs: number): void;
  pressureForAsset(assetId: string, nowMs: number): number;
  recoveryState(): Record<string, TradeImpulse[]>;
}

export function createPlayerPressureBook(initialState: Record<string, TradeImpulse[]> = {}): PlayerPressureBook {
  const impulsesByAsset = new Map<string, TradeImpulse[]>(
    Object.entries(initialState).map(([assetId, impulses]) => [
      assetId,
      impulses.map((impulse) => ({ ...impulse }))
    ])
  );

  function recordTrade(assetId: string, side: TradeSide, quantity: number, recordedAtMs: number): void {
    if (!Number.isFinite(recordedAtMs) || !Number.isSafeInteger(quantity) || quantity <= 0) return;

    const direction = side === "buy" ? 1 : -1;
    const value = direction * MAX_IMPULSE * Math.tanh(quantity / 25);
    const impulses = impulsesByAsset.get(assetId) ?? [];
    impulses.push({ value, recordedAtMs });
    impulsesByAsset.set(assetId, impulses);
  }

  function pressureForAsset(assetId: string, nowMs: number): number {
    const impulses = impulsesByAsset.get(assetId);
    if (!impulses || !Number.isFinite(nowMs)) return 0;

    let pressure = 0;
    const activeImpulses: TradeImpulse[] = [];
    for (const impulse of impulses) {
      const ageMs = Math.max(0, nowMs - impulse.recordedAtMs);
      const decayed = impulse.value * Math.exp(-ageMs / IMPULSE_DECAY_MS);
      if (Math.abs(decayed) >= 0.000001) {
        activeImpulses.push(impulse);
        pressure += decayed;
      }
    }
    if (activeImpulses.length === 0) {
      impulsesByAsset.delete(assetId);
    } else {
      impulsesByAsset.set(assetId, activeImpulses);
    }
    return clamp(pressure, -MAX_PLAYER_PRESSURE, MAX_PLAYER_PRESSURE);
  }

  function recoveryState(): Record<string, TradeImpulse[]> {
    return Object.fromEntries([...impulsesByAsset].map(([assetId, impulses]) => [
      assetId,
      impulses.map((impulse) => ({ ...impulse }))
    ]));
  }

  return { recordTrade, pressureForAsset, recoveryState };
}
