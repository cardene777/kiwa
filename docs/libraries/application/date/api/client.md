---
title: "@kiwa-lab/date client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/date</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createDateClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L25) <code v-pre>packages/date/src/client.ts</code>

4 provider (date-fns / dayjs / Luxon / Temporal) を統一 interface で叩ける mock client。 実 provider (real deps) を差替えても同じ signature で呼べる想定。

```ts
export declare function createDateClient(options?: CreateDateClientOptions): DateClient;
```

### 型

#### <code v-pre>CreateDateClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L7) <code v-pre>packages/date/src/client.ts</code>

```ts
export interface CreateDateClientOptions {
    provider?: DateProvider;
    defaultTimezone?: string;
}
```

#### <code v-pre>DateClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L12) <code v-pre>packages/date/src/client.ts</code>

```ts
export interface DateClient {
    provider: DateProvider;
    addDays: (date: Date, days: number) => Date;
    diffDays: (a: Date, b: Date) => number;
    format: (date: Date, pattern: string) => string;
    parse: (str: string, pattern: string) => Date;
    toTimezone: (date: Date, tz: string) => Date;
}
```

#### <code v-pre>DateProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L5) <code v-pre>packages/date/src/client.ts</code>

```ts
export type DateProvider = 'date-fns' | 'dayjs' | 'luxon' | 'temporal';
```
