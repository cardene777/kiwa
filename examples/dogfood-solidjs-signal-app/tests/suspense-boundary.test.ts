import { describe, expect, it } from 'vitest';
import { errorBoundary, h, renderWithSuspense, stringify } from '@kiwa-test/solidjs';
import { UserProfileLoadingFallback, renderProfileErrorFallback } from '../src/components/UserProfile.js';

describe('Suspense boundary + Error boundary', () => {
  it('T-DSSA-SB-001 fallback markup rendered first, then swap to resolved', async () => {
    const boundary = await renderWithSuspense({
      component: () =>
        h(
          'section',
          { class: 'user-profile ready', 'data-testid': 'user-profile-ready' },
          h('h2', null, 'ready'),
        ),
      fallback: UserProfileLoadingFallback,
      waitFor: Promise.resolve('ok'),
      timeoutMs: 200,
    });
    expect(boundary.timedOut).toBe(false);
    expect(stringify(boundary.fallback)).toContain('user-profile-fallback');
    expect(boundary.resolved).not.toBeNull();
    expect(stringify(boundary.resolved!)).toContain('user-profile-ready');
  });

  it('T-DSSA-SB-002 timedOut=true when waitFor exceeds timeoutMs', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 100));
    const boundary = await renderWithSuspense({
      component: () => h('p', null, 'ready'),
      fallback: UserProfileLoadingFallback,
      waitFor: slow,
      timeoutMs: 5,
    });
    expect(boundary.timedOut).toBe(true);
    expect(boundary.resolved).toBeNull();
  });

  it('T-DSSA-SB-003 error boundary catches thrown component + renders fallback', () => {
    const outcome = errorBoundary({
      component: () => {
        throw new Error('bad render');
      },
      fallback: renderProfileErrorFallback,
    });
    // Assert on the discriminant shape rather than importing the guard —
    // outcome is `SolidChild | ErrorBoundarySignal` here.
    const markup = stringify(
      typeof outcome === 'object' && outcome !== null && 'fallback' in outcome
        ? outcome.fallback
        : outcome,
    );
    expect(markup).toContain('user-profile-error-boundary');
    expect(markup).toContain('Boundary caught: bad render');
  });

  it('T-DSSA-SB-004 error boundary passes-through when component does not throw', () => {
    const outcome = errorBoundary({
      component: () => h('p', { class: 'ok' }, 'ok'),
      fallback: renderProfileErrorFallback,
    });
    const markup = stringify(
      typeof outcome === 'object' && outcome !== null && 'fallback' in outcome
        ? outcome.fallback
        : outcome,
    );
    expect(markup).toContain('class="ok"');
    expect(markup).not.toContain('user-profile-error-boundary');
  });
});
