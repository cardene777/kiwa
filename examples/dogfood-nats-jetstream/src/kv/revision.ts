/**
 * KV bucket revision flow (v1.31-4) — wraps
 * `@kiwa-lab/streaming`'s `createNatsKvObject` KV surface so the dogfood
 * can exercise history depth + tombstone + watch semantics.
 *
 * The canned scenario:
 *   1. Create a bucket with `historyDepth=5`.
 *   2. Put a fresh key (revision 1).
 *   3. Update 3 times (revisions 2..4).
 *   4. Delete the key (revision 5 tombstone).
 *   5. Iterate the watch iterator + count events (should match 5).
 *   6. Assert `getKv` after tombstone returns null.
 */

import { createNatsKvObject, type NatsKvObject } from '@kiwa-lab/streaming';

export interface KvRevisionFlowInput {
  readonly bucket?: string;
  readonly key?: string;
  readonly historyDepth?: number;
}

export interface KvRevisionFlowResult {
  readonly store: NatsKvObject;
  readonly bucket: string;
  readonly key: string;
  readonly historyDepth: number;
  readonly revisions: readonly {
    readonly revision: number;
    readonly operation: 'put' | 'delete';
  }[];
  readonly deleteTombstoneObserved: boolean;
  readonly watchEventCount: number;
}

export async function driveKvRevision(
  input: KvRevisionFlowInput = {},
): Promise<KvRevisionFlowResult> {
  const bucket = input.bucket ?? 'user-profiles-v2';
  const key = input.key ?? 'u-1';
  const historyDepth = input.historyDepth ?? 5;

  const store = createNatsKvObject();
  store.createKvBucket({ bucket, historyDepth });

  // Revision 1 — put.
  store.putKv(bucket, key, { userId: key, region: 'us', v: 1 });
  // Revisions 2..4 — update.
  store.putKv(bucket, key, { userId: key, region: 'eu', v: 2 });
  store.putKv(bucket, key, { userId: key, region: 'jp', v: 3 });
  store.putKv(bucket, key, { userId: key, region: 'ap', v: 4 });
  // Revision 5 — delete tombstone.
  store.deleteKv(bucket, key);

  // Assert the delete tombstone hides the value from getKv.
  const after = store.getKv(bucket, key);
  const deleteTombstoneObserved = after === null;

  // Walk the full history and record ordered revisions.
  const historyEntries = store.historyKv(bucket, key);
  const revisions = historyEntries.map((r) => ({
    revision: r.revision,
    operation: r.operation,
  }));

  // Drain the watch iterator — should emit one event per history row.
  let watchEventCount = 0;
  const iter = store.watchKv(bucket);
  for await (const event of iter) {
    if (event.revision.key === key) watchEventCount += 1;
  }

  return {
    store,
    bucket,
    key,
    historyDepth,
    revisions,
    deleteTombstoneObserved,
    watchEventCount,
  };
}
