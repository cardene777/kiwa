export interface DeadlineContext {
  startAt: number;
  deadlineMs: number;
  now: () => number;
}

/**
 * gRPC の deadline (call が終わる期限) を propagate する context 作成。
 * real gRPC の `context.WithDeadline` 相当 mock。 remainingMs で propagation 判定。
 */
export function createDeadlineContext(deadlineMs: number, now: () => number = () => 0): DeadlineContext {
  return { startAt: now(), deadlineMs, now };
}

export function remainingDeadlineMs(ctx: DeadlineContext): number {
  return Math.max(0, ctx.deadlineMs - (ctx.now() - ctx.startAt));
}

export function isDeadlineExceeded(ctx: DeadlineContext): boolean {
  return remainingDeadlineMs(ctx) === 0;
}
