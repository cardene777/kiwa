import type { MockHandler } from './types.js';

export interface MswServerLike {
  listen: (opts?: { onUnhandledRequest?: 'error' | 'warn' | 'bypass' }) => void;
  resetHandlers: (...handlers: MockHandler[]) => void;
  close: () => void;
  use: (...handlers: MockHandler[]) => void;
}

export interface StartMockServerOptions {
  handlers: MockHandler[];
  onUnhandledRequest?: 'error' | 'warn' | 'bypass';
}

export interface MockServerHandle {
  reset: () => void;
  close: () => void;
}

async function loadSetupServer(): Promise<(...handlers: MockHandler[]) => MswServerLike> {
  try {
    const mod = (await import('msw/node')) as unknown as {
      setupServer: (...handlers: MockHandler[]) => MswServerLike;
    };
    return mod.setupServer;
  } catch {
    throw new Error(
      'setupApiServer({ mode: "mock" | "hybrid" }) requires "msw" to be installed. Run `pnpm add -D msw`.',
    );
  }
}

export async function startMockServer(opts: StartMockServerOptions): Promise<MockServerHandle> {
  const setupServer = await loadSetupServer();
  const server = setupServer(...opts.handlers);
  server.listen({ onUnhandledRequest: opts.onUnhandledRequest ?? 'bypass' });
  return {
    reset: () => server.resetHandlers(...opts.handlers),
    close: () => server.close(),
  };
}
