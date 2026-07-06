/**
 * T-DRT-* — transitive evolution semantics.
 *
 * v1.31-3 introduces `driveEvolutionTransitive` which walks a v1 → v2 → v3
 * chain under BACKWARD_TRANSITIVE + rechecks every prior version rather than
 * only the immediate neighbour. The oracle asserts the mock records the
 * transitive-only rejection when the candidate would be accepted by
 * immediate BACKWARD but breaks a v1 consumer.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

let adapter: ReturnType<typeof makeMockAdapter> | null = null;

afterEach(async () => {
  if (adapter) await adapter.reset();
  adapter = null;
});

describe('driveEvolutionTransitive — BACKWARD_TRANSITIVE chain walk', () => {
  it('T-DRT-001 accepts a v1 -> v2 -> v3 chain under BACKWARD_TRANSITIVE', async () => {
    adapter = makeMockAdapter();
    const out = await adapter.driveEvolutionTransitive();
    expect(out.versionsAccepted).toBe(3);
    expect(out.subject).toBe('users-trans-value');
  });

  it('T-DRT-002 records transitive-only rejection when a required field is added vs v1', async () => {
    adapter = makeMockAdapter();
    const out = await adapter.driveEvolutionTransitive();
    // Every prior version (v1, v2, v3) lacks the required `metadata` field, so
    // the transitive walker flags every prior version as incompatible.
    expect(out.rejectedTransitiveOnly).toBe(true);
    expect(out.chainVerdicts.every((v) => v.compatible === false)).toBe(true);
  });

  it('T-DRT-003 emits an ok=true trace entry for the driveEvolutionTransitive op', async () => {
    adapter = makeMockAdapter();
    await adapter.driveEvolutionTransitive();
    const ok = adapter.traces().filter((t) => t.op === 'driveEvolutionTransitive' && t.ok);
    expect(ok).toHaveLength(1);
  });

  it('T-DRT-004 metrics counter transitiveChainSteps advances by the chain length', async () => {
    adapter = makeMockAdapter();
    const before = adapter.metrics().transitiveChainSteps;
    await adapter.driveEvolutionTransitive();
    const after = adapter.metrics().transitiveChainSteps;
    expect(after - before).toBeGreaterThan(0);
  });

  it('T-DRT-005 chain verdicts include one entry per prior version', async () => {
    adapter = makeMockAdapter();
    const out = await adapter.driveEvolutionTransitive();
    // v1 → v2 → v3 => 3 prior versions on the chain.
    expect(out.chainVerdicts).toHaveLength(3);
    for (const entry of out.chainVerdicts) {
      expect(entry.from).toBeGreaterThanOrEqual(1);
      expect(entry.to).toBe(entry.from + 1);
    }
  });
});
