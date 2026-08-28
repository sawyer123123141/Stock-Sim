import { createInitialGameState, createPersistentGameAuthority } from "../apps/server/src/persistentGameAuthority.js";
import { createPostgresGameStore } from "../apps/server/src/postgresGameStore.js";

let authority: ReturnType<typeof createPersistentGameAuthority> | undefined;

export function hostedAuthority(): ReturnType<typeof createPersistentGameAuthority> {
  if (!authority) {
    authority = createPersistentGameAuthority(
      createPostgresGameStore(
        process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "",
        () => createInitialGameState(Date.now())
      )
    );
  }
  return authority;
}
