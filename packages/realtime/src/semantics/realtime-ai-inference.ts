import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * Realtime AI inference axis — per-frame prediction + latency budget
 * enforcement + drop on budget exceed。 real-time AR / VR / robot control
 * 用の budget-aware inference pipeline pattern (target < 33ms for 30fps)。
 */

export interface AiInferenceRequest {
  requestId: string;
  frameNumber: number;
  modelName: string;
  budgetMs: number;
}

export interface AiInferenceResponse {
  requestId: string;
  latencyMs: number;
  outputBytes: number;
}

export interface RealtimeAiInferenceMock extends SemanticsMock {
  readonly protocol: 'ai-media';
  readonly axis: 'realtime-ai-inference';
  sendRequest(input: AiInferenceRequest): Promise<void>;
  receiveResponse(input: AiInferenceResponse): Promise<void>;
  reportBudget(input: { requestId: string; budgetMs: number; consumedMs: number }): Promise<void>;
  dropRequest(input: { requestId: string; reason: string }): Promise<void>;
}

export function createRealtimeAiInferenceMock(
  config: SemanticsMockConfig = {},
): RealtimeAiInferenceMock {
  const handlers: Array<(e: SemanticsEvent) => void> = [];
  let metrics = initialMetrics();
  let elapsedMs = 0;
  let order = 0;
  const latency = config.artificialLatencyMs ?? 1;

  const emit = <T,>(kind: SemanticsEvent['kind'], streamId: string, payload: T): void => {
    elapsedMs += latency;
    const ev: SemanticsEvent<T> = { kind, streamId, payload, relativeTimeMs: elapsedMs, order: order++ };
    metrics.eventsEmitted++;
    handlers.forEach((h) => h(ev));
  };

  return {
    protocol: 'ai-media',
    axis: 'realtime-ai-inference',
    onEvent(handler) {
      handlers.push(handler);
      return () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    },
    getMetrics() {
      return metrics;
    },
    reset() {
      metrics = initialMetrics();
      elapsedMs = 0;
      order = 0;
    },
    async sendRequest(input) {
      emit('ai-inference-request', input.requestId, input);
      metrics.custom['requestsSent'] = (metrics.custom['requestsSent'] ?? 0) + 1;
    },
    async receiveResponse(input) {
      emit('ai-inference-response', input.requestId, input);
      metrics.custom['responsesReceived'] = (metrics.custom['responsesReceived'] ?? 0) + 1;
      metrics.custom['maxLatencyMs'] = Math.max(
        metrics.custom['maxLatencyMs'] ?? 0,
        input.latencyMs,
      );
    },
    async reportBudget(input) {
      emit('ai-inference-latency-budget', input.requestId, input);
      metrics.custom['budgetReports'] = (metrics.custom['budgetReports'] ?? 0) + 1;
      if (input.consumedMs > input.budgetMs) {
        metrics.custom['budgetExceeded'] = (metrics.custom['budgetExceeded'] ?? 0) + 1;
      }
    },
    async dropRequest(input) {
      emit('ai-inference-dropped', input.requestId, input);
      metrics.custom['requestsDropped'] = (metrics.custom['requestsDropped'] ?? 0) + 1;
    },
  };
}
