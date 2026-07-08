import { describe, expect, it } from 'vitest';
import { createVoiceStreamingMock } from '../../src/index.js';

describe('voice-streaming axis', () => {
  it('openSession emits session event', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    await mock.openSession({ sessionId: 's-1', model: 'gpt-4o-realtime', voice: 'alloy' });
    expect(mock.getMetrics().custom['sessionsOpened']).toBe(1);
  });

  it('sendAudioChunk accumulates bytes', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    await mock.sendAudioChunk({ sessionId: 's-1', sequenceNumber: 1, byteLength: 8000, durationMs: 200 });
    await mock.sendAudioChunk({ sessionId: 's-1', sequenceNumber: 2, byteLength: 8000, durationMs: 200 });
    expect(mock.getMetrics().custom['bytesSent']).toBe(16000);
  });

  it('receiveResponseChunk accumulates receive-side counters', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    await mock.receiveResponseChunk({ sessionId: 's-1', sequenceNumber: 1, byteLength: 4000, durationMs: 100 });
    expect(mock.getMetrics().custom['chunksReceived']).toBe(1);
  });

  it('completeTurn increments turns', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    await mock.completeTurn({ sessionId: 's-1', totalDurationMs: 2000 });
    expect(mock.getMetrics().custom['turnsCompleted']).toBe(1);
  });

  it('protocol + axis identifiers exposed', () => {
    const mock = createVoiceStreamingMock();
    expect(mock.protocol).toBe('ai-media');
    expect(mock.axis).toBe('voice-streaming');
  });

  it('full session → chunks → response → turn flow works', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    await mock.openSession({ sessionId: 's', model: 'gpt-4o-realtime', voice: 'echo' });
    await mock.sendAudioChunk({ sessionId: 's', sequenceNumber: 1, byteLength: 500, durationMs: 50 });
    await mock.sendAudioChunk({ sessionId: 's', sequenceNumber: 2, byteLength: 500, durationMs: 50 });
    await mock.receiveResponseChunk({ sessionId: 's', sequenceNumber: 1, byteLength: 800, durationMs: 100 });
    await mock.completeTurn({ sessionId: 's', totalDurationMs: 200 });
    const m = mock.getMetrics();
    expect(m.custom['sessionsOpened']).toBe(1);
    expect(m.custom['chunksSent']).toBe(2);
    expect(m.custom['chunksReceived']).toBe(1);
    expect(m.custom['turnsCompleted']).toBe(1);
  });

  it('reset clears state', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    await mock.openSession({ sessionId: 's', model: 'x', voice: 'y' });
    mock.reset();
    expect(mock.getMetrics().eventsEmitted).toBe(0);
  });

  it('events emitted per op', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    let count = 0;
    mock.onEvent(() => count++);
    await mock.openSession({ sessionId: 's', model: 'x', voice: 'y' });
    await mock.sendAudioChunk({ sessionId: 's', sequenceNumber: 1, byteLength: 100, durationMs: 10 });
    expect(count).toBe(2);
  });
});
