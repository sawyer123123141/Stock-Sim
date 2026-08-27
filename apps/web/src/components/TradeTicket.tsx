import { useMemo, useState } from "react";
import type { AssetSnapshot, TradeSide } from "../../../../packages/shared/src/index";
import { formatMoney } from "../format";

export interface TradeTicketProps {
  asset: AssetSnapshot;
  cash: number;
  ownedQuantity: number;
  pending: boolean;
  error: string | null;
  onTrade(side: TradeSide, quantity: number): Promise<unknown>;
}

export function TradeTicket({
  asset,
  cash,
  ownedQuantity,
  pending,
  error,
  onTrade
}: TradeTicketProps) {
  const [side, setSide] = useState<TradeSide>("buy");
  const [quantityText, setQuantityText] = useState("1");

  const quantity = Number(quantityText);
  const quantityIsValid = Number.isSafeInteger(quantity) && quantity >= 1;
  const estimatedTotal = quantityIsValid ? asset.price * quantity : 0;

  const blockedReason = useMemo(() => {
    if (!quantityIsValid) return "Enter a whole number of at least 1.";
    if (side === "buy" && estimatedTotal > cash) return "That estimate is above your available cash.";
    if (side === "sell" && quantity > ownedQuantity) return "You do not own that many units.";
    return null;
  }, [cash, estimatedTotal, ownedQuantity, quantity, quantityIsValid, side]);

  const submit = async () => {
    if (blockedReason || pending || !quantityIsValid) return;
    await onTrade(side, quantity);
  };

  return (
    <section className="trade-ticket panel-card" aria-labelledby="trade-title">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">TRADE</span>
          <h2 id="trade-title">{asset.symbol}</h2>
        </div>
        <span className="current-quote">{formatMoney(asset.price)}</span>
      </div>

      <div className="trade-side-switch" aria-label="Trade direction">
        <button
          type="button"
          className={side === "buy" ? "is-active" : ""}
          aria-pressed={side === "buy"}
          onClick={() => setSide("buy")}
        >Buy</button>
        <button
          type="button"
          className={side === "sell" ? "is-active" : ""}
          aria-pressed={side === "sell"}
          onClick={() => setSide("sell")}
        >Sell</button>
      </div>

      <label className="quantity-field">
        <span>Quantity</span>
        <input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={quantityText}
          onChange={(event) => setQuantityText(event.target.value)}
          aria-describedby="quantity-help"
        />
      </label>

      <div className="trade-summary">
        <div><span>Estimated total</span><strong>{formatMoney(estimatedTotal)}</strong></div>
        <div><span>Cash available</span><strong>{formatMoney(cash)}</strong></div>
        <div><span>Owned</span><strong>{ownedQuantity}</strong></div>
      </div>

      <p id="quantity-help" className="execution-note">
        Estimate uses the price on screen. The live server sets the final execution price.
      </p>

      {blockedReason && <p className="trade-warning">{blockedReason}</p>}
      {error && <p className="trade-error" role="alert">{error}</p>}

      <button
        type="button"
        className={`confirm-trade ${side === "sell" ? "is-sell" : ""}`}
        disabled={Boolean(blockedReason) || pending}
        onClick={() => void submit()}
      >
        {pending ? "Submitting…" : <>Confirm {side === "buy" ? "Buy" : "Sell"}</>}
      </button>
    </section>
  );
}
