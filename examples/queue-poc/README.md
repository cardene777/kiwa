# examples/queue-poc

Proof-of-concept that exercises `@kiwa-lab/data` against an in-memory order processor + cron schedule.

## What this shows

- A small order processor that accepts orders under `maxAmount` and rejects the rest.
- A Layer 1 kiwa-design spec (`tests/spec/integration/test-spec-orders.data.md`) listing 7 cases across `queue` and `cron` topics.
- A Vitest suite that exercises FIFO ordering, idempotency (dedupKey), at-least-once retry, DLQ migration, and deterministic cron firing via `createFakeClock`.

## Run

```bash
pnpm install
pnpm -F examples-queue-poc test
```

Expected output: `Test Files 1 passed (1) / Tests 7 passed (7)`.

## License

MIT
