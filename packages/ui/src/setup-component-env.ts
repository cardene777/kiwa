import type { ReactElement } from 'react';
import type {
  InteractionTestEnvUi,
  RenderTestEnvUi,
  SetupComponentEnvOptions,
  SnapshotTestEnvUi,
  UiTestEnv,
} from './types.js';

type ScreenApi = typeof import('@testing-library/react')['screen'];

interface TestingLibraryModule {
  render: (ui: ReactElement, options?: unknown) => import('@testing-library/react').RenderResult;
  cleanup: () => void;
  screen: ScreenApi;
}

interface UserEventModule {
  default: {
    setup: (
      options?: unknown,
    ) => import('@testing-library/user-event').UserEvent;
  };
}

async function loadTestingLibrary(): Promise<TestingLibraryModule> {
  try {
    return (await import('@testing-library/react')) as unknown as TestingLibraryModule;
  } catch {
    throw new Error(
      'setupComponentEnv requires "@testing-library/react" to be installed. Run `pnpm add -D @testing-library/react`.',
    );
  }
}

async function loadUserEvent(): Promise<UserEventModule> {
  try {
    return (await import('@testing-library/user-event')) as unknown as UserEventModule;
  } catch {
    throw new Error(
      'setupComponentEnv({ mode: "interaction" }) requires "@testing-library/user-event". Run `pnpm add -D @testing-library/user-event`.',
    );
  }
}

export async function setupComponentEnv(opts: SetupComponentEnvOptions): Promise<UiTestEnv> {
  const tl = await loadTestingLibrary();
  const result = tl.render(opts.ui, opts.renderOptions);

  if (opts.mode === 'interaction') {
    const ue = await loadUserEvent();
    const user = ue.default.setup(opts.userEventOptions);
    const env: InteractionTestEnvUi = {
      mode: 'live',
      kind: 'interaction',
      result,
      screen: tl.screen,
      user,
      stop: async () => {
        result.unmount();
        tl.cleanup();
      },
    };
    return env;
  }

  if (opts.mode === 'snapshot') {
    const env: SnapshotTestEnvUi = {
      mode: 'mock',
      kind: 'snapshot',
      result,
      markup: result.container.innerHTML,
      stop: async () => {
        result.unmount();
        tl.cleanup();
      },
    };
    return env;
  }

  if (opts.mode === 'render') {
    const env: RenderTestEnvUi = {
      mode: 'mock',
      kind: 'render',
      result,
      screen: tl.screen,
      stop: async () => {
        result.unmount();
        tl.cleanup();
      },
    };
    return env;
  }

  throw new Error(`setupComponentEnv: unknown mode "${String(opts.mode)}"`);
}
