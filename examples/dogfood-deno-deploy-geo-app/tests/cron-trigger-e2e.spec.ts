/**
 * Cron trigger e2e spec (cron-trigger axis focus).
 *
 * Sub-Issue GH-917 (v1.24-4) AC — Deno Deploy Cron scheduled trigger +
 * queue trigger paths. Covers the cron-trigger axis (scheduleCron +
 * startCron + completeCron + failCron) end-to-end.
 *
 * Fidelity axes covered here:
 *  1. `scheduled` trigger fires the handler at the scheduled tick.
 *  2. `queue` trigger fires the handler via a queue payload.
 *  3. Successful completion transitions the session to `completed`.
 *  4. Failure with retries remaining transitions the session to
 *     `scheduled` (re-enqueued) and reports `willRetry=true`.
 *  5. Failure with retries exhausted transitions to `failed` with
 *     `willRetry=false`.
 *  6. Scheduling the same id twice throws `DENO_DEPLOY_CRON_ID_TAKEN`.
 *  7. Completing an unscheduled id throws `DENO_DEPLOY_CRON_NOT_FOUND`.
 *  8. Invalid cron spec (< 5 fields) throws at normalizeCronSpec.
 *  9. `/api/cron` POST + DELETE routes drive the adapter end-to-end.
 * 10. `cron/purge-job.ts` runs the retention purge lifecycle end-to-end.
 * 11. Metrics counters + latency samples accumulate on every op.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';
import { normalizeCronSpec } from '../src/lib/deno-adapter.js';
import { handleCronComplete, handleCronSchedule } from '../src/routes/api/cron.js';
import { runPurgeJob } from '../src/cron/purge-job.js';

describe('mock adapter — Deno Deploy Cron trigger', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: scheduled trigger fires the handler; state transitions to running', async () => {
    const snapshot = await adapter.driveCronSchedule({
      id: 'cron-scheduled-1',
      cronSpec: '0 0 * * *',
      triggerType: 'scheduled',
    });
    expect(snapshot.id).toBe('cron-scheduled-1');
    expect(snapshot.triggerType).toBe('scheduled');
    expect(snapshot.cronSpec).toBe('0 0 * * *');
    expect(snapshot.state).toBe('running');
  });

  it('axis 2: queue trigger fires the handler; triggerType is queue', async () => {
    const snapshot = await adapter.driveCronSchedule({
      id: 'cron-queue-1',
      cronSpec: '*/5 * * * *',
      triggerType: 'queue',
    });
    expect(snapshot.triggerType).toBe('queue');
    expect(snapshot.state).toBe('running');
  });

  it('axis 3: successful completion transitions to completed', async () => {
    await adapter.driveCronSchedule({
      id: 'cron-complete-1',
      cronSpec: '0 0 * * *',
    });
    const result = await adapter.driveCronComplete({
      id: 'cron-complete-1',
      outcome: 'success',
      durationMs: 42,
    });
    expect('finalState' in result && result.finalState).toBe('completed');
    expect('durationMs' in result && result.durationMs).toBe(42);
    expect(result.retryCount).toBe(0);
  });

  it('axis 4: failure with retries remaining re-enqueues (nextState=scheduled)', async () => {
    await adapter.driveCronSchedule({
      id: 'cron-retry-1',
      cronSpec: '0 0 * * *',
      maxRetries: 3,
    });
    const result = await adapter.driveCronComplete({
      id: 'cron-retry-1',
      outcome: 'failure',
      durationMs: 10,
      reason: 'transient network failure',
    });
    expect('willRetry' in result && result.willRetry).toBe(true);
    expect('nextState' in result && result.nextState).toBe('scheduled');
    expect(result.retryCount).toBe(1);
  });

  it('axis 5: failure with retries exhausted transitions to failed', async () => {
    await adapter.driveCronSchedule({
      id: 'cron-exhaust-1',
      cronSpec: '0 0 * * *',
      maxRetries: 1,
    });
    const result = await adapter.driveCronComplete({
      id: 'cron-exhaust-1',
      outcome: 'failure',
      durationMs: 10,
      reason: 'permanent failure',
    });
    // maxRetries=1 → retryCount=1 == maxRetries → willRetry=false → failed.
    expect('willRetry' in result && result.willRetry).toBe(false);
    expect('nextState' in result && result.nextState).toBe('failed');
    expect(result.retryCount).toBe(1);
  });

  it('axis 6: scheduling the same id twice throws DENO_DEPLOY_CRON_ID_TAKEN', async () => {
    await adapter.driveCronSchedule({
      id: 'cron-dup-1',
      cronSpec: '0 0 * * *',
    });
    await expect(
      adapter.driveCronSchedule({
        id: 'cron-dup-1',
        cronSpec: '0 0 * * *',
      }),
    ).rejects.toThrow(/already scheduled/);
    const traces = adapter.traces();
    const failed = traces.filter(
      (t) => t.op === 'driveCronSchedule' && !t.ok,
    );
    expect(failed.length).toBeGreaterThanOrEqual(1);
    expect(failed.some((t) => t.errorKind === 'DENO_DEPLOY_CRON_ID_TAKEN')).toBe(
      true,
    );
  });

  it('axis 7: completing an unscheduled id throws DENO_DEPLOY_CRON_NOT_FOUND', async () => {
    await expect(
      adapter.driveCronComplete({
        id: 'cron-missing',
        outcome: 'success',
        durationMs: 10,
      }),
    ).rejects.toThrow(/not scheduled/);
    const failed = adapter
      .traces()
      .filter((t) => t.op === 'driveCronComplete' && !t.ok);
    expect(failed.some((t) => t.errorKind === 'DENO_DEPLOY_CRON_NOT_FOUND')).toBe(
      true,
    );
  });

  it('axis 8: invalid cron spec (< 5 fields) throws at normalizeCronSpec', () => {
    expect(() => normalizeCronSpec('0 0 *')).toThrow(/5 space-separated fields/);
    expect(() => normalizeCronSpec('0 0 * * * *')).toThrow(
      /5 space-separated fields/,
    );
    expect(normalizeCronSpec('0 0 * * *')).toBe('0 0 * * *');
    // Whitespace collapses.
    expect(normalizeCronSpec('  0   0  *  *  *  ')).toBe('0 0 * * *');
  });

  it('axis 9: /api/cron POST + DELETE routes drive the adapter end-to-end', async () => {
    const schedule = await handleCronSchedule(adapter, {
      id: 'cron-route-1',
      cronSpec: '0 0 * * *',
      triggerType: 'scheduled',
    });
    expect(schedule.status).toBe(202);
    expect(schedule.body.ok).toBe(true);
    expect(schedule.body.state).toBe('running');
    const complete = await handleCronComplete(adapter, {
      id: 'cron-route-1',
      outcome: 'success',
      durationMs: 100,
    });
    expect(complete.status).toBe(200);
    expect(complete.body.finalState).toBe('completed');
    expect(complete.body.retryCount).toBe(0);
  });

  it('axis 9b: /api/cron DELETE with outcome=failure surfaces willRetry + finalState=scheduled', async () => {
    await handleCronSchedule(adapter, {
      id: 'cron-route-fail',
      cronSpec: '0 0 * * *',
      maxRetries: 3,
    });
    const complete = await handleCronComplete(adapter, {
      id: 'cron-route-fail',
      outcome: 'failure',
      durationMs: 20,
      reason: 'retry-me',
    });
    expect(complete.body.willRetry).toBe(true);
    expect(complete.body.finalState).toBe('scheduled');
    expect(complete.body.reason).toBe('retry-me');
  });

  it('axis 10: runPurgeJob completes the retention-purge lifecycle', async () => {
    // Seed some retention keys the purge job will enumerate.
    await adapter.driveKvWrite({ key: 'retention:20260702:x', value: '1' });
    await adapter.driveKvWrite({ key: 'retention:20260703:y', value: '2' });
    // Non-retention keys must not be enumerated.
    await adapter.driveKvWrite({ key: 'session:z', value: '3' });
    const result = await runPurgeJob(adapter, {
      cronId: 'purge-run-1',
      startedAt: Date.now(),
    });
    expect(result.cronId).toBe('purge-run-1');
    expect(result.finalState).toBe('completed');
    expect(result.keysEnumerated).toBe(2);
  });

  it('axis 10b: runPurgeJob with forceFailure surfaces the retry decision', async () => {
    const result = await runPurgeJob(adapter, {
      cronId: 'purge-fail-1',
      forceFailure: true,
      startedAt: Date.now(),
    });
    // maxRetries default=3, first failure → willRetry=true → finalState=scheduled.
    expect(result.finalState).toBe('scheduled');
  });

  it('axis 10c: runPurgeJob queue-trigger variant fires on a queue payload', async () => {
    const result = await runPurgeJob(adapter, {
      cronId: 'purge-queue-1',
      triggerType: 'queue',
      startedAt: Date.now(),
    });
    expect(result.finalState).toBe('completed');
    // The schedule trace records triggerType=queue for the queue-triggered
    // variant so downstream fidelity accounting can distinguish the paths.
    const traces = adapter.traces();
    const schedule = traces.find(
      (t) => t.op === 'driveCronSchedule' && t.ok,
    );
    expect((schedule?.detail?.['triggerType'] as string)).toBe('queue');
  });

  it('axis 11: metrics counters + latency samples accumulate on every op', async () => {
    await adapter.driveCronSchedule({
      id: 'metrics-cron-1',
      cronSpec: '0 0 * * *',
    });
    await adapter.driveCronComplete({
      id: 'metrics-cron-1',
      outcome: 'success',
      durationMs: 50,
    });
    const m = adapter.metrics();
    expect(m.cronScheduleCount).toBe(1);
    expect(m.cronCompleteCount).toBe(1);
    expect(m.latencySamplesMs.length).toBe(2);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('records KIWA_DENO_DEPLOY_ENV_MISSING for cron schedule when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveCronSchedule({
        id: 'r',
        cronSpec: '0 0 * * *',
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_DENO_DEPLOY_ENV_MISSING');
  });

  it('records KIWA_DENO_DEPLOY_ENV_MISSING for cron complete when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveCronComplete({
        id: 'r',
        outcome: 'success',
        durationMs: 10,
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_DENO_DEPLOY_ENV_MISSING');
  });
});
