import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('end-to-end mock-mode integration', () => {
  it('T-DSSA-EE-001 6-op surface produces 6 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    await adapter.mountCounter(0);
    await adapter.driveCounter(2);
    await adapter.mountTodos(['a']);
    await adapter.driveTodos([{ kind: 'add', title: 'b' }]);
    await adapter.mountResource(async () => ({ id: 'u1', displayName: 'x', email: 'x@e.com' }));
    await adapter.driveSuspense(1);
    const okOps = adapter.traces().filter((t) => t.ok).map((t) => t.op);
    for (const op of [
      'mountCounter',
      'driveCounter',
      'mountTodos',
      'driveTodos',
      'mountResource',
      'driveSuspense',
    ]) {
      expect(okOps).toContain(op);
    }
    await adapter.reset();
  });

  it('T-DSSA-EE-002 metrics reflect the number of mounts per component', async () => {
    const adapter = makeMockAdapter();
    await adapter.mountCounter(0);
    await adapter.mountCounter(5);
    await adapter.mountTodos([]);
    await adapter.mountResource(async () => ({ id: 'u1', displayName: 'x', email: 'x@e.com' }));
    await adapter.driveSuspense(1);
    const m = adapter.metrics();
    expect(m.counterMountCount).toBe(2);
    expect(m.todosMountCount).toBe(1);
    expect(m.resourceMountCount).toBe(1);
    expect(m.suspenseMountCount).toBe(1);
    // 5 ops with 1 latency sample each = 5 samples
    expect(m.latencySamplesMs.length).toBe(5);
    await adapter.reset();
  });

  it('T-DSSA-EE-003 reset() clears trace + metrics', async () => {
    const adapter = makeMockAdapter();
    await adapter.mountCounter(0);
    await adapter.reset();
    expect(adapter.traces().length).toBe(0);
    expect(adapter.metrics().latencySamplesMs.length).toBe(0);
    expect(adapter.metrics().counterMountCount).toBe(0);
  });

  it('T-DSSA-EE-004 driveCounter without mount throws with distinguishable trace', async () => {
    const adapter = makeMockAdapter();
    await expect(adapter.driveCounter(1)).rejects.toThrow('mountCounter must run first');
    const traces = adapter.traces();
    const errored = traces.find((t) => t.op === 'driveCounter' && !t.ok);
    expect(errored).toBeDefined();
    expect(errored?.errorKind).toBe('SOLID_MOCK_ERROR');
  });

  it('T-DSSA-EE-005 driveSuspense timeout path records timedOut trace', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveSuspense(500); // > default 200 ms timeout
    expect(out.timedOut).toBe(true);
    const suspenseTrace = adapter.traces().find((t) => t.op === 'driveSuspense');
    expect(suspenseTrace).toBeDefined();
    expect(suspenseTrace?.ok).toBe(false);
    expect(suspenseTrace?.detail?.timedOut).toBe(true);
  });
});
