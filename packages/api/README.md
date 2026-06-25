# @kiwa-test/api

HTTP API test adapter for kiwa — Vitest + msw + supertest under a single `setupApiServer` helper.

## Overview

`@kiwa-test/api` is the Layer 2 adapter that turns a Layer 1 kiwa-design spec (with `mode = mock | live | hybrid`) into a runnable Vitest suite. It works with any Node-runnable HTTP framework:

- Next.js App Router (Route Handler — `fetch handler` shape)
- Express / Fastify / NestJS (Node `(req, res) =>` shape)
- Bun / Deno HTTP handlers
- Plain `(req: Request) => Response` functions

## Install

```bash
pnpm add -D @kiwa-test/api @kiwa-test/spec msw supertest vitest
```

`msw` and `supertest` are declared as **optional peer dependencies** — install only what your specs need.

## Three modes

```ts
import { setupApiServer } from "@kiwa-test/api";

// 1) mock mode — msw handlers return canned responses, no real server.
const mockEnv = await setupApiServer({
  mode: "mock",
  mockHandlers: [/* msw v2 RequestHandler[] */],
});

// 2) live mode — spin up the real app on a free port.
const liveEnv = await setupApiServer({
  mode: "live",
  app: myFetchHandler, // (req: Request) => Response
});

// 3) hybrid mode — run live + keep msw available for selective overrides.
const hybridEnv = await setupApiServer({
  mode: "hybrid",
  app: myFetchHandler,
  mockHandlers: [],
});

await mockEnv.stop();
```

Every env exposes the same `request` client and unified response snapshot:

```ts
const res = await env.request.post("/api/items", { name: "first" });
res.status;            // 201
res.headers["content-type"]; // "application/json"
res.json<Item>();      // typed body
res.bodyText;          // raw text
```

## Example: Next.js Route Handler PoC

See [`examples/nextjs-api-poc/`](../../examples/nextjs-api-poc) for the end-to-end Route Handler PoC: the Layer 1 spec (`tests/spec/integration/test-spec-items.api.md`) lists 9 cases (`live` / `mock` / `hybrid`) and the Vitest suite executes all of them against a single fetch handler.

## License

MIT
