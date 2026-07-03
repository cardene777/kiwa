import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { VisionChatAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  chatWithUploadedImage,
  compareTwoImages,
  ocrImageWithHighDetail,
  streamVisionDescription,
} from '../src/flows/chat-flows.js';

let adapter: VisionChatAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-multimodal (mock mode) — vision upload + streaming + cost tracking + multi-image', () => {
  it('T-DFM-M-001 chatWithUploadedImage returns a non-empty description and non-zero cost with an image-token estimate', async () => {
    const result = await chatWithUploadedImage(adapter);
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.costUsd).toBeGreaterThan(0);
    // default detail = auto → 1500 * 0.8 = 1200
    expect(result.imageTokenEstimate).toBe(1200);
  });

  it('T-DFM-M-002 streamVisionDescription produces multiple SSE chunks that concatenate to the full text', async () => {
    const result = await streamVisionDescription(adapter);
    expect(result.chunks.length).toBeGreaterThan(3);
    expect(result.full).toBe(result.chunks.join(''));
    expect(result.full.length).toBeGreaterThan(0);
    expect(result.imageTokenEstimate).toBeGreaterThan(0);
  });

  it('T-DFM-M-003 ocrImageWithHighDetail bumps the image token estimate to full-detail 1500 and reports usage', async () => {
    const result = await ocrImageWithHighDetail(adapter);
    // detail=high → 1500 * 1 = 1500
    expect(result.imageTokenEstimate).toBe(1500);
    expect(result.usage.totalTokens).toBeGreaterThan(0);
    expect(result.text.toLowerCase()).toContain('hello world');
  });

  it('T-DFM-M-004 compareTwoImages doubles the image token estimate for a 2-image request', async () => {
    const result = await compareTwoImages(adapter);
    // 2 images × 1500 × 0.8 = 2400
    expect(result.imageTokenEstimate).toBe(2400);
    expect(result.text.toLowerCase()).toContain('cat');
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('T-DFM-M-005 metrics roll up across multiple requests and include totalImageTokens', async () => {
    await chatWithUploadedImage(adapter);
    await streamVisionDescription(adapter);
    await ocrImageWithHighDetail(adapter);
    const m = adapter.metrics();
    expect(m.requests).toBeGreaterThanOrEqual(3);
    expect(m.totalCostUsd).toBeGreaterThan(0);
    expect(m.totalTokens).toBeGreaterThan(0);
    // 3 requests: 2 auto (1200 each) + 1 high (1500) = 3900
    expect(m.totalImageTokens).toBe(3900);
  });

  it('T-DFM-M-006 reset clears traces + metrics (including totalImageTokens)', async () => {
    await chatWithUploadedImage(adapter);
    expect(adapter.traces()).not.toHaveLength(0);
    expect(adapter.metrics().requests).toBeGreaterThan(0);
    expect(adapter.metrics().totalImageTokens).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().requests).toBe(0);
    expect(adapter.metrics().totalImageTokens).toBe(0);
  });

  it('T-DFM-M-007 traces record image kind (base64 vs url) and detail level per call', async () => {
    await chatWithUploadedImage(adapter); // base64 default auto
    await streamVisionDescription(adapter); // url default auto
    await ocrImageWithHighDetail(adapter); // base64 high
    const traces = adapter.traces();
    expect(traces).toHaveLength(3);
    expect(traces[0]?.detail?.['imageKind']).toBe('base64');
    expect(traces[0]?.detail?.['detail']).toBe('auto');
    expect(traces[1]?.detail?.['imageKind']).toBe('url');
    expect(traces[2]?.detail?.['detail']).toBe('high');
  });
});
