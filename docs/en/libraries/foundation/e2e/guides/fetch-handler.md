# Test a Fetch handler

[日本語](/libraries/foundation/e2e/guides/fetch-handler)

For an application that accepts a Fetch API `Request` and returns a `Response`, pass it to `setupE2eEnv` with `app.kind` set to `"fetch"`. The library converts the Node.js HTTP request to the web-standard `Request`, then returns the handler's `Response` as an HTTP response.

## Pass a handler

This example returns a page for `/` and 404 for every other path. When you omit `initialPath`, the first opened path is `/`.

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

it("Fetch アプリの画面を開く", async () => {
  const env = await setupE2eEnv({
    app: {
      kind: "fetch",
      handler: async (request) => {
        const url = new URL(request.url);
        if (url.pathname === "/") {
          return new Response('<h1 data-testid="title">Fetch app</h1>', {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
        return new Response("not found", { status: 404 });
      },
    },
  });
  envs.push(env);

  expect(await env.page.getByTestId("title").textContent()).toBe("Fetch app");
});
```

## Handle requests

In a Fetch handler, use web-standard APIs to get the URL, method, headers, and body. For POST, PUT, and other requests with a body, the adapter reads the body and passes it to `Request`. GET and HEAD receive no body.

```ts
const app = {
  kind: "fetch" as const,
  handler: async (request: Request) => {
    if (request.method === "POST") {
      const payload = await request.text();
      return new Response(`received: ${payload}`, { status: 200 });
    }
    return new Response("method not allowed", { status: 405 });
  },
};
```

In an environment that receives this handler as `app`, you can inspect an HTTP response directly with `fetch(env.baseUrl, { method: "POST", body: "..." })`. When you need browser interaction, use `env.page` from the same environment.

## Behaviour on errors

If a Fetch handler throws, the server returns HTTP 500 and `internal error: <error message>`. When intentionally raising an exception from the application under test, verify either how the browser handles the 500 response or the response from `fetch(env.baseUrl)`.

To open a specific path first, use `initialPath: "/settings"`. `"settings"` without a leading `/` is also treated as `/settings`. A complete `http` URL navigates directly to that URL.

## Read next

- A minimal page-interaction example: [Quickstart](../quickstart)
- An application that uses `IncomingMessage` / `ServerResponse`: [Test a Node.js HTTP handler](./node-handler)
- The complete list of types and options: [API reference](../reference)
