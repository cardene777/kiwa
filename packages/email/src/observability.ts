import type { EmailClient, EmailMessage, EmailSendResult } from './client.js';

export type SendHookEvent = 'before-send' | 'after-send' | 'error';

export interface HookContext {
  event: SendHookEvent;
  message: EmailMessage;
  result?: EmailSendResult;
  error?: string;
  durationMs?: number;
}

export type HookCallback = (ctx: HookContext) => void | Promise<void>;

export interface HookRegistry {
  register: (event: SendHookEvent, cb: HookCallback) => () => void;
  emit: (event: SendHookEvent, ctx: HookContext) => Promise<void>;
  count: (event: SendHookEvent) => number;
}

/** observability hook registry。 send 前 / 後 / error 3 phase で callback を発火。 */
export function createHookRegistry(): HookRegistry {
  const hooks = new Map<SendHookEvent, HookCallback[]>();
  return {
    register(event, cb) {
      const list = hooks.get(event) ?? [];
      list.push(cb);
      hooks.set(event, list);
      return () => {
        const cur = hooks.get(event) ?? [];
        hooks.set(event, cur.filter((c) => c !== cb));
      };
    },
    async emit(event, ctx) {
      const list = hooks.get(event) ?? [];
      for (const cb of list) await cb(ctx);
    },
    count(event) {
      return (hooks.get(event) ?? []).length;
    },
  };
}

/**
 * observable send: before-send / after-send / error hook を発火しつつ send。
 * hook throw は catch して error hook に流す (send 自体は継続)。
 */
export async function sendObservable(
  client: EmailClient,
  msg: EmailMessage,
  hooks: HookRegistry,
): Promise<EmailSendResult> {
  const start = Date.now();
  await hooks.emit('before-send', { event: 'before-send', message: msg });
  try {
    const result = await client.send(msg);
    const durationMs = Date.now() - start;
    await hooks.emit('after-send', { event: 'after-send', message: msg, result, durationMs });
    return result;
  } catch (e) {
    const durationMs = Date.now() - start;
    await hooks.emit('error', { event: 'error', message: msg, error: (e as Error).message, durationMs });
    throw e;
  }
}
