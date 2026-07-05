import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * CPU time limit — per-invocation compute budget. Edge runtimes bill wall-clock
 * loosely but enforce a hard CPU budget (Cloudflare Workers 50ms on the free
 * plan, Vercel + Deno enforce comparable ceilings). The axis accumulates
 * elapsed CPU time across ticks: below a warning threshold it is `running`, at
 * the threshold it flips to `warning`, and once the budget is exhausted the
 * invocation is `throttled` and no further work is admitted.
 */
export type CpuState = 'idle' | 'running' | 'warning' | 'throttled' | 'completed';

export interface CpuSession {
  platform: EdgePlatform;
  budgetMs: number;
  warningAtMs: number;
  elapsedMs: number;
  state: CpuState;
  history: AxisStep<CpuState>[];
}

/**
 * Open a CPU budget. `budgetMs` defaults to 50 (Workers free-plan default) and
 * `warningAtMs` to 40 (80% of the default budget). Emits nothing — the budget
 * is `idle` until {@link startCpu}.
 */
export function startCpuBudget(input: {
  platform: EdgePlatform;
  budgetMs?: number;
  warningAtMs?: number;
}): CpuSession {
  return {
    platform: input.platform,
    budgetMs: input.budgetMs ?? 50,
    warningAtMs: input.warningAtMs ?? 40,
    elapsedMs: 0,
    state: 'idle',
    history: [],
  };
}

/**
 * Begin consuming the CPU budget. Transitions `idle` → `running` and emits
 * `cpu.started`. Rejects if the session is not `idle`.
 */
export function startCpu(session: CpuSession): AxisStep<CpuState> {
  if (session.state !== 'idle') {
    throw new Error(`startCpu: session is ${session.state}, expected idle`);
  }
  session.state = 'running';
  const step: AxisStep<CpuState> = {
    neutralEvent: 'cpu.started',
    platformEvent: platformEventName(session.platform, 'cpu.started'),
    state: 'running',
    platform: session.platform,
    metadata: { budgetMs: session.budgetMs },
  };
  session.history.push(step);
  return step;
}

/**
 * Advance the CPU clock by `deltaMs`. Emits `cpu.limited` when the accumulated
 * time reaches the budget (state → `throttled`), `cpu.budget-warning` when it
 * crosses the warning threshold (state → `warning`), otherwise a `cpu.started`
 * heartbeat carrying the remaining budget. Rejects once the session is
 * `throttled` or `completed`.
 */
export function tickCpu(
  session: CpuSession,
  input: { deltaMs: number },
): AxisStep<CpuState> {
  if (session.state === 'idle') {
    throw new Error('tickCpu: session is idle, call startCpu first');
  }
  if (session.state === 'throttled' || session.state === 'completed') {
    throw new Error(`tickCpu: session is ${session.state}, cannot tick`);
  }
  session.elapsedMs += input.deltaMs;
  if (session.elapsedMs >= session.budgetMs) {
    session.state = 'throttled';
    const step: AxisStep<CpuState> = {
      neutralEvent: 'cpu.limited',
      platformEvent: platformEventName(session.platform, 'cpu.limited'),
      state: 'throttled',
      platform: session.platform,
      metadata: {
        elapsedMs: session.elapsedMs,
        budgetMs: session.budgetMs,
        overshootMs: session.elapsedMs - session.budgetMs,
      },
    };
    session.history.push(step);
    return step;
  }
  if (session.elapsedMs >= session.warningAtMs) {
    session.state = 'warning';
    const step: AxisStep<CpuState> = {
      neutralEvent: 'cpu.budget-warning',
      platformEvent: platformEventName(session.platform, 'cpu.budget-warning'),
      state: 'warning',
      platform: session.platform,
      metadata: {
        elapsedMs: session.elapsedMs,
        warningAtMs: session.warningAtMs,
        remaining: session.budgetMs - session.elapsedMs,
      },
    };
    session.history.push(step);
    return step;
  }
  const step: AxisStep<CpuState> = {
    neutralEvent: 'cpu.started',
    platformEvent: platformEventName(session.platform, 'cpu.started'),
    state: session.state,
    platform: session.platform,
    metadata: {
      elapsedMs: session.elapsedMs,
      budgetMs: session.budgetMs,
      remaining: session.budgetMs - session.elapsedMs,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Finish the invocation. Transitions to `completed` and emits `cpu.completed`
 * with the used ratio. Rejects if the session never started (`idle`).
 */
export function completeCpu(session: CpuSession): AxisStep<CpuState> {
  if (session.state === 'idle') {
    throw new Error('completeCpu: session is idle, cannot complete');
  }
  session.state = 'completed';
  const step: AxisStep<CpuState> = {
    neutralEvent: 'cpu.completed',
    platformEvent: platformEventName(session.platform, 'cpu.completed'),
    state: 'completed',
    platform: session.platform,
    metadata: {
      elapsedMs: session.elapsedMs,
      budgetMs: session.budgetMs,
      usedRatio: session.elapsedMs / session.budgetMs,
    },
  };
  session.history.push(step);
  return step;
}
