---
title: "@kiwa-lab/quality-metrics fidelity-assert の API 契約"
---

# <code v-pre>@kiwa-lab/quality-metrics</code> <code v-pre>fidelity-assert</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>assertFidelity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L54) <code v-pre>packages/quality-metrics/src/fidelity-assert.ts</code>

mock と real を全 case で並走させて結果一致を検証する。 caller は vitest の assertion で `expect(result.divergences).toEqual([])` / `expect(result.ratio).toBe(100)` を書く。 mock or real が throw した case は failed 扱いにする (両方 throw で「両方 fail」 は fidelity 一致とみなさない、 例外の shape が違う可能性があるため)。

```ts
export declare function assertFidelity<Args extends unknown[], Result>(input: FidelityAssertInput<Args, Result>): Promise<FidelityAssertResult>;
```

### 型

#### <code v-pre>FidelityAssertInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L41) <code v-pre>packages/quality-metrics/src/fidelity-assert.ts</code>

```ts
export interface FidelityAssertInput<Args extends unknown[] = unknown[], Result = unknown> {
    mockFn: (...args: Args) => Promise<Result> | Result;
    realFn: (...args: Args) => Promise<Result> | Result;
    cases: FidelityCase<Args, Result>[];
}
```

#### <code v-pre>FidelityAssertResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L33) <code v-pre>packages/quality-metrics/src/fidelity-assert.ts</code>

```ts
export interface FidelityAssertResult {
    passed: number;
    failed: number;
    /** passed / (passed + failed) * 100。 0-case でも NaN 回避で 100 を返す。 */
    ratio: number;
    divergences: FidelityDivergence[];
}
```

#### <code v-pre>FidelityCase</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L16) <code v-pre>packages/quality-metrics/src/fidelity-assert.ts</code>

1 fidelity case = 1 引数 tuple + 期待される mock ↔ real 一致挙動。

```ts
export interface FidelityCase<Args extends unknown[] = unknown[], Result = unknown> {
    name: string;
    args: Args;
    /**
     * 独自比較関数。 default = deepStrictEqual。 order-insensitive な set 比較や、
     * 特定 field を無視したい (例 timestamp / uuid) 場合は本 field で override する。
     */
    compare?: (mock: Result, real: Result) => boolean;
}
```

#### <code v-pre>FidelityDivergence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/fidelity-assert.ts#L26) <code v-pre>packages/quality-metrics/src/fidelity-assert.ts</code>

```ts
export interface FidelityDivergence {
    case: string;
    mock: unknown;
    real: unknown;
    reason: string;
}
```
