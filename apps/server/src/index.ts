import { createMarketServer } from "./server.js";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "3000");

if (!Number.isInteger(port) || port < 0 || port > 65_535) {
  throw new RangeError(`PORT must be an integer from 0 to 65535; received ${process.env.PORT ?? "3000"}.`);
}

const server = createMarketServer();
const address = await server.listen({ host, port });
console.log(`Market Era server listening at ${address}`);

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await server.close();
}

process.once("SIGINT", () => {
  void shutdown();
});
process.once("SIGTERM", () => {
  void shutdown();
});
