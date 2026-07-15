/**
 * v2.1 extensions — EAS Update API mock, Modal presentation, retry, batch,
 * observability, timeout, rate limit, circuit breaker for Expo SDK 52+.
 */

export interface EASUpdateManifest {
  id: string;
  runtimeVersion: string;
  createdAt: number;
  isEnabled: boolean;
  channel: string;
}

export interface EASUpdateMock {
  checkForUpdateAsync: () => Promise<{ isAvailable: boolean; manifest?: EASUpdateManifest }>;
  fetchUpdateAsync: () => Promise<{ isNew: boolean; manifest?: EASUpdateManifest }>;
  reloadAsync: () => Promise<void>;
  addListener: (fn: (event: { type: string; manifest?: EASUpdateManifest }) => void) => () => void;
  publishUpdate: (manifest: EASUpdateManifest) => void;
}

/** EAS Update API mock — expo-updates 相当 */
export function mockEASUpdate(initial: EASUpdateManifest[] = []): EASUpdateMock {
  const manifests = [...initial];
  const listeners: Array<(event: { type: string; manifest?: EASUpdateManifest }) => void> = [];
  return {
    async checkForUpdateAsync() {
      const latest = manifests[manifests.length - 1];
      return latest ? { isAvailable: latest.isEnabled, manifest: latest } : { isAvailable: false };
    },
    async fetchUpdateAsync() {
      const latest = manifests[manifests.length - 1];
      return latest ? { isNew: true, manifest: latest } : { isNew: false };
    },
    async reloadAsync() {
      for (const l of listeners) l({ type: 'reload' });
    },
    addListener(fn) {
      listeners.push(fn);
      return () => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },
    publishUpdate(m) {
      manifests.push(m);
      for (const l of listeners) l({ type: 'update-available', manifest: m });
    },
  };
}

export interface ModalOptions {
  animation?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  transparent?: boolean;
}

export interface ModalMock {
  present: (options?: ModalOptions) => void;
  dismiss: () => void;
  isVisible: () => boolean;
  history: () => Array<{ action: 'present' | 'dismiss'; options?: ModalOptions; at: number }>;
}

/** Modal presentation mock */
export function mockModal(): ModalMock {
  const history: Array<{ action: 'present' | 'dismiss'; options?: ModalOptions; at: number }> = [];
  let visible = false;
  return {
    present(options) {
      visible = true;
      const entry: { action: 'present'; options?: ModalOptions; at: number } = { action: 'present', at: history.length };
      if (options !== undefined) entry.options = options;
      history.push(entry);
    },
    dismiss() {
      visible = false;
      history.push({ action: 'dismiss', at: history.length });
    },
    isVisible() { return visible; },
    history() { return [...history]; },
  };
}

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

export interface RetryResult<T> { ok: boolean; attempts: number; value?: T; error?: unknown; }

export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 10;
  const factor = options.backoffFactor ?? 2;
  let attempts = 0;
  let lastError: unknown;
  while (attempts < maxAttempts) {
    attempts += 1;
    try { return { ok: true, attempts, value: await fn() }; }
    catch (e) {
      lastError = e;
      if (attempts >= maxAttempts) break;
      await new Promise((r) => { const t = setTimeout(r, initialDelay * Math.pow(factor, attempts - 1)); (t as unknown as { unref?: () => void }).unref?.(); });
    }
  }
  return { ok: false, attempts, error: lastError };
}

export interface BatchResult<T> { successCount: number; failureCount: number; results: Array<{ ok: boolean; value?: T; error?: unknown }>; }

export async function batchAsync<T>(fns: Array<() => Promise<T>>, concurrency = 4): Promise<BatchResult<T>> {
  const results: BatchResult<T>['results'] = [];
  let successCount = 0, failureCount = 0;
  for (let i = 0; i < fns.length; i += concurrency) {
    const settled = await Promise.allSettled(fns.slice(i, i + concurrency).map((f) => f()));
    for (const s of settled) {
      if (s.status === 'fulfilled') { results.push({ ok: true, value: s.value }); successCount += 1; }
      else { results.push({ ok: false, error: s.reason }); failureCount += 1; }
    }
  }
  return { successCount, failureCount, results };
}

export interface ObservabilityHook {
  emit: (event: { kind: string; data: Record<string, unknown>; timestamp: number }) => void;
  events: () => Array<{ kind: string; data: Record<string, unknown>; timestamp: number }>;
  clear: () => void;
}

export function createObservabilityHook(): ObservabilityHook {
  const events: Array<{ kind: string; data: Record<string, unknown>; timestamp: number }> = [];
  return {
    emit(e) { events.push(e); },
    events() { return [...events]; },
    clear() { events.length = 0; },
  };
}

export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    (t as unknown as { unref?: () => void }).unref?.();
    fn().then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export interface RateLimiter { tryAcquire: () => boolean; reset: () => void; remaining: () => number; }

export function createRateLimiter(rps: number, burst = rps): RateLimiter {
  let tokens = burst;
  let lastRefill = 0;
  const refillRate = rps / 1000;
  return {
    tryAcquire() {
      const now = performance.now();
      if (lastRefill === 0) lastRefill = now;
      tokens = Math.min(burst, tokens + (now - lastRefill) * refillRate);
      lastRefill = now;
      if (tokens >= 1) { tokens -= 1; return true; }
      return false;
    },
    reset() { tokens = burst; lastRefill = 0; },
    remaining() { return Math.floor(tokens); },
  };
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreaker { state: () => CircuitState; execute: <T>(fn: () => Promise<T>) => Promise<T>; reset: () => void; }

export function createCircuitBreaker(failureThreshold: number, resetTimeoutMs: number): CircuitBreaker {
  let state: CircuitState = 'closed';
  let failureCount = 0;
  let lastFailureAt = 0;
  return {
    state() {
      if (state === 'open' && performance.now() - lastFailureAt >= resetTimeoutMs) state = 'half-open';
      return state;
    },
    async execute<T>(fn: () => Promise<T>) {
      if (state === 'open' && performance.now() - lastFailureAt < resetTimeoutMs) throw new Error('circuit-open');
      try {
        const v = await fn();
        if (state === 'half-open') { state = 'closed'; failureCount = 0; }
        return v;
      } catch (e) {
        failureCount += 1;
        lastFailureAt = performance.now();
        if (failureCount >= failureThreshold) state = 'open';
        throw e;
      }
    },
    reset() { state = 'closed'; failureCount = 0; lastFailureAt = 0; },
  };
}
