/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  setupAngularComponentEnv,
  type SetupAngularComponentEnvOptions,
} from '../src/index.js';

/**
 * Angular requires its own TestBed initialization (zone.js + platformBrowserDynamic),
 * which conflicts with the React JSX pipeline used by the rest of this package.
 * The render path is therefore covered by integration tests in a follow-up
 * `examples/angular-component-poc` PR. Here we verify the adapter's contract:
 * a missing peer dep must surface a helpful guidance string, not an opaque
 * "cannot find module" stacktrace, and the render / mode / inputs / stop
 * branches via a mock @testing-library/angular.
 */

// CAR-1529 段階 2 = mock @testing-library/angular で render 経路 (mode / inputs / stop) を real cover する。
// pattern SSOT = packages/ui/tests/svelte.test.ts (CAR-1529 段階 1)、 render / cleanup が Promise の差だけ。
function makeFakeAngularContainer(html: string) {
  return {
    container: { innerHTML: html } as HTMLElement,
    getByTestId: (_id: string) => ({} as HTMLElement),
    getByText: (_text: string | RegExp) => ({} as HTMLElement),
  };
}

describe('setupAngularComponentEnv (contract)', () => {
  afterEach(() => {
    vi.doUnmock('@testing-library/angular');
    vi.resetModules();
  });

  it('T-ANG-001 throws friendly error when @testing-library/angular is absent', async () => {
    await expect(
      setupAngularComponentEnv({ mode: 'render' } as SetupAngularComponentEnvOptions),
    ).rejects.toThrow(/@testing-library\/angular/);
  });

  it('T-ANG-002 mode=render は mock 経路で live 判定なし', async () => {
    vi.resetModules();
    const destroy = vi.fn();
    const cleanup = vi.fn(async () => undefined);
    vi.doMock('@testing-library/angular', () => ({
      render: vi.fn(async () => ({
        ...makeFakeAngularContainer('<div>ng-render</div>'),
        fixture: { destroy },
      })),
      cleanup,
    }));

    const fresh = await import('../src/angular.js');
    const env = await fresh.setupAngularComponentEnv({
      mode: 'render',
      component: {},
    });

    // mode=render → 'mock' に mapping (branch = interaction 以外)
    expect(env.mode).toBe('mock');
    expect(env.kind).toBe('angular');
    expect(env.markup).toBe('<div>ng-render</div>');
  });

  it('T-ANG-003 mode=interaction は live 判定', async () => {
    vi.resetModules();
    const destroy = vi.fn();
    const cleanup = vi.fn(async () => undefined);
    vi.doMock('@testing-library/angular', () => ({
      render: vi.fn(async () => ({
        ...makeFakeAngularContainer('<span>ng-interactive</span>'),
        fixture: { destroy },
      })),
      cleanup,
    }));

    const fresh = await import('../src/angular.js');
    const env = await fresh.setupAngularComponentEnv({
      mode: 'interaction',
      component: {},
    });

    // mode=interaction → 'live' に mapping (branch)
    expect(env.mode).toBe('live');
    expect(env.markup).toBe('<span>ng-interactive</span>');
  });

  it('T-ANG-004 opts.inputs は render の componentInputs に埋込 + stop で destroy + cleanup 呼出', async () => {
    vi.resetModules();
    const destroy = vi.fn();
    const cleanup = vi.fn(async () => undefined);
    const renderSpy = vi.fn(async () => ({
      ...makeFakeAngularContainer(''),
      fixture: { destroy },
    }));
    vi.doMock('@testing-library/angular', () => ({
      render: renderSpy,
      cleanup,
    }));

    const fresh = await import('../src/angular.js');
    const env = await fresh.setupAngularComponentEnv({
      mode: 'snapshot',
      component: 'FakeAngularComponent',
      inputs: { title: 'kiwa', count: 5 },
    });

    // opts.inputs 有 → renderOpts.componentInputs に埋込 (branch = inputs 有)
    expect(renderSpy).toHaveBeenCalledWith('FakeAngularComponent', {
      componentInputs: { title: 'kiwa', count: 5 },
    });
    // snapshot mode → 'mock' branch
    expect(env.mode).toBe('mock');

    // stop() は destroy + cleanup 順次呼出
    await env.stop();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
