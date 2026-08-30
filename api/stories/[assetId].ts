import type { IncomingMessage, ServerResponse } from "node:http";
import { hostedAuthority } from "../_authority.js";

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "", "http://localhost");
  const assetId = url.pathname.split("/").at(-1);
  if (!assetId) {
    response.statusCode = 400;
    response.end();
    return;
  }
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(await hostedAuthority().getStoryHistory(
    decodeURIComponent(assetId),
    url.searchParams.get("cursor") ?? undefined
  )));
}
