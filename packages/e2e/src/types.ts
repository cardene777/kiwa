import type { TestEnvBase } from '@kiwa-test/core';
import type { ApiHandlerSource, NodeRequestHandler } from './http-server.js';

export type E2eMode = 'live' | 'static';

export interface SetupE2eEnvOptions {
  /** Mount the app under the given baseUrl (default http://127.0.0.1:auto) */
  app?: ApiHandlerSource | NodeRequestHandler;
  /** Static HTML to serve at "/" when no app is given */
  staticHtml?: string;
  /** Playwright browser (default chromium) */
  browser?: 'chromium' | 'firefox' | 'webkit';
  /** headless launch flag (default true) */
  headless?: boolean;
  /** initial route to navigate after launch */
  initialPath?: string;
}

export interface E2eTestEnv extends TestEnvBase<'live'> {
  baseUrl: string;
  page: import('./browser-bridge.js').BrowserPageHandle;
  browser: 'chromium' | 'firefox' | 'webkit';
}
