# @kiwa-lab/queue

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Queue surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the Queue surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Queue test adapter for kiwa — BullMQ sandbox (in-memory) + testcontainers Redis env with job assertion helpers under a single `setupBullMQEnv` API, plus an event-driven Inngest env (`setupInngestEnv`) with stub + dev-server backends, plus a Cloudflare Queues env (`setupCloudflareQueuesEnv`) with miniflare + wrangler backends, plus an AWS SQS env (`setupSQSEnv`) with stub + localstack backends.

## Overview

`@kiwa-lab/queue` is the Layer 2 adapter that turns a queue-shaped Layer 1 spec into a runnable Vitest suite. It ships four factories:

- **`setupBullMQEnv`** — BullMQ (Redis-backed job queue) with `sandbox` (in-process) + `testcontainers` (real Redis + BullMQ + ioredis) backends.
- **`setupInngestEnv`** — Inngest (SaaS event-driven) with `stub` (in-process, deterministic) + `dev-server` (real Inngest dev-server HTTP round-trip) backends.
- **`setupCloudflareQueuesEnv`** — Cloudflare Queues (edge queue) with `miniflare` (in-process, deterministic) + `wrangler` (real `wrangler dev` process) backends.
- **`setupSQSEnv`** — AWS SQS (standard + FIFO queue) with `stub` (in-process, deterministic) + `localstack` (real LocalStack endpoint) backends.

Backend selection is a one-argument change (`mode: '...'`) and all four factories share the same `TestEnvBase<TMode>` shape so switching lanes never rewrites the assertion surface.

## Install

```bash
pnpm add -D @kiwa-lab/queue @kiwa-lab/core vitest
# BullMQ testcontainers mode also needs:
pnpm add -D bullmq ioredis testcontainers
# Inngest dev-server mode also needs:
pnpm add -D inngest
# Cloudflare Queues wrangler mode also needs:
pnpm add -D wrangler
# Cloudflare Queues miniflare mode (optional external instance) also needs:
pnpm add -D miniflare
```

`bullmq`, `ioredis`, `testcontainers`, `inngest`, `miniflare`, and `wrangler` are optional peer dependencies — none of them is imported by the sandbox / stub / miniflare paths, so the fast lanes run with zero infrastructure.

## Quick start — sandbox

```ts
import { setupBullMQEnv } from "@kiwa-lab/queue";

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
import { setupBullMQEnv } from "@kiwa-lab/queue";

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

## Reference — the BullMQ PoC

Live under [`examples/queue-bullmq-poc/`](../../examples/queue-bullmq-poc/) — 8 tests that thread a mocked email-sending flow through `setupBullMQEnv` end to end (happy path, retry, exhaustion, drain, delay, jobId, stop cleanup, timeout guard).

```bash
pnpm -F examples-queue-bullmq-poc test
```

## Inngest env — `setupInngestEnv`

`setupInngestEnv` is the event-driven counterpart to `setupBullMQEnv`. Event senders push events by name + payload; matching function definitions execute the handler, optionally through a `step.run(...)` trace that assertions can observe.

### Quick start — stub

```ts
import { setupInngestEnv } from "@kiwa-lab/queue";

const env = await setupInngestEnv();                 // defaults to mode: "stub"
env.registerFunction({
  id: "signup-completed",
  event: "user/signup.completed",
  retries: 3,
  handler: async ({ event, step }) => {
    await step.run("send-welcome-email", () => sendEmail(event.data.userId));
    await step.sleep("wait-for-reminder", 24 * 60 * 60 * 1000);
    return { ok: true };
  },
});

await env.sendEvent("user/signup.completed", { userId: "u-1", plan: "pro" });
const snap = await env.assertFunctionRan("signup-completed");
snap.stepsRun;      // ["send-welcome-email", "wait-for-reminder"]
snap.attemptsMade;  // 1 (or higher if the handler threw)

await env.stop();
```

### Quick start — dev-server

```ts
import { setupInngestEnv } from "@kiwa-lab/queue";

const env = await setupInngestEnv({
  mode: "dev-server",
  // Optional: point at an existing dev-server; omit to auto-spawn
  // `npx inngest-cli@latest dev`.
  devServer: { url: process.env.INNGEST_DEV_URL },
  functions: [signupCompletedFn],
});

await env.sendEvent("user/signup.completed", { userId: "u-1", plan: "pro" });
await env.assertFunctionRan("signup-completed");

