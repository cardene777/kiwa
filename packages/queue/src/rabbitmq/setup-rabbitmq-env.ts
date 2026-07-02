import { createStubRabbitMQEnv } from './stub-rabbitmq.js';
import { createTestcontainersRabbitMQEnv } from './testcontainers-rabbitmq.js';
import type { RabbitMQTestEnv, SetupRabbitMQEnvOptions } from './types.js';

/**
 * Factory for RabbitMQ test environments.
 *
 * `mode: 'stub'` (default) returns a fast, in-process AMQP 0.9.1 model
 * emulator. No docker, no network. Deterministic enough to exercise
 * exchange / queue / binding / consumer / ack / nack / prefetch semantics.
 *
 * `mode: 'testcontainers'` connects to a running RabbitMQ broker (URL
 * provided via `testcontainers.amqpUrl`) and verifies responsiveness via the
 * management API. The env still runs the message simulation in-process
 * (v0.3 scope) so assertions stay deterministic across backends; callers
 * that want to drive the real wire can point their own `amqplib` at the
 * exposed `env.amqpUrl`.
 */
export async function setupRabbitMQEnv(
  opts: SetupRabbitMQEnvOptions = {},
): Promise<RabbitMQTestEnv> {
  const mode = opts.mode ?? 'stub';
  if (mode !== 'stub' && mode !== 'testcontainers') {
    throw new Error(
      `setupRabbitMQEnv: unknown mode "${String(mode)}" — expected "stub" or "testcontainers"`,
    );
  }
  if (mode === 'stub') return createStubRabbitMQEnv(opts);
  return createTestcontainersRabbitMQEnv(opts);
}
