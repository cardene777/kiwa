---
title: "@kiwa-lab/perf-harness reference の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>reference</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/reference.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createReferenceOps</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/reference.ts#L97) <code v-pre>packages/perf-harness/src/reference.ts</code>

基準 op 一式を作る。 temp dir は fs 系の基準が最初に要求された時にだけ掘る。

```ts
export declare function createReferenceOps(): PerfReferenceSet;
```

#### <code v-pre>DEFAULT&#95;REFERENCE&#95;KIND</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/reference.ts#L85) <code v-pre>packages/perf-harness/src/reference.ts</code>

既定の基準の種類。 kiwa の op の大半は in-memory の mock で fs に触れない。

```ts
export declare const DEFAULT_REFERENCE_KIND: PerfReferenceKind;
```

#### <code v-pre>REFERENCE&#95;IMPL&#95;VERSION</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/reference.ts#L53) <code v-pre>packages/perf-harness/src/reference.ts</code>

基準 op の実装の版。 **この file の op の中身 ・ `CPU_ROUNDS` ・ `FS_PAYLOAD` を 変えたら 1 上げる。 同時に `baseline.ts` の `MEASUREMENT_PREMISE` も上げる。** 版を記録しないと、 種類 (`cpu` 等) が同じままで分母の大きさだけが変わる。 例えば `CPU_ROUNDS` を 2 倍にすると、 保存済み baseline との比較で倍率が約 0.5 になり、 全 op が 50% の改善として報告される。 実在する 2 倍の悪化がその中に埋もれる。 版が違う記録とは比較せず、 その実行で入れ替える (`resolveNormalization`)。

```ts
export declare const REFERENCE_IMPL_VERSION = 1;
```

#### <code v-pre>REFERENCE&#95;KINDS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/reference.ts#L88) <code v-pre>packages/perf-harness/src/reference.ts</code>

使える種類の一覧。 `types.ts` の `PerfReferenceKind` と 1:1 で対応させる。

```ts
export declare const REFERENCE_KINDS: readonly PerfReferenceKind[];
```

#### <code v-pre>referenceOpName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/reference.ts#L90) <code v-pre>packages/perf-harness/src/reference.ts</code>

```ts
export declare function referenceOpName(kind: PerfReferenceKind): string;
```

### 型

#### <code v-pre>PerfReferenceOp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/reference.ts#L59) <code v-pre>packages/perf-harness/src/reference.ts</code>

基準 op 1 件。

```ts
export interface PerfReferenceOp {
    kind: PerfReferenceKind;
    /** report と baseline に残る名前。 */
    name: string;
    /** 実装の版。 `REFERENCE_IMPL_VERSION` をそのまま持つ。 */
    implVersion: number;
    fn: () => Promise<void>;
}
```

#### <code v-pre>PerfReferenceSet</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/reference.ts#L71) <code v-pre>packages/perf-harness/src/reference.ts</code>

基準 op の一式。 fs 系は temp dir を要するので、 使い終わりに `dispose` する。

```ts
export interface PerfReferenceSet {
    get(kind: PerfReferenceKind): PerfReferenceOp;
    /**
     * fs 系の基準が使う temp dir。 掘る前と `dispose` 後は null。
     *
     * 掘った場所を外から確かめられないと、 後片付けを検証する側が
     * 「`kiwa-perf-reference-` で始まる dir の数」 を数えるしかない。 それは
     * 並列に走る別の測定が同じ prefix で dir を掘るため成立しない。
     */
    dir(): string | null;
    dispose(): void;
}
```
