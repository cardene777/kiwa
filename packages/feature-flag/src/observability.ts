import { evaluateFlag, type EvaluateFlagResult } from './evaluator.js';
import type { FlagClient, FlagUser } from './client.js';

export type EvalHookEvent = 'before-eval' | 'after-eval' | 'error';

export interface HookContext {
  event: EvalHookEvent;
  key: string;
  user: FlagUser;
  result?: EvaluateFlagResult;
  error?: string;
}

export type HookCallback = (ctx: HookContext) => void;

export interface HookRegistry {
  register: (event: EvalHookEvent, cb: HookCallback) => () => void;
  emit: (event: EvalHookEvent, ctx: HookContext) => void;
  count: (event: EvalHookEvent) => number;
}

export function createHookRegistry(): HookRegistry {
  const hooks = new Map<EvalHookEvent, HookCallback[]>();
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

export function evaluateObservable(
  client: FlagClient,
  key: string,
  user: FlagUser,
  hooks: HookRegistry,
): EvaluateFlagResult {
  hooks.emit('before-eval', { event: 'before-eval', key, user });
  try {
    const result = evaluateFlag(client, key, user);
    hooks.emit('after-eval', { event: 'after-eval', key, user, result });
    return result;
  } catch (e) {
    hooks.emit('error', { event: 'error', key, user, error: (e as Error).message });
    throw e;
  }
}
