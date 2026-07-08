import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('inference axis — mock adapter', () => {
  it.each(platforms)('%s: startInferenceFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startInferenceFlow({ platform, userId: 'u', modelName: 'yolo-v8' });
    expect(s.sessionId).toMatch(/^inf-\d+$/);
  });

  it('submitInferenceRequest records budget', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startInferenceFlow({ platform: 'chromium', userId: 'u', modelName: 'x' });
    const step = await adapter.submitInferenceRequest(s, { requestId: 'r-1', frameNumber: 1, budgetMs: 33 });
    expect(step.metadata.budgetMs).toBe(33);
  });

  it('reportInferenceBudget flags exceeded when consumed > budget', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startInferenceFlow({ platform: 'webkit', userId: 'u', modelName: 'x' });
    const step1 = await adapter.reportInferenceBudget(s, { requestId: 'r-1', consumedMs: 40, budgetMs: 33 });
    const step2 = await adapter.reportInferenceBudget(s, { requestId: 'r-2', consumedMs: 20, budgetMs: 33 });
    expect(step1.metadata.exceeded).toBe(true);
    expect(step2.metadata.exceeded).toBe(false);
  });

  it('submitInferenceRequest rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.submitInferenceRequest({ sessionId: 'nope', platform: 'chromium', userId: 'u' }, { requestId: 'r', frameNumber: 1, budgetMs: 33 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeInferenceFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startInferenceFlow({ platform: 'firefox', userId: 'u', modelName: 'x' });
    await adapter.closeInferenceFlow(s);
    await expect(
      adapter.submitInferenceRequest(s, { requestId: 'r', frameNumber: 1, budgetMs: 33 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('budget report metadata is preserved', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startInferenceFlow({ platform: 'chromium', userId: 'u', modelName: 'x' });
    const step = await adapter.reportInferenceBudget(s, { requestId: 'r-x', consumedMs: 15, budgetMs: 33 });
    expect(step.metadata.requestId).toBe('r-x');
    expect(step.metadata.consumedMs).toBe(15);
  });
});

describe('inference axis — real adapter env-gate', () => {
  it.each(platforms)('%s: submitInferenceRequest reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startInferenceFlow({ platform, userId: 'u', modelName: 'x' });
    const step = await adapter.submitInferenceRequest(s, { requestId: 'r', frameNumber: 1, budgetMs: 33 });
    expect(step.outcome).toBe('env-missing');
  });

  it('reportInferenceBudget reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startInferenceFlow({ platform: 'chromium', userId: 'u', modelName: 'x' });
    const step = await adapter.reportInferenceBudget(s, { requestId: 'r', consumedMs: 20, budgetMs: 33 });
    expect(step.outcome).toBe('env-missing');
  });
});
