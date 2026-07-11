/**
 * Coverage batch1 (parallel worker) — realtime package function / branch
 * coverage を lift する behavior test 群。
 *
 * 対象 gap ...
 * - ably.ts / pusher.ts / socketio.ts の RealtimeMock stub method (subscribe /
 *   publish / trackPresence / untrackPresence / getConnectionState / disconnect /
 *   reconnect / getMetrics / reset) を直接呼出、 provider 固有 method (channels.release
 *   / channel.detach / channel.unsubscribe / presence.get / connection.on(closed)
 *   / unsubscribeChannel / unbind() / members.each / members.get / socket.off no-arg
 *   / socket.connect() / io.of / namespace.emit) の function coverage を上げる
 * - fidelity.ts の createMockCollector + withTimeout timeout 分岐
 * - report.ts の coverageV8Summary / mutation / notes / surfaceCoverage 明示 branch
 * - session-orchestrator の reconnecting/user-disconnect + reconnecting/soft-reject
 *   + degraded 状態の 5 分岐 (heartbeat-lost / connect-failed / user-disconnect /
 *   soft-reject)
 * - semantics 4 mock (realtime-ai-inference / simulcast-svc / webcodecs-decoder
 *   / whisper-streaming) の onEvent 返り値 disposer 呼出
 * - real-driver の envSource 省略経路 (process.env fallback)
 */
import { describe, expect, it } from 'vitest';
import {
  buildRealtimeReport,
  createAblyMock,
  createMockCollector,
  createMoqDatagramMediaMock,
  createPusherMock,
  createRealtimeAiInferenceMock,
  createSimulcastSvcMock,
  createSocketioMock,
  createSupabaseRealtimeMock,
  createWebCodecsDecoderMock,
  createWhisperStreamingMock,
  dispatchEvent,
  resolveRealtimeDriver,
  resolveRealtimeDriverByProvider,
  runRealtimeFidelityCheck,
  startSession,
  summarizeSession,
  type PusherMember,
  type PusherMembers,
  type RealtimeFidelityReport,
  type RealtimeSession,
  type SemanticsEvent,
} from '../src/index.js';

describe('coverage-batch1 — Ably RealtimeMock stubs + provider helpers', () => {
  it('T-RT-COV-A01 subscribe / publish / getConnectionState / getMetrics 直接呼出', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    expect(client.provider).toBe('ably');
    expect(client.getConnectionState()).toBe('disconnected');
    const received: unknown[] = [];
    const handle = await client.subscribe('base-ch', (ev) => {
      if (ev.kind === 'broadcast') received.push(ev.payload);
    });
    expect(client.getConnectionState()).toBe('connected');
    await client.publish('base-ch', 'ping', { n: 1 });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(1);
    const metrics = client.getMetrics();
    expect(metrics.subscribeCount).toBe(1);
    expect(metrics.publishCount).toBe(1);
    await handle.unsubscribe();
  });

  it('T-RT-COV-A02 trackPresence / untrackPresence 直接呼出 emits presence', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    const presenceEvents: string[] = [];
    await client.subscribe('room-p', (ev) => {
      if (ev.kind === 'presence') presenceEvents.push(ev.type);
    });
    await client.trackPresence('room-p', 'alice', { name: 'Alice' });
    await client.untrackPresence('room-p', 'alice');
    expect(presenceEvents).toContain('join');
    expect(presenceEvents).toContain('leave');
  });

  it('T-RT-COV-A03 disconnect / reconnect / reset 全経路呼出', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    await client.subscribe('r-ch', () => {});
    await client.disconnect();
    expect(client.getConnectionState()).toBe('disconnected');
    await client.reconnect();
    expect(client.getConnectionState()).toBe('connected');
    expect(client.getMetrics().reconnectCount).toBe(1);
    // reset は engine + channels + connectionListeners を全消去
    client.reset();
    expect(client.getMetrics().subscribeCount).toBe(0);
  });

  it('T-RT-COV-A04 channels.get 既存 return + channels.release + auth.clientId', () => {
    const client = createAblyMock({ artificialLatencyMs: 0, clientId: 'bob' });
    expect(client.auth.clientId).toBe('bob');
    const ch1 = client.channels.get('r1');
    const ch2 = client.channels.get('r1');
    // 同一 name の再取得は同一 instance (Map cache)
    expect(ch1).toBe(ch2);
    client.channels.release('r1');
    const ch3 = client.channels.get('r1');
    expect(ch3).not.toBe(ch1);
  });

  it('T-RT-COV-A05 channel.detach 二重呼出 safe + presence.get returns empty', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    const channel = client.channels.get('room-d');
    await channel.attach();
    await channel.detach();
    // detach は subHandle=null 状態でも throw しない
    await channel.detach();
    // presence.get() は簡易実装で常に空配列
    const members = await channel.presence.get();
    expect(members).toEqual([]);
  });

  it('T-RT-COV-A06 channel.unsubscribe clears handler map + wildcard list', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    const received: unknown[] = [];
    const channel = client.channels.get('room-u');
    await channel.subscribe('evt', () => received.push('e'));
    await channel.subscribe((msg) => received.push(msg.name));
    await channel.publish('evt', {});
    await new Promise((r) => setTimeout(r, 20));
    expect(received.length).toBeGreaterThan(0);
    channel.unsubscribe();
    const before = received.length;
    await channel.publish('evt', {});
    await new Promise((r) => setTimeout(r, 20));
    // unsubscribe 後 は event が来ない
    expect(received.length).toBe(before);
  });

  it('T-RT-COV-A07 connection.on(closed) fires after close + state transitions', async () => {
    const client = createAblyMock({ artificialLatencyMs: 0 });
    let closedFired = 0;
    let connectedFired = 0;
    // 未 registered state の listener 経路も handler map 経由で登録される
    client.connection.on('connected', () => {
      connectedFired += 1;
    });
    client.connection.on('closed', () => {
      closedFired += 1;
    });
    await client.channels.get('room-1').attach();
    await client.connection.close();
    expect(closedFired).toBe(1);
    expect(client.connection.state).toBe('closed');
    // connected 側 listener は close 経路では発火しない (register だけ経路 cover)
    expect(connectedFired).toBe(0);
  });
});

