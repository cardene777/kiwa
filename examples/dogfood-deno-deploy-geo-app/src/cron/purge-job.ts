/**
 * `cron/purge-job.ts` — 24-h retention purge job for Deno KV keys. Fires
 * via Deno Deploy Cron on a daily schedule (`0 0 * * *`, UTC midnight)
 * and issues a range query over the `retention:` prefix to identify
 * expired keys. Uses the `@kiwa/edge` v0.2 `cron-trigger` axis
 * (schedule + start + complete) alongside the `edge-kv` axis (range
 * query + write) via the adapter.
 *
 * A real Deno Deploy deployment would attach this to `Deno.cron('purge',
 * '0 0 * * *', purge)`. The mock exercises the same lifecycle through
 * the adapter; queue-triggered variants can be exercised by passing
 * `triggerType='queue'` to the scheduler.
 */

import type { DenoDeployAdapter } from '../lib/deno-adapter.js';

/**
 * Result of a single purge run — id + duration + how many keys the run
 * enumerated + whether the run completed successfully or failed.
 */
export interface PurgeRunResult {
  cronId: string;
  keysEnumerated: number;
  finalState: 'completed' | 'failed' | 'scheduled';
  durationMs: number;
}

/**
 * Run a purge job once. Schedules the cron, runs a range query over the
 * retention prefix, then marks the cron `completed`. When the range
 * query fails (which cannot happen in the mock but callers may inject a
 * failure) the cron transitions to `failed` and callers can inspect the
 * retry decision.
 *
 * `prefix` defaults to `retention:` — a real deployment would write keys
 * under `retention:{YYYYMMDD}:...` and rely on the range scan to
 * identify keys older than 24 h.
 */
export async function runPurgeJob(
  adapter: DenoDeployAdapter,
  input: {
    cronId?: string;
    triggerType?: 'scheduled' | 'queue' | 'email';
    prefix?: string;
    startedAt?: number;
    forceFailure?: boolean;
  } = {},
): Promise<PurgeRunResult> {
  const cronId = input.cronId ?? `purge-${Date.now()}`;
  const triggerType = input.triggerType ?? 'scheduled';
  const prefix = input.prefix ?? 'retention:';
  const startedAt = input.startedAt ?? Date.now();
  // Schedule the cron and start it (mock fuses schedule + start on the
  // same op boundary — see driveCronSchedule notes).
  await adapter.driveCronSchedule({
    id: cronId,
    cronSpec: '0 0 * * *',
    triggerType,
    maxRetries: 3,
  });
  let keysEnumerated = 0;
  try {
    const range = await adapter.driveKvRangeQuery({ prefix });
    keysEnumerated = range.count;
    if (input.forceFailure) {
      throw new Error('purge-job: forced failure for testing');
    }
    const durationMs = Math.max(0, Date.now() - startedAt);
    await adapter.driveCronComplete({
      id: cronId,
      outcome: 'success',
      durationMs,
    });
    return { cronId, keysEnumerated, finalState: 'completed', durationMs };
  } catch (err) {
    const durationMs = Math.max(0, Date.now() - startedAt);
    const reason = err instanceof Error ? err.message : String(err);
    const result = await adapter.driveCronComplete({
      id: cronId,
      outcome: 'failure',
      durationMs,
      reason,
    });
    // On willRetry the mock's snapshot exposes `nextState=scheduled`; the
    // caller sees `finalState='scheduled'` to distinguish it from a
    // terminal failure.
    const finalState: PurgeRunResult['finalState'] =
      'willRetry' in result && result.willRetry ? 'scheduled' : 'failed';
    return { cronId, keysEnumerated, finalState, durationMs };
  }
}
