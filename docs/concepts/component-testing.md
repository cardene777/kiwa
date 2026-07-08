# Component testing — story registration, CT mount, visual diff

kiwa's provider mocks up to v1.15 all lived at the **service boundary** — auth mocks answered `signIn`, AI-LLM mocks answered `messages.create`, realtime mocks pushed events over a virtual timeline, MCP mocks brokered JSON-RPC 2.0 tool calls. Every fidelity axis measured a **network-shaped surface** (request shape / response shape / latency / cost / event ordering).

Component tests break this shape. There is no network call. There is no token cost. The unit under test is a **rendered UI fragment** — a Button component with a click handler, a Form component with validation, a Modal component with an accessible close button. The properties that matter are DOM structure, interaction wiring, and pixel-level visual identity, not request/response semantics. v1.16 is designed to absorb this third axis of non-triviality — the browser.

## What "component test" actually means

Modern SaaS frontend teams converged in 2024-2026 on 3 co-existing test surfaces, all installed simultaneously in a fresh app scaffold and all consumed by roughly the same code paths.

- **Storybook 8** — the canonical component catalog. A `.stories.ts` file registers a `StoryMeta` (title + render + default args) plus one or more `StoryObj` (per-story args + optional `play` function). Storybook 8's CSF3 (Component Story Format 3) is a plain object schema; there is no JSX indirection.
- **Playwright Component Testing** — a "small" e2e for a single component. `mount(<Button label="ok" />)` gives back a `Locator`, and the same `page.getByRole('button', { name: 'ok' }).click()` API you use in full-page Playwright tests drives the interaction.
- **Chromatic** — visual regression. A story is snapshotted per viewport, hashed, and compared against a baseline; a diff kicks off a review workflow with `accept` / `reject` branches.

The 3 tools have overlapping concepts (a story is often the input to a CT mount, and a story is also the input to a Chromatic snapshot) but historically forced 3 separate test runners, 3 configuration surfaces, and 3 sets of mocks. kiwa v1.16 unifies them behind a **single mock harness** that shares one `MockNode` tree across all 3 surfaces so the same `render(args)` function feeds all 3 without adapters in between.

## Why v1.11 – v1.15 gates alone are not enough

The v1.15 gate measures 11 axes — the common 7 (coverage / test count / fidelity ratio / perf p95 / mutation kill rate) plus the AI-LLM 4 (cost / latency / token / accuracy). Every axis is a **scalar** measured across a **network-shaped mock**. Component testing surfaces 3 failure modes that never touch the network.

| Component failure | Passes 11-axis gate? | Why |
|---|---|---|
| Button `onClick` handler bound to wrong element after refactor | Yes | `onClick` firing is a DOM-tree property, not a network property |
| Form `Submit` button label changes from `Submit` → `Continue` in a copy edit | Yes | Copy is a visual property, not a request/response property |
| Modal loses its `role="dialog"` after a wrapper `<div>` swap | Yes | a11y role is a semantic-tree property, not a scalar |
| Dark-mode color regresses from `#1a1a1a` → `#2a2a2a` after a Tailwind config bump | Yes | Pixel diff is a snapshot property, not a metric |
| Play function runs the `click` step twice due to a `setState` batch bug | Yes | Interaction ordering is a trace property, not a count |

The v1.16 axes measure these 3 tree properties (DOM structure, interaction trace, snapshot hash) **on the mock**, and the fidelity harness measures how far real Storybook / real Playwright CT / real Chromatic drift from that mock. Same-shape reports still feed `evaluateReleaseGate` — component providers stay on the common 7-axis branch — but the **fidelity axis** for component testing counts covered ops on the 3 surfaces separately, and the **perf axis** measures mount + play + a11y round-trip latency rather than one-shot API latency.

## The 3 surfaces, 1 mock

The v1.16 mock does not open a real browser. Instead, it builds an in-memory `MockNode` tree that represents the rendered component (see [`packages/component/src/dom.ts`](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts)). Every framework — React / Vue / Svelte / Solid — flattens down to a `(args) => MockNode` render function; the mock never sees framework-specific virtual DOM.

The 3 factories share this tree.

