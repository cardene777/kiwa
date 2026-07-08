import type { TestEnvBase } from '@kiwa/core';

/**
 * Angular component test adapter. Wraps @testing-library/angular's `render`
 * so the mode + stop() contract stays identical across all framework adapters.
 *
 * Note: Angular requires its own TestBed initialization (typically via
 * `BrowserDynamicTestingModule` + `zone.js/testing` setup file). Downstream
 * consumers should ship a Vitest setup file:
 *
 *   import 'zone.js';
 *   import 'zone.js/testing';
 *   import { getTestBed } from '@angular/core/testing';
 *   import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
 *   getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
 *
 * See packages/ui/README.md "Angular quickstart" for the full vitest config.
 */
export type AngularComponentLike = unknown;

export interface SetupAngularComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: AngularComponentLike;
  inputs?: Record<string, unknown>;
}

export interface AngularContainerLike {
  container: HTMLElement;
  getByTestId: (id: string) => HTMLElement;
  getByText: (text: string | RegExp) => HTMLElement;
}

export interface AngularTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'angular';
  result: AngularContainerLike;
  markup: string;
}

interface AngularTestingLibraryModule {
  render: (
    component: unknown,
    opts?: { componentInputs?: Record<string, unknown> },
  ) => Promise<AngularContainerLike & { fixture: { destroy: () => void } }>;
  cleanup: () => Promise<void>;
}

async function loadAngularTestingLibrary(): Promise<AngularTestingLibraryModule> {
  // Use a runtime-computed specifier so TypeScript does not resolve the
  // optional peer dep at type-check time. The Angular adapter requires
  // downstream consumers to install both `@angular/core` and
  // `@testing-library/angular` along with a zone.js TestBed setup file.
  const specifier = '@testing-library/angular';
  try {
    return (await import(/* @vite-ignore */ specifier)) as unknown as AngularTestingLibraryModule;
  } catch {
    throw new Error(
      'setupAngularComponentEnv requires "@testing-library/angular". Run `pnpm add -D @testing-library/angular @angular/core @angular/platform-browser-dynamic zone.js`.',
    );
  }
}

export async function setupAngularComponentEnv(
  opts: SetupAngularComponentEnvOptions,
): Promise<AngularTestEnvUi> {
  const tl = await loadAngularTestingLibrary();
  const renderOpts: { componentInputs?: Record<string, unknown> } = {};
  if (opts.inputs) renderOpts.componentInputs = opts.inputs;
  const result = await tl.render(opts.component, renderOpts);
  return {
    mode: opts.mode === 'interaction' ? 'live' : 'mock',
    kind: 'angular',
    result,
    markup: result.container.innerHTML,
    stop: async () => {
      result.fixture.destroy();
      await tl.cleanup();
    },
  };
}
