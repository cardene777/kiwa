# @kiwa-test/queue

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Queue surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the Queue surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Queue test adapter for kiwa — BullMQ sandbox (in-memory) + testcontainers Redis env with job assertion helpers under a single `setupBullMQEnv` API.

## Overview

`@kiwa-test/queue` is the Layer 2 adapter that turns a queue-shaped Layer 1 spec into a runnable Vitest suite. It exposes one factory (`setupBullMQEnv`) with two backends chosen by the `mode` flag:

- **`mode: 'sandbox'`** — in-process, offline, deterministic. No Docker, no Redis. Ideal for the fast unit-test lane.
- **`mode: 'testcontainers'`** — real BullMQ + ioredis wired to a testcontainers-managed Redis container. Ideal for the integration lane that needs prod-shape parity.

Both backends share the same `BullMQTestEnv` surface, so switching between them is a one-argument change.

## Install

```bash
pnpm add -D @kiwa-test/queue @kiwa-test/core vitest
# testcontainers mode also needs:
pnpm add -D bullmq ioredis testcontainers
```

`bullmq`, `ioredis`, and `testcontainers` are optional peer dependencies — none of them is imported by the sandbox path, so the sandbox lane runs with zero infrastructure.

## Quick start — sandbox

```ts
import { setupBullMQEnv } from "@kiwa-test/queue";

const env = await setupBullMQEnv();       // defaults to mode: "sandbox"
env.process<{ x: number }, number>(async (job) => job.data.x * 2);

await env.addJob("double", { x: 21 });
const snap = await env.assertProcessed("double", { returnValue: 42 });
snap.state;          // "completed"
snap.attemptsMade;   // 1

await env.stop();    // clears the queue + registered processor
```

## Quick start — testcontainers Redis

```ts
import { setupBullMQEnv } from "@kiwa-test/queue";

const env = await setupBullMQEnv({
  mode: "testcontainers",
  redis: { image: "redis:7-alpine" }, // or { url: process.env.REDIS_URL }
  queueName: "emails",
});

env.process(async (job) => sendEmail(job.data));
await env.addJob("welcome", { to: "alice@example.test" }, { attempts: 3 });
await env.assertProcessed("welcome");

await env.stop();  // closes the worker, queue, ioredis, and stops the container
```

## Job assertion helpers

The `BullMQTestEnv` surface bundles five assertion helpers so tests never have to poll BullMQ internals directly:

| Helper | Contract |
|---|---|
| `waitForJob(name, { timeoutMs? })` | Waits for the first job named `name` to reach a terminal state (`completed` or `failed`). Rejects on timeout (default 5s). |
| `assertProcessed(name, { returnValue? })` | Awaits terminal state, throws if the job did not `complete`, and (optionally) checks the `returnValue`. |
| `assertFailed(name, { retry?, reasonMatch? })` | Awaits terminal state, throws if the job did not `fail`, and (optionally) checks the observed retry count + `failedReason` regex. |
| `assertRetried(name, expectedRetry)` | Awaits terminal state and checks the observed `attemptsMade`. |
| `assertQueueDrained()` | Passes when the queue has zero `waiting` / `active` / `delayed` jobs. |

`listJobs()` returns every snapshot the sandbox queue has seen (in insertion order). The testcontainers backend returns an empty array — use `waitForJob` for targeted introspection.

## Options

```ts
type SetupBullMQEnvOptions = {
  mode?: "sandbox" | "testcontainers";                 // default: "sandbox"
  redis?: { image?: string; url?: string };            // testcontainers mode
  sandbox?: { pollIntervalMs?: number };               // sandbox scheduler tick
  queueName?: string;                                  // default: "test-queue"
};
```

`addJob(name, data, options?)` mirrors the subset of `bullmq.JobsOptions` we honour: `attempts`, `delay`, `jobId`.

## Backend selection cheat-sheet

| Scenario | Recommended mode |
|---|---|
| Unit test — verify processor logic without Docker | `sandbox` |
| Unit test — verify retry / fail semantics | `sandbox` |
| Integration test — verify BullMQ + Redis roundtrip | `testcontainers` |
| Integration test — verify prod-shape delay + backoff | `testcontainers` |
| CI — the box lacks Docker | `sandbox` |
| Local run — the box has Docker + Redis image cached | either |

## Sandbox semantics (v0.1 scope)

The sandbox backend covers the following BullMQ semantics deterministically:

- `add` → `waiting` (or `delayed` when `delay > 0`)
- `waiting` → `active` (single processor, `concurrency = 1`)
- `active` → `completed` on processor return
- `active` → `waiting` on processor throw (until `attempts` is exhausted)
- `active` → `failed` on the final attempt
- `delayed` → `waiting` once the delay elapses

Out of scope for v0.1: worker `concurrency > 1`, `backoff`, `removeOnComplete`, `removeOnFail`, priority queues, rate limiting, `getFlow`. Those semantics are best exercised through the testcontainers backend against real BullMQ.

## Reference — the PoC

Live under [`examples/queue-bullmq-poc/`](../../examples/queue-bullmq-poc/) — 8 tests that thread a mocked email-sending flow through `setupBullMQEnv` end to end (happy path, retry, exhaustion, drain, delay, jobId, stop cleanup, timeout guard).

```bash
pnpm -F examples-queue-bullmq-poc test
```

## License

MIT © cardene
