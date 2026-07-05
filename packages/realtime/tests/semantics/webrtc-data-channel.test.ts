import { describe, expect, it } from 'vitest';
import {
  createWebRtcDataChannelMock,
  type SemanticsEvent,
} from '../../src/index.js';

describe('webrtc-data-channel axis', () => {
  it('T-SEM-DC-001 createDataChannel emits data-open after async ready', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const dc = mock.createDataChannel({ label: 'chat' });
    expect(dc.readyState).toBe('connecting');
    await new Promise((r) => setTimeout(r, 5));
    expect(events.some((e) => e.kind === 'data-open')).toBe(true);
    expect(dc.readyState).toBe('open');
  });

  it('T-SEM-DC-002 send in ordered mode delivers all messages in seq order', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const dc = mock.createDataChannel({ ordered: true });
    await new Promise((r) => setTimeout(r, 5));
    await dc.send('a');
    await dc.send('b');
    await dc.send('c');
    const messages = events.filter((e) => e.kind === 'data-message');
    expect(messages).toHaveLength(3);
    for (let i = 0; i < 3; i += 1) {
      const p = messages[i]?.payload as { seq: number; dropped: boolean };
      expect(p.seq).toBe(i);
      expect(p.dropped).toBe(false);
    }
  });

  it('T-SEM-DC-003 unordered + maxRetransmits > 0 may drop under probabilistic model', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0, seed: 1 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const dc = mock.createDataChannel({ ordered: false, maxRetransmits: 1 });
    await new Promise((r) => setTimeout(r, 5));
    for (let i = 0; i < 50; i += 1) {
      await dc.send(`m-${i}`);
    }
    const messages = events.filter((e) => e.kind === 'data-message');
    const drops = messages.filter((e) => (e.payload as { dropped: boolean }).dropped);
    // seed=1 で少なくとも 1 件は drop される想定 (確率的だが決定的 seed 使用)
    expect(drops.length).toBeGreaterThan(0);
  });

  it('T-SEM-DC-004 close emits data-close and updates readyState', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const dc = mock.createDataChannel();
    await new Promise((r) => setTimeout(r, 5));
    await dc.close();
    expect(dc.readyState).toBe('closed');
    expect(events.some((e) => e.kind === 'data-close')).toBe(true);
  });

  it('T-SEM-DC-005 send on closed channel throws', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    const dc = mock.createDataChannel();
    await new Promise((r) => setTimeout(r, 5));
    await dc.close();
    await expect(dc.send('x')).rejects.toThrow(/not open/);
  });

  it('T-SEM-DC-006 binaryType option persisted in payload', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const dc = mock.createDataChannel({ binaryType: 'blob' });
    await new Promise((r) => setTimeout(r, 5));
    await dc.send('hi');
    const msg = events.find((e) => e.kind === 'data-message');
    expect((msg?.payload as { binaryType: string }).binaryType).toBe('blob');
  });
});
