import type { TradeFill, TradeSide } from "../../../packages/shared/src/index";

export interface TradeTicketFormState {
  side: TradeSide;
  quantityText: string;
}

export type SellQuickFillShortcut = 25 | 50 | 75 | "all";

export function sellQuickFillQuantity(
  ownedQuantity: number,
  shortcut: SellQuickFillShortcut
): number | null {
  if (!Number.isSafeInteger(ownedQuantity) || ownedQuantity < 1) return null;
  if (shortcut === "all") return ownedQuantity;

  const quantity = Math.floor(ownedQuantity * shortcut / 100);
  return quantity >= 1 ? quantity : null;
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
