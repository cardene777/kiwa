import type { RealtimeAnyEvent, RealtimeMock } from './types.js';

/**
 * Real vs mock 差分計測 harness (Realtime 版)。
 *
 * v1.13 dogfood app が real provider (Supabase / Ably / Pusher / Socket.io)
 * と kiwa mock の両方に同じ scenario を投げ、 event 列 / ordering / timing の
 * diff を計測する SSOT。
 *
 * 5 scenario ...
 * - chat message broadcast (順序保証、 payload 一致)
 * - presence join-leave (member 状態遷移)
 * - postgres row change (INSERT / UPDATE / DELETE の 3 event、 Supabase 固有)
 * - room subscribe race (複数 room の同時 subscribe で event の混線しない)
 * - reconnect with pending events (disconnect 中の publish が reconnect 後に届く)
 */

/** 単一 scenario の driver — real 側 driver / mock 側 driver 両方に同じ shape で実装。 */
export interface RealtimeDriver {
  /** 期待する event 数だけ collect する。 timeout で強制終了。 */
  runScenario(scenarioId: string): Promise<CollectedEvent[]>;
  reset(): void;
}

/** driver から返される event の統一形式。 provider 別詳細は payload に格納。 */
export interface CollectedEvent {
  kind: RealtimeAnyEvent['kind'];
  channel?: string;
  event?: string;
  payload?: unknown;
  order: number;
  /** 集計開始からの相対 ms (ordering 検証用)。 */
  relativeTimeMs: number;
}

export interface RealtimeFidelityInput {
  realDriver: RealtimeDriver;
  mockDriver: RealtimeDriver;
  /** 実行する scenario 名リスト。 */
  scenarios: string[];
  /** 1 scenario あたりの timeout (ms、 default 3000)。 */
  perScenarioTimeoutMs?: number;
}

export interface RealtimeFidelityRecord {
  scenarioId: string;
  real: CollectedEvent[];
  mock: CollectedEvent[];
  /** event 数の差 (real - mock)。 */
  eventCountDiff: number;
  /** kind 列の順序一致率 0-1。 */
  kindOrderMatch: number;
  /** payload / event 名の一致率 0-1。 */
  payloadMatch: number;
  /** 総合 accuracy score 0-1 (順序 * payload の平均)。 */
  accuracyScore: number;
  /** 集計開始からの合計時間差 (ms)。 */
  totalDurationDiffMs: number;
}

export interface RealtimeFidelityReport {
  records: RealtimeFidelityRecord[];
  summary: {
    scenarios: number;
    avgAccuracyScore: number;
    avgEventCountDiff: number;
    avgKindOrderMatch: number;
    avgPayloadMatch: number;
    avgTotalDurationDiffMs: number;
    accuracyMethod: 'sequence-jaccard';
  };
}

export async function runRealtimeFidelityCheck(
  input: RealtimeFidelityInput,
): Promise<RealtimeFidelityReport> {
  const timeout = input.perScenarioTimeoutMs ?? 3000;
  const records: RealtimeFidelityRecord[] = [];
  for (const scenario of input.scenarios) {
    input.realDriver.reset();
    input.mockDriver.reset();
    const [real, mock] = await Promise.all([
      withTimeout(input.realDriver.runScenario(scenario), timeout),
      withTimeout(input.mockDriver.runScenario(scenario), timeout),
    ]);
    const kindOrderMatch = sequenceSimilarity(
      real.map((e) => e.kind),
      mock.map((e) => e.kind),
    );
    const payloadMatch = sequenceSimilarity(
      real.map((e) => `${e.event ?? e.kind}:${JSON.stringify(e.payload ?? null)}`),
      mock.map((e) => `${e.event ?? e.kind}:${JSON.stringify(e.payload ?? null)}`),
    );
    const totalReal = real.at(-1)?.relativeTimeMs ?? 0;
    const totalMock = mock.at(-1)?.relativeTimeMs ?? 0;
    records.push({
      scenarioId: scenario,
      real,
      mock,
      eventCountDiff: real.length - mock.length,
      kindOrderMatch,
      payloadMatch,
      accuracyScore: (kindOrderMatch + payloadMatch) / 2,
      totalDurationDiffMs: totalReal - totalMock,
    });
  }
  const n = Math.max(1, records.length);
  return {
    records,
    summary: {
      scenarios: records.length,
      avgAccuracyScore: records.reduce((s, r) => s + r.accuracyScore, 0) / n,
      avgEventCountDiff: records.reduce((s, r) => s + r.eventCountDiff, 0) / n,
      avgKindOrderMatch: records.reduce((s, r) => s + r.kindOrderMatch, 0) / n,
      avgPayloadMatch: records.reduce((s, r) => s + r.payloadMatch, 0) / n,
      avgTotalDurationDiffMs: records.reduce((s, r) => s + r.totalDurationDiffMs, 0) / n,
      accuracyMethod: 'sequence-jaccard',
    },
  };
}

/**
 * 順序考慮 sequence similarity — LCS 系ではなく position-aware Jaccard で
 * 計算する。 完全一致 = 1、 順序ずれ = 中間値、 完全不一致 = 0。
 */
export function sequenceSimilarity<T>(a: T[], b: T[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const n = Math.max(a.length, b.length);
  let matched = 0;
  for (let i = 0; i < n; i += 1) {
    if (i < a.length && i < b.length && deepEqual(a[i], b[i])) {
      matched += 1;
    }
  }
  return matched / n;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * 便利 helper — RealtimeMock を CollectedEvent stream に変換する minimum driver。
 * scenario 実装は user 側だが、 event collector は本 helper 経由で共通化できる。
 */
export function createMockCollector(mock: RealtimeMock, expectedEvents: number): {
  driver: RealtimeDriver;
  collected: CollectedEvent[];
} {
  const collected: CollectedEvent[] = [];
  let order = 0;
  const startTime = Date.now();
  let currentChannel = '';
  const driver: RealtimeDriver = {
    async runScenario(scenarioId) {
      // scenario 実装は呼出側で行う想定、 本 helper は event collect のみ担当。
      // 呼出側が subscribe → publish → 期待 event 数集めた時点で解決する。
      currentChannel = scenarioId;
      const handle = await mock.subscribe(scenarioId, (event) => {
        const relative = Date.now() - startTime;
        const item: CollectedEvent = {
          kind: event.kind,
          channel: currentChannel,
          order: order++,
          relativeTimeMs: relative,
        };
        if (event.kind === 'broadcast') {
          item.event = event.event;
          item.payload = event.payload;
        } else if (event.kind === 'presence') {
          item.event = event.type;
          item.payload = event.members;
        } else if (event.kind === 'postgres_changes') {
          item.event = event.eventType;
          item.payload = { new: event.newRecord, old: event.oldRecord };
        }
        collected.push(item);
      });
      // 期待 event 数に達するまで待機、 timeout は上位で制御
      await waitFor(() => collected.length >= expectedEvents, 100);
      await handle.unsubscribe();
      return [...collected];
    },
    reset() {
      collected.length = 0;
      order = 0;
      mock.reset();
    },
  };
  return { driver, collected };
}

async function waitFor(condition: () => boolean, intervalMs: number): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!condition() && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function withTimeout<T>(p: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`realtime fidelity timeout ${timeoutMs}ms`)), timeoutMs);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e as Error);
      },
    );
  });
}
