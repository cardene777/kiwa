// 遅い test を出す経路の検査 (Issue #2186)。
//
// `durationMs` は全 record が持っていたのに、dashboard が 1 度も出していなかった。
// 集めているものを使うだけなので、守るべきは「使い方を誤らないこと」 に寄る。
//
//   - 0 を「速い」 と読ませない (duration を出さない reporter で全件 0 になる)
//   - 「前 run が無い」 を 0 に倒さない (倒すと初回が必ず「大幅に遅くなった」 と出る)
//   - 上位 N が全件を覆っていないことを書く
import { describe, expect, it } from 'vitest';

import { analyzeSlowest } from '../src/slowest.js';
import { renderDashboard } from '../src/dashboard.js';
import type { RunHistory, TestRunRecord } from '../src/types.js';

function rec(over: Partial<TestRunRecord> & { testId: string }): TestRunRecord {
  return {
    fullName: over.fullName ?? over.testId,
    status: over.status ?? 'passed',
    durationMs: over.durationMs ?? 0,
    runId: over.runId ?? 'run-1',
    startedAt: over.startedAt ?? 1000,
    testId: over.testId,
  };
}

function history(...records: TestRunRecord[]): RunHistory {
  return { records };
}

describe('analyzeSlowest (#2186)', () => {
  it('T-SLW-001 遅い順に上位を返し、合計を出す', () => {
    const result = analyzeSlowest({
      history: history(
        rec({ testId: 'a', durationMs: 10 }),
        rec({ testId: 'b', durationMs: 300 }),
        rec({ testId: 'c', durationMs: 50 }),
      ),
      limit: 2,
    });
    expect(result.slowest.map((s) => s.testId)).toEqual(['b', 'c']);
    expect(result.totalMs).toBe(360);
    expect(result.measured).toBe(3);
    expect(result.unmeasured).toBe(0);
  });

  it('T-SLW-002 duration 0 の record を上位に混ぜない', () => {
    // duration を出さない reporter 設定では全 record が 0 になる。 混ぜると
    // 「遅い test の一覧」 が 0ms で埋まって意味を失う。
    const result = analyzeSlowest({
      history: history(
        rec({ testId: 'zero-1' }),
        rec({ testId: 'slow', durationMs: 42 }),
        rec({ testId: 'zero-2' }),
      ),
      limit: 5,
    });
    expect(result.slowest.map((s) => s.testId)).toEqual(['slow']);
    expect(result.measured).toBe(1);
    expect(result.unmeasured).toBe(2);
  });

  it('T-SLW-003 測れた record が 1 件も無ければ上位は空', () => {
    const result = analyzeSlowest({ history: history(rec({ testId: 'a' }), rec({ testId: 'b' })) });
    expect(result.slowest).toEqual([]);
    expect(result.measured).toBe(0);
    expect(result.unmeasured).toBe(2);
    expect(result.totalMs).toBe(0);
  });

  it('T-SLW-004 record 0 件でも落ちない', () => {
    const result = analyzeSlowest({ history: history() });
    expect(result.slowest).toEqual([]);
    expect(result.totalMs).toBe(0);
    expect(result.measured).toBe(0);
    expect(result.previousTotalMs).toBeNull();
  });

  it('T-SLW-005 比較対象が無い時は previousTotalMs を null にする (0 に倒さない)', () => {
    // 0 に倒すと初回の run が必ず「+全部ぶん遅くなった」 と出る。
    const only = history(rec({ testId: 'a', durationMs: 100 }));
    const withoutCumulative = analyzeSlowest({ history: only });
    expect(withoutCumulative.previousTotalMs).toBeNull();
    expect(withoutCumulative.deltaMs).toBeNull();
    expect(withoutCumulative.deltaRatio).toBeNull();

    // 累積を渡しても、この run 以外の run が無ければ比較対象は見つからない。
    const sameRunOnly = analyzeSlowest({ history: only, cumulative: only });
    expect(sameRunOnly.previousTotalMs).toBeNull();
  });

  it('T-SLW-006 直前の run と比べて差を出す', () => {
    const current = history(rec({ testId: 'a', durationMs: 150, runId: 'run-2', startedAt: 2000 }));
    const cumulative = history(
      rec({ testId: 'a', durationMs: 100, runId: 'run-1', startedAt: 1000 }),
      rec({ testId: 'a', durationMs: 150, runId: 'run-2', startedAt: 2000 }),
    );
    const result = analyzeSlowest({ history: current, cumulative });
    expect(result.previousTotalMs).toBe(100);
    expect(result.deltaMs).toBe(50);
    expect(result.deltaRatio).toBeCloseTo(0.5, 5);
  });

  it('T-SLW-007 直前の run は開始時刻で選ぶ (record の並び順ではない)', () => {
    // record の順序は保証されていない。 先頭の値で判定すると、古い run を
    // 「直前」 と誤認して差が別の run との比較になる。
    const current = history(rec({ testId: 'a', durationMs: 10, runId: 'run-3', startedAt: 3000 }));
    const cumulative = history(
      rec({ testId: 'a', durationMs: 700, runId: 'run-1', startedAt: 1000 }),
      rec({ testId: 'a', durationMs: 10, runId: 'run-3', startedAt: 3000 }),
      rec({ testId: 'a', durationMs: 200, runId: 'run-2', startedAt: 2000 }),
    );
    const result = analyzeSlowest({ history: current, cumulative });
    expect(result.previousTotalMs, 'run-2 (直前) ではなく別の run を見ている').toBe(200);
  });

  it('T-SLW-008 run の開始時刻は最小を採る', () => {
    // 同じ run の record が別々の startedAt を持つ形 (vitest と Playwright を 1 run に
    // 束ねる経路) で、先頭の値を使うと run の前後関係が入れ替わる。
    const current = history(rec({ testId: 'x', durationMs: 1, runId: 'now', startedAt: 9000 }));
    const cumulative = history(
      rec({ testId: 'a', durationMs: 5, runId: 'old', startedAt: 5000 }),
      rec({ testId: 'b', durationMs: 7, runId: 'new', startedAt: 8000 }),
      rec({ testId: 'c', durationMs: 3, runId: 'new', startedAt: 1000 }),
      rec({ testId: 'x', durationMs: 1, runId: 'now', startedAt: 9000 }),
    );
    // `new` の開始は最小の 1000 なので `old` (5000) の方が新しい = 直前は `old`。
    const result = analyzeSlowest({ history: current, cumulative });
    expect(result.previousTotalMs, '開始時刻に最小ではなく先頭の値を使っている').toBe(5);
  });

  it('T-SLW-009 前 run が 0ms の時に比を Infinity にしない', () => {
    const current = history(rec({ testId: 'a', durationMs: 50, runId: 'run-2', startedAt: 2000 }));
    const cumulative = history(
      rec({ testId: 'a', durationMs: 0, runId: 'run-1', startedAt: 1000 }),
      rec({ testId: 'a', durationMs: 50, runId: 'run-2', startedAt: 2000 }),
    );
    const result = analyzeSlowest({ history: current, cumulative });
    expect(result.previousTotalMs).toBe(0);
    expect(result.deltaMs).toBe(50);
    expect(result.deltaRatio, '前 run が 0ms なのに比を出している').toBeNull();
  });

  it('T-SLW-010 limit の不正値は既定 5 に倒す', () => {
    const records = Array.from({ length: 8 }, (_, index) =>
      rec({ testId: `t${index}`, durationMs: index + 1 }),
    );
    for (const limit of [0, -1, 1.5, Number.NaN]) {
      const result = analyzeSlowest({ history: history(...records), limit });
      expect(result.slowest.length, `limit=${limit} で件数が既定でない`).toBe(5);
    }
  });

  it('T-SLW-011 同じ duration の並びが実行ごとに変わらない', () => {
    // 並びが不安定だと、dashboard の差分が中身と無関係に動く。
    const records = [
      rec({ testId: 'c', durationMs: 10 }),
      rec({ testId: 'a', durationMs: 10 }),
      rec({ testId: 'b', durationMs: 10 }),
    ];
    const first = analyzeSlowest({ history: history(...records), limit: 3 });
    const second = analyzeSlowest({ history: history(...[...records].reverse()), limit: 3 });
    expect(first.slowest.map((s) => s.testId)).toEqual(['a', 'b', 'c']);
    expect(second.slowest.map((s) => s.testId)).toEqual(['a', 'b', 'c']);
  });

  it('T-SLW-012 入力の history を書き換えない', () => {
    const records = [
      rec({ testId: 'a', durationMs: 10 }),
      rec({ testId: 'b', durationMs: 300 }),
    ];
    const input = history(...records);
    analyzeSlowest({ history: input, limit: 2 });
    expect(input.records.map((r) => r.testId), '呼出側の配列を並べ替えている').toEqual(['a', 'b']);
  });
});

