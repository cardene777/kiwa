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

/**
 * What each hook does, independent of who calls it.
 *
 * `createAnalyticsPlugin` registers these on the simulated NitroApp that
 * `invokeNitroPlugin` builds, and `server/plugins/analytics.ts` registers them
 * on the real one. The two differ: Nitro hands `request` an `H3Event` and
 * `error` an `(error, context)` pair, while the simulator hands each hook a
 * single payload. Keeping the work here means neither caller can drift from the
 * other.
 */
export function onRequest(ctx: AnalyticsContext, payload: RequestPayload): void {
  const requestId = ctx.generateRequestId();
  const context = payload.context ?? {};
  context.requestId = requestId;
  context.startedAt = Date.now();
  payload.context = context;
  ctx.logger.info('request.start', { requestId, method: payload.method, url: payload.url });
}

export function onBeforeResponse(ctx: AnalyticsContext, payload: BeforeResponsePayload): void {
  const context = payload.context ?? {};
  const startedAt = typeof context.startedAt === 'number' ? context.startedAt : Date.now();
  const requestId = typeof context.requestId === 'string' ? context.requestId : 'unknown';
  const elapsedMs = Date.now() - startedAt;
  ctx.logger.info('request.end', { requestId, status: payload.status, elapsedMs });
}

export function onError(ctx: AnalyticsContext, payload: ErrorPayload): void {
  ctx.logger.error('request.error', { url: payload.url, message: payload.error.message });
}

export function createAnalyticsPlugin(ctx: AnalyticsContext) {
  return (nitroApp: SimulatedNitroApp): void => {
    nitroApp.hooks.hook<RequestPayload>('request', (payload) => onRequest(ctx, payload));
    nitroApp.hooks.hook<BeforeResponsePayload>('beforeResponse', (p) => onBeforeResponse(ctx, p));
    nitroApp.hooks.hook<ErrorPayload>('error', (payload) => onError(ctx, payload));
  };
}
