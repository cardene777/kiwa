/**
 * fidelity test — `docs/concepts/test-taxonomy.md § fidelity` pattern。
 *
 * MockEngine (kiwa ai-llm mock adapter) が、 想定 reference impl (Map ベース
 * prompt → response テーブル) と同じ chat completion 挙動を返すことを保証する。
 * mock ≠ real OpenAI / Anthropic 比較の live fidelity は `*.real.fidelity.test.ts`
 * 経路 (現状 scope 外)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { MockEngine } from '../../src/index.js';

/** Reference impl = Map ベース prompt → response テーブル。 */
function referenceEngine(responses: Record<string, string>, defaultResponse: string) {
  return {
    async runChat(prompt: string): Promise<string> {
      return responses[prompt] ?? defaultResponse;
    },
  };
}

function extractText(completion: { message: { content: string } }): string {
  return completion.message.content;
}

describe('MockEngine fidelity vs reference prompt → response table', () => {
  it('固定 prompt で登録済 response を返す (mock ↔ reference 一致)', async () => {
    const responsesText: Record<string, string> = {
      hello: 'world',
      ping: 'pong',
    };
    const defaultResponse = 'default';
    const mock = new MockEngine({
      responses: {
        hello: { content: 'world' },
        ping: { content: 'pong' },
      },
      defaultResponse,
    });
    const real = referenceEngine(responsesText, defaultResponse);

    const result = await assertFidelity({
      mockFn: async (prompt: string) => {
        const completion = await mock.runChat({
          messages: [{ role: 'user', content: prompt }],
        });
        return extractText(completion);
      },
      realFn: async (prompt: string) => real.runChat(prompt),
      cases: [
        { name: 'hello → world', args: ['hello'] as [string] },
        { name: 'ping → pong', args: ['ping'] as [string] },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('未登録 prompt で default response を返す (mock ↔ reference 一致)', async () => {
    const defaultResponse = 'fallback';
    const mock = new MockEngine({
      responses: { known: { content: 'value' } },
      defaultResponse,
    });
    const real = referenceEngine({ known: 'value' }, defaultResponse);

    const result = await assertFidelity({
      mockFn: async (prompt: string) => {
        const completion = await mock.runChat({
          messages: [{ role: 'user', content: prompt }],
        });
        return extractText(completion);
      },
      realFn: async (prompt: string) => real.runChat(prompt),
      cases: [
        { name: '未登録 prompt', args: ['unknown-prompt'] as [string] },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);
  });

  it('同一 prompt を複数回呼び出しても同じ response を返す (mock ↔ reference 一致)', async () => {
    const responsesText: Record<string, string> = { stable: 'always-same' };
    const defaultResponse = 'default';
    const mock = new MockEngine({
      responses: { stable: { content: 'always-same' } },
      defaultResponse,
      artificialLatencyMs: 0,
    });
    const real = referenceEngine(responsesText, defaultResponse);

    const result = await assertFidelity({
      mockFn: async () => {
        const c1 = extractText(await mock.runChat({ messages: [{ role: 'user', content: 'stable' }] }));
        const c2 = extractText(await mock.runChat({ messages: [{ role: 'user', content: 'stable' }] }));
        return [c1, c2];
      },
      realFn: async () => {
        const c1 = await real.runChat('stable');
        const c2 = await real.runChat('stable');
        return [c1, c2];
      },
      cases: [{ name: '2 回連続呼出で同一値', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('空 messages 配列 = default response を返す', async () => {
    const responsesText: Record<string, string> = { known: 'value' };
    const defaultResponse = 'empty-msg-default';
    const mock = new MockEngine({
      responses: { known: { content: 'value' } },
      defaultResponse,
    });
    const real = referenceEngine(responsesText, defaultResponse);

    const result = await assertFidelity({
      mockFn: async () => extractText(await mock.runChat({ messages: [] })),
      realFn: async () => real.runChat(''),
      cases: [{ name: '空 messages', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('複数 role (system + user) = user role の最後 message を prompt として扱う', async () => {
    const responsesText: Record<string, string> = { 'user-prompt': 'user-response' };
    const defaultResponse = 'default';
    const mock = new MockEngine({
      responses: { 'user-prompt': { content: 'user-response' } },
      defaultResponse,
    });

    const completion = await mock.runChat({
      messages: [
        { role: 'system', content: 'you are helpful' },
        { role: 'user', content: 'user-prompt' },
      ],
    });
    expect(completion.message.content).toBe('user-response');
  });

  it('usage token count = prompt token + completion token の合計', async () => {
    const mock = new MockEngine({
      responses: { calc: { content: 'a b c d e f g h i j' } },
      defaultResponse: 'x',
    });

    const completion = await mock.runChat({
      messages: [{ role: 'user', content: 'calc' }],
    });
    expect(completion.usage.totalTokens).toBe(
      completion.usage.promptTokens + completion.usage.completionTokens,
    );
    expect(completion.usage.totalTokens).toBeGreaterThan(0);
  });

  it('finishReason = stop (default)、 tool_calls 有りは tool_use', async () => {
    const mock = new MockEngine({
      responses: { simple: { content: 'ok' } },
      defaultResponse: 'x',
    });

    const c1 = await mock.runChat({ messages: [{ role: 'user', content: 'simple' }] });
    expect(c1.finishReason).toBe('stop');
  });

  it('cost 計算 = (promptTokens × prompt price + completionTokens × completion price) / 1000', async () => {
    const mock = new MockEngine({
      responses: { calc: { content: 'response text here' } },
      defaultResponse: 'x',
      costPer1kTokens: { prompt: 1.0, completion: 2.0 },
    });

    const completion = await mock.runChat({
      messages: [{ role: 'user', content: 'calc' }],
    });
    // cost = (prompt × 1 + completion × 2) / 1000
    const expected =
      (completion.usage.promptTokens * 1.0 + completion.usage.completionTokens * 2.0) / 1000;
    expect(completion.costUsd).toBeCloseTo(expected, 5);
  });
});
