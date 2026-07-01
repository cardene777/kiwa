import type {
  BullMQTestEnv,
  JobProcessor,
  JobState,
  QueueJobSnapshot,
  SetupBullMQEnvOptions,
} from './types.js';

/**
 * Internal representation of a queued job. The waiting → active → completed |
 * failed transitions are driven by the sandbox scheduler; retries push the job
 * back to `waiting` until `attemptsMade` reaches `attempts`.
 */
interface SandboxJob<TData = unknown, TResult = unknown> {
  id: string;
  name: string;
  data: TData;
  attempts: number;
  attemptsMade: number;
  state: JobState;
  runAfter: number;
  returnValue?: TResult | undefined;
  failedReason?: string | undefined;
}

function snapshotOf<TData, TResult>(
  job: SandboxJob<TData, TResult>,
): QueueJobSnapshot<TData, TResult> {
  const snap: QueueJobSnapshot<TData, TResult> = {
    id: job.id,
    name: job.name,
    data: job.data,
    state: job.state,
    attemptsMade: job.attemptsMade,
  };
  if (job.returnValue !== undefined) snap.returnValue = job.returnValue;
  if (job.failedReason !== undefined) snap.failedReason = job.failedReason;
  return snap;
}

/**
 * Build a sandbox (offline, in-process) BullMQ-shaped queue. Suitable for unit
 * tests that need to exercise the job lifecycle (add / process / retry / fail
 * / drain) without spinning up a Redis container.
 */
