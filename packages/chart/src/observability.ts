export interface RenderMetric {
  operation: string;
  provider: string;
  durationMs: number;
  seriesCount: number;
  timestamp: number;
  status: 'ok' | 'error';
}

export interface ObservabilityHook {
  onRender?: (metric: RenderMetric) => void;
  onError?: (error: Error, context: Record<string, unknown>) => void;
}

/**
 * render 動作を metric として emit、 downstream (Datadog / OTel / console) に渡す
 * hook 経路。 real chart lib の performance measurement 相当。
 */
export function withObservability<T>(fn: () => T, hook: ObservabilityHook, context: { operation: string; provider: string; seriesCount: number; now?: () => number }): T {
  const now = context.now ?? (() => 0);
  const start = now();
  try {
    const result = fn();
    hook.onRender?.({
      operation: context.operation,
      provider: context.provider,
      durationMs: now() - start,
      seriesCount: context.seriesCount,
      timestamp: start,
      status: 'ok',
    });
    return result;
  } catch (e) {
    hook.onError?.(e as Error, { operation: context.operation, provider: context.provider });
    throw e;
  }
}
