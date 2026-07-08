import type { TestEnvBase } from '@kiwa/core';

/**
 * Lit (Web Components) component test adapter. Uses @open-wc/testing-helpers'
 * `fixture` so customElements are upgraded before assertions run. Matches the
 * mode + stop() contract shared by React / Vue / Svelte / Solid adapters.
 */
export type LitTemplateLike = unknown;

export interface SetupLitComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  template: LitTemplateLike;
}

export interface LitElementHandle {
  element: HTMLElement;
  shadowRoot: ShadowRoot | null;
  /** Query inside light DOM. */
  querySelector: <T extends Element = Element>(selector: string) => T | null;
  /** Query inside shadow DOM if present, otherwise light DOM. */
  shadowQuerySelector: <T extends Element = Element>(selector: string) => T | null;
}

export interface LitTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'lit';
  handle: LitElementHandle;
  markup: string;
}

interface OpenWcTestingHelpersModule {
  fixture: <T extends HTMLElement>(template: unknown) => Promise<T>;
}

async function loadOpenWcTestingHelpers(): Promise<OpenWcTestingHelpersModule> {
  try {
    return (await import('@open-wc/testing-helpers')) as unknown as OpenWcTestingHelpersModule;
  } catch {
    throw new Error(
      'setupLitComponentEnv requires "@open-wc/testing-helpers". Run `pnpm add -D @open-wc/testing-helpers lit`.',
    );
  }
}

export async function setupLitComponentEnv(
  opts: SetupLitComponentEnvOptions,
): Promise<LitTestEnvUi> {
  const helpers = await loadOpenWcTestingHelpers();
  const element = await helpers.fixture<HTMLElement>(opts.template);
  const handle: LitElementHandle = {
    element,
    shadowRoot: element.shadowRoot ?? null,
    querySelector: (selector) => element.querySelector(selector) as never,
    shadowQuerySelector: (selector) => {
      const root = element.shadowRoot ?? element;
      return root.querySelector(selector) as never;
    },
  };
  return {
    mode: opts.mode === 'interaction' ? 'live' : 'mock',
    kind: 'lit',
    handle,
    markup: element.outerHTML,
    stop: async () => {
      element.remove();
    },
  };
}
