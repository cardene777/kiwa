import { describe, expect, it } from 'vitest';
import {
  commitShadowTree,
  completeFabricMount,
  initFabric,
  scheduleFabricRender,
  updateFabricPriority,
} from '../../src/index.js';

describe('v1.52 fabric semantics', () => {
  it('schedule → commit → mount full cycle', () => {
    const s = initFabric({ target: 'ios', rootId: 'AppRoot' });
    scheduleFabricRender(s, 'discrete');
    commitShadowTree(s, { nodeCount: 42 });
    completeFabricMount(s);
    expect(s.state).toBe('mounted');
    expect(s.shadowNodeCount).toBe(42);
  });

  it('priority update between schedule and commit', () => {
    const s = initFabric({ target: 'android', rootId: 'X' });
    scheduleFabricRender(s, 'idle');
    updateFabricPriority(s, 'discrete');
    commitShadowTree(s, { nodeCount: 5 });
    completeFabricMount(s);
    expect(s.state).toBe('mounted');
    expect(s.scheduledPriority).toBe('discrete');
  });

  it('rejects commit before schedule', () => {
    const s = initFabric({ target: 'ios', rootId: 'X' });
    expect(() => commitShadowTree(s, { nodeCount: 1 })).toThrow(/session is idle/);
  });

  it('rejects mount before commit', () => {
    const s = initFabric({ target: 'ios', rootId: 'X' });
    scheduleFabricRender(s, 'continuous');
    expect(() => completeFabricMount(s)).toThrow(/session is scheduled/);
  });

  it('rejects negative nodeCount + empty rootId', () => {
    expect(() => initFabric({ target: 'ios', rootId: '' })).toThrow(/rootId/);
    const s = initFabric({ target: 'ios', rootId: 'X' });
    scheduleFabricRender(s, 'discrete');
    expect(() => commitShadowTree(s, { nodeCount: -1 })).toThrow(/nodeCount/);
  });
});
