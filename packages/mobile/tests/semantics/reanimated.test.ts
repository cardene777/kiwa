import { describe, expect, it } from 'vitest';
import {
  completeReanimatedAnimation,
  executeWorklet,
  initReanimated,
  startReanimatedAnimation,
  updateSharedValue,
} from '../../src/index.js';

describe('v1.51 reanimated semantics', () => {
  it('shared value + worklet + animation full cycle', () => {
    const s = initReanimated({ target: 'ios', animationId: 'fade' });
    updateSharedValue(s, { name: 'opacity', value: 0 });
    executeWorklet(s, 'interpolate');
    startReanimatedAnimation(s, { durationMs: 300, easing: 'ease' });
    completeReanimatedAnimation(s);
    expect(s.state).toBe('completed');
    expect(s.sharedValueUpdates).toBe(1);
    expect(s.workletExecutions).toBe(1);
  });

  it('rejects negative duration', () => {
    const s = initReanimated({ target: 'android', animationId: 'x' });
    expect(() => startReanimatedAnimation(s, { durationMs: -1, easing: 'linear' })).toThrow(/durationMs/);
  });

  it('rejects complete without animating', () => {
    const s = initReanimated({ target: 'ios', animationId: 'x' });
    expect(() => completeReanimatedAnimation(s)).toThrow(/session is/);
  });

  it('rejects empty animationId + worklet name', () => {
    expect(() => initReanimated({ target: 'ios', animationId: '' })).toThrow(/animationId/);
    const s = initReanimated({ target: 'ios', animationId: 'x' });
    expect(() => executeWorklet(s, '')).toThrow(/workletName/);
  });
});