await env.stop();  // closes the dev-server subprocess if we spawned it
```

### Assertion helpers

The `InngestTestEnv` surface bundles six assertion helpers so tests never poll internals directly:

| Helper | Contract |
|---|---|
| `waitForRun(functionId, { timeoutMs? })` | Waits for the first run of `functionId` to reach a terminal state (`completed` / `failed` / `cancelled`). Rejects on timeout (default 5s). |
| `assertFunctionRan(functionId, { returnValue? })` | Awaits terminal state, throws if the run did not `complete`, and (optionally) checks the `returnValue`. |
| `assertFunctionFailed(functionId, { attempts?, reasonMatch? })` | Awaits terminal state, throws if the run did not `fail`, and (optionally) checks the observed attempt count + `failedReason` regex. |
| `assertRetried(functionId, expectedAttempts)` | Awaits terminal state and checks the observed `attemptsMade`. |
| `assertStepRan(functionId, stepId)` | Awaits terminal state and asserts the run executed the named step. |
| `assertQueueDrained()` | Passes when the env has zero `queued` / `running` runs. |

`listRuns()` returns every snapshot the env has seen (in registration order).

### Options

```ts
type SetupInngestEnvOptions = {
  mode?: "stub" | "dev-server";                          // default: "stub"
  functions?: InngestFunctionDefinition[];               // pre-register at creation time
  devServer?: { url?: string; port?: number; startupTimeoutMs?: number };
  appId?: string;                                        // default: "kiwa-test-app"
};
```

`InngestFunctionDefinition` mirrors `inngest.createFunction`: `id`, `event`, optional `retries`, optional `concurrency`, and a `handler` receiving `{ event, step, attempt }`.

### Stub semantics (v0.1 scope)

The stub backend covers the following Inngest semantics deterministically:

- `sendEvent` → `queued` (state) → `running` → `completed` on handler return
- `running` → `queued` on handler throw (until `retries` is exhausted)
- `running` → `failed` on the final attempt
- `step.run(stepId, fn)` — records `stepId` in `snap.stepsRun`; step traces reset on each retry attempt
- `step.sleep(stepId, ms)` — records `stepId` without advancing real time
- `concurrency: N` — caps in-flight runs per function, queued events wait for a slot

Out of scope for v0.1: distributed step memoisation, event fan-out to `bufferSize`, batching, cron triggers. Those semantics are best exercised through the dev-server backend against real Inngest.

### Reference — the Inngest PoC

Live under [`examples/queue-inngest-poc/`](../../examples/queue-inngest-poc/) — 8 tests that thread a signup-completed notification pipeline through `setupInngestEnv` end to end (happy path, retry, exhaustion, concurrency, step assertion, orphan events, stop cleanup, timeout guard).

```bash
pnpm -F examples-queue-inngest-poc test
```

## Cloudflare Queues env — `setupCloudflareQueuesEnv`

`setupCloudflareQueuesEnv` covers the edge-queue slot in the `@kiwa-lab/queue` family. Producers push messages by queue name + body; a registered consumer receives a `queue(batch, env, ctx)`-shaped batch object with `msg.ack()` / `msg.retry()` / `batch.ackAll()` / `batch.retryAll()` — the same surface production Workers see.

### Quick start — miniflare

```ts
import { setupCloudflareQueuesEnv } from "@kiwa-lab/queue";

const env = await setupCloudflareQueuesEnv();          // defaults to mode: "miniflare"
env.registerConsumer<{ userId: string }>({
  queue: "webhook-events",
  maxBatchSize: 10,
  maxRetries: 3,
  deadLetterQueue: "webhook-dlq",
  handler: async (batch) => {
    for (const msg of batch.messages) {
      try {
        await forwardToAuditSink(msg.body);
        msg.ack();
      } catch {
        msg.retry();
      }
    }
  },
});

await env.send("webhook-events", { userId: "u-1" });
const snap = await env.assertAcknowledged("webhook-events");
snap.state;     // "ack"
snap.attempts;  // 1 (or higher if the handler called msg.retry())

await env.stop();
```

### Quick start — wrangler

```ts
import { setupCloudflareQueuesEnv } from "@kiwa-lab/queue";

const env = await setupCloudflareQueuesEnv({
  mode: "wrangler",
  // Optional: point at an existing wrangler dev process; omit to auto-spawn
  // `npx wrangler@latest dev --local`.
  wrangler: { url: process.env.WRANGLER_URL },
  consumers: [webhookConsumer],
});

