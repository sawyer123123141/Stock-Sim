const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const quantity = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function formatMoney(value: number): string {
  return money.format(Number.isFinite(value) ? value : 0);
}

function percentageRoundsToZero(value: number): boolean {
  return Math.abs(value).toFixed(2) === "0.00";
}

export function marketChangeTone(value: number): "up" | "down" | "neutral" {
  const safe = Number.isFinite(value) ? value : 0;
  if (percentageRoundsToZero(safe)) {
    return "neutral";
  }

  return safe > 0 ? "up" : "down";
}

export function formatSignedPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  if (percentageRoundsToZero(safe)) {
    return "0.00%";
  }

  const sign = safe > 0 ? "+" : "";
  return `${sign}${safe.toFixed(2)}%`;
}

export function formatCompactQuantity(value: number): string {
  return quantity.format(Number.isFinite(value) ? value : 0);
}
