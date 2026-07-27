# Quickstart

> [日本語](/libraries/foundation/ui/quickstart)

In this tutorial, you render a React counter in interaction mode and verify its state after a button click.

## Install

```bash
pnpm add -D @kiwa-lab/ui @kiwa-lab/core \
  @testing-library/react @testing-library/user-event jsdom \
  react react-dom vitest
```

Run Vitest in a JSDOM environment.

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "jsdom" } });
```

## Write a test

```tsx
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { setupComponentEnv, type UiTestEnv } from "@kiwa-lab/ui";

const envs: UiTestEnv[] = [];
afterEach(async () => { while (envs.length) await envs.pop()?.stop(); });

function Counter(): JSX.Element {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)} data-testid="count">{count}</button>;
}

it("increments the count", async () => {
  const env = await setupComponentEnv({ mode: "interaction", ui: <Counter /> });
  envs.push(env);
  if (env.kind !== "interaction") throw new Error("expected interaction env");

  await env.user.click(env.screen.getByTestId("count"));
  expect(env.screen.getByTestId("count").textContent).toBe("1");
});
```

`env.stop()` unmounts the rendered tree and calls Testing Library cleanup. Register it in `afterEach` so that a previous test does not leave DOM behind.

## Continue

Use render mode when you need only the initial render, and snapshot mode when you want to compare an HTML string. For details, see [Choose a mode](./guides/choose-a-mode) and the [API Reference](./reference).
