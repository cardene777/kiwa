import { describe, expect, it } from 'vitest';
import {
  createHttp3PushMock,
  createQuicMultiplexMock,
  createWebRtcDataChannelMock,
  createWebRtcIceMock,
  createWebRtcSignalingMock,
  createWebRtcTrackMock,
  createWebTransportBiMock,
  createWebTransportUniMock,
  measureSemanticsAxis,
  measureSemanticsGrid,
  SEMANTICS_GRID,
  type SemanticsGridScenarios,
} from '../../src/index.js';

describe('semantics fidelity grid (24 row)', () => {
  it('T-SEM-FID-001 SEMANTICS_GRID has exactly 24 rows (3 protocol × 8 axis)', () => {
    expect(SEMANTICS_GRID).toHaveLength(24);
    const applicable = SEMANTICS_GRID.filter((r) => r.applicable);
    expect(applicable).toHaveLength(8);
  });

  it('T-SEM-FID-002 SEMANTICS_GRID has 8 applicable rows and 16 placeholder rows', () => {
    const grouped = SEMANTICS_GRID.reduce<Record<string, number>>((acc, r) => {
      const key = `${r.protocol}:applicable=${r.applicable}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    // WebRTC 4 applicable (signaling/data-channel/track/ice)
    expect(grouped['webrtc:applicable=true']).toBe(4);
    // WebTransport 2 applicable (uni/bi)
    expect(grouped['webtransport:applicable=true']).toBe(2);
    // HTTP/3 QUIC 2 applicable (push/multiplex)
    expect(grouped['http3-quic:applicable=true']).toBe(2);
  });

  it('T-SEM-FID-003 measureSemanticsAxis collects events emitted by scenario', async () => {
    const mock = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    const row = await measureSemanticsAxis({
      mock,
      scenario: async () => {
        await mock.createOffer();
        await mock.emitIceCandidates(2);
      },
    });
    expect(row.protocol).toBe('webrtc');
    expect(row.axis).toBe('webrtc-signaling');
    expect(row.eventsEmitted).toBe(3); // 1 offer + 2 ice
    expect(row.events).toHaveLength(3);
  });

  it('T-SEM-FID-004 measureSemanticsGrid runs all 8 applicable axes and yields 24 row output', async () => {
    const scenarios: SemanticsGridScenarios['scenarios'] = new Map();
    const sig = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    scenarios.set('webrtc-signaling', {
      mock: sig,
      scenario: async () => {
        await sig.createOffer();
      },
    });
    const dc = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    scenarios.set('webrtc-data-channel', {
      mock: dc,
      scenario: async () => {
        const c = dc.createDataChannel();
        await new Promise((r) => setTimeout(r, 3));
        await c.send('x');
      },
    });
    const track = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    scenarios.set('webrtc-track', {
      mock: track,
      scenario: async () => {
        const s = await track.getUserMedia();
        for (const t of s.tracks) await track.addTrack(t, s);
      },
    });
    const ice = createWebRtcIceMock({ artificialLatencyMs: 0 });
    scenarios.set('webrtc-ice', {
      mock: ice,
      scenario: async () => {
        await ice.startGathering(2);
      },
    });
    const uni = createWebTransportUniMock({ artificialLatencyMs: 0 });
    scenarios.set('webtransport-uni', {
      mock: uni,
      scenario: async () => {
        const s = await uni.createUniStream();
        await s.write(new Uint8Array([1]));
      },
    });
    const bi = createWebTransportBiMock({ artificialLatencyMs: 0 });
    scenarios.set('webtransport-bi', {
      mock: bi,
      scenario: async () => {
        const s = await bi.createBiStream();
        await s.write(new Uint8Array([1, 2]));
      },
    });
    const push = createHttp3PushMock({ artificialLatencyMs: 0 });
    scenarios.set('http3-push', {
      mock: push,
      scenario: async () => {
        const p = await push.pushStream('/x');
        await p.sendHeaders({});
      },
    });
    const quic = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    scenarios.set('quic-multiplex', {
      mock: quic,
      scenario: async () => {
        await quic.openStream();
      },
    });
    const rows = await measureSemanticsGrid({ scenarios });
    expect(rows).toHaveLength(24);
    const measured = rows.filter((r) => r.applicable && r.eventsEmitted > 0);
    expect(measured).toHaveLength(8);
  });

  it('T-SEM-FID-005 measureSemanticsAxis timeout rejects with clear error', async () => {
    const mock = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    await expect(
      measureSemanticsAxis({
        mock,
        scenario: () => new Promise(() => {}),
        timeoutMs: 20,
      }),
    ).rejects.toThrow(/semantics timeout/);
  });

  it('T-SEM-FID-006 grid row without scenario returns placeholder (applicable=true, events=0)', async () => {
    const scenarios: SemanticsGridScenarios['scenarios'] = new Map();
    const rows = await measureSemanticsGrid({ scenarios });
    const untouched = rows.filter((r) => r.applicable && r.eventsEmitted === 0);
    // 8 applicable axes、 scenario 未登録なので全て untouched (events=0)
    expect(untouched).toHaveLength(8);
  });
});
