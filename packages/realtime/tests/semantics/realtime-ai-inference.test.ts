import { describe, expect, it } from 'vitest';
import { createRealtimeAiInferenceMock } from '../../src/index.js';

describe('realtime-ai-inference axis', () => {
  it('sendRequest counts requests', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.sendRequest({
      requestId: 'r-1',
      frameNumber: 1,
      modelName: 'yolo-v8',
      budgetMs: 33,
    });
    expect(mock.getMetrics().custom['requestsSent']).toBe(1);
  });

  it('receiveResponse tracks max latency', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.receiveResponse({ requestId: 'r-1', latencyMs: 20, outputBytes: 100 });
    await mock.receiveResponse({ requestId: 'r-2', latencyMs: 45, outputBytes: 100 });
    expect(mock.getMetrics().custom['maxLatencyMs']).toBe(45);
  });

  it('reportBudget flags budget exceeded', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.reportBudget({ requestId: 'r-1', budgetMs: 33, consumedMs: 40 });
    await mock.reportBudget({ requestId: 'r-2', budgetMs: 33, consumedMs: 20 });
    expect(mock.getMetrics().custom['budgetExceeded']).toBe(1);
    expect(mock.getMetrics().custom['budgetReports']).toBe(2);
  });

  it('dropRequest counts drops', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.dropRequest({ requestId: 'r-1', reason: 'budget-exceeded' });
    expect(mock.getMetrics().custom['requestsDropped']).toBe(1);
  });

  it('protocol + axis identifiers exposed', () => {
    const mock = createRealtimeAiInferenceMock();
    expect(mock.protocol).toBe('ai-media');
    expect(mock.axis).toBe('realtime-ai-inference');
  });

  it('full request → response → budget cycle works', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.sendRequest({
      requestId: 'r-1',
      frameNumber: 1,
      modelName: 'clip',
      budgetMs: 33,
    });
    await mock.receiveResponse({ requestId: 'r-1', latencyMs: 25, outputBytes: 512 });
    await mock.reportBudget({ requestId: 'r-1', budgetMs: 33, consumedMs: 25 });
    const m = mock.getMetrics();
    expect(m.custom['requestsSent']).toBe(1);
    expect(m.custom['responsesReceived']).toBe(1);
    expect(m.custom['budgetReports']).toBe(1);
    expect(m.custom['budgetExceeded']).toBeUndefined();
  });

  it('reset clears state', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.sendRequest({
      requestId: 'r-1',
      frameNumber: 1,
      modelName: 'x',
      budgetMs: 33,
    });
    mock.reset();
    expect(mock.getMetrics().eventsEmitted).toBe(0);
  });

  it('budget exceeded increments only when consumed > budget', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.reportBudget({ requestId: 'r-1', budgetMs: 33, consumedMs: 33 });
    await mock.reportBudget({ requestId: 'r-2', budgetMs: 33, consumedMs: 34 });
    expect(mock.getMetrics().custom['budgetExceeded']).toBe(1);
  });
});