export function createSandboxBullMQEnv(
  opts: SetupBullMQEnvOptions & { queueName: string },
): BullMQTestEnv<'mock'> {
  const pollIntervalMs = opts.sandbox?.pollIntervalMs ?? 1;
  const jobs = new Map<string, SandboxJob>();
  let processor: JobProcessor | null = null;
  let jobCounter = 0;
  let running = true;
  let stopped = false;
  let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
  const inflight = new Set<string>();

  async function runJob(job: SandboxJob): Promise<void> {
    if (!processor) return;
    if (inflight.has(job.id)) return;
    inflight.add(job.id);
    job.state = 'active';
    job.attemptsMade += 1;
    try {
      const result = await processor(snapshotOf(job));
      job.state = 'completed';
      job.returnValue = result;
      job.failedReason = undefined;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      if (job.attemptsMade < job.attempts) {
        // Requeue for another attempt — sandbox has no backoff jitter, which
        // keeps the tests deterministic.
        job.state = 'waiting';
        job.failedReason = reason;
        job.runAfter = Date.now();
      } else {
        job.state = 'failed';
        job.failedReason = reason;
      }
    } finally {
      inflight.delete(job.id);
    }
  }

  function scheduleTick(): void {
    if (!running || schedulerTimer !== null) return;
    schedulerTimer = setTimeout(() => {
      schedulerTimer = null;
      // The scheduler tick catches processor exceptions inside runJob and
      // never rethrows, so this .catch is a defensive guard only — it prevents
      // an unhandled rejection if a future refactor lets the tick throw.
      tick().catch(() => {});
    }, pollIntervalMs);
    // Timers scheduled with setTimeout keep the Node.js event loop alive by
    // default, which can prevent Vitest from exiting. `unref()` opts the timer
    // out of that behaviour without changing test semantics.
    if (typeof schedulerTimer === 'object' && schedulerTimer !== null) {
      (schedulerTimer as { unref?: () => void }).unref?.();
    }
  }

  async function tick(): Promise<void> {
    if (!running) return;
    const now = Date.now();
    const runnable: SandboxJob[] = [];
    for (const job of jobs.values()) {
      if (job.state === 'waiting' && job.runAfter <= now) {
        runnable.push(job);
      }
    }
    // Sort by id so the scheduler is deterministic under identical timestamps.
    runnable.sort((a, b) => a.id.localeCompare(b.id, 'en'));
    if (runnable.length === 0) {
      if (hasPending()) scheduleTick();
      return;
    }
    // Run sequentially — BullMQ workers with `concurrency=1` behave the same
    // way. Concurrency > 1 is out of scope for the v0.1 sandbox.
    for (const job of runnable) {
      if (!running) break;
      // eslint-disable-next-line no-await-in-loop
      await runJob(job);
    }
    if (hasPending()) scheduleTick();
  }

  function hasPending(): boolean {
    for (const job of jobs.values()) {
      if (job.state === 'waiting' || job.state === 'delayed' || job.state === 'active') {
        return true;
      }
    }
    return false;
  }

  const env: BullMQTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'sandbox',
    queueName: opts.queueName,
    redisUrl: undefined,
    process(next) {
      processor = next as unknown as JobProcessor;
      scheduleTick();
    },
    async addJob(name, data, options) {
      if (stopped) throw new Error('setupBullMQEnv: cannot addJob after stop()');
      jobCounter += 1;
      const id = options?.jobId ?? String(jobCounter);
      const attempts = options?.attempts ?? 1;
      const delay = options?.delay ?? 0;
      if (attempts < 1) {
        throw new Error('addJob: attempts must be at least 1');
      }
      if (delay < 0) {
        throw new Error('addJob: delay must be non-negative');
      }
      const runAfter = Date.now() + delay;
      const job: SandboxJob<typeof data> = {
        id,
        name,
        data,
        attempts,
        attemptsMade: 0,
        state: delay > 0 ? 'delayed' : 'waiting',
        runAfter,
      };
      jobs.set(id, job as unknown as SandboxJob);
      // A delayed job stays in `delayed` state until its runAfter is due;
      // the scheduler picks it up on the next tick.
      if (delay > 0) {
        setTimeout(() => {
          const stored = jobs.get(id);
          if (stored && stored.state === 'delayed') {
            stored.state = 'waiting';
            scheduleTick();
          }
        }, delay).unref?.();
      }
      scheduleTick();
      return snapshotOf(job);
    },
    waitForJob: (async <TData, TResult>(
      name: string,
      waitOpts?: { timeoutMs?: number | undefined },
    ): Promise<QueueJobSnapshot<TData, TResult>> => {
      const timeoutMs = waitOpts?.timeoutMs ?? 5000;
      const deadline = Date.now() + timeoutMs;
      // First, check if a terminal-state job already exists.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        for (const job of jobs.values()) {
          if (
            job.name === name &&
            (job.state === 'completed' || job.state === 'failed')
          ) {
            return snapshotOf(job) as QueueJobSnapshot<TData, TResult>;
          }
        }
        if (Date.now() > deadline) {
          throw new Error(
            `waitForJob: timeout waiting for job "${name}" after ${timeoutMs}ms`,
          );
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, Math.min(10, pollIntervalMs * 5));
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
    }) as BullMQTestEnv<'mock'>['waitForJob'],
    assertProcessed: (async <TData, TResult>(
      name: string,
      expected?: { returnValue?: TResult | undefined } | undefined,
    ): Promise<QueueJobSnapshot<TData, TResult>> => {
      const snap = await env.waitForJob<TData, TResult>(name);
      if (snap.state !== 'completed') {
        throw new Error(
          `assertProcessed: expected job "${name}" to complete, got state=${snap.state} reason=${snap.failedReason ?? 'unknown'}`,
        );
      }
      if (expected?.returnValue !== undefined) {
        // JSON compare — snapshots are structurally cloned already.
        const actual = JSON.stringify(snap.returnValue);
        const wanted = JSON.stringify(expected.returnValue);
        if (actual !== wanted) {
          throw new Error(
            `assertProcessed: return value mismatch for "${name}". expected=${wanted} actual=${actual}`,
          );
        }
      }
      return snap;
    }) as BullMQTestEnv<'mock'>['assertProcessed'],
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
    }) as BullMQTestEnv<'mock'>['assertFailed'],
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
    }) as BullMQTestEnv<'mock'>['assertRetried'],
    async assertQueueDrained() {
      // Give the scheduler a beat to catch up in case the caller invokes
      // assertQueueDrained immediately after addJob.
      for (let i = 0; i < 50; i += 1) {
        if (!hasPending()) return;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 5);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
      throw new Error(
        'assertQueueDrained: queue still has waiting / active jobs after 250ms',
      );
    },
    listJobs() {
      return Array.from(jobs.values()).map((job) => snapshotOf(job));
    },
    async stop() {
      running = false;
      stopped = true;
      if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
      }
      jobs.clear();
      processor = null;
    },
  };
  return env;
}
