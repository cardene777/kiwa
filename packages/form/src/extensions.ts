/**
 * v2.1 extensions — async validation, field array, dependent field validation,
 * plus retry/batch/observability/timeout/rateLimit/circuitBreaker generics.
 * React Hook Form v7.60+ / Zod v4 追随。
 */

export interface AsyncValidationOptions {
  debounceMs?: number;
  parallel?: boolean;
}

export interface AsyncValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  durationMs: number;
}

export type AsyncValidator = (value: unknown, field: string) => Promise<string | null>;

/** async validation — server 側 uniqueness chk 相当 */
export async function validateAsync(
  values: Record<string, unknown>,
  validators: Record<string, AsyncValidator>,
  options: AsyncValidationOptions = {},
): Promise<AsyncValidationResult> {
  const start = performance.now();
  const parallel = options.parallel ?? true;
  const errors: Record<string, string> = {};
  const entries = Object.entries(validators);
  if (parallel) {
    const results = await Promise.all(entries.map(async ([field, fn]) => ({ field, err: await fn(values[field], field) })));
    for (const { field, err } of results) if (err) errors[field] = err;
  } else {
    for (const [field, fn] of entries) {
      const err = await fn(values[field], field);
      if (err) errors[field] = err;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, durationMs: performance.now() - start };
}

export interface FieldArray<T> {
  items: () => T[];
  append: (item: T) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
  update: (index: number, item: T) => void;
  clear: () => void;
  length: () => number;
}

/** field array — React Hook Form useFieldArray 相当 */
export function createFieldArray<T>(initial: T[] = []): FieldArray<T> {
  const items = [...initial];
  return {
    items() { return [...items]; },
    append(item) { items.push(item); },
    remove(index) { if (index >= 0 && index < items.length) items.splice(index, 1); },
    move(from, to) {
      if (from < 0 || from >= items.length || to < 0 || to >= items.length) return;
      const [moved] = items.splice(from, 1);
      if (moved !== undefined) items.splice(to, 0, moved);
    },
    update(index, item) { if (index >= 0 && index < items.length) items[index] = item; },
    clear() { items.length = 0; },
    length() { return items.length; },
  };
}

export interface DependentFieldRule {
  field: string;
  dependsOn: string;
  when: (dependsValue: unknown) => boolean;
  validator: (value: unknown) => string | null;
}

export interface DependentFieldResult {
  valid: boolean;
  triggered: string[];
  errors: Record<string, string>;
}

/** dependent field validation — 「country=US なら zipCode 必須」 相当 */
export function validateDependentFields(values: Record<string, unknown>, rules: DependentFieldRule[]): DependentFieldResult {
  const errors: Record<string, string> = {};
  const triggered: string[] = [];
  for (const rule of rules) {
    if (rule.when(values[rule.dependsOn])) {
      triggered.push(rule.field);
      const err = rule.validator(values[rule.field]);
      if (err) errors[rule.field] = err;
    }
  }
  return { valid: Object.keys(errors).length === 0, triggered, errors };
}

export interface RetryOptions { maxAttempts?: number; initialDelayMs?: number; backoffFactor?: number; }
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

export interface ObservabilityHook {
  emit: (event: { kind: string; data: Record<string, unknown> }) => void;
  events: () => Array<{ kind: string; data: Record<string, unknown> }>;
  clear: () => void;
}

export function createObservabilityHook(): ObservabilityHook {
  const events: Array<{ kind: string; data: Record<string, unknown> }> = [];
  return { emit(e) { events.push(e); }, events() { return [...events]; }, clear() { events.length = 0; } };
}

export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    (t as unknown as { unref?: () => void }).unref?.();
    fn().then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
