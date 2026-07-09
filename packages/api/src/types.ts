import type { TestEnvBase, TestMode } from '@kiwa-lab/core';

export type ApiHandlerSource =
  | { kind: 'fetch'; handler: (req: Request) => Promise<Response> | Response }
  | { kind: 'node'; handler: NodeRequestHandler };

export type NodeRequestHandler = (
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
) => void | Promise<void>;

export type MockHandler = unknown;

export interface SetupApiServerOptions<TMode extends TestMode = TestMode> {
  mode: TMode;
  /** msw v2 RequestHandler[] (mode = "mock" / "hybrid") */
  mockHandlers?: MockHandler[];
  /** Live HTTP handler (mode = "live" / "hybrid") */
  app?: ApiHandlerSource | NodeRequestHandler;
  /** Optional base URL applied to issued requests */
  baseUrl?: string;
  /** Optional headers applied to every request */
  defaultHeaders?: Record<string, string>;
}

export interface MockTestEnvApi extends TestEnvBase<'mock'> {
  baseUrl: string;
  request: ApiRequestClient;
  mocks: { reset: () => void };
}

export interface LiveTestEnvApi extends TestEnvBase<'live'> {
  baseUrl: string;
  request: ApiRequestClient;
}

export interface HybridTestEnvApi extends TestEnvBase<'hybrid'> {
  baseUrl: string;
  request: ApiRequestClient;
  mocks: { reset: () => void };
}

export type ApiTestEnv = MockTestEnvApi | LiveTestEnvApi | HybridTestEnvApi;

export interface ApiRequestClient {
  get: (path: string, init?: RequestInit) => Promise<ApiResponseSnapshot>;
  post: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
  put: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
  patch: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
  delete: (path: string, init?: RequestInit) => Promise<ApiResponseSnapshot>;
}

export interface ApiResponseSnapshot {
  status: number;
  headers: Record<string, string>;
  bodyText: string;
  json: <T = unknown>() => T;
}
