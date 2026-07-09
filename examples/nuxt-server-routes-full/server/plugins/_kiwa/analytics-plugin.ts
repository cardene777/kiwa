// analytics-plugin.ts — kiwa-test/nuxt の invokeNitroPlugin が direct invoke する pure plugin setup。
//
// 役割 ... request / beforeResponse / error 3 hook 登録、 各 request に request-id 振り出し +
// 応答時間計測、 error 時は error log を console.error に出力。 logger は引数注入 (Pattern A) で
// test 時に spy 可能。

import type { SimulatedNitroApp } from '@kiwa-lab/nuxt';

export interface AnalyticsLogger {
  info(msg: string, payload?: Record<string, unknown>): void;
  error(msg: string, payload?: Record<string, unknown>): void;
}

export interface AnalyticsContext {
  readonly logger: AnalyticsLogger;
  generateRequestId(): string;
}

export interface RequestPayload {
  readonly method?: string;
  readonly url?: string;
  context?: Record<string, unknown>;
}

export interface BeforeResponsePayload {
  context?: Record<string, unknown>;
  readonly status?: number;
}

export interface ErrorPayload {
  readonly error: Error;
  readonly url?: string;
}

export function createAnalyticsPlugin(ctx: AnalyticsContext) {
  return (nitroApp: SimulatedNitroApp): void => {
    nitroApp.hooks.hook<RequestPayload>('request', (payload) => {
      const requestId = ctx.generateRequestId();
      const context = payload.context ?? {};
      context.requestId = requestId;
      context.startedAt = Date.now();
      payload.context = context;
      ctx.logger.info('request.start', { requestId, method: payload.method, url: payload.url });
    });

    nitroApp.hooks.hook<BeforeResponsePayload>('beforeResponse', (payload) => {
      const context = payload.context ?? {};
      const startedAt = typeof context.startedAt === 'number' ? context.startedAt : Date.now();
      const requestId = typeof context.requestId === 'string' ? context.requestId : 'unknown';
      const elapsedMs = Date.now() - startedAt;
      ctx.logger.info('request.end', { requestId, status: payload.status, elapsedMs });
    });

    nitroApp.hooks.hook<ErrorPayload>('error', (payload) => {
      ctx.logger.error('request.error', { url: payload.url, message: payload.error.message });
    });
  };
}
