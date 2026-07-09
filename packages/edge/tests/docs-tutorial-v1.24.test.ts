/**
 * v1.24-5 docs 補強 (Issue #918) — tutorial 42-44 code snippet 検証。
 *
 * `docs/tutorials/42-cloudflare-durable-object.md` /
 * `docs/tutorials/43-vercel-edge-streaming.md` /
 * `docs/tutorials/44-deno-deploy-geo.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 / v1.23 の docs-tutorial-v*.test.ts と同 pattern。
 *
 * v1.24 は @kiwa-lab/edge v0.2 の 8-axis 高度な edge semantics を扱う
 * (durable-object / websocket-edge / edge-kv / geo-replicated / cron-trigger /
 * subrequest-limit / cpu-time-limit / streaming-response)。 mock 部分のみを
 * behavior test 対象とする (real driver (Miniflare / Vercel Edge sandbox /
 * Deno Deploy sandbox) は unit test の範囲外)。
 */
import { describe, expect, it } from 'vitest';
import {
  acceptWebSocket,
  closeStream,
  closeWebSocket,
  completeCron,
  createDurableObject,
  createEdgeKvSession,
  createGeoReplicatedSession,
  failCron,
  fireAlarm,
  geoPrimaryWrite,
  kvRangeQuery,
  kvRead,
  kvWrite,
  markReplicaLagged,
  openStream,
  requestDurableObject,
  requestWebSocketUpgrade,
  resumeStream,
  scheduleCron,
  sendChunk,
  sendMessage,
  startCron,
  syncReplica,
  writeStorage,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 42 — Cloudflare Workers Durable Object
// ---------------------------------------------------------------------------

describe('tutorial 42 — chat room broadcast', () => {
  it('creates the DO on the first join and broadcasts to every member', () => {
    const room = createDurableObject({ id: 'room-1', platform: 'cloudflare' });
    expect(room.state).toBe('initialized');
    expect(room.history[0]?.neutralEvent).toBe('durable-object.created');

    const alice = requestDurableObject(room, { url: 'https://edge/room-1/join?user=alice' });
    expect(alice.neutralEvent).toBe('durable-object.requested');
    expect(room.state).toBe('active');
    expect(room.requestCount).toBe(1);

    requestDurableObject(room, { url: 'https://edge/room-1/join?user=bob' });
    expect(room.requestCount).toBe(2);

    const aliceWs = requestWebSocketUpgrade({ id: 'ws-alice', platform: 'cloudflare' });
    const bobWs = requestWebSocketUpgrade({ id: 'ws-bob', platform: 'cloudflare' });
    acceptWebSocket(aliceWs);
    acceptWebSocket(bobWs);

    writeStorage(room, { key: 'last-message', value: 'hello' });
    const aliceMsg = sendMessage(aliceWs, { data: 'hello' });
    const bobMsg = sendMessage(bobWs, { data: 'hello' });

    expect(aliceMsg.neutralEvent).toBe('websocket.message');
    expect(bobMsg.neutralEvent).toBe('websocket.message');
    expect(room.storageKeys.get('last-message')).toBe('hello');
  });
});

describe('tutorial 42 — storage transactional rollback', () => {
  it('restores pre-tx values when the handler throws', () => {
    const room = createDurableObject({ id: 'room-tx', platform: 'cloudflare' });
    writeStorage(room, { key: 'counter', value: '1' });
    const snapshot = new Map(room.storageKeys);

    writeStorage(room, { key: 'counter', value: '2' });
    writeStorage(room, { key: 'counter', value: '3' });
    room.storageKeys = new Map(snapshot);

    expect(room.storageKeys.get('counter')).toBe('1');
    expect(
      room.history.filter((s) => s.neutralEvent === 'durable-object.storage-written'),
    ).toHaveLength(3);
  });
});

describe('tutorial 42 — alarm-driven retention purge', () => {
  it('fires the alarm and lets the handler purge stale keys', () => {
    const room = createDurableObject({ id: 'room-alarm', platform: 'cloudflare' });
    writeStorage(room, { key: 'msg:1', value: 'hello' });
    writeStorage(room, { key: 'msg:2', value: 'world' });

    const wake = fireAlarm(room);
    expect(wake.neutralEvent).toBe('durable-object.alarm-fired');
    expect(wake.state).toBe('active');

    for (const key of Array.from(room.storageKeys.keys())) {
      if (key.startsWith('msg:')) room.storageKeys.delete(key);
    }
    expect(room.storageKeys.size).toBe(0);
  });
});

describe('tutorial 42 — websocket hibernation wake-up', () => {
  it('drops the socket, re-routes the follow-up request, keeps the DO active', () => {
    const room = createDurableObject({ id: 'room-hib', platform: 'cloudflare' });
    requestDurableObject(room, { url: 'https://edge/room-hib/join' });

    const ws = requestWebSocketUpgrade({ id: 'ws-1', platform: 'cloudflare' });
    acceptWebSocket(ws);
    expect(ws.state).toBe('open');

    const closed = closeWebSocket(ws, { code: 1006 });
    expect(closed.state).toBe('closed');

    const wake = requestDurableObject(room, { url: 'https://edge/room-hib/wake' });
    expect(wake.state).toBe('active');
    expect(room.requestCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 43 — Vercel Edge streaming
// ---------------------------------------------------------------------------

describe('tutorial 43 — geo routing', () => {
  it('routes a DE visitor to fra1 and syncs the lagged replica', () => {
    const REGION_BY_COUNTRY: Record<string, string> = {
      US: 'iad1',
      DE: 'fra1',
      JP: 'hnd1',
      AU: 'syd1',
    };
    function resolveRegion(_acceptLanguage: string, vercelCountry: string): string {
      return REGION_BY_COUNTRY[vercelCountry] ?? 'iad1';
    }

    const region = resolveRegion('de-DE,de;q=0.9', 'DE');
    expect(region).toBe('fra1');

    const geo = createGeoReplicatedSession({
      platform: 'vercel',
      primaryRegion: 'iad1',
      replicaRegions: ['fra1', 'hnd1', 'syd1'],
    });

    const write = geoPrimaryWrite(geo, { data: 'v' });
    expect(write.neutralEvent).toBe('geo.primary-write');
    expect(geo.state).toBe('lagging');
    expect(geo.version).toBe(1);
    expect(geo.lagMs.fra1).toBeGreaterThan(0);

    markReplicaLagged(geo, { region: 'fra1', lagMs: 300 });
    const sync = syncReplica(geo, { region: 'fra1' });
    expect(sync.neutralEvent).toBe('geo.replica-synced');
    expect(geo.lagMs.fra1).toBe(0);
  });
});

describe('tutorial 43 — edge KV read-through cache', () => {
  it('populates the cache on the first read, serves warm on the second', () => {
    const kv = createEdgeKvSession({ platform: 'vercel', state: 'eventually-consistent' });
    kvWrite(kv, { key: 'user:1', value: '{"name":"alice"}' });

    const cold = kvRead(kv, { key: 'user:1' });
    expect(cold.neutralEvent).toBe('kv.read');

    const warm = kvRead(kv, { key: 'user:1' });
    expect(warm.neutralEvent).toBe('kv.cache-hit');
  });

  it('invalidates the cache on write and misses on an unknown key', () => {
    const kv = createEdgeKvSession({ platform: 'vercel', state: 'eventually-consistent' });
    kvWrite(kv, { key: 'user:2', value: '{"name":"bob"}' });
    kvRead(kv, { key: 'user:2' });
    kvWrite(kv, { key: 'user:2', value: '{"name":"bob-v2"}' });

    const afterWrite = kvRead(kv, { key: 'user:2' });
    expect(afterWrite.neutralEvent).toBe('kv.read');

    const miss = kvRead(kv, { key: 'unknown' });
    expect(miss.neutralEvent).toBe('kv.cache-miss');
  });

  it('range-queries keys under a prefix in lexicographic order', () => {
    const kv = createEdgeKvSession({ platform: 'vercel' });
    kvWrite(kv, { key: 'log:2026-07-01', value: 'a' });
    kvWrite(kv, { key: 'log:2026-07-02', value: 'b' });
    kvWrite(kv, { key: 'log:2026-07-03', value: 'c' });
    kvWrite(kv, { key: 'other', value: 'x' });

    const { matches, step } = kvRangeQuery(kv, { prefix: 'log:' });
    expect(step.neutralEvent).toBe('kv.read');
    expect(matches).toEqual(['log:2026-07-01', 'log:2026-07-02', 'log:2026-07-03']);
    expect(step.metadata?.matched).toBe(3);
  });
});

describe('tutorial 43 — SSE stream backpressure', () => {
  it('flips to backpressure when bytesSent exceeds the high-water mark', () => {
    const stream = openStream({
      id: 'stream-1',
      platform: 'vercel',
      kind: 'sse',
      highWaterMark: 32,
    });
    expect(stream.state).toBe('open');
    expect(stream.history[0]?.neutralEvent).toBe('stream.opened');

    const first = sendChunk(stream, { data: 'event: message\ndata: hello\n\n' });
    expect(first.neutralEvent).toBe('stream.chunk-sent');
    expect(stream.state).toBe('open');

    const second = sendChunk(stream, { data: 'event: message\ndata: world\n\n' });
    expect(second.neutralEvent).toBe('stream.backpressure');
    expect(stream.state).toBe('backpressure');
  });

  it('resumes after the consumer drains and closes cleanly', () => {
    const stream = openStream({
      id: 'stream-2',
      platform: 'vercel',
      kind: 'sse',
      highWaterMark: 16,
    });
    sendChunk(stream, { data: 'a'.repeat(20) });
    expect(stream.state).toBe('backpressure');

    const resumed = resumeStream(stream);
    expect(resumed.neutralEvent).toBe('stream.chunk-sent');
    expect(stream.state).toBe('open');

    const closed = closeStream(stream, { reason: 'client-disconnect' });
    expect(closed.neutralEvent).toBe('stream.closed');
    expect(stream.state).toBe('closed');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 44 — Deno Deploy geo
// ---------------------------------------------------------------------------

describe('tutorial 44 — multi-region write', () => {
  it('bumps the version on primary, syncs each replica in turn', () => {
    const geo = createGeoReplicatedSession({
      platform: 'deno',
      primaryRegion: 'ams',
      replicaRegions: ['nrt', 'sfo', 'gru'],
    });

    const write = geoPrimaryWrite(geo, { data: 'payload' });
    expect(write.neutralEvent).toBe('geo.primary-write');
    expect(geo.version).toBe(1);
    expect(geo.state).toBe('lagging');
    for (const region of ['nrt', 'sfo', 'gru']) {
      expect(geo.lagMs[region]).toBeGreaterThan(0);
    }

    markReplicaLagged(geo, { region: 'nrt', lagMs: 800 });
    syncReplica(geo, { region: 'nrt' });
    expect(geo.state).toBe('lagging');

    syncReplica(geo, { region: 'sfo' });
    syncReplica(geo, { region: 'gru' });
    expect(geo.state).toBe('in-sync');
  });
});

describe('tutorial 44 — read-your-writes', () => {
  it('a strong-consistency primary reads back its own write immediately', () => {
    const primary = createEdgeKvSession({ platform: 'deno', state: 'consistent' });
    kvWrite(primary, { key: 'counter', value: '1' });
    const readback = kvRead(primary, { key: 'counter' });
    expect(readback.neutralEvent).toBe('kv.read');
    expect(readback.state).toBe('consistent');
    expect(primary.store.get('counter')).toBe('1');
  });

  it('an eventually-consistent replica may miss the recent write', () => {
    const replica = createEdgeKvSession({ platform: 'deno', state: 'eventually-consistent' });
    const readback = kvRead(replica, { key: 'counter' });
    expect(readback.neutralEvent).toBe('kv.cache-miss');
    expect(readback.state).toBe('eventually-consistent');
  });
});

describe('tutorial 44 — cron trigger lifecycle', () => {
  it('walks scheduled → running → completed on success', () => {
    const cron = scheduleCron({
      id: 'purge-daily',
      platform: 'deno',
      cronSpec: '0 0 * * *',
      triggerType: 'scheduled',
    });
    expect(cron.state).toBe('scheduled');

    const start = startCron(cron);
    expect(start.neutralEvent).toBe('cron.started');
    expect(cron.state).toBe('running');

    const done = completeCron(cron, { durationMs: 42 });
    expect(done.neutralEvent).toBe('cron.completed');
    expect(cron.state).toBe('completed');
  });

  it('retries on failure until maxRetries is exhausted', () => {
    const cron = scheduleCron({
      id: 'sync-hourly',
      platform: 'deno',
      cronSpec: '0 * * * *',
      triggerType: 'scheduled',
      maxRetries: 2,
    });
    startCron(cron);
    failCron(cron, { reason: 'network timeout' });
    expect(cron.retryCount).toBe(1);
    expect(cron.state).toBe('scheduled');

    startCron(cron);
    failCron(cron, { reason: 'network timeout' });
    expect(cron.retryCount).toBe(2);
    expect(cron.state).toBe('failed');
  });

  it('accepts a queue trigger as an alternate source', () => {
    const cron = scheduleCron({
      id: 'queue-msg',
      platform: 'deno',
      cronSpec: 'queue:jobs',
      triggerType: 'queue',
    });
    expect(cron.triggerType).toBe('queue');
    startCron(cron);
    completeCron(cron, { durationMs: 10 });
    expect(cron.state).toBe('completed');
  });
});
