/**
 * Provider-neutral Deno Deploy + Deno KV + Deno Deploy Cron adapter
 * contract for the dogfood-deno-deploy-geo-app.
 *
 * The dogfood app talks to Deno Deploy only through this interface.
 * Two implementations exist —
 *
 * - {@link makeMockAdapter} — backed by `@kiwa/edge` v0.2 8 axis
 *   semantics helpers on the `geo-replicated` + `edge-kv` +
 *   `cron-trigger` axes (createGeoReplicatedSession / geoPrimaryWrite /
 *   markReplicaLagged / syncReplica / resolveConflict /
 *   createEdgeKvSession / kvRead / kvWrite / kvRangeQuery / scheduleCron
 *   / startCron / completeCron / failCron). Always runs.
 * - {@link makeRealAdapter} — targets a real Deno Deploy runtime via the
 *   Deno Deploy sandbox (or `deno task dev` subprocess). Requires
 *   `KIWA_MODE=real` + `DENO_DEPLOY_KEY=1` to opt in; otherwise every
 *   method records `KIWA_DENO_DEPLOY_ENV_MISSING` and refuses to run.
 *
 * Both satisfy the same 8-op surface so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the fidelity harness.
 *
 * The 8 ops correspond to the 8 axis routing pattern inherited from
 * v1.24-1 (`@kiwa/edge` v0.2 semantics): geo-replicated (3 events) +
 * edge-kv (2 events) + cron-trigger (3 events) = 8 op surface.
 *
 * User journey — a client hits a Fresh route. The handler resolves a POP
 * region from Deno Deploy `Deno.env` + geo header, issues a Deno KV
 * primary-region write (strong consistency inside the primary region),
 * observes an eventual-consistency window for replica reads, then reads
 * the same key back to verify the read-your-writes guarantee. A parallel
 * Deno Deploy Cron trigger fires a purge job on a 24-h retention window,
 * with an optional queue-triggered variant so the fidelity harness
 * observes the scheduled + queue-triggered paths of the cron axis.
 */

/** Region resolution snapshot — negotiated region + language + fallback flag. */
export interface GeoRouteSnapshot {
  readonly requestId: string;
  readonly acceptLanguage: string;
  readonly clientCountry: string;
  readonly resolvedRegion: string;
  readonly fellBack: boolean;
}

/** Primary write snapshot — region + version + replicas marked lagging. */
export interface GeoPrimaryWriteSnapshot {
  readonly primaryRegion: string;
  readonly version: number;
  readonly laggingReplicas: readonly string[];
  readonly payload: string;
}

/** Replica sync snapshot — replicas caught up + resulting state. */
export interface GeoReplicaSyncSnapshot {
  readonly syncedReplicas: readonly string[];
  readonly finalState: 'in-sync' | 'lagging' | 'conflict-detected';
  readonly version: number;
}

/** KV write snapshot — key + value + cache invalidation flag. */
export interface KvWriteSnapshot {
  readonly key: string;
  readonly value: string;
  readonly invalidatedCache: boolean;
}

/** KV range query snapshot — prefix + returned keys + count. */
export interface KvRangeQuerySnapshot {
  readonly prefix: string;
  readonly keys: readonly string[];
  readonly count: number;
}

/**
 * Read-your-writes snapshot — the write that just landed on the primary
 * region, then the read that immediately follows. When strong consistency
 * holds the values match. When the read is served by a lagging replica
 * the values diverge and `consistent` flips to false.
 */
export interface ReadYourWritesSnapshot {
  readonly key: string;
  readonly writtenValue: string;
  readonly readValue: string | null;
  readonly consistent: boolean;
  /** Real Deno KV → 'strong' at the primary; replica reads may be 'eventual'. */
  readonly consistency: 'strong' | 'eventual';
}

/**
 * Scheduled cron snapshot — id + trigger source + spec + state after start.
 * A completed run flips to `completed`; a queue-triggered path adopts
 * `triggerType='queue'`.
 */
export interface CronScheduleSnapshot {
  readonly id: string;
  readonly triggerType: 'scheduled' | 'queue' | 'email';
  readonly cronSpec: string;
  readonly state: 'scheduled' | 'running' | 'completed' | 'failed';
}

/**
 * Cron completion snapshot — id + duration + terminal state. `retryCount`
 * surfaces the number of failures the cron scheduler observed before
 * committing to `completed` / `failed`.
 */
export interface CronCompletionSnapshot {
  readonly id: string;
  readonly finalState: 'completed' | 'failed';
  readonly durationMs: number;
  readonly retryCount: number;
}

/**
 * Cron failure snapshot — id + reason + retry decision. The Deno Deploy
 * scheduler re-enqueues the job when retries remain; the mock mirrors
 * that with a `state='scheduled'` transition on the next tick and a
 * `state='failed'` transition when the retry budget is exhausted.
 */
