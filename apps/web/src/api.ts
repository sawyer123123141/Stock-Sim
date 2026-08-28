import type {
  MarketSnapshot,
  PortfolioSnapshot,
  TradeExecutionResponse,
  TradeIntent,
  TradingErrorResponse
} from "../../../packages/shared/src/index";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = `Request failed (${response.status}).`;
  let code: string | undefined;
  try {
    const body = await response.json() as Partial<TradingErrorResponse>;
    if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    if (typeof body.error === "string") code = body.error;
  } catch {
    // Preserve the status-based fallback when the response is not JSON.
  }

  throw new ApiError(message, response.status, code);
}

export function fetchMarket(): Promise<MarketSnapshot> {
  return requestJson<MarketSnapshot>("/api/market");
}

export function fetchPortfolio(): Promise<PortfolioSnapshot> {
  return requestJson<PortfolioSnapshot>("/api/portfolio");
}

export function submitTrade(intent: TradeIntent): Promise<TradeExecutionResponse> {
  const body: TradeIntent = {
    assetId: intent.assetId,
    side: intent.side,
    quantity: intent.quantity
  };

  return requestJson<TradeExecutionResponse>("/api/trades", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

export interface MarketSubscription {
  close(): void;
}

export function openMarketUpdates(
  onSnapshot: (snapshot: MarketSnapshot) => void,
  onError?: (message: string) => void
): MarketSubscription {
  let stopped = false;
  const poll = () => {
    void fetchMarket().then((snapshot) => {
      if (!stopped) onSnapshot(snapshot);
    }).catch(() => {
      if (!stopped) onError?.("Live market update was interrupted. Retrying…");
    });
  };
  poll();
  const interval = window.setInterval(poll, 5_000);

  return {
    close() {
      stopped = true;
      window.clearInterval(interval);
    }
  };
}

// Compatibility name for existing local callers while delivery is polling-based.
export const openMarketSocket = openMarketUpdates;