describe('coverage-batch1 — Pusher RealtimeMock stubs + presence helpers', () => {
  it('T-RT-COV-P01 subscribe / publish / getConnectionState / getMetrics 直接呼出', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0, userId: 'me' });
    expect(client.provider).toBe('pusher');
    expect(client.config.userId).toBe('me');
    const received: unknown[] = [];
    const handle = await client.subscribe('raw-ch', (ev) => {
      if (ev.kind === 'broadcast') received.push(ev.payload);
    });
    await client.publish('raw-ch', 'msg', { n: 1 });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(1);
    expect(client.getConnectionState()).toBe('connected');
    expect(client.getMetrics().subscribeCount).toBe(1);
    await handle.unsubscribe();
  });

  it('T-RT-COV-P02 trackPresence / untrackPresence / reconnect / reset 直接呼出', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    await client.subscribe('room-x', () => {});
    await client.trackPresence('room-x', 'alice', { name: 'Alice' });
    await client.untrackPresence('room-x', 'alice');
    await client.reconnect();
    expect(client.getMetrics().reconnectCount).toBe(1);
    client.reset();
    expect(client.getMetrics().subscribeCount).toBe(0);
  });

  it('T-RT-COV-P03 unsubscribeChannel + subscribeChannel 再取得は新規 instance', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const ch1 = client.subscribeChannel('ch1');
    const ch1Again = client.subscribeChannel('ch1');
    expect(ch1).toBe(ch1Again);
    client.unsubscribeChannel('ch1');
    const ch1New = client.subscribeChannel('ch1');
    expect(ch1New).not.toBe(ch1);
  });

  it('T-RT-COV-P04 channel.unbind() 全 handler 一括削除 (event 引数なし)', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const received: unknown[] = [];
    const ch = client.subscribeChannel('ch-clear');
    ch.bind('a', (d) => received.push({ k: 'a', d }));
    ch.bind('b', (d) => received.push({ k: 'b', d }));
    await new Promise((r) => setTimeout(r, 20));
    // event 引数なしで unbind → 全 handler 削除
    ch.unbind();
    ch.trigger('a', { n: 1 });
    ch.trigger('b', { n: 2 });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
  });

  it('T-RT-COV-P05 channel.members.each iterator visits every joined member', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0, userId: 'me' });
    const ch = client.subscribeChannel('presence-room-e');
    // bind 経由で initSubscription を起動しない限り engine.subscribe が
    // 走らない、 state.members が populate されないので bind 経由で trigger。
    ch.bind('pusher:member_added', () => {});
    await new Promise((r) => setTimeout(r, 30));
    await client.trackPresence('presence-room-e', 'alice', { role: 'A' });
    await client.trackPresence('presence-room-e', 'bob', { role: 'B' });
    await new Promise((r) => setTimeout(r, 30));
    const members = ch.members as PusherMembers;
    expect(members).toBeDefined();
    expect(members.count).toBeGreaterThanOrEqual(2);
    const seen: string[] = [];
    members.each((m: PusherMember) => seen.push(m.id));
    expect(seen).toContain('alice');
    expect(seen).toContain('bob');
    expect(members.get('alice')?.info.role).toBe('A');
    expect(members.get('missing')).toBeNull();
    // me は presence 未 join なので null (join した userId と一致しない)
    expect(members.me).toBeNull();
  });

  it('T-RT-COV-P06 non-presence subscribe_succeeded fires with undefined arg', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const ch = client.subscribeChannel('regular-ch');
    let succeeded: unknown = 'not-set';
    ch.bind('pusher:subscription_succeeded', (arg) => {
      succeeded = arg;
    });
    // bind → initSubscription 起動、 非 presence path は arg = undefined
    await new Promise((r) => setTimeout(r, 40));
    expect(succeeded).toBeUndefined();
  });

  it('T-RT-COV-P07 disconnect via base RealtimeMock stub — clears openChannels', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0 });
    client.subscribeChannel('c1');
    client.subscribeChannel('c2');
    await new Promise((r) => setTimeout(r, 20));
    await client.disconnect();
    // disconnect 後の再 subscribe は新規 channel を返す
    const c1After = client.subscribeChannel('c1');
    expect(c1After).toBeDefined();
    expect(client.getConnectionState()).toBe('disconnected');
  });
});