- `createStoryRegistry()` — Storybook 8's registry, keyed on `title--storyName` (kebab-case, matches the Storybook 8 URL scheme). `register(meta)` merges `meta.args` + `story.args` per CSF3 semantics and stores 1 `StoryEntry` per story. `mount(title, storyName)` returns a `CanvasElement` (the rendered root). `play(title, storyName, canvas, args)` runs the story's `play` function and records 1 trace step per `step()` call. `runA11y(title, storyName, canvas)` runs 3 heuristic checkers (button-name / image-alt / label) and returns a `{ violations: A11yViolation[] }` result.
- `createPlaywrightCTMock()` — `mount(render, args)` returns a `ComponentLocator` with `getByRole` + `getByText` locators, matching the Playwright API. `click()` fires the bound handler via `fireEvent`. `fill(value)` mutates `value` and fires the `input` event. `activeMounts()` + `unmountAll()` expose leak detection for teardown.
- `createChromaticVisualMock(config)` — `capture({ entry, canvas, viewport })` snapshots the rendered markup via `hashMarkup(renderMarkup(canvas.root))` and compares against the baseline. `captureAll({ entry, canvas })` iterates `parameters.chromatic.viewports` and returns 1 diff per viewport. `review({ storyId, viewport, action })` accepts or rejects a pending diff — `accept` swaps the baseline to the current capture.

