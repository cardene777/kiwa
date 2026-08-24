---
title: "@kiwa-lab/observability slowest の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>slowest</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/slowest.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>analyzeSlowest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/slowest.ts#L104) <code v-pre>packages/observability/src/slowest.ts</code>

遅い test と、直前の run との差を出す。 集めている `durationMs` を使うだけで、新しい計測は行わない。

```ts
export declare function analyzeSlowest(opts: AnalyzeSlowestOptions): SlowestAnalysis;
```

### 型

#### <code v-pre>AnalyzeSlowestOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/slowest.ts#L48) <code v-pre>packages/observability/src/slowest.ts</code>

```ts
export interface AnalyzeSlowestOptions {
    /** この run の record。 */
    history: RunHistory;
    /** 上位何件を返すか。 既定 5。 0 以下と非整数は既定に倒す。 */
    limit?: number;
    /**
     * 累積 history。 直前の run を引くために使う。
     *
     * 渡さなければ比較しない (`previousTotalMs` が `null`)。 `history` と同じ物を渡した場合も、
     * この run 以外の run が無ければ比較対象は見つからない。
     */
    cumulative?: RunHistory;
}
```

#### <code v-pre>SlowestAnalysis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/slowest.ts#L17) <code v-pre>packages/observability/src/slowest.ts</code>

```ts
export interface SlowestAnalysis {
    /** 遅い順の上位。 `limit` 件まで。 測れた record が無ければ空。 */
    slowest: SlowestTest[];
    /** この run の合計。 測れなかった record は 0 として足す。 */
    totalMs: number;
    /** `durationMs` が 0 より大きい record 数。 */
    measured: number;
    /**
     * `durationMs` が 0 の record 数。
     *
     * **0 を「速い」 と読ませない**。 duration を出さない reporter 設定では全 record が 0 に
     * なり、上位 N が全部 0 で埋まる。 その状態と「本当に速い」 を区別する材料になる。
     */
    unmeasured: number;
    /**
     * 直前の run の合計。 **比較対象が無ければ `null`**。
     *
     * 0 に倒さない = 「前 run が 0ms だった」 と「前 run が無い」 は別物で、前者なら差は
     * 増加、後者は差そのものが存在しない。 潰すと初回の run が必ず「大幅に遅くなった」 と出る。
     */
    previousTotalMs: number | null;
    /** `totalMs - previousTotalMs`。 比較対象が無ければ `null`。 */
    deltaMs: number | null;
    /**
     * 増減の比 (`deltaMs / previousTotalMs`)。 比較対象が無い時と、前 run の合計が 0 の時は `null`。
     *
     * 前 run が 0 の時に `Infinity` を返さない = 表示する側が必ず特別扱いを要求されるため。
     */
    deltaRatio: number | null;
}
```

#### <code v-pre>SlowestTest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/slowest.ts#L10) <code v-pre>packages/observability/src/slowest.ts</code>

遅い test 1 件。 `durationMs` は **attempt の合計**。 `collect.ts` は retry した test の各 attempt を 畳んで 1 record にするので、3 回 retry した test はその 3 回分を足した値になる。 実時間より大きく出るのは仕様で、遅さの原因が retry である場合も同じ値に現れる。

```ts
export interface SlowestTest {
    testId: string;
    fullName: string;
    durationMs: number;
    runId: string;
}
```
