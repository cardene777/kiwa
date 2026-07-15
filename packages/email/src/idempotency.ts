import type { EmailClient, EmailMessage, EmailSendResult } from './client.js';

export interface IdempotencyCache {
  get: (key: string) => EmailSendResult | undefined;
  set: (key: string, value: EmailSendResult) => void;
  size: () => number;
  clear: () => void;
}

/** in-memory idempotency cache (production では Redis 等に差替想定)。 */
export function createIdempotencyCache(): IdempotencyCache {
  const store = new Map<string, EmailSendResult>();
  return {
    get: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    size: () => store.size,
    clear: () => store.clear(),
  };
}

export interface IdempotentSendOptions {
  cache: IdempotencyCache;
  idempotencyKey: string;
}

/**
 * idempotent send: 同 idempotencyKey なら cached result を返却、 dup send 防止。
 * key 未登録なら send して cache に格納。
 */
export async function sendIdempotent(
  client: EmailClient,
  msg: EmailMessage,
  options: IdempotentSendOptions,
): Promise<EmailSendResult & { cached: boolean }> {
  const cached = options.cache.get(options.idempotencyKey);
  if (cached) return { ...cached, cached: true };
  const result = await client.send(msg);
  options.cache.set(options.idempotencyKey, result);
  return { ...result, cached: false };
}
