import type { TradeFill, TradeSide } from "../../../packages/shared/src/index";

export interface TradeTicketFormState {
  side: TradeSide;
  quantityText: string;
}

export function finalSaleTicketReset(
  assetId: string,
  lastFill: TradeFill | null,
  ownedQuantity: number
): TradeTicketFormState | null {
  if (
    lastFill?.assetId === assetId
    && lastFill.side === "sell"
    && ownedQuantity === 0
  ) {
    return { side: "buy", quantityText: "1" };
  }

  return null;
}
