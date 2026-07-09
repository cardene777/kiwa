# `@kiwa-lab/component`

Component test mock harness for kiwa — 3 unified integrations across Storybook 8, Playwright Component Testing, and Chromatic. One API for story registration + args resolution + play function runner, mount + interact, and visual regression baseline / diff / accept workflow.

v0.1 lays the foundation for the v1.16 milestone dogfood apps (design system + form CT + visual regression).

## Install

```sh
pnpm add -D @kiwa-lab/component @kiwa-lab/quality-metrics
```

## Quick start — 3 unified mocks

### Storybook 8 story registry

```ts
import {
  createStoryRegistry,
  buildButton,
} from '@kiwa-lab/component';

const registry = createStoryRegistry();
registry.register({
  title: 'Components/Button',
  render: buildButton,
  args: { label: 'default' },
  stories: {
    Primary: { args: { variant: 'primary' } },
    Interactive: {
      args: { label: 'Click me' },
      play: async ({ canvasElement, step }) => {
        await step('click the button', async () => {
          const btn = canvasElement.getByRole('button');
          btn.handlers['click']?.[0]?.({ type: 'click', target: btn });
        });
      },
    },
  },
});

const { canvas } = registry.mount('Components/Button', 'Interactive');
const result = await registry.play('Components/Button', 'Interactive', canvas);
console.log(result.steps); // [{ label: 'click the button', ok: true }]
```

Supports `StoryObj.args + play + parameters`, meta / story deep merge, `parameters.chromatic` / `parameters.a11y` passthrough, and a heuristic a11y checker (button-name, image-alt, label rules).

### Playwright Component Testing

```ts
import {
  createPlaywrightCTMock,
  buildForm,
} from '@kiwa-lab/component';

const ct = createPlaywrightCTMock();
let submitted: Record<string, string> | null = null;
const form = ct.mount(buildForm, {
  title: 'Signup',
  fields: [
    { id: 'email', label: 'Email', type: 'email', required: true },
  ],
  onSubmit: (data) => {
    submitted = data;
  },
});

// interact via Playwright API surface
await form.getByRole('textbox').fill('user@example.com');
await form.getByRole('button').click();
console.log(submitted); // { email: 'user@example.com' }
form.unmount();
```

Supports `mount + getByText + getByRole + click + fill + textContent + count`, framework agnostic, no browser process, deterministic in-memory DOM.

### Chromatic visual regression

```ts
import {
  createChromaticVisualMock,
  createStoryRegistry,
  buildCard,
} from '@kiwa-lab/component';

const chromatic = createChromaticVisualMock();
const registry = createStoryRegistry();
registry.register({
  title: 'Card',
  render: buildCard,
  parameters: { chromatic: { viewports: ['mobile', 'desktop'], diffThreshold: 0.01 } },
  stories: { Default: { args: { title: 'Hello', body: 'World' } } },
});

const { canvas, entry } = registry.mount('Card', 'Default');

// 1st pass — new baseline captured per viewport
let diffs = chromatic.captureAll({ entry, canvas });
console.log(diffs.map((d) => d.status)); // ['new', 'new']

// 2nd pass — identical markup → passed
diffs = chromatic.captureAll({ entry, canvas });
console.log(diffs.every((d) => d.status === 'passed')); // true

// Simulate a design change
const { canvas: changed, entry: changedEntry } = registry.mount('Card', 'Default', { title: 'Hi' });
const changedDiffs = chromatic.captureAll({ entry: changedEntry, canvas: changed });
console.log(changedDiffs[0]?.status); // 'failed'

// Approve the design change
chromatic.review({ storyId: changedEntry.id, viewport: 'mobile', action: 'accept' });
```

Supports `capture + captureAll + review (accept/reject) + reviewHistory + seedBaseline + reset`, multi viewport, `parameters.chromatic.diffThreshold` and `disable` fields, deterministic SHA-256 hash comparison.

## 5 component fixtures

Framework agnostic renderers usable from stories / component tests / visual capture. Cover the five SaaS frontend primitives.

| fixture | description |
|---|---|
| `buildButton` | text label + click handler + variant class + disabled state |
| `buildInput` | label + input pair with `for/id` association + change handler |
| `buildForm` | title + multi-field composition + submit validation |
| `buildModal` | open/close state + backdrop + close button + escape hooks |
| `buildCard` | title + body + optional footer + variant class |

```ts
import { componentFixtures } from '@kiwa-lab/component';

// batch register every fixture
const registry = createStoryRegistry();
for (const [name, render] of Object.entries(componentFixtures)) {
  registry.register({
    title: `Fixtures/${name}`,
    render,
    stories: { Default: {} },
  });
}
```

## Design goals

- **1 API for 3 integrations** — the same `MockNode` tree is used for story rendering, Playwright CT mounting, and Chromatic capture.
- **Framework agnostic** — every component is a pure `(args) => MockNode` function, so React / Vue / Svelte / Solid tests share the harness.
- **Deterministic** — no jsdom, no browser process, no wall clock (all `now` sources injectable). Hashes and IDs are stable across runs.
- **Real-vs-mock parity** — API surface deliberately mirrors real Storybook 8 CSF3, Playwright CT `Locator`, and Chromatic baseline / diff / accept workflow, so a single test spec can run against the mock (fast) and a real environment (dogfood).

## Related packages

- `@kiwa-lab/quality-metrics` — 11-axis release gate that this harness will feed component test results into (Chromatic `status=failed` and a11y violations map to axes).
- `@kiwa-lab/e2e` — Playwright browser-driven end-to-end tests. Complement, not replacement — CT covers component surface, e2e covers page flows.
