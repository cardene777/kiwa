import { evaluateFlag, type EvaluateFlagResult } from './evaluator.js';
import type { FlagClient, FlagUser } from './client.js';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  isRetryable?: (result: EvaluateFlagResult) => boolean;
  onRetry?: (attempt: number) => void;
}

export async function evaluateWithRetry(
  client: FlagClient,
  key: string,
  user: FlagUser,
  options: RetryOptions = {},
): Promise<EvaluateFlagResult & { attempts: number }> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 50;
  const isRetryable = options.isRetryable ?? ((r) => r.reason === 'error');
  let last: EvaluateFlagResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = evaluateFlag(client, key, user);
    if (!isRetryable(last)) return { ...last, attempts: attempt };
    if (attempt < maxAttempts) {
      options.onRetry?.(attempt);
      await new Promise((r) => setTimeout(r, initialDelay * 2 ** (attempt - 1)));
    }
  }
  return { ...(last as EvaluateFlagResult), attempts: maxAttempts };
}
