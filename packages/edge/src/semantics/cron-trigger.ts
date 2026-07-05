import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Cron trigger — scheduled invocation lifecycle. Edge platforms fire scheduled
 * handlers from distinct sources (Cloudflare Cron Triggers + Queue consumers +
 * Email routing, Vercel Cron jobs, Deno Deploy cron) yet share the same
 * observable lifecycle: an event is scheduled, starts running, then either
 * completes or fails. A failed run re-enters the schedule until `maxRetries`
 * is exhausted, at which point it terminates in `failed`.
 */
export type CronState = 'scheduled' | 'running' | 'completed' | 'failed';

/** Which trigger source fired the scheduled handler. */
export type CronTriggerType = 'scheduled' | 'queue' | 'email';

export interface CronSession {
  id: string;
  platform: EdgePlatform;
  triggerType: CronTriggerType;
  cronSpec: string;
  state: CronState;
  startedAt: number | null;
  retryCount: number;
  maxRetries: number;
  history: AxisStep<CronState>[];
}

/**
 * Schedule a cron invocation. Emits `cron.scheduled` and seeds the session in
 * the `scheduled` state. `triggerType` defaults to `scheduled` (a plain time
 * trigger) and `maxRetries` defaults to 3.
 */
export function scheduleCron(input: {
  id: string;
  platform: EdgePlatform;
  triggerType?: CronTriggerType;
  cronSpec: string;
  maxRetries?: number;
}): CronSession {
  const triggerType = input.triggerType ?? 'scheduled';
  const maxRetries = input.maxRetries ?? 3;
  const session: CronSession = {
    id: input.id,
    platform: input.platform,
    triggerType,
    cronSpec: input.cronSpec,
    state: 'scheduled',
    startedAt: null,
    retryCount: 0,
    maxRetries,
    history: [],
  };
  const step: AxisStep<CronState> = {
    neutralEvent: 'cron.scheduled',
    platformEvent: platformEventName(input.platform, 'cron.scheduled'),
    state: 'scheduled',
    platform: input.platform,
    metadata: { triggerType, cronSpec: input.cronSpec, maxRetries },
  };
  session.history.push(step);
  return session;
}

/**
 * Begin executing a scheduled invocation. Transitions `scheduled` → `running`,
 * stamps `startedAt`, and emits `cron.started`. Rejects if the session is not
 * currently `scheduled` (already running / terminal).
 */
export function startCron(session: CronSession): AxisStep<CronState> {
  if (session.state !== 'scheduled') {
    throw new Error(`startCron: session is ${session.state}, expected scheduled`);
  }
  session.state = 'running';
  session.startedAt = Date.now();
  const step: AxisStep<CronState> = {
    neutralEvent: 'cron.started',
    platformEvent: platformEventName(session.platform, 'cron.started'),
    state: 'running',
    platform: session.platform,
    metadata: { startedAt: session.startedAt, triggerType: session.triggerType },
  };
  session.history.push(step);
  return step;
}

/**
 * Finish a running invocation successfully. Transitions `running` →
 * `completed` and emits `cron.completed`. Rejects if not `running`.
 */
export function completeCron(
  session: CronSession,
  input: { durationMs: number },
): AxisStep<CronState> {
  if (session.state !== 'running') {
    throw new Error(`completeCron: session is ${session.state}, expected running`);
  }
  session.state = 'completed';
  const step: AxisStep<CronState> = {
    neutralEvent: 'cron.completed',
    platformEvent: platformEventName(session.platform, 'cron.completed'),
    state: 'completed',
    platform: session.platform,
    metadata: { durationMs: input.durationMs, triggerType: session.triggerType },
  };
  session.history.push(step);
  return step;
}

/**
 * Fail a running invocation. Increments `retryCount`; if retries remain the
 * session re-enters the `scheduled` state (to be picked up again), otherwise it
 * terminates in `failed`. Emits `cron.failed` with `willRetry` reflecting the
 * decision. Rejects if the session already `completed`.
 */
export function failCron(
  session: CronSession,
  input: { reason: string },
): AxisStep<CronState> {
  if (session.state !== 'running') {
    throw new Error(`failCron: session is ${session.state}, expected running`);
  }
  session.retryCount += 1;
  const willRetry = session.retryCount < session.maxRetries;
  session.state = willRetry ? 'scheduled' : 'failed';
  const step: AxisStep<CronState> = {
    neutralEvent: 'cron.failed',
    platformEvent: platformEventName(session.platform, 'cron.failed'),
    state: session.state,
    platform: session.platform,
    metadata: {
      reason: input.reason,
      retryCount: session.retryCount,
      willRetry,
      triggerType: session.triggerType,
    },
  };
  session.history.push(step);
  return step;
}
