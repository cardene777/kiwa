import type {
  BullMQTestEnv,
  JobProcessor,
  QueueJobSnapshot,
  SetupBullMQEnvOptions,
} from './types.js';

/**
 * Minimal shape of the pieces of BullMQ we use. Kept as an interface so we can
 * `await import('bullmq')` at runtime and satisfy the peerDependency contract
 * without pulling BullMQ into the build graph.
 */
interface BullMQModule {
  Queue: new (name: string, opts: { connection: unknown }) => {
    add: (
      name: string,
      data: unknown,
      opts?: { attempts?: number; delay?: number; jobId?: string },
    ) => Promise<{ id?: string; name: string; data: unknown }>;
    close: () => Promise<void>;
    getWaitingCount: () => Promise<number>;
    getActiveCount: () => Promise<number>;
    getDelayedCount: () => Promise<number>;
    getJobs: (states: string[]) => Promise<
      Array<{
        id?: string;
        name: string;
        data: unknown;
        attemptsMade: number;
        returnvalue?: unknown;
        failedReason?: string;
        getState: () => Promise<string>;
      }>
    >;
  };
  Worker: new (
    name: string,
    processor: (job: {
      id?: string;
      name: string;
      data: unknown;
      attemptsMade: number;
    }) => Promise<unknown>,
    opts: { connection: unknown; concurrency?: number },
  ) => {
    close: () => Promise<void>;
  };
}

interface IoRedisModule {
  default: new (
    url: string,
    opts?: { maxRetriesPerRequest?: number | null },
  ) => { quit: () => Promise<unknown>; disconnect: () => void };
}

type RedisContainer = {
  start: () => Promise<{
    stop: () => Promise<void>;
    getHost: () => string;
    getMappedPort: (port: number) => number;
  }>;
  withExposedPorts: (port: number) => RedisContainer;
};

