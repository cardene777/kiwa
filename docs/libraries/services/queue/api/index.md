---
title: "@kiwa-lab/queue index の API 契約"
---

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>index</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>dispatchJobEvent</code>

公開 entry point から解決しています。

<code v-pre>dispatchEvent</code> を <code v-pre>dispatchJobEvent</code> として公開しています。

```ts
export {
  startJob,
  dispatchEvent as dispatchJobEvent,
  summarizeJob,
} from './job-lifecycle-orchestrator.js';
```