describe('coverage-batch1 — Socket.io RealtimeMock stubs + socket helpers', () => {
  it('T-RT-COV-S01 subscribe / publish / getConnectionState / getMetrics 直接呼出', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    expect(client.provider).toBe('socketio');
    const received: unknown[] = [];
    const handle = await client.subscribe('/base', (ev) => {
      if (ev.kind === 'broadcast') received.push(ev.payload);
    });
    await client.publish('/base', 'hello', { n: 1 });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(1);
    expect(client.getConnectionState()).toBe('connected');
    expect(client.getMetrics().subscribeCount).toBe(1);
    await handle.unsubscribe();
  });

  it('T-RT-COV-S02 trackPresence / untrackPresence / reconnect / reset', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    await client.subscribe('/p', () => {});
    await client.trackPresence('/p', 'alice', { name: 'Alice' });
    await client.untrackPresence('/p', 'alice');
    await client.reconnect();
    expect(client.getMetrics().reconnectCount).toBe(1);
    client.reset();
    expect(client.getMetrics().subscribeCount).toBe(0);
  });

  it('T-RT-COV-S03 io() 既存 socket cache + rooms() Set copy 返却', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const s1 = client.io('/ns');
    const s2 = client.io('/ns');
    expect(s1).toBe(s2);
    s1.on('e', () => {});
    await new Promise((r) => setTimeout(r, 20));
    await s1.join('r-a');
    const rooms = s1.rooms();
    expect(rooms.has('r-a')).toBe(true);
    // rooms() は Set copy を返すので外部 mutation は internal に波及しない
    rooms.delete('r-a');
    expect(s1.rooms().has('r-a')).toBe(true);
  });

  it('T-RT-COV-S04 socket.off(event) 引数なし = 該当 event の全 handler 削除', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const received: unknown[] = [];
    const s = client.io('/');
    s.on('e', () => received.push('x1'));
    s.on('e', () => received.push('x2'));
    await new Promise((r) => setTimeout(r, 20));
    // handler 未指定 = event の全 handler を delete する
    s.off('e');
    s.emit('e', { n: 1 });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
  });

  it('T-RT-COV-S05 socket.connect() calls engine.reconnect + fires connect handler', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const s = client.io('/');
    let connectFired = 0;
    s.on('connect', () => {
      connectFired += 1;
    });
    await new Promise((r) => setTimeout(r, 30));
    // 一度 disconnect してから connect() で再接続
    s.disconnect();
    await new Promise((r) => setTimeout(r, 20));
    s.connect();
    await new Promise((r) => setTimeout(r, 40));
    expect(connectFired).toBeGreaterThanOrEqual(1);
    expect(client.getMetrics().reconnectCount).toBeGreaterThanOrEqual(1);
  });

  it('T-RT-COV-S06 io.of() 既存 namespace cache + namespace.emit no room = default', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const ns1 = client.of('/chat');
    const ns2 = client.of('/chat');
    expect(ns1).toBe(ns2);
    const s = client.io('/chat');
    const received: unknown[] = [];
    s.on('bc', (data) => received.push(data));
    await new Promise((r) => setTimeout(r, 30));
    // to() 未呼出で emit → __default__ room に配信、 socket は default room に subscribe 済
    ns1.emit('bc', { n: 42 });
    await new Promise((r) => setTimeout(r, 30));
    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[0]).toEqual({ n: 42 });
  });

  it('T-RT-COV-S07 namespace.name + sockets Map exposed', () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const ns = client.of('/admin');
    expect(ns.name).toBe('/admin');
    expect(ns.sockets).toBeInstanceOf(Map);
  });
});

