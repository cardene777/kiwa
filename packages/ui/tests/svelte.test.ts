/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  setupSvelteComponentEnv,
  type SetupSvelteComponentEnvOptions,
} from '../src/index.js';

/**
 * Svelte 5 requires its own compiler + runtime setup, which conflicts with the
 * React JSX pipeline used by the rest of this package. Rendering is left to a
 * follow-up `examples/svelte-component-poc` PR. Here we verify the adapter's
 * contract: a missing peer dep must surface a helpful guidance string, not an
 * opaque "cannot find module" stacktrace, and the render / mode / props / stop
 * branches via a mock @testing-library/svelte.
 */

// CAR-1529 段階 1 = mock @testing-library/svelte で render 経路 (mode / props / stop) を real cover する。
// 実 svelte compiler / runtime は起動しない = mock render 挙動で adapter 契約 verify。
function makeFakeContainer(html: string) {
  return {
    container: { innerHTML: html } as HTMLElement,
    getByTestId: (_id: string) => ({} as HTMLElement),
    getByText: (_text: string | RegExp) => ({} as HTMLElement),
  };
}

describe('setupSvelteComponentEnv (contract)', () => {
  afterEach(() => {
    vi.doUnmock('@testing-library/svelte');
    vi.resetModules();
  });

  it('T-SVL-001 throws friendly error when @testing-library/svelte is absent', async () => {
    vi.resetModules();
    vi.doMock('@testing-library/svelte', () => {
      throw new Error('not installed');
    });
    const fresh = await import('../src/svelte.js');
    await expect(
      fresh.setupSvelteComponentEnv({ mode: 'render' } as SetupSvelteComponentEnvOptions),
    ).rejects.toThrow(/@testing-library\/svelte/);
  });

  it('T-SVL-002 mode=render は mock 経路で live 判定なし', async () => {
    vi.resetModules();
    const unmount = vi.fn();
    const cleanup = vi.fn();
    vi.doMock('@testing-library/svelte', () => ({
      render: vi.fn(() => ({ ...makeFakeContainer('<div>render</div>'), unmount })),
      cleanup,
    }));

    const fresh = await import('../src/svelte.js');
    const env = await fresh.setupSvelteComponentEnv({
      mode: 'render',
      component: {},
    });

    // mode=render → 'mock' に mapping (branch = interaction 以外)
    expect(env.mode).toBe('mock');
    expect(env.kind).toBe('svelte');
    expect(env.markup).toBe('<div>render</div>');
  });

  it('T-SVL-003 mode=interaction は live 判定', async () => {
    vi.resetModules();
    const unmount = vi.fn();
    const cleanup = vi.fn();
    vi.doMock('@testing-library/svelte', () => ({
      render: vi.fn(() => ({ ...makeFakeContainer('<span>interactive</span>'), unmount })),
      cleanup,
    }));

    const fresh = await import('../src/svelte.js');
    const env = await fresh.setupSvelteComponentEnv({
      mode: 'interaction',
      component: {},
    });

    // mode=interaction → 'live' に mapping (branch)
    expect(env.mode).toBe('live');
    expect(env.markup).toBe('<span>interactive</span>');
  });

  it('T-SVL-004 opts.props が render の 2 引数目に渡される', async () => {
    vi.resetModules();
    const renderSpy = vi.fn(() => ({ ...makeFakeContainer(''), unmount: vi.fn() }));
    vi.doMock('@testing-library/svelte', () => ({
      render: renderSpy,
      cleanup: vi.fn(),
    }));

    const fresh = await import('../src/svelte.js');
    await fresh.setupSvelteComponentEnv({
      mode: 'render',
      component: 'FakeComponent',
      props: { name: 'kiwa', count: 3 },
    });

    // opts.props 有 → renderOpts.props に埋込 (branch = props 有)
    expect(renderSpy).toHaveBeenCalledWith('FakeComponent', {
      props: { name: 'kiwa', count: 3 },
    });
  });

  it('T-SVL-005 stop() は unmount + cleanup を順次呼ぶ', async () => {
    vi.resetModules();
    const unmount = vi.fn();
    const cleanup = vi.fn();
    vi.doMock('@testing-library/svelte', () => ({
      render: vi.fn(() => ({ ...makeFakeContainer(''), unmount })),
      cleanup,
    }));

    const fresh = await import('../src/svelte.js');
    const env = await fresh.setupSvelteComponentEnv({
      mode: 'snapshot',
      component: {},
    });

    // props なし branch も同時 verify (renderOpts に props 埋込まず)
    expect(env.mode).toBe('mock'); // snapshot → mock branch
    await env.stop();
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
