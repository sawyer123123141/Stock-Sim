import type { AssetState, MarketState } from "../../shared/src/index.js";

function asset(input: Omit<AssetState, "changePct" | "reasons">): AssetState {
  return { ...input, changePct: 0, reasons: [] };
}

export function createSeedMarket(): MarketState {
  return {
    sequence: 0,
    activeEvents: [],
    assets: [
      asset({ id: "nova", symbol: "NOVA", name: "Nova Motors", kind: "stock", sector: "Mobility", price: 42.18, baselineVolatility: 0.28, sentiment: 0.25, momentum: 0.05, sectorTrend: 0.12, companyStrength: 0.45 }),
      asset({ id: "luma", symbol: "LUMA", name: "Luma Labs", kind: "stock", sector: "Technology", price: 78.4, baselineVolatility: 0.36, sentiment: 0.08, momentum: -0.04, sectorTrend: 0.22, companyStrength: 0.62 }),
      asset({ id: "hgrid", symbol: "HGRD", name: "Harvest Grid", kind: "stock", sector: "Energy", price: 31.75, baselineVolatility: 0.22, sentiment: -0.12, momentum: -0.08, sectorTrend: -0.05, companyStrength: 0.3 }),
      asset({ id: "pulse", symbol: "PULSE", name: "Pulse Coin", kind: "crypto", sector: "Crypto", price: 2.84, baselineVolatility: 0.82, sentiment: 0.32, momentum: 0.2, sectorTrend: 0.1 }),
      asset({ id: "orbit", symbol: "ORBIT", name: "Orbit Coin", kind: "crypto", sector: "Crypto", price: 14.2, baselineVolatility: 0.68, sentiment: -0.05, momentum: 0.12, sectorTrend: 0.1 }),
      asset({ id: "moss", symbol: "MOSS", name: "Moss Coin", kind: "crypto", sector: "Crypto", price: 0.47, baselineVolatility: 0.95, sentiment: 0.04, momentum: -0.16, sectorTrend: 0.1 })
    ]
  };
}
