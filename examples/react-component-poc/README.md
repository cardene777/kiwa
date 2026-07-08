# examples/react-component-poc

Proof-of-concept that exercises `@kiwa/ui` and `@kiwa/core` against a single React component (`<Counter />`).

## What this shows

- A small Counter component with props (`initial` / `step` / `max`) and a11y-friendly buttons.
- A Layer 1 kiwa-design spec (`tests/spec/integration/test-spec-counter.ui.md`) listing 7 cases with explicit `Mode` and `Component` columns.
- A Vitest suite that turns the spec into runnable tests across all three modes:
  - `render` — `setupComponentEnv({ mode: 'render', ui })` mounts + queries.
  - `interaction` — `setupComponentEnv({ mode: 'interaction', ui })` mounts + drives `userEvent` clicks.
  - `snapshot` — `setupComponentEnv({ mode: 'snapshot', ui })` captures serialized markup.

## Run

```bash
pnpm install
pnpm -F examples-react-component-poc test
```

Expected output: `Test Files 1 passed (1) / Tests 7 passed (7)`.

## License

MIT
