import { describe, expect, it } from 'vitest';
import {
  setupNuxtMiddlewareEnv,
  NUXT_MIDDLEWARE_REDIRECT_SYMBOL,
  NUXT_MIDDLEWARE_ABORT_SYMBOL,
} from '../src/index.js';
import type { RouteMiddlewareFunction } from '../src/invoke-route-middleware.js';

describe('setupNuxtMiddlewareEnv', () => {
  it('T-SNM-001: pass-through middleware records no spy calls', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: () => undefined,
      to: { path: '/public' },
    });
    expect(env.navigateToCalls).toEqual([]);
    expect(env.abortNavigationCalls).toEqual([]);
    expect(env.redirectedTo).toBeNull();
    expect(env.aborted).toBe(false);
    expect(env.outcome.executed).toEqual([0]);
    expect(env.outcome.skipped).toEqual([]);
  });

  it('T-SNM-002: navigateTo spy captures target + options', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: (_to, _from, { navigateTo }) => {
        navigateTo('/login', { external: false, replace: true, redirectCode: 302 });
      },
      to: { path: '/dashboard' },
    });
    expect(env.navigateToCalls).toHaveLength(1);
    expect(env.navigateToCalls[0]?.target).toBe('/login');
    expect(env.navigateToCalls[0]?.options).toEqual({ external: false, replace: true, redirectCode: 302 });
    expect(env.redirectedTo).toBe('/login');
    expect(env.outcome.redirect?.[NUXT_MIDDLEWARE_REDIRECT_SYMBOL]).toBe(true);
  });

  it('T-SNM-003: abortNavigation spy captures message + statusCode', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: (_to, _from, { abortNavigation }) => {
        abortNavigation('forbidden', 403);
      },
      to: { path: '/admin' },
    });
    expect(env.abortNavigationCalls).toEqual([{ message: 'forbidden', statusCode: 403 }]);
    expect(env.aborted).toBe(true);
    expect(env.outcome.abort?.[NUXT_MIDDLEWARE_ABORT_SYMBOL]).toBe(true);
  });

  it('T-SNM-004: user fixture authenticated injected into to.meta.userSession', async () => {
    let captured: unknown;
    const env = await setupNuxtMiddlewareEnv({
      middleware: (to) => {
        captured = to.meta.userSession;
      },
      to: { path: '/dashboard' },
      user: { state: 'authenticated', userId: 'u-1', role: 'user' },
    });
    expect(captured).toEqual({ state: 'authenticated', userId: 'u-1', role: 'user' });
    expect(env.outcome.error).toBeUndefined();
  });

  it('T-SNM-005: user fixture anonymous does not write userSession', async () => {
    let captured: unknown = 'sentinel';
    await setupNuxtMiddlewareEnv({
      middleware: (to) => {
        captured = (to.meta as { userSession?: unknown }).userSession;
      },
      to: { path: '/x' },
      user: { state: 'anonymous' },
    });
    expect(captured).toBeUndefined();
  });

  it('T-SNM-006: user fixture expired reaches middleware verbatim', async () => {
    let captured: unknown;
    await setupNuxtMiddlewareEnv({
      middleware: (to) => {
        captured = to.meta.userSession;
      },
      to: { path: '/dashboard' },
      user: { state: 'expired', userId: 'u-1' },
    });
    expect(captured).toEqual({ state: 'expired', userId: 'u-1' });
  });

  it('T-SNM-007: chain executes in order until first redirect halts', async () => {
    const executed: string[] = [];
    const m1: RouteMiddlewareFunction = (_to, _from, _helpers) => {
      executed.push('global');
    };
    const m2: RouteMiddlewareFunction = (_to, _from, { navigateTo }) => {
      executed.push('auth');
      navigateTo('/login');
    };
    const m3: RouteMiddlewareFunction = () => {
      executed.push('after-redirect');
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: [m1, m2, m3],
      to: { path: '/dashboard' },
    });
    expect(executed).toEqual(['global', 'auth']);
    expect(env.outcome.executed).toEqual([0, 1]);
    expect(env.outcome.skipped).toEqual([2]);
    expect(env.redirectedTo).toBe('/login');
  });

  it('T-SNM-008: chain halts on abort and skips remaining', async () => {
    const m1: RouteMiddlewareFunction = (_to, _from, { abortNavigation }) => {
      abortNavigation('nope', 403);
    };
    const m2: RouteMiddlewareFunction = () => {
      // should never run
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: [m1, m2],
      to: { path: '/admin' },
    });
    expect(env.aborted).toBe(true);
    expect(env.outcome.executed).toEqual([0]);
    expect(env.outcome.skipped).toEqual([1]);
  });

  it('T-SNM-009: chain halts when middleware returns false (silent abort)', async () => {
    const m1: RouteMiddlewareFunction = () => false;
    const m2: RouteMiddlewareFunction = () => {
      throw new Error('should not run');
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: [m1, m2],
      to: { path: '/x' },
    });
    expect(env.outcome.result).toBe(false);
    expect(env.outcome.skipped).toEqual([1]);
    expect(env.outcome.error).toBeUndefined();
  });

  it('T-SNM-010: chain halts on non-signal throw and captures error', async () => {
    const m1: RouteMiddlewareFunction = () => {
      throw new Error('boom');
    };
    const m2: RouteMiddlewareFunction = () => {
      throw new Error('should not run');
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: [m1, m2],
      to: { path: '/x' },
    });
    expect((env.outcome.error as Error).message).toBe('boom');
    expect(env.outcome.skipped).toEqual([1]);
  });

  it('T-SNM-011: from defaults still propagate when from omitted', async () => {
    let fromPath = '';
    await setupNuxtMiddlewareEnv({
      middleware: (_to, from) => {
        fromPath = from.path;
      },
      to: { path: '/x' },
    });
    expect(fromPath).toBe('/');
  });

  it('T-SNM-012: from explicit overrides default', async () => {
    let fromPath = '';
    await setupNuxtMiddlewareEnv({
      middleware: (_to, from) => {
        fromPath = from.path;
      },
      to: { path: '/x' },
      from: { path: '/origin' },
    });
    expect(fromPath).toBe('/origin');
  });

  it('T-SNM-013: spy captures multiple navigateTo across chain', async () => {
    // chain rarely calls navigateTo twice (first throw halts), but ensure spy
    // accumulates if a middleware swallows the signal internally
    const m1: RouteMiddlewareFunction = (_to, _from, { navigateTo }) => {
      try {
        navigateTo('/first');
      } catch {
        // swallow + retry
      }
      navigateTo('/second');
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: m1,
      to: { path: '/x' },
    });
    expect(env.navigateToCalls.map((c) => c.target)).toEqual(['/first', '/second']);
    expect(env.redirectedTo).toBe('/second');
  });

  it('T-SNM-014: auth guard scenario — anonymous user redirected to /login', async () => {
    const authGuard: RouteMiddlewareFunction = (to, _from, { navigateTo }) => {
      const session = to.meta.userSession as { state?: string } | undefined;
      if (session?.state !== 'authenticated') {
        navigateTo('/login');
      }
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: authGuard,
      to: { path: '/dashboard', meta: { requiresAuth: true } },
      user: { state: 'anonymous' },
    });
    expect(env.redirectedTo).toBe('/login');
  });

  it('T-SNM-015: auth guard scenario — authenticated user passes through', async () => {
    const authGuard: RouteMiddlewareFunction = (to, _from, { navigateTo }) => {
      const session = to.meta.userSession as { state?: string } | undefined;
      if (session?.state !== 'authenticated') {
        navigateTo('/login');
      }
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: authGuard,
      to: { path: '/dashboard' },
      user: { state: 'authenticated', userId: 'u-1' },
    });
    expect(env.redirectedTo).toBeNull();
    expect(env.outcome.error).toBeUndefined();
  });

  it('T-SNM-016: auth guard scenario — expired session triggers refresh redirect', async () => {
    const authGuard: RouteMiddlewareFunction = (to, _from, { navigateTo }) => {
      const session = to.meta.userSession as { state?: string } | undefined;
      if (session?.state === 'expired') {
        navigateTo('/auth/refresh');
        return;
      }
      if (session?.state !== 'authenticated') {
        navigateTo('/login');
      }
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: authGuard,
      to: { path: '/dashboard' },
      user: { state: 'expired', userId: 'u-1' },
    });
    expect(env.redirectedTo).toBe('/auth/refresh');
  });

  it('T-SNM-017: global + route-specific chain with auth + admin gate', async () => {
    const globalAuth: RouteMiddlewareFunction = (to, _from, { navigateTo }) => {
      const session = to.meta.userSession as { state?: string } | undefined;
      if (session?.state !== 'authenticated') navigateTo('/login');
    };
    const adminGate: RouteMiddlewareFunction = (to, _from, { abortNavigation }) => {
      const session = to.meta.userSession as { role?: string } | undefined;
      if (session?.role !== 'admin') abortNavigation('admin only', 403);
    };
    const env = await setupNuxtMiddlewareEnv({
      middleware: [globalAuth, adminGate],
      to: { path: '/admin' },
      user: { state: 'authenticated', userId: 'u-1', role: 'user' },
    });
    expect(env.aborted).toBe(true);
    expect(env.outcome.abort?.statusCode).toBe(403);
    expect(env.outcome.executed).toEqual([0, 1]);
  });

  it('T-SNM-018: empty chain (array of length 0) is a no-op', async () => {
    const env = await setupNuxtMiddlewareEnv({
      middleware: [],
      to: { path: '/x' },
    });
    expect(env.outcome.executed).toEqual([]);
    expect(env.outcome.skipped).toEqual([]);
    expect(env.redirectedTo).toBeNull();
    expect(env.aborted).toBe(false);
  });
});
