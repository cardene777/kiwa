---
title: "@kiwa-lab/perf-harness regression の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>regression</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>detectRegression</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts#L14) <code v-pre>packages/perf-harness/src/regression.ts</code>

Bootstrap CI on p95 delta で regression を判定する。 旧実装は mean で Welch t-test を回しつつ deltaPct を p95 で計算していたため、 統計軸が矛盾していた。 (mean で「有意差なし」 と判定しつつ p95 が 20% 悪化 → stable と誤判定される事故) 本実装は p95 の差そのものに対して bootstrap 分布を作り、 (1) 信頼区間が 0 を含まない (= 有意な差) かつ (2) delta が threshold を超えた 場合のみ regressed / improved と判定する。

```ts
export declare function detectRegression(input: RegressionInput): RegressionResult;
```

#### <code v-pre>detectRegressionStrict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts#L64) <code v-pre>packages/perf-harness/src/regression.ts</code>

strict mode — CI 99% + threshold 10%。 false negative を最小化。 見逃し (regressed を stable と判定) が致命的な release gate 経路で使う。

```ts
export declare function detectRegressionStrict(input: RegressionInput): RegressionResult;
```


