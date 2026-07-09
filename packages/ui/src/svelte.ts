import type { TestEnvBase } from '@kiwa-lab/core';

/**
 * Svelte component test adapter. Wraps @testing-library/svelte's `render` so the
 * mode + stop() contract stays identical across React / Vue / Svelte adapters.
 */
export type SvelteComponentLike = unknown;

export interface SetupSvelteComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: SvelteComponentLike;
  props?: Record<string, unknown>;
}

export interface SvelteContainerLike {
  container: HTMLElement;
  getByTestId: (id: string) => HTMLElement;
  getByText: (text: string | RegExp) => HTMLElement;
}

export interface SvelteTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'svelte';
  result: SvelteContainerLike;
  markup: string;
}

interface SvelteTestingLibraryModule {
  render: (component: unknown, opts?: { props?: Record<string, unknown> }) => SvelteContainerLike & { unmount: () => void };
  cleanup: () => void;
}

async function loadSvelteTestingLibrary(): Promise<SvelteTestingLibraryModule> {
  try {
    return (await import('@testing-library/svelte')) as unknown as SvelteTestingLibraryModule;
  } catch {
    throw new Error(
      'setupSvelteComponentEnv requires "@testing-library/svelte". Run `pnpm add -D @testing-library/svelte svelte`.',
    );
  }
}

export async function setupSvelteComponentEnv(
  opts: SetupSvelteComponentEnvOptions,
): Promise<SvelteTestEnvUi> {
  const tl = await loadSvelteTestingLibrary();
  const renderOpts: { props?: Record<string, unknown> } = {};
  if (opts.props) renderOpts.props = opts.props;
  const result = tl.render(opts.component, renderOpts);
  return {
    mode: opts.mode === 'interaction' ? 'live' : 'mock',
    kind: 'svelte',
    result,
    markup: result.container.innerHTML,
    stop: async () => {
      result.unmount();
      tl.cleanup();
    },
  };
}
