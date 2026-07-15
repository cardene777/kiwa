export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  onAttempt?: (attempt: number, delayMs: number) => void;
  sleep?: (ms: number) => Promise<void>;
}

export interface RetryResult<T> {
  value?: T;
  attempts: number;
  succeeded: boolean;
  error?: string;
  delaysMs: number[];
}

/**
 * exponential backoff で fn を retry。 実 provider (Temporal RetryPolicy /
 * Inngest step retry) の指数バックオフ挙動を再現。 delay は `baseDelayMs * 2 ** (attempt-1)`、
 * maxDelayMs で cap。
 */
export async function retryStep<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<RetryResult<T>> {
  const maxDelay = options.maxDelayMs ?? Number.MAX_SAFE_INTEGER;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => { setTimeout(r, ms).unref?.(); }));
  const delaysMs: number[] = [];
  let lastError: string | undefined;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      const value = await fn(attempt);
      const result: RetryResult<T> = { attempts: attempt, succeeded: true, delaysMs };
      result.value = value;
      return result;
    } catch (e) {
      lastError = (e as Error).message;
      if (attempt >= options.maxAttempts) break;
      const delay = Math.min(options.baseDelayMs * (2 ** (attempt - 1)), maxDelay);
      delaysMs.push(delay);
      options.onAttempt?.(attempt, delay);
      await sleep(delay);
    }
  }
  const failed: RetryResult<T> = { attempts: options.maxAttempts, succeeded: false, delaysMs };
  if (lastError !== undefined) failed.error = lastError;
  return failed;
}
