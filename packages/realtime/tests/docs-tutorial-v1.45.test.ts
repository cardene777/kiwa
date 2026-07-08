/**
 * v1.45-5 docs 補強 — tutorial 100-102 code snippet 検証。
 * 23 milestone 連続 snippet validation streak = v1.23 → v1.45。
 */
import { describe, expect, it } from 'vitest';
import {
  createMoqDatagramMediaMock,
  createMoqFetchMock,
  createRealtimeAiInferenceMock,
  createSimulcastSvcMock,
  createVoiceStreamingMock,
  createWebCodecsDecoderMock,
  createWebCodecsEncoderMock,
  createWhisperStreamingMock,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 100 — MoQ + WebCodecs
// ---------------------------------------------------------------------------

describe('tutorial 100 — MoQT delivery', () => {
  it('announces and delivers object', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    await mock.announceTrack({ trackName: 'video-1', namespace: 'live', authInfo: 'token' });
    await mock.subscribeTrack({ trackName: 'video-1', namespace: 'live' });
    await mock.sendObject({ trackName: 'video-1', groupId: 1, objectId: 1, payloadBytes: 1500 });
    expect(mock.getMetrics().custom['objectsSent']).toBe(1);
    expect(mock.getMetrics().custom['bytesSent']).toBe(1500);
  });
});

describe('tutorial 100 — WebCodecs encoder', () => {
  it('configures with H264 + encodes with hardware path', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    await mock.configure({
      encoderId: 'e-1',
      config: { codec: 'H264', width: 1280, height: 720, bitrate: 2_000_000, hardwareAcceleration: 'prefer-hardware' },
    });
    await mock.encodeFrame({ encoderId: 'e-1', frameNumber: 1, byteLength: 5000 });
    await mock.reportHardwareUsed({ encoderId: 'e-1', hardware: true });
    expect(mock.getMetrics().custom['framesEncoded']).toBe(1);
    expect(mock.getMetrics().custom['hardwarePath']).toBe(1);
  });
});

describe('tutorial 100 — Simulcast + SVC', () => {
  it('adds L3T3 layer and adapts bitrate', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.addSimulcastLayer({
      layerId: 'high',
      resolution: '1920x1080',
      bitrateKbps: 5000,
      scalabilityMode: 'L3T3',
    });
    await mock.selectSvcLayer({ layerId: 'high', temporalId: 2, spatialId: 2 });
    await mock.adaptBitrate({ layerId: 'high', targetKbps: 3000, reason: 'network' });
    expect(mock.getMetrics().custom['bitrateAdaptations']).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 101 — voice + whisper + inference
// ---------------------------------------------------------------------------

describe('tutorial 101 — LLM voice streaming', () => {
  it('completes full session turn', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    await mock.openSession({ sessionId: 's-1', model: 'gpt-4o-realtime', voice: 'alloy' });
    await mock.sendAudioChunk({ sessionId: 's-1', sequenceNumber: 1, byteLength: 8000, durationMs: 200 });
    await mock.receiveResponseChunk({ sessionId: 's-1', sequenceNumber: 1, byteLength: 4000, durationMs: 100 });
    await mock.completeTurn({ sessionId: 's-1', totalDurationMs: 300 });
    expect(mock.getMetrics().custom['turnsCompleted']).toBe(1);
  });
});

describe('tutorial 101 — Whisper streaming', () => {
  it('handles VAD → transcript flow', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    await mock.triggerVad({ streamId: 's-1', type: 'start', timestampMs: 0 });
    await mock.sendAudioChunk({ streamId: 's-1', byteLength: 3200, durationMs: 200 });
    await mock.emitPartialTranscript({
      streamId: 's-1',
      text: 'hello',
      startMs: 0,
      endMs: 200,
      confidence: 0.75,
    });
    await mock.emitFinalTranscript({
      streamId: 's-1',
      text: 'hello world',
      startMs: 0,
      endMs: 500,
      confidence: 0.95,
    });
    await mock.triggerVad({ streamId: 's-1', type: 'end', timestampMs: 500 });
    expect(mock.getMetrics().custom['finalsEmitted']).toBe(1);
  });
});

describe('tutorial 101 — Realtime AI inference', () => {
  it('flags budget exceeded', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.sendRequest({ requestId: 'r-1', frameNumber: 1, modelName: 'yolo-v8', budgetMs: 33 });
    await mock.receiveResponse({ requestId: 'r-1', latencyMs: 40, outputBytes: 512 });
    await mock.reportBudget({ requestId: 'r-1', budgetMs: 33, consumedMs: 40 });
    expect(mock.getMetrics().custom['budgetExceeded']).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 102 — SVC + decoder + datagram
// ---------------------------------------------------------------------------

describe('tutorial 102 — SVC layer selection', () => {
  it('adds L3T3 layer + selects spatial 2 / temporal 2', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.addSimulcastLayer({
      layerId: 'high',
      resolution: '1920x1080',
      bitrateKbps: 5000,
      scalabilityMode: 'L3T3',
    });
    await mock.selectSvcLayer({ layerId: 'high', temporalId: 2, spatialId: 2 });
    expect(mock.getMetrics().custom['layersSelected']).toBe(1);
  });
});

describe('tutorial 102 — WebCodecs decoder', () => {
  it('decodes key + reorders + drops late frame', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    await mock.configure({ decoderId: 'd-1', config: { codec: 'AV1' } });
    await mock.decodeFrame({ decoderId: 'd-1', frameNumber: 1, type: 'key' });
    await mock.reorderFrame({ decoderId: 'd-1', frameNumber: 2, delayMs: 30 });
    await mock.decodeFrame({ decoderId: 'd-1', frameNumber: 3, type: 'delta' });
    await mock.dropFrame({ decoderId: 'd-1', frameNumber: 4, reason: 'budget-exceeded' });
    const m = mock.getMetrics();
    expect(m.custom['framesDecoded']).toBe(2);
    expect(m.custom['framesReordered']).toBe(1);
    expect(m.custom['framesDropped']).toBe(1);
  });
});

describe('tutorial 102 — MoQ datagram + FEC', () => {
  it('sends datagram, sets priority, recovers via FEC', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    await mock.sendDatagram({ trackName: 'v-1', sequenceNumber: 1, payloadBytes: 300, priority: 5 });
    await mock.setPriority({ trackName: 'v-1', priority: 10 });
    await mock.recoverFec({ trackName: 'v-1', recoveredCount: 3 });
    expect(mock.getMetrics().custom['fecRecovered']).toBe(3);
  });
});
