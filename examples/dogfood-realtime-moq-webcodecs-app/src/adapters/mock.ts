import {
  createMoqFetchMock,
  createSimulcastSvcMock,
  createWebCodecsEncoderMock,
  type MoqFetchMock,
  type SimulcastSvcMock,
  type WebCodecsEncoderMock,
} from '@kiwa-test/realtime';
import type { MediaSession, MediaStep, Platform, RealtimeMediaAdapter } from './interface.js';

interface MockContext {
  moqs: Map<string, MoqFetchMock>;
  encoders: Map<string, WebCodecsEncoderMock>;
  simulcasts: Map<string, SimulcastSvcMock>;
  ops: number;
}

export function makeMockAdapter(): RealtimeMediaAdapter {
  const ctx: MockContext = {
    moqs: new Map(),
    encoders: new Map(),
    simulcasts: new Map(),
    ops: 0,
  };
  const newSession = (prefix: string, platform: Platform, trackName: string): MediaSession => {
    ctx.ops++;
    return { sessionId: `${prefix}-${ctx.ops}`, platform, trackName };
  };
  return {
    startMoqFlow: async ({ platform, trackName }) => {
      const s = newSession('moq', platform, trackName);
      ctx.moqs.set(s.sessionId, createMoqFetchMock({ artificialLatencyMs: 0 }));
      return s;
    },
    announceMoqTrack: async (session, { namespace }) => {
      const mock = ctx.moqs.get(session.sessionId);
      if (!mock) throw new Error(`announceMoqTrack: unknown sessionId ${session.sessionId}`);
      await mock.announceTrack({ trackName: session.trackName, namespace, authInfo: 'test' });
      return {
        op: 'announceMoqTrack',
        outcome: 'success',
        metadata: { trackName: session.trackName, namespace },
      } satisfies MediaStep;
    },
    sendMoqObject: async (session, { groupId, objectId, bytes }) => {
      const mock = ctx.moqs.get(session.sessionId);
      if (!mock) throw new Error(`sendMoqObject: unknown sessionId ${session.sessionId}`);
      await mock.sendObject({ trackName: session.trackName, groupId, objectId, payloadBytes: bytes });
      return { op: 'sendMoqObject', outcome: 'success', metadata: { groupId, objectId, bytes } };
    },
    closeMoqFlow: async (session) => {
      ctx.moqs.delete(session.sessionId);
    },
    startEncoderFlow: async ({ platform, trackName, codec }) => {
      const s = newSession('enc', platform, trackName);
      const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
      await mock.configure({
        encoderId: s.sessionId,
        config: { codec, width: 1280, height: 720, bitrate: 2_500_000, hardwareAcceleration: 'prefer-hardware' },
      });
      ctx.encoders.set(s.sessionId, mock);
      return s;
    },
    encodeMediaFrame: async (session, { frameNumber, byteLength }) => {
      const mock = ctx.encoders.get(session.sessionId);
      if (!mock) throw new Error(`encodeMediaFrame: unknown sessionId ${session.sessionId}`);
      await mock.encodeFrame({ encoderId: session.sessionId, frameNumber, byteLength });
      return { op: 'encodeMediaFrame', outcome: 'success', metadata: { frameNumber, byteLength } };
    },
    reportEncoderHardware: async (session, { hardware }) => {
      const mock = ctx.encoders.get(session.sessionId);
      if (!mock) throw new Error(`reportEncoderHardware: unknown sessionId ${session.sessionId}`);
      await mock.reportHardwareUsed({ encoderId: session.sessionId, hardware });
      return { op: 'reportEncoderHardware', outcome: 'success', metadata: { hardware } };
    },
    closeEncoderFlow: async (session) => {
      ctx.encoders.delete(session.sessionId);
    },
    startSimulcastFlow: async ({ platform, trackName }) => {
      const s = newSession('sim', platform, trackName);
      ctx.simulcasts.set(s.sessionId, createSimulcastSvcMock({ artificialLatencyMs: 0 }));
      return s;
    },
    addSimulcastQualityLayer: async (session, { layerId, bitrateKbps }) => {
      const mock = ctx.simulcasts.get(session.sessionId);
      if (!mock) throw new Error(`addSimulcastQualityLayer: unknown sessionId ${session.sessionId}`);
      await mock.addSimulcastLayer({
        layerId,
        resolution: '1280x720',
        bitrateKbps,
        scalabilityMode: 'L1T3',
      });
      return { op: 'addSimulcastQualityLayer', outcome: 'success', metadata: { layerId, bitrateKbps } };
    },
    adaptSimulcastBitrate: async (session, { layerId, targetKbps, reason }) => {
      const mock = ctx.simulcasts.get(session.sessionId);
      if (!mock) throw new Error(`adaptSimulcastBitrate: unknown sessionId ${session.sessionId}`);
      await mock.adaptBitrate({ layerId, targetKbps, reason });
      return { op: 'adaptSimulcastBitrate', outcome: 'success', metadata: { layerId, targetKbps, reason } };
    },
    closeSimulcastFlow: async (session) => {
      ctx.simulcasts.delete(session.sessionId);
    },
  };
}
