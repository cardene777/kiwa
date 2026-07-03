import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { FormCTAdapter } from '../src/adapters/interface.js';
import {
  a11yAllForms,
  mountAllForms,
  runAllForms,
  submitAllForms,
  validateAllForms,
} from '../src/flows/form-flows.js';

let adapter: FormCTAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-form-ct — end-to-end flows (mock mode)', () => {
  it('T-DFFC-E2E-001 runAllForms exercises 4 flows × 5 forms without failure', async () => {
    const result = await runAllForms(adapter);
    expect(result.mount).toHaveLength(5);
    expect(result.validation).toHaveLength(5);
    expect(result.submit).toHaveLength(5);
    expect(result.a11y).toHaveLength(5);
  });

  it('T-DFFC-E2E-002 4 core flows produce a coherent trace stream with no failed ops', async () => {
    await mountAllForms(adapter);
    await validateAllForms(adapter);
    await submitAllForms(adapter);
    await a11yAllForms(adapter);
    const traces = adapter.traces();
    const failures = traces.filter((t) => !t.ok);
    expect(failures).toHaveLength(0);
    const opsSeen = new Set(traces.map((t) => t.op));
    for (const required of [
      'mount',
      'interactValidation',
      'interactSubmit',
      'checkA11y',
    ]) {
      expect(opsSeen.has(required)).toBe(true);
    }
  });

  it('T-DFFC-E2E-003 aggregate ops count = 20 (4 flows × 5 forms)', async () => {
    await runAllForms(adapter);
    const traces = adapter.traces();
    const opCounts = new Map<string, number>();
    for (const t of traces) {
      opCounts.set(t.op, (opCounts.get(t.op) ?? 0) + 1);
    }
    expect(opCounts.get('mount')).toBe(5);
    expect(opCounts.get('interactValidation')).toBe(5);
    expect(opCounts.get('interactSubmit')).toBe(5);
    expect(opCounts.get('checkA11y')).toBe(5);
  });

  it('T-DFFC-E2E-004 reset drops the trace + metrics without breaking subsequent runs', async () => {
    await runAllForms(adapter);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().mountInvocations).toBe(0);
    expect(adapter.metrics().latencySamplesMs).toHaveLength(0);
    // After reset the adapter should still function.
    const mounts = await mountAllForms(adapter);
    expect(mounts).toHaveLength(5);
  });

  it('T-DFFC-E2E-005 latency samples align 1:1 with recorded op trace', async () => {
    await runAllForms(adapter);
    const traces = adapter.traces();
    const samples = adapter.metrics().latencySamplesMs;
    // Every op in the mock adapter runs through `timed(...)`, so each trace
    // entry maps to exactly 1 latency sample.
    expect(samples.length).toBe(traces.length);
    for (const s of samples) {
      expect(s).toBeGreaterThanOrEqual(0);
    }
  });
});
