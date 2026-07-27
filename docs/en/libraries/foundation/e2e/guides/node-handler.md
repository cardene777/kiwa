# Test a Node.js HTTP handler

[日本語](/libraries/foundation/e2e/guides/node-handler)

To start an existing Node.js HTTP handler unchanged, pass a function to `app`. The function receives `IncomingMessage` and `ServerResponse`, and can be implemented synchronously or asynchronously.

## Pass an existing handler

This example returns 200 for `/health` and 404 for every other path. `initialPath` opens `/health` while the environment is prepared.

```ts
import { afterEach, expect, it } from "vitest";
import { setupE2eEnv, type E2eTestEnv } from "@kiwa-lab/e2e";

const envs: E2eTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

it("Node.js ハンドラーのレスポンスを表示する", async () => {
  const env = await setupE2eEnv({
    app: (request, response) => {
      if (request.url === "/health") {
        response.statusCode = 200;
        response.setHeader("content-type", "text/html; charset=utf-8");
        response.end('<h1 data-testid="status">ok</h1>');
        return;
      }
      response.statusCode = 404;
      response.end("not found");
    },
    initialPath: "/health",
  });
  envs.push(env);

  expect(await env.page.getByTestId("status").textContent()).toBe("ok");
});
```

To make the form explicit, you can also pass the same function as `app: { kind: "node", handler }`.

## Use an asynchronous handler

A handler can return `Promise<void>`. Finish asynchronous work before calling `response.end()`.

```ts
const handler = async (_request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse) => {
  await Promise.resolve();
  response.statusCode = 202;
  response.end("accepted");
};

const env = await setupE2eEnv({ app: handler });
```

## Verify handler failures

Whether a Node.js handler throws synchronously or its returned Promise rejects, the server returns HTTP 500 and `internal error: <error message>`. To test error handling, inspect the status and body with `fetch` against `env.baseUrl`.

```ts
const env = await setupE2eEnv({
  app: () => {
    throw new Error("database unavailable");
  },
});

const response = await fetch(env.baseUrl);
expect(response.status).toBe(500);
expect(await response.text()).toContain("internal error: database unavailable");
await env.stop();
```

In normal tests, call `env.stop()` in `afterEach`, as in the quickstart, so that every browser and server is released.

## Read next

- An application in Fetch API form: [Test a Fetch handler](./fetch-handler)
- Locators, options, and exported APIs: [API reference](../reference)
