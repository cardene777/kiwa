/**
 * v2.1 enhancements = retry / batch / idempotency / observability / circuit-breaker (executeQuery 対象)。
 */
import { executeQuery, type GraphQLServer, type GraphQLExecutionResult, type GraphQLVariables } from './server.js';

// === retry ===
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  onRetry?: (attempt: number) => void;
}

export async function executeWithRetry(
  server: GraphQLServer,
  query: string,
  variables: GraphQLVariables = {},
  options: RetryOptions = {},
): Promise<GraphQLExecutionResult & { attempts: number }> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 100;
  let last: GraphQLExecutionResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await executeQuery(server, query, variables);
    if (!last.errors || last.errors.length === 0) return { ...last, attempts: attempt };
    if (attempt < maxAttempts) {
      options.onRetry?.(attempt);
      await new Promise((r) => setTimeout(r, initialDelay * 2 ** (attempt - 1)));
    }
  }
  return { ...(last as GraphQLExecutionResult), attempts: maxAttempts };
}

// === batch ===
export interface BatchExecuteResult {
  total: number;
  succeeded: number;
  failed: number;
  results: GraphQLExecutionResult[];
}

export async function executeBatch(
  server: GraphQLServer,
  queries: readonly { query: string; variables?: GraphQLVariables }[],
): Promise<BatchExecuteResult> {
  const results = await Promise.all(queries.map((q) => executeQuery(server, q.query, q.variables ?? {})));
  const failed = results.filter((r) => r.errors && r.errors.length > 0).length;
  return { total: queries.length, succeeded: results.length - failed, failed, results };
}

// === idempotency ===
export interface IdempotencyCache {
  get: (key: string) => GraphQLExecutionResult | undefined;
  set: (key: string, value: GraphQLExecutionResult) => void;
  size: () => number;
  clear: () => void;
}

export function createIdempotencyCache(): IdempotencyCache {
  const store = new Map<string, GraphQLExecutionResult>();
  return {
    get: (k) => store.get(k),
    set: (k, v) => { store.set(k, v); },
    size: () => store.size,
    clear: () => store.clear(),
  };
}

export async function executeIdempotent(
  server: GraphQLServer,
  query: string,
  variables: GraphQLVariables,
  idempotencyKey: string,
  cache: IdempotencyCache,
): Promise<GraphQLExecutionResult & { cached: boolean }> {
  const cached = cache.get(idempotencyKey);
  if (cached) return { ...cached, cached: true };
  const result = await executeQuery(server, query, variables);
  cache.set(idempotencyKey, result);
  return { ...result, cached: false };
}

// === observability ===
export type QueryHookEvent = 'before-query' | 'after-query' | 'error';

export interface HookContext {
  event: QueryHookEvent;
  query: string;
  variables?: GraphQLVariables;
  result?: GraphQLExecutionResult;
  error?: string;
}

export type HookCallback = (ctx: HookContext) => void;

export interface HookRegistry {
  register: (event: QueryHookEvent, cb: HookCallback) => () => void;
  emit: (event: QueryHookEvent, ctx: HookContext) => void;
  count: (event: QueryHookEvent) => number;
}

export function createHookRegistry(): HookRegistry {
  const hooks = new Map<QueryHookEvent, HookCallback[]>();
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

export async function executeObservable(
  server: GraphQLServer,
  query: string,
  variables: GraphQLVariables,
  hooks: HookRegistry,
): Promise<GraphQLExecutionResult> {
  hooks.emit('before-query', { event: 'before-query', query, variables });
  try {
    const result = await executeQuery(server, query, variables);
    hooks.emit('after-query', { event: 'after-query', query, variables, result });
    return result;
  } catch (e) {
    hooks.emit('error', { event: 'error', query, variables, error: (e as Error).message });
    throw e;
  }
}

// === circuit-breaker ===
export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  errorThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number;
}

export interface CircuitBreaker {
  state: () => CircuitState;
  execute: (query: string, variables?: GraphQLVariables) => Promise<GraphQLExecutionResult & { circuitState: CircuitState }>;
  reset: () => void;
  errorCount: () => number;
}

export function createCircuitBreaker(
  server: GraphQLServer,
  options: CircuitBreakerOptions = {},
): CircuitBreaker {
  const threshold = options.errorThreshold ?? 5;
  const resetTimeout = options.resetTimeoutMs ?? 30_000;
  const now = options.now ?? (() => Date.now());
  let state: CircuitState = 'closed';
  let errors = 0;
  let openedAt = 0;
  return {
    state: () => state,
    errorCount: () => errors,
    reset() { state = 'closed'; errors = 0; openedAt = 0; },
    async execute(query, variables = {}) {
      if (state === 'open') {
        if (now() - openedAt >= resetTimeout) {
          state = 'half-open';
        } else {
          return { data: null, errors: [{ message: 'circuit breaker open' }], circuitState: state };
        }
      }
      const result = await executeQuery(server, query, variables);
      if (result.errors && result.errors.length > 0) {
        errors += 1;
        if (errors >= threshold) { state = 'open'; openedAt = now(); }
      } else {
        errors = 0;
        if (state === 'half-open') state = 'closed';
      }
      return { ...result, circuitState: state };
    },
  };
}
