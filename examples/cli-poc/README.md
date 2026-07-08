# examples/cli-poc

Proof-of-concept that exercises `@kiwa/cli-test` by dogfooding the production `kiwa` CLI.

## What this shows

- Driving the real `packages/cli/dist/index.js` binary through `setupCliEnv` (no global install required).
- 8 cases across help / unknown command / doctor / init / anvil seed sub-commands.
- exit code + stdout/stderr + file-system side effects all asserted via the official helpers.

## Run

```bash
pnpm install
pnpm -F examples-cli-poc test
```

Expected output: `Test Files 1 passed (1) / Tests 8 passed (8)`.

## License

MIT