async function loadPeers(): Promise<{ bullmq: BullMQModule; ioredis: IoRedisModule }> {
  let bullmq: BullMQModule;
  let ioredis: IoRedisModule;
  try {
    bullmq = (await import('bullmq')) as unknown as BullMQModule;
    ioredis = (await import('ioredis')) as unknown as IoRedisModule;
  } catch (caught) {
    throw new Error(
      "@kiwa/queue: testcontainers mode requires 'bullmq' + 'ioredis' peer dependencies. Install with `pnpm add -D bullmq ioredis`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }
  return { bullmq, ioredis };
}

async function startRedisContainer(image: string): Promise<{
  url: string;
  stop: () => Promise<void>;
}> {
  let container: RedisContainer;
  try {
    const testcontainers = (await import('testcontainers')) as unknown as {
      GenericContainer: new (image: string) => RedisContainer;
    };
    container = new testcontainers.GenericContainer(image).withExposedPorts(6379);
  } catch (caught) {
    throw new Error(
      "@kiwa/queue: testcontainers mode requires the 'testcontainers' peer dependency. Install with `pnpm add -D testcontainers`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }
  const started = await container.start();
  const url = `redis://${started.getHost()}:${started.getMappedPort(6379)}`;
  return {
    url,
    stop: async () => {
      await started.stop();
    },
  };
}

/**
 * Build a testcontainers-backed BullMQ environment. Requires Docker; the real
 * bullmq + ioredis peers do the heavy lifting so semantic drift from prod is
 * limited to whatever bullmq itself abstracts.
 */
export async function createTestcontainersBullMQEnv(
  opts: SetupBullMQEnvOptions & { queueName: string },
): Promise<BullMQTestEnv<'live'>> {
  const { bullmq, ioredis } = await loadPeers();
  let containerStop: (() => Promise<void>) | null = null;
  let redisUrl: string;
  if (opts.redis?.url) {
    redisUrl = opts.redis.url;
  } else {
    const image = opts.redis?.image ?? 'redis:7-alpine';
    const container = await startRedisContainer(image);
    redisUrl = container.url;
    containerStop = container.stop;
  }

  const RedisCtor = ioredis.default;
  const connection = new RedisCtor(redisUrl, { maxRetriesPerRequest: null });
  const queue = new bullmq.Queue(opts.queueName, { connection });

  let processor: JobProcessor | null = null;
  let worker: { close: () => Promise<void> } | null = null;
  let workerConnection: {
    quit: () => Promise<unknown>;
    disconnect: () => void;
  } | null = null;

  function registerProcessor(next: JobProcessor): void {
    processor = next;
    if (worker) {
      // Fire-and-forget close of the previous worker — swallowing the error
      // keeps registerProcessor synchronous but prevents an unhandled
      // rejection if BullMQ throws during the teardown handshake.
      worker.close().catch(() => {});
      worker = null;
    }
    if (workerConnection) {
      workerConnection.quit().catch(() => workerConnection?.disconnect());
      workerConnection = null;
    }
    workerConnection = new RedisCtor(redisUrl, { maxRetriesPerRequest: null });
    worker = new bullmq.Worker(
      opts.queueName,
      async (job) => {
        if (!processor) return undefined;
        const snapshot: QueueJobSnapshot = {
          id: job.id ?? '',
          name: job.name,
          data: job.data,
          state: 'active',
          attemptsMade: job.attemptsMade,
        };
        return processor(snapshot);
      },
      { connection: workerConnection, concurrency: 1 },
    );
  }

  async function fetchSnapshot(
    name: string,
    states: string[] = ['completed', 'failed', 'wait', 'active', 'delayed'],
  ): Promise<QueueJobSnapshot | null> {
    const jobs = await queue.getJobs(states);
    // Prefer terminal-state jobs so callers observe the final outcome, not an
    // in-flight snapshot.
    const preferred = jobs.filter((j) => j.name === name);
    if (preferred.length === 0) return null;
    // Pick the first matching job, preferring completed / failed states.
    const terminal = await pickTerminal(preferred);
    return terminal;
  }

  async function pickTerminal(
    candidates: Array<{
      id?: string;
      name: string;
      data: unknown;
      attemptsMade: number;
      returnvalue?: unknown;
      failedReason?: string;
      getState: () => Promise<string>;
    }>,
  ): Promise<QueueJobSnapshot | null> {
    // Read all state values in parallel to avoid N sequential BullMQ round-trips.
    const withState = await Promise.all(
      candidates.map(async (candidate) => {
        const state = await candidate.getState();
        return { candidate, state };
      }),
    );
    const completed = withState.find((entry) => entry.state === 'completed');
    if (completed) return snapshotFromBullMQ(completed.candidate, completed.state);
    const failed = withState.find((entry) => entry.state === 'failed');
    if (failed) return snapshotFromBullMQ(failed.candidate, failed.state);
    const first = withState[0];
    if (!first) return null;
    return snapshotFromBullMQ(first.candidate, first.state);
  }

  function snapshotFromBullMQ(
    job: {
      id?: string;
      name: string;
      data: unknown;
      attemptsMade: number;
      returnvalue?: unknown;
      failedReason?: string;
    },
    state: string,
  ): QueueJobSnapshot {
    const snap: QueueJobSnapshot = {
      id: job.id ?? '',
      name: job.name,
      data: job.data,
      state: normaliseState(state),
      attemptsMade: job.attemptsMade,
    };
    if (job.returnvalue !== undefined) snap.returnValue = job.returnvalue;
    if (job.failedReason !== undefined) snap.failedReason = job.failedReason;
    return snap;
  }

  function normaliseState(state: string): QueueJobSnapshot['state'] {
    if (state === 'wait' || state === 'waiting') return 'waiting';
    if (state === 'active') return 'active';
    if (state === 'completed') return 'completed';
    if (state === 'failed') return 'failed';
    if (state === 'delayed') return 'delayed';
    return 'waiting';
  }

  const env: BullMQTestEnv<'live'> = {
    mode: 'live',
    backend: 'testcontainers',
    queueName: opts.queueName,
    redisUrl,
    process: (next) => registerProcessor(next as unknown as JobProcessor),
    async addJob(name, data, addOpts) {
      const jobOpts: { attempts?: number; delay?: number; jobId?: string } = {};
      if (addOpts?.attempts !== undefined) jobOpts.attempts = addOpts.attempts;
      if (addOpts?.delay !== undefined) jobOpts.delay = addOpts.delay;
      if (addOpts?.jobId !== undefined) jobOpts.jobId = addOpts.jobId;
      const enq = await queue.add(name, data, jobOpts);
      return {
        id: enq.id ?? '',
        name: enq.name,
        data: enq.data as typeof data,
        state: 'waiting',
        attemptsMade: 0,
      };
    },
    waitForJob: (async <TData, TResult>(
      name: string,
      waitOpts?: { timeoutMs?: number | undefined },
    ): Promise<QueueJobSnapshot<TData, TResult>> => {
      const timeoutMs = waitOpts?.timeoutMs ?? 5000;
      const deadline = Date.now() + timeoutMs;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const snap = await fetchSnapshot(name);
        if (snap && (snap.state === 'completed' || snap.state === 'failed')) {
          return snap as QueueJobSnapshot<TData, TResult>;
        }
        if (Date.now() > deadline) {
          throw new Error(
            `waitForJob: timeout waiting for job "${name}" after ${timeoutMs}ms`,
          );
        }
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 25);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
    }) as BullMQTestEnv<'live'>['waitForJob'],
    assertProcessed: (async <TData, TResult>(
      name: string,
      expected?: { returnValue?: TResult | undefined } | undefined,
    ): Promise<QueueJobSnapshot<TData, TResult>> => {
      const snap = await env.waitForJob<TData, TResult>(name);
      if (snap.state !== 'completed') {
        throw new Error(
          `assertProcessed: expected job "${name}" to complete, got state=${snap.state}`,
        );
      }
      if (expected?.returnValue !== undefined) {
        const actual = JSON.stringify(snap.returnValue);
        const wanted = JSON.stringify(expected.returnValue);
        if (actual !== wanted) {
          throw new Error(
            `assertProcessed: return value mismatch for "${name}". expected=${wanted} actual=${actual}`,
          );
        }
      }
      return snap;
    }) as BullMQTestEnv<'live'>['assertProcessed'],
    assertFailed: (async <TData>(
      name: string,
      expected?: { retry?: number | undefined; reasonMatch?: RegExp | undefined } | undefined,
    ): Promise<QueueJobSnapshot<TData>> => {
      const snap = await env.waitForJob<TData>(name);
      if (snap.state !== 'failed') {
        throw new Error(
          `assertFailed: expected job "${name}" to fail, got state=${snap.state}`,
        );
      }
      if (expected?.retry !== undefined && snap.attemptsMade !== expected.retry) {
        throw new Error(
          `assertFailed: expected ${expected.retry} attempt(s), observed ${snap.attemptsMade}`,
        );
      }
      if (expected?.reasonMatch && !expected.reasonMatch.test(snap.failedReason ?? '')) {
        throw new Error(
          `assertFailed: failedReason "${snap.failedReason ?? ''}" did not match ${expected.reasonMatch}`,
        );
      }
      return snap;
    }) as BullMQTestEnv<'live'>['assertFailed'],
    assertRetried: (async <TData>(
      name: string,
      expectedRetry: number,
    ): Promise<QueueJobSnapshot<TData>> => {
      const snap = await env.waitForJob<TData>(name);
      if (snap.attemptsMade !== expectedRetry) {
        throw new Error(
          `assertRetried: expected ${expectedRetry} attempt(s) for "${name}", observed ${snap.attemptsMade}`,
        );
      }
      return snap;
    }) as BullMQTestEnv<'live'>['assertRetried'],
    async assertQueueDrained() {
      for (let i = 0; i < 40; i += 1) {
        const [waiting, active, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getDelayedCount(),
        ]);
        if (waiting + active + delayed === 0) return;
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 25);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
      throw new Error(
        'assertQueueDrained: queue still has waiting / active / delayed jobs after 1s',
      );
    },
    listJobs() {
      // Live introspection would require a round-trip, which is out of shape for
      // the synchronous listJobs signature. Suites that need live snapshots
      // should call `waitForJob` for the targeted job name.
      return [];
    },
    async stop() {
      if (worker) {
        await worker.close();
        worker = null;
      }
      if (workerConnection) {
        await workerConnection.quit().catch(() => {
          workerConnection?.disconnect();
        });
        workerConnection = null;
      }
      await queue.close();
      await connection.quit().catch(() => {
        connection.disconnect();
      });
      if (containerStop) {
        await containerStop();
        containerStop = null;
      }
    },
  };
  return env;
}
