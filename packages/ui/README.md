# @kiwa-test/ui

Multi-framework component test adapter for kiwa — Vitest + Testing Library + JSDOM under a single `setupComponentEnv` family of helpers.

## Overview

`@kiwa-test/ui` is the Layer 2 adapter that turns a Layer 1 kiwa-design spec (with `mode = render | interaction | snapshot`) into a runnable Vitest suite. It ships **five** component adapters that share the same lifecycle contract.

| Framework | Helper | Underlying lib |
|---|---|---|
| React | `setupComponentEnv` | `@testing-library/react` |
| Vue 3 | `setupVueComponentEnv` | `@vue/test-utils` |
| Svelte | `setupSvelteComponentEnv` | `@testing-library/svelte` |
| SolidJS | `setupSolidComponentEnv` | `@solidjs/testing-library` |
| Lit (Web Components) | `setupLitComponentEnv` | `@open-wc/testing-helpers` |
| Browser (real Chromium) | `setupBrowserComponentEnv` | `@playwright/test` |

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

## SolidJS quickstart

```ts
import { createSignal, createComponent } from "solid-js";
import { setupSolidComponentEnv } from "@kiwa-test/ui";

function SolidCounter(props: { initial?: number }) {
  const [count, setCount] = createSignal(props.initial ?? 0);
  // ...build DOM or use JSX with a Solid-aware transform...
}

const env = await setupSolidComponentEnv({
  mode: "render",
  component: () => createComponent(SolidCounter, { initial: 3 }),
});

expect(env.result.getByTestId("value").textContent).toBe("3");
await env.stop();
```

Make sure Vitest resolves the **browser** entry of `solid-js/web` when running under jsdom:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { conditions: ["browser", "development", "module", "import", "default"] },
  test: { environment: "jsdom" },
});
```

## Lit (Web Components) quickstart

```ts
import { LitElement, html } from "lit";
import { setupLitComponentEnv } from "@kiwa-test/ui";

class KiwaCounter extends LitElement {
  static properties = { count: { state: true } };
  declare count: number;
  constructor() { super(); this.count = 0; }
  render() {
    return html`<span data-testid="value">${this.count}</span>`;
  }
}
customElements.define("kiwa-counter", KiwaCounter);

const env = await setupLitComponentEnv({
  mode: "render",
  template: html`<kiwa-counter></kiwa-counter>`,
});

const span = env.handle.shadowQuerySelector('[data-testid="value"]');
expect(span?.textContent).toBe("0");
await env.stop();
```

The Lit adapter relays the shadow DOM through `handle.shadowQuerySelector` for ergonomic deep queries, and exposes the upgraded element via `handle.element` (typed as `HTMLElement`; cast to `LitElement` when you need `updateComplete`).

## License

MIT
