export type RandomSource = () => number;

export interface StatefulRandomSource extends RandomSource {
  state(): number;
}

export function createSeededRng(seed: number): RandomSource {
  return createStatefulSeededRng(seed);
}

export function createStatefulSeededRng(seed: number): StatefulRandomSource {
  let state = seed >>> 0;
  const next = (() => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }) as StatefulRandomSource;
  next.state = () => state >>> 0;
  return next;
}
