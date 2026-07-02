import { describe, expect, it } from 'vitest';
import { MockEngine } from '../src/index.js';

describe('MockEngine — runChat', () => {
  it('T-AI-ENG-001 returns default response when prompt does not match', async () => {
    const eng = new MockEngine({ defaultResponse: 'default!' });
    const c = await eng.runChat({ messages: [{ role: 'user', content: 'unmatched' }] });
    expect(c.message.content).toBe('default!');
    expect(c.finishReason).toBe('stop');
  });

  it('T-AI-ENG-002 returns configured response for matched prompt', async () => {
    const eng = new MockEngine({
      responses: {
        'known': { content: 'ka-boom', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 } },
      },
    });
    const c = await eng.runChat({ messages: [{ role: 'user', content: 'known' }] });
    expect(c.message.content).toBe('ka-boom');
    expect(c.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
  });

  it('T-AI-ENG-003 cost = (prompt/1k * promptRate) + (completion/1k * completionRate)', async () => {
    const eng = new MockEngine({
      costPer1kTokens: { prompt: 0.001, completion: 0.002 },
      responses: {
        'q': { content: 'a', usage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 } },
      },
    });
    const c = await eng.runChat({ messages: [{ role: 'user', content: 'q' }] });
    // 1000/1000 * 0.001 + 500/1000 * 0.002 = 0.001 + 0.001 = 0.002
    expect(c.costUsd).toBeCloseTo(0.002);
  });

  it('T-AI-ENG-004 assigns tool_use finishReason when toolCalls are present', async () => {
    const eng = new MockEngine({
      responses: {
        'call': { content: '', toolCalls: [{ id: 't1', name: 'run', arguments: '{}' }] },
      },
    });
    const c = await eng.runChat({ messages: [{ role: 'user', content: 'call' }] });
    expect(c.finishReason).toBe('tool_use');
    expect(c.message.toolCalls?.[0]?.name).toBe('run');
  });

  it('T-AI-ENG-005 assigns latencyMs >= artificial delay', async () => {
    const eng = new MockEngine({ artificialLatencyMs: 20 });
    const c = await eng.runChat({ messages: [{ role: 'user', content: 'x' }] });
    expect(c.latencyMs).toBeGreaterThanOrEqual(20);
  });
});

describe('MockEngine — runStream', () => {
  it('T-AI-ENG-006 splits content into 8-char chunks when not overridden', async () => {
    const eng = new MockEngine({
      responses: { 'q': { content: 'abcdefghijkl' } },
    });
    const chunks: string[] = [];
    for await (const ev of eng.runStream({ messages: [{ role: 'user', content: 'q' }] })) {
      if (!ev.done) chunks.push(ev.delta);
    }
    expect(chunks.length).toBe(2);
    expect(chunks.join('')).toBe('abcdefghijkl');
  });

  it('T-AI-ENG-007 emits terminal done event with usage + cost', async () => {
    const eng = new MockEngine({
      responses: { 'q': { content: 'ok' } },
    });
    let done = false;
    for await (const ev of eng.runStream({ messages: [{ role: 'user', content: 'q' }] })) {
      if (ev.done) {
        done = true;
        expect(ev.usage?.totalTokens).toBeGreaterThan(0);
        expect(ev.costUsd).toBeGreaterThan(0);
      }
    }
    expect(done).toBe(true);
  });

  it('T-AI-ENG-008 uses explicit chunks when responses declare them', async () => {
    const eng = new MockEngine({
      responses: { 'stream': { content: 'ignore', chunks: ['chunk-1', 'chunk-2', 'chunk-3'] } },
    });
    const chunks: string[] = [];
    for await (const ev of eng.runStream({ messages: [{ role: 'user', content: 'stream' }] })) {
      if (!ev.done) chunks.push(ev.delta);
    }
    expect(chunks).toEqual(['chunk-1', 'chunk-2', 'chunk-3']);
  });
});

describe('MockEngine — cumulative metrics', () => {
  it('T-AI-ENG-009 records each request into totalCostUsd / totalTokens / requests', async () => {
    const eng = new MockEngine({
      responses: { 'q': { content: 'a', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 } } },
    });
    await eng.runChat({ messages: [{ role: 'user', content: 'q' }] });
    await eng.runChat({ messages: [{ role: 'user', content: 'q' }] });
    const m = eng.getMetrics();
    expect(m.requests).toBe(2);
    expect(m.totalTokens.promptTokens).toBe(20);
    expect(m.totalTokens.completionTokens).toBe(10);
    expect(m.totalTokens.totalTokens).toBe(30);
    expect(m.totalCostUsd).toBeGreaterThan(0);
  });

  it('T-AI-ENG-010 reset zeroes cumulative state', async () => {
    const eng = new MockEngine({ responses: { 'q': { content: 'a' } } });
    await eng.runChat({ messages: [{ role: 'user', content: 'q' }] });
    eng.reset();
    const m = eng.getMetrics();
    expect(m.requests).toBe(0);
    expect(m.totalCostUsd).toBe(0);
    expect(m.totalTokens.totalTokens).toBe(0);
    expect(m.latencySamplesMs).toEqual([]);
  });
});
