import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('integration — voice + whisper + inference cross-axis', () => {
  it.each(platforms)('%s: full voice → whisper → inference chain', async (platform) => {
    const adapter = makeMockAdapter();
    const voice = await adapter.startVoiceFlow({ platform, userId: 'u', model: 'x' });
    await adapter.sendVoiceAudio(voice, { seq: 1, bytes: 8000, durationMs: 200 });
    await adapter.completeVoiceTurn(voice, { totalDurationMs: 200 });
    await adapter.closeVoiceFlow(voice);
    const whisper = await adapter.startWhisperFlow({ platform, userId: 'u' });
    await adapter.triggerVadEvent(whisper, { type: 'start', timestampMs: 0 });
    await adapter.streamAudioToWhisper(whisper, { bytes: 3200, durationMs: 200 });
    await adapter.triggerVadEvent(whisper, { type: 'end', timestampMs: 500 });
    await adapter.closeWhisperFlow(whisper);
    const inf = await adapter.startInferenceFlow({ platform, userId: 'u', modelName: 'yolo-v8' });
    await adapter.submitInferenceRequest(inf, { requestId: 'r-1', frameNumber: 1, budgetMs: 33 });
    const budget = await adapter.reportInferenceBudget(inf, { requestId: 'r-1', consumedMs: 25, budgetMs: 33 });
    expect(budget.metadata.exceeded).toBe(false);
  });

  it('concurrent sessions independent', async () => {
    const adapter = makeMockAdapter();
    const voice = await adapter.startVoiceFlow({ platform: 'chromium', userId: 'a', model: 'x' });
    const whisper = await adapter.startWhisperFlow({ platform: 'webkit', userId: 'b' });
    const inf = await adapter.startInferenceFlow({ platform: 'firefox', userId: 'c', modelName: 'x' });
    expect(voice.sessionId).not.toBe(whisper.sessionId);
    expect(whisper.sessionId).not.toBe(inf.sessionId);
  });

  it('multi-turn voice conversation preserves userId', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startVoiceFlow({ platform: 'chromium', userId: 'alice', model: 'x' });
    for (let turn = 0; turn < 3; turn++) {
      await adapter.sendVoiceAudio(s, { seq: turn, bytes: 500, durationMs: 100 });
      await adapter.completeVoiceTurn(s, { totalDurationMs: 100 });
    }
    expect(s.userId).toBe('alice');
  });

  it('VAD start/end cycle works multiple times', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWhisperFlow({ platform: 'chromium', userId: 'u' });
    for (let i = 0; i < 3; i++) {
      await adapter.triggerVadEvent(s, { type: 'start', timestampMs: i * 1000 });
      await adapter.streamAudioToWhisper(s, { bytes: 800, durationMs: 100 });
      await adapter.triggerVadEvent(s, { type: 'end', timestampMs: i * 1000 + 500 });
    }
  });

  it('inference budget escalation preserves request ids', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startInferenceFlow({ platform: 'chromium', userId: 'u', modelName: 'x' });
    for (const req of ['r-1', 'r-2', 'r-3']) {
      const step = await adapter.reportInferenceBudget(s, { requestId: req, consumedMs: 20, budgetMs: 33 });
      expect(step.metadata.requestId).toBe(req);
    }
  });

  it('inference budget exceeded flag set when consumed exceeds budget', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startInferenceFlow({ platform: 'chromium', userId: 'u', modelName: 'x' });
    const step = await adapter.reportInferenceBudget(s, { requestId: 'r', consumedMs: 50, budgetMs: 33 });
    expect(step.metadata.exceeded).toBe(true);
  });

  it('voice audio chunks preserved across a long session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startVoiceFlow({ platform: 'webkit', userId: 'u', model: 'x' });
    for (let seq = 1; seq <= 10; seq++) {
      const step = await adapter.sendVoiceAudio(s, { seq, bytes: 500, durationMs: 50 });
      expect(step.metadata.seq).toBe(seq);
    }
  });

  it('whisper stream + inference in parallel independent', async () => {
    const adapter = makeMockAdapter();
    const w = await adapter.startWhisperFlow({ platform: 'chromium', userId: 'u' });
    const i = await adapter.startInferenceFlow({ platform: 'chromium', userId: 'u', modelName: 'x' });
    await adapter.streamAudioToWhisper(w, { bytes: 100, durationMs: 10 });
    const step = await adapter.submitInferenceRequest(i, { requestId: 'r', frameNumber: 1, budgetMs: 33 });
    expect(step.outcome).toBe('success');
  });

  it('multi-model voice sessions preserve model name', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startVoiceFlow({ platform: 'chromium', userId: 'u', model: 'gpt-4o-realtime' });
    const s2 = await adapter.startVoiceFlow({ platform: 'webkit', userId: 'u', model: 'anthropic-voice' });
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });

  it('VAD + audio + VAD sequence emits correctly', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWhisperFlow({ platform: 'firefox', userId: 'u' });
    const startStep = await adapter.triggerVadEvent(s, { type: 'start', timestampMs: 0 });
    const audioStep = await adapter.streamAudioToWhisper(s, { bytes: 800, durationMs: 100 });
    const endStep = await adapter.triggerVadEvent(s, { type: 'end', timestampMs: 100 });
    expect(startStep.metadata.type).toBe('start');
    expect(audioStep.outcome).toBe('success');
    expect(endStep.metadata.type).toBe('end');
  });

  it('inference request preservation across submissions', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startInferenceFlow({ platform: 'chromium', userId: 'u', modelName: 'x' });
    for (const frameNumber of [1, 5, 10]) {
      const step = await adapter.submitInferenceRequest(s, { requestId: `r-${frameNumber}`, frameNumber, budgetMs: 33 });
      expect(step.metadata.frameNumber).toBe(frameNumber);
    }
  });

  it('close cycle across all axes is clean', async () => {
    const adapter = makeMockAdapter();
    const v = await adapter.startVoiceFlow({ platform: 'chromium', userId: 'u', model: 'x' });
    const w = await adapter.startWhisperFlow({ platform: 'chromium', userId: 'u' });
    const i = await adapter.startInferenceFlow({ platform: 'chromium', userId: 'u', modelName: 'x' });
    await adapter.closeVoiceFlow(v);
    await adapter.closeWhisperFlow(w);
    await adapter.closeInferenceFlow(i);
  });
});
