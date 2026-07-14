import { describe, expect, it } from 'vitest';
import { MockEngine } from '../../src/index.js';

/**
 * ai-llm integration domain test — real MockEngine で runChat / runStream /
 * getMetrics / reset workflow を end-to-end で assert する。
 */
describe('ai-llm integration — MockEngine workflow', () => {
  it('T-INT-D-001 runChat で ChatCompletion 返却', async () => {
    const engine = new MockEngine({ defaultResponse: 'hi' });
    const result = await engine.runChat({ messages: [{ role: 'user', content: 'hello' }] });
    expect(result.message.role).toBe('assistant');
    expect(result.message.content).toBe('hi');
    expect(result.usage.promptTokens).toBeGreaterThan(0);
  });

  it('T-INT-D-002 runStream で chunk 列 stream', async () => {
    const engine = new MockEngine({ defaultResponse: 'streaming response' });
    const chunks: string[] = [];
    for await (const event of engine.runStream({ messages: [{ role: 'user', content: 'hi' }] })) {
      if (!event.done) chunks.push(event.delta);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('')).toBe('streaming response');
  });

  it('T-INT-D-003 getMetrics で 累積 cost / tokens 集計', async () => {
    const engine = new MockEngine({ defaultResponse: 'test' });
    await engine.runChat({ messages: [{ role: 'user', content: 'q1' }] });
    await engine.runChat({ messages: [{ role: 'user', content: 'q2' }] });
    const metrics = engine.getMetrics();
    expect(metrics.totalCostUsd).toBeGreaterThan(0);
    expect(metrics.totalTokens.promptTokens).toBeGreaterThan(0);
  });

  it('T-INT-D-004 reset で metrics 初期化', async () => {
    const engine = new MockEngine({ defaultResponse: 'test' });
    await engine.runChat({ messages: [{ role: 'user', content: 'q' }] });
    engine.reset();
    const metrics = engine.getMetrics();
    expect(metrics.totalCostUsd).toBe(0);
  });

  it('T-INT-D-005 responses map で prompt 別 response', async () => {
    const engine = new MockEngine({
      defaultResponse: 'default',
      responses: {
        'hello': { content: 'hi there' },
      },
    });
    const r1 = await engine.runChat({ messages: [{ role: 'user', content: 'hello' }] });
    const r2 = await engine.runChat({ messages: [{ role: 'user', content: 'other' }] });
    expect(r1.message.content).toBe('hi there');
    expect(r2.message.content).toBe('default');
  });
});
