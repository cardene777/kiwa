export type Platform = 'chromium' | 'webkit' | 'firefox';

export interface AdaptiveSession {
  sessionId: string;
  platform: Platform;
  trackName: string;
}

export interface AdaptiveStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface RealtimeAdaptiveAdapter {
  // svc axis
  startSvcFlow: (input: { platform: Platform; trackName: string }) => Promise<AdaptiveSession>;
  selectSvcLayer: (session: AdaptiveSession, input: { layerId: string; temporalId: number; spatialId: number }) => Promise<AdaptiveStep>;
  dropSvcLayer: (session: AdaptiveSession, input: { layerId: string; reason: string }) => Promise<AdaptiveStep>;
  closeSvcFlow: (session: AdaptiveSession) => Promise<void>;
  // decoder axis
  startDecoderFlow: (input: { platform: Platform; trackName: string; codec: 'H264' | 'VP9' | 'AV1' }) => Promise<AdaptiveSession>;
  decodeMediaFrame: (session: AdaptiveSession, input: { frameNumber: number; type: 'key' | 'delta' }) => Promise<AdaptiveStep>;
  dropDecoderFrame: (session: AdaptiveSession, input: { frameNumber: number; reason: string }) => Promise<AdaptiveStep>;
  closeDecoderFlow: (session: AdaptiveSession) => Promise<void>;
  // datagram axis
  startDatagramFlow: (input: { platform: Platform; trackName: string }) => Promise<AdaptiveSession>;
  sendMediaDatagram: (session: AdaptiveSession, input: { sequenceNumber: number; bytes: number; priority: number }) => Promise<AdaptiveStep>;
  recoverDatagramFec: (session: AdaptiveSession, input: { recoveredCount: number }) => Promise<AdaptiveStep>;
  closeDatagramFlow: (session: AdaptiveSession) => Promise<void>;
}
