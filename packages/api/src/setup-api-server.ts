import type { TestMode } from '@kiwa-lab/core';
import { startLiveServer } from './live-server.js';
import { startMockServer } from './msw-bridge.js';
import { createRequestClient } from './request-client.js';
import type {
  ApiTestEnv,
  HybridTestEnvApi,
  LiveTestEnvApi,
  MockTestEnvApi,
  SetupApiServerOptions,
} from './types.js';

const MOCK_DEFAULT_BASE_URL = 'http://kiwa.mock';

export async function setupApiServer<TMode extends TestMode>(
  opts: SetupApiServerOptions<TMode>,
): Promise<ApiTestEnv> {
  if (opts.mode === 'mock') {
    if (!opts.mockHandlers) {
      throw new Error('setupApiServer({ mode: "mock" }) requires mockHandlers');
    }
    const mock = await startMockServer({ handlers: opts.mockHandlers });
    const baseUrl = opts.baseUrl ?? MOCK_DEFAULT_BASE_URL;
    const env: MockTestEnvApi = {
      mode: 'mock',
      baseUrl,
      request: createRequestClient({ baseUrl, ...(opts.defaultHeaders ? { defaultHeaders: opts.defaultHeaders } : {}) }),
      mocks: { reset: mock.reset },
      stop: async () => {
        mock.close();
      },
    };
    return env;
  }

  if (opts.mode === 'live') {
    if (!opts.app) {
      throw new Error('setupApiServer({ mode: "live" }) requires app');
    }
    const live = await startLiveServer(opts.app);
    const baseUrl = opts.baseUrl ?? live.baseUrl;
    const env: LiveTestEnvApi = {
      mode: 'live',
      baseUrl,
      request: createRequestClient({ baseUrl, ...(opts.defaultHeaders ? { defaultHeaders: opts.defaultHeaders } : {}) }),
      stop: () => live.close(),
    };
    return env;
  }

  if (opts.mode === 'hybrid') {
    if (!opts.app) {
      throw new Error('setupApiServer({ mode: "hybrid" }) requires app');
    }
    if (!opts.mockHandlers) {
      throw new Error('setupApiServer({ mode: "hybrid" }) requires mockHandlers');
    }
    const live = await startLiveServer(opts.app);
    const mock = await startMockServer({ handlers: opts.mockHandlers, onUnhandledRequest: 'bypass' });
    const baseUrl = opts.baseUrl ?? live.baseUrl;
    const env: HybridTestEnvApi = {
      mode: 'hybrid',
      baseUrl,
      request: createRequestClient({ baseUrl, ...(opts.defaultHeaders ? { defaultHeaders: opts.defaultHeaders } : {}) }),
      mocks: { reset: mock.reset },
      stop: async () => {
        mock.close();
        await live.close();
      },
    };
    return env;
  }

  throw new Error(`setupApiServer: unknown mode "${String(opts.mode)}"`);
}
