export type Platform = 'chromium' | 'webkit' | 'firefox';

export interface MediaSession {
  sessionId: string;
  platform: Platform;
  trackName: string;
}

export interface MediaStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface RealtimeMediaAdapter {
  // moq axis
  startMoqFlow: (input: { platform: Platform; trackName: string }) => Promise<MediaSession>;
  announceMoqTrack: (session: MediaSession, input: { namespace: string }) => Promise<MediaStep>;
  sendMoqObject: (session: MediaSession, input: { groupId: number; objectId: number; bytes: number }) => Promise<MediaStep>;
  closeMoqFlow: (session: MediaSession) => Promise<void>;
  // encoder axis
  startEncoderFlow: (input: { platform: Platform; trackName: string; codec: 'H264' | 'VP9' | 'AV1' }) => Promise<MediaSession>;
  encodeMediaFrame: (session: MediaSession, input: { frameNumber: number; byteLength: number }) => Promise<MediaStep>;
  reportEncoderHardware: (session: MediaSession, input: { hardware: boolean }) => Promise<MediaStep>;
  closeEncoderFlow: (session: MediaSession) => Promise<void>;
  // simulcast axis
  startSimulcastFlow: (input: { platform: Platform; trackName: string }) => Promise<MediaSession>;
  addSimulcastQualityLayer: (session: MediaSession, input: { layerId: string; bitrateKbps: number }) => Promise<MediaStep>;
  adaptSimulcastBitrate: (session: MediaSession, input: { layerId: string; targetKbps: number; reason: string }) => Promise<MediaStep>;
  closeSimulcastFlow: (session: MediaSession) => Promise<void>;
}
