import { describe, expect, it } from 'vitest';
import {
  dispatchJobEvent,
  startJob,
  summarizeJob,
  type JobEvent,
  type JobSession,
} from '../../src/index.js';

/**
 * `summarizeJob` の集計を検証する test。
 *
 * 同関数は既存 test から 1 度も呼ばれておらず、`events` を数える 3 本の filter と
 * `validEvents` の引き算がまるごと無検査だった。 変異試験では 16 件が生き残っていた。
 *
 * 数え方は event 文字列の接頭辞で決まる。
 *
 * | 接頭辞 | 積まれる場面 |
 * |---|---|
 * | (なし) | `startJob` が積む `job-started` の 1 件だけ |
 * | `event:` | `dispatchEvent` が呼ばれるたびに必ず 1 件 |
 * | `invalid:` | 非終端 state で受理できない event が来た時に追加で 1 件 |
 * | `terminal:` | 終端 state (`dlq` / `completed`) で event が来た時に追加で 1 件 |
 *
 * `event:` はすべての dispatch に付くので、そこから `invalid:` と `terminal:` を引くと
 * 「受理された dispatch の数」 になる。 3 接頭辞は互いに素で、引き算はこの関係に依存する。
 */

const TS = '2026-08-21T00:00:00Z';

/** 一連の event を順に流す。 */
function run(events: JobEvent[]): JobSession {
  let session = startJob({ timestamp: TS });
  for (const event of events) {
    session = dispatchJobEvent({ session, event, timestamp: TS });
  }
  return session;
}

/** 接頭辞ごとの実件数。 期待値を組み立てる側で数え直さないための補助。 */
function countByPrefix(session: JobSession) {
  const of = (prefix: string) => session.events.filter((e) => e.startsWith(prefix)).length;
  return {
    dispatched: of('event:'),
    invalid: of('invalid:'),
    terminal: of('terminal:'),
    total: session.events.length,
  };
}

