import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  driveEdgeEnvFlow,
  driveHeadFlow,
  driveIslandFlow,
  driveRouteFlow,
} from '../src/flows/fresh-flows.js';

describe('fresh flows (end-to-end drive)', () => {
  it('T-DFI-FF-001 driveRouteFlow returns matching route + handler HTML', async () => {
    const adapter = makeMockAdapter();
    const out = await driveRouteFlow(adapter, '/greet/fresh', 'GET');
    expect(out.routeHtml).toContain('hello fresh');
    expect(out.handlerStatus).toBe(200);
    expect(out.handlerHtml).toContain('hello fresh');
    expect(out.renderData).toEqual({ name: 'fresh', at: 0 });
    await adapter.reset();
  });

  it('T-DFI-FF-002 driveIslandFlow click × 4 aggregates 4 invocations', async () => {
    const adapter = makeMockAdapter();
    const out = await driveIslandFlow(
      adapter,
      'Counter',
      { label: 'x', start: 0 },
      [
        { event: 'click' },
        { event: 'click' },
        { event: 'click' },
        { event: 'click' },
      ],
    );
    expect(out.islandHtml).toContain('counter-island');
    expect(out.totalInvocations).toBe(4);
    expect(out.totalPreventedDefault).toBe(0);
    await adapter.reset();
  });

  it('T-DFI-FF-003 driveIslandFlow submit tracks preventDefault', async () => {
    const adapter = makeMockAdapter();
    const out = await driveIslandFlow(
      adapter,
      'TodoList',
      { seedTitles: [] },
      [
        { event: 'input', value: 'a' },
        { event: 'submit' },
      ],
    );
    expect(out.totalInvocations).toBe(2);
    expect(out.totalPreventedDefault).toBe(1);
    await adapter.reset();
  });

  it('T-DFI-FF-004 driveHeadFlow merges 3 fragments with title override', async () => {
    const adapter = makeMockAdapter();
    const out = await driveHeadFlow(adapter, [
      { title: 'A', meta: [{ name: 'description', content: 'a' }] },
      { title: 'B', meta: [{ name: 'description', content: 'b' }] },
      { title: 'C', link: [{ rel: 'icon', href: '/x.ico' }] },
    ]);
    expect(out.mergedTitle).toBe('C');
    expect(out.mergedMetaCount).toBe(1);
    expect(out.mergedLinkCount).toBe(1);
    expect(out.html).toContain('<title>C</title>');
    await adapter.reset();
  });

  it('T-DFI-FF-005 driveEdgeEnvFlow proves serve called + env keys read', async () => {
    const adapter = makeMockAdapter();
    const out = await driveEdgeEnvFlow(
      adapter,
      { KIWA_FRESH_MODE: 'dogfood', OTHER: 'x' },
      '/api/health',
    );
    expect(out.denoInstalled).toBe(true);
    expect(out.serveCalls).toBe(1);
    expect(out.envReadKeys).toContain('KIWA_FRESH_MODE');
    await adapter.reset();
  });
});
