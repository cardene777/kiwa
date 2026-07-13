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
});
