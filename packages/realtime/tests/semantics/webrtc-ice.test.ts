import { describe, expect, it } from 'vitest';
import {
  createWebRtcIceMock,
  type SemanticsEvent,
} from '../../src/index.js';

describe('webrtc-ice axis', () => {
  it('T-SEM-ICE-001 startGathering transitions state new → gathering → complete', async () => {
    const mock = createWebRtcIceMock({ artificialLatencyMs: 0 });
    expect(mock.gatheringState).toBe('new');
    await mock.startGathering(3);
    expect(mock.gatheringState).toBe('complete');
    const stats = mock.getIceStats();
    expect(stats.candidatesGathered).toBe(3);
  });

  it('T-SEM-ICE-002 gathering emits start + complete events with correct payload', async () => {
    const mock = createWebRtcIceMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    await mock.startGathering(2);
    const gatheringEvents = events.filter((e) => e.kind === 'ice-gathering');
    expect(gatheringEvents).toHaveLength(2);
    expect((gatheringEvents[0]?.payload as { state: string }).state).toBe('gathering');
    expect((gatheringEvents[1]?.payload as { state: string }).state).toBe('complete');
  });

  it('T-SEM-ICE-003 addRemoteCandidate increments remote count and emits event', async () => {
    const mock = createWebRtcIceMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    await mock.addRemoteCandidate('cand-1');
    await mock.addRemoteCandidate('cand-2');
    const stats = mock.getIceStats();
    expect(stats.candidatesRemote).toBe(2);
    expect(events.filter((e) => e.kind === 'ice-candidate')).toHaveLength(2);
  });

  it('T-SEM-ICE-004 startConnectivityCheck transitions state to connected', async () => {
    const mock = createWebRtcIceMock({ artificialLatencyMs: 0 });
    await mock.startGathering(2);
    await mock.addRemoteCandidate('r-1');
    expect(mock.connectionState).toBe('new');
    await mock.startConnectivityCheck();
    expect(mock.connectionState).toBe('connected');
    expect(mock.getIceStats().activeCandidatePairs).toBe(1);
  });

  it('T-SEM-ICE-005 forceRelay increments relay counter and emits event', async () => {
    const mock = createWebRtcIceMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    await mock.forceRelay();
    await mock.forceRelay();
    expect(mock.getIceStats().relayUsedCount).toBe(2);
    expect(events.filter((e) => e.kind === 'ice-relay-used')).toHaveLength(2);
  });

  it('T-SEM-ICE-006 reset returns state to initial', async () => {
    const mock = createWebRtcIceMock({ artificialLatencyMs: 0 });
    await mock.startGathering(5);
    mock.reset();
    expect(mock.gatheringState).toBe('new');
    expect(mock.connectionState).toBe('new');
    expect(mock.getIceStats().candidatesGathered).toBe(0);
  });
});