export interface CronFailureSnapshot {
  readonly id: string;
  readonly reason: string;
  readonly retryCount: number;
  readonly willRetry: boolean;
  readonly nextState: 'scheduled' | 'failed';
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Provider-neutral Deno Deploy driver. 8 ops spread across 3 axes
 * (geo-replicated 3 + edge-kv 2 + cron-trigger 3):
 *
 * geo-replicated axis:
 *  1. `driveGeoRoute`             — resolveRegion(accept-language + geo-ip)
 *  2. `driveGeoPrimaryWrite`      — geoPrimaryWrite (bumps version, replicas lag)
 *  3. `driveGeoReplicaSync`       — syncReplica (each replica catches up)
 *
 * edge-kv axis:
 *  4. `driveKvWrite`              — kvWrite (persist + invalidate cache)
 *  5. `driveKvRangeQuery`         — kvRangeQuery (prefix scan)
 *
 * (read-your-writes rides on top of `driveKvWrite` + `kvRead` and lives
 *  in `driveReadYourWrites` — the observability op that fuses geo +
 *  edge-kv into the consistency check.)
 *
 *  6. `driveReadYourWrites`       — write followed by immediate read;
 *                                    strong on primary, eventual on lagging
 *                                    replica.
 *
 * cron-trigger axis:
 *  7. `driveCronSchedule`         — scheduleCron + startCron (scheduled
 *                                    or queue-triggered variant)
 *  8. `driveCronComplete`         — completeCron (success) or failCron
 *                                    (with retry decision)
 */
export interface DenoDeployAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveGeoRoute(input: {
    requestId: string;
    acceptLanguage: string;
    clientCountry: string;
  }): Promise<GeoRouteSnapshot>;

  driveGeoPrimaryWrite(input: {
    payload: string;
  }): Promise<GeoPrimaryWriteSnapshot>;

  driveGeoReplicaSync(input: {
    replicas: readonly string[];
  }): Promise<GeoReplicaSyncSnapshot>;

  driveKvWrite(input: {
    key: string;
    value: string;
  }): Promise<KvWriteSnapshot>;

  driveKvRangeQuery(input: {
    prefix: string;
  }): Promise<KvRangeQuerySnapshot>;

  driveReadYourWrites(input: {
    key: string;
    value: string;
    /**
     * When true, forces the read to go through a lagging replica so the
     * eventual-consistency observation window widens. Default false =
     * strong consistency (primary region read).
     */
    fromLaggingReplica?: boolean;
  }): Promise<ReadYourWritesSnapshot>;

  driveCronSchedule(input: {
    id: string;
    cronSpec: string;
    triggerType?: 'scheduled' | 'queue' | 'email';
    maxRetries?: number;
  }): Promise<CronScheduleSnapshot>;

  driveCronComplete(input: {
    id: string;
    outcome: 'success' | 'failure';
    durationMs: number;
    reason?: string;
  }): Promise<CronCompletionSnapshot | CronFailureSnapshot>;

  metrics(): {
    latencySamplesMs: number[];
    geoRouteCount: number;
    geoPrimaryWriteCount: number;
    geoReplicaSyncCount: number;
    kvWriteCount: number;
    kvRangeQueryCount: number;
    readYourWritesCount: number;
    cronScheduleCount: number;
    cronCompleteCount: number;
  };

  reset(): Promise<void>;
}

/**
 * Region catalog used by the geo router — mirrors the shape of a real
 * Deno Deploy deployment. Deno Deploy exposes its POP region via
 * `Deno.env.get('DENO_REGION')` (e.g. `us-east1` / `asia-northeast1` /
 * `europe-west3`). `default` is the failover region when the client
 * country cannot be mapped to a POP.
 */
export const REGION_CATALOG = {
  primary: 'us-east1',
  replicas: ['asia-northeast1', 'europe-west3', 'us-west1'] as const,
} as const;

/**
 * Resolve a POP region for a request. In real Deno Deploy this happens in
 * the Fresh handler before hitting Deno KV. The routing table is
 * intentionally small so unit tests can exhaustively cover it.
 */
export function resolveRegion(input: {
  acceptLanguage: string;
  clientCountry: string;
}): { region: string; fellBack: boolean } {
  // Country → region map. When both signals agree the region is decisive;
  // when they disagree country wins (Deno Deploy's geo header is more
  // reliable than Accept-Language, which UAs and translators can rewrite).
  const countryToRegion: Record<string, string> = {
    US: 'us-east1',
    CA: 'us-west1',
    JP: 'asia-northeast1',
    KR: 'asia-northeast1',
    GB: 'europe-west3',
    DE: 'europe-west3',
    FR: 'europe-west3',
  };
  const languageToRegion: Record<string, string> = {
    en: 'us-east1',
    ja: 'asia-northeast1',
    ko: 'asia-northeast1',
    de: 'europe-west3',
    fr: 'europe-west3',
  };
  const country = input.clientCountry.trim().toUpperCase();
  const language = input.acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase() ?? '';
  const byCountry = countryToRegion[country];
  if (byCountry) return { region: byCountry, fellBack: false };
  const byLanguage = languageToRegion[language];
  if (byLanguage) return { region: byLanguage, fellBack: true };
  return { region: REGION_CATALOG.primary, fellBack: true };
}

/**
 * Deno Deploy Cron spec parser — accepts the same 5-field cron syntax
 * (minute hour day-of-month month day-of-week) that `Deno.cron` uses.
 * Returns a normalised spec string, or throws when the input is not
 * parseable. Real Deno Deploy would reject at deploy time; the mock
 * mirrors that fail-fast contract.
 */
export function normalizeCronSpec(spec: string): string {
  const trimmed = spec.trim();
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(
      `normalizeCronSpec: expected 5 space-separated fields, got ${fields.length}: "${trimmed}"`,
    );
  }
  return fields.join(' ');
}
