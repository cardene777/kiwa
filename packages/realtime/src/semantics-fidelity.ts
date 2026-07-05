import type { SemanticsEvent, SemanticsMock } from './semantics/types.js';

/**
 * v0.2 advanced semantics fidelity harness (3 protocol × 8 axis = 24 row grid)。
 *
 * v1.13 の 5 scenario harness (`fidelity.ts`) と互換な shape の subset で、
 * 各 axis mock を「共通の event stream」 として比較する。 grid は
 * `(protocol, axis)` pair で index されるため 24 row まで拡張可能。
 *
 * 実際に 24 row 分回すには 3 protocol × 8 axis の対応表が必要 (下記
 * `SEMANTICS_GRID` に定義)。 axis によっては protocol が固定 (`webrtc-signaling`
 * は `webrtc` のみ) だが、 grid では該当 row を「該当 axis の canonical
 * protocol でのみ計測」 として運用し、 該当なし row は `applicable: false`
 * で明示する。 これにより 24 row grid の visual matrix と実計測 axis 数
 * (8) のトレーサビリティが取れる。
 */

import type { SemanticsAxis, SemanticsProtocol } from './semantics/types.js';

export interface SemanticsGridRow {
  protocol: SemanticsProtocol;
  axis: SemanticsAxis;
  /** 該当 protocol × axis の組合せが有効か。 false なら計測不要。 */
  applicable: boolean;
}

/** 3 protocol × 8 axis = 24 row grid の SSOT 定義。 */
export const SEMANTICS_GRID: SemanticsGridRow[] = [
  // WebRTC axes — protocol=webrtc のみ applicable
  { protocol: 'webrtc', axis: 'webrtc-signaling', applicable: true },
  { protocol: 'webrtc', axis: 'webrtc-data-channel', applicable: true },
  { protocol: 'webrtc', axis: 'webrtc-track', applicable: true },
  { protocol: 'webrtc', axis: 'webrtc-ice', applicable: true },
  { protocol: 'webrtc', axis: 'webtransport-uni', applicable: false },
  { protocol: 'webrtc', axis: 'webtransport-bi', applicable: false },
  { protocol: 'webrtc', axis: 'http3-push', applicable: false },
  { protocol: 'webrtc', axis: 'quic-multiplex', applicable: false },
  // WebTransport axes — protocol=webtransport のみ applicable
  { protocol: 'webtransport', axis: 'webrtc-signaling', applicable: false },
  { protocol: 'webtransport', axis: 'webrtc-data-channel', applicable: false },
  { protocol: 'webtransport', axis: 'webrtc-track', applicable: false },
  { protocol: 'webtransport', axis: 'webrtc-ice', applicable: false },
  { protocol: 'webtransport', axis: 'webtransport-uni', applicable: true },
  { protocol: 'webtransport', axis: 'webtransport-bi', applicable: true },
  { protocol: 'webtransport', axis: 'http3-push', applicable: false },
  { protocol: 'webtransport', axis: 'quic-multiplex', applicable: false },
  // HTTP/3 + QUIC axes — protocol=http3-quic のみ applicable
  { protocol: 'http3-quic', axis: 'webrtc-signaling', applicable: false },
  { protocol: 'http3-quic', axis: 'webrtc-data-channel', applicable: false },
  { protocol: 'http3-quic', axis: 'webrtc-track', applicable: false },
  { protocol: 'http3-quic', axis: 'webrtc-ice', applicable: false },
  { protocol: 'http3-quic', axis: 'webtransport-uni', applicable: false },
  { protocol: 'http3-quic', axis: 'webtransport-bi', applicable: false },
  { protocol: 'http3-quic', axis: 'http3-push', applicable: true },
  { protocol: 'http3-quic', axis: 'quic-multiplex', applicable: true },
];

export interface SemanticsFidelityInput {
  mock: SemanticsMock;
  /** scenario 実行本体 — mock を操作して event を発火させる。 */
  scenario: () => Promise<void>;
  /** collect timeout (ms、 default 3000)。 */
  timeoutMs?: number;
}

export interface SemanticsFidelityRow {
  protocol: SemanticsProtocol;
  axis: SemanticsAxis;
  applicable: boolean;
  eventsEmitted: number;
  streamsOpened: number;
  streamsClosed: number;
  streamsReset: number;
  backpressureCount: number;
  /** scenario 実行中に発生した event 列 (順序保持)。 */
  events: SemanticsEvent[];
}

/**
 * 単一 axis の fidelity 計測。 mock を初期化 → scenario を実行 → event 列を
 * 収集 → metrics + events を返す。
 */
export async function measureSemanticsAxis(
  input: SemanticsFidelityInput,
): Promise<SemanticsFidelityRow> {
  const timeout = input.timeoutMs ?? 3000;
  const events: SemanticsEvent[] = [];
  const off = input.mock.onEvent((e) => events.push(e));
  input.mock.reset();
  const runPromise = input.scenario();
  await Promise.race([
    runPromise,
    new Promise<void>((_r, reject) =>
      setTimeout(() => reject(new Error(`semantics timeout ${timeout}ms`)), timeout),
    ),
  ]);
  off();
  const metrics = input.mock.getMetrics();
  return {
    protocol: input.mock.protocol,
    axis: input.mock.axis,
    applicable: true,
    eventsEmitted: metrics.eventsEmitted,
    streamsOpened: metrics.streamsOpened,
    streamsClosed: metrics.streamsClosed,
    streamsReset: metrics.streamsReset,
    backpressureCount: metrics.backpressureCount,
    events: [...events],
  };
}

/**
 * grid 全 24 row 分の scenario を map に登録して一括計測。 applicable=false の
 * row は placeholder row として返す (visual matrix の 24 row を保つため)。
 */
export interface SemanticsGridScenarios {
  scenarios: Map<
    SemanticsAxis,
    { mock: SemanticsMock; scenario: () => Promise<void> }
  >;
}

export async function measureSemanticsGrid(
  input: SemanticsGridScenarios,
): Promise<SemanticsFidelityRow[]> {
  const rows: SemanticsFidelityRow[] = [];
  const measured = new Set<SemanticsAxis>();
  for (const gridRow of SEMANTICS_GRID) {
    if (!gridRow.applicable) {
      rows.push({
        protocol: gridRow.protocol,
        axis: gridRow.axis,
        applicable: false,
        eventsEmitted: 0,
        streamsOpened: 0,
        streamsClosed: 0,
        streamsReset: 0,
        backpressureCount: 0,
        events: [],
      });
      continue;
    }
    const entry = input.scenarios.get(gridRow.axis);
    if (!entry || measured.has(gridRow.axis)) {
      rows.push({
        protocol: gridRow.protocol,
        axis: gridRow.axis,
        applicable: true,
        eventsEmitted: 0,
        streamsOpened: 0,
        streamsClosed: 0,
        streamsReset: 0,
        backpressureCount: 0,
        events: [],
      });
      continue;
    }
    const row = await measureSemanticsAxis({
      mock: entry.mock,
      scenario: entry.scenario,
    });
    rows.push(row);
    measured.add(gridRow.axis);
  }
  return rows;
}
