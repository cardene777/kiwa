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
    const lake = generateLakeProject({
      packageName: 'kiwa-orchestrator-specs',
      rootNamespace: 'KiwaSpecs',
    });
    const specs = ALL_SPECS.map((s) => generateLeanSpec(s));
    const files = {
      ...lake.files,
      ...Object.fromEntries(specs.map((s) => [`KiwaSpecs/${s.path}`, s.source])),
    };
    expect(Object.keys(files).length).toBe(3 + 5);
    expect(files['KiwaSpecs/TransactionOrchestrator.lean']).toContain('namespace Transaction');
    expect(files['KiwaSpecs/CliLifecycleOrchestrator.lean']).toContain('namespace Cli');
  });

  it('5 orchestrator 統合 (kiwa 全体 systematic pattern の Lean 反映)', () => {
    const totalValid = ALL_SPECS.map((s) => generateLeanSpec(s).meta.validTransitionCount).reduce(
      (a, b) => a + b,
      0,
    );
    expect(totalValid).toBe(14 + 12 + 15 + 10 + 12);
    expect(totalValid).toBe(63);
  });
});
