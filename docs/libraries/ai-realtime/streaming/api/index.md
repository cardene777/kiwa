---
title: "@kiwa-lab/streaming index の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>index</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>dispatchPipelineEvent</code>

公開 entry point から解決しています。

<code v-pre>dispatchEvent</code> を <code v-pre>dispatchPipelineEvent</code> として公開しています。

```ts
export {
  startPipeline,
  dispatchEvent as dispatchPipelineEvent,
  summarizePipeline,
} from './pipeline-orchestrator.js';
```

### 型

#### <code v-pre>ExactlyOnceIsolationLevel</code>

公開 entry point から解決しています。

<code v-pre>IsolationLevel</code> を <code v-pre>ExactlyOnceIsolationLevel</code> として公開しています。

```ts
export {
  createExactlyOnceSemantics,
  EXACTLY_ONCE_SEMANTICS_SYMBOL,
  isExactlyOnceSemantics,
  type ExactlyOnceConfig,
  type ExactlyOnceSemantics,
  type IsolationLevel as ExactlyOnceIsolationLevel,
  type PendingRecord,
  type TxnState as ExactlyOnceTxnState,
} from './exactly-once.js';
```

#### <code v-pre>ExactlyOnceTxnState</code>

公開 entry point から解決しています。

<code v-pre>TxnState</code> を <code v-pre>ExactlyOnceTxnState</code> として公開しています。

```ts
export {
  createExactlyOnceSemantics,
  EXACTLY_ONCE_SEMANTICS_SYMBOL,
  isExactlyOnceSemantics,
  type ExactlyOnceConfig,
  type ExactlyOnceSemantics,
  type IsolationLevel as ExactlyOnceIsolationLevel,
  type PendingRecord,
  type TxnState as ExactlyOnceTxnState,
} from './exactly-once.js';
```
