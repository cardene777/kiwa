/**
 * `/api/cron` Fresh route handler — Deno Deploy Cron scheduled + queue
 * trigger paths. Uses the `@kiwa-test/edge` v0.2 `cron-trigger` axis via
 * the adapter (`driveCronSchedule` + `driveCronComplete`). POST schedules
 * a cron with a 5-field spec + optional queue trigger; DELETE fires the
 * completion (success / failure with retry decision).
 *
 * Real Deno Deploy exposes `Deno.cron(name, spec, handler)` which fires
 * the handler at the scheduled tick; the queue-triggered variant uses
 * `Deno.queueListener(handler)` alongside `Deno.enqueue(payload)`. Both
 * paths share the same lifecycle (scheduled → running → completed /
 * failed) — the mock reproduces the shared observable surface without a
 * live scheduler.
 */

import type { DenoDeployAdapter } from '../../lib/deno-adapter.js';

/** Response payload for POST /api/cron (schedule). */
export interface CronSchedulePayload {
  ok: boolean;
  id: string;
  triggerType: 'scheduled' | 'queue' | 'email';
  cronSpec: string;
  state: 'scheduled' | 'running' | 'completed' | 'failed';
}

/** Response payload for DELETE /api/cron?id=... (complete). */
export interface CronCompletePayload {
  ok: boolean;
  id: string;
  /**
   * Terminal state. `completed` on success; `failed` when the retry
   * budget has been exhausted; `scheduled` when a transient failure
   * left retries remaining and the scheduler will re-fire the cron.
   */
  finalState: 'completed' | 'failed' | 'scheduled';
  durationMs: number;
  retryCount: number;
  willRetry?: boolean;
  reason?: string;
}

/**
 * Schedule a cron. Accepts a 5-field spec and an optional trigger type.
 * On success returns 202 (accepted) — Deno Deploy Cron is queued, not
 * fired immediately. The response echoes the current state which is
 * `running` in the mock (schedule + start fires on the same op boundary
 * so the axis history captures both events).
 */
export async function handleCronSchedule(
  adapter: DenoDeployAdapter,
  input: {
    id: string;
    cronSpec: string;
    triggerType?: 'scheduled' | 'queue' | 'email';
    maxRetries?: number;
  },
): Promise<{ status: number; body: CronSchedulePayload }> {
  const snapshot = await adapter.driveCronSchedule({
    id: input.id,
    cronSpec: input.cronSpec,
    triggerType: input.triggerType ?? 'scheduled',
    maxRetries: input.maxRetries ?? 3,
  });
  return {
    status: 202,
    body: {
      ok: true,
      id: snapshot.id,
      triggerType: snapshot.triggerType,
      cronSpec: snapshot.cronSpec,
      state: snapshot.state,
    },
  };
}

/**
 * Complete a scheduled cron. `outcome=success` transitions to
 * `completed`; `outcome=failure` transitions to `scheduled` if retries
 * remain, or `failed` when the retry budget is exhausted.
 */
export async function handleCronComplete(
  adapter: DenoDeployAdapter,
  input: {
    id: string;
    outcome: 'success' | 'failure';
    durationMs: number;
    reason?: string;
  },
): Promise<{ status: number; body: CronCompletePayload }> {
  // Explicit undefined would trip exactOptionalPropertyTypes on the
  // adapter signature — omit the key when the caller left it out.
  const completeInput: {
    id: string;
    outcome: 'success' | 'failure';
    durationMs: number;
    reason?: string;
  } = {
    id: input.id,
    outcome: input.outcome,
    durationMs: input.durationMs,
  };
  if (input.reason !== undefined) completeInput.reason = input.reason;
  const snapshot = await adapter.driveCronComplete(completeInput);
  // Discriminate the success vs failure snapshot on the presence of
  // `willRetry` — a completion snapshot has `finalState=completed` and
  // no retry decision; a failure snapshot always carries `willRetry`.
  if ('willRetry' in snapshot) {
    // Failure path — on `willRetry=true` the scheduler re-enqueues the
    // cron and `finalState='scheduled'` reflects the transient state;
    // when retries are exhausted `finalState='failed'` is terminal.
    const body: CronCompletePayload = {
      ok: true,
      id: snapshot.id,
      finalState: snapshot.nextState,
      durationMs: input.durationMs,
      retryCount: snapshot.retryCount,
      willRetry: snapshot.willRetry,
      reason: snapshot.reason,
    };
    return { status: 200, body };
  }
  const body: CronCompletePayload = {
    ok: true,
    id: snapshot.id,
    finalState: snapshot.finalState,
    durationMs: snapshot.durationMs,
    retryCount: snapshot.retryCount,
  };
  return {
    status: 200,
    body,
  };
}
