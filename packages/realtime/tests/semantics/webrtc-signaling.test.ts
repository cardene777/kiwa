import { describe, expect, it } from 'vitest';
import {
  createWebRtcSignalingMock,
  type SemanticsEvent,
} from '../../src/index.js';

describe('webrtc-signaling axis', () => {
  it('T-SEM-SIG-001 createOffer emits offer event with sdp payload', async () => {
    const mock = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const sdp = await mock.createOffer();
    expect(sdp.type).toBe('offer');
    expect(sdp.mediaSections).toBe(3);
    expect(sdp.bundleEnabled).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe('offer');
  });

  it('T-SEM-SIG-002 createAnswer emits answer after receiving offer', async () => {
    const mock = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    const offer = await mock.createOffer();
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const answer = await mock.createAnswer(offer);
    expect(answer.type).toBe('answer');
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe('answer');
  });

  it('T-SEM-SIG-003 emitIceCandidates trickles N candidates in order', async () => {
    const mock = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const list = await mock.emitIceCandidates(5);
    expect(list).toHaveLength(5);
    expect(events.filter((e) => e.kind === 'ice-candidate')).toHaveLength(5);
    // order は 0,1,2,3,4 で単調増加
    for (let i = 0; i < 5; i += 1) {
      expect(events[i]?.order).toBe(i);
    }
  });

  it('T-SEM-SIG-004 renegotiate emits renegotiation event', async () => {
    const mock = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    await mock.createOffer();
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const sdp = await mock.renegotiate();
    expect(sdp.type).toBe('offer');
    expect(events[0]?.kind).toBe('renegotiation');
    const metrics = mock.getMetrics();
    expect(metrics.custom.renegotiations).toBe(1);
  });

  it('T-SEM-SIG-005 metrics reset clears counters', async () => {
    const mock = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    await mock.createOffer();
    await mock.emitIceCandidates(3);
    mock.reset();
    const metrics = mock.getMetrics();
    expect(metrics.eventsEmitted).toBe(0);
    expect(metrics.custom.offers).toBeUndefined();
  });

  it('T-SEM-SIG-006 deterministic fingerprint with fixed seed', async () => {
    const mock1 = createWebRtcSignalingMock({ artificialLatencyMs: 0, seed: 42 });
    const mock2 = createWebRtcSignalingMock({ artificialLatencyMs: 0, seed: 42 });
    const s1 = await mock1.createOffer();
    const s2 = await mock2.createOffer();
    expect(s1.fingerprint).toBe(s2.fingerprint);
  });
});
