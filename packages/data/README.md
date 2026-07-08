# @kiwa/data

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the data pipeline / queue / cron surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the data pipeline / queue / cron surface shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Data pipeline / queue / cron / batch test adapter for kiwa.

## Overview

`@kiwa/data` provides deterministic primitives for testing message queues, cron-scheduled jobs, and batch pipelines without booting external infrastructure:

- `setupQueueEnv({ mode })` — in-memory queue with FIFO ordering, dedupKey-based idempotency, at-least-once consume semantics, and DLQ.
- `createFakeClock({ startMs })` — drive time forward in a single line; cron-style `schedule(intervalMs, fn)` fires deterministically.
- `expectIdempotent` / `expectAtLeastOnce` — assertion helpers for delivery semantics.

## Install

```bash
pnpm add -D @kiwa/data @kiwa/core vitest
```

## Queue env

```ts
import { setupQueueEnv } from "@kiwa/data";

const env = await setupQueueEnv<Order>({ mode: "mock", maxReceiveCount: 3 });
const unsubscribe = env.client.consume(async (msg, ack) => {
  if (canProcess(msg.body)) ack.ack();
  else ack.nack();
});
env.client.send({ orderId: "1", amount: 100 });
// later
unsubscribe();
expect(env.client.dlqSize()).toBe(0);
await env.stop();
```

## Fake clock

```ts
import { createFakeClock } from "@kiwa/data";

const clock = createFakeClock();
const id = clock.schedule(100, () => doWork());
await clock.advanceMs(350); // doWork() fires 3 times deterministically
clock.unschedule(id);
```

## Assertion helpers

```ts
import { expectIdempotent, expectAtLeastOnce } from "@kiwa/data";

await expectIdempotent(env.client, body, { dedupKey: "task-1" }, expect);
await expectAtLeastOnce(env.client, body, 3, expect);
```

## Example: queue + cron PoC

See [`examples/queue-poc/`](../../examples/queue-poc) for the end-to-end PoC.

## License

MIT
