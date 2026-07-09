import { describe, expect, it } from 'vitest';
import { generateLeanSpec } from '../src/generator.js';
import type { OrchestratorSpec } from '../src/types.js';
import { verifyLeanSpec } from '../src/verify.js';

const MINI_SPEC: OrchestratorSpec = {
  moduleName: 'MiniState',
  namespace: 'Mini',
  states: ['a', 'b'],
  events: ['e1', 'e2'],
  transitions: [
    { from: 'a', event: 'e1', to: 'b' },
    { from: 'a', event: 'e2', invalid: true },
    { from: 'b', event: 'e1', invalid: true },
    { from: 'b', event: 'e2', to: 'a' },
  ],
};

describe('verifyLeanSpec — Lean toolchain integration', () => {
  it('T-LEAN-V-001 throws when no spec is provided', () => {
    expect(() => verifyLeanSpec([])).toThrow(/at least one spec is required/);
  });

  it('T-LEAN-V-002 returns skipped-by-env when opts.skip=true', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const result = verifyLeanSpec([spec], { skip: true });
    expect(result.status).toBe('skipped-by-env');
    expect(result.reason).toContain('opts.skip=true');
    expect(result.verifiedFiles).toEqual(['KiwaSpecs/MiniState.lean']);
  });

  it('T-LEAN-V-003 returns skipped-by-env when KIWA_LEAN_SKIP_VERIFY=1', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const prev = process.env.KIWA_LEAN_SKIP_VERIFY;
    process.env.KIWA_LEAN_SKIP_VERIFY = '1';
    try {
      const result = verifyLeanSpec([spec]);
      expect(result.status).toBe('skipped-by-env');
      expect(result.reason).toContain('KIWA_LEAN_SKIP_VERIFY=1');
    } finally {
      if (prev === undefined) {
        delete process.env.KIWA_LEAN_SKIP_VERIFY;
      } else {
        process.env.KIWA_LEAN_SKIP_VERIFY = prev;
      }
    }
  });

  it('T-LEAN-V-004 reports lean-not-installed when leanBin is missing', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const result = verifyLeanSpec([spec], {
      leanBin: '/definitely/not/a/real/lean/binary/path/xyz',
    });
    expect(result.status).toBe('lean-not-installed');
    expect(result.verifiedFiles).toEqual([]);
    expect(result.reason).toContain('Lean toolchain not found');
  });

  it('T-LEAN-V-005 uses custom rootNamespace in verifiedFiles', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const result = verifyLeanSpec([spec], {
      skip: true,
      rootNamespace: 'CustomRoot',
    });
    expect(result.status).toBe('skipped-by-env');
    expect(result.verifiedFiles).toEqual(['CustomRoot/MiniState.lean']);
  });

  it('T-LEAN-V-006 handles multiple specs in a single call', () => {
    const specA = generateLeanSpec({ ...MINI_SPEC, moduleName: 'A', namespace: 'A' });
    const specB = generateLeanSpec({ ...MINI_SPEC, moduleName: 'B', namespace: 'B' });
    const result = verifyLeanSpec([specA, specB], { skip: true });
    expect(result.verifiedFiles).toEqual(['KiwaSpecs/A.lean', 'KiwaSpecs/B.lean']);
  });
});