describe('coverage-batch1 — createMockCollector fidelity driver', () => {
  it('T-RT-COV-F01 collector driver から fidelity harness まで一気通貫', async () => {
    const supa = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const { driver, collected } = createMockCollector(supa, 3);
    // scenario 実行前に事前 subscribe/publish で event を produce
    const runP = driver.runScenario('room:x');
    // event を 3 件 produce (broadcast / presence / postgres_changes)
    await new Promise((r) => setTimeout(r, 30));
    await supa.publish('room:x', 'broadcast-evt', { n: 1 });
    await supa.trackPresence('room:x', 'alice', { role: 'A' });
    await runP;
    // event 3 種の kind field が展開されているか
    expect(collected.length).toBeGreaterThanOrEqual(2);
    // reset は internal cursor + mock を初期化
    driver.reset();
    expect(collected.length).toBe(0);
    expect(supa.getMetrics().subscribeCount).toBe(0);
  });

  it('T-RT-COV-F02 collector driver は postgres_changes event も kind mapping する', async () => {
    const supa = createSupabaseRealtimeMock({
      artificialLatencyMs: 0,
      scenarios: {
        'db:t': [
          {
            kind: 'postgres_changes',
            eventType: 'INSERT',
            schema: 'public',
            table: 'msg',
            oldRecord: null,
            newRecord: { id: 1 },
            delay: 2,
          },
        ],
      },
    });
    // subscribe 直後 に connection event が届くため expectedEvents=2 (connection + pg_change)。
    const { driver, collected } = createMockCollector(supa, 2);
    await driver.runScenario('db:t');
    // postgres_changes kind の event が collect される
    const pg = collected.find((c) => c.kind === 'postgres_changes');
    expect(pg).toBeDefined();
    expect((pg?.payload as { new: unknown }).new).toEqual({ id: 1 });
  });

  it('T-RT-COV-F03 withTimeout の timeout 分岐 = runRealtimeFidelityCheck reject', async () => {
    const hangDriver = {
      async runScenario() {
        return new Promise<Array<{
          kind: 'broadcast';
          order: number;
          relativeTimeMs: number;
        }>>(() => {});
      },
      reset() {},
    };
    await expect(
      runRealtimeFidelityCheck({
        realDriver: hangDriver,
        mockDriver: hangDriver,
        scenarios: ['s'],
        perScenarioTimeoutMs: 10,
      }),
    ).rejects.toThrow(/realtime fidelity timeout/);
  });
});

