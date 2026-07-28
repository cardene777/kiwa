---
title: "@kiwa-lab/ai-llm fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>jaccardSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L103) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

Jaccard 単語 similarity — 実 LLM tokenizer なしで文字列近似を計算する 軽量 default。 embedding cosine と厳密には一致しないが、 mock 検証には 十分 (完全一致 = 1.0、 無関係 = 0.0)。

```ts
export declare function jaccardSimilarity(a: string, b: string): number;
```

#### <code v-pre>runFidelityCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L61) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

fidelity 実行 — 全 prompt を real / mock 両方に投げて diff を計測。

```ts
export declare function runFidelityCheck(input: FidelityInput): Promise<FidelityReport>;
```

### 型

#### <code v-pre>FidelityInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L14) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

Real vs mock 差分計測 harness。 v1.12-2/-3/-4 dogfood app が real provider (Anthropic / OpenAI / Vercel AI) と kiwa mock の両方に同じ prompt を投げ、 4 metric (cost / latency / token / accuracy) の diff を計測する SSOT。 accuracy は「real 出力 vs mock 出力の similarity」 を 0-1 で返す。 default は文字列 Jaccard similarity (BLEU / embedding cosine は v1.12-3 で opt-in を検討)、 mock 検証には十分な近似。

```ts
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
```

#### <code v-pre>FidelityRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L32) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

1 prompt 単位の diff 記録。

```ts
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
```

#### <code v-pre>FidelityReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts#L45) <code v-pre>packages/ai-llm/src/fidelity.ts</code>

fidelity 実測結果全体。

```ts
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
```
