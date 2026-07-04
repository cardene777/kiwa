import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('end-to-end mock-mode integration', () => {
  it('T-DFI-EE-M-001 6-op surface produces 6 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    await adapter.mountRoute('/greet/kiwa');
    await adapter.driveHandler('GET');
    await adapter.mountIsland('Counter', { label: 'x', start: 0 });
    await adapter.driveInteraction('Counter', 'click');
    await adapter.mountHead([{ title: 'x' }]);
    await adapter.driveEdgeEnv({ KIWA_FRESH_MODE: 'test' }, '/edge');
    const okOps = adapter.traces().filter((t) => t.ok).map((t) => t.op);
    for (const op of [
      'mountRoute',
      'driveHandler',
      'mountIsland',
      'driveInteraction',
      'mountHead',
      'driveEdgeEnv',
    ]) {
      expect(okOps).toContain(op);
    }
    await adapter.reset();
  });

  it('T-DFI-EE-M-002 metrics reflect mount counts per surface', async () => {
    const adapter = makeMockAdapter();
    await adapter.mountRoute('/a');
    await adapter.mountRoute('/b');
    await adapter.driveHandler('GET');
    await adapter.mountIsland('Counter', { label: 'x', start: 0 });
    await adapter.mountIsland('TodoList', { seedTitles: [] });
    await adapter.mountHead([{ title: 'h' }]);
    await adapter.driveEdgeEnv({}, '/e');
    const m = adapter.metrics();
    expect(m.routeMountCount).toBe(2);
    expect(m.handlerDispatchCount).toBe(1);
    expect(m.islandMountCount).toBe(2);
    expect(m.headMergeCount).toBe(1);
    expect(m.edgeEnvCount).toBe(1);
    // 7 ops with 1 latency sample each = 7 samples
    expect(m.latencySamplesMs.length).toBe(7);
    await adapter.reset();
  });

  it('T-DFI-EE-M-003 reset() clears trace + metrics + island cache', async () => {
    const adapter = makeMockAdapter();
    await adapter.mountIsland('Counter', { label: 'x', start: 0 });
    await adapter.driveInteraction('Counter', 'click');
    await adapter.reset();
    expect(adapter.traces().length).toBe(0);
    expect(adapter.metrics().latencySamplesMs.length).toBe(0);
    // After reset, driveInteraction should throw because mount cache was cleared
    await expect(adapter.driveInteraction('Counter', 'click')).rejects.toThrow(
      'mountIsland must run first',
    );
  });

  it('T-DFI-EE-M-004 driveInteraction without mount records error trace', async () => {
    const adapter = makeMockAdapter();
    await expect(adapter.driveInteraction('Counter', 'click')).rejects.toThrow(
      'mountIsland must run first',
    );
    const errored = adapter.traces().find(
      (t) => t.op === 'driveInteraction' && !t.ok,
    );
    expect(errored).toBeDefined();
    expect(errored?.errorKind).toBe('FRESH_MOCK_ERROR');
  });

  it('T-DFI-EE-M-005 driveHandler POST includes render data', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveHandler('POST', { name: 'zoe' });
    expect(out.status).toBe(200);
    expect(out.renderData).toEqual({ name: 'zoe', at: 0 });
    await adapter.reset();
  });
});
