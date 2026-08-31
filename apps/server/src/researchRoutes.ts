import type { FastifyInstance } from "fastify";
import type { ResearchFocusIntent } from "../../../packages/shared/src/index.js";
import { ResearchError, type ResearchService } from "./researchService.js";

export interface ResearchRouteOptions {
  research: ResearchService;
  playerId: string;
}

export function registerResearchRoutes(app: FastifyInstance, options: ResearchRouteOptions): void {
  app.get("/api/research", async () => options.research.getResearch(options.playerId));

  app.post("/api/research/focus", async (request, reply) => {
    try {
      return await options.research.setFocus(options.playerId, request.body as ResearchFocusIntent);
    } catch (error) {
      if (!(error instanceof ResearchError)) throw error;
      const statusCode = error.code === "RESEARCH_ASSET_NOT_FOUND"
        ? 404
        : error.code === "RESEARCH_LOCKED"
          ? 409
          : 400;
      return reply.code(statusCode).send({ error: error.code, message: error.message });
    }
  });
}
