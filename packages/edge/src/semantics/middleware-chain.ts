import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Middleware chain axis — edge runtime middleware pipeline (auth → rewrite
 * → cache → transform). Each middleware can pass, rewrite, short-circuit
 * (return without invoking downstream), or complete. The chain preserves
 * order so downstream tests can assert the exact sequence of stages
 * executed.
 */
export type MiddlewareState = 'idle' | 'running' | 'short-circuited' | 'completed';

export type MiddlewareStage = 'auth' | 'rewrite' | 'cache' | 'transform';

export interface MiddlewareSession {
  platform: EdgePlatform;
  stages: MiddlewareStage[];
  currentIndex: number;
  state: MiddlewareState;
  history: AxisStep<MiddlewareState>[];
  rewrittenUrl?: string;
}

/**
 * Open a middleware chain over the given ordered stages. The chain begins
 * `idle` and needs an explicit `enterMiddleware` call per stage.
 */
export function startMiddlewareChain(input: {
  platform: EdgePlatform;
  stages: MiddlewareStage[];
}): MiddlewareSession {
  return {
    platform: input.platform,
    stages: input.stages,
    currentIndex: -1,
    state: 'idle',
    history: [],
  };
}

/**
 * Enter the next stage. Emits `middleware.entered` and transitions to
 * `running`. Rejects if the chain has already short-circuited or completed.
 */
export function enterMiddleware(session: MiddlewareSession): AxisStep<MiddlewareState> {
  if (session.state === 'short-circuited' || session.state === 'completed') {
    throw new Error(`enterMiddleware: chain is ${session.state}`);
  }
  session.currentIndex++;
  if (session.currentIndex >= session.stages.length) {
    throw new Error('enterMiddleware: no more stages, call completeMiddleware');
  }
  session.state = 'running';
  const stage = session.stages[session.currentIndex]!;
  const step: AxisStep<MiddlewareState> = {
    neutralEvent: 'middleware.entered',
    platformEvent: platformEventName(session.platform, 'middleware.entered'),
    state: 'running',
    platform: session.platform,
    metadata: {
      stage,
      index: session.currentIndex,
      total: session.stages.length,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Rewrite the URL/request within the current stage (e.g. locale prefix,
 * a/b split). Records the rewritten URL and emits `middleware.rewritten`.
 */
export function rewriteRequest(
  session: MiddlewareSession,
  input: { url: string },
): AxisStep<MiddlewareState> {
  if (session.state !== 'running') {
    throw new Error(`rewriteRequest: chain is ${session.state}, cannot rewrite`);
  }
  session.rewrittenUrl = input.url;
  const stage = session.stages[session.currentIndex]!;
  const step: AxisStep<MiddlewareState> = {
    neutralEvent: 'middleware.rewritten',
    platformEvent: platformEventName(session.platform, 'middleware.rewritten'),
    state: 'running',
    platform: session.platform,
    metadata: {
      stage,
      rewrittenUrl: input.url,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Short-circuit the chain (auth reject, cache hit, terminating rewrite).
 * Transitions to `short-circuited` and emits `middleware.short-circuited`.
 * Downstream stages are not invoked.
 */
export function shortCircuit(
  session: MiddlewareSession,
  input: { reason: string },
): AxisStep<MiddlewareState> {
  if (session.state !== 'running') {
    throw new Error(`shortCircuit: chain is ${session.state}, cannot short-circuit`);
  }
  session.state = 'short-circuited';
  const stage = session.stages[session.currentIndex]!;
  const step: AxisStep<MiddlewareState> = {
    neutralEvent: 'middleware.short-circuited',
    platformEvent: platformEventName(session.platform, 'middleware.short-circuited'),
    state: 'short-circuited',
    platform: session.platform,
    metadata: {
      stage,
      reason: input.reason,
      skippedCount: session.stages.length - session.currentIndex - 1,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Complete the chain after every stage has been entered (or after the
 * final stage). Emits `middleware.completed` with the total stage count.
 */
export function completeMiddleware(session: MiddlewareSession): AxisStep<MiddlewareState> {
  if (session.state === 'short-circuited') {
    throw new Error('completeMiddleware: chain was short-circuited');
  }
  if (session.state === 'completed') {
    throw new Error('completeMiddleware: chain already completed');
  }
  session.state = 'completed';
  const step: AxisStep<MiddlewareState> = {
    neutralEvent: 'middleware.completed',
    platformEvent: platformEventName(session.platform, 'middleware.completed'),
    state: 'completed',
    platform: session.platform,
    metadata: {
      totalStages: session.stages.length,
      rewrittenUrl: session.rewrittenUrl ?? '',
    },
  };
  session.history.push(step);
  return step;
}
