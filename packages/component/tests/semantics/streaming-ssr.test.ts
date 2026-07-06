import { describe, expect, it } from 'vitest';
import {
  captureErrorBoundary,
  completeSelectiveHydration,
  markSuspensePending,
  startProgressiveHydration,
  startStreamingSsr,
} from '../../src/index.js';

describe('streaming-ssr axis', () => {
  it('starts idle', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    expect(session.state).toBe('idle');
  });

  it('rejects empty route id', () => {
    expect(() => startStreamingSsr({ target: 'storybook8', routeId: '' })).toThrow(
      /routeId must not be empty/,
    );
  });

  it('marks suspense pending', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    const step = markSuspensePending(session, 'hero');
    expect(step.neutralEvent).toBe('ssr.suspense_pending');
    expect(step.metadata.pendingCount).toBe(1);
  });

  it('rejects empty boundary id', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    expect(() => markSuspensePending(session, '')).toThrow(/boundaryId/);
  });

  it('captures recoverable error boundary', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    const step = captureErrorBoundary(session, { boundaryId: 'hero', error: 'boom' });
    expect(step.providerEvent).toBe('storybook.error.boundary');
    expect(step.metadata.recoverable).toBe(true);
  });

  it('removes pending boundary on nonrecoverable error', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    markSuspensePending(session, 'hero');
    captureErrorBoundary(session, { boundaryId: 'hero', error: 'boom', recoverable: false });
    expect(session.pendingBoundaries.has('hero')).toBe(false);
  });

  it('starts progressive hydration for pending boundary', () => {
    const session = startStreamingSsr({ target: 'playwright-ct', routeId: '/items' });
    markSuspensePending(session, 'hero');
    const step = startProgressiveHydration(session, 'hero');
    expect(step.providerEvent).toBe('pwct.hydration.progressive');
  });

  it('rejects progressive hydration for missing boundary', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    expect(() => startProgressiveHydration(session, 'missing')).toThrow(/not pending/);
  });

  it('completes selective hydration', () => {
    const session = startStreamingSsr({ target: 'chromatic', routeId: '/items' });
    markSuspensePending(session, 'hero');
    const step = completeSelectiveHydration(session, 'hero');
    expect(step.providerEvent).toBe('chromatic.hydration.selective');
    expect(step.metadata.remainingPending).toBe(0);
  });

  it('rejects selective hydration for missing boundary', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    expect(() => completeSelectiveHydration(session, 'missing')).toThrow(/not pending/);
  });

  it('tracks multiple pending boundaries', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    markSuspensePending(session, 'a');
    const step = markSuspensePending(session, 'b');
    expect(step.metadata.pendingCount).toBe(2);
  });

  it('records history in order', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/items' });
    markSuspensePending(session, 'a');
    startProgressiveHydration(session, 'a');
    completeSelectiveHydration(session, 'a');
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'ssr.suspense_pending',
      'ssr.progressive_hydration_started',
      'ssr.selective_hydration_completed',
    ]);
  });
});
