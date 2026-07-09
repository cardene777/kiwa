import type { TestEnvBase } from '@kiwa-lab/core';

/**
 * SolidJS component test adapter. Wraps @solidjs/testing-library's `render`
 * so the mode + stop() contract stays identical across React / Vue / Svelte / Solid adapters.
 */
export type SolidComponentLike = unknown;

export interface SetupSolidComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: () => unknown;
  props?: Record<string, unknown>;
}

export interface SolidContainerLike {
  container: HTMLElement;
  getByTestId: (id: string) => HTMLElement;
  getByText: (text: string | RegExp) => HTMLElement;
}

export interface SolidTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'solid';
  result: SolidContainerLike;
  markup: string;
}

interface SolidTestingLibraryModule {
  render: (
    component: () => unknown,
    opts?: { props?: Record<string, unknown> },
  ) => SolidContainerLike & { unmount: () => void };
  cleanup: () => void;
}

async function loadSolidTestingLibrary(): Promise<SolidTestingLibraryModule> {
  try {
    return (await import('@solidjs/testing-library')) as unknown as SolidTestingLibraryModule;
  } catch {
    throw new Error(
      'setupSolidComponentEnv requires "@solidjs/testing-library". Run `pnpm add -D @solidjs/testing-library solid-js`.',
    );
  }
}

export async function setupSolidComponentEnv(
  opts: SetupSolidComponentEnvOptions,
): Promise<SolidTestEnvUi> {
  const tl = await loadSolidTestingLibrary();
  const renderOpts: { props?: Record<string, unknown> } = {};
  if (opts.props) renderOpts.props = opts.props;
  const result = tl.render(opts.component, renderOpts);
  return {
    mode: opts.mode === 'interaction' ? 'live' : 'mock',
    kind: 'solid',
    result,
    markup: result.container.innerHTML,
    stop: async () => {
      result.unmount();
      tl.cleanup();
    },
  };
}
