import { createSandboxBullMQEnv } from './sandbox-queue.js';
import { createTestcontainersBullMQEnv } from './testcontainers-queue.js';
import type { BullMQTestEnv, SetupBullMQEnvOptions } from './types.js';

const DEFAULT_QUEUE_NAME = 'test-queue';

/**
 * Factory for BullMQ test environments.
 *
 * `mode: 'sandbox'` (default) returns a fast, in-process fake — no Docker, no
 * peer dependencies required beyond `bullmq`'s type shape via structural
 * duck-typing. Use it for the fast unit-test lane.
 *
 * `mode: 'testcontainers'` boots a real Redis under testcontainers and wires
 * up a real `bullmq.Queue` + `bullmq.Worker`. Use it for the integration lane
 * that needs prod-shape parity.
 */
export async function setupBullMQEnv(
  opts: SetupBullMQEnvOptions = {},
): Promise<BullMQTestEnv> {
  const queueName = opts.queueName ?? DEFAULT_QUEUE_NAME;
  const mode = opts.mode ?? 'sandbox';
  if (mode !== 'sandbox' && mode !== 'testcontainers') {
    throw new Error(
      `setupBullMQEnv: unknown mode "${String(mode)}" — expected "sandbox" or "testcontainers"`,
    );
  }
  if (mode === 'sandbox') {
    return createSandboxBullMQEnv({ ...opts, queueName });
  }
  return createTestcontainersBullMQEnv({ ...opts, queueName });
}
