/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  setupQwikComponentEnv,
  type SetupQwikComponentEnvOptions,
} from '../src/index.js';

/**
 * The Qwik adapter requires `@builder.io/qwik`'s Vite optimizer for JSX
 * transformation, which conflicts with the React JSX transform used by the
 * rest of this package's test pipeline. We therefore exercise the adapter's
 * shape (types + error branch + mode / stop branches via mock library) here
 * and leave end-to-end JSX rendering to a follow-up PR that ships a Qwik-specific
 * Vitest project (`examples/qwik-component-poc` to follow).
 */

// CAR-1529 段階 3 = mock @noma.to/qwik-testing-library で render 経路 (mode / stop) を real cover する。
// pattern SSOT = packages/ui/tests/svelte.test.ts + angular.test.ts (CAR-1529 段階 1-2)。
function makeFakeQwikContainer(html: string) {
  return {
    container: { innerHTML: html } as HTMLElement,
    getByTestId: (_id: string) => ({} as HTMLElement),
    getByText: (_text: string | RegExp) => ({} as HTMLElement),
  };
}

describe('setupQwikComponentEnv (contract)', () => {
  afterEach(() => {
    vi.doUnmock('@noma.to/qwik-testing-library');
    vi.resetModules();
  });

  it('T-QWK-001 throws friendly error when @noma.to/qwik-testing-library is absent', async () => {
    await expect(
      setupQwikComponentEnv({ mode: 'render' } as SetupQwikComponentEnvOptions),
    ).rejects.toThrow(/qwik-testing-library/);
  });

  it('T-QWK-002 mode=render は mock 経路で live 判定なし', async () => {
    vi.resetModules();
    const unmount = vi.fn();
    const cleanup = vi.fn(async () => undefined);
    vi.doMock('@noma.to/qwik-testing-library', () => ({
      render: vi.fn(async () => ({
        ...makeFakeQwikContainer('<div>qwik-render</div>'),
        unmount,
      })),
      cleanup,
    }));

    const fresh = await import('../src/qwik.js');
    const env = await fresh.setupQwikComponentEnv({
      mode: 'render',
      component: {},
    });

    expect(env.mode).toBe('mock');
    expect(env.kind).toBe('qwik');
    expect(env.markup).toBe('<div>qwik-render</div>');
  });

  it('T-QWK-003 mode=interaction は live 判定', async () => {
    vi.resetModules();
    const unmount = vi.fn();
    const cleanup = vi.fn(async () => undefined);
    vi.doMock('@noma.to/qwik-testing-library', () => ({
      render: vi.fn(async () => ({
        ...makeFakeQwikContainer('<span>qwik-interactive</span>'),
        unmount,
      })),
      cleanup,
    }));

    const fresh = await import('../src/qwik.js');
    const env = await fresh.setupQwikComponentEnv({
      mode: 'interaction',
      component: {},
    });

    expect(env.mode).toBe('live');
    expect(env.markup).toBe('<span>qwik-interactive</span>');
  });

  it('T-QWK-004 stop() は unmount + cleanup 順次呼出 + mode=snapshot branch', async () => {
    vi.resetModules();
    const unmount = vi.fn();
    const cleanup = vi.fn(async () => undefined);
    vi.doMock('@noma.to/qwik-testing-library', () => ({
      render: vi.fn(async () => ({
        ...makeFakeQwikContainer(''),
        unmount,
      })),
      cleanup,
    }));

    const fresh = await import('../src/qwik.js');
    const env = await fresh.setupQwikComponentEnv({
      mode: 'snapshot',
      component: {},
    });

    // snapshot → 'mock' branch
    expect(env.mode).toBe('mock');

    // stop() は unmount + async cleanup 順次呼出
    await env.stop();
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
