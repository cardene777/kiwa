import type { WebhookVerifier, IncomingWebhook, WebhookVerifyOutcome } from './client.js';

export interface IdempotencyCache {
  seen: (key: string) => boolean;
  mark: (key: string, outcome: WebhookVerifyOutcome) => void;
  get: (key: string) => WebhookVerifyOutcome | undefined;
  clear: () => void;
}

export function createIdempotencyCache(): IdempotencyCache {
  const store = new Map<string, WebhookVerifyOutcome>();
  return {
    seen: (key) => store.has(key),
    mark: (key, outcome) => { store.set(key, outcome); },
    get: (key) => store.get(key),
    clear: () => store.clear(),
  };
}

/** idempotent verify: event id (or dedup key) で dup detection、 cached outcome 返却。 */
export function verifyIdempotent(
  verifier: WebhookVerifier,
  incoming: IncomingWebhook,
  idempotencyKey: string,
  cache: IdempotencyCache,
): WebhookVerifyOutcome & { deduplicated: boolean } {
  const cached = cache.get(idempotencyKey);
  if (cached) return { ...cached, deduplicated: true };
  const outcome = verifier.verify(incoming);
  cache.mark(idempotencyKey, outcome);
  return { ...outcome, deduplicated: false };
}
