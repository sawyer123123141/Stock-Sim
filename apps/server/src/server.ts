import type { FastifyInstance, FastifyListenOptions } from "fastify";
import { buildMarketApp } from "./app.js";
import { createMarketRuntime, type MarketRuntime } from "./marketRuntime.js";

export interface MarketServerOptions {
  runtime?: MarketRuntime;
}

export interface MarketServer {
  app: FastifyInstance;
  runtime: MarketRuntime;
  listen(options: FastifyListenOptions): Promise<string>;
  close(): Promise<void>;
}

export function createMarketServer(options: MarketServerOptions = {}): MarketServer {
  const runtime = options.runtime ?? createMarketRuntime();
  const app = buildMarketApp({ runtime });
  let runtimeStarted = false;

  async function listen(listenOptions: FastifyListenOptions): Promise<string> {
    if (!runtimeStarted) {
      runtime.start();
      runtimeStarted = true;
    }

    try {
      return await app.listen(listenOptions);
    } catch (error) {
      runtime.stop();
      runtimeStarted = false;
      throw error;
    }
  }

  async function close(): Promise<void> {
    if (runtimeStarted) {
      runtime.stop();
      runtimeStarted = false;
    }
    await app.close();
  }

  return { app, runtime, listen, close };
}
