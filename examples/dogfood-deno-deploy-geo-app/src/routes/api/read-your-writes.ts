/**
 * `/api/read-your-writes` Fresh route handler — write immediately
 * followed by read to verify the read-your-writes consistency guarantee.
 * Uses the `@kiwa/edge` v0.2 `edge-kv` axis (`kv.write` + `kv.read`
 * emissions) via the adapter's `driveReadYourWrites` op.
 *
 * Deno KV documents strong consistency at the primary region and
 * eventual consistency at replicas. The handler exposes both paths via a
 * query parameter — `?replica=1` opts into a lagging-replica read so the
 * fidelity harness observes the eventual-consistency window; the default
 * path routes to the primary and the response is strongly consistent.
 */

import type { DenoDeployAdapter } from '../../lib/deno-adapter.js';

/** Response payload for /api/read-your-writes. */
export interface ReadYourWritesPayload {
  ok: boolean;
  key: string;
  writtenValue: string;
  readValue: string | null;
  consistent: boolean;
  consistency: 'strong' | 'eventual';
}

/**
 * Write + immediate read. `fromLaggingReplica` toggles the eventual-
 * consistency path so callers can observe the consistency window on
 * demand. When strong consistency holds the payload matches the write;
 * a lagging replica returns `null` (has not yet applied the write).
 *
 * The handler returns 200 even when `consistent=false` — the harness
 * distinguishes "eventual consistency window observed" (expected on
 * lagging-replica reads) from "strong consistency violated" (never
 * expected on primary reads). Callers assert on `consistent` +
 * `consistency` to distinguish the two.
 */
export async function handleReadYourWrites(
  adapter: DenoDeployAdapter,
  input: {
    key: string;
    value: string;
    fromLaggingReplica?: boolean;
  },
): Promise<{ status: number; body: ReadYourWritesPayload }> {
  const snapshot = await adapter.driveReadYourWrites({
    key: input.key,
    value: input.value,
    fromLaggingReplica: input.fromLaggingReplica ?? false,
  });
  return {
    status: 200,
    body: {
      ok: true,
      key: snapshot.key,
      writtenValue: snapshot.writtenValue,
      readValue: snapshot.readValue,
      consistent: snapshot.consistent,
      consistency: snapshot.consistency,
    },
  };
}
