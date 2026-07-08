import { describe, expect, it } from 'vitest';
import { createWhisperStreamingMock } from '../../src/index.js';

describe('whisper-streaming axis', () => {
  it('sendAudioChunk accumulates bytes', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    await mock.sendAudioChunk({ streamId: 's-1', byteLength: 3200, durationMs: 200 });
    expect(mock.getMetrics().custom['bytesSent']).toBe(3200);
  });

  it('emitPartialTranscript counts partial', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    await mock.emitPartialTranscript({
      streamId: 's-1',
      text: 'hello',
      startMs: 0,
      endMs: 500,
      confidence: 0.7,
    });
    expect(mock.getMetrics().custom['partialsEmitted']).toBe(1);
  });

  it('emitFinalTranscript counts final', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    await mock.emitFinalTranscript({
      streamId: 's-1',
      text: 'hello world',
      startMs: 0,
      endMs: 1000,
      confidence: 0.95,
    });
    expect(mock.getMetrics().custom['finalsEmitted']).toBe(1);
  });

  it('triggerVad differentiates start/end', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    await mock.triggerVad({ streamId: 's-1', type: 'start', timestampMs: 100 });
    await mock.triggerVad({ streamId: 's-1', type: 'end', timestampMs: 900 });
    const m = mock.getMetrics();
    expect(m.custom['vadStarts']).toBe(1);
    expect(m.custom['vadEnds']).toBe(1);
  });

  it('protocol + axis identifiers exposed', () => {
    const mock = createWhisperStreamingMock();
    expect(mock.protocol).toBe('ai-media');
    expect(mock.axis).toBe('whisper-streaming');
  });

  it('full VAD + partial + final cycle works', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    await mock.triggerVad({ streamId: 's', type: 'start', timestampMs: 0 });
    await mock.sendAudioChunk({ streamId: 's', byteLength: 3200, durationMs: 200 });
    await mock.emitPartialTranscript({
      streamId: 's',
      text: 'hi',
      startMs: 0,
      endMs: 200,
      confidence: 0.6,
    });
    await mock.emitPartialTranscript({
      streamId: 's',
      text: 'hi there',
      startMs: 0,
      endMs: 400,
      confidence: 0.75,
    });
    await mock.triggerVad({ streamId: 's', type: 'end', timestampMs: 500 });
    await mock.emitFinalTranscript({
      streamId: 's',
      text: 'hi there',
      startMs: 0,
      endMs: 500,
      confidence: 0.95,
    });
    const m = mock.getMetrics();
    expect(m.custom['partialsEmitted']).toBe(2);
    expect(m.custom['finalsEmitted']).toBe(1);
    expect(m.custom['vadStarts']).toBe(1);
    expect(m.custom['vadEnds']).toBe(1);
  });

  it('reset clears state', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    await mock.sendAudioChunk({ streamId: 's', byteLength: 100, durationMs: 10 });
    mock.reset();
    expect(mock.getMetrics().eventsEmitted).toBe(0);
  });
});
