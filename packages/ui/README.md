# @kiwa-test/ui

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Web component test surface across 8 frameworks)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package powers the Web component test surface shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

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
| Qwik (resumable) | `setupQwikComponentEnv` | `@noma.to/qwik-testing-library` |
| Angular | `setupAngularComponentEnv` | `@testing-library/angular` |
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

## Qwik quickstart

Qwik requires `@builder.io/qwik/optimizer`'s Vite plugin for its JSX transform, which collides with the React JSX pipeline used by the rest of this package. The expected setup in a downstream Qwik consumer is therefore a Qwik-specific Vitest project that registers the optimizer plugin:

```ts
// qwik consumer's vitest.config.ts
import { defineConfig } from "vitest/config";
import { qwikVite } from "@builder.io/qwik/optimizer";

export default defineConfig({
  plugins: [qwikVite()],
  test: { environment: "jsdom" },
});
```

Then exercise components with the kiwa adapter:

```ts
import { component$ } from "@builder.io/qwik";
import { setupQwikComponentEnv } from "@kiwa-test/ui";

const Counter = component$(() => <span data-testid="value">0</span>);

const env = await setupQwikComponentEnv({ mode: "render", component: <Counter /> });
expect(env.result.getByTestId("value").textContent).toBe("0");
await env.stop();
```

This package's own test suite ships a contract test (`tests/qwik.test.ts`) that asserts the adapter's missing-peer error message — full Qwik JSX rendering will land in a dedicated example project (`examples/qwik-component-poc`) in a follow-up PR.

## Angular quickstart

Angular requires a TestBed-aware Vitest setup file (zone.js + platformBrowserDynamic). Add to a downstream Angular consumer:

```ts
// vitest.setup.ts
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
});
```

Then exercise standalone components with the kiwa adapter:

```ts
import { Component } from "@angular/core";
import { setupAngularComponentEnv } from "@kiwa-test/ui";

@Component({
  standalone: true,
  selector: "kiwa-counter",
  template: `<span data-testid="value">{{ count }}</span>`,
})
class KiwaCounter {
  count = 0;
}

const env = await setupAngularComponentEnv({ mode: "render", component: KiwaCounter });
expect(env.result.getByTestId("value").textContent?.trim()).toBe("0");
await env.stop();
```

As with the Qwik adapter, this package ships a contract test (`tests/angular.test.ts`) that verifies the missing-peer error message. Fully-rendered Angular tests are scoped to a follow-up `examples/angular-component-poc` PR.

## License

MIT
