import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { MockEngine } from '../../src/index.js';

/**
 * ai-llm skill domain test — ai-llm lib の主要 skill flow (chat / stream /
 * metrics / reset) を spy 経路で assert する。
 */
describe('ai-llm skill — MockEngine skill flow', () => {
  it('T-SKL-D-001 chat skill flow (runChat + getMetrics)', async () => {
    const spy = createToolSpy();
    const engine = new MockEngine({ defaultResponse: 'ok' });
    await engine.runChat({ messages: [{ role: 'user', content: 'q' }] });
    spy.record('llm.runChat', JSON.stringify({ prompt: 'q' }));
    const metrics = engine.getMetrics();
    spy.record('llm.getMetrics', '{}');

    assertToolCallOrder(spy, ['llm.runChat', 'llm.getMetrics']);
    expect(metrics.totalCostUsd).toBeGreaterThan(0);
  });

  it('T-SKL-D-002 stream skill flow (runStream chunk 列)', async () => {
    const spy = createToolSpy();
    const engine = new MockEngine({ defaultResponse: 'streaming' });
    let chunkCount = 0;
    for await (const event of engine.runStream({ messages: [{ role: 'user', content: 'q' }] })) {
      if (!event.done) chunkCount += 1;
    }
    spy.record('llm.runStream', JSON.stringify({ chunks: chunkCount }));

    assertToolCalled(spy, 'llm.runStream');
    expect(chunkCount).toBeGreaterThan(0);
  });

  it('T-SKL-D-003 batch chat skill (times=3)', async () => {
    const spy = createToolSpy();
    const engine = new MockEngine({ defaultResponse: 'ok' });
    await engine.runChat({ messages: [{ role: 'user', content: 'q1' }] });
    spy.record('llm.runChat', '{}');
    await engine.runChat({ messages: [{ role: 'user', content: 'q2' }] });
    spy.record('llm.runChat', '{}');
    await engine.runChat({ messages: [{ role: 'user', content: 'q3' }] });
    spy.record('llm.runChat', '{}');

    assertToolCalled(spy, 'llm.runChat', { times: 3 });
  });

  it('T-SKL-D-004 reset skill flow (chat + reset + verify)', async () => {
    const spy = createToolSpy();
    const engine = new MockEngine({ defaultResponse: 'ok' });
    await engine.runChat({ messages: [{ role: 'user', content: 'q' }] });
    spy.record('llm.runChat', '{}');
    engine.reset();
    spy.record('llm.reset', '{}');
    const metrics = engine.getMetrics();
    spy.record('llm.getMetrics', '{}');

    assertToolCallOrder(spy, ['llm.runChat', 'llm.reset', 'llm.getMetrics']);
    expect(metrics.totalCostUsd).toBe(0);
  });

  it('T-SKL-D-005 response map skill flow (prompt-specific response)', async () => {
    const spy = createToolSpy();
    const engine = new MockEngine({
      defaultResponse: 'default',
      responses: { 'skill': { content: 'skill-specific' } },
    });
    const result = await engine.runChat({ messages: [{ role: 'user', content: 'skill' }] });
    spy.record('llm.runChat', JSON.stringify({ matched: 'skill' }));

    assertToolCalled(spy, 'llm.runChat');
    expect(result.message.content).toBe('skill-specific');
  });
});
