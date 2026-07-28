---
title: "@kiwa-lab/date arithmetic の API 契約"
---

# <code v-pre>@kiwa-lab/date</code> <code v-pre>arithmetic</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>addDays</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L15) <code v-pre>packages/date/src/arithmetic.ts</code>

`addDays(date, N, provider)` は date から N 日進めた Date を返す。 全 provider で同一挙動 (UTC ベース、 DST 影響回避のため timestamp 演算)。

```ts
export declare function addDays(date: Date, days: number, provider: DateProvider): ArithmeticResult;
```

#### <code v-pre>diffDays</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L23) <code v-pre>packages/date/src/arithmetic.ts</code>

`diffDays(a, b, provider)` は (a - b) の日数差を整数で返す。 fractional は切捨て。

```ts
export declare function diffDays(a: Date, b: Date, provider: DateProvider): ArithmeticResult;
```

### 型

#### <code v-pre>ArithmeticResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L3) <code v-pre>packages/date/src/arithmetic.ts</code>

```ts
export interface ArithmeticResult {
    result: Date;
    days: number;
    provider: DateProvider;
}
```
