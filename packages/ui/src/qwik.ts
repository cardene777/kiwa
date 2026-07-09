import type { TestEnvBase } from '@kiwa-lab/core';

/**
 * Qwik component test adapter. Wraps @noma.to/qwik-testing-library's `render`
 * so the mode + stop() contract stays identical across React / Vue / Svelte /
 * Solid / Lit / Qwik adapters.
 *
 * Note: Qwik requires `@builder.io/qwik/optimizer` Vite plugin for JSX
 * transformation. The vitest.config.ts in this package wires the optimizer
 * conditionally when `@builder.io/qwik` is installed.
 */
export type QwikComponentLike = unknown;

export interface SetupQwikComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: QwikComponentLike;
}

export interface QwikContainerLike {
  container: HTMLElement;
  getByTestId: (id: string) => HTMLElement;
  getByText: (text: string | RegExp) => HTMLElement;
}

export interface QwikTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'qwik';
  result: QwikContainerLike;
  markup: string;
}

interface QwikTestingLibraryModule {
  render: (
    component: unknown,
  ) => Promise<QwikContainerLike & { unmount: () => void }>;
  cleanup: () => Promise<void>;
}

async function loadQwikTestingLibrary(): Promise<QwikTestingLibraryModule> {
  // Use a runtime-computed specifier so TypeScript does not resolve the
  // optional peer dep at type-check time. The package may be absent in the
  // workspace and only installed by downstream Qwik consumers.
  const specifier = '@noma.to/qwik-testing-library';
  try {
    return (await import(/* @vite-ignore */ specifier)) as unknown as QwikTestingLibraryModule;
  } catch {
    throw new Error(
      'setupQwikComponentEnv requires "@noma.to/qwik-testing-library". Run `pnpm add -D @noma.to/qwik-testing-library @builder.io/qwik`.',
    );
  }
}

export async function setupQwikComponentEnv(
  opts: SetupQwikComponentEnvOptions,
): Promise<QwikTestEnvUi> {
  const tl = await loadQwikTestingLibrary();
  const result = await tl.render(opts.component);
  return {
    mode: opts.mode === 'interaction' ? 'live' : 'mock',
    kind: 'qwik',
    result,
    markup: result.container.innerHTML,
    stop: async () => {
      result.unmount();
      await tl.cleanup();
    },
  };
}
