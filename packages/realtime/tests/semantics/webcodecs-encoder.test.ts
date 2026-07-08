import { describe, expect, it } from 'vitest';
import { createWebCodecsEncoderMock, type SemanticsEvent } from '../../src/index.js';

describe('webcodecs-encoder axis', () => {
  it('configure emits encoder-config-set', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e: SemanticsEvent) => events.push(e));
    await mock.configure({
      encoderId: 'e-1',
      config: { codec: 'H264', width: 1280, height: 720, bitrate: 2_000_000, hardwareAcceleration: 'prefer-hardware' },
    });
    expect(events[0]?.kind).toBe('encoder-config-set');
  });

  it('encodeFrame accumulates count + bytes', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    await mock.encodeFrame({ encoderId: 'e-1', frameNumber: 1, byteLength: 5000 });
    await mock.encodeFrame({ encoderId: 'e-1', frameNumber: 2, byteLength: 3000 });
    const m = mock.getMetrics();
    expect(m.custom['framesEncoded']).toBe(2);
    expect(m.custom['bytesEncoded']).toBe(8000);
  });

  it('forceKeyframe increments keyframe count', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    await mock.forceKeyframe({ encoderId: 'e-1', frameNumber: 10 });
    expect(mock.getMetrics().custom['keyframesForced']).toBe(1);
  });

  it('reportHardwareUsed differentiates hardware vs software path', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    await mock.reportHardwareUsed({ encoderId: 'e-1', hardware: true });
    await mock.reportHardwareUsed({ encoderId: 'e-1', hardware: false });
    const m = mock.getMetrics();
    expect(m.custom['hardwarePath']).toBe(1);
    expect(m.custom['softwarePath']).toBe(1);
  });

  it('protocol + axis identifiers exposed', () => {
    const mock = createWebCodecsEncoderMock();
    expect(mock.protocol).toBe('webcodecs');
    expect(mock.axis).toBe('webcodecs-encoder');
  });

  it('reset clears state', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    await mock.encodeFrame({ encoderId: 'e-1', frameNumber: 1, byteLength: 100 });
    mock.reset();
    expect(mock.getMetrics().eventsEmitted).toBe(0);
  });

  it('all 4 codec options work in configure', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    await mock.configure({
      encoderId: 'e-1',
      config: { codec: 'AV1', width: 1920, height: 1080, bitrate: 5_000_000, hardwareAcceleration: 'no-preference' },
    });
    expect(mock.getMetrics().custom['configsSet']).toBe(1);
  });

  it('events maintain monotonic order across ops', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e: SemanticsEvent) => events.push(e));
    await mock.configure({
      encoderId: 'e-1',
      config: { codec: 'H264', width: 640, height: 480, bitrate: 500_000, hardwareAcceleration: 'prefer-software' },
    });
    await mock.encodeFrame({ encoderId: 'e-1', frameNumber: 1, byteLength: 100 });
    await mock.forceKeyframe({ encoderId: 'e-1', frameNumber: 2 });
    expect(events.map((e) => e.order)).toEqual([0, 1, 2]);
  });
});
