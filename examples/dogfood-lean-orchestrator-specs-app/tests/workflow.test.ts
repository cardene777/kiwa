import { describe, expect, it } from 'vitest';
import { generateLakeProject, generateLeanSpec } from '@kiwa-lab/lean';
import {
  ALL_SPECS,
  CACHE_SPEC,
  CLI_SPEC,
  JOB_SPEC,
  SESSION_SPEC,
  TRANSACTION_SPEC,
} from '../src/orchestrator-specs.js';

describe('dogfood-lean-orchestrator-specs (v2.14-2)', () => {
  it('Pattern 1: 5 lifecycle-orchestrator specs 定義済', () => {
    expect(ALL_SPECS.length).toBe(5);
    expect(ALL_SPECS.map((s) => s.namespace)).toEqual([
      'Transaction',
      'Session',
      'Cache',
      'Job',
      'Cli',
    ]);
  });

  it('Pattern 2: 全 5 spec が 5 state × 8 event = 40 cell SSOT を保持', () => {
    for (const spec of ALL_SPECS) {
      expect(spec.states.length).toBe(5);
      expect(spec.events.length).toBe(8);
      const out = generateLeanSpec(spec);
      expect(out.meta.cellCount).toBe(40);
    }
  });

  it('Pattern 3: Transaction spec は 14 valid transitions を持つ', () => {
    const out = generateLeanSpec(TRANSACTION_SPEC);
    expect(out.meta.validTransitionCount).toBe(14);
    expect(out.meta.invalidTransitionCount).toBe(26);
  });

  it('Pattern 4: Session / Cache / Job / Cli spec の valid transitions', () => {
    expect(generateLeanSpec(SESSION_SPEC).meta.validTransitionCount).toBe(12);
    expect(generateLeanSpec(CACHE_SPEC).meta.validTransitionCount).toBe(15);
    expect(generateLeanSpec(JOB_SPEC).meta.validTransitionCount).toBe(10);
    expect(generateLeanSpec(CLI_SPEC).meta.validTransitionCount).toBe(12);
  });

  it('Pattern 5: Lake project + 5 spec で 1 バンドル出力', () => {
    const specs = ALL_SPECS.map((s) => generateLeanSpec(s));
    const lake = generateLakeProject({
      packageName: 'kiwa-orchestrator-specs',
      rootNamespace: 'KiwaSpecs',
      modules: specs.map((s) => s.path.replace(/\.lean$/, '')),
    });
    const files = {
      ...lake.files,
      ...Object.fromEntries(specs.map((s) => [`KiwaSpecs/${s.path}`, s.source])),
    };
    expect(Object.keys(files).length).toBe(3 + 5);
    // namespace は «» で囲まれる。 `end` や `def` を namespace 名にできるようにするため
    // (65 / 80 の候補語が bare 記法で Lean を壊した)。 Lake が自身の package 名に対して
    // 昔から採っている記法。
    expect(files['KiwaSpecs/TransactionOrchestrator.lean']).toContain('namespace «Transaction»');
    expect(files['KiwaSpecs/CliLifecycleOrchestrator.lean']).toContain('namespace «Cli»');
  });

  it('Pattern 5-a: lake build が spec を実際に建てる設定になっている', () => {
    // `@[default_target]` が無いと lake build は対象を持たず、 spec が壊れていても
    // 「成功」 と報告する。 glob が無いと、 import されない spec は建てられない。
    const lake = generateLakeProject({
      packageName: 'kiwa-orchestrator-specs',
      rootNamespace: 'KiwaSpecs',
      modules: ALL_SPECS.map((s) => generateLeanSpec(s).path.replace(/\.lean$/, '')),
    });
    expect(lake.files['lakefile.lean']).toContain('@[default_target]');
    expect(lake.files['lakefile.lean']).toContain('globs := #[.andSubmodules `KiwaSpecs]');

    const root = lake.files['KiwaSpecs.lean'] ?? '';
    for (const spec of ALL_SPECS) {
      expect(root).toContain(`import KiwaSpecs.${spec.moduleName}`);
    }
  });

  it('5 orchestrator 統合 (kiwa 全体 systematic pattern の Lean 反映)', () => {
    const totalValid = ALL_SPECS.map((s) => generateLeanSpec(s).meta.validTransitionCount).reduce(
      (a, b) => a + b,
      0,
    );
    expect(totalValid).toBe(14 + 12 + 15 + 10 + 12);
    expect(totalValid).toBe(63);
  });

  it('Pattern 6: 全 5 spec の全状態が初期状態から到達可能', () => {
    for (const spec of ALL_SPECS) {
      const out = generateLeanSpec(spec);
      const reached = Object.keys(out.meta.reachablePaths ?? {});
      // 初期状態を除く全状態に、 それを指す経路がある。
      expect(reached.sort()).toEqual(spec.states.filter((s) => s !== spec.initial).sort());
    }
  });

  it('Pattern 7: job の dlq は終端ではなく sink (受理して二度と出ない)', () => {
    // dlq は dlq-inspected を受理して dlq に留まる。 「出口がある」 が 「出ていける」
    // ではない状態は、 表を見ただけでは終端と区別がつかない。
    const job = generateLeanSpec(JOB_SPEC);
    expect(job.meta.terminalStates).toEqual(['completed']);
    expect(job.meta.sinkStates).toEqual(['dlq']);
    expect(job.source).toContain('theorem dlq_no_escape');
    expect(job.source).not.toContain('dlq_can_leave');
  });

  it('Pattern 8: 他 4 spec に sink はない', () => {
    for (const spec of ALL_SPECS.filter((s) => s !== JOB_SPEC)) {
      expect(generateLeanSpec(spec).meta.sinkStates).toEqual([]);
    }
  });
});
