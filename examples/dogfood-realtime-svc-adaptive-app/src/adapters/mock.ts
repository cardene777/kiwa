import {
  createMoqDatagramMediaMock,
  createSimulcastSvcMock,
  createWebCodecsDecoderMock,
  type MoqDatagramMediaMock,
  type SimulcastSvcMock,
  type WebCodecsDecoderMock,
} from '@kiwa-lab/realtime';
import type { AdaptiveSession, AdaptiveStep, Platform, RealtimeAdaptiveAdapter } from './interface.js';

interface MockContext {
  svcs: Map<string, SimulcastSvcMock>;
  decoders: Map<string, WebCodecsDecoderMock>;
  datagrams: Map<string, MoqDatagramMediaMock>;
  ops: number;
}

export function makeMockAdapter(): RealtimeAdaptiveAdapter {
  const ctx: MockContext = {
    svcs: new Map(),
    decoders: new Map(),
    datagrams: new Map(),
    ops: 0,
  };
  const newSession = (prefix: string, platform: Platform, trackName: string): AdaptiveSession => {
    ctx.ops++;
    return { sessionId: `${prefix}-${ctx.ops}`, platform, trackName };
  };
  return {
    startSvcFlow: async ({ platform, trackName }) => {
      const s = newSession('svc', platform, trackName);
      ctx.svcs.set(s.sessionId, createSimulcastSvcMock({ artificialLatencyMs: 0 }));
      return s;
    },
    selectSvcLayer: async (session, { layerId, temporalId, spatialId }) => {
      const mock = ctx.svcs.get(session.sessionId);
      if (!mock) throw new Error(`selectSvcLayer: unknown sessionId ${session.sessionId}`);
      await mock.selectSvcLayer({ layerId, temporalId, spatialId });
      return { op: 'selectSvcLayer', outcome: 'success', metadata: { layerId, temporalId, spatialId } } satisfies AdaptiveStep;
    },
    dropSvcLayer: async (session, { layerId, reason }) => {
      const mock = ctx.svcs.get(session.sessionId);
      if (!mock) throw new Error(`dropSvcLayer: unknown sessionId ${session.sessionId}`);
      await mock.dropLayer({ layerId, reason });
      return { op: 'dropSvcLayer', outcome: 'success', metadata: { layerId, reason } };
    },
    closeSvcFlow: async (session) => {
      ctx.svcs.delete(session.sessionId);
    },
    startDecoderFlow: async ({ platform, trackName, codec }) => {
      const s = newSession('dec', platform, trackName);
      const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
      await mock.configure({ decoderId: s.sessionId, config: { codec } });
      ctx.decoders.set(s.sessionId, mock);
      return s;
    },
    decodeMediaFrame: async (session, { frameNumber, type }) => {
      const mock = ctx.decoders.get(session.sessionId);
      if (!mock) throw new Error(`decodeMediaFrame: unknown sessionId ${session.sessionId}`);
      await mock.decodeFrame({ decoderId: session.sessionId, frameNumber, type });
      return { op: 'decodeMediaFrame', outcome: 'success', metadata: { frameNumber, type } };
    },
    dropDecoderFrame: async (session, { frameNumber, reason }) => {
      const mock = ctx.decoders.get(session.sessionId);
      if (!mock) throw new Error(`dropDecoderFrame: unknown sessionId ${session.sessionId}`);
      await mock.dropFrame({ decoderId: session.sessionId, frameNumber, reason });
      return { op: 'dropDecoderFrame', outcome: 'success', metadata: { frameNumber, reason } };
    },
    closeDecoderFlow: async (session) => {
      ctx.decoders.delete(session.sessionId);
    },
    startDatagramFlow: async ({ platform, trackName }) => {
      const s = newSession('dg', platform, trackName);
      ctx.datagrams.set(s.sessionId, createMoqDatagramMediaMock({ artificialLatencyMs: 0 }));
      return s;
    },
    sendMediaDatagram: async (session, { sequenceNumber, bytes, priority }) => {
      const mock = ctx.datagrams.get(session.sessionId);
      if (!mock) throw new Error(`sendMediaDatagram: unknown sessionId ${session.sessionId}`);
      await mock.sendDatagram({ trackName: session.trackName, sequenceNumber, payloadBytes: bytes, priority });
      return { op: 'sendMediaDatagram', outcome: 'success', metadata: { sequenceNumber, bytes, priority } };
    },
    recoverDatagramFec: async (session, { recoveredCount }) => {
      const mock = ctx.datagrams.get(session.sessionId);
      if (!mock) throw new Error(`recoverDatagramFec: unknown sessionId ${session.sessionId}`);
      await mock.recoverFec({ trackName: session.trackName, recoveredCount });
      return { op: 'recoverDatagramFec', outcome: 'success', metadata: { recoveredCount } };
    },
    closeDatagramFlow: async (session) => {
      ctx.datagrams.delete(session.sessionId);
    },
  };
}