await env.send("webhook-events", { userId: "u-1" });
await env.assertAcknowledged("webhook-events");

await env.stop();  // shuts down the wrangler subprocess if we spawned it
```

### Assertion helpers

The `CloudflareQueuesTestEnv` surface bundles five assertion helpers so tests never poll internals directly:

| Helper | Contract |
|---|---|
| `waitForMessage(queueName, { timeoutMs? })` | Waits for the first message on `queueName` to reach a terminal state (`ack` / `dead`). Rejects on timeout (default 5s). |
| `assertAcknowledged(queueName, { attempts? })` | Awaits terminal state, throws if the message did not `ack`, and (optionally) checks the observed attempt count. |
| `assertDeadLettered(queueName, { dlq?, reasonMatch?, attempts? })` | Awaits terminal state, throws if the message did not dead-letter, and (optionally) checks the DLQ name / `failedReason` regex / attempt count. |
| `assertRetried(queueName, expectedRetries)` | Awaits terminal state and checks the observed `attempts`. |
| `assertQueueDrained(queueName?)` | Passes when the queue (or every queue when `queueName` is omitted) has zero `pending` / `delivered` / `retrying` messages. |

`listMessages(queueName?)` returns every snapshot the env has seen (in insertion order). `listDeadLetters(dlqName?)` returns every message that has been routed to a dead-letter queue.

### Options

```ts
type SetupCloudflareQueuesEnvOptions = {
  mode?: "miniflare" | "wrangler";                       // default: "miniflare"
  queues?: string[];                                     // pre-provision queues (optional)
  consumers?: CloudflareQueueConsumerRegistration[];     // pre-register consumers (optional)
  miniflare?: { pollIntervalMs?: number; miniflare?: unknown };
  wrangler?: { url?: string; port?: number; startupTimeoutMs?: number };
};
```

`CloudflareQueueConsumerRegistration` mirrors the [[queues.consumers]] entry in `wrangler.toml`: `queue`, `handler`, optional `maxBatchSize`, `maxBatchTimeoutMs`, `maxRetries`, `deadLetterQueue`.

### Miniflare semantics (v0.2 scope)

The miniflare backend covers the following Cloudflare Queues semantics deterministically:

- `send(queueName, body, { delaySeconds? })` → `pending` (or delayed until visibility opens)
- `pending` → `delivered` when the scheduler flushes a batch
- `delivered` → `ack` on `msg.ack()`
- `delivered` → `retrying` on `msg.retry()` or unacked messages (up to `maxRetries`)
- `retrying` → `dead` after `maxRetries` exhausted (routed to `deadLetterQueue` when set)
- Handler `throw` → every message in the batch retries (partial acks are preserved otherwise)
- `maxBatchSize` chunking — pending messages beyond the cap flush across multiple batches
- `retry()` overrides a subsequent `ack()` on the same message (matches production)

Out of scope for v0.2: `maxBatchTimeoutMs` partial-batch flush timers, `retryDelay` backoff, cross-DC replication semantics, `consumer.consumerConcurrency`. Those semantics are best exercised through the wrangler backend against a real dev-server binding.

### Reference — the Cloudflare Queues PoC

Live under [`examples/queue-cloudflare-poc/`](../../examples/queue-cloudflare-poc/) — 8 tests that thread a webhook audit pipeline through `setupCloudflareQueuesEnv` end to end (happy path, batch coalescing, transient retry, dead-letter, mixed batch partial success, orphan messages, stop cleanup, timeout guard).

```bash
pnpm -F examples-queue-cloudflare-poc test
```

## SQS env — `setupSQSEnv`

`setupSQSEnv` covers the AWS-standard queue slot in the `@kiwa-lab/queue` family. Producers `send` messages by queue name; consumers `receive` them, either `delete` on success or let the visibility timeout expire so the message returns to the queue. FIFO queues honour `messageGroupId` + `messageDeduplicationId`; standard queues honour delayed sends + long polling + DLQ redrive policy.

### Quick start — stub

```ts
import { setupSQSEnv } from "@kiwa-lab/queue";

const env = await setupSQSEnv({                        // defaults to mode: "stub"
  queues: [
    {
      name: "orders",
      visibilityTimeoutSeconds: 30,
      redrivePolicy: { deadLetterTargetArn: "orders-dlq", maxReceiveCount: 3 },
    },
    { name: "orders-dlq" },
  ],
});

