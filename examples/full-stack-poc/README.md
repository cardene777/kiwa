# examples/full-stack-poc

End-to-end proof that the kiwa adapter set covers a real app across all 5 test layers.

## What this shows

A single Todo app + REST API is exercised by every kiwa adapter:

| Layer | Adapter | Environment | What runs |
|---|---|---|---|
| unit | (none, pure vitest) | node | normalize / validate / summarize logic |
| integration (api) | `@kiwa-lab/api` | node + real HTTP server (free port) | 5 cases against `/api/todos` |
| ui | `@kiwa-lab/ui` (jsdom) | jsdom | 3 cases on `<TodoForm />` |
| e2e | `@kiwa-lab/e2e` (Playwright) | **real Chromium** (headless) | 2 cases driving form submit |
| observability | `@kiwa-lab/observability` | node | dashboard combining history + flaky + spec gaps |

## Run

```bash
pnpm install
pnpm exec playwright install chromium # once per machine
pnpm -F examples-full-stack-poc test
```

Expected output: 16 tests pass across 5 vitest invocations (one per environment).

## License

MIT
