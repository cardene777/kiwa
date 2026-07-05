import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Subrequest limit — outbound fetch budget per invocation. Edge runtimes cap
 * how many subrequests a single handler may issue (Cloudflare Workers default
 * 50 on the free plan, Vercel + Deno enforce comparable ceilings). The axis
 * tracks a running count against the limit: below a warning threshold the
 * session is `ok`, at the threshold it is `approaching-limit`, and once the
 * count reaches the hard limit it is `limited` and further fetches are refused.
 */
export type SubrequestState = 'ok' | 'approaching-limit' | 'limited';

export interface SubrequestSession {
  platform: EdgePlatform;
  count: number;
  limit: number;
  warningThreshold: number;
  state: SubrequestState;
  history: AxisStep<SubrequestState>[];
}

/**
 * Open a subrequest budget. `limit` defaults to 50 (Workers free-plan default)
 * and `warningThreshold` to 40 (80% of the default limit). Emits nothing — the
 * budget is inert until the first {@link startSubrequest}.
 */
export function startSubrequestBudget(input: {
  platform: EdgePlatform;
  limit?: number;
  warningThreshold?: number;
}): SubrequestSession {
  return {
    platform: input.platform,
    count: 0,
    limit: input.limit ?? 50,
    warningThreshold: input.warningThreshold ?? 40,
    state: 'ok',
    history: [],
  };
}

/**
 * Announce an outbound subrequest. Emits `subrequest.started` but does not
 * advance the count (starting is distinct from counting — a started request
 * only counts once it is admitted via {@link countSubrequest}). Rejects when
 * the budget is already `limited`.
 */
export function startSubrequest(
  session: SubrequestSession,
  input: { url: string },
): AxisStep<SubrequestState> {
  if (session.state === 'limited') {
    throw new Error('startSubrequest: budget is limited, cannot start');
  }
  const step: AxisStep<SubrequestState> = {
    neutralEvent: 'subrequest.started',
    platformEvent: platformEventName(session.platform, 'subrequest.started'),
    state: session.state,
    platform: session.platform,
    metadata: { url: input.url, currentCount: session.count },
  };
  session.history.push(step);
  return step;
}

/**
 * Count an admitted subrequest against the budget. Increments the count and
 * emits `subrequest.limited` when the count reaches the hard limit (state →
 * `limited`), otherwise `subrequest.counted` — flipping to `approaching-limit`
 * once the warning threshold is crossed.
 */
export function countSubrequest(session: SubrequestSession): AxisStep<SubrequestState> {
  if (session.state === 'limited') {
    throw new Error('countSubrequest: budget is limited, cannot count further');
  }
  session.count += 1;
  if (session.count >= session.limit) {
    session.state = 'limited';
    const step: AxisStep<SubrequestState> = {
      neutralEvent: 'subrequest.limited',
      platformEvent: platformEventName(session.platform, 'subrequest.limited'),
      state: 'limited',
      platform: session.platform,
      metadata: { count: session.count, limit: session.limit },
    };
    session.history.push(step);
    return step;
  }
  if (session.count >= session.warningThreshold) {
    session.state = 'approaching-limit';
  }
  const step: AxisStep<SubrequestState> = {
    neutralEvent: 'subrequest.counted',
    platformEvent: platformEventName(session.platform, 'subrequest.counted'),
    state: session.state,
    platform: session.platform,
    metadata: {
      count: session.count,
      limit: session.limit,
      remaining: session.limit - session.count,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Mark an outbound subrequest as finished. Emits `subrequest.completed` with
 * the final count. Does not mutate state — a completed request that already
 * tripped the limit stays `limited`.
 */
export function completeSubrequest(
  session: SubrequestSession,
  input: { url: string; durationMs: number },
): AxisStep<SubrequestState> {
  const step: AxisStep<SubrequestState> = {
    neutralEvent: 'subrequest.completed',
    platformEvent: platformEventName(session.platform, 'subrequest.completed'),
    state: session.state,
    platform: session.platform,
    metadata: {
      url: input.url,
      durationMs: input.durationMs,
      totalCount: session.count,
    },
  };
  session.history.push(step);
  return step;
}

/** Remaining subrequest budget (never negative). */
export function remainingBudget(session: SubrequestSession): number {
  return Math.max(0, session.limit - session.count);
}
