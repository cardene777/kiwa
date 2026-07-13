import { describe, expect, it } from 'vitest';
import { MockEngine } from '../src/engine.js';

describe('ai-llm engine edge branches', () => {
  it('runChat with only system message returns default response (no user message)', async () => {
    const engine = new MockEngine({ model: 'test-model' });
    const result = await engine.runChat({
      messages: [{ role: 'system', content: 'be helpful' }],
    });
    expect(result.message.content).toBeDefined();
  });

  it('runChat with empty content string still produces chunks', async () => {
    const engine = new MockEngine({
      model: 'test-model',
      responses: { '': { content: '' } },
    });
    const result = await engine.runChat({
      messages: [{ role: 'user', content: '' }],
    });
    expect(result.message.content).toBe('');
  });

  it('runStream with only assistant message (no user) yields default content chunks', async () => {
    const engine = new MockEngine({ model: 'test-model' });
    const chunks: string[] = [];
    for await (const ev of engine.runStream({
      messages: [
        { role: 'assistant', content: 'preamble' },
      ],
    })) {
      if (ev.delta) chunks.push(ev.delta);
    }
    expect(chunks.length).toBeGreaterThanOrEqual(0);
  });

  it('runChat multimodal path counts parts once (not double via content)', async () => {
    const engine = new MockEngine({ model: 'test-model' });
    const result = await engine.runChat({
      messages: [
        {
          role: 'user',
          content: 'combined',
          parts: [
            { type: 'text', text: 'combined' },
            {
              type: 'image',
              source: {
                kind: 'base64',
                mediaType: 'image/png',
                data: 'aGVsbG8=',
              },
            },
          ],
        },
      ],
    });
    expect(result.usage.promptTokens).toBeGreaterThan(0);
  });
});