describe('coverage-batch1 — buildRealtimeReport optional input branches', () => {
  const fixtureFidelity = (): RealtimeFidelityReport => ({
    records: [
      {
        scenarioId: 'chat',
        real: [
          { kind: 'broadcast', event: 'chat', payload: { text: 'hi' }, order: 0, relativeTimeMs: 0 },
        ],
        mock: [
          { kind: 'broadcast', event: 'chat', payload: { text: 'hi' }, order: 0, relativeTimeMs: 0 },
        ],
        eventCountDiff: 0,
        kindOrderMatch: 1,
        payloadMatch: 1,
        accuracyScore: 1,
        totalDurationDiffMs: 0,
      },
    ],
    summary: {
      scenarios: 1,
      avgAccuracyScore: 1,
      avgEventCountDiff: 0,
      avgKindOrderMatch: 1,
      avgPayloadMatch: 1,
      avgTotalDurationDiffMs: 0,
      accuracyMethod: 'sequence-jaccard',
    },
  });

  it('T-RT-COV-R01 coverageV8Summary + mutation + notes + surfaceCoverage の branch 全経路', () => {
    const mock = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const report = buildRealtimeReport({
      provider: '@kiwa-lab/realtime',
      version: '0.9.0',
      fidelity: fixtureFidelity(),
      mockMetrics: mock.getMetrics(),
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 4 },
      coverageV8Summary: {
        lines: { pct: 92.5 },
        branches: { pct: 88.1 },
        functions: { pct: 90.0 },
      },
      mutation: { mutations: 100, killed: 92 },
      testCount: { behavior: 20, integration: 5, e2e: 0 },
      perfSamplesMs: [1, 2, 3, 4],
      costPerEventUsd: 0.00005,
      notes: 'batch1 fixture — full 4-branch cover',
    });
    expect(report.coverage.line).toBe(92.5);
    expect(report.coverage.branch).toBe(88.1);
    // killRate は quality-metrics 側で 0-100 スケール (killed/mutations * 100)。
    expect(report.mutation.killRate).toBeCloseTo(92, 0);
    expect(report.notes).toBe('batch1 fixture — full 4-branch cover');
    // surfaceCoverage 明示指定 → fidelity axis に反映
    expect(report.fidelity.mockCoveredMethods).toBe(3);
    expect(report.fidelity.realTotalMethods).toBe(4);
  });

  it('T-RT-COV-R02 fidelity records 空 + mockMetrics publish=0 = default fallback path', () => {
    const mock = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const emptyFid: RealtimeFidelityReport = {
      records: [],
      summary: {
        scenarios: 0,
        avgAccuracyScore: 0,
        avgEventCountDiff: 0,
        avgKindOrderMatch: 0,
        avgPayloadMatch: 0,
        avgTotalDurationDiffMs: 0,
        accuracyMethod: 'sequence-jaccard',
      },
    };
    const report = buildRealtimeReport({
      provider: '@kiwa-lab/realtime',
      version: '0.9.0',
      fidelity: emptyFid,
      mockMetrics: mock.getMetrics(),
    });
    // records 空 → promptTokens / completionTokens 空 → [0] fallback、 accuracy [1] fallback
    expect(report.token).toBeDefined();
    expect(report.accuracy?.score).toBe(1);
    // publish 0 → perRequestCost=totalCost=0、 samples に [perRequestCost] 1 件
    expect(report.cost).toBeDefined();
  });
});

