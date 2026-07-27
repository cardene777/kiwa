# @kiwa-lab/ui

> [日本語](/libraries/foundation/ui/)

`@kiwa-lab/ui` is an adapter for testing components with Vitest. It provides public exports for React, plus helpers for Vue, Svelte, Solid, Lit, Qwik, Angular, and real browsers.

## What it solves

Run React components in three modes: `render`, `interaction`, and `snapshot`. `setupComponentEnv` returns a Testing Library render result and, depending on the mode, `screen`, `user`, or `markup`.

## Choose a mode

| Mode | Use it for | Main returned values |
| --- | --- | --- |
| `render` | Checking the initial render and queries. | `screen`, `result` |
| `interaction` | Verifying state updates after user actions with `userEvent`. | `screen`, `user`, `result` |
| `snapshot` | Comparing rendered HTML. | `markup`, `result` |

This package does not replace a UI framework's build tool or a browser test runner. Choose the helper and optional peer dependencies for your framework, then call `env.stop()` after every test to unmount and clean up.

## Read next

- Render a React component in the [Quickstart](./quickstart).
- Learn when to use the three modes in [Choose a mode](./guides/choose-a-mode).
- See framework helpers and types in the [API Reference](./reference).
