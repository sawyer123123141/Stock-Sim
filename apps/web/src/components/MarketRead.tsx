import type { MarketReadSnapshot } from "../../../../packages/shared/src/index";

const pressureCopy: Record<MarketReadSnapshot["pressure"], string> = {
  up: "Buyers have a clear edge",
  "slightly-up": "Buyers have a slight edge",
  balanced: "Buyers and sellers are fairly balanced",
  "slightly-down": "Sellers have a slight edge",
  down: "Selling pressure is building"
};

const movementCopy: Record<MarketReadSnapshot["movement"], string> = {
  calm: "Price movement is fairly calm",
  active: "Price movement is active",
  elevated: "Price movement is elevated"
};

export function MarketRead({ marketRead }: { marketRead: MarketReadSnapshot }) {
  return (
    <section className="market-read" aria-labelledby="market-read-title">
      <span className="section-kicker" id="market-read-title">MARKET READ</span>
      <p>{pressureCopy[marketRead.pressure]}</p>
      <p>{movementCopy[marketRead.movement]}</p>
    </section>
  );
}
