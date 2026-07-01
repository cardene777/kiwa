import { createStubSQSEnv } from './stub-sqs.js';
import { createLocalstackSQSEnv } from './localstack-sqs.js';
import type { SetupSQSEnvOptions, SQSTestEnv } from './types.js';

/**
 * Factory for AWS SQS test environments.
 *
 * `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no
 * network. Deterministic enough to exercise send / receive / delete / batch /
 * visibility timeout / DLQ / FIFO deduplication semantics without spinning
 * up localstack.
 *
 * `mode: 'localstack'` connects to a running LocalStack endpoint (URL
 * provided via `localstack.endpoint`) and verifies responsiveness before
 * returning the env. The env still runs the message simulation in-process
 * (v0.2 scope) so assertions stay deterministic across backends; callers
 * that want to drive the real wire can point their own `@aws-sdk/client-sqs`
 * at the exposed `env.endpoint`.
 */
export async function setupSQSEnv(
  opts: SetupSQSEnvOptions = {},
): Promise<SQSTestEnv> {
  const mode = opts.mode ?? 'stub';
  if (mode !== 'stub' && mode !== 'localstack') {
    throw new Error(
      `setupSQSEnv: unknown mode "${String(mode)}" — expected "stub" or "localstack"`,
    );
  }
  if (mode === 'stub') return createStubSQSEnv(opts);
  return createLocalstackSQSEnv(opts);
}
