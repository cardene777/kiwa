/// <reference types="vitest/globals" />
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * CAR-1529 段階 5 = React adapter (packages/ui/src/setup-component-env.ts) の
 * optional peer dep 解決失敗経路を mock @testing-library/* で cover する。
 * 既存 tests/setup-component-env.test.tsx は peer dep が揃った正常経路担当で、
 * loadTestingLibrary / loadUserEvent の catch は一度も走っていなかった。
 * pattern SSOT = tests/svelte.test.ts + tests/browser-mock.test.ts (段階 1-4)。
 */

interface FakeRenderOptions {
  container?: HTMLElement;
}

/**
 * @testing-library/react の render を最小構成で模す。 setupComponentEnv は
 * 自前で作った container を render に渡す契約なので、受け取った container へ
 * 描画して呼出側から観測できるようにする。
 */
function makeFakeTestingLibrary() {
  const unmount = vi.fn();
  const cleanup = vi.fn();
  const render = vi.fn((_ui: unknown, options?: FakeRenderOptions) => {
    let container = options ? options.container : undefined;
    if (!container) container = document.createElement('div');
    const span = document.createElement('span');
    span.setAttribute('data-testid', 'value');
    span.textContent = 'mock';
    container.appendChild(span);
    return { container, unmount };
  });
  return { render, cleanup, unmount, screen: { getByTestId: vi.fn() } };
}

describe('setupComponentEnv (missing peer dep)', () => {
  afterEach(() => {
    vi.doUnmock('@testing-library/react');
    vi.doUnmock('@testing-library/user-event');
    vi.resetModules();
  });

  it('T-SCE-M-001 @testing-library/react 不在で導入手順つき error を投げる', async () => {
    vi.resetModules();
    vi.doMock('@testing-library/react', () => {
      throw new Error('Cannot find module');
    });

    const fresh = await import('../src/setup-component-env.js');
    const before = document.body.childElementCount;
    const ui = createElement('div', null, 'x');
    const opts = {
      mode: 'render',
      ui,
    } as const;

    // 素の "Cannot find module" ではなく導入手順を含む案内へ置換される
    await expect(fresh.setupComponentEnv(opts)).rejects.toThrow(/@testing-library\/react/);
    await expect(fresh.setupComponentEnv(opts)).rejects.toThrow(/pnpm add -D/);
    // peer dep 解決は container 挿入より前なので document に残骸を残さない
    expect(document.body.childElementCount).toBe(before);
  });

  it('T-SCE-M-002 @testing-library/user-event 不在は interaction mode でのみ error', async () => {
    vi.resetModules();
    const tl = makeFakeTestingLibrary();
    vi.doMock('@testing-library/react', () => tl);
    vi.doMock('@testing-library/user-event', () => {
      throw new Error('Cannot find module');
    });

    const fresh = await import('../src/setup-component-env.js');
    const ui = createElement('div', null, 'x');
    const renderOpts = {
      mode: 'render',
      ui,
    } as const;
    const interactionOpts = {
      mode: 'interaction',
      ui,
    } as const;

    // render mode は user-event を触らないので peer dep 不在でも成立する
    const renderEnv = await fresh.setupComponentEnv(renderOpts);
    expect(renderEnv.kind).toBe('render');
    expect(renderEnv.result.container.innerHTML).toContain('data-testid="value"');
    await renderEnv.stop();
    expect(tl.unmount).toHaveBeenCalledTimes(1);

    // interaction mode だけが loadUserEvent を通り、導入手順つき error になる
    const before = document.body.childElementCount;
    const interaction = fresh.setupComponentEnv(interactionOpts);
    await expect(interaction).rejects.toThrow(/@testing-library\/user-event/);
    await expect(interaction).rejects.toThrow(/pnpm add -D/);

    // 依存の解決は描画より前に行う。後ろに置くと container を document へ挿した
    // 状態で例外になり、呼び出し側は env を受け取れないので片付けられない。
    expect(document.body.childElementCount, '失敗した分の container を残さない').toBe(before);
    expect(tl.render, '描画に入る前に落とす').toHaveBeenCalledTimes(1);
  });
});
