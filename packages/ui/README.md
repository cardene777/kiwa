# @kiwa-test/ui

React component test adapter for kiwa — Vitest + Testing Library + JSDOM under a single `setupComponentEnv` helper.

## Overview

`@kiwa-test/ui` is the Layer 2 adapter that turns a Layer 1 kiwa-design spec (with `mode = render | interaction | snapshot`) into a runnable Vitest suite. It is React-first today but the surface is small enough to extend to Vue / Svelte in future versions.

## Install

```bash
pnpm add -D @kiwa-test/ui @kiwa-test/spec \
  @testing-library/react @testing-library/user-event jsdom \
  react react-dom vitest
```

`@testing-library/react`, `@testing-library/user-event`, and `jsdom` are declared as **optional peer dependencies** — install only what your specs need.

## Three modes

```tsx
import { setupComponentEnv } from "@kiwa-test/ui";

// 1) render mode — mount + screen queries, no interaction.
const renderEnv = await setupComponentEnv({ mode: "render", ui: <Counter /> });

// 2) interaction mode — userEvent-driven workflow tests.
const interactionEnv = await setupComponentEnv({
  mode: "interaction",
  ui: <Counter />,
});
await interactionEnv.user.click(interactionEnv.screen.getByRole("button", { name: "increment" }));

// 3) snapshot mode — capture serialized markup for regression diffs.
const snapshotEnv = await setupComponentEnv({ mode: "snapshot", ui: <Counter /> });
expect(snapshotEnv.markup).toContain("data-testid=\"value\"");

await renderEnv.stop(); // unmount + cleanup
```

Every env exposes `result` (RTL `RenderResult`) and either `screen` (render / interaction) or `markup` (snapshot). The discriminator is `env.kind`.

## Vitest config

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "jsdom" } });
```

## Example: Counter PoC

See [`examples/react-component-poc/`](../../examples/react-component-poc) for the end-to-end PoC: the Layer 1 spec (`tests/spec/integration/test-spec-counter.ui.md`) lists 7 cases (`render` / `interaction` / `snapshot`) and the Vitest suite executes all of them against a single Counter component.

## License

MIT
