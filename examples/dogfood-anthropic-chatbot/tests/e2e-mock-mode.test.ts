import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChatbotAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  askWeatherAndMath,
  greetUser,
  replyWithSystemPrompt,
  streamBedtimeStory,
} from '../src/flows/chatbot-flows.js';

let adapter: ChatbotAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-anthropic (mock mode) — chat streaming + system prompt + tool_use', () => {
  it('T-DFA-M-001 greetUser returns a non-empty text reply and non-zero cost', async () => {
    const result = await greetUser(adapter);
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('T-DFA-M-002 streamBedtimeStory produces multiple SSE chunks that concatenate to the full text', async () => {
    const result = await streamBedtimeStory(adapter);
    expect(result.chunks.length).toBeGreaterThan(3);
    expect(result.full).toBe(result.chunks.join(''));
    expect(result.full.length).toBeGreaterThan(0);
  });

  it('T-DFA-M-003 replyWithSystemPrompt applies the system prompt (behaviour reflected in canned reply)', async () => {
    const result = await replyWithSystemPrompt(adapter);
    expect(result.text.toLowerCase()).toMatch(/arr|matey|tide/);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('T-DFA-M-004 askWeatherAndMath triggers a 2-tool loop and finalises with a plain-text answer', async () => {
    const result = await askWeatherAndMath(adapter);
    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolCalls.map((c) => c.name).sort()).toEqual(['calculator', 'get_weather']);
    expect(result.finalText).toContain('84');
    expect(result.finalText.toLowerCase()).toContain('tokyo');
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('T-DFA-M-005 metrics roll up across multiple requests', async () => {
    await greetUser(adapter);
    await streamBedtimeStory(adapter);
    await replyWithSystemPrompt(adapter);
    const m = adapter.metrics();
    expect(m.requests).toBeGreaterThanOrEqual(3);
    expect(m.totalCostUsd).toBeGreaterThan(0);
    expect(m.totalTokens).toBeGreaterThan(0);
  });

  it('T-DFA-M-006 reset clears traces + metrics', async () => {
    await greetUser(adapter);
    expect(adapter.traces()).not.toHaveLength(0);
    expect(adapter.metrics().requests).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().requests).toBe(0);
  });
});
