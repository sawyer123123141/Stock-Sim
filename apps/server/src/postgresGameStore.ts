import postgres from "postgres";
import type { LockedGameStore, PersistedGameState } from "./persistentGameAuthority.js";

const GAME_STATE_ID = "main";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createPostgresGameStore(
  databaseUrl: string,
  initialState: () => PersistedGameState
): LockedGameStore {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for persistent game state.");
  const sql = postgres(databaseUrl, { prepare: false, max: 1 });

  return {
    async transact<T>(mutation: (state: PersistedGameState) => Promise<T>): Promise<T> {
      return await sql.begin(async (tx) => {
        const initial = initialState();
        await tx`
          insert into private.game_state (id, runtime, portfolio, next_trade_id)
          values (${GAME_STATE_ID}, ${tx.json(clone(initial.runtime) as never)}, ${tx.json(clone(initial.portfolio) as never)}, ${initial.nextTradeId})
          on conflict (id) do nothing
        `;
        const [row] = await tx<{ runtime: PersistedGameState["runtime"]; portfolio: PersistedGameState["portfolio"]; next_trade_id: number }[]>`
          select runtime, portfolio, next_trade_id
          from private.game_state where id = ${GAME_STATE_ID} for update
        `;
        if (!row) throw new Error("Canonical game state was not created.");
        const state: PersistedGameState = {
          runtime: clone(row.runtime),
          portfolio: clone(row.portfolio),
          nextTradeId: row.next_trade_id
        };
        const result = await mutation(state);
        await tx`
          update private.game_state
          set runtime = ${tx.json(clone(state.runtime) as never)}, portfolio = ${tx.json(clone(state.portfolio) as never)},
              next_trade_id = ${state.nextTradeId}, updated_at = now()
          where id = ${GAME_STATE_ID}
        `;
        return result;
      }) as T;
    }
  };
}
