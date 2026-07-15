export interface CancelToken {
  isCanceled: () => boolean;
  cancel: (reason?: string) => void;
  reason: () => string | undefined;
  onCancel: (handler: (reason?: string) => void) => void;
}

/**
 * bidirectional cancel token。 real gRPC の client / server 両方向 cancel
 * propagation を mock。 handler を register して cancel 発火時に notification。
 */
export function createCancelToken(): CancelToken {
  let canceled = false;
  let reason: string | undefined;
  const handlers: Array<(reason?: string) => void> = [];
  return {
    isCanceled: () => canceled,
    cancel(r?: string) {
      if (canceled) return;
      canceled = true;
      reason = r;
      for (const h of handlers) h(r);
    },
    reason: () => reason,
    onCancel(handler) {
      handlers.push(handler);
      if (canceled) handler(reason);
    },
  };
}
