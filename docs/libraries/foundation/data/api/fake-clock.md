---
title: "@kiwa-lab/data fake-clock の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/data</code> <code v-pre>fake-clock</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createFakeClock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts#L8) <code v-pre>packages/data/src/fake-clock.ts</code>

```ts
export declare function createFakeClock(opts?: FakeClockOptions): FakeClock;
```

### 型

#### <code v-pre>FakeClockOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts#L3) <code v-pre>packages/data/src/fake-clock.ts</code>

```ts
export interface FakeClockOptions {
    /** initial wall-clock time in ms (default 0 for deterministic tests) */
    startMs?: number;
}
```
