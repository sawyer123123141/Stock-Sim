import type { IncomingMessage, ServerResponse } from "node:http";
import { hostedAuthority } from "./_authority.js";

export default async function handler(_request: IncomingMessage, response: ServerResponse): Promise<void> {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(await hostedAuthority().getResearch()));
}
