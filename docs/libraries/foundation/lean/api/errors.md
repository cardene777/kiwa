---
title: "@kiwa-lab/lean errors の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>errors</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/errors.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>LeanError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/errors.ts#L11) <code v-pre>packages/lean/src/errors.ts</code>

Base class, so `catch (e) { if (e instanceof LeanError) ... }` works.

```ts
export declare class LeanError extends Error {
    constructor(message: string);
}
```

#### <code v-pre>SpecError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/errors.ts#L26) <code v-pre>packages/lean/src/errors.ts</code>

The spec cannot be turned into a machine: a name that is not usable, a cell nobody declared, a state nothing reaches, a table that contradicts what the author said about it.

```ts
export declare class SpecError extends LeanError {
}
```

#### <code v-pre>UsageError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/errors.ts#L32) <code v-pre>packages/lean/src/errors.ts</code>

The call itself is wrong, whatever the spec says: no specs to verify, two specs that would land on one path.

```ts
export declare class UsageError extends LeanError {
}
```


