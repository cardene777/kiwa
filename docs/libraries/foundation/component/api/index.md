---
title: "@kiwa-lab/component index の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/component</code> <code v-pre>index</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>applyReactActionOptimistic</code>

公開 entry point から解決しています。

<code v-pre>applyOptimisticUpdate</code> を <code v-pre>applyReactActionOptimistic</code> として公開しています。

```ts
export {
  applyOptimisticUpdate as applyReactActionOptimistic,
  beginActionTransition,
  initializeReactActions,
  resolveAction,
  type ReactActionsSession,
  type ReactActionsState,
} from './react-19-actions.js';
```


