import { describe, expect, it } from 'vitest';
import { createMoqFetchMock, type SemanticsEvent } from '../../src/index.js';

describe('moq-fetch axis', () => {
  it('announceTrack emits announce event', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e: SemanticsEvent) => events.push(e));
    await mock.announceTrack({ trackName: 'video-1', namespace: 'live', authInfo: 'token' });
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe('moq-track-announce');
  });

  it('subscribeTrack emits subscribe event + increments counter', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    await mock.subscribeTrack({ trackName: 'video-1', namespace: 'live' });
    expect(mock.getMetrics().custom['tracksSubscribed']).toBe(1);
  });

  it('sendObject accumulates bytes + object count', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    await mock.sendObject({ trackName: 'v', groupId: 1, objectId: 1, payloadBytes: 1000 });
    await mock.sendObject({ trackName: 'v', groupId: 1, objectId: 2, payloadBytes: 500 });
    const m = mock.getMetrics();
    expect(m.custom['objectsSent']).toBe(2);
    expect(m.custom['bytesSent']).toBe(1500);
  });

  it('receiveObject accumulates receive-side counter', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    await mock.receiveObject({ trackName: 'v', groupId: 1, objectId: 1, payloadBytes: 800 });
    expect(mock.getMetrics().custom['bytesReceived']).toBe(800);
  });

  it('reset clears state', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    await mock.announceTrack({ trackName: 'v', namespace: 'ns', authInfo: 't' });
    mock.reset();
    expect(mock.getMetrics().eventsEmitted).toBe(0);
  });

  it('onEvent handler can be unsubscribed', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    const off = mock.onEvent((e: SemanticsEvent) => events.push(e));
    await mock.announceTrack({ trackName: 'v', namespace: 'n', authInfo: 't' });
    off();
    await mock.announceTrack({ trackName: 'v2', namespace: 'n', authInfo: 't' });
    expect(events).toHaveLength(1);
  });

  it('protocol + axis identifiers exposed', () => {
    const mock = createMoqFetchMock();
    expect(mock.protocol).toBe('moqt');
    expect(mock.axis).toBe('moq-fetch');
  });

  it('events carry monotonic order', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e: SemanticsEvent) => events.push(e));
    await mock.announceTrack({ trackName: 'v', namespace: 'n', authInfo: 't' });
    await mock.subscribeTrack({ trackName: 'v', namespace: 'n' });
    await mock.sendObject({ trackName: 'v', groupId: 1, objectId: 1, payloadBytes: 100 });
    expect(events.map((e) => e.order)).toEqual([0, 1, 2]);
  });
});
