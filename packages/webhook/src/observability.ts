import type { WebhookVerifier, IncomingWebhook, WebhookVerifyOutcome } from './client.js';

export type VerifyHookEvent = 'before-verify' | 'after-verify' | 'rejected';

export interface HookContext {
  event: VerifyHookEvent;
  incoming: IncomingWebhook;
  outcome?: WebhookVerifyOutcome;
  durationMs?: number;
}

export type HookCallback = (ctx: HookContext) => void;

export interface HookRegistry {
  register: (event: VerifyHookEvent, cb: HookCallback) => () => void;
  emit: (event: VerifyHookEvent, ctx: HookContext) => void;
  count: (event: VerifyHookEvent) => number;
}

export function createHookRegistry(): HookRegistry {
  const hooks = new Map<VerifyHookEvent, HookCallback[]>();
  return {
    register(event, cb) {
      const list = hooks.get(event) ?? [];
      list.push(cb);
      hooks.set(event, list);
      return () => {
        hooks.set(event, (hooks.get(event) ?? []).filter((c) => c !== cb));
      };
    },
    emit(event, ctx) {
      for (const cb of hooks.get(event) ?? []) cb(ctx);
    },
    count: (event) => (hooks.get(event) ?? []).length,
  };
}

export function verifyObservable(
  verifier: WebhookVerifier,
  incoming: IncomingWebhook,
  hooks: HookRegistry,
): WebhookVerifyOutcome {
  const start = Date.now();
  hooks.emit('before-verify', { event: 'before-verify', incoming });
  const outcome = verifier.verify(incoming);
  const durationMs = Date.now() - start;
  hooks.emit('after-verify', { event: 'after-verify', incoming, outcome, durationMs });
  if (outcome.status === 'rejected') {
    hooks.emit('rejected', { event: 'rejected', incoming, outcome, durationMs });
  }
  return outcome;
}