describe('dashboard の Execution time section (#2186)', () => {
  const base = { flaky: [], gaps: [] };

  it('T-SLW-020 section を出し、上位と合計と差が読める', () => {
    const md = renderDashboard({
      ...base,
      history: history(rec({ testId: 'slow', durationMs: 2500, runId: 'run-2', startedAt: 2000 })),
      flakyHistory: history(
        rec({ testId: 'slow', durationMs: 2000, runId: 'run-1', startedAt: 1000 }),
        rec({ testId: 'slow', durationMs: 2500, runId: 'run-2', startedAt: 2000 }),
      ),
    });
    expect(md).toContain('## Execution time');
    expect(md).toContain('| total | 2.5s |');
    expect(md).toContain('| previous run total | 2.0s |');
    expect(md).toContain('+500ms (+25.0%)');
    expect(md).toContain('| slow | 2.5s |');
  });

  it('T-SLW-021 record 0 件で「測っていない」 と書く (「速い」 と書かない)', () => {
    const md = renderDashboard({ ...base, history: history() });
    expect(md).toContain('## Execution time');
    expect(md).toContain('実行結果を 1 件も受け取っていない');
    expect(md).toContain('n/a (比較対象なし)');
  });

  it('T-SLW-022 全件 duration 0 の時に reporter を疑う旨を書く', () => {
    const md = renderDashboard({
      ...base,
      history: history(rec({ testId: 'a' }), rec({ testId: 'b' })),
    });
    expect(md).toContain('reporter が実行時間を出していない可能性がある');
  });

  it('T-SLW-023 上位が全件を覆っていない時にその旨を書く', () => {
    const md = renderDashboard({
      ...base,
      history: history(
        rec({ testId: 'measured', durationMs: 5 }),
        rec({ testId: 'zero-1' }),
        rec({ testId: 'zero-2' }),
      ),
    });
    expect(md).toContain('duration を持たない record が 2 件ある');
  });

  it('T-SLW-024 slowestLimit を渡すと件数が変わる', () => {
    const records = Array.from({ length: 6 }, (_, index) =>
      rec({ testId: `t${index}`, durationMs: index + 1 }),
    );
    const md = renderDashboard({ ...base, history: history(...records), slowestLimit: 2 });
    const section = md.slice(md.indexOf('## Execution time'), md.indexOf('## Code coverage'));
    const rows = section.split('\n').filter((line) => /^\| t\d /.test(line));
    expect(rows.length, '上位の件数が slowestLimit と一致しない').toBe(2);
  });

  it('T-SLW-028 浮動小数の duration を丸めて書く', () => {
    // vitest の `duration` は浮動小数で来る。 丸めないと `31.437960999999746ms` のような
    // 桁が出る (実データで確認した)。 ms より細かい差は遅い test を探す用途で意味を持たない。
    const md = renderDashboard({
      ...base,
      history: history(
        rec({ testId: 'a', durationMs: 10.11970800000006, runId: 'run-2', startedAt: 2000 }),
        rec({ testId: 'b', durationMs: 21.318252999999686, runId: 'run-2', startedAt: 2000 }),
      ),
      flakyHistory: history(
        rec({ testId: 'a', durationMs: 108.17333199999985, runId: 'run-1', startedAt: 1000 }),
        rec({ testId: 'a', durationMs: 10.11970800000006, runId: 'run-2', startedAt: 2000 }),
        rec({ testId: 'b', durationMs: 21.318252999999686, runId: 'run-2', startedAt: 2000 }),
      ),
    });
    const section = md.slice(md.indexOf('## Execution time'), md.indexOf('## Code coverage'));
    expect(section, '合計が丸められていない').toContain('| total | 31ms |');
    expect(section, '上位の値が丸められていない').toContain('| b | 21ms |');
    expect(section, '差が丸められていない').toContain('-77ms');
    expect(section, '浮動小数の桁が残っている').not.toMatch(/\d+\.\d{3,}ms/);
  });

  it('T-SLW-026 速くなった run を負の差として書く', () => {
    // 遅くなる側だけを試すと、速くなった時の表示が 1 度も走らない。
    // この仕組みは「速くなった」 を見るためにあるので、そちらこそ確かめる。
    const md = renderDashboard({
      ...base,
      history: history(rec({ testId: 'a', durationMs: 400, runId: 'run-2', startedAt: 2000 })),
      flakyHistory: history(
        rec({ testId: 'a', durationMs: 1000, runId: 'run-1', startedAt: 1000 }),
        rec({ testId: 'a', durationMs: 400, runId: 'run-2', startedAt: 2000 }),
      ),
    });
    expect(md).toContain('-600ms (-60.0%)');
  });

  it('T-SLW-027 変わらない run を ± で書く', () => {
    const md = renderDashboard({
      ...base,
      history: history(rec({ testId: 'a', durationMs: 500, runId: 'run-2', startedAt: 2000 })),
      flakyHistory: history(
        rec({ testId: 'a', durationMs: 500, runId: 'run-1', startedAt: 1000 }),
        rec({ testId: 'a', durationMs: 500, runId: 'run-2', startedAt: 2000 }),
      ),
    });
    expect(md).toContain('±0ms (0.0%)');
  });

  it('T-SLW-025 差を出せない時に Infinity や NaN を表示しない', () => {
    const md = renderDashboard({
      ...base,
      history: history(rec({ testId: 'a', durationMs: 50, runId: 'run-2', startedAt: 2000 })),
      flakyHistory: history(
        rec({ testId: 'a', durationMs: 0, runId: 'run-1', startedAt: 1000 }),
        rec({ testId: 'a', durationMs: 50, runId: 'run-2', startedAt: 2000 }),
      ),
    });
    const section = md.slice(md.indexOf('## Execution time'), md.indexOf('## Code coverage'));
    expect(section).not.toContain('Infinity');
    expect(section).not.toContain('NaN');
    expect(section).toContain('比は出せない: 前 run が 0ms');
  });
});
