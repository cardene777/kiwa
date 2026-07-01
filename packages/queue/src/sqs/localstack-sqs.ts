import type {
  SetupSQSEnvOptions,
  SQSBatchDeleteEntry,
  SQSBatchSendEntry,
  SQSMessageSnapshot,
  SQSQueueSpec,
  SQSReceiveOptions,
  SQSReceivedMessage,
  SQSSendOptions,
  SQSTestEnv,
} from './types.js';
import { createStubSQSEnv } from './stub-sqs.js';

/**
 * Build a LocalStack-backed SQS env. When `opts.localstack?.endpoint` is
 * provided the helper connects directly to that endpoint and verifies
 * responsiveness. Otherwise the helper would spawn a testcontainers
 * LocalStack instance — kept out of the v0.2 scope so callers wanting
 * fully-managed containers can opt in later.
 *
 * The v0.2 wire path shares the stub simulation for message state (so
 * assertion helpers stay deterministic) while surfacing the LocalStack
 * `endpoint` on the env for callers that want to point their own
 * `@aws-sdk/client-sqs` at it.
 */
export async function createLocalstackSQSEnv(
  opts: SetupSQSEnvOptions,
): Promise<SQSTestEnv<'live'>> {
  const endpoint = opts.localstack?.endpoint;
  if (!endpoint) {
    throw new Error(
      'setupSQSEnv: mode="localstack" requires localstack.endpoint (v0.2 scope). Provide the URL of a running LocalStack instance, or use mode="stub" for zero-infra tests.',
    );
  }
  const startupTimeoutMs = opts.localstack?.startupTimeoutMs ?? 15000;
  await probeEndpoint(endpoint, startupTimeoutMs);

  // Reuse the stub for deterministic state — the endpoint is surfaced for
  // callers that want to drive the real wire; assertions still work against
  // the deterministic simulation.
  const inner = createStubSQSEnv(opts);
  const containerEnv: SQSTestEnv<'live'> = {
    mode: 'live',
    backend: 'localstack',
    endpoint,
    get queues() {
      return inner.queues;
    },
    createQueue: (spec: SQSQueueSpec) => inner.createQueue(spec),
    send: <TBody>(
      queueName: string,
      body: TBody,
      options?: SQSSendOptions,
    ): Promise<SQSMessageSnapshot<TBody>> => inner.send(queueName, body, options),
    sendBatch: <TBody>(
      queueName: string,
      entries: SQSBatchSendEntry<TBody>[],
    ): Promise<SQSMessageSnapshot<TBody>[]> => inner.sendBatch(queueName, entries),
    receive: <TBody>(
      queueName: string,
      options?: SQSReceiveOptions,
    ): Promise<SQSReceivedMessage<TBody>[]> => inner.receive(queueName, options),
    deleteBatch: (queueName: string, entries: SQSBatchDeleteEntry[]) =>
      inner.deleteBatch(queueName, entries),
    waitForMessage: inner.waitForMessage.bind(inner),
    assertDeleted: inner.assertDeleted.bind(inner),
    assertDeadLettered: inner.assertDeadLettered.bind(inner),
    assertQueueDrained: inner.assertQueueDrained.bind(inner),
    listMessages: inner.listMessages.bind(inner),
    listDeadLetters: inner.listDeadLetters.bind(inner),
    stop: inner.stop.bind(inner),
  };
  return containerEnv;
}

/**
 * Verify the LocalStack endpoint responds — polls until `startupTimeoutMs`
 * expires. Uses `fetch` (Node 20+) with a short per-attempt timeout so the
 * probe fails fast on unreachable endpoints.
 */
async function probeEndpoint(endpoint: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const attemptTimeoutMs = 500;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    const ctrl = new AbortController();
    const abortTimer = setTimeout(() => ctrl.abort(), attemptTimeoutMs);
    try {
      // LocalStack exposes a health endpoint at /_localstack/health.
      const url = endpoint.replace(/\/+$/, '') + '/_localstack/health';
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(abortTimer);
      if (res.ok) return;
      lastError = new Error(`probe returned HTTP ${res.status}`);
    } catch (err) {
      clearTimeout(abortTimer);
      lastError = err;
    }
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 100);
      (timer as unknown as { unref?: () => void }).unref?.();
    });
  }
  const reason = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown');
  throw new Error(
    `setupSQSEnv: LocalStack at "${endpoint}" did not respond within ${timeoutMs}ms — ${reason}`,
  );
}