describe('summarizeJob — event の数え方', () => {
  it('T-QUEUE-JS-001 開始直後は job-started の 1 件だけを数える', () => {
    const session = startJob({ timestamp: TS });
    expect(session.events).toStrictEqual(['job-started']);
    expect(summarizeJob(session)).toStrictEqual({
      currentState: 'queued',
      totalEvents: 1,
      validEvents: 0,
      invalidEvents: 0,
      terminalEvents: 0,
      enqueues: 0,
      processStarts: 0,
      processSuccesses: 0,
      processFailures: 0,
      retries: 0,
      dlqInspections: 0,
    });
  });

  it('T-QUEUE-JS-002 受理された dispatch だけが validEvents に数えられる', () => {
    // queued → processing → completed。 3 件とも受理される。
    const session = run(['enqueue-succeeded', 'process-started', 'process-succeeded']);
    const summary = summarizeJob(session);
    expect(summary.currentState).toBe('completed');
    expect(summary.validEvents).toBe(3);
    expect(summary.invalidEvents).toBe(0);
    expect(summary.terminalEvents).toBe(0);
    // `job-started` 1 件 + dispatch ごとの `event:` 3 件。
    expect(summary.totalEvents).toBe(4);
  });

  it('T-QUEUE-JS-003 受理できない event は invalidEvents に数え、validEvents から外す', () => {
    // queued state に process-succeeded は来られない。
    const session = run(['process-succeeded', 'enqueue-succeeded']);
    const summary = summarizeJob(session);
    expect(summary.invalidEvents).toBe(1);
    expect(summary.terminalEvents).toBe(0);
    expect(summary.validEvents).toBe(1);
    // `job-started` + `event:` 2 件 + `invalid:` 1 件。
    expect(summary.totalEvents).toBe(4);
  });

  it('T-QUEUE-JS-004 終端 state に来た event は terminalEvents に数え、validEvents から外す', () => {
    const session = run([
      'process-started',
      'process-succeeded',
      'dlq-inspected',
      'timeout',
    ]);
    const summary = summarizeJob(session);
    expect(summary.currentState).toBe('completed');
    expect(summary.terminalEvents).toBe(2);
    expect(summary.invalidEvents).toBe(0);
    expect(summary.validEvents).toBe(2);
    // `job-started` + `event:` 4 件 + `terminal:` 2 件。
    expect(summary.totalEvents).toBe(7);
  });

  it('T-QUEUE-JS-005 invalid と terminal が混ざっても 3 つの数の和が dispatch 数になる', () => {
    const events: JobEvent[] = [
      'process-succeeded', // queued では受理できない → invalid
      'process-started',
      'retry-scheduled', // processing では受理できない → invalid
      'process-failed',
      'retry-exhausted', // → dlq
      'dlq-inspected',
      'process-started', // dlq は終端 → terminal
    ];
    const session = run(events);
    const summary = summarizeJob(session);
    const actual = countByPrefix(session);

    expect(actual.dispatched, 'dispatch 数が events から読み取れていない').toBe(events.length);
    expect(summary.invalidEvents).toBe(actual.invalid);
    expect(summary.terminalEvents).toBe(actual.terminal);
    expect(summary.validEvents).toBe(actual.dispatched - actual.invalid - actual.terminal);
    expect(summary.totalEvents).toBe(actual.total);
    // 3 つの数の和が dispatch 数に一致する = 引き算が正しい向きを向いている。
    expect(summary.validEvents + summary.invalidEvents + summary.terminalEvents).toBe(
      events.length,
    );
    // 実測値。 引き算の符号が変われば必ずここが動く。
    expect({
      valid: summary.validEvents,
      invalid: summary.invalidEvents,
      terminal: summary.terminalEvents,
    }).toStrictEqual({ valid: 4, invalid: 2, terminal: 1 });
  });

  it('T-QUEUE-JS-006 接頭辞は前方一致で見る (末尾一致では 1 件も数えない)', () => {
    const session = run(['process-succeeded']);
    const invalidEntries = session.events.filter((e) => e.startsWith('invalid:'));
    expect(invalidEntries.length, 'invalid: で始まる event が 1 件も無い').toBeGreaterThan(0);
    // 実データの形。 `invalid:` は先頭にしか現れず、末尾一致では 0 件になる。
    for (const entry of invalidEntries) {
      expect(entry.endsWith('invalid:')).toBe(false);
    }
    expect(summarizeJob(session).invalidEvents).toBe(invalidEntries.length);
  });

  it('T-QUEUE-JS-007 3 つの接頭辞は互いに素で、1 つの event が 2 度数えられない', () => {
    const session = run(['process-succeeded', 'process-started', 'timeout', 'dlq-inspected', 'timeout']);
    const prefixes = ['event:', 'invalid:', 'terminal:'];
    for (const entry of session.events) {
      const hit = prefixes.filter((p) => entry.startsWith(p));
      expect(hit.length, `${entry} が複数の接頭辞に一致している`).toBeLessThanOrEqual(1);
    }
    const actual = countByPrefix(session);
    expect(actual.total, '接頭辞なしの job-started を数え落としている').toBe(
      1 + actual.dispatched + actual.invalid + actual.terminal,
    );
  });

  it('T-QUEUE-JS-008 遷移の副作用 counter は summary にそのまま載る', () => {
    const session = run([
      'enqueue-succeeded',
      'process-started',
      'process-failed',
      'retry-scheduled',
      'process-started',
      'timeout',
      'dlq-inspected',
      'dlq-inspected',
    ]);
    const summary = summarizeJob(session);
    expect({
      currentState: summary.currentState,
      enqueues: summary.enqueues,
      processStarts: summary.processStarts,
      processSuccesses: summary.processSuccesses,
      processFailures: summary.processFailures,
      retries: summary.retries,
      dlqInspections: summary.dlqInspections,
    }).toStrictEqual({
      currentState: 'dlq',
      enqueues: 1,
      processStarts: 2,
      processSuccesses: 0,
      processFailures: 1,
      retries: 1,
      dlqInspections: 2,
    });
  });
});
