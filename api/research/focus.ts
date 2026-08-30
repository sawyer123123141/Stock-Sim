import type { IncomingMessage, ServerResponse } from "node:http";
import type { ResearchFocusIntent } from "../../packages/shared/src/index.js";
import { ResearchError } from "../../apps/server/src/researchService.js";
import { hostedAuthority } from "../_authority.js";

async function readBody(request: IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of request) raw += String(chunk);
  return JSON.parse(raw);
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "POST") { response.statusCode = 405; response.end(); return; }
  response.setHeader("content-type", "application/json");
  try {
    response.end(JSON.stringify(await hostedAuthority().setResearchFocus(await readBody(request) as ResearchFocusIntent)));
  } catch (error) {
    if (!(error instanceof ResearchError)) throw error;
    response.statusCode = error.code === "RESEARCH_ASSET_NOT_FOUND"
      ? 404
      : error.code === "RESEARCH_LOCKED"
        ? 409
        : 400;
    response.end(JSON.stringify({ error: error.code, message: error.message }));
  }
}
