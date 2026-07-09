# RabbitMQ DLX test recipe

## What you'll build

A vitest test that publishes an invalid order into a `work.main` queue, watches the consumer nack it, and asserts the message routes to a `work.triage` dead-letter queue via the DLX exchange. All in-memory — no `rabbitmq:3-management` container required.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory

## Step-by-step build

```bash
mkdir kiwa-rabbitmq-dlx && cd kiwa-rabbitmq-dlx
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/queue @kiwa-lab/core
```

Set `type: module` + a test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add a minimal `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/dlx.spec.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import {
  setupRabbitMQAdvancedEnv,
  type RabbitMQAdvancedTestEnv,
} from '@kiwa-lab/queue';

let env: RabbitMQAdvancedTestEnv<'mock'>;

afterEach(async () => {
  await env?.stop();
});

describe('RabbitMQ DLX', () => {
  it('routes invalid orders to the triage queue', async () => {
    env = await setupRabbitMQAdvancedEnv({
      exchanges: [{ name: 'dlx.work', type: 'direct' }],
      queues: [
        { name: 'work.main', deadLetterExchange: 'dlx.work', deadLetterRoutingKey: 'failed' },
        { name: 'work.triage' },
      ],
      bindings: [{ exchange: 'dlx.work', queue: 'work.triage', routingKey: 'failed' }],
    });
    await env.consume({
      queue: 'work.main',
      handler: (msg) => msg.nack({ requeue: false }),
    });
    await env.sendToQueue({ queue: 'work.main', body: { id: 'poison', valid: false } });
    const dl = await env.dlx.assertDeadLettered('work.main', { reason: 'rejected' });
    expect(dl.deadLetterExchange).toBe('dlx.work');
    expect(env.peek('work.triage')).toHaveLength(1);
  });
});
```

Run:

```bash
pnpm test
```

## Explanation

- `setupRabbitMQAdvancedEnv` declares the DLX + queue + binding topology up front so the test starts from a stable state.
- `deadLetterExchange` + `deadLetterRoutingKey` on `work.main` mirror the AMQP `x-dead-letter-exchange` argument the real broker uses.
- `msg.nack({ requeue: false })` triggers dead-lettering in one call — the harness handles the routing internally.
- `env.dlx.assertDeadLettered` waits (up to 2 s) for a dead-letter to be observed and returns its snapshot.
- `env.peek('work.triage')` reads the queue depth without consuming, so the assertion has no side effects.

## Troubleshoot

- **`no dead-letter observed for queue work.main`** — Your consumer is calling `msg.ack()` instead of `msg.nack({ requeue: false })`. Only nacks with `requeue: false` fire the DLX.
- **`work.triage still 0`** — The binding routing key does not match `deadLetterRoutingKey`. Both default to the empty string when unset, but you cannot mix ("failed" + "") without a topic exchange.
- **`persist across tests`** — Call `env.stop()` in `afterEach`. Otherwise queue state leaks between tests.

## Next steps

- The [Foundry contract test tutorial](./03-rust-contract-from-zero.md) covers the Rust polyglot side.
- The advanced adapter also supports quorum queues, federation, delayed message plugin — see [`packages/queue/README.md`](../../packages/queue/README.md).