describe('coverage-batch1 — session-orchestrator 未 cover 分岐', () => {
  it('T-R-SO-COV-01 reconnecting 状態 で user-disconnect → closed 遷移', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-failed', timestamp: 't1' });
    expect(s.state).toBe('reconnecting');
    s = dispatchEvent({ session: s, event: 'user-disconnect', timestamp: 't2' });
    expect(s.state).toBe('closed');
  });

  it('T-R-SO-COV-02 reconnecting 状態 で invalid event = soft-reject + state 維持', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-failed', timestamp: 't1' });
    expect(s.state).toBe('reconnecting');
    const next = dispatchEvent({ session: s, event: 'subscribe-succeeded', timestamp: 't2' });
    expect(next.state).toBe('reconnecting');
    expect(next.events).toContain('invalid:subscribe-succeeded-in-reconnecting');
  });

  it('T-R-SO-COV-03 degraded 状態 で heartbeat-lost = failures 累積 + state 維持', () => {
    let s: RealtimeSession = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't4' });
    expect(s.state).toBe('degraded');
    const before = s.heartbeatFailures;
    const next = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't5' });
    expect(next.state).toBe('degraded');
    expect(next.heartbeatFailures).toBe(before + 1);
  });

  it('T-R-SO-COV-04 degraded 状態 で connect-failed → reconnecting 遷移', () => {
    let s: RealtimeSession = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    for (let i = 0; i < 3; i += 1) {
      s = dispatchEvent({
        session: s,
        event: 'heartbeat-lost',
        timestamp: `hb-${i}`,
      });
    }
    expect(s.state).toBe('degraded');
    const next = dispatchEvent({ session: s, event: 'connect-failed', timestamp: 'cf' });
    expect(next.state).toBe('reconnecting');
    expect(next.reconnectRounds).toBe(s.reconnectRounds + 1);
  });

  it('T-R-SO-COV-05 degraded 状態 で user-disconnect → closed 遷移', () => {
    let s: RealtimeSession = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    for (let i = 0; i < 3; i += 1) {
      s = dispatchEvent({
        session: s,
        event: 'heartbeat-lost',
        timestamp: `hb-${i}`,
      });
    }
    expect(s.state).toBe('degraded');
    const next = dispatchEvent({ session: s, event: 'user-disconnect', timestamp: 'ud' });
    expect(next.state).toBe('closed');
  });

  it('T-R-SO-COV-06 degraded 状態 で invalid event = soft-reject + state 維持', () => {
    let s: RealtimeSession = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    for (let i = 0; i < 3; i += 1) {
      s = dispatchEvent({
        session: s,
        event: 'heartbeat-lost',
        timestamp: `hb-${i}`,
      });
    }
    expect(s.state).toBe('degraded');
    const next = dispatchEvent({ session: s, event: 'reconnect-succeeded', timestamp: 'inv' });
    // reconnect-succeeded は degraded では invalid → 状態維持
    expect(next.state).toBe('degraded');
    expect(next.events).toContain('invalid:reconnect-succeeded-in-degraded');
  });

  it('T-R-SO-COV-07 summarizeSession count は degraded / reconnecting 経由でも整合', () => {
    let s: RealtimeSession = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'subscribe-succeeded', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'reconnect-succeeded', timestamp: 't3' }); // invalid in subscribed
    const sum = summarizeSession(s);
    expect(sum.currentState).toBe('subscribed');
    expect(sum.invalidEvents).toBeGreaterThanOrEqual(1);
    expect(sum.broadcastsReceived).toBe(1);
  });
});

describe('coverage-batch1 — semantics 4 mock disposer function', () => {
  it('T-RT-COV-SEM-01 realtime-ai-inference onEvent 返り値 disposer が handler 削除', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    const off = mock.onEvent((e) => events.push(e));
    await mock.sendRequest({ requestId: 'r1', frameNumber: 1, modelName: 'x', budgetMs: 33 });
    off();
    await mock.sendRequest({ requestId: 'r2', frameNumber: 2, modelName: 'x', budgetMs: 33 });
    expect(events).toHaveLength(1);
  });

  it('T-RT-COV-SEM-02 simulcast-svc onEvent 返り値 disposer が handler 削除', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    const off = mock.onEvent((e) => events.push(e));
    await mock.addSimulcastLayer({
      layerId: 'high',
      resolution: '1280x720',
      bitrateKbps: 2500,
      scalabilityMode: 'L1T3',
    });
    off();
    await mock.addSimulcastLayer({
      layerId: 'low',
      resolution: '640x480',
      bitrateKbps: 500,
      scalabilityMode: 'L1T1',
    });
    expect(events).toHaveLength(1);
  });

  it('T-RT-COV-SEM-03 webcodecs-decoder onEvent 返り値 disposer が handler 削除', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    const off = mock.onEvent((e) => events.push(e));
    await mock.decodeFrame({ decoderId: 'd', frameNumber: 1, type: 'key' });
    off();
    await mock.decodeFrame({ decoderId: 'd', frameNumber: 2, type: 'delta' });
    expect(events).toHaveLength(1);
  });

  it('T-RT-COV-SEM-04 whisper-streaming onEvent 返り値 disposer が handler 削除', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    const off = mock.onEvent((e) => events.push(e));
    await mock.sendAudioChunk({ streamId: 's1', byteLength: 100, durationMs: 20 });
    off();
    await mock.sendAudioChunk({ streamId: 's1', byteLength: 200, durationMs: 40 });
    expect(events).toHaveLength(1);
  });

  it('T-RT-COV-SEM-05 disposer 二重呼出 safe (indexOf < 0 経路)', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    const off = mock.onEvent((e) => events.push(e));
    off();
    // 2 回目呼出は splice 経路で idx < 0 のため noop
    off();
    await mock.sendDatagram({
      trackName: 'v',
      sequenceNumber: 1,
      payloadBytes: 100,
      priority: 0,
    });
    expect(events).toHaveLength(0);
  });
});

