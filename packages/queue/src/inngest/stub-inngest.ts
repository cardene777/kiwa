import type {
  InngestEvent,
  InngestFunctionDefinition,
  InngestFunctionHandler,
  InngestRunSnapshot,
  InngestRunState,
  InngestStepContext,
  InngestTestEnv,
  SetupInngestEnvOptions,
} from './types.js';

/**
 * Internal run record — mutable snapshot the assertion helpers observe. Kept
 * separate from `InngestRunSnapshot` so the public surface stays read-only.
 */
interface StubRun<TData = unknown, TResult = unknown> {
  runId: string;
  functionId: string;
  event: InngestEvent<TData>;
  state: InngestRunState;
  attemptsMade: number;
  returnValue?: TResult | undefined;
  failedReason?: string | undefined;
  stepsRun: string[];
}

function snapshotOf<TData, TResult>(
  run: StubRun<TData, TResult>,
): InngestRunSnapshot<TData, TResult> {
  const snap: InngestRunSnapshot<TData, TResult> = {
    runId: run.runId,
    functionId: run.functionId,
    event: run.event,
    state: run.state,
    attemptsMade: run.attemptsMade,
    stepsRun: [...run.stepsRun],
  };
  if (run.returnValue !== undefined) snap.returnValue = run.returnValue;
  if (run.failedReason !== undefined) snap.failedReason = run.failedReason;
  return snap;
}

/**
 * Build a stub (offline, in-process) Inngest env. Deterministic enough to
 * exercise the retry / step / concurrency semantics needed by unit tests
 * without spinning up a real dev-server.
 */
