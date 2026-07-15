/**
 * v2.1 enhancements = retry / batch / idempotency / observability / circuit-breaker。
 * push channel を対象 (SMS / in-app も同 pattern で拡張可)。
 */
import type { NotificationClient, PushMessage, NotificationSendResult } from './client.js';

// === retry ===
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  onRetry?: (attempt: number) => void;
}

export async function sendPushWithRetry(
  client: NotificationClient,
  msg: PushMessage,
  options: RetryOptions = {},
): Promise<NotificationSendResult & { attempts: number }> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 100;
  let last: NotificationSendResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await client.sendPush(msg);
    if (last.status !== 'failed') return { ...last, attempts: attempt };
    if (attempt < maxAttempts) {
      options.onRetry?.(attempt);
      await new Promise((r) => setTimeout(r, initialDelay * 2 ** (attempt - 1)));
    }
  }
  return { ...(last as NotificationSendResult), attempts: maxAttempts };
}

// === batch ===
export interface BatchSendResult {
  total: number;
  succeeded: number;
  failed: number;
  results: NotificationSendResult[];
}

export async function sendPushBatch(
  client: NotificationClient,
  messages: readonly PushMessage[],
  concurrency = 5,
): Promise<BatchSendResult> {
  const results: NotificationSendResult[] = [];
  for (let i = 0; i < messages.length; i += concurrency) {
    const chunk = messages.slice(i, i + concurrency);
    results.push(...await Promise.all(chunk.map((m) => client.sendPush(m))));
  }
  const failed = results.filter((r) => r.status === 'failed').length;
  return { total: messages.length, succeeded: results.length - failed, failed, results };
}

// === idempotency ===
export interface IdempotencyCache {
  get: (key: string) => NotificationSendResult | undefined;
  set: (key: string, value: NotificationSendResult) => void;
  size: () => number;
  clear: () => void;
}

export function createIdempotencyCache(): IdempotencyCache {
  const store = new Map<string, NotificationSendResult>();
  return {
    get: (k) => store.get(k),
    set: (k, v) => { store.set(k, v); },
    size: () => store.size,
    clear: () => store.clear(),
  };
}

export async function sendPushIdempotent(
  client: NotificationClient,
  msg: PushMessage,
  idempotencyKey: string,
  cache: IdempotencyCache,
): Promise<NotificationSendResult & { cached: boolean }> {
  const cached = cache.get(idempotencyKey);
  if (cached) return { ...cached, cached: true };
  const result = await client.sendPush(msg);
  cache.set(idempotencyKey, result);
  return { ...result, cached: false };
}

// === observability ===
export type SendHookEvent = 'before-send' | 'after-send' | 'error';

export interface HookContext {
  event: SendHookEvent;
  message: PushMessage;
  result?: NotificationSendResult;
  error?: string;
}

export type HookCallback = (ctx: HookContext) => void;

export interface HookRegistry {
  register: (event: SendHookEvent, cb: HookCallback) => () => void;
  emit: (event: SendHookEvent, ctx: HookContext) => void;
  count: (event: SendHookEvent) => number;
}

export function createHookRegistry(): HookRegistry {
  const hooks = new Map<SendHookEvent, HookCallback[]>();
  return {
    register(event, cb) {
      const list = hooks.get(event) ?? [];
      list.push(cb);
      hooks.set(event, list);
      return () => { hooks.set(event, (hooks.get(event) ?? []).filter((c) => c !== cb)); };
    },
    emit(event, ctx) { for (const cb of hooks.get(event) ?? []) cb(ctx); },
    count: (event) => (hooks.get(event) ?? []).length,
  };
}

export async function sendPushObservable(
  client: NotificationClient,
  msg: PushMessage,
  hooks: HookRegistry,
): Promise<NotificationSendResult> {
  hooks.emit('before-send', { event: 'before-send', message: msg });
  try {
    const result = await client.sendPush(msg);
    hooks.emit('after-send', { event: 'after-send', message: msg, result });
    return result;
  } catch (e) {
    hooks.emit('error', { event: 'error', message: msg, error: (e as Error).message });
    throw e;
  }
}

// === circuit-breaker ===
export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number;
}

export interface CircuitBreaker {
  state: () => CircuitState;
  sendPush: (msg: PushMessage) => Promise<NotificationSendResult & { circuitState: CircuitState }>;
  reset: () => void;
  failureCount: () => number;
}

export function createCircuitBreaker(
  client: NotificationClient,
  options: CircuitBreakerOptions = {},
): CircuitBreaker {
  const threshold = options.failureThreshold ?? 5;
  const resetTimeout = options.resetTimeoutMs ?? 30_000;
  const now = options.now ?? (() => Date.now());
  let state: CircuitState = 'closed';
  let failures = 0;
  let openedAt = 0;
  return {
    state: () => state,
    failureCount: () => failures,
    reset() { state = 'closed'; failures = 0; openedAt = 0; },
    async sendPush(msg) {
      if (state === 'open') {
        if (now() - openedAt >= resetTimeout) {
          state = 'half-open';
        } else {
          const blocked: NotificationSendResult = {
            id: 'circuit-open',
            channel: 'push',
            provider: 'fcm',
            status: 'failed',
            acceptedAt: now(),
            reason: 'circuit breaker open',
          };
          return { ...blocked, circuitState: state };
        }
      }
      const result = await client.sendPush(msg);
      if (result.status === 'failed') {
        failures += 1;
        if (failures >= threshold) { state = 'open'; openedAt = now(); }
      } else {
        failures = 0;
        if (state === 'half-open') state = 'closed';
      }
      return { ...result, circuitState: state };
    },
  };
}
