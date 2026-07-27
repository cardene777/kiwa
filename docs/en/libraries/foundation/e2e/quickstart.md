# Quickstart

[日本語](/libraries/foundation/e2e/quickstart)

In this tutorial, you serve an HTML TODO form from a local server, enter and submit text in Chromium, and verify that an item appears on the page.

## Before you begin

- Node.js 20 or later
- A TypeScript project that uses Vitest
- Playwright's Chromium browser

Install the dependencies and Chromium.

```bash
pnpm add -D @kiwa-lab/e2e @kiwa-lab/core @playwright/test vitest
pnpm exec playwright install chromium
```

When loading Playwright, `@kiwa-lab/e2e` first looks for `@playwright/test`, then tries `playwright`. If neither is available, it reports an error that tells you to add a dependency.

## Write the test

For example, create `todo.e2e.test.ts`. In `afterEach`, always stop every environment created by a test.

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

it("項目を追加できる", async () => {
  const env = await setupE2eEnv({
    staticHtml: `<!doctype html>
      <h1 data-testid="title">Todo</h1>
      <ul id="list"></ul>
      <form id="form">
        <input id="input" name="title" />
        <button type="submit">追加</button>
      </form>
      <script>
        const list = document.getElementById("list");
        const form = document.getElementById("form");
        const input = document.getElementById("input");
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const value = input.value.trim();
          if (!value) return;
          const item = document.createElement("li");
          item.setAttribute("data-testid", "item");
          item.textContent = value;
          list.appendChild(item);
          input.value = "";
        });
      </script>`,
  });
  envs.push(env);

  await env.page.fill("#input", "犬の散歩");
  await env.page.click('button[type="submit"]');

  expect(await env.page.getByTestId("item").textContent()).toBe("犬の散歩");
});
```

## Run it

Run this test file with your project's Vitest command.

```bash
pnpm vitest run todo.e2e.test.ts
```

When the test starts, `setupE2eEnv` starts an HTTP server on an available local port and opens `/` in headless Chromium by default. `env.page` is the handle used to interact with that page.

## Next steps

When testing an application, replace the HTML string with a [Fetch handler](./guides/fetch-handler) or a [Node.js HTTP handler](./guides/node-handler). The complete list of options and page operations is in the [API reference](./reference).
