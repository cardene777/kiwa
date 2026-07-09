import type { TestEnvBase } from '@kiwa-lab/core';

/**
 * Vue 3 component test adapter. Reuses @vue/test-utils' `mount` helper while keeping
 * the kiwa lifecycle contract identical to the React adapter (mode + stop()).
 */
export type VueComponentLike = unknown;

export interface SetupVueComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: VueComponentLike;
  props?: Record<string, unknown>;
  slots?: Record<string, unknown>;
}

export interface VueDomWrapperLike {
  exists: () => boolean;
  text: () => string;
  element: HTMLElement;
  trigger: (eventName: string) => Promise<void>;
  setValue?: (value: unknown) => Promise<void>;
}

export interface VueWrapperLike {
  html: () => string;
  find: (selector: string) => VueDomWrapperLike;
  findAll: (selector: string) => VueDomWrapperLike[];
  trigger: (eventName: string) => Promise<void>;
  setValue?: (value: unknown) => Promise<void>;
  unmount: () => void;
}

export interface VueTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'vue';
  wrapper: VueWrapperLike;
  markup: string;
}

interface VueTestUtilsModule {
  mount: (component: unknown, options?: unknown) => VueWrapperLike;
}

async function loadVueTestUtils(): Promise<VueTestUtilsModule> {
  try {
    return (await import('@vue/test-utils')) as unknown as VueTestUtilsModule;
  } catch {
    throw new Error(
      'setupVueComponentEnv requires "@vue/test-utils". Run `pnpm add -D @vue/test-utils vue`.',
    );
  }
}

export async function setupVueComponentEnv(
  opts: SetupVueComponentEnvOptions,
): Promise<VueTestEnvUi> {
  const utils = await loadVueTestUtils();
  const mountOptions: Record<string, unknown> = {};
  if (opts.props) mountOptions.props = opts.props;
  if (opts.slots) mountOptions.slots = opts.slots;
  const wrapper = utils.mount(opts.component, mountOptions);
  return {
    mode: opts.mode === 'interaction' ? 'live' : 'mock',
    kind: 'vue',
    wrapper,
    markup: wrapper.html(),
    stop: async () => {
      wrapper.unmount();
    },
  };
}
