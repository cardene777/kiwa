# examples/nextjs-event-history

Search and render `EventEmitter` events through Playwright. A good way to feel the `expectEvent` helper and the typical viem `getLogs` lane.

## What you can try

- Emit a contract event and read it back via viem `getLogs`
- Assert event firings with arg checks via `expectEvent`
- Filter by block range / topics
- Verify event payload matches the rendered history

## How to run

```bash
pnpm -F examples-nextjs-event-history test
```

Next.js dev server runs on port 3043.

## Reading the tests

| File | What it covers |
|---|---|
| `tests/event.spec.ts` | emit → `getLogs` fetch → `expectEvent` arg checks → UI render parity, 6 cases |

## Related cookbook entries

- [Time manipulation (block progression)](../../docs/en/cookbook/time-manipulation.md)

## Where to go next

- ENS resolver → [examples/nextjs-ens-resolver](../nextjs-ens-resolver/README.md)
- Back to the basics → [examples/basic-connect](../basic-connect/README.md)