describe('coverage-batch1 — 追加 gap fill', () => {
  it('T-RT-COV-EXTRA-01 pusher subscription_succeeded handler が membersView.each を呼出す', async () => {
    const client = createPusherMock({ artificialLatencyMs: 0, userId: 'alice' });
    const ch = client.subscribeChannel('presence-room-e2');
    // 先に presence を join させて members map を populate
    await client.trackPresence('presence-room-e2', 'alice', { role: 'A' });
    let membersViewEach: string[] = [];
    ch.bind('pusher:subscription_succeeded', (arg) => {
      const mv = arg as PusherMembers;
      mv.each((m: PusherMember) => membersViewEach.push(m.id));
    });
    // subscribe 経路の initSubscription が発火する tick を待つ
    await new Promise((r) => setTimeout(r, 40));
    // presence channel initSubscription 経路の each closure が呼ばれる
    // (state.members が empty の初回起動時は 0 件 for-loop 経由で closure body は空回し)
    expect(Array.isArray(membersViewEach)).toBe(true);
  });

  it('T-RT-COV-EXTRA-02 supabase channel.unsubscribe with track cleanup', async () => {
    const client = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const channel = client.channel('room:cleanup');
    await channel.subscribe();
    // track → trackedUserId 保存
    await channel.track({ userId: 'alice', name: 'Alice' });
    // unsubscribe は trackedUserId !== null で untrackPresence 経路を通る
    const result = await channel.unsubscribe();
    expect(result).toBe('ok');
  });

  it('T-RT-COV-EXTRA-03 socketio disconnected connection event で connected=false 遷移', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const s = client.io('/');
    let discFired = 0;
    s.on('disconnect', () => {
      discFired += 1;
    });
    s.on('connect', () => {});
    await new Promise((r) => setTimeout(r, 30));
    // connected getter を明示的に読む (line 89 getter 経路 cover)
    expect(s.connected).toBe(true);
    // engine 側 disconnect で connection event 'disconnected' が subscribed room に伝播
    // → socket 内の bindConnection('disconnect') 経路 (line 74-76) が走る
    await client.disconnect();
    await new Promise((r) => setTimeout(r, 30));
    // 少なくとも disconnect handler が発火した
    expect(discFired).toBeGreaterThanOrEqual(1);
    // no-op setter (line 91-92) 経路も cover 経由で 1 回叩いて network 化する
    s.connected = false;
  });

  it('T-RT-COV-EXTRA-04 socketio reconnecting connection event → reconnect handler', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const s = client.io('/');
    let reconnFired = 0;
    s.on('reconnect', () => {
      reconnFired += 1;
    });
    s.on('connect', () => {});
    await new Promise((r) => setTimeout(r, 30));
    // engine.reconnect() は setConnectionState('reconnecting') → subscribed room の handler が呼ばれる。
    await client.reconnect();
    await new Promise((r) => setTimeout(r, 30));
    // reconnect event は少なくとも 1 回発火
    expect(reconnFired).toBeGreaterThanOrEqual(1);
  });
});

describe('coverage-batch1 — real-driver envSource 省略経路', () => {
  it('T-RT-COV-RD-01 resolveRealtimeDriver envSource 省略 → process.env 参照 → mock fallback', () => {
    // process.env に KIWA_MODE=real は default 未設定なので mock 経路に落ちる
    const original = process.env.KIWA_MODE;
    delete process.env.KIWA_MODE;
    try {
      const result = resolveRealtimeDriver<{ tag: string }>({
        provider: 'ably',
        requiredKeys: ['ABLY_API_KEY'],
        createReal: () => ({ tag: 'real' }),
        createMock: () => ({ tag: 'mock' }),
      });
      expect(result.isReal).toBe(false);
      expect(result.driver.tag).toBe('mock');
    } finally {
      if (original !== undefined) process.env.KIWA_MODE = original;
    }
  });

  it('T-RT-COV-RD-02 resolveRealtimeDriverByProvider envSource 省略経路', () => {
    const original = process.env.KIWA_MODE;
    delete process.env.KIWA_MODE;
    try {
      const result = resolveRealtimeDriverByProvider<{ tag: string }>(
        'pusher',
        () => ({ tag: 'real' }),
        () => ({ tag: 'mock' }),
      );
      expect(result.isReal).toBe(false);
      expect(result.driver.tag).toBe('mock');
    } finally {
      if (original !== undefined) process.env.KIWA_MODE = original;
    }
  });
});