await env.send("orders", { orderId: "o-1", amount: 100 });
const [received] = await env.receive<{ orderId: string; amount: number }>("orders");
received.delete();
const snap = await env.assertDeleted("orders", { receiveCount: 1 });
snap.state;         // "deleted"
snap.receiveCount;  // 1

await env.stop();
```

### Quick start — localstack

```ts
import { setupSQSEnv } from "@kiwa-lab/queue";

const env = await setupSQSEnv({
  mode: "localstack",
  localstack: { endpoint: process.env.LOCALSTACK_URL ?? "http://localhost:4566" },
  queues: [{ name: "orders" }],
});

await env.send("orders", { orderId: "o-1", amount: 100 });
await env.assertDeleted("orders");

await env.stop();
```

### Assertion helpers

The `SQSTestEnv` surface bundles four assertion helpers so tests never poll internals directly:

| Helper | Contract |
|---|---|
| `waitForMessage(queueName, { timeoutMs? })` | Waits for the first message on `queueName` to reach a terminal state (`deleted` / `dead`). Rejects on timeout (default 5s). |
| `assertDeleted(queueName, { receiveCount? })` | Awaits terminal state, throws if the message was not `deleted`, and (optionally) checks the observed receive count. |
| `assertDeadLettered(queueName, { dlq?, receiveCount? })` | Awaits terminal state, throws if the message did not dead-letter, and (optionally) checks the DLQ name / receive count. |
| `assertQueueDrained(queueName?)` | Passes when the queue (or every queue when `queueName` is omitted) has zero `pending` / `inflight` messages. |

`listMessages(queueName?)` returns every snapshot the env has seen. `listDeadLetters(dlqName?)` returns every message that has been routed to a dead-letter queue.

### Options

```ts
type SetupSQSEnvOptions = {
  mode?: "stub" | "localstack";                          // default: "stub"
  queues?: SQSQueueSpec[];                               // pre-provision queues (optional)
  credentials?: { accessKeyId: string; secretAccessKey: string };
  localstack?: { image?: string; endpoint?: string; region?: string; startupTimeoutMs?: number };
};
```

`SQSQueueSpec` — `name`, optional `kind` (`standard` | `fifo`, defaults to `standard`), optional `visibilityTimeoutSeconds` (default 30), optional `redrivePolicy` (`deadLetterTargetArn` + `maxReceiveCount`).

### Stub semantics (v0.2 scope)

The stub backend covers the following SQS semantics deterministically:

- `send(queueName, body, { delaySeconds?, messageGroupId?, messageDeduplicationId? })` → `pending` (or delayed until visibility opens)
- `sendBatch(queueName, entries)` — up to 10 entries per call, mirrors `SendMessageBatch`
- `receive(queueName, { maxMessages?, visibilityTimeoutSeconds?, waitTimeSeconds? })` — long polling honours `waitTimeSeconds`; returns up to 10 messages
- `pending` → `inflight` on `receive`, `visibleAt` = now + `visibilityTimeoutSeconds`
- `inflight` → `pending` when the visibility timeout expires (message becomes redeliverable)
- `inflight` → `deleted` on `msg.delete()`
- `inflight` → `dead` when `receiveCount` exceeds `redrivePolicy.maxReceiveCount` (routed to `deadLetterTargetArn`)
- `msg.changeVisibility(seconds)` — extends the in-flight window
- FIFO queues honour `messageGroupId` (required) + `messageDeduplicationId` (returns the existing message on duplicate dedup id)
- `deleteBatch(queueName, entries)` — up to 10 entries per call, mirrors `DeleteMessageBatch`

Out of scope for v0.2: content-based deduplication, dead-letter redrive-to-source rewind (`StartMessageMoveTask`), attribute-based filtering, encrypted queues (KMS), delay queues (queue-level `DelaySeconds`), throughput quotas. Those semantics are best exercised through the localstack backend against a real LocalStack container.

### Reference — the SQS PoC

Live under [`examples/queue-sqs-poc/`](../../examples/queue-sqs-poc/) — 8 tests that thread a customer-order processing pipeline through `setupSQSEnv` end to end (happy path, batch send / delete, transient retry, DLQ routing, mixed batch, FIFO ordering, FIFO deduplication, long polling).

```bash
pnpm -F examples-queue-sqs-poc test
```

## License

MIT © cardene
