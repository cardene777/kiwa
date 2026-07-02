import type { AiLlmMock, ChatCompletion, ChatInput } from './types.js';

/**
 * Real vs mock 差分計測 harness。
 *
 * v1.12-2/-3/-4 dogfood app が real provider (Anthropic / OpenAI / Vercel AI)
 * と kiwa mock の両方に同じ prompt を投げ、 4 metric (cost / latency /
 * token / accuracy) の diff を計測する SSOT。
 *
 * accuracy は「real 出力 vs mock 出力の similarity」 を 0-1 で返す。
 * default は文字列 Jaccard similarity (BLEU / embedding cosine は
 * v1.12-3 で opt-in を検討)、 mock 検証には十分な近似。
 */
export interface FidelityInput {
  /** kiwa mock (any SDK adapter)。 */
  mock: AiLlmMock;
  /**
   * real provider 呼出 wrapper。 dogfood app 側で
   * `async (input) => callRealAnthropic(...)` のように implement する。
   */
  real: (input: ChatInput) => Promise<ChatCompletion>;
  /** 対象 prompt 列。 */
  prompts: ChatInput[];
  /**
   * accuracy 計測 method (default `jaccard`)。 external similarity
   * scorer を injection する余地を残す。
   */
  accuracyMethod?: 'jaccard' | ((real: string, mock: string) => number);
}

/** 1 prompt 単位の diff 記録。 */
export interface FidelityRecord {
  prompt: string;
  real: ChatCompletion;
  mock: ChatCompletion;
  /** real - mock (負数 = mock の方が cheap / 速い / 少token)。 */
  costDiffUsd: number;
  latencyDiffMs: number;
  tokenDiffTotal: number;
  /** real 出力 vs mock 出力の similarity 0-1。 */
  accuracyScore: number;
}

/** fidelity 実測結果全体。 */
export interface FidelityReport {
  records: FidelityRecord[];
  /** 集計値 (平均)。 */
  summary: {
    avgCostDiffUsd: number;
    avgLatencyDiffMs: number;
    avgTokenDiffTotal: number;
    avgAccuracyScore: number;
    prompts: number;
    accuracyMethod: string;
  };
}

/**
 * fidelity 実行 — 全 prompt を real / mock 両方に投げて diff を計測。
 */
export async function runFidelityCheck(input: FidelityInput): Promise<FidelityReport> {
  const records: FidelityRecord[] = [];
  const methodLabel = typeof input.accuracyMethod === 'function' ? 'custom' : (input.accuracyMethod ?? 'jaccard');
  const similarity: (real: string, mock: string) => number =
    typeof input.accuracyMethod === 'function'
      ? input.accuracyMethod
      : jaccardSimilarity;

  for (const chatInput of input.prompts) {
    const [real, mock] = await Promise.all([
      input.real(chatInput),
      input.mock.chatCompletion(chatInput),
    ]);
    const promptKey = extractLastUserPrompt(chatInput);
    records.push({
      prompt: promptKey,
      real,
      mock,
      costDiffUsd: real.costUsd - mock.costUsd,
      latencyDiffMs: real.latencyMs - mock.latencyMs,
      tokenDiffTotal: real.usage.totalTokens - mock.usage.totalTokens,
      accuracyScore: similarity(real.message.content, mock.message.content),
    });
  }

  const n = Math.max(1, records.length);
  const summary = {
    avgCostDiffUsd: records.reduce((s, r) => s + r.costDiffUsd, 0) / n,
    avgLatencyDiffMs: records.reduce((s, r) => s + r.latencyDiffMs, 0) / n,
    avgTokenDiffTotal: records.reduce((s, r) => s + r.tokenDiffTotal, 0) / n,
    avgAccuracyScore: records.reduce((s, r) => s + r.accuracyScore, 0) / n,
    prompts: records.length,
    accuracyMethod: methodLabel,
  };
  return { records, summary };
}

/**
 * Jaccard 単語 similarity — 実 LLM tokenizer なしで文字列近似を計算する
 * 軽量 default。 embedding cosine と厳密には一致しないが、 mock 検証には
 * 十分 (完全一致 = 1.0、 無関係 = 0.0)。
 */
export function jaccardSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  const intersection = new Set([...tokensA].filter((t) => tokensB.has(t)));
  const union = new Set([...tokensA, ...tokensB]);
  return intersection.size / union.size;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function extractLastUserPrompt(input: ChatInput): string {
  for (let i = input.messages.length - 1; i >= 0; i -= 1) {
    const msg = input.messages[i]!;
    if (msg.role === 'user') return msg.content;
  }
  return '';
}
