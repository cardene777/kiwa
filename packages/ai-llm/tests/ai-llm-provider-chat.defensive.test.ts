import { describe, expect, it } from 'vitest';
import { createOpenAIMock } from '../src/openai.js';
import { createLangchainMock } from '../src/langchain.js';
import { createVercelAiMock } from '../src/vercel-ai.js';
import { createAnthropicMock } from '../src/anthropic.js';

const INPUT = {
  messages: [{ role: 'user' as const, content: 'hello' }],
};

describe('openai mock chatCompletion + chatStream + reset', () => {
  it('chatCompletion returns a completion', async () => {
    const mock = createOpenAIMock();
    const result = await mock.chatCompletion(INPUT);
    expect(result).toBeDefined();
    expect(typeof result !== null && result !== undefined).toBe(true);
  });

  it('chatStream returns an async iterable', async () => {
    const mock = createOpenAIMock();
    const stream = mock.chatStream(INPUT);
    const chunks: unknown[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('reset resets metrics + engine state', async () => {
    const mock = createOpenAIMock();
    await mock.chatCompletion(INPUT);
    mock.reset();
    const metrics = mock.getMetrics();
    expect(metrics.requests).toBe(0);
  });
});

describe('langchain mock chatCompletion + chatStream + reset', () => {
  it('chatCompletion returns a completion', async () => {
    const mock = createLangchainMock();
    const result = await mock.chatCompletion(INPUT);
    expect(result).toBeDefined();
  });

  it('chatStream returns an async iterable', async () => {
    const mock = createLangchainMock();
    const stream = mock.chatStream(INPUT);
    const chunks: unknown[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('getMetrics returns totals after chatCompletion', async () => {
    const mock = createLangchainMock();
    await mock.chatCompletion(INPUT);
    const metrics = mock.getMetrics();
    expect(metrics.requests).toBeGreaterThan(0);
  });

  it('reset zeroes metrics', async () => {
    const mock = createLangchainMock();
    await mock.chatCompletion(INPUT);
    mock.reset();
    expect(mock.getMetrics().requests).toBe(0);
  });
});

describe('vercel-ai mock chatCompletion + chatStream', () => {
  it('chatCompletion returns a completion', async () => {
    const mock = createVercelAiMock();
    const result = await mock.chatCompletion(INPUT);
    expect(result).toBeDefined();
  });

  it('chatStream returns an async iterable', async () => {
    const mock = createVercelAiMock();
    const stream = mock.chatStream(INPUT);
    const chunks: unknown[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe('anthropic mock chatStream', () => {
  it('chatStream returns an async iterable', async () => {
    const mock = createAnthropicMock();
    const stream = mock.chatStream(INPUT);
    const chunks: unknown[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });
});