export function createStubInngestEnv(
  opts: SetupInngestEnvOptions & { appId: string },
): InngestTestEnv<'mock'> {
  const functions = new Map<string, InngestFunctionDefinition>();
  const runs = new Map<string, StubRun>();
  const runsInProgress = new Map<string, Set<string>>(); // functionId → runIds active/queued (concurrency accounting)
  const runQueues = new Map<string, StubRun[]>(); // functionId → queued runs waiting for a concurrency slot
  const inflightPromises: Promise<void>[] = [];
  let runCounter = 0;
  let eventCounter = 0;
  let stopped = false;

  for (const fn of opts.functions ?? []) registerFunction(fn);

  function registerFunction(fn: InngestFunctionDefinition): void {
    // Overwrite same-id registrations — matches the intent of "replace the
    // previously registered definition" without leaking stale handlers.
    functions.set(fn.id, fn);
  }

  function assertNotStopped(): void {
    if (stopped) throw new Error('setupInngestEnv: cannot use env after stop()');
  }

  function nextEventId(): string {
    eventCounter += 1;
    return `evt-${eventCounter}`;
  }

  function nextRunId(): string {
    runCounter += 1;
    return `run-${runCounter}`;
  }

  async function runHandlerOnce<TData, TResult>(
    fn: InngestFunctionDefinition<TData, TResult>,
    run: StubRun<TData, TResult>,
    isLastAttempt: boolean,
  ): Promise<void> {
    run.state = 'running';
    run.attemptsMade += 1;
    // Clear previously observed steps at the start of each attempt so retries
    // observe a fresh execution trace — matches real Inngest semantics where
    // memoized step outputs are only replayed inside a single run.
    run.stepsRun = [];
    const step: InngestStepContext = {
      async run<T>(stepId: string, body: () => Promise<T> | T): Promise<T> {
        run.stepsRun.push(stepId);
        return body();
      },
      async sleep(stepId: string, _ms: number): Promise<void> {
        // Stub mode does not advance real time — sleeps only record the step so
        // tests can assert step ordering. `_ms` is retained in the API for
        // parity with real Inngest.
        run.stepsRun.push(stepId);
      },
    };
    try {
      const handler = fn.handler as InngestFunctionHandler<TData, TResult>;
      const result = await handler({ event: run.event, step, attempt: run.attemptsMade });
      run.state = 'completed';
      run.returnValue = result;
      run.failedReason = undefined;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      run.failedReason = reason;
      // Only expose the terminal `failed` state on the last attempt — earlier
      // failures keep the run in `queued` so waitForRun / assertFunctionRan do
      // not race with the retry scheduler.
      run.state = isLastAttempt ? 'failed' : 'queued';
    }
  }

  async function drainQueueFor(functionId: string): Promise<void> {
    const queue = runQueues.get(functionId);
    if (!queue || queue.length === 0) return;
    const inflight = runsInProgress.get(functionId) ?? new Set<string>();
    runsInProgress.set(functionId, inflight);
    const fn = functions.get(functionId);
    if (!fn) return;
    const cap = fn.concurrency ?? Number.POSITIVE_INFINITY;
    // Kick off as many runs as the concurrency slot allows.
    while (queue.length > 0 && inflight.size < cap) {
      const nextRun = queue.shift();
      if (!nextRun) break;
      inflight.add(nextRun.runId);
      const attempts = fn.retries ?? 1;
      const runPromise = (async () => {
        try {
          for (let attempt = 0; attempt < attempts; attempt += 1) {
            const isLastAttempt = attempt === attempts - 1;
            await runHandlerOnce(fn, nextRun, isLastAttempt);
            if (nextRun.state === 'completed') break;
          }
        } finally {
          inflight.delete(nextRun.runId);
          // Free the slot — kick the queue in case more work piled up.
          await drainQueueFor(functionId);
        }
      })();
      inflightPromises.push(runPromise);
    }
  }

  async function dispatchEvent(event: InngestEvent): Promise<void> {
    // Find every function that matches the event name.
    const matching = Array.from(functions.values()).filter((fn) => fn.event === event.name);
    for (const fn of matching) {
      const run: StubRun = {
        runId: nextRunId(),
        functionId: fn.id,
        event,
        state: 'queued',
        attemptsMade: 0,
        stepsRun: [],
      };
      runs.set(run.runId, run);
      const queue = runQueues.get(fn.id) ?? [];
      queue.push(run);
      runQueues.set(fn.id, queue);
    }
    // Drain each affected function's queue outside the registration loop so a
    // concurrency-bound function does not stall subsequent registrations.
    for (const fn of matching) {
      // eslint-disable-next-line no-await-in-loop
      await drainQueueFor(fn.id);
    }
  }

  const env: InngestTestEnv<'mock'> = {
    mode: 'mock',
    backend: 'stub',
    appId: opts.appId,
    devServerUrl: undefined,
    registerFunction(fn) {
      assertNotStopped();
      registerFunction(fn as InngestFunctionDefinition);
    },
    async sendEvent<TData>(name: string, data: TData): Promise<string> {
      assertNotStopped();
      const event: InngestEvent<TData> = {
        name,
        data,
        id: nextEventId(),
        ts: Date.now(),
      };
      await dispatchEvent(event);
      return event.id ?? '';
    },
    waitForRun: (async <TData, TResult>(
      functionId: string,
      waitOpts?: { timeoutMs?: number | undefined },
    ): Promise<InngestRunSnapshot<TData, TResult>> => {
      const timeoutMs = waitOpts?.timeoutMs ?? 5000;
      const deadline = Date.now() + timeoutMs;
      while (true) {
        for (const run of runs.values()) {
          if (
            run.functionId === functionId &&
            (run.state === 'completed' || run.state === 'failed' || run.state === 'cancelled')
          ) {
            return snapshotOf(run) as InngestRunSnapshot<TData, TResult>;
          }
        }
        if (Date.now() > deadline) {
          throw new Error(
            `waitForRun: timeout waiting for function "${functionId}" after ${timeoutMs}ms`,
          );
        }
        // Give any inflight promise a tick to progress before re-polling.
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 5);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
    }) as InngestTestEnv<'mock'>['waitForRun'],
    assertFunctionRan: (async <TData, TResult>(
      functionId: string,
      expected?: { returnValue?: TResult | undefined } | undefined,
    ): Promise<InngestRunSnapshot<TData, TResult>> => {
      const snap = await env.waitForRun<TData, TResult>(functionId);
      if (snap.state !== 'completed') {
        throw new Error(
          `assertFunctionRan: expected function "${functionId}" to complete, got state=${snap.state} reason=${snap.failedReason ?? 'unknown'}`,
        );
      }
      if (expected?.returnValue !== undefined) {
        const actual = JSON.stringify(snap.returnValue);
        const wanted = JSON.stringify(expected.returnValue);
        if (actual !== wanted) {
          throw new Error(
            `assertFunctionRan: return value mismatch for "${functionId}". expected=${wanted} actual=${actual}`,
          );
        }
      }
      return snap;
    }) as InngestTestEnv<'mock'>['assertFunctionRan'],
    assertFunctionFailed: (async <TData>(
      functionId: string,
      expected?:
        | { attempts?: number | undefined; reasonMatch?: RegExp | undefined }
        | undefined,
    ): Promise<InngestRunSnapshot<TData>> => {
      const snap = await env.waitForRun<TData>(functionId);
      if (snap.state !== 'failed') {
        throw new Error(
          `assertFunctionFailed: expected function "${functionId}" to fail, got state=${snap.state}`,
        );
      }
      if (expected?.attempts !== undefined && snap.attemptsMade !== expected.attempts) {
        throw new Error(
          `assertFunctionFailed: expected ${expected.attempts} attempt(s), observed ${snap.attemptsMade}`,
        );
      }
      if (expected?.reasonMatch && !expected.reasonMatch.test(snap.failedReason ?? '')) {
        throw new Error(
          `assertFunctionFailed: failedReason "${snap.failedReason ?? ''}" did not match ${expected.reasonMatch}`,
        );
      }
      return snap;
    }) as InngestTestEnv<'mock'>['assertFunctionFailed'],
    assertRetried: (async <TData>(
      functionId: string,
      expectedAttempts: number,
    ): Promise<InngestRunSnapshot<TData>> => {
      const snap = await env.waitForRun<TData>(functionId);
      if (snap.attemptsMade !== expectedAttempts) {
        throw new Error(
          `assertRetried: expected ${expectedAttempts} attempt(s) for "${functionId}", observed ${snap.attemptsMade}`,
        );
      }
      return snap;
    }) as InngestTestEnv<'mock'>['assertRetried'],
    assertStepRan: (async <TData>(
      functionId: string,
      stepId: string,
    ): Promise<InngestRunSnapshot<TData>> => {
      const snap = await env.waitForRun<TData>(functionId);
      if (!snap.stepsRun.includes(stepId)) {
        throw new Error(
          `assertStepRan: expected step "${stepId}" to run in function "${functionId}", observed steps=${JSON.stringify(snap.stepsRun)}`,
        );
      }
      return snap;
    }) as InngestTestEnv<'mock'>['assertStepRan'],
    async assertQueueDrained() {
      // Poll the pending count for ~250ms — a long-running handler holding a
      // slot open causes the throw here, which is the whole point of the
      // helper.
      for (let i = 0; i < 50; i += 1) {
        let pending = 0;
        for (const run of runs.values()) {
          if (run.state === 'queued' || run.state === 'running') pending += 1;
        }
        if (pending === 0) return;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 5);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
      }
      throw new Error(
        'assertQueueDrained: env still has queued / running runs after 250ms',
      );
    },
    listRuns() {
      return Array.from(runs.values()).map((run) => snapshotOf(run));
    },
    async stop() {
      stopped = true;
      // We deliberately do not await inflightPromises here — a long-running
      // handler is exactly the scenario `assertQueueDrained` tests, and
      // blocking teardown on it would deadlock afterEach cleanup. The runs
      // themselves become unreachable once the maps are cleared.
      functions.clear();
      runs.clear();
      runsInProgress.clear();
      runQueues.clear();
      inflightPromises.length = 0;
    },
  };
  return env;
}
