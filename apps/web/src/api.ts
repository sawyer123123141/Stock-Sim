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

export interface MarketSocket {
  close(): void;
}

export function openMarketSocket(
  onSnapshot: (snapshot: MarketSnapshot) => void,
  onError?: (message: string) => void
): MarketSocket {
  let stopped = false;
  let socket: WebSocket | undefined;
  let retryTimer: number | undefined;
  let retryCount = 0;

  const connect = () => {
    if (stopped) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(`${protocol}//${window.location.host}/ws/market`);

    socket.addEventListener("open", () => {
      retryCount = 0;
    });

    socket.addEventListener("message", (event) => {
      try {
        const snapshot = JSON.parse(String(event.data)) as MarketSnapshot;
        if (snapshot && Array.isArray(snapshot.assets) && typeof snapshot.generatedAt === "string") {
          onSnapshot(snapshot);
        }
      } catch {
        onError?.("Live market sent an unreadable update.");
      }
    });

    socket.addEventListener("close", () => {
      if (stopped) return;
      const delayMs = Math.min(750 * (2 ** retryCount), 5_000);
      retryCount = Math.min(retryCount + 1, 4);
      retryTimer = window.setTimeout(connect, delayMs);
    });

    socket.addEventListener("error", () => {
      onError?.("Live market connection was interrupted. Reconnecting…");
    });
  };

  connect();

  return {
    close() {
      stopped = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      socket?.close();
    }
  };
}
