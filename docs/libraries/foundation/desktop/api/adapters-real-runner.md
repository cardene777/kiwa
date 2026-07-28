---
title: "@kiwa-lab/desktop adapters-real-runner の API 契約"
---

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>adapters-real-runner</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/real-runner.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>REAL&#95;AXIS&#95;RUNNERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/real-runner.ts#L254) <code v-pre>packages/desktop/src/adapters/real-runner.ts</code>

```ts
export declare const REAL_AXIS_RUNNERS: Record<DesktopAxis, (inv: AdapterInvocation) => Promise<AdapterResult>>;
```


