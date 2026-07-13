import { describe, expect, it } from 'vitest';
import {
  estimateMultimodalTokens,
  hasImagePart,
  hasAudioPart,
  hasMultimodalParts,
  extractTextFromParts,
} from '../src/multimodal.js';
import type { MessagePart } from '../src/multimodal.js';

describe('multimodal defensive branches', () => {
  it('estimateMultimodalTokens returns 0 when parts is undefined', () => {
    expect(estimateMultimodalTokens(undefined as unknown as MessagePart[])).toBe(0);
  });

  it('estimateMultimodalTokens accumulates image + audio + text costs', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'hello world' },
      { type: 'image', source: { kind: 'url', url: 'https://example.com/img.png' } },
      { type: 'audio', source: { kind: 'url', url: 'https://example.com/a.mp3' } },
    ];
    const total = estimateMultimodalTokens(parts);
    expect(total).toBeGreaterThan(0);
  });

  it('estimateMultimodalTokens accepts explicit image + audio token cost overrides', () => {
    const parts: MessagePart[] = [
      { type: 'image', source: { kind: 'url', url: 'x' } },
      { type: 'audio', source: { kind: 'url', url: 'y' } },
    ];
    const total = estimateMultimodalTokens(parts, {
      imageTokenCost: 100,
      audioTokenCost: 50,
    });
    expect(total).toBeGreaterThan(0);
  });

  it('hasImagePart returns false when parts is undefined', () => {
    expect(hasImagePart(undefined)).toBe(false);
  });

  it('hasImagePart returns true when parts contains an image', () => {
    expect(hasImagePart([{ type: 'image', source: { kind: 'url', url: 'x' } }])).toBe(true);
  });

  it('hasImagePart returns false when parts is empty array', () => {
    expect(hasImagePart([])).toBe(false);
  });

  it('hasAudioPart returns false when parts is undefined', () => {
    expect(hasAudioPart(undefined)).toBe(false);
  });

  it('hasAudioPart returns true when parts contains audio', () => {
    expect(hasAudioPart([{ type: 'audio', source: { kind: 'url', url: 'x' } }])).toBe(true);
  });

  it('hasMultimodalParts returns false when parts is undefined', () => {
    expect(hasMultimodalParts(undefined)).toBe(false);
  });

  it('hasMultimodalParts returns true only when there is a non-text part', () => {
    expect(hasMultimodalParts([{ type: 'text', text: 'hi' }])).toBe(false);
    expect(
      hasMultimodalParts([
        { type: 'text', text: 'hi' },
        { type: 'image', source: { kind: 'url', url: 'x' } },
      ]),
    ).toBe(true);
  });

  it('extractTextFromParts joins text parts only', () => {
    const text = extractTextFromParts([
      { type: 'text', text: 'hello' },
      { type: 'image', source: { kind: 'url', url: 'x' } },
      { type: 'text', text: 'world' },
    ]);
    expect(text).toContain('hello');
    expect(text).toContain('world');
  });
});
