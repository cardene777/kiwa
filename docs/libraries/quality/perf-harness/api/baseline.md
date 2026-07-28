---
title: "@kiwa-lab/perf-harness baseline の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>baseline</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L76) <code v-pre>packages/perf-harness/src/baseline.ts</code>

現行環境の env metadata を取得する。 git 未 install / 非 repo 環境では gitSha は "unknown"。

```ts
export declare function captureEnv(): BaselineEnv;
```

#### <code v-pre>defaultBaselinePath</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L71) <code v-pre>packages/perf-harness/src/baseline.ts</code>

```ts
export declare function defaultBaselinePath(moduleName: string): string;
```

#### <code v-pre>isComparableEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L96) <code v-pre>packages/perf-harness/src/baseline.ts</code>

baseline を比較対象として使えるかを判定する。 `gitSha` や `hostname` の違いは測定値の意味を変えないが、GC を呼べるかどうかは memory 測定の前提そのものを変える。前提が違う baseline と比べると、実装が 変わっていなくても回帰と判定されてしまう。

```ts
export declare function isComparableEnv(baseline: BaselineEnv, current: BaselineEnv): boolean;
```

#### <code v-pre>loadBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L17) <code v-pre>packages/perf-harness/src/baseline.ts</code>

Baseline を load して現行環境と envelope の env を比較、 mismatch field を検出する。 legacy schema (単一 MeasureResult) は自動 upgrade して読む。

```ts
export declare function loadBaseline(path: string): Promise<BaselineLoadResult | null>;
```

#### <code v-pre>saveBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L39) <code v-pre>packages/perf-harness/src/baseline.ts</code>

単一結果 baseline を保存する compat 経路。 内部で envelope に wrap して保存する。 `moduleName` は複数 op を 1 baseline に集約する時 (three-layer) に使う default key。

```ts
export declare function saveBaseline(path: string, result: MeasureResult, opts?: {
    key?: string;
}): Promise<void>;
```

#### <code v-pre>saveBaselineEnvelope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L53) <code v-pre>packages/perf-harness/src/baseline.ts</code>

Envelope を直接保存する経路。 three-layer 等で複数 op を集約する場合に使う。

```ts
export declare function saveBaselineEnvelope(path: string, envelope: BaselineEnvelope): Promise<void>;
```