The three factories are independent constructors — a test suite can use just one, any two, or all three. The fidelity harness in each dogfood app wires them together against a real adapter (env-gated on the tool's connection env var) and produces one report that feeds the release gate.

## The 4 semantic axes measured on the mock

The v1.16 mocks and fidelity harness measure 4 component test semantics, tracked per surface in the per-dogfood `FidelityRecord`.

| Axis | What it measures | Surface |
|---|---|---|
| **Story registration** | did `register(meta)` build the expected `StoryEntry` records? (title + storyName + args + parameters) | Storybook 8 registry |
| **Args resolution** | did `meta.args + story.args` merge match CSF3 semantics? | Storybook 8 registry |
| **Interaction trace** | did `play(...)` fire the expected step / event sequence in the expected order? | Storybook 8 + Playwright CT |
| **a11y violations** | did the heuristic checker return 0 violations for accessible-name / image-alt / label rules? | Storybook 8 registry |
| **Snapshot hash** | did the SHA-256 hash of the rendered markup match the baseline? | Chromatic |
| **Review workflow** | did `accept` swap the baseline and `reject` leave it untouched? | Chromatic |

The trade-off is that the mock cannot observe **rendered pixels** (only the semantic DOM tree) and cannot execute **real event-loop side effects** (only the wired handlers). Real Storybook 8 renders through a browser preview channel; real Playwright CT drives Chromium / WebKit / Firefox; real Chromatic captures headless PNGs. The fidelity harness measures how far real drifts from the mock per axis and reports the gap.

## Concept 1 — CSF3 as the SSOT

Storybook 8's CSF3 defines the story surface as a plain object.

```ts
import type { StoryObj } from '@kiwa/component';
import { buildButton, createStoryRegistry, fireEvent } from '@kiwa/component';

const meta = {
  title: 'Components/Button',
  render: buildButton,
  args: { label: 'ok', variant: 'primary' },
  parameters: {
    chromatic: { viewports: ['mobile', 'desktop'] },
    a11y: { disable: false },
  },
  stories: {
    Default: {} satisfies StoryObj,
    Danger: { args: { variant: 'danger' } } satisfies StoryObj,
    Interactive: {
      args: { onClick: () => console.log('click') },
      play: async ({ canvasElement, step }) => {
        await step('click primary CTA', async () => {
          const button = canvasElement.getByRole('button', { name: 'ok' });
          fireEvent(button, { type: 'click', target: button });
        });
      },
    } satisfies StoryObj,
  },
};

const registry = createStoryRegistry();
registry.register(meta);
```

The **same** `meta` object feeds Storybook 8 (via `registry.mount`), Playwright CT (via `ct.mount(meta.render, resolvedArgs)`), and Chromatic (via `chromatic.captureAll({ entry, canvas })`). One SSOT, three consumers. When `story.args` overrides `meta.args`, the mock merges them shallow-per-key exactly as Storybook 8's `entries.js` does.

The `play` function receives a `PlayContext` with `canvasElement` (a handle that exposes `getByRole` / `getByText` / `querySelector`), the resolved `args`, and `step(label, fn)` for grouping interactions in the trace. Every `step()` call appends 1 entry to `StoryPlayResult.steps`; if a step throws, `ok` becomes `false` and the error is captured — the play never crashes the test runner. Real Storybook 8's play function has the same `step` semantic (via `@storybook/test`).

## Concept 2 — CT mount + interact + assert (the tri-tuple)

Playwright Component Testing lives in the same shape as full-page Playwright — a `Locator` that supports `.click()` / `.fill(text)` / `.textContent()`. The v1.16 mock reproduces the shape.

```ts
const ct = createPlaywrightCTMock();

// mount = render into an in-memory canvas, get back a locator
const locator = ct.mount(buildButton, { label: 'Submit', onClick: () => hits++ });

// interact = getByRole / getByText + click / fill
await locator.getByRole('button', { name: 'Submit' }).click();

// assert = textContent + count on the locator
expect(await locator.getByRole('button', { name: 'Submit' }).textContent()).toBe('Submit');
expect(hits).toBe(1);

// teardown = unmount clears handlers to prevent leaks
locator.unmount();
expect(ct.activeMounts()).toBe(0);
```

The three primitives (`mount` / `getByRole|getByText` / `click|fill`) map 1:1 to real Playwright CT. The mock never opens a browser, so it runs in Node.js without a display server — but the API surface is the same, so a follow-up milestone can swap in the real driver by changing the factory function without touching any test code.

Leak detection is the mock-specific value-add. Real Playwright CT teardown is implicit (Chromium closes the tab); the mock's `activeMounts()` counter catches the case where a test forgot to `unmount()` in `afterEach` — a real leak that surfaces as memory growth in CI over hundreds of tests.

## Concept 3 — visual diff = markup hash, not pixel diff

Real Chromatic captures a rendered PNG per story per viewport, hashes it, and compares against the baseline PNG hash. The v1.16 mock reproduces the workflow — baseline seed / capture / diff / accept / reject — but hashes **rendered markup** (`hashMarkup(renderMarkup(canvas.root))`), not pixels.

The equivalence holds when `diffThreshold = 0` (hash-exact matching), which is the mock default. Every diff has 3 states.

- `status = 'new'` — no baseline exists; the current capture becomes the baseline
- `status = 'passed'` — baseline hash matches current hash exactly
- `status = 'failed'` — hashes differ; a `pending` review entry is created

The review workflow surfaces `pending → accept → passed` (swap baseline with current) or `pending → reject → failed` (leave baseline untouched). The 4 AC axes tested in `dogfood-visual-regression` cover exactly this state machine — baseline seed, capture in the passed state, capture in the failed state after an intent change, and capture in the passed state again after `accept`.

The trade-off — the mock cannot observe **anti-aliased edges**, **font hinting variance**, or **subpixel rendering differences** that real Chromatic sees. A component that changes its border-radius from `4px` → `5px` shows up in the markup hash (both are attribute values); a component whose text renders with different font metrics on macOS vs Linux does not. Real Chromatic catches the second; the mock does not. The fidelity harness reports the gap so consumers know what the mock covers and what it does not.

## Concept 4 — a11y as a first-class axis

The v1.16 mock ships a 3-rule heuristic a11y checker (see `runA11y` in `packages/component/src/storybook.ts`), matching the axe-core rules Storybook 8's a11y addon enables by default.

- `button-name` — every `role="button"` must have an accessible name (visible text or `aria-label`)
- `image-alt` — every `role="img"` must have an `alt` attribute (blank strings intentionally allowed for decorative images per WCAG)
- `label` — every `role="textbox"` / `role="checkbox"` must be labelled by a `<label for>` or `aria-label`

The checker returns `{ violations: A11yViolation[] }` with `id` (rule name), `nodeId` (path in the tree), and `message` (human-readable). Zero violations = passed. Any violation = failed.

The checker is deliberately narrow — 3 rules cover ~40% of real axe-core findings in a component-scoped scan. The tradeoff — the mock does not check color contrast (a rendered-pixel property that the markup hash cannot see), keyboard focus traversal (a browser property that in-memory nodes do not model), or aria-live announcement timing (a live-region property that the mock treats as instant). The fidelity harness measures a11y-rule coverage against real axe-core in the dogfood, so consumers can see the gap.

## Where the fidelity harness lives

Each dogfood app (`examples/dogfood-storybook-design-system/`, `examples/dogfood-form-ct/`, `examples/dogfood-visual-regression/`) ships a `flows/fidelity.ts` module that.

1. Runs the same 4-op / 5-op / 3-op surface through the mock adapter (`makeMockAdapter`) — always available
2. Runs the same surface through the real adapter (`makeRealAdapter`) — env-gated; falls back to `*_REAL_ENV_MISSING` traces when the connection env is absent
3. Emits a `FidelityReport` with per-op traces, latency samples, and a per-axis coverage summary
4. Writes the report as `quality-report/fidelity-latest.md` (git-ignored — CI reads this) and `quality-report/fidelity-latest.json` (machine-readable)

The report is then hand-promoted to `docs/quality-reports/component/<name>.md` when a release cuts. `@kiwa/quality-metrics`'s `evaluateReleaseGate` consumes the JSON directly and gates the release on the 7-axis pass.

## Related reading

- [Tutorial 19 — Storybook 8 design system in 12 min](../tutorials/19-storybook-design-system)
- [Tutorial 20 — Playwright CT for 5 form patterns in 12 min](../tutorials/20-playwright-ct)
- [Tutorial 21 — Visual regression baseline / diff / accept in 12 min](../tutorials/21-visual-regression)
- [Migration guide — v1.15 → v1.16](../migrations/v1.15-to-v1.16)
- v1.16 milestone parent [#762](https://github.com/cardene777/kiwa/issues/762)
