export interface StoredPosition {
  quantity: number;
  costBasisCents: number;
}

export interface PortfolioState {
  playerId: string;
  cashCents: number;
  positions: Record<string, StoredPosition>;
}

export interface PortfolioStore {
  read(playerId: string): Promise<PortfolioState>;
  transact<T>(playerId: string, mutation: (working: PortfolioState) => T): Promise<T>;
}

const DEFAULT_STARTING_CASH_CENTS = 1_000_000;

function clonePortfolio(portfolio: PortfolioState): PortfolioState {
  return {
    playerId: portfolio.playerId,
    cashCents: portfolio.cashCents,
    positions: Object.fromEntries(
      Object.entries(portfolio.positions).map(([assetId, position]) => [
        assetId,
        { quantity: position.quantity, costBasisCents: position.costBasisCents }
      ])
    )
  };
}

export class InMemoryPortfolioStore implements PortfolioStore {
  private readonly portfolios = new Map<string, PortfolioState>();
  private readonly queues = new Map<string, Promise<void>>();

  constructor(private readonly startingCashCents = DEFAULT_STARTING_CASH_CENTS) {
    if (!Number.isSafeInteger(startingCashCents) || startingCashCents < 0) {
      throw new RangeError("Starting cash must be a non-negative safe integer number of cents.");
    }
  }

  private getOrCreate(playerId: string): PortfolioState {
    let portfolio = this.portfolios.get(playerId);
    if (!portfolio) {
      portfolio = { playerId, cashCents: this.startingCashCents, positions: {} };
      this.portfolios.set(playerId, portfolio);
    }
    return portfolio;
  }

  async read(playerId: string): Promise<PortfolioState> {
    const pending = this.queues.get(playerId);
    if (pending) await pending;
    return clonePortfolio(this.getOrCreate(playerId));
  }

  async transact<T>(playerId: string, mutation: (working: PortfolioState) => T): Promise<T> {
    const previous = this.queues.get(playerId) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => gate);
    this.queues.set(playerId, queued);

    await previous;
    try {
      const working = clonePortfolio(this.getOrCreate(playerId));
      const result = mutation(working);
      this.portfolios.set(playerId, clonePortfolio(working));
      return result;
    } finally {
      release();
      if (this.queues.get(playerId) === queued) {
        this.queues.delete(playerId);
      }
    }
  }
}
