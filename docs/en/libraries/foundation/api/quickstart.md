# Quickstart

> [日本語](/libraries/foundation/api/quickstart)

In this tutorial, you start a Fetch API-style items handler in live mode and verify `POST` and `GET` requests.

## Install

```bash
pnpm add -D @kiwa-lab/api @kiwa-lab/core msw supertest vitest
```

`msw` and `supertest` are optional peer dependencies. For this minimal live-mode example, choose the dependencies required by the project that implements the handler.

## Write a test

```ts
import { afterEach, expect, it } from "vitest";
import { setupApiServer, type ApiTestEnv } from "@kiwa-lab/api";

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) await envs.pop()?.stop();
});

it("creates and retrieves an item", async () => {
  const items: { id: number; name: string }[] = [];
  const env = await setupApiServer({
    mode: "live",
    app: {
      kind: "fetch",
      handler: async (request) => {
        const url = new URL(request.url);
        if (url.pathname === "/api/items" && request.method === "POST") {
          const body = (await request.json()) as { name?: string };
          if (!body.name) return new Response("name required", { status: 400 });
          const item = { id: items.length + 1, name: body.name };
          items.push(item);
          return Response.json(item, { status: 201 });
        }
        if (url.pathname === "/api/items" && request.method === "GET") {
          return Response.json(items);
        }
        return new Response("not found", { status: 404 });
      },
    },
  });
  envs.push(env);

  expect((await env.request.post("/api/items", { name: "kiwa" })).status).toBe(201);
  expect((await env.request.get("/api/items")).json()).toEqual([{ id: 1, name: "kiwa" }]);
});
```

`env.stop()` stops the local HTTP server. Always call it from `afterEach`, as in this example, so that tests do not share ports or handler state.

## Continue

To fix external HTTP responses, see [choosing a mode](./guides/choose-a-mode). For the list of methods and types, see the [API Reference](./reference).
